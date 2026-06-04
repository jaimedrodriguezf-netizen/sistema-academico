'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface DocenteSidebarProps {
  docenteName: string;
  onToggle: () => void;
}

const navItems = [
  {
    href: '/docente',
    label: 'Registrar Asistencia',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/docente/reportes',
    label: 'Reportes de Clase',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    disabled: true,
  },
];

export default function DocenteSidebar({ docenteName, onToggle }: DocenteSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  return (
    <aside className="admin-sidebar" aria-label="Navegación del portal de docentes">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" aria-hidden="true">
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">SisAcadémico</span>
          <span className="sidebar-brand-role" style={{ color: 'var(--role-docente)' }}>Portal Docentes</span>
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={onToggle}
          aria-label="Ocultar menú"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Navegación principal">
        <p className="sidebar-nav-label">Académico</p>
        <ul className="sidebar-nav-list" role="list">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} role="listitem">
                {item.disabled ? (
                  <span
                    className="sidebar-nav-item sidebar-nav-item--disabled"
                    aria-disabled="true"
                    title="Próximamente"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <span className="sidebar-badge-soon">Pronto</span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
                    style={isActive ? { color: 'var(--role-docente)', backgroundColor: 'var(--role-docente-soft)', borderColor: 'var(--role-docente)' } : {}}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {isActive && <span className="sidebar-active-dot" style={{ backgroundColor: 'var(--role-docente)' }} aria-hidden="true" />}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: User info + Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" style={{ color: 'var(--role-docente)', backgroundColor: 'var(--role-docente-soft)', borderColor: 'var(--role-docente)' }} aria-hidden="true">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name" title={docenteName}>{docenteName}</span>
            <span className="sidebar-user-badge" style={{ color: 'var(--role-docente)' }}>Docente</span>
          </div>
        </div>
        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          id="btn-logout"
          aria-label="Cerrar sesión"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="sidebar-logout-text">{loggingOut ? 'Saliendo…' : 'Cerrar sesión'}</span>
        </button>
      </div>
    </aside>
  );
}
