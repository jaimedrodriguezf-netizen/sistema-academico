import { NextResponse } from 'next/server';
import { db } from '@/db';
import { niveles } from '@/db/schema';

export async function GET() {
  try {
    const list = await db.select().from(niveles).orderBy(niveles.nombre);
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error al listar niveles:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
