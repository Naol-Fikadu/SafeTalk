import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { SimpleLanding } from './components/SimpleLanding';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If user is logged in, redirect to dashboard
  if (session) {
    if (session.user?.is_admin) {
      redirect('/dashboard/admin');
    } else {
      redirect('/dashboard/user');
    }
  }

  return <SimpleLanding />;
}