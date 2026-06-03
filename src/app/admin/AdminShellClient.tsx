'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminShellClientProps {
  adminId: number;
  children: React.ReactNode;
}

export default function AdminShellClient({ adminId, children }: AdminShellClientProps) {
  const [isOpen, setIsOpen] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-open');
    if (saved !== null) {
      setIsOpen(saved === 'true');
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    localStorage.setItem('sidebar-open', String(nextState));
  };

  return (
    <div className={`admin-shell ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <AdminSidebar adminId={adminId} isOpen={isOpen} onToggle={handleToggle} />
      
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="sidebar-open-btn-floating"
          aria-label="Mostrar menú"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
