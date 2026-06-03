import { mysqlTable, int, varchar, mysqlEnum, timestamp, date } from 'drizzle-orm/mysql-core';

export const roles = mysqlTable('roles', {
  id: int('id').primaryKey().autoincrement(),
  nombre: mysqlEnum('nombre', ['admin', 'docente', 'padre']).notNull(),
});

export const usuarios = mysqlTable('usuarios', {
  id: int('id').primaryKey().autoincrement(),
  cedula: varchar('cedula', { length: 10 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  rolId: int('rol_id').references(() => roles.id).notNull(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }),
  creadoEn: timestamp('creado_en').defaultNow(),
});

export const niveles = mysqlTable('niveles', {
  id: int('id').primaryKey().autoincrement(),
  nombre: varchar('nombre', { length: 50 }).unique().notNull(), // ej: inicial 1, 1egb, etc.
});

export const docentes = mysqlTable('docentes', {
  id: int('id').primaryKey().autoincrement(),
  usuarioId: int('usuario_id').references(() => usuarios.id).notNull(),
});

export const padres = mysqlTable('padres', {
  id: int('id').primaryKey().autoincrement(),
  usuarioId: int('usuario_id').references(() => usuarios.id).notNull(),
});

export const estudiantes = mysqlTable('estudiantes', {
  id: int('id').primaryKey().autoincrement(),
  cedula: varchar('cedula', { length: 10 }).unique(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  genero: mysqlEnum('genero', ['masculino', 'femenino', 'otro']),
  fechaNacimiento: date('fecha_nacimiento'),
  nivelId: int('nivel_id').references(() => niveles.id).notNull(),
  padreId: int('padre_id').references(() => padres.id).notNull(),
  creadoEn: timestamp('creado_en').defaultNow(),
});

export const materias = mysqlTable('materias', {
  id: int('id').primaryKey().autoincrement(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
});

export const docentesMaterias = mysqlTable('docentes_materias', {
  id: int('id').primaryKey().autoincrement(),
  docenteId: int('docente_id').references(() => docentes.id).notNull(),
  materiaId: int('materia_id').references(() => materias.id).notNull(),
  nivelId: int('nivel_id').references(() => niveles.id).notNull(),
});
