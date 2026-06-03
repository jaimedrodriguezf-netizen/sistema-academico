import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { estudiantes, niveles, padres, usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db
      .select({
        id: estudiantes.id,
        cedula: estudiantes.cedula,
        nombre: estudiantes.nombre,
        genero: estudiantes.genero,
        fechaNacimiento: estudiantes.fechaNacimiento,
        nivelId: estudiantes.nivelId,
        nivelNombre: niveles.nombre,
        padreId: estudiantes.padreId,
        padreNombre: usuarios.nombre,
        creadoEn: estudiantes.creadoEn,
      })
      .from(estudiantes)
      .innerJoin(niveles, eq(estudiantes.nivelId, niveles.id))
      .innerJoin(padres, eq(estudiantes.padreId, padres.id))
      .innerJoin(usuarios, eq(padres.usuarioId, usuarios.id));

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error al listar estudiantes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, nivelId, padreId, cedula, genero, fechaNacimiento } = body;

    if (!nombre || !nivelId || !padreId) {
      return NextResponse.json(
        { error: 'Nombre, nivel y padre son obligatorios' },
        { status: 400 }
      );
    }

    if (cedula && cedula.length > 0) {
      const existente = await db
        .select({ id: estudiantes.id })
        .from(estudiantes)
        .where(eq(estudiantes.cedula, cedula));
      if (existente.length > 0) {
        return NextResponse.json({ error: 'La cédula del estudiante ya está registrada' }, { status: 409 });
      }
    }

    interface InsertResultHeader { insertId?: number; }

    const result = await db.insert(estudiantes).values({
      nombre,
      nivelId: Number(nivelId),
      padreId: Number(padreId),
      cedula: cedula || null,
      genero: genero || null,
      fechaNacimiento: fechaNacimiento || null,
    });

    const insertResult = (result as unknown as InsertResultHeader[])[0];
    const insertId = insertResult?.insertId || 0;

    return NextResponse.json({ success: true, estudianteId: insertId }, { status: 201 });
  } catch (error) {
    console.error('Error al crear estudiante:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
