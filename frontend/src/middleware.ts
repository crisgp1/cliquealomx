import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define las rutas protegidas que requieren autenticación
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/listings(.*)',
  '/api/hero-content(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Si es una ruta protegida y el usuario no está autenticado, redirigir a sign-in
  if (isProtectedRoute(req) && !(await auth()).userId) {
    // Redirigir a la página local de sign-in, no al subdominio de Clerk
    const signInUrl = new URL('/auth-sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return Response.redirect(signInUrl)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}