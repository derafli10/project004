import { headers } from 'next/headers';
import { assertTenantOwnership, TenantValidationError } from './tenant-isolation';

/**
 * Extract tenantId from request headers in Server Actions
 * This should be used by all Server Actions to ensure tenant isolation
 * 
 * Requirements: 8.4, Guardrail 2.4
 */
export async function getTenantIdFromRequest(): Promise<string> {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  
  if (!tenantId) {
    throw new TenantValidationError(
      'Missing tenantId in request headers. Ensure request passed through middleware.',
      '',
      '',
      'SERVER_CONTEXT',
      ''
    );
  }
  
  return tenantId;
}

/**
 * Extract user ID from request headers in Server Actions
 */
export async function getUserIdFromRequest(): Promise<string> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  
  if (!userId) {
    throw new Error('Missing userId in request headers');
  }
  
  return userId;
}

/**
 * Verify access to a resource based on tenantId
 * 
 * @param resourceTenantId The tenantId attached to the requested resource
 * @throws TenantValidationError if the session tenantId does not match
 */
export async function validateTenantAccess(resourceTenantId: string, resourceType?: string, resourceId?: string): Promise<void> {
  const sessionTenantId = await getTenantIdFromRequest();
  assertTenantOwnership(resourceTenantId, sessionTenantId, resourceType, resourceId);
}
