import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';
import UsuariosClient from './UsuariosClient';
import { redirect } from 'next/navigation';
import './usuarios.css';

export default async function AdminUsuariosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const admin = token ? await verificarToken(token) : null;

  if (!admin || admin.rol !== 'admin') {
    redirect('/login');
  }

  return (
    <main>
      <UsuariosClient adminId={admin.usuarioId} />
    </main>
  );
}
