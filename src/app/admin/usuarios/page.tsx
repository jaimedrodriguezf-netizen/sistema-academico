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
  // El layout padre ya validó el token — lo leemos solo para obtener el adminId
  const admin = await verificarToken(token!);

  return (
    <UsuariosClient adminId={admin!.usuarioId} />
  );
}
