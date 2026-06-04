'use client';

import React, { useState, useEffect } from 'react';
import DocenteSidebar from './DocenteSidebar';

interface DocenteShellClientProps {
  docenteName: string;
  children: React.ReactNode;
}

export default function DocenteShellClient({ docenteName, children }: DocenteShellClientProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Load preferences from localStorage if available
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-open-docente');
    if (saved !== null) {
      setIsOpen(saved === 'true');
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    localStorage.setItem('sidebar-open-docente', String(nextState));
  };

  const handleMainClick = (e: React.MouseEvent) => {
    if (isOpen) {
      // Evitar cerrar si se hace clic dentro de un modal
      if ((e.target as HTMLElement).closest('.modal-overlay')) {
        return;
      }
      setIsOpen(false);
      localStorage.setItem('sidebar-open-docente', 'false');
    }
  };

  return (
    <div className={`admin-shell ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <DocenteSidebar docenteName={docenteName} onToggle={handleToggle} />
      
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="sidebar-open-btn-floating"
          style={{ borderColor: 'var(--role-docente)' }}
          aria-label="Mostrar menú"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <main className="admin-main" onClick={handleMainClick}>
        {children}
      </main>
    </div>
  );
}
