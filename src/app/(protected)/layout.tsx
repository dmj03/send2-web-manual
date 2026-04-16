/**
 * Protected group layout — site shell with header/footer + server-side auth check.
 *
 * Covers: /profile/*, /dashboard (any route requiring a valid session).
 *
 * Middleware handles the primary redirect to /authentication/login.
 * This layout provides a second layer of defence: it reads the auth_token
 * cookie server-side and redirects if missing (e.g. cookie expired between
 * middleware execution and render).
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/navigation';
import { Footer } from '@/components/navigation';

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;

  if (!authToken) {
    redirect('/authentication/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
