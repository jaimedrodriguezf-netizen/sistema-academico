'use client';

import React, { useState } from 'react';

interface Asistencia {
  id: number;
  estudianteId: number;
  fecha: string;
  estado: 'presente' | 'ausente' | 'atraso' | 'justificado';
  observacion: string | null;
  materiaId: number;
  materiaNombre: string;
}

interface Hijo {
  id: number;
  nombre: string;
  nivel: string;
  nivelId: number;
  genero: 'masculino' | 'femenino' | 'otro' | null;
}

interface MateriaAsignada {
  nivelId: number;
  materiaId: number;
  materiaNombre: string;
}

interface AsistenciasClientProps {
  hijos: Hijo[];
  asistencias: Asistencia[];
  materiasAsignadas: MateriaAsignada[];
}

export default function AsistenciasClient({
  hijos,
  asistencias,
  materiasAsignadas,
}: AsistenciasClientProps) {
  // Inicializar estado local de asistencias para reactividad
  const [localAsistencias, setLocalAsistencias] = useState<Asistencia[]>(asistencias);
  const [selectedHijoId, setSelectedHijoId] = useState<number>(
    hijos.length > 0 ? hijos[0].id : 0
  );

  // Inicializar seleccionando "Todas las materias" (materiaId = 0)
  const [selectedMateriaId, setSelectedMateriaId] = useState<number>(0);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Estados para justificaciones
  const [justifyModalOpen, setJustifyModalOpen] = useState(false);
  const [selectedAsistencia, setSelectedAsistencia] = useState<Asistencia | null>(null);
  const [justificacionTexto, setJustificacionTexto] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estado para notificaciones Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const selectedHijo = hijos.find((h) => h.id === selectedHijoId);

  // Materias del nivel del representado seleccionado
  const currentHijoMaterias = selectedHijo
    ? materiasAsignadas.filter((m) => m.nivelId === selectedHijo.nivelId)
    : [];

  // Cambiar de representado, ajustar su materia por defecto a "Todas las materias" y reiniciar paginación
  const handleHijoChange = (hijoId: number) => {
    setSelectedHijoId(hijoId);
    setCurrentPage(1);
    setSelectedMateriaId(0);
  };

  // Filtrar asistencias por Representado Y por Materia seleccionada (o todas si selectedMateriaId es 0)
  const filteredAsistencias = localAsistencias.filter(
    (a) =>
      a.estudianteId === selectedHijoId &&
      (selectedMateriaId === 0 || a.materiaId === selectedMateriaId)
  );

  // Calcular estadísticas globales de la materia del hijo seleccionado
  const totalClases = filteredAsistencias.length;
  const presencias = filteredAsistencias.filter((a) => a.estado === 'presente').length;
  const atrasos = filteredAsistencias.filter((a) => a.estado === 'atraso').length;
  const justificadas = filteredAsistencias.filter((a) => a.estado === 'justificado').length;
  const ausencias = filteredAsistencias.filter((a) => a.estado === 'ausente').length;

  const asistenciaPorcentaje =
    totalClases > 0
      ? Math.round(((presencias + atrasos + justificadas) / totalClases) * 100)
      : 100;

  // Paginación lógica
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedAsistencias = filteredAsistencias.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalClases / recordsPerPage);

  const formatFecha = (f: string) => {
    const partes = f.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return f;
  };

  const openJustifyModal = (asis: Asistencia) => {
    setSelectedAsistencia(asis);
    setJustificacionTexto('');
    setJustifyModalOpen(true);
  };

  const handleJustifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsistencia || !justificacionTexto.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/padre/asistencias/${selectedAsistencia.id}/justificar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacion: justificacionTexto }),
      });

      if (res.ok) {
        showToast('Falta justificada con éxito', 'success');
        
        // Actualizar estado local reactivamente
        setLocalAsistencias((prev) =>
          prev.map((a) =>
            a.id === selectedAsistencia.id
              ? { ...a, estado: 'justificado', observacion: justificacionTexto.trim() }
              : a
          )
        );

        setJustifyModalOpen(false);
        setSelectedAsistencia(null);
        setJustificacionTexto('');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Error al enviar la justificación', 'danger');
      }
    } catch {
      showToast('Error de conexión con el servidor', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'presente':
        return (
          <span
            className="badge-genero-masculino"
            style={{
              color: 'var(--success)',
              backgroundColor: 'var(--success-soft)',
              borderColor: 'rgba(16, 185, 129, 0.25)',
            }}
          >
            Presente
          </span>
        );
      case 'atraso':
        return (
          <span
            className="badge-genero-otro"
            style={{
              color: 'var(--warning)',
              backgroundColor: 'var(--warning-soft)',
              borderColor: 'rgba(245, 158, 11, 0.25)',
            }}
          >
            Atraso
          </span>
        );
      case 'ausente':
        return (
          <span
            className="badge-genero-femenino"
            style={{
              color: 'var(--danger)',
              backgroundColor: 'var(--danger-soft)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
            }}
          >
            Ausente
          </span>
        );
      case 'justificado':
        return (
          <span
            className="badge-genero-otro"
            style={{
              color: 'var(--brand)',
              backgroundColor: 'var(--brand-soft)',
              borderColor: 'rgba(99, 102, 241, 0.25)',
            }}
          >
            Justificado
          </span>
        );
      default:
        return <span className="badge-genero-otro">{estado}</span>;
    }
  };

  if (hijos.length === 0) {
    return (
      <div className="table-container" style={{ margin: '24px' }}>
        <div className="table-empty" style={{ padding: '40px 24px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>📭 No tenés estudiantes registrados a tu nombre.</p>
          <p style={{ color: 'var(--text-muted)' }}>Contactate con el administrador del sistema para asociar a tus hijos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ padding: '24px' }}>
      {/* Estilos locales para las tarjetas de perfil y scroll horizontal */}
      <style>{`
        .children-scroll-container {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 4px 4px 16px 4px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .children-scroll-container::-webkit-scrollbar {
          height: 6px;
        }
        .children-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .children-scroll-container::-webkit-scrollbar-thumb {
          background: var(--border-emphasis);
          border-radius: 99px;
        }
        .children-scroll-container::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
        .child-profile-card {
          flex: 0 0 auto;
          width: 250px;
          background: var(--ink-900);
          border: 1px solid var(--border-soft);
          border-radius: var(--r-lg);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all var(--dur-std) var(--ease-std);
          text-align: left;
          outline: none;
        }
        .child-profile-card:hover {
          border-color: var(--border-emphasis);
          transform: translateY(-2px);
          background: var(--ink-800);
        }
        .child-profile-card.active {
          border-color: var(--role-padre);
          background: var(--role-padre-soft);
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.12);
        }
        .child-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .materia-pill {
          background: var(--ink-900);
          border: 1px solid var(--border-soft);
          color: var(--text-secondary);
          padding: 8px 18px;
          border-radius: 99px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--dur-fast) var(--ease-std);
          outline: none;
        }
        .materia-pill:hover {
          border-color: var(--border-emphasis);
          color: var(--text-primary);
          background: var(--ink-800);
        }
        .materia-pill.active {
          background: var(--role-padre-soft);
          border-color: var(--role-padre);
          color: var(--role-padre);
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);
        }
      `}</style>

      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-text">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>📅</span>
            Control de Asistencias
          </h1>
          <p className="page-subtitle">Revisá la asistencia diaria y justificaciones de tus representados por materia.</p>
        </div>
      </header>

      {/* Selector de hijos horizontal */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}
        >
          Representados registrados:
        </h2>
        <div className="children-scroll-container">
          {hijos.map((h) => {
            const isSelected = h.id === selectedHijoId;

            // Determinar gradiente del avatar según género
            let avatarBg = 'linear-gradient(135deg, #a1a1aa, #71717a)'; // Otro / Gris
            let defaultIcon = '👤';

            if (h.genero === 'masculino') {
              avatarBg = 'linear-gradient(135deg, #3b82f6, #1d4ed8)'; // Varón
              defaultIcon = '👦';
            } else if (h.genero === 'femenino') {
              avatarBg = 'linear-gradient(135deg, #ec4899, #be185d)'; // Mujer
              defaultIcon = '👧';
            }

            // Obtener iniciales (ej: María Guadalupe -> MG)
            const iniciales = h.nombre
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase();

            return (
              <button
                key={h.id}
                type="button"
                className={`child-profile-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleHijoChange(h.id)}
                aria-label={`Seleccionar a ${h.nombre}`}
              >
                <div className="child-avatar" style={{ background: avatarBg }}>
                  {iniciales || defaultIcon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h.nombre}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {h.nivel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de materias asignadas */}
      {selectedHijo && (
        <div style={{ marginBottom: '28px' }}>
          {currentHijoMaterias.length > 0 ? (
            <>
              <h2
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '12px',
                }}
              >
                Materias asignadas a este nivel:
              </h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMateriaId(0);
                    setCurrentPage(1);
                  }}
                  className={`materia-pill ${selectedMateriaId === 0 ? 'active' : ''}`}
                >
                  📚 Todas las materias
                </button>
                {currentHijoMaterias.map((m) => {
                  const isMateriaSelected = m.materiaId === selectedMateriaId;
                  return (
                    <button
                      key={m.materiaId}
                      type="button"
                      onClick={() => {
                        setSelectedMateriaId(m.materiaId);
                        setCurrentPage(1);
                      }}
                      className={`materia-pill ${isMateriaSelected ? 'active' : ''}`}
                    >
                      {m.materiaNombre}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--ink-900)',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-soft)',
                color: 'var(--warning)',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              ⚠️ No hay materias asociadas al nivel de {selectedHijo.nombre} ({selectedHijo.nivel}) todavía.
            </div>
          )}
        </div>
      )}

      {selectedHijo && currentHijoMaterias.length > 0 && (
        <>
          {/* Tarjetas de estadísticas */}
          <div className="stats-row" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <span className="stat-label">
                {selectedMateriaId === 0 ? 'Asistencia Global' : 'Asistencia en Materia'}
              </span>
              <span
                className="stat-value"
                style={{
                  color:
                    asistenciaPorcentaje >= 90
                      ? 'var(--success)'
                      : asistenciaPorcentaje >= 75
                      ? 'var(--warning)'
                      : 'var(--danger)',
                }}
              >
                {asistenciaPorcentaje}%
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Presencias</span>
              <span className="stat-value" style={{ color: 'var(--success)' }}>
                {presencias}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Faltas (Ausente)</span>
              <span
                className="stat-value"
                style={{ color: ausencias > 0 ? 'var(--danger)' : 'var(--text-primary)' }}
              >
                {ausencias}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Atrasos / Justificadas</span>
              <span className="stat-value" style={{ color: 'var(--brand)' }}>
                {atrasos} / {justificadas}
              </span>
            </div>
          </div>

          {/* Tabla de asistencias */}
          <div className="table-container">
            <div
              className="table-header"
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Historial de Asistencia — {selectedHijo.nombre}
              </h2>
              <span className="badge-nivel" style={{ color: 'var(--role-padre)', borderColor: 'var(--role-padre-soft)', backgroundColor: 'var(--role-padre-soft)' }}>
                Total días: {totalClases}
              </span>
            </div>

            {filteredAsistencias.length === 0 ? (
              <div className="table-empty" style={{ padding: '36px' }}>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                  {selectedMateriaId === 0
                    ? 'No se han registrado asistencias para este período.'
                    : 'No se han registrado asistencias en esta materia para este período.'}
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="main-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Fecha
                        </th>
                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Materia
                        </th>
                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Estado
                        </th>
                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Observación
                        </th>
                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAsistencias.map((asis) => (
                        <tr key={asis.id} className="table-row" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatFecha(asis.fecha)}
                          </td>
                          <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                            {asis.materiaNombre}
                          </td>
                          <td style={{ padding: '16px 24px' }}>{getEstadoBadge(asis.estado)}</td>
                          <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {asis.observacion || '—'}
                          </td>
                          <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                            {asis.estado === 'ausente' ? (
                              <button
                                type="button"
                                className="btn-primary"
                                style={{
                                  padding: '6px 14px',
                                  fontSize: '0.8rem',
                                  height: 'auto',
                                  width: 'auto',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  backgroundColor: 'var(--role-padre)',
                                  borderColor: 'var(--role-padre)',
                                }}
                                onClick={() => openJustifyModal(asis)}
                              >
                                ✍️ Justificar
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      borderTop: '1px solid var(--border-soft)',
                      background: 'var(--ink-900)',
                    }}
                  >
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      Mostrando <strong>{startIndex + 1}</strong> al{' '}
                      <strong>{Math.min(endIndex, totalClases)}</strong> de <strong>{totalClases}</strong> registros
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', height: 'auto', width: 'auto' }}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', height: 'auto', width: 'auto' }}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Modal de Justificación */}
      {justifyModalOpen && selectedAsistencia && (
        <div className="modal-overlay" id="modal-justificar-asistencia" style={{ zIndex: 1100 }}>
          <div className="modal-content">
            <header className="modal-header">
              <h2>Justificar Inasistencia</h2>
              <button
                className="btn-icon"
                onClick={() => {
                  setJustifyModalOpen(false);
                  setSelectedAsistencia(null);
                  setJustificacionTexto('');
                }}
                aria-label="Cerrar"
                disabled={submitting}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>
            <form onSubmit={handleJustifySubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Ingresá el motivo de la falta en <strong>{selectedAsistencia.materiaNombre}</strong> del día{' '}
                  <strong>{formatFecha(selectedAsistencia.fecha)}</strong>.
                </p>
                <div className="form-group">
                  <label htmlFor="form-justificar-texto">Motivo / Justificación *</label>
                  <textarea
                    id="form-justificar-texto"
                    className="form-input"
                    rows={4}
                    value={justificacionTexto}
                    onChange={(e) => setJustificacionTexto(e.target.value)}
                    placeholder="Ej: El estudiante presentó fiebre y asistió a una consulta médica."
                    required
                    style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit', padding: '10px' }}
                    disabled={submitting}
                  />
                </div>
              </div>
              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setJustifyModalOpen(false);
                    setSelectedAsistencia(null);
                    setJustificacionTexto('');
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--role-padre)' }} disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Enviar Justificación'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Notificación Toast */}
      {toast && (
        <div
          className={`toast toast-${toast.type}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 24px',
            borderRadius: 'var(--r-md)',
            background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
            color: '#fff',
            fontWeight: 600,
            zIndex: 1200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
