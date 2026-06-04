'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Asignacion {
  id: number;
  docenteId: number;
  materiaId: number;
  nivelId: number;
  docenteNombre: string;
  materiaNombre: string;
  nivelNombre: string;
  estudiantesCount: number;
}

interface Nivel { id: number; nombre: string; }
interface Materia { id: number; nombre: string; }
interface Docente { id: number; nombre: string; }
interface Estudiante { id: number; nombre: string; cedula: string | null; nivelId: number; }
interface AsignacionRow { materiaId: string; nivelId: string; }

const PAGE_SIZE = 15;

function Pagination({
  page, totalPages, onPage,
}: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', padding: '20px 0 4px' }}>
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="btn-icon"
        style={{ opacity: page === 1 ? 0.35 : 1 }}
        aria-label="Página anterior"
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          style={{
            minWidth: '34px', height: '34px', borderRadius: 'var(--r-md)',
            border: `1.5px solid ${p === page ? 'var(--brand)' : 'var(--border-std)'}`,
            background: p === page ? 'var(--brand-soft)' : 'var(--ink-950)',
            color: p === page ? 'var(--brand)' : 'var(--text-secondary)',
            fontWeight: p === page ? 700 : 500,
            fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="btn-icon"
        style={{ opacity: page === totalPages ? 0.35 : 1 }}
        aria-label="Página siguiente"
      >
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

export default function MateriasClient() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);

  const [loading, setLoading] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(false);
  const [nivelFilter, setNivelFilter] = useState('');
  const [docenteFilter, setDocenteFilter] = useState('');

  // Modal asignación
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocenteId, setSelectedDocenteId] = useState('');
  const [rows, setRows] = useState<AsignacionRow[]>([{ materiaId: '', nivelId: '' }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Modal estudiantes — carga lazy
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null);
  const [modalStudents, setModalStudents] = useState<Estudiante[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAsignaciones = useCallback(async (p: number, nivelId: string, docenteId: string) => {
    // Search-first: no disparar si no hay filtro activo
    if (!nivelId && !docenteId) {
      setAsignaciones([]);
      setHasFiltered(false);
      return;
    }
    try {
      setLoading(true);
      setHasFiltered(true);
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (nivelId) params.set('nivelId', nivelId);
      if (docenteId) params.set('docenteId', docenteId);
      const res = await fetch(`/api/admin/docentes-materias?${params}`);
      if (res.ok) {
        const json = await res.json();
        setAsignaciones(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
        setPage(json.page);
      }
    } catch {
      showToast('Error al cargar asignaciones', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSelectors = async () => {
    try {
      const [nivelesRes, materiasRes, docentesRes] = await Promise.all([
        fetch('/api/admin/niveles'),
        fetch('/api/admin/materias'),
        fetch('/api/admin/docentes'),
      ]);
      if (nivelesRes.ok) setNiveles(await nivelesRes.json());
      if (materiasRes.ok) setMaterias(await materiasRes.json());
      if (docentesRes.ok) setDocentes(await docentesRes.json());
    } catch {
      showToast('Error al cargar datos', 'danger');
    }
  };

  const openStudentsModal = async (asignacion: Asignacion) => {
    setSelectedAsignacion(asignacion);
    setModalStudents([]);
    setStudentsLoading(true);
    setStudentsModalOpen(true);
    try {
      const res = await fetch(`/api/admin/estudiantes?nivelId=${asignacion.nivelId}&limit=200`);
      if (res.ok) {
        const json = await res.json();
        setModalStudents(json.data || []);
      }
    } catch {
      showToast('Error al cargar estudiantes', 'danger');
    } finally {
      setStudentsLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchSelectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchAsignaciones(1, nivelFilter, docenteFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivelFilter, docenteFilter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePageChange = (p: number) => {
    fetchAsignaciones(p, nivelFilter, docenteFilter);
  };

  const openAddModal = () => {
    setSelectedDocenteId('');
    setRows([{ materiaId: '', nivelId: '' }]);
    setErrors({});
    setModalOpen(true);
  };

  const addRow = () => setRows((prev) => [...prev, { materiaId: '', nivelId: '' }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: 'materiaId' | 'nivelId', value: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!selectedDocenteId) newErrors.docente = 'Seleccioná un docente';
    const completas = rows.filter((r) => r.materiaId && r.nivelId);
    if (completas.length === 0) newErrors.rows = 'Agregá al menos una materia con su nivel';
    rows.forEach((r, i) => {
      if (r.materiaId && !r.nivelId) newErrors[`nivel-${i}`] = 'Falta el nivel';
      if (!r.materiaId && r.nivelId) newErrors[`materia-${i}`] = 'Falta la materia';
    });
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/docentes-materias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docenteId: selectedDocenteId, asignaciones: completas }),
      });
      if (res.ok) {
        const d = await res.json();
        const omitMsg = d.omitidas > 0 ? ` (${d.omitidas} ya existían)` : '';
        showToast(`${d.insertadas} asignación(es) guardadas${omitMsg}`, 'success');
        setModalOpen(false);
        fetchAsignaciones(1, nivelFilter, docenteFilter);
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Error al guardar', 'danger');
      }
    } catch {
      showToast('Error de conexión', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, materiaNombre: string, docenteNombre: string) => {
    if (!confirm(`¿Quitar "${materiaNombre}" de ${docenteNombre}?`)) return;
    try {
      const res = await fetch(`/api/admin/docentes-materias/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Asignación eliminada', 'success');
        fetchAsignaciones(page, nivelFilter, docenteFilter);
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Error al eliminar', 'danger');
      }
    } catch {
      showToast('Error de conexión', 'danger');
    }
  };

  const selectedDocente = docentes.find((d) => d.id === Number(selectedDocenteId));

  return (
    <div className="page-content">
      {toast && (
        <div className={`alert-toast alert-toast-${toast.type}`} id="toast-materias">
          <span>{toast.message}</span>
        </div>
      )}

      <header className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Materias por Docente</h1>
          <p className="page-subtitle">
            Asigná materias y niveles a cada docente.{' '}
            {total > 0 && <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{total} asignaciones</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={openAddModal} id="btn-add-asignacion">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
          </svg>
          Asignar Materias
        </button>
      </header>

      {/* Filtros */}
      <section className="controls-bar">
        <select className="filter-select" value={docenteFilter} onChange={(e) => { setDocenteFilter(e.target.value); }} id="filter-docente">
          <option value="">Todos los docentes</option>
          {docentes.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
        </select>
        <select className="filter-select" value={nivelFilter} onChange={(e) => { setNivelFilter(e.target.value); }} id="filter-nivel">
          <option value="">Todos los niveles</option>
          {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
        </select>
      </section>

      {/* Tabla */}
      <section className="table-wrapper">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="skeleton-loader" style={{ margin: '0 auto', width: '60px', height: '60px', borderRadius: '50%' }} />
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.9rem' }}>Cargando asignaciones…</p>
          </div>
        ) : !hasFiltered ? (
          <div className="table-empty" style={{ padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Seleccioná un docente o nivel
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Usá los filtros de arriba para ver las materias asignadas.
            </p>
          </div>
        ) : asignaciones.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No hay materias asignadas con estos filtros.
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Materia</th>
                  <th>Nivel</th>
                  <th style={{ textAlign: 'center' }}>Estudiantes</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.docenteNombre}</td>
                    <td>{a.materiaNombre}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', background: 'var(--brand-soft)',
                        color: 'var(--brand)', borderRadius: 'var(--r-full)',
                        fontSize: '0.8rem', fontWeight: 600,
                      }}>
                        {a.nivelNombre}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => openStudentsModal(a)}
                        style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'underline' }}
                      >
                        👥 {a.estudiantesCount}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-icon btn-icon-delete"
                        onClick={() => handleDelete(a.id, a.materiaNombre, a.docenteNombre)}
                        title="Quitar asignación"
                        id={`btn-del-asig-${a.id}`}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onPage={handlePageChange} />
          </>
        )}
      </section>

      {/* Modal: Asignar */}
      {modalOpen && (
        <div className="modal-overlay" id="modal-asignacion">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <header className="modal-header">
              <h2>Asignar Materias a Docente</h2>
              <button className="btn-icon" onClick={() => setModalOpen(false)} aria-label="Cerrar">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </header>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="form-docente">Docente</label>
                  <select
                    id="form-docente"
                    className="form-input"
                    value={selectedDocenteId}
                    onChange={(e) => { setSelectedDocenteId(e.target.value); setErrors({}); }}
                  >
                    <option value="">— Seleccioná un docente —</option>
                    {docentes.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                  {errors.docente && <span className="invalid-feedback">{errors.docente}</span>}
                </div>

                {selectedDocenteId && (
                  <>
                    <div style={{ height: '1px', background: 'var(--border-soft)', margin: '4px 0 16px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--role-docente)', margin: 0 }}>
                        📚 Materias de {selectedDocente?.nombre}
                      </p>
                      <button type="button" onClick={addRow} style={{
                        padding: '4px 14px', background: 'var(--role-docente-soft)',
                        border: '1px solid var(--role-docente)', borderRadius: 'var(--r-md)',
                        color: 'var(--role-docente)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                      }}>
                        + Agregar fila
                      </button>
                    </div>
                    {errors.rows && <span className="invalid-feedback" style={{ display: 'block', marginBottom: '10px' }}>{errors.rows}</span>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {rows.map((row, i) => (
                        <div key={i} style={{
                          display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px',
                          alignItems: 'start', padding: '12px', background: 'var(--ink-950)',
                          borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)',
                        }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>Materia</label>
                            <select className="form-input" style={{ height: '38px', fontSize: '0.85rem', padding: '6px 10px' }}
                              value={row.materiaId} onChange={(e) => updateRow(i, 'materiaId', e.target.value)} id={`row-materia-${i}`}>
                              <option value="">— Materia —</option>
                              {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                            {errors[`materia-${i}`] && <span className="invalid-feedback" style={{ fontSize: '0.75rem' }}>{errors[`materia-${i}`]}</span>}
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>Nivel</label>
                            <select className="form-input" style={{ height: '38px', fontSize: '0.85rem', padding: '6px 10px' }}
                              value={row.nivelId} onChange={(e) => updateRow(i, 'nivelId', e.target.value)} id={`row-nivel-${i}`}>
                              <option value="">— Nivel —</option>
                              {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                            </select>
                            {errors[`nivel-${i}`] && <span className="invalid-feedback" style={{ fontSize: '0.75rem' }}>{errors[`nivel-${i}`]}</span>}
                          </div>
                          <div style={{ paddingTop: '22px' }}>
                            <button type="button" onClick={() => removeRow(i)} disabled={rows.length === 1} style={{
                              width: '34px', height: '38px', borderRadius: 'var(--r-md)',
                              border: '1px solid var(--border-std)', background: 'var(--ink-900)',
                              color: rows.length === 1 ? 'var(--text-muted)' : 'var(--danger)',
                              cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }} title="Quitar fila">
                              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>
                      Las filas incompletas se ignoran. Si la combinación ya existe, se omite sin error.
                    </p>
                  </>
                )}
              </div>
              <footer className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting || !selectedDocenteId} id="btn-guardar-asig">
                  {submitting ? 'Guardando…' : 'Guardar Asignaciones'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Estudiantes */}
      {studentsModalOpen && selectedAsignacion && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <header className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Estudiantes del Nivel</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedAsignacion.materiaNombre} — {selectedAsignacion.nivelNombre}
                </p>
              </div>
              <button className="btn-icon" onClick={() => setStudentsModalOpen(false)} aria-label="Cerrar">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </header>
            <div className="modal-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {studentsLoading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando estudiantes…
                </div>
              ) : modalStudents.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay estudiantes en {selectedAsignacion.nivelNombre} todavía.
                </div>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {modalStudents.map((est) => (
                    <li key={est.id} style={{
                      padding: '10px 14px', background: 'var(--ink-950)',
                      border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{est.nombre}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>C.I: {est.cedula || 'S/N'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <footer className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setStudentsModalOpen(false)}>Cerrar</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
