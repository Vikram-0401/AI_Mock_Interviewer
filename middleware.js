import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes using route matcher
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)']);

// Export middleware
export default clerkMiddleware((auth, req) => {
    // Check if the request is for a protected route
    if (isProtectedRoute(req)) {
        // Check if the user is authenticated
        const user = auth();

        // If user is not authenticated, throw an error or handle accordingly
        if (!user) {
            // You can redirect or send a response here
            return new Response('Unauthorized', { status: 401 });
        }
    }
});

// Configuration for matching routes
export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};



// middleware.ts
// middleware.ts
// import { authMiddleware, redirectToSignIn } from "@clerk/nextjs/server";

// // This example protects all routes including api/trpc routes
// export default authMiddleware({
//   // Array of public routes that don't require authentication
//   publicRoutes: ["/", "/sign-in", "/sign-up"],
  
//   // Array of routes to be ignored by the authentication middleware
//   ignoredRoutes: ["/api/webhook/clerk"],

//   // Callback function after authorization
//   afterAuth(auth, req, evt) {
//     // If the user is not signed in and the route is not public, redirect to sign-in
//     if (!auth.userId && !auth.isPublicRoute) {
//       return redirectToSignIn({ returnBackUrl: req.url });
//     }

//     // If the user is signed in and trying to access auth pages, redirect to dashboard
//     if (auth.userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
//       const dashboard = new URL('/dashboard', req.url);
//       return Response.redirect(dashboard);
//     }
//   },
// });

// export const config = {
//   matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
// };