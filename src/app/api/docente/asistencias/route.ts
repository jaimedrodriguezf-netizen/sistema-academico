import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { asistencias, estudiantes } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// GET: Cargar registros de asistencia existentes para un nivel, materia y fecha
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nivelIdStr = searchParams.get('nivelId');
  const materiaIdStr = searchParams.get('materiaId');
  const fecha = searchParams.get('fecha');

  if (!nivelIdStr || !materiaIdStr || !fecha) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos (nivelId, materiaId, fecha)' }, { status: 400 });
  }

  try {
    const nivelId = Number(nivelIdStr);
    const materiaId = Number(materiaIdStr);

    // Obtener los registros de asistencia para esta materia y fecha, 
    // filtrando por los estudiantes que pertenecen al nivel seleccionado.
    const records = await db
      .select({
        id: asistencias.id,
        estudianteId: asistencias.estudianteId,
        estado: asistencias.estado,
        observacion: asistencias.observacion,
      })
      .from(asistencias)
      .innerJoin(estudiantes, eq(asistencias.estudianteId, estudiantes.id))
      .where(
        and(
          eq(asistencias.materiaId, materiaId),
          eq(asistencias.fecha, new Date(fecha)),
          eq(estudiantes.nivelId, nivelId)
        )
      );

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching asistencias para docente:', error);
    return NextResponse.json({ error: 'Error del servidor al obtener las asistencias' }, { status: 500 });
  }
}

// POST: Registrar / Actualizar lote de asistencias (Reemplazo completo de la fecha/materia)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nivelId, materiaId, fecha, registros } = body as {
      nivelId: number;
      materiaId: number;
      fecha: string;
      registros: Array<{
        estudianteId: number;
        estado: 'presente' | 'ausente' | 'atraso' | 'justificado';
        observacion: string;
      }>;
    };

    if (!nivelId || !materiaId || !fecha || !Array.isArray(registros)) {
      return NextResponse.json({ error: 'Datos de entrada inválidos' }, { status: 400 });
    }

    // 1. Obtener todos los IDs de estudiantes pertenecientes a este nivel para asegurar
    // que solo eliminamos/afectamos registros correspondientes a esta aula de clase.
    const levelStudents = await db
      .select({ id: estudiantes.id })
      .from(estudiantes)
      .where(eq(estudiantes.nivelId, nivelId));

    const levelStudentsIds = levelStudents.map((s) => s.id);

    if (levelStudentsIds.length > 0) {
      // 2. Limpiar registros previos para esta materia, fecha y estudiantes del nivel (Acción de sobrescritura segura)
      await db
        .delete(asistencias)
        .where(
          and(
            eq(asistencias.materiaId, materiaId),
            eq(asistencias.fecha, new Date(fecha)),
            inArray(asistencias.estudianteId, levelStudentsIds)
          )
        );
    }

    // 3. Mapear y preparar inserción de los nuevos registros
    const registrosAInsertar = registros
      .filter((reg) => levelStudentsIds.includes(reg.estudianteId)) // Sanitización de seguridad
      .map((reg) => ({
        estudianteId: reg.estudianteId,
        fecha: new Date(fecha),
        estado: reg.estado,
        materiaId,
        observacion: reg.observacion.trim() || null,
      }));

    if (registrosAInsertar.length > 0) {
      // Insertar en lote
      await db.insert(asistencias).values(registrosAInsertar);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al registrar asistencias:', error);
    return NextResponse.json({ error: 'Error interno del servidor al guardar asistencias' }, { status: 500 });
  }
}
