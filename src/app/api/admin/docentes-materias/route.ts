import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { docentesMaterias, docentes, usuarios, materias, niveles, estudiantes } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 15)));
    const offset = (page - 1) * limit;
    const filterNivelId = searchParams.get('nivelId');
    const filterDocenteId = searchParams.get('docenteId');

    // Build where conditions
    const conditions = [];
    if (filterNivelId) conditions.push(eq(docentesMaterias.nivelId, Number(filterNivelId)));
    if (filterDocenteId) conditions.push(eq(docentesMaterias.docenteId, Number(filterDocenteId)));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(docentesMaterias)
      .innerJoin(docentes, eq(docentesMaterias.docenteId, docentes.id))
      .innerJoin(usuarios, eq(docentes.usuarioId, usuarios.id))
      .innerJoin(materias, eq(docentesMaterias.materiaId, materias.id))
      .innerJoin(niveles, eq(docentesMaterias.nivelId, niveles.id))
      .$dynamic()
      .where(whereClause);

    const list = await db
      .select({
        id: docentesMaterias.id,
        docenteId: docentesMaterias.docenteId,
        materiaId: docentesMaterias.materiaId,
        nivelId: docentesMaterias.nivelId,
        docenteNombre: usuarios.nombre,
        materiaNombre: materias.nombre,
        nivelNombre: niveles.nombre,
      })
      .from(docentesMaterias)
      .innerJoin(docentes, eq(docentesMaterias.docenteId, docentes.id))
      .innerJoin(usuarios, eq(docentes.usuarioId, usuarios.id))
      .innerJoin(materias, eq(docentesMaterias.materiaId, materias.id))
      .innerJoin(niveles, eq(docentesMaterias.nivelId, niveles.id))
      .orderBy(niveles.nombre, materias.nombre)
      .$dynamic()
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // Student counts for this page only
    const nivelIds = [...new Set(list.map((i) => i.nivelId))];
    const studentCounts = nivelIds.length > 0
      ? await db
          .select({ nivelId: estudiantes.nivelId, count: sql<number>`count(${estudiantes.id})` })
          .from(estudiantes)
          .where(sql`${estudiantes.nivelId} in (${sql.join(nivelIds.map((id) => sql`${id}`), sql`, `)})`)
          .groupBy(estudiantes.nivelId)
      : [];

    const countsMap = new Map(studentCounts.map((c) => [c.nivelId, Number(c.count)]));
    const data = list.map((item) => ({ ...item, estudiantesCount: countsMap.get(item.nivelId) || 0 }));

    return NextResponse.json({
      data,
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
      limit,
    });
  } catch (error) {
    console.error('Error al listar docentes-materias:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Batch mode: { docenteId, asignaciones: [{materiaId, nivelId}] } ──
    if (Array.isArray(body.asignaciones)) {
      const dId = Number(body.docenteId);
      if (!dId) {
        return NextResponse.json({ error: 'El docente es obligatorio' }, { status: 400 });
      }

      const rows = body.asignaciones as Array<{ materiaId: string | number; nivelId: string | number }>;
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Debés agregar al menos una materia' }, { status: 400 });
      }

      let insertadas = 0;
      let omitidas = 0;

      for (const row of rows) {
        const mId = Number(row.materiaId);
        const nId = Number(row.nivelId);
        if (!mId || !nId) { omitidas++; continue; }

        const existentes = await db
          .select()
          .from(docentesMaterias)
          .where(and(eq(docentesMaterias.materiaId, mId), eq(docentesMaterias.nivelId, nId)))
          .limit(1);

        if (existentes.length > 0) { omitidas++; continue; }

        await db.insert(docentesMaterias).values({ docenteId: dId, materiaId: mId, nivelId: nId });
        insertadas++;
      }

      return NextResponse.json({ success: true, insertadas, omitidas }, { status: 201 });
    }

    // ── Single mode: { docenteId, materiaId, nivelId } ──
    const { docenteId, materiaId, nivelId } = body;

    if (!docenteId || !materiaId || !nivelId) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    const dId = Number(docenteId);
    const mId = Number(materiaId);
    const nId = Number(nivelId);

    const existentes = await db
      .select()
      .from(docentesMaterias)
      .where(and(eq(docentesMaterias.materiaId, mId), eq(docentesMaterias.nivelId, nId)))
      .limit(1);

    if (existentes.length > 0) {
      return NextResponse.json(
        { error: 'Esta materia ya está asignada a este nivel' },
        { status: 409 }
      );
    }

    await db.insert(docentesMaterias).values({ docenteId: dId, materiaId: mId, nivelId: nId });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error al crear asignación de materia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
