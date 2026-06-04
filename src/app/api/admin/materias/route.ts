import { NextResponse } from 'next/server';
import { db } from '@/db';
import { materias } from '@/db/schema';

export async function GET() {
  try {
    const list = await db.select().from(materias).orderBy(materias.nombre);
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error al listar materias:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
