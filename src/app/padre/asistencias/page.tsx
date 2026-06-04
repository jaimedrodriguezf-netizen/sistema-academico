import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { estudiantes, niveles, padres, asistencias, materias, docentesMaterias } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import AsistenciasClient from './AsistenciasClient';

// Import shared CSS for visual style coherence
import '@/app/styles/usuarios.css';
import '@/app/styles/estudiantes.css';

export const metadata = {
  title: 'Control de Asistencias | Portal de Padres',
  description: 'Control y seguimiento de asistencias por materia de representados',
};


export default async function AsistenciasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? await verificarToken(token) : null;

  if (!user) {
    return null;
  }

  // 1. Obtener registro de padre asociado al usuario
  const parentRecords = await db
    .select()
    .from(padres)
    .where(eq(padres.usuarioId, user.usuarioId))
    .limit(1);

  const padreInfo = parentRecords[0];

  let hijos: Array<{ id: number; nombre: string; nivel: string; nivelId: number; genero: 'masculino' | 'femenino' | 'otro' | null }> = [];
  let listaAsistencias: Array<{
    id: number;
    estudianteId: number;
    fecha: string;
    estado: 'presente' | 'ausente' | 'atraso' | 'justificado';
    observacion: string | null;
    materiaId: number;
    materiaNombre: string;
  }> = [];
  let materiasAsignadas: Array<{ nivelId: number; materiaId: number; materiaNombre: string }> = [];

  if (padreInfo) {
    // 2. Obtener lista de hijos con nivelId
    hijos = await db
      .select({
        id: estudiantes.id,
        nombre: estudiantes.nombre,
        nivel: niveles.nombre,
        nivelId: estudiantes.nivelId,
        genero: estudiantes.genero,
      })
      .from(estudiantes)
      .innerJoin(niveles, eq(estudiantes.nivelId, niveles.id))
      .where(eq(estudiantes.padreId, padreInfo.id));

    if (hijos.length > 0) {
      const hijosIds = hijos.map((h) => h.id);
      const nivelIds = hijos.map((h) => h.nivelId);

      // 3. Obtener materias asignadas a los niveles de los hijos
      materiasAsignadas = await db
        .select({
          nivelId: docentesMaterias.nivelId,
          materiaId: docentesMaterias.materiaId,
          materiaNombre: materias.nombre,
        })
        .from(docentesMaterias)
        .innerJoin(materias, eq(docentesMaterias.materiaId, materias.id))
        .where(inArray(docentesMaterias.nivelId, nivelIds));

      // 4. Obtener asistencias uniendo con materias
      const rawAsistencias = await db
        .select({
          id: asistencias.id,
          estudianteId: asistencias.estudianteId,
          fecha: asistencias.fecha,
          estado: asistencias.estado,
          observacion: asistencias.observacion,
          materiaId: asistencias.materiaId,
          materiaNombre: materias.nombre,
        })
        .from(asistencias)
        .innerJoin(materias, eq(asistencias.materiaId, materias.id))
        .where(inArray(asistencias.estudianteId, hijosIds))
        .orderBy(desc(asistencias.fecha));

      listaAsistencias = rawAsistencias.map((asis) => {
        let fechaString = '';
        if (asis.fecha instanceof Date) {
          const yyyy = asis.fecha.getUTCFullYear();
          const mm = String(asis.fecha.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(asis.fecha.getUTCDate()).padStart(2, '0');
          fechaString = `${yyyy}-${mm}-${dd}`;
        } else {
          fechaString = String(asis.fecha);
        }
        return {
          id: asis.id,
          estudianteId: asis.estudianteId,
          fecha: fechaString,
          estado: asis.estado,
          observacion: asis.observacion,
          materiaId: asis.materiaId,
          materiaNombre: asis.materiaNombre,
        };
      });
    }
  }

  return (
    <AsistenciasClient
      hijos={hijos}
      asistencias={listaAsistencias}
      materiasAsignadas={materiasAsignadas}
    />
  );
}
