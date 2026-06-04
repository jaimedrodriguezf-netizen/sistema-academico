import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { asistencias, estudiantes, padres } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticación del padre
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const user = token ? await verificarToken(token) : null;

    if (!user || user.rol !== 'padre') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const asistenciaId = parseInt(id, 10);

    const body = await request.json();
    const { observacion } = body;

    if (!observacion || !observacion.trim()) {
      return NextResponse.json({ error: 'La justificación es obligatoria' }, { status: 400 });
    }

    // 2. Obtener el registro de padre asociado al usuario autenticado
    const parentRecords = await db
      .select()
      .from(padres)
      .where(eq(padres.usuarioId, user.usuarioId))
      .limit(1);

    const padreInfo = parentRecords[0];
    if (!padreInfo) {
      return NextResponse.json({ error: 'Padre no registrado' }, { status: 404 });
    }

    // 3. Obtener la asistencia y verificar que el estudiante asociado pertenezca a este padre
    const attendanceRecords = await db
      .select({
        id: asistencias.id,
        estudianteId: asistencias.estudianteId,
        estado: asistencias.estado,
        padreId: estudiantes.padreId,
      })
      .from(asistencias)
      .innerJoin(estudiantes, eq(asistencias.estudianteId, estudiantes.id))
      .where(eq(asistencias.id, asistenciaId))
      .limit(1);

    const attendance = attendanceRecords[0];
    if (!attendance) {
      return NextResponse.json({ error: 'Registro de asistencia no encontrado' }, { status: 404 });
    }

    // Seguridad: verificar propiedad
    if (attendance.padreId !== padreInfo.id) {
      return NextResponse.json({ error: 'No autorizado para justificar esta falta' }, { status: 403 });
    }

    // Solo se pueden justificar faltas (ausente)
    if (attendance.estado !== 'ausente') {
      return NextResponse.json({ error: 'Solo se pueden justificar registros con estado ausente' }, { status: 400 });
    }

    // 4. Actualizar el registro a 'justificado' con la justificación
    await db
      .update(asistencias)
      .set({
        estado: 'justificado',
        observacion: observacion.trim(),
      })
      .where(eq(asistencias.id, asistenciaId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al justificar asistencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
