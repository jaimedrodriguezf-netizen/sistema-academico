import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { usuarios, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validarCedula } from '@/lib/validador';
import bcrypt from 'bcryptjs';

export async function GET(_request: NextRequest) {
  try {
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
    const body = await request.json();
    const { cedula, nombre, email, rolId } = body;

    // Validación básica de campos obligatorios
    if (!cedula || !nombre || !rolId) {
      return NextResponse.json(
        { error: 'Cédula, nombre y rol son obligatorios' },
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
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordOriginal, salt);

    const result = await db.insert(usuarios).values({
      cedula,
      nombre,
      email: email || null,
      rolId,
      password: passwordHash,
    });

    interface InsertResultHeader {
      insertId?: number;
    }

    const insertResult = (result as unknown as InsertResultHeader[])[0];
    const insertId = insertResult?.insertId || 0;

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
