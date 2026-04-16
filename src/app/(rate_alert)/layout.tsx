/**
 * Rate-Alert route group layout.
 * Auth-protected: redirects to /authentication/login if no session cookie.
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/navigation';
import { Footer } from '@/components/navigation';

export default async function RateAlertLayout({
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
      <main className="flex-1 bg-gray-50">{children}</main>
      <Footer />
    </div>
  );
}
