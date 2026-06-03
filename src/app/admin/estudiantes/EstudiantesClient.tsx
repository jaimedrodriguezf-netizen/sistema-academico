'use client';

import React, { useState, useEffect } from 'react';

interface Nivel { id: number; nombre: string; }
interface Padre { id: number; nombre: string; cedula: string; }
interface Estudiante {
  id: number;
  cedula: string | null;
  nombre: string;
  genero: 'masculino' | 'femenino' | 'otro' | null;
  fechaNacimiento: string | null;
  nivelId: number;
  nivelNombre: string;
  padreId: number;
  padreNombre: string;
  creadoEn: string | null;
}

const GENERO_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
};

export default function EstudiantesClient() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [padres, setPadres] = useState<Padre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null);

  // Form
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [genero, setGenero] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [nivelId, setNivelId] = useState('');
  const [padreId, setPadreId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEstudiantes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/estudiantes');
      if (res.ok) setEstudiantes(await res.json());
      else showToast('Error al cargar estudiantes', 'danger');
    } catch {
      showToast('Error de conexión', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectors = async () => {
    const [nivelesRes, padresRes] = await Promise.all([
      fetch('/api/admin/niveles'),
      fetch('/api/admin/padres'),
    ]);
    if (nivelesRes.ok) setNiveles(await nivelesRes.json());
    if (padresRes.ok) setPadres(await padresRes.json());
  };

  useEffect(() => {
    fetchEstudiantes();
    fetchSelectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setNombre(''); setCedula(''); setGenero('');
    setFechaNacimiento(''); setNivelId(''); setPadreId('');
    setErrors({});
  };

  const openAddModal = () => {
    setEditingEstudiante(null);
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (est: Estudiante) => {
    setEditingEstudiante(est);
    setNombre(est.nombre);
    setCedula(est.cedula || '');
    setGenero(est.genero || '');
    setFechaNacimiento(est.fechaNacimiento ? est.fechaNacimiento.substring(0, 10) : '');
    setNivelId(String(est.nivelId));
    setPadreId(String(est.padreId));
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!nivelId) newErrors.nivelId = 'El nivel es obligatorio';
    if (!padreId) newErrors.padreId = 'El padre/tutor es obligatorio';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      cedula: cedula.trim() || null,
      genero: genero || null,
      fechaNacimiento: fechaNacimiento || null,
      nivelId: Number(nivelId),
      padreId: Number(padreId),
    };

    try {
      const url = editingEstudiante
        ? `/api/admin/estudiantes/${editingEstudiante.id}`
        : '/api/admin/estudiantes';
      const method = editingEstudiante ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Error al guardar', 'danger');
        return;
      }

      showToast(
        editingEstudiante ? 'Estudiante actualizado con éxito' : 'Estudiante registrado con éxito',
        'success'
      );
      setModalOpen(false);
      fetchEstudiantes();
    } catch {
      showToast('Error de conexión al guardar', 'danger');
    }
  };

  const handleDelete = async (id: number, nombreEst: string) => {
    if (!confirm(`¿Eliminar al estudiante "${nombreEst}"? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`/api/admin/estudiantes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al eliminar', 'danger');
        return;
      }
      showToast('Estudiante eliminado', 'success');
      fetchEstudiantes();
    } catch {
      showToast('Error de conexión al eliminar', 'danger');
    }
  };

  const filtered = estudiantes.filter((est) => {
    const q = search.toLowerCase();
    const matchSearch =
      est.nombre.toLowerCase().includes(q) ||
      (est.cedula && est.cedula.includes(q)) ||
      est.padreNombre.toLowerCase().includes(q);
    const matchNivel = nivelFilter === '' || est.nivelId === Number(nivelFilter);
    return matchSearch && matchNivel;
  });

  return (
    <div className="page-content">
      {/* Toast */}
      {toast && (
        <div className={`alert-toast alert-toast-${toast.type}`} id="toast-notif">
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Estudiantes</h1>
          <p className="page-subtitle">Registrá y gestioná el padrón de estudiantes de la institución.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal} id="btn-add-estudiante">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
          </svg>
          Registrar Estudiante
        </button>
      </header>

      {/* Estadísticas rápidas */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{estudiantes.length}</span>
          <span className="stat-label">Total estudiantes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{estudiantes.filter(e => e.genero === 'masculino').length}</span>
          <span className="stat-label">Varones</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{estudiantes.filter(e => e.genero === 'femenino').length}</span>
          <span className="stat-label">Mujeres</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{new Set(estudiantes.map(e => e.nivelId)).size}</span>
          <span className="stat-label">Niveles activos</span>
        </div>
      </div>

      {/* Controles */}
      <section className="controls-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, cédula o padre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="input-search-estudiante"
          />
        </div>
        <select
          className="filter-select"
          value={nivelFilter}
          onChange={(e) => setNivelFilter(e.target.value)}
          id="select-filter-nivel"
        >
          <option value="">Todos los niveles</option>
          {niveles.map(n => (
            <option key={n.id} value={n.id}>{n.nombre}</option>
          ))}
        </select>
      </section>

      {/* Tabla */}
      <section className="table-wrapper">
        {loading ? (
          <div className="table-empty">Cargando estudiantes…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            {search || nivelFilter ? 'Sin resultados para la búsqueda.' : 'No hay estudiantes registrados aún.'}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Nivel</th>
                <th>Padre/Tutor</th>
                <th>Género</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((est) => (
                <tr key={est.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{est.nombre}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                    {est.cedula || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Sin cédula</span>}
                  </td>
                  <td>
                    <span className="badge badge-nivel">{est.nivelNombre}</span>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{est.padreNombre}</td>
                  <td>
                    {est.genero
                      ? <span className={`badge badge-genero-${est.genero}`}>{GENERO_LABELS[est.genero]}</span>
                      : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>—</span>
                    }
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon"
                        onClick={() => openEditModal(est)}
                        title="Editar estudiante"
                        id={`btn-edit-est-${est.id}`}
                      >
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-icon-delete"
                        onClick={() => handleDelete(est.id, est.nombre)}
                        title="Eliminar estudiante"
                        id={`btn-delete-est-${est.id}`}
                      >
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" id="modal-form-estudiante">
          <div className="modal-content">
            <header className="modal-header">
              <h2>{editingEstudiante ? 'Editar Estudiante' : 'Registrar Estudiante'}</h2>
              <button className="btn-icon" onClick={() => setModalOpen(false)} aria-label="Cerrar">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </header>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="form-est-nombre">Nombre completo *</label>
                    <input
                      type="text"
                      id="form-est-nombre"
                      className="form-input"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Juan Carlos Pérez"
                    />
                    {errors.nombre && <span className="invalid-feedback">{errors.nombre}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="form-est-cedula">Cédula (opcional)</label>
                    <input
                      type="text"
                      id="form-est-cedula"
                      className="form-input"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      placeholder="Ej: 1710034057"
                      disabled={!!editingEstudiante && !!editingEstudiante.cedula}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="form-est-genero">Género</label>
                    <select
                      id="form-est-genero"
                      className="form-input"
                      value={genero}
                      onChange={(e) => setGenero(e.target.value)}
                    >
                      <option value="">Sin especificar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="form-est-fecha">Fecha de nacimiento</label>
                    <input
                      type="date"
                      id="form-est-fecha"
                      className="form-input"
                      value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="form-est-nivel">Nivel *</label>
                    <select
                      id="form-est-nivel"
                      className="form-input"
                      value={nivelId}
                      onChange={(e) => setNivelId(e.target.value)}
                    >
                      <option value="">— Seleccioná un nivel —</option>
                      {niveles.map(n => (
                        <option key={n.id} value={n.id}>{n.nombre}</option>
                      ))}
                    </select>
                    {errors.nivelId && <span className="invalid-feedback">{errors.nivelId}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="form-est-padre">Padre / Tutor *</label>
                    <select
                      id="form-est-padre"
                      className="form-input"
                      value={padreId}
                      onChange={(e) => setPadreId(e.target.value)}
                    >
                      <option value="">— Seleccioná un padre —</option>
                      {padres.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} ({p.cedula})</option>
                      ))}
                    </select>
                    {errors.padreId && <span className="invalid-feedback">{errors.padreId}</span>}
                    {padres.length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--warning)', display: 'block', marginTop: '0.375rem' }}>
                        No hay padres/tutores registrados. Registrá primero un usuario con rol Padre.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <footer className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" id="btn-save-estudiante">
                  {editingEstudiante ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
