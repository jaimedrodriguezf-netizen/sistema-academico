import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DocenteShellClient from './DocenteShellClient';
import { db } from '@/db';
import { usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';
import '../admin/admin-layout.css';

export const metadata = {
  title: 'Portal de Docentes | Sistema Académico',
  description: 'Portal de control de asistencias para docentes',
};

export default async function DocenteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? await verificarToken(token) : null;

  if (!user || user.rol !== 'docente') {
    redirect('/login');
  }

  // Obtener el nombre del docente desde la base de datos
  const userRecord = await db
    .select({ nombre: usuarios.nombre })
    .from(usuarios)
    .where(eq(usuarios.id, user.usuarioId))
    .limit(1);

  const docenteName = userRecord[0]?.nombre || `Docente #${user.usuarioId}`;

  return (
    <DocenteShellClient docenteName={docenteName}>
      {children}
    </DocenteShellClient>
  );
}
