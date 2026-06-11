/**
 * Tests for Tenant Isolation Helper Functions
 * 
 * Validates strict multi-tenant data isolation properties
 * 
 * **Validates: Requirements 7.1-7.4, 8.3-8.4, Guardrail 2**
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getTenantId,
  validateTenantOwnership,
  assertTenantOwnership,
  createTenantFilter,
  TenantValidationError,
  isTenantValidationError,
  tenantErrorToResponse,
  validateBatchTenantOwnership,
  extractTenantIdFromHeaders,
  UserSession,
} from './tenant-isolation';

describe('Tenant Isolation Helper Functions', () => {
  const mockSession: UserSession = {
    userId: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    tenantId: 'tenant-123',
    expires: new Date(Date.now() + 3600000).toISOString(),
  };

  describe('getTenantId', () => {
    it('should extract tenantId from valid session', () => {
      const tenantId = getTenantId(mockSession);
      expect(tenantId).toBe('tenant-123');
    });

    it('should throw TenantValidationError for null session', () => {
      expect(() => getTenantId(null)).toThrow(TenantValidationError);
      expect(() => getTenantId(null)).toThrow('No authenticated session');
    });

    it('should throw TenantValidationError for session with empty tenantId', () => {
      const invalidSession: UserSession = {
        ...mockSession,
        tenantId: '',
      };
      expect(() => getTenantId(invalidSession)).toThrow(TenantValidationError);
    });

    it('should throw TenantValidationError for session with whitespace tenantId', () => {
      const invalidSession: UserSession = {
        ...mockSession,
        tenantId: '   ',
      };
      expect(() => getTenantId(invalidSession)).toThrow(TenantValidationError);
    });
  });

  describe('validateTenantOwnership', () => {
    it('should return true for matching tenant IDs', () => {
      const isValid = validateTenantOwnership('tenant-123', 'tenant-123');
      expect(isValid).toBe(true);
    });

    it('should return false for mismatched tenant IDs', () => {
      const isValid = validateTenantOwnership('tenant-123', 'tenant-456');
      expect(isValid).toBe(false);
    });

    it('should return false for empty tenant IDs', () => {
      expect(validateTenantOwnership('', 'tenant-123')).toBe(false);
      expect(validateTenantOwnership('tenant-123', '')).toBe(false);
      expect(validateTenantOwnership('', '')).toBe(false);
    });

    it('should log validation failures for mismatched tenants', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      validateTenantOwnership('tenant-123', 'tenant-456');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0]![0]).toContain('[TENANT_SECURITY]');
      
      consoleSpy.mockRestore();
    });
  });

  describe('assertTenantOwnership', () => {
    it('should not throw for matching tenant IDs', () => {
      expect(() => {
        assertTenantOwnership('tenant-123', 'tenant-123');
      }).not.toThrow();
    });

    it('should throw TenantValidationError for mismatched tenant IDs', () => {
      expect(() => {
        assertTenantOwnership('tenant-123', 'tenant-456');
      }).toThrow(TenantValidationError);
      
      expect(() => {
        assertTenantOwnership('tenant-123', 'tenant-456');
      }).toThrow('Access denied: Resource belongs to different tenant');
    });

    it('should include resource context in error', () => {
      try {
        assertTenantOwnership('tenant-123', 'tenant-456', 'COURSE', 'course-789');
      } catch (error) {
        expect(error).toBeInstanceOf(TenantValidationError);
        const tenantError = error as TenantValidationError;
        expect(tenantError.resourceType).toBe('COURSE');
        expect(tenantError.resourceId).toBe('course-789');
        expect(tenantError.sessionTenantId).toBe('tenant-456');
        expect(tenantError.resourceTenantId).toBe('tenant-123');
      }
    });
  });

  describe('createTenantFilter', () => {
    it('should create tenant filter object', () => {
      const filter = createTenantFilter('tenant-123');
      expect(filter).toEqual({ tenantId: 'tenant-123' });
    });

    it('should throw TenantValidationError for empty tenantId', () => {
      expect(() => createTenantFilter('')).toThrow(TenantValidationError);
    });
  });

  describe('validateBatchTenantOwnership', () => {
    it('should return valid=true for all matching tenant IDs', () => {
      const resources = [
        { tenantId: 'tenant-123', id: 'resource-1', type: 'COURSE' },
        { tenantId: 'tenant-123', id: 'resource-2', type: 'COMPONENT' },
        { tenantId: 'tenant-123', id: 'resource-3', type: 'NOTIFICATION' },
      ];

      const result = validateBatchTenantOwnership(resources, 'tenant-123');
      expect(result.valid).toBe(true);
      expect(result.invalidResources).toEqual([]);
    });

    it('should return valid=false for mismatched tenant IDs', () => {
      const resources = [
        { tenantId: 'tenant-123', id: 'resource-1', type: 'COURSE' },
        { tenantId: 'tenant-456', id: 'resource-2', type: 'COMPONENT' }, // Different tenant
        { tenantId: 'tenant-123', id: 'resource-3', type: 'NOTIFICATION' },
      ];

      const result = validateBatchTenantOwnership(resources, 'tenant-123');
      expect(result.valid).toBe(false);
      expect(result.invalidResources).toEqual([
        { id: 'resource-2', type: 'COMPONENT' },
      ]);
    });

    it('should identify all invalid resources', () => {
      const resources = [
        { tenantId: 'tenant-123', id: 'r1', type: 'A' },
        { tenantId: 'tenant-456', id: 'r2', type: 'B' },
        { tenantId: 'tenant-789', id: 'r3', type: 'C' },
        { tenantId: 'tenant-123', id: 'r4', type: 'D' },
      ];

      const result = validateBatchTenantOwnership(resources, 'tenant-123');
      expect(result.valid).toBe(false);
      expect(result.invalidResources).toEqual([
        { id: 'r2', type: 'B' },
        { id: 'r3', type: 'C' },
      ]);
    });
  });

  describe('extractTenantIdFromHeaders', () => {
    it('should extract tenantId from headers', () => {
      const headers = new Headers();
      headers.set('x-tenant-id', 'tenant-123');
      
      const tenantId = extractTenantIdFromHeaders(headers);
      expect(tenantId).toBe('tenant-123');
    });

    it('should throw TenantValidationError for missing tenantId header', () => {
      const headers = new Headers();
      
      expect(() => extractTenantIdFromHeaders(headers)).toThrow(TenantValidationError);
      expect(() => extractTenantIdFromHeaders(headers)).toThrow('Missing tenantId in request headers');
    });
  });

  describe('isTenantValidationError', () => {
    it('should return true for TenantValidationError instances', () => {
      const error = new TenantValidationError('test', 'session-123', 'resource-456');
      expect(isTenantValidationError(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      expect(isTenantValidationError(new Error('generic'))).toBe(false);
      expect(isTenantValidationError('string')).toBe(false);
      expect(isTenantValidationError(null)).toBe(false);
      expect(isTenantValidationError(undefined)).toBe(false);
    });
  });

  describe('tenantErrorToResponse', () => {
    it('should convert TenantValidationError to 403 response', () => {
      const error = new TenantValidationError(
        'Access denied',
        'session-123',
        'resource-456',
        'COURSE',
        'course-789'
      );

      const response = tenantErrorToResponse(error);
      
      expect(response.status).toBe(403);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      return response.json().then((body) => {
        expect(body).toEqual({
          error: 'Forbidden',
          message: 'Access denied',
          sessionTenantId: 'session-123',
          resourceTenantId: 'resource-456',
          resourceType: 'COURSE',
          resourceId: 'course-789',
          timestamp: expect.any(String),
        });
      });
    });
  });

  describe('Property 9: Multi-Tenant Data Isolation', () => {
    // These tests validate the core property: distinct tenants never access each other's data
    
    it('should prevent cross-tenant data access through validation', () => {
      // Given two distinct tenant IDs
      const tenant1 = 'tenant-abc-123';
      const tenant2 = 'tenant-def-456';
      
      // When tenant1 attempts to access tenant2's data
      const isValid = validateTenantOwnership(tenant2, tenant1);
      
      // Then access should be denied
      expect(isValid).toBe(false);
    });

    it('should enforce tenant isolation for all validation methods', () => {
      const tenant1 = 'tenant-1';
      const tenant2 = 'tenant-2';
      
      // validateTenantOwnership should return false
      expect(validateTenantOwnership(tenant2, tenant1)).toBe(false);
      
      // assertTenantOwnership should throw
      expect(() => assertTenantOwnership(tenant2, tenant1)).toThrow(TenantValidationError);
      
      // createTenantFilter should only create filter for own tenant
      const filter1 = createTenantFilter(tenant1);
      expect(filter1).toEqual({ tenantId: tenant1 });
      
      const filter2 = createTenantFilter(tenant2);
      expect(filter2).toEqual({ tenantId: tenant2 });
      expect(filter1).not.toEqual(filter2);
    });

    it('should handle edge cases in tenant validation', () => {
      // Empty strings
      expect(validateTenantOwnership('', '')).toBe(false);
      
      // Whitespace
      expect(validateTenantOwnership('  ', '  ')).toBe(false);
      expect(validateTenantOwnership('tenant-1', '  tenant-1  ')).toBe(false);
      
      // Case sensitivity (tenant IDs should be case-sensitive)
      expect(validateTenantOwnership('Tenant-1', 'tenant-1')).toBe(false);
      expect(validateTenantOwnership('TENANT-1', 'tenant-1')).toBe(false);
    });

    it('should provide audit logging for all validation failures', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Trigger multiple validation failures
      validateTenantOwnership('tenant-1', 'tenant-2');
      validateTenantOwnership('tenant-3', 'tenant-4');
      validateBatchTenantOwnership([
        { tenantId: 'tenant-1', id: 'r1' },
        { tenantId: 'tenant-2', id: 'r2' },
      ], 'tenant-3');
      
      // Should log each failure (2 individual + 2 from batch = 4 total)
      expect(consoleSpy).toHaveBeenCalledTimes(4);
      
      // Each log should contain tenant security marker
      consoleSpy.mock.calls.forEach(call => {
        expect(call[0]).toContain('[TENANT_SECURITY]');
      });
      
      consoleSpy.mockRestore();
    });
  });
});