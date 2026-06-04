import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { docentes, docentesMaterias, materias, niveles, estudiantes } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import DocenteClient from './DocenteClient';

export default async function DocenteDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? await verificarToken(token) : null;

  if (!user || user.rol !== 'docente') {
    redirect('/login');
  }

  // 1. Obtener el registro de docente
  const docenteRecords = await db
    .select()
    .from(docentes)
    .where(eq(docentes.usuarioId, user.usuarioId))
    .limit(1);

  const docenteInfo = docenteRecords[0];

  if (!docenteInfo) {
    return (
      <div className="table-container" style={{ margin: '24px' }}>
        <div className="table-empty" style={{ padding: '40px 24px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>📭 Registro docente no encontrado.</p>
          <p style={{ color: 'var(--text-muted)' }}>Comuníquese con el administrador para vincular su usuario docente.</p>
        </div>
      </div>
    );
  }

  // 2. Obtener materias y niveles asignados a este docente
  const materiasAsignadas = await db
    .select({
      id: docentesMaterias.id,
      nivelId: docentesMaterias.nivelId,
      nivelNombre: niveles.nombre,
      materiaId: docentesMaterias.materiaId,
      materiaNombre: materias.nombre,
    })
    .from(docentesMaterias)
    .innerJoin(niveles, eq(docentesMaterias.nivelId, niveles.id))
    .innerJoin(materias, eq(docentesMaterias.materiaId, materias.id))
    .where(eq(docentesMaterias.docenteId, docenteInfo.id));

  // 3. Obtener lista de estudiantes asignados a los niveles que imparte el docente
  let estudiantesPorNivel: Array<{
    id: number;
    cedula: string | null;
    nombre: string;
    nivelId: number;
  }> = [];

  if (materiasAsignadas.length > 0) {
    const nivelIds = Array.from(new Set(materiasAsignadas.map((m) => m.nivelId)));

    estudiantesPorNivel = await db
      .select({
        id: estudiantes.id,
        cedula: estudiantes.cedula,
        nombre: estudiantes.nombre,
        nivelId: estudiantes.nivelId,
      })
      .from(estudiantes)
      .where(inArray(estudiantes.nivelId, nivelIds));
  }

  return (
    <DocenteClient
      materiasAsignadas={materiasAsignadas}
      estudiantes={estudiantesPorNivel}
    />
  );
}
