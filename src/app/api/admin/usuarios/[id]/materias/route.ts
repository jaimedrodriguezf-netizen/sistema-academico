import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { docentes, docentesMaterias } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';

// Helper para verificar rol de administrador
async function verificarAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return false;
  const payload = await verificarToken(token);
  return payload && payload.rol === 'admin';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const esAdmin = await verificarAdmin();
    if (!esAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);

    const docRecord = await db
      .select({ id: docentes.id })
      .from(docentes)
      .where(eq(docentes.usuarioId, targetUserId))
      .limit(1);

    if (docRecord.length === 0) {
      return NextResponse.json([]);
    }

    const list = await db
      .select({
        nivelId: docentesMaterias.nivelId,
        materiaId: docentesMaterias.materiaId,
      })
      .from(docentesMaterias)
      .where(eq(docentesMaterias.docenteId, docRecord[0].id));

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error al obtener materias del docente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
