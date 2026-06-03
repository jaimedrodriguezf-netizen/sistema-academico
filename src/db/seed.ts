import { db, connection } from './index';
import { roles, usuarios } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Iniciando la siembra de la base de datos (Seed)...');

  try {
    // 1. Insertar roles básicos si no existen
    console.log('Verificando roles...');
    const existingRoles = await db.select().from(roles);
    
    if (existingRoles.length === 0) {
      console.log('Insertando roles básicos...');
      await db.insert(roles).values([
        { id: 1, nombre: 'admin' },
        { id: 2, nombre: 'docente' },
        { id: 3, nombre: 'padre' },
      ]);
      console.log('Roles creados con éxito.');
    } else {
      console.log('Los roles ya existen en la base de datos.');
    }

    // 2. Crear usuarios de prueba si no existen de forma individual
    console.log('Verificando usuarios...');

    const insertarUsuarioSiNoExiste = async (
      cedula: string,
      nombre: string,
      email: string,
      rolId: number,
      clavePlana: string
    ) => {
      const existe = await db.select().from(usuarios).where(eq(usuarios.cedula, cedula));
      if (existe.length === 0) {
        const hash = await bcrypt.hash(clavePlana, 10);
        await db.insert(usuarios).values({
          cedula,
          password: hash,
          rolId,
          nombre,
          email,
        });
        console.log(`Usuario "${nombre}" creado.`);
      } else {
        console.log(`Usuario "${nombre}" ya existe.`);
      }
    };

    await insertarUsuarioSiNoExiste('1710034065', 'Administrador General', 'admin@unidadeducativa.edu.ec', 1, 'admin123');
    await insertarUsuarioSiNoExiste('1710034057', 'Administrador Académico', 'admin@academico.com', 1, 'danro32676');
    await insertarUsuarioSiNoExiste('1722210380', 'Prof. Jaime Rodríguez', 'jaime.docente@unidadeducativa.edu.ec', 2, 'docente123');
    await insertarUsuarioSiNoExiste('0926715103', 'Carlos Pérez (Padre de Familia)', 'carlos.padre@gmail.com', 3, 'padre123');

    console.log('✅ Base de datos sembrada con éxito.');
  } catch (error) {
    console.error('❌ Error durante la siembra de base de datos:', error);
  } finally {
    await connection.end();
  }
}

seed();
