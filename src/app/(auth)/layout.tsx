/**
 * Auth group layout — centered card shell, no site header or footer.
 *
 * Covers: /authentication/login, /authentication/registration,
 *         /authentication/forgot-password, /authentication/change-password,
 *         /authentication/otp, /authentication/reactivate
 *
 * NOTE: The root layout wraps every page with <Providers> + <html>/<body>.
 * This layout renders its own full-viewport container so the auth pages
 * visually suppress the global Navbar.  The Navbar component should also
 * check a route-group header or a layout cookie if a truly server-side
 * suppression is needed.
 */

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* Full-viewport overlay that sits above the root layout's flex column,
       visually hiding the Navbar for all auth routes. */
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.svg"
          alt="Send2"
          width={120}
          height={40}
          className="h-10 w-auto"
        />
      </div>

      {/* Card shell */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
        {children}
      </div>

      {/* Footer note */}
      <p className="mt-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Send2. All rights reserved.
      </p>
    </div>
  );
}
