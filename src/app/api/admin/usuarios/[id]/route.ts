import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';

// Helper para obtener el usuario autenticado y verificar rol admin
async function obtenerAdminAutenticado() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verificarToken(token);
  if (!payload || payload.rol !== 'admin') return null;
  return payload;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await obtenerAdminAutenticado();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);

    const body = await request.json();
    const { nombre, email, rolId } = body;

    // Validación básica
    if (!nombre || !rolId) {
      return NextResponse.json(
        { error: 'Nombre y rol son obligatorios' },
        { status: 400 }
      );
    }

    // Prevención de auto-degradación: El admin no puede cambiar su propio rolId
    // Asumimos que el rolId de admin es 1
    if (targetUserId === admin.usuarioId && Number(rolId) !== 1) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol de administrador' },
        { status: 400 }
      );
    }

    await db
      .update(usuarios)
      .set({
        nombre,
        email: email || null,
        rolId: Number(rolId),
      })
      .where(eq(usuarios.id, targetUserId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await obtenerAdminAutenticado();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);

    // Prevención de auto-eliminación
    if (targetUserId === admin.usuarioId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta de administrador' },
        { status: 400 }
      );
    }

    await db.delete(usuarios).where(eq(usuarios.id, targetUserId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
