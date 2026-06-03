import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { usuarios, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validarCedula } from '@/lib/validador';
import { firmarToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { cedula, password } = await request.json();

    if (!cedula || !password) {
      return NextResponse.json(
        { error: 'Cédula y contraseña son requeridas.' },
        { status: 400 }
      );
    }

    // 1. Validar cédula ecuatoriana
    if (!validarCedula(cedula)) {
      return NextResponse.json(
        { error: 'Cédula inválida. Por favor, revise el número.' },
        { status: 400 }
      );
    }

    // 2. Buscar usuario con su rol
    const users = await db
      .select({
        id: usuarios.id,
        cedula: usuarios.cedula,
        password: usuarios.password,
        nombre: usuarios.nombre,
        rol: roles.nombre,
      })
      .from(usuarios)
      .innerJoin(roles, eq(usuarios.rolId, roles.id))
      .where(eq(usuarios.cedula, cedula));

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas.' },
        { status: 401 }
      );
    }

    const usuario = users[0];

    // 3. Validar contraseña
    const esPasswordValido = await bcrypt.compare(password, usuario.password);
    if (!esPasswordValido) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas.' },
        { status: 401 }
      );
    }

    // 4. Firmar token JWT
    const token = await firmarToken({
      usuarioId: usuario.id,
      rol: usuario.rol,
      cedula: usuario.cedula,
    });

    // 5. Configurar Cookie segura (Next 16: cookies() es asíncrono)
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 2, // 2 horas
      path: '/',
    });

    return NextResponse.json({
      success: true,
      rol: usuario.rol,
      nombre: usuario.nombre,
    });
  } catch (error) {
    console.error('Error en login handler:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error interno en el servidor.' },
      { status: 500 }
    );
  }
}
