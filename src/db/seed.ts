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

    // 2. Crear usuarios de prueba si no existen
    console.log('Verificando usuarios...');
    const adminCedula = '1710034065';
    const docenteCedula = '1722210380';
    const padreCedula = '0926715103';

    const existingUsers = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.cedula, adminCedula));

    if (existingUsers.length === 0) {
      console.log('Insertando usuarios de prueba...');

      const claveAdmin = await bcrypt.hash('admin123', 10);
      const claveDocente = await bcrypt.hash('docente123', 10);
      const clavePadre = await bcrypt.hash('padre123', 10);

      await db.insert(usuarios).values([
        {
          cedula: adminCedula,
          password: claveAdmin,
          rolId: 1, // Admin
          nombre: 'Administrador General',
          email: 'admin@unidadeducativa.edu.ec',
        },
        {
          cedula: docenteCedula,
          password: claveDocente,
          rolId: 2, // Docente
          nombre: 'Prof. Jaime Rodríguez',
          email: 'jaime.docente@unidadeducativa.edu.ec',
        },
        {
          cedula: padreCedula,
          password: clavePadre,
          rolId: 3, // Padre
          nombre: 'Carlos Pérez (Padre de Familia)',
          email: 'carlos.padre@gmail.com',
        },
      ]);
      console.log('Usuarios de prueba creados con éxito.');
    } else {
      console.log('Los usuarios de prueba ya existen.');
    }

    console.log('✅ Base de datos sembrada con éxito.');
  } catch (error) {
    console.error('❌ Error durante la siembra de base de datos:', error);
  } finally {
    await connection.end();
  }
}

seed();
