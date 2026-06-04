import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { usuarios, roles, docentes, padres, docentesMaterias } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';
import { validarCedula } from '@/lib/validador';
import bcrypt from 'bcryptjs';

// Helper para obtener el usuario autenticado y verificar rol admin
async function obtenerAdminAutenticado() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verificarToken(token);
  if (!payload || payload.rol !== 'admin') return null;
  return payload;
}

export async function GET() {
  try {
    const admin = await obtenerAdminAutenticado();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const list = await db
      .select({
        id: usuarios.id,
        cedula: usuarios.cedula,
        nombre: usuarios.nombre,
        email: usuarios.email,
        rolId: usuarios.rolId,
        creadoEn: usuarios.creadoEn,
        rol: roles.nombre,
      })
      .from(usuarios)
      .innerJoin(roles, eq(usuarios.rolId, roles.id));

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await obtenerAdminAutenticado();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { cedula, nombre, email, rolId } = body;

    // Validación básica de campos obligatorios
    if (!cedula || !nombre || !rolId) {
      return NextResponse.json(
        { error: 'Cédula, nombre y rol son obligatorios' },
        { status: 400 }
      );
    }

    // Validar rolId (1: admin, 2: docente, 3: padre)
    const roleIdNum = Number(rolId);
    if (![1, 2, 3].includes(roleIdNum)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Validar cédula ecuatoriana
    if (!validarCedula(cedula)) {
      return NextResponse.json(
        { error: 'Cédula ecuatoriana inválida' },
        { status: 400 }
      );
    }

    // Verificar si la cédula ya existe
    const usuariosExistentes = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.cedula, cedula));

    if (usuariosExistentes.length > 0) {
      return NextResponse.json(
        { error: 'La cédula ya está registrada' },
        { status: 409 }
      );
    }

    // Usar la cédula como contraseña inicial si no se provee una
    const passwordOriginal = body.password || cedula;
    const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const salt = await bcrypt.genSalt(bcryptRounds);
    const passwordHash = await bcrypt.hash(passwordOriginal, salt);

    const [result] = await db.insert(usuarios).values({
      cedula,
      nombre,
      email: email || null,
      rolId: roleIdNum,
      password: passwordHash,
    });

    const insertId = result.insertId || 0;

    // Sincronizar tablas auxiliares según el rol
    if (roleIdNum === 2) {
      const [docenteResult] = await db.insert(docentes).values({ usuarioId: insertId });
      const docenteId = docenteResult.insertId;
      
      const { docenteMaterias } = body;
      if (docenteId && Array.isArray(docenteMaterias)) {
        for (const dm of docenteMaterias) {
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
    } else if (roleIdNum === 3) {
      await db.insert(padres).values({ usuarioId: insertId });
    }

    return NextResponse.json(
      { success: true, usuarioId: insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
