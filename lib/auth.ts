/**
 * Authentication Utilities
 * 
 * Requirements: 8.1, 8.2, 8.6
 */
import { NextRequest } from 'next/server';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  expires: string;
}

/**
 * Validate an incoming request's session
 * Uses mocked headers for development; should be replaced by actual JWT/session store logic in production.
 */
export async function validateRequestSession(request: NextRequest): Promise<UserSession | null> {
  try {
    const userId = request.headers.get('x-user-id') || request.cookies.get('mock_user_id')?.value;
    const tenantId = request.headers.get('x-tenant-id') || request.cookies.get('mock_tenant_id')?.value;
    const email = request.headers.get('x-user-email') || request.cookies.get('mock_email')?.value;
    const name = request.headers.get('x-user-name') || 'User';
    
    if (!userId || !tenantId || !email) {
      return null;
    }
    
    return {
      userId,
      email,
      name,
      tenantId,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}
