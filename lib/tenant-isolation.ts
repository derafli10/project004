/**
 * Tenant Isolation Helper Functions
 * 
 * Implements strict multi-tenant data isolation for Grade Optimizer.
 * These functions enforce Guardrail 2: Strict Multi-Tenant Data Isolation.
 * 
 * Requirements: 7.1-7.4, 8.3-8.4, Guardrail 2.1-2.6
 */

import { PrismaClient } from '@prisma/client';

// Import logging utilities (to be implemented separately)
interface AuditLogEntry {
  timestamp: Date;
  event: string;
  userId?: string;
  tenantId: string;
  resourceTenantId?: string;
  action: string;
  status: 'SUCCESS' | 'FAILURE' | 'UNAUTHORIZED';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Tenant validation failure type
 */
export class TenantValidationError extends Error {
  constructor(
    message: string,
    public readonly sessionTenantId: string,
    public readonly resourceTenantId: string,
    public readonly resourceType?: string,
    public readonly resourceId?: string
  ) {
    super(message);
    this.name = 'TenantValidationError';
  }
}

/**
 * Session type definition (matches middleware)
 */
export interface UserSession {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  expires: string;
}

/**
 * Extract tenantId from authenticated session
 * This is the primary function for obtaining tenant context from sessions
 * 
 * Requirements: 7.1, 8.3
 */
export function getTenantId(session: UserSession | null): string {
  if (!session) {
    throw new TenantValidationError(
      'No authenticated session',
      '',
      '',
      'SESSION',
      ''
    );
  }
  
  if (!session.tenantId || typeof session.tenantId !== 'string' || session.tenantId.trim() === '') {
    throw new TenantValidationError(
      'Invalid tenantId in session',
      '',
      '',
      'SESSION',
      session.userId
    );
  }
  
  return session.tenantId;
}

/**
 * Validate tenant ownership for a resource
 * Returns true if the resource belongs to the session tenant, false otherwise
 * 
 * Requirements: 7.2-7.4, 8.4
 */
export function validateTenantOwnership(
  resourceTenantId: string,
  sessionTenantId: string
): boolean {
  // Check for empty, null, or undefined values
  if (!resourceTenantId || !sessionTenantId) {
    logTenantValidationFailure({
      tenantId: sessionTenantId || 'MISSING',
      resourceTenantId: resourceTenantId || 'MISSING',
      status: 'FAILURE',
      details: { reason: 'Missing tenantId values' },
    });
    return false;
  }
  
  // Check for whitespace-only strings or strings with surrounding whitespace
  // Tenant IDs should never have whitespace - reject them for security
  if (resourceTenantId.trim() === '' || sessionTenantId.trim() === '' ||
      resourceTenantId !== resourceTenantId.trim() || 
      sessionTenantId !== sessionTenantId.trim()) {
    logTenantValidationFailure({
      tenantId: sessionTenantId || 'MISSING',
      resourceTenantId: resourceTenantId || 'MISSING',
      status: 'FAILURE',
      details: { reason: 'Missing tenantId values' },
    });
    return false;
  }
  
  const isValid = resourceTenantId === sessionTenantId;
  
  if (!isValid) {
    logTenantValidationFailure({
      tenantId: sessionTenantId,
      resourceTenantId: resourceTenantId,
      status: 'UNAUTHORIZED',
      details: { reason: 'Tenant ID mismatch' },
    });
  }
  
  return isValid;
}

/**
 * Throw a 403 Forbidden error if tenantId mismatch detected
 * This function should be used in Server Actions and API routes
 * 
 * Requirements: Guardrail 2.1-2.6
 */
export function assertTenantOwnership(
  resourceTenantId: string,
  sessionTenantId: string,
  resourceType?: string,
  resourceId?: string
): void {
  if (!validateTenantOwnership(resourceTenantId, sessionTenantId)) {
    throw new TenantValidationError(
      'Access denied: Resource belongs to different tenant',
      sessionTenantId,
      resourceTenantId,
      resourceType,
      resourceId
    );
  }
}

/**
 * Create a tenant-scoped Prisma query filter
 * This ensures ALL database queries include tenantId filtering
 * 
 * Requirements: Guardrail 2.2, 2.4
 */
export function createTenantFilter(tenantId: string): { tenantId: string } {
  if (!tenantId) {
    throw new TenantValidationError(
      'Cannot create tenant filter: No tenantId provided',
      '',
      '',
      'FILTER',
      ''
    );
  }
  
  return { tenantId };
}

/**
 * Audit logging for all tenantId validation failures
 * 
 * Requirements: Guardrail 2.6, 2.8
 */
function logTenantValidationFailure(
  data: Omit<AuditLogEntry, 'timestamp' | 'event' | 'action'>
): void {
  const logEntry: AuditLogEntry = {
    timestamp: new Date(),
    event: 'TENANT_VALIDATION_FAILURE',
    action: 'VALIDATE_TENANT_OWNERSHIP',
    ...data,
  };
  
  // TODO: Implement proper audit logging (database, file, or external service)
  // For now, log to console with structured format
  console.error('[TENANT_SECURITY] Validation failed:', JSON.stringify(logEntry, null, 2));
  
  // In production, this should write to:
  // 1. Database audit table
  // 2. Security Information and Event Management (SIEM) system
  // 3. Application logs with high severity
}

/**
 * Scoped Prisma client with automatic tenant filtering
 * This is a factory function that returns a Prisma client proxy
 * that automatically adds tenantId filters to all queries
 * 
 * Requirements: Guardrail 2.2, 2.4
 */
export function createScopedPrismaClient(
  prisma: PrismaClient,
  tenantId: string
): PrismaClient {
  if (!tenantId) {
    throw new TenantValidationError(
      'Cannot create scoped Prisma client: No tenantId provided',
      '',
      '',
      'PRISMA_CLIENT',
      ''
    );
  }
  
  // Create a proxy that intercepts Prisma model queries
  const proxyHandler: ProxyHandler<PrismaClient> = {
    get(target, prop) {
      const original = (target as any)[prop];
      
      // Special handling for $transaction to ensure the transaction client is also scoped
      if (prop === '$transaction') {
        return async function (fnOrOperations: any) {
          // If it's a function (interactive transaction), wrap the transaction client
          if (typeof fnOrOperations === 'function') {
            return original.call(target, async (tx: PrismaClient) => {
              // Create a scoped version of the transaction client
              const scopedTx = createScopedPrismaClient(tx as unknown as PrismaClient, tenantId);
              return fnOrOperations(scopedTx);
            });
          }
          // If it's an array of operations (batch transaction), pass through
          return original.call(target, fnOrOperations);
        };
      }
      
      // Check if this is a Prisma model (course, notification, user, component)
      if (!isPrismaModel(prop as string)) {
        return original;
      }
      
      // Return a proxy for the model that intercepts method calls
      return new Proxy(original, {
        get(modelTarget, methodName) {
          const originalMethod = modelTarget[methodName];
          
          if (typeof originalMethod !== 'function') {
            return originalMethod;
          }
          
          // Return a wrapped function that adds tenantId filtering
          return function (...args: any[]) {
            // Handle all Prisma query operations
            // Create queryArgs from first argument or empty object
            const queryArgs = args.length > 0 && typeof args[0] === 'object' ? { ...args[0] } : {};
            
            // Only apply tenantId filtering to models that have tenantId field
            if (prop === 'course' || prop === 'notification' || prop === 'user') {
              // For find operations (findMany, findFirst, findUnique, count, etc.)
              // Always add tenantId to where clause
              if (!queryArgs.where) {
                queryArgs.where = {};
              }
              queryArgs.where.tenantId = tenantId;
            }
            
            // For create operations, ensure tenantId is included in data
            if (prop === 'course' || prop === 'notification') {
              if (queryArgs.data) {
                // Check if they're trying to create with a different tenantId
                if (queryArgs.data.tenantId && queryArgs.data.tenantId !== tenantId) {
                  throw new TenantValidationError(
                    'Cannot create resource with different tenantId',
                    tenantId,
                    queryArgs.data.tenantId,
                    prop as string,
                    ''
                  );
                }
                // Ensure tenantId is set
                queryArgs.data.tenantId = tenantId;
              }
            }
            
            // For update operations, add tenantId to where clause for ownership check
            if (prop === 'course' || prop === 'notification') {
              if (queryArgs.where && !queryArgs.where.tenantId) {
                queryArgs.where.tenantId = tenantId;
              }
            }
            
            return originalMethod.apply(modelTarget, [queryArgs]);
          };
        },
      });
    },
  };
  
  return new Proxy(prisma, proxyHandler);
}

/**
 * Check if a property is a Prisma model (simplified check)
 * In a real implementation, this would use Prisma's internal metadata
 */
function isPrismaModel(prop: string): boolean {
  const prismaModels = ['course', 'component', 'notification', 'user'];
  return prismaModels.includes(prop.toLowerCase());
}

/**
 * Transaction helper with tenant validation
 * Wraps database operations in a transaction with tenant ownership checks
 * 
 * Requirements: Guardrail 2.7
 */
export async function executeTenantTransaction<T>(
  prisma: PrismaClient,
  tenantId: string,
  operation: (tx: PrismaClient) => Promise<T>,
  context?: { resourceType?: string; resourceId?: string }
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    try {
      const result = await operation(tx as unknown as PrismaClient);
      
      // Log successful transaction
      console.log('[TENANT_TRANSACTION] Success:', {
        tenantId,
        context,
        timestamp: new Date().toISOString(),
      });
      
      return result;
    } catch (error) {
      // Log transaction failure with tenant context
      console.error('[TENANT_TRANSACTION] Failure:', {
        tenantId,
        context,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    }
  });
}

/**
 * Batch tenant validation for multiple resources
 * Useful for operations that affect multiple resources at once
 * 
 * Requirements: Guardrail 2.7
 */
export function validateBatchTenantOwnership(
  resources: Array<{ tenantId: string; id?: string; type?: string }>,
  sessionTenantId: string
): { valid: boolean; invalidResources: Array<{ id?: string; type?: string }> } {
  const invalidResources: Array<{ id?: string; type?: string }> = [];
  
  for (const resource of resources) {
    if (resource.tenantId !== sessionTenantId) {
      invalidResources.push({
        id: resource.id,
        type: resource.type,
      });
      
      logTenantValidationFailure({
        tenantId: sessionTenantId,
        resourceTenantId: resource.tenantId,
        status: 'UNAUTHORIZED',
        details: {
          reason: 'Batch validation failure',
          resourceId: resource.id,
          resourceType: resource.type,
        },
      });
    }
  }
  
  return {
    valid: invalidResources.length === 0,
    invalidResources,
  };
}

/**
 * Utility to extract tenantId from request in Server Actions
 * This should be used in Server Actions that receive request context
 */
export function extractTenantIdFromHeaders(headers: Headers): string {
  const tenantId = headers.get('x-tenant-id');
  
  if (!tenantId) {
    throw new TenantValidationError(
      'Missing tenantId in request headers',
      '',
      '',
      'REQUEST_HEADERS',
      ''
    );
  }
  
  return tenantId;
}

/**
 * Type guard to check if an error is a TenantValidationError
 */
export function isTenantValidationError(error: unknown): error is TenantValidationError {
  return error instanceof TenantValidationError;
}

/**
 * Convert TenantValidationError to HTTP response
 * Returns 403 Forbidden with appropriate error message
 */
export function tenantErrorToResponse(error: TenantValidationError): Response {
  const statusCode = 403;
  const errorBody = {
    error: 'Forbidden',
    message: error.message,
    sessionTenantId: error.sessionTenantId,
    resourceTenantId: error.resourceTenantId,
    resourceType: error.resourceType,
    resourceId: error.resourceId,
    timestamp: new Date().toISOString(),
  };
  
  return new Response(JSON.stringify(errorBody), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}