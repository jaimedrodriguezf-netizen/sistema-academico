import Link from 'next/link';
import './landing.css';

export default function Home() {
  return (
    <div className="landing-wrapper">
      {/* Hero Section */}
      <header className="hero-section">
        <h1 className="hero-title">Sistema de Gestión Académica</h1>
        <p className="hero-subtitle">
          Plataforma educativa unificada para el control de asistencias, gestión de notas, 
          y comunicación institucional.
        </p>
        <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', margin: '0 auto' }}>
          Ingresar al Portal
        </Link>
      </header>

      {/* Grid de Portales */}
      <main className="portal-grid">
        {/* Portal Admin */}
        <Link href="/admin/usuarios" className="portal-card portal-card-admin">
          <div className="portal-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
          </div>
          <h2 className="portal-title">Administrador</h2>
          <p className="portal-desc">
            Gestión completa de usuarios, asignación de roles, auditoría de accesos y configuración del sistema.
          </p>
          <button className="btn-card">Entrar</button>
        </Link>

        {/* Portal Docente */}
        <Link href="/docente" className="portal-card portal-card-docente">
          <div className="portal-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h2 className="portal-title">Docente</h2>
          <p className="portal-desc">
            Registro diario de asistencias, planificación de materias, y seguimiento académico de los estudiantes.
          </p>
          <button className="btn-card">Entrar</button>
        </Link>

        {/* Portal Padre */}
        <Link href="/padre" className="portal-card portal-card-padre">
          <div className="portal-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h2 className="portal-title">Padres de Familia</h2>
          <p className="portal-desc">
            Visualización en tiempo real de la asistencia de los estudiantes y reportes institucionales.
          </p>
          <button className="btn-card">Entrar</button>
        </Link>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Unidad Educativa. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
