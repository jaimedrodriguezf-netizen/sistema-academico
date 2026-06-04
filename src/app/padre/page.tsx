import { cookies } from 'next/headers';
import { verificarToken } from '@/lib/auth';
import { db } from '@/db';
import { estudiantes, niveles, padres, usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Import shared CSS for dashboard, tables and badges
import '@/app/styles/usuarios.css';
import '@/app/styles/estudiantes.css';

export const metadata = {
  title: 'Mi Panel | Portal de Padres',
  description: 'Portal de padres de familia del sistema académico',
};

export default async function PadrePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? await verificarToken(token) : null;

  if (!user) {
    throw new Error('No autorizado');
  }

  // 1. Obtener datos del usuario desde la DB para el nombre real
  const userRecord = await db
    .select({ nombre: usuarios.nombre })
    .from(usuarios)
    .where(eq(usuarios.id, user.usuarioId))
    .limit(1);

  const parentName = userRecord[0]?.nombre || `Padre #${user.usuarioId}`;

  // 2. Obtener registro de padre asociado al usuario
  const parentRecords = await db
    .select()
    .from(padres)
    .where(eq(padres.usuarioId, user.usuarioId))
    .limit(1);

  const padreInfo = parentRecords[0];

  let childrenList: Array<{
    id: number;
    nombre: string;
    cedula: string | null;
    genero: 'masculino' | 'femenino' | 'otro' | null;
    fechaNacimiento: Date | string | null;
    nivel: string;
  }> = [];

  if (padreInfo) {
    // 3. Obtener la lista de estudiantes (hijos) del padre
    childrenList = await db
      .select({
        id: estudiantes.id,
        nombre: estudiantes.nombre,
        cedula: estudiantes.cedula,
        genero: estudiantes.genero,
        fechaNacimiento: estudiantes.fechaNacimiento,
        nivel: niveles.nombre,
      })
      .from(estudiantes)
      .innerJoin(niveles, eq(estudiantes.nivelId, niveles.id))
      .where(eq(estudiantes.padreId, padreInfo.id));
  }

  // Helpers de visualización
  const formatFecha = (f: Date | string | null) => {
    if (!f) return 'No registrado';
    if (f instanceof Date) {
      const dia = String(f.getUTCDate()).padStart(2, '0');
      const mes = String(f.getUTCMonth() + 1).padStart(2, '0');
      const anio = f.getUTCFullYear();
      return `${dia}/${mes}/${anio}`;
    }
    // f es string YYYY-MM-DD
    const partes = f.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return f;
  };

  const getGenderBadge = (g: string | null) => {
    if (!g) return <span className="badge-genero-otro">No especificado</span>;
    if (g === 'masculino') return <span className="badge-genero-masculino">Varón</span>;
    if (g === 'femenino') return <span className="badge-genero-femenino">Mujer</span>;
    return <span className="badge-genero-otro">Otro</span>;
  };

  const totalHijos = childrenList.length;
  const nivelesDiferentes = new Set(childrenList.map((h) => h.nivel)).size;

  return (
    <div className="main-content" style={{ padding: '24px' }}>
      <header className="page-header">
        <div className="page-header-text">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>👪</span>
            Portal de Padres de Familia
          </h1>
          <p className="page-subtitle">Bienvenido, {parentName}. Aquí podés revisar la información de tus representados.</p>
        </div>
      </header>

      {/* Tarjetas de estadísticas */}
      <div className="stats-row" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-label">Hijos Representados</span>
          <span className="stat-value">{totalHijos}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Niveles Activos</span>
          <span className="stat-value">{nivelesDiferentes}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Estado de Matrícula</span>
          <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--success)', marginTop: '8px', fontWeight: 700 }}>
            ACTIVO
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Periodo Lectivo</span>
          <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--brand)', marginTop: '8px', fontWeight: 700 }}>
            {new Date().getFullYear()} - {new Date().getFullYear() + 1}
          </span>
        </div>
      </div>

      {/* Lista de estudiantes */}
      <div className="table-container">
        <div className="table-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-soft)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Estudiantes Vinculados</h2>
        </div>

        {childrenList.length === 0 ? (
          <div className="table-empty">
            <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>📭 No tenés estudiantes registrados a tu nombre.</p>
            <p style={{ color: 'var(--text-muted)' }}>Contactate con el administrador del sistema para asociar a tus hijos.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="main-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cédula</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nivel</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Género</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>F. Nacimiento</th>
                </tr>
              </thead>
              <tbody>
                {childrenList.map((estudiante) => (
                  <tr key={estudiante.id} className="table-row" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>{estudiante.nombre}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{estudiante.cedula || 'No registrada'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className="badge-nivel" style={{ color: 'var(--role-padre)', borderColor: 'var(--role-padre-soft)', backgroundColor: 'var(--role-padre-soft)' }}>
                        {estudiante.nivel}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>{getGenderBadge(estudiante.genero)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{formatFecha(estudiante.fechaNacimiento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
