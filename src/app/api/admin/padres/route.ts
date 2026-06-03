import { NextResponse } from 'next/server';
import { db } from '@/db';
import { padres, usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db
      .select({
        id: padres.id,
        nombre: usuarios.nombre,
        cedula: usuarios.cedula,
      })
      .from(padres)
      .innerJoin(usuarios, eq(padres.usuarioId, usuarios.id))
      .orderBy(usuarios.nombre);
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error al listar padres:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
