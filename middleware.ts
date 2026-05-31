// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if token exists and is not expired
        if (!token) {
          return false;
        }
        
        // You can add additional token expiration checks here
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/customers/:path*',
    '/api/customers/:path*',
    // Add other protected routes here
  ],
};