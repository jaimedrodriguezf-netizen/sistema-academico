'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const PAGE_SIZE = 15;

function Pagination({
  page, totalPages, onPage,
}: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', padding: '20px 0 4px' }}>
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="btn-icon"
        style={{ opacity: page === 1 ? 0.35 : 1 }} aria-label="Anterior">
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      {pages.map((p) => (
        <button key={p} onClick={() => onPage(p)} style={{
          minWidth: '34px', height: '34px', borderRadius: 'var(--r-md)',
          border: `1.5px solid ${p === page ? 'var(--brand)' : 'var(--border-std)'}`,
          background: p === page ? 'var(--brand-soft)' : 'var(--ink-950)',
          color: p === page ? 'var(--brand)' : 'var(--text-secondary)',
          fontWeight: p === page ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
        }}>{p}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="btn-icon"
        style={{ opacity: page === totalPages ? 0.35 : 1 }} aria-label="Siguiente">
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
        Página {page} de {totalPages}
      </span>
    </div>
  );
}

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

interface Stats { total: number; masculino: number; femenino: number; niveles: number; }

export default function EstudiantesClient() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, masculino: 0, femenino: 0, niveles: 0 });
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [padres, setPadres] = useState<Padre[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null);

  // Form
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [genero, setGenero] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [nivelId, setNivelId] = useState('');
  const [padreId, setPadreId] = useState('');
  const [searchPadreCedula, setSearchPadreCedula] = useState('');
  const [selectedPadre, setSelectedPadre] = useState<Padre | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 350);
  };

  const fetchEstudiantes = useCallback(async (p: number, searchQ: string, nivelId: string) => {
    // Search-first: no disparar si no hay filtro activo
    if (!searchQ && !nivelId) {
      setEstudiantes([]);
      setHasSearched(false);
      return;
    }
    try {
      setLoading(true);
      setHasSearched(true);
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (searchQ) params.set('search', searchQ);
      if (nivelId) params.set('nivelId', nivelId);
      const res = await fetch(`/api/admin/estudiantes?${params}`);
      if (res.ok) {
        const json = await res.json();
        setEstudiantes(json.data);
        setTotalFiltered(json.total);
        setTotalPages(json.totalPages);
        setPage(json.page);
        if (json.stats) setStats(json.stats);
      } else {
        showToast('Error al cargar estudiantes', 'danger');
      }
    } catch {
      showToast('Error de conexión', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSelectors = async () => {
    const [nivelesRes, padresRes] = await Promise.all([
      fetch('/api/admin/niveles'),
      fetch('/api/admin/padres'),
    ]);
    if (nivelesRes.ok) setNiveles(await nivelesRes.json());
    if (padresRes.ok) setPadres(await padresRes.json());
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchSelectors();
     
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchEstudiantes(1, debouncedSearch, nivelFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, nivelFilter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePageChange = (p: number) => fetchEstudiantes(p, debouncedSearch, nivelFilter);

  const resetForm = () => {
    setNombres(''); setApellidos(''); setCedula(''); setGenero('');
    setFechaNacimiento(''); setNivelId(''); setPadreId('');
    setSearchPadreCedula('');
    setSelectedPadre(null);
    setErrors({});
  };

  const openAddModal = () => {
    setEditingEstudiante(null);
    resetForm();
    fetchSelectors(); // Refrescar selectores al abrir
    setModalOpen(true);
  };

  const openEditModal = async (est: Estudiante) => {
    setEditingEstudiante(est);
    
    // Split full name into names and last names
    const partes = est.nombre.trim().split(/\s+/);
    let n = est.nombre;
    let a = '';
    if (partes.length > 1) {
      if (partes.length === 2) {
        n = partes[0];
        a = partes[1];
      } else if (partes.length === 3) {
        n = partes[0];
        a = partes.slice(1).join(' ');
      } else {
        const indexDivision = partes.length - 2;
        n = partes.slice(0, indexDivision).join(' ');
        a = partes.slice(indexDivision).join(' ');
      }
    }
    setNombres(n);
    setApellidos(a);

    setCedula(est.cedula || '');
    setGenero(est.genero || '');
    setFechaNacimiento(est.fechaNacimiento ? est.fechaNacimiento.substring(0, 10) : '');
    setNivelId(String(est.nivelId));
    
    // Refrescar selectores para asegurar datos actualizados
    try {
      const [nivelesRes, padresRes] = await Promise.all([
        fetch('/api/admin/niveles'),
        fetch('/api/admin/padres'),
      ]);
      if (nivelesRes.ok) {
        const freshNiveles = await nivelesRes.json();
        setNiveles(freshNiveles);
      }
      if (padresRes.ok) {
        const freshPadres = await padresRes.json();
        setPadres(freshPadres);
        const currentPadre = freshPadres.find((p: { id: number; nombre: string; cedula: string }) => p.id === est.padreId) || null;
        setSelectedPadre(currentPadre);
        setSearchPadreCedula(currentPadre ? currentPadre.cedula : '');
      } else {
        const currentPadre = padres.find(p => p.id === est.padreId) || null;
        setSelectedPadre(currentPadre);
        setSearchPadreCedula(currentPadre ? currentPadre.cedula : '');
      }
    } catch {
      const currentPadre = padres.find(p => p.id === est.padreId) || null;
      setSelectedPadre(currentPadre);
      setSearchPadreCedula(currentPadre ? currentPadre.cedula : '');
    }

    setPadreId(String(est.padreId));
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!nombres.trim()) newErrors.nombres = 'Los nombres son obligatorios';
    if (!apellidos.trim()) newErrors.apellidos = 'Los apellidos son obligatorios';
    if (!nivelId) newErrors.nivelId = 'El nivel es obligatorio';
    if (!padreId) newErrors.padreId = 'El padre/tutor es obligatorio';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      nombre: `${nombres.trim()} ${apellidos.trim()}`,
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
      fetchEstudiantes(page, debouncedSearch, nivelFilter);
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
      fetchEstudiantes(page, debouncedSearch, nivelFilter);
    } catch {
      showToast('Error de conexión al eliminar', 'danger');
    }
  };

  // Data is already filtered server-side
  const filtered = estudiantes;

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
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total estudiantes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.masculino}</span>
          <span className="stat-label">Varones</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.femenino}</span>
          <span className="stat-label">Mujeres</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.niveles}</span>
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
            onChange={(e) => handleSearchChange(e.target.value)}
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
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="skeleton-loader" style={{ margin: '0 auto', width: '60px', height: '60px', borderRadius: '50%' }} />
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.9rem' }}>Buscando…</p>
          </div>
        ) : !hasSearched ? (
          <div className="table-empty" style={{ padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Buscá un estudiante
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Escribí el nombre, cédula o padre, o filtrá por nivel para ver resultados.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            Sin resultados para tu búsqueda.
          </div>
        ) : (
          <>
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
          <Pagination page={page} totalPages={totalPages} onPage={handlePageChange} />
          {totalFiltered > 0 && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', paddingBottom: '8px' }}>
              {totalFiltered} resultado{totalFiltered !== 1 ? 's' : ''} encontrado{totalFiltered !== 1 ? 's' : ''}
            </p>
          )}
          </>
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
                    <label htmlFor="form-est-nombres">Nombres *</label>
                    <input
                      type="text"
                      id="form-est-nombres"
                      className="form-input"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      placeholder="Ej: Juan Carlos"
                    />
                    {errors.nombres && <span className="invalid-feedback">{errors.nombres}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="form-est-apellidos">Apellidos *</label>
                    <input
                      type="text"
                      id="form-est-apellidos"
                      className="form-input"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      placeholder="Ej: Pérez Gómez"
                    />
                    {errors.apellidos && <span className="invalid-feedback">{errors.apellidos}</span>}
                  </div>
                </div>

                <div className="form-row">
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
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label htmlFor="form-est-padre-search">Buscar Padre / Tutor (por Cédula) *</label>
                    {selectedPadre ? (
                      <div className="selected-parent-card" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'var(--brand-soft)',
                        border: '1px solid var(--border-brand)',
                        borderRadius: 'var(--r-md)',
                        gap: '12px',
                        marginTop: '4px'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {selectedPadre.nombre}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Cédula: {selectedPadre.cedula}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: 'var(--danger)', padding: '4px', height: 'auto', width: 'auto' }}
                          onClick={() => {
                            setSelectedPadre(null);
                            setSearchPadreCedula('');
                            setPadreId('');
                          }}
                          title="Cambiar padre"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          id="form-est-padre-search"
                          className="form-input"
                          placeholder="Escribí el número de cédula..."
                          value={searchPadreCedula}
                          maxLength={10}
                          onChange={(e) => setSearchPadreCedula(e.target.value.replace(/\D/g, ''))}
                        />
                        {searchPadreCedula.length > 0 && (
                          <div className="autocomplete-suggestions" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--ink-900)',
                            border: '1px solid var(--border-emphasis)',
                            borderRadius: 'var(--r-md)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                            zIndex: 1000,
                            maxHeight: '160px',
                            overflowY: 'auto',
                            marginTop: '4px'
                          }}>
                            {padres.filter(p => p.cedula.includes(searchPadreCedula)).length === 0 ? (
                              <div style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                 Sin resultados para &quot;{searchPadreCedula}&quot;
                              </div>
                            ) : (
                              padres
                                .filter(p => p.cedula.includes(searchPadreCedula))
                                .map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPadre(p);
                                      setPadreId(String(p.id));
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '10px 12px',
                                      background: 'transparent',
                                      border: 'none',
                                      borderBottom: '1px solid var(--border-soft)',
                                      color: 'var(--text-primary)',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      display: 'block',
                                      fontSize: '0.85rem',
                                      transition: 'background 150ms ease'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ink-700)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <strong>{p.nombre}</strong> <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>({p.cedula})</span>
                                  </button>
                                ))
                            )}
                          </div>
                        )}
                      </>
                    )}
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
