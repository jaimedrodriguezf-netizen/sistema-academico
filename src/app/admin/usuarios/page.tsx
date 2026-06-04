import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';
import UsuariosClient from './UsuariosClient';
import '@/app/styles/usuarios.css';

export const metadata = {
  title: 'Usuarios | Panel Administrativo',
};

export default async function AdminUsuariosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    throw new Error('No session token');
  }

  const admin = await verificarToken(token);
  if (!admin) {
    throw new Error('Invalid session');
  }

  return (
    <UsuariosClient adminId={admin.usuarioId} />
  );
}
