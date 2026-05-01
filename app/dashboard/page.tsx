import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  if (session.user.is_admin) {
    redirect('/dashboard/admin');
  } else {
    redirect('/dashboard/user');
  }

  return null;
}