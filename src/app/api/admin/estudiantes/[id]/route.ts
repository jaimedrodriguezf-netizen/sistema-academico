import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { estudiantes } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const estudianteId = Number(id);
    if (isNaN(estudianteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { nombre, nivelId, padreId, cedula, genero, fechaNacimiento } = body;

    if (!nombre || !nivelId || !padreId) {
      return NextResponse.json(
        { error: 'Nombre, nivel y padre son obligatorios' },
        { status: 400 }
      );
    }

    const existente = await db
      .select({ id: estudiantes.id })
      .from(estudiantes)
      .where(eq(estudiantes.id, estudianteId));

    if (existente.length === 0) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    await db
      .update(estudiantes)
      .set({
        nombre,
        nivelId: Number(nivelId),
        padreId: Number(padreId),
        cedula: cedula || null,
        genero: genero || null,
        fechaNacimiento: fechaNacimiento || null,
      })
      .where(eq(estudiantes.id, estudianteId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const estudianteId = Number(id);
    if (isNaN(estudianteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const existente = await db
      .select({ id: estudiantes.id })
      .from(estudiantes)
      .where(eq(estudiantes.id, estudianteId));

    if (existente.length === 0) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    await db.delete(estudiantes).where(eq(estudiantes.id, estudianteId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
