import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { usuarios, docentes, padres, docentesMaterias } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

    const newRolIdNum = Number(rolId);
    if (![1, 2, 3].includes(newRolIdNum)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    await db
      .update(usuarios)
      .set({
        nombre,
        email: email || null,
        rolId: newRolIdNum,
      })
      .where(eq(usuarios.id, targetUserId));

    // Sincronizar tablas auxiliares
    const { docenteMaterias: materiasAsignadas } = body;

    if (newRolIdNum === 2) {
      // Es docente, verificar si existe en docentes
      const existingDocente = await db.select().from(docentes).where(eq(docentes.usuarioId, targetUserId));
      let docenteId: number | undefined;
      if (existingDocente.length === 0) {
        const [insertResult] = await db.insert(docentes).values({ usuarioId: targetUserId });
        docenteId = insertResult.insertId;
      } else {
        docenteId = existingDocente[0]?.id;
      }

      // Limpiar asignaciones previas de este docente
      if (docenteId) {
        await db.delete(docentesMaterias).where(eq(docentesMaterias.docenteId, docenteId));

        // Insertar las nuevas asignaciones
        if (Array.isArray(materiasAsignadas)) {
          for (const dm of materiasAsignadas) {
            // Evitar colisión de restricción de unicidad eliminando asignación previa para esa materia y nivel
            await db.delete(docentesMaterias).where(
              and(
                eq(docentesMaterias.materiaId, Number(dm.materiaId)),
                eq(docentesMaterias.nivelId, Number(dm.nivelId))
              )
            );

            await db.insert(docentesMaterias).values({
              docenteId,
              materiaId: Number(dm.materiaId),
              nivelId: Number(dm.nivelId),
            });
          }
        }
      }
      
      // Eliminar de padres si existía
      await db.delete(padres).where(eq(padres.usuarioId, targetUserId));
    } else if (newRolIdNum === 3) {
      // Es padre, verificar si existe en padres
      const existingPadre = await db.select().from(padres).where(eq(padres.usuarioId, targetUserId));
      if (existingPadre.length === 0) {
        await db.insert(padres).values({ usuarioId: targetUserId });
      }
      
      // Limpiar de docentes y sus materias si existía
      const existingDocente = await db.select().from(docentes).where(eq(docentes.usuarioId, targetUserId));
      if (existingDocente.length > 0) {
        await db.delete(docentesMaterias).where(eq(docentesMaterias.docenteId, existingDocente[0].id));
      }
      await db.delete(docentes).where(eq(docentes.usuarioId, targetUserId));
    } else {
      // Otro rol (e.g. admin), eliminar de ambos
      const existingDocente = await db.select().from(docentes).where(eq(docentes.usuarioId, targetUserId));
      if (existingDocente.length > 0) {
        await db.delete(docentesMaterias).where(eq(docentesMaterias.docenteId, existingDocente[0].id));
      }
      await db.delete(docentes).where(eq(docentes.usuarioId, targetUserId));
      await db.delete(padres).where(eq(padres.usuarioId, targetUserId));
    }

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

    // Eliminar primero de tablas auxiliares para evitar errores de clave foránea
    await db.delete(docentes).where(eq(docentes.usuarioId, targetUserId));
    await db.delete(padres).where(eq(padres.usuarioId, targetUserId));

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
