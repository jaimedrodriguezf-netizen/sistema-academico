import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { docentesMaterias } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asignacionId = parseInt(id, 10);

    await db.delete(docentesMaterias).where(eq(docentesMaterias.id, asignacionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar asignación de materia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
