import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PadreShellClient from './PadreShellClient';
import { db } from '@/db';
import { usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';
import '../admin/admin-layout.css';

export const metadata = {
  title: 'Portal de Padres | Sistema Académico',
  description: 'Portal de padres de familia del sistema académico',
};

export default async function PadreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? await verificarToken(token) : null;

  if (!user || user.rol !== 'padre') {
    redirect('/login');
  }

  // Obtener el nombre del usuario desde la base de datos
  const userRecord = await db
    .select({ nombre: usuarios.nombre })
    .from(usuarios)
    .where(eq(usuarios.id, user.usuarioId))
    .limit(1);

  const parentName = userRecord[0]?.nombre || `Padre #${user.usuarioId}`;

  return (
    <PadreShellClient parentName={parentName}>
      {children}
    </PadreShellClient>
  );
}
