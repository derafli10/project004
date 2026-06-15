/**
 * Session Authentication Middleware for Grade Optimizer
 * 
 * This middleware validates user sessions and enforces multi-tenant data isolation
 * by extracting tenantId from authenticated sessions and attaching it to request context.
 * 
 * Requirements: 8.1-8.2, 8.5-8.7, Guardrail 2.4
 */

import { NextResponse, NextRequest } from 'next/server';

import { validateRequestSession } from './lib/auth';
import { getTenantId } from './lib/session';

// Security headers configuration
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';",
};

// CSRF protection: Validate Origin header for state-changing requests
function validateCsrfHeaders(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Skip CSRF check for same-origin requests and GET requests
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return true;
  }

  // For API routes and Server Actions, validate Origin header
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }

  // Fallback: Check for custom CSRF token in header
  const csrfToken = request.headers.get('x-csrf-token');
  return csrfToken !== null;
}

// Session validation function is imported from src/lib/auth.ts
// Tenant extraction function is imported from src/lib/session.ts

/**
 * Main middleware function
 * 
 * Responsibilities:
 * 1. Validate user session
 * 2. Extract tenantId from session
 * 3. Attach tenantId to request headers for Server Actions
 * 4. Return 401 Unauthorized if session invalid
 * 5. Add security headers
 * 6. Validate CSRF protection for non-GET requests
 */
export async function middleware(request: NextRequest) {
  // Start timing for performance monitoring
  const startTime = Date.now();

  // Validate CSRF headers for state-changing requests
  if (!validateCsrfHeaders(request)) {
    console.warn('CSRF validation failed for request:', {
      method: request.method,
      url: request.url,
      origin: request.headers.get('origin'),
      host: request.headers.get('host'),
    });

    return new NextResponse('CSRF validation failed', {
      status: 403,
      headers: securityHeaders,
    });
  }

  // Validate user session
  const session = await validateRequestSession(request);

  if (!session) {
    // Session invalid or expired - return 401 Unauthorized
    console.warn('Invalid session for request:', {
      method: request.method,
      url: request.url,
    });

    return new NextResponse('Unauthorized - Invalid or expired session', {
      status: 401,
      headers: {
        ...securityHeaders,
        'WWW-Authenticate': 'Bearer',
      },
    });
  }

  // Extract tenantId from session
  const tenantId = getTenantId(session);

  if (!tenantId) {
    // No tenantId in valid session - this should never happen but we handle it
    console.error('Valid session but missing tenantId:', session);

    return new NextResponse('Unauthorized - Missing tenant identifier', {
      status: 401,
      headers: securityHeaders,
    });
  }

  // Log successful authentication for audit purposes
  console.log('Authenticated request:', {
    userId: session.userId,
    tenantId,
    method: request.method,
    url: request.url,
    durationMs: Date.now() - startTime,
  });

  // Clone request to add tenantId to headers for Server Actions
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenantId);
  requestHeaders.set('x-user-id', session.userId);
  requestHeaders.set('x-user-email', session.email);

  // Create response with security headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Middleware configuration
 * 
 * Apply middleware to all routes except:
 * - Static files (public directory)
 * - API routes that don't require authentication (e.g., health check)
 * - Authentication callback routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. Static files in _next/static, _next/image, favicon.ico, etc.
     * 2. Public assets
     * 4. Root path (/)
     * 5. Login path (/login)
     * 6. Auth API (/api/auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/health|api/auth|$|login).*)',
  ],
};

// getTenantIdFromRequest moved to src/lib/server-context.ts