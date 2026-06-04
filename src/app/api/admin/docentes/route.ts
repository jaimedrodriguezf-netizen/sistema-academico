import { NextResponse } from 'next/server';
import { db } from '@/db';
import { docentes, usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db
      .select({
        id: docentes.id,
        nombre: usuarios.nombre,
      })
      .from(docentes)
      .innerJoin(usuarios, eq(docentes.usuarioId, usuarios.id))
      .orderBy(usuarios.nombre);
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error al listar docentes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
