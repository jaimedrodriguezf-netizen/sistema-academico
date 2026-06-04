'use client';

import React, { useState, useEffect } from 'react';
import { validarCedula } from '@/lib/validador';

interface Usuario {
  id: number;
  cedula: string;
  nombre: string;
  email: string | null;
  rolId: number;
  creadoEn: string | null;
  rol: 'admin' | 'docente' | 'padre';
}

interface UsuariosClientProps {
  adminId?: number;
}

const ROL_COLORS: Record<number, string> = {
  1: 'var(--role-admin)',
  2: 'var(--role-docente)',
  3: 'var(--role-padre)',
};

export default function UsuariosClient({ adminId }: UsuariosClientProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

  // Form states — rol PRIMERO
  const [rolId, setRolId] = useState(2);
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/usuarios');
      if (res.ok) setUsuarios(await res.json());
      else showToast('Error al cargar la lista de usuarios', 'danger');
    } catch {
      showToast('Error de conexión al cargar usuarios', 'danger');
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const resetForm = () => {
    setRolId(2);
    setCedula('');
    setNombre('');
    setEmail('');
    setErrors({});
  };

  const openAddModal = () => {
    setEditingUsuario(null);
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setRolId(usuario.rolId);
    setCedula(usuario.cedula);
    setNombre(usuario.nombre);
    setEmail(usuario.email || '');
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    } else if (!validarCedula(cedula)) {
      newErrors.cedula = 'La cédula ecuatoriana ingresada no es válida';
    }

    if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido';

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El formato del correo electrónico no es válido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingUsuario) {
        const res = await fetch(`/api/admin/usuarios/${editingUsuario.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, email, rolId }),
        });
        if (res.ok) {
          showToast('Usuario actualizado correctamente', 'success');
          setModalOpen(false);
          fetchUsuarios();
        } else {
          const errData = await res.json();
          showToast(errData.error || 'Error al actualizar usuario', 'danger');
        }
      } else {
        const res = await fetch('/api/admin/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cedula, nombre, email, rolId }),
        });
        if (res.ok) {
          showToast('Usuario creado correctamente', 'success');
          setModalOpen(false);
          fetchUsuarios();
        } else {
          const errData = await res.json();
          showToast(errData.error || 'Error al crear usuario', 'danger');
        }
      }
    } catch {
      showToast('Error de conexión al procesar la solicitud', 'danger');
    }
  };

  const handleDelete = async (id: number, usuarioNombre: string) => {
    if (id === adminId) {
      showToast('No puedes eliminar tu propia cuenta de administrador', 'danger');
      return;
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${usuarioNombre}"?`)) return;

    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Usuario eliminado correctamente', 'success');
        fetchUsuarios();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Error al eliminar usuario', 'danger');
      }
    } catch {
      showToast('Error de conexión al eliminar usuario', 'danger');
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const query = search.toLowerCase();
    const matchesSearch =
      u.nombre.toLowerCase().includes(query) ||
      u.cedula.includes(query) ||
      (u.email && u.email.toLowerCase().includes(query));
    const matchesRol = rolFilter === '' || u.rolId === Number(rolFilter);
    return matchesSearch && matchesRol;
  });

  return (
    <div className="page-content">
      {/* Toast Notification */}
      {toast && (
        <div className={`alert-toast alert-toast-${toast.type}`} id="toast-notif">
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">Gestioná usuarios, asigná roles y controlá accesos.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal} id="btn-add-user">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
          </svg>
          Registrar Usuario
        </button>
      </header>

      {/* Controles */}
      <section className="controls-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre o cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="input-search"
          />
        </div>
        <select
          className="filter-select"
          value={rolFilter}
          onChange={(e) => setRolFilter(e.target.value)}
          id="select-filter-rol"
        >
          <option value="">Todos los Roles</option>
          <option value="1">Administradores</option>
          <option value="2">Docentes</option>
          <option value="3">Padres de Familia</option>
        </select>
      </section>

      {/* Tabla */}
      <section className="table-wrapper">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            Cargando base de datos...
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            No se encontraron usuarios registrados.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{user.cedula}</td>
                  <td style={{ fontWeight: 500 }}>
                    {user.nombre}{' '}
                    {user.id === adminId && (
                      <span style={{ color: 'var(--admin-primary)', fontSize: '0.8rem' }}>(Vos)</span>
                    )}
                  </td>
                  <td>
                    {user.email || (
                      <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>Sin correo</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${user.rol}`}>{user.rol}</span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon"
                        onClick={() => openEditModal(user)}
                        title="Editar usuario"
                        id={`btn-edit-${user.id}`}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-icon-delete"
                        onClick={() => handleDelete(user.id, user.nombre)}
                        disabled={user.id === adminId}
                        title={user.id === adminId ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                        id={`btn-delete-${user.id}`}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Modal de Registro / Edición */}
      {modalOpen && (
        <div className="modal-overlay" id="modal-form-user">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <header className="modal-header">
              <h2>{editingUsuario ? 'Modificar Usuario' : 'Registrar Nuevo Usuario'}</h2>
              <button className="btn-icon" onClick={() => setModalOpen(false)} aria-label="Cerrar">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </header>

            <form onSubmit={handleSave}>
              <div className="modal-body">

                {/* ── 1. ROL (primero, pill buttons) ─────────────────── */}
                <div className="form-group">
                  <label>Rol del Usuario</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    {[
                      { id: 1, label: 'Administrador', icon: '🛡️' },
                      { id: 2, label: 'Docente', icon: '👨‍🏫' },
                      { id: 3, label: 'Padre / Tutor', icon: '👪' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRolId(r.id)}
                        disabled={editingUsuario?.id === adminId && r.id !== 1}
                        style={{
                          flex: 1,
                          padding: '12px 8px',
                          borderRadius: 'var(--r-md)',
                          border: `2px solid ${rolId === r.id ? ROL_COLORS[r.id] : 'var(--border-std)'}`,
                          background:
                            rolId === r.id
                              ? `rgba(${r.id === 1 ? '99,102,241' : r.id === 2 ? '16,185,129' : '245,158,11'}, 0.10)`
                              : 'var(--ink-950)',
                          color: rolId === r.id ? ROL_COLORS[r.id] : 'var(--text-secondary)',
                          fontWeight: rolId === r.id ? 700 : 500,
                          fontSize: '0.82rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          opacity: editingUsuario?.id === adminId && r.id !== 1 ? 0.4 : 1,
                        }}
                      >
                        <span style={{ fontSize: '1.4rem' }}>{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  {editingUsuario?.id === adminId && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-warning)', display: 'block', marginTop: '0.4rem' }}>
                      No podés cambiar tu propio rol de administrador.
                    </span>
                  )}
                </div>

                {/* Separator */}
                <div style={{ height: '1px', background: 'var(--border-soft)', margin: '4px 0 12px' }} />

                {/* ── 2. Cédula ─────────────────────────────────────── */}
                <div className="form-group">
                  <label htmlFor="form-cedula">Número de Cédula (Ecuatoriana)</label>
                  <input
                    type="text"
                    id="form-cedula"
                    className="form-input"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                    disabled={!!editingUsuario}
                    maxLength={10}
                    placeholder="Ej: 1710034057"
                  />
                  {errors.cedula && <span className="invalid-feedback">{errors.cedula}</span>}
                </div>

                {/* ── 3. Nombre ─────────────────────────────────────── */}
                <div className="form-group">
                  <label htmlFor="form-nombre">Nombre y Apellido completo</label>
                  <input
                    type="text"
                    id="form-nombre"
                    className="form-input"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder={rolId === 2 ? 'Ej: Prof. Ana García' : 'Ej: Juan Pérez'}
                  />
                  {errors.nombre && <span className="invalid-feedback">{errors.nombre}</span>}
                </div>

                {/* ── 4. Email ──────────────────────────────────────── */}
                <div className="form-group">
                  <label htmlFor="form-email">Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    id="form-email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: juan@unidadeducativa.edu.ec"
                  />
                  {errors.email && <span className="invalid-feedback">{errors.email}</span>}
                </div>

                {/* Hint para docentes */}
                {rolId === 2 && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--role-docente-soft)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: 'var(--r-md)',
                    fontSize: '0.82rem',
                    color: 'var(--role-docente)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '4px',
                  }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Para asignar materias y niveles al docente, usá el módulo <strong>Materias</strong> del menú lateral.
                  </div>
                )}

                {!editingUsuario && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontStyle: 'italic', marginTop: '12px' }}>
                    * La contraseña inicial por defecto del usuario será su número de cédula.
                  </p>
                )}
              </div>

              <footer className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" id="btn-save-user">
                  {editingUsuario ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
