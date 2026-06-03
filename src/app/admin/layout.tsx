import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import './admin-layout.css';

export const metadata = {
  title: 'Panel Administrativo | Sistema Académico',
  description: 'Panel de administración del sistema académico',
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const admin = token ? await verificarToken(token) : null;

  if (!admin || admin.rol !== 'admin') {
    redirect('/admin-login');
  }

  return (
    <div className="admin-shell">
      <AdminSidebar adminId={admin.usuarioId} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
