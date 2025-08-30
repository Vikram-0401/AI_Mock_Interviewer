import { clerkMiddleware } from "@clerk/nextjs/server";

// This example protects all routes including api/trpc routes
export default clerkMiddleware((auth, req, evt) => {
  // If the user is not signed in and the route is not public, redirect to sign-in
  if (!auth.userId && !auth.isPublicRoute) {
    return Response.redirect(new URL('/sign-in', req.url));
  }

  // If the user is signed in and trying to access auth pages, redirect to dashboard
  if (auth.userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    const dashboard = new URL('/dashboard', req.url);
    return Response.redirect(dashboard);
  }
}, {
  // Array of public routes that don't require authentication
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  
  // Array of routes to be ignored by the authentication middleware
  ignoredRoutes: ["/api/webhook/clerk"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};