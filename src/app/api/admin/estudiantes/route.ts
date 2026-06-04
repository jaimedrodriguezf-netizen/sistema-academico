import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { estudiantes, niveles, padres, usuarios } from '@/db/schema';
import { eq, like, and, sql, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 15)));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const filterNivelId = searchParams.get('nivelId');

    const conditions = [];
    if (filterNivelId) conditions.push(eq(estudiantes.nivelId, Number(filterNivelId)));
    if (search) {
      conditions.push(
        or(
          like(estudiantes.nombre, `%${search}%`),
          like(estudiantes.cedula, `%${search}%`),
          like(usuarios.nombre, `%${search}%`)
        )
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(estudiantes)
      .innerJoin(niveles, eq(estudiantes.nivelId, niveles.id))
      .innerJoin(padres, eq(estudiantes.padreId, padres.id))
      .innerJoin(usuarios, eq(padres.usuarioId, usuarios.id))
      .$dynamic()
      .where(whereClause);

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
      .innerJoin(usuarios, eq(padres.usuarioId, usuarios.id))
      .orderBy(estudiantes.nombre)
      .$dynamic()
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // Totals for stats (always full count, no filters)
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        masculino: sql<number>`sum(case when ${estudiantes.genero} = 'masculino' then 1 else 0 end)`,
        femenino: sql<number>`sum(case when ${estudiantes.genero} = 'femenino' then 1 else 0 end)`,
        niveles: sql<number>`count(distinct ${estudiantes.nivelId})`,
      })
      .from(estudiantes);

    return NextResponse.json({
      data: list,
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
      limit,
      stats: {
        total: Number(stats.total),
        masculino: Number(stats.masculino || 0),
        femenino: Number(stats.femenino || 0),
        niveles: Number(stats.niveles || 0),
      },
    });
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
