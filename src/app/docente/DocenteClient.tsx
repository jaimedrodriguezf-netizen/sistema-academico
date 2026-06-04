'use client';

import React, { useState, useEffect } from 'react';

interface MateriaAsignada {
  id: number;
  nivelId: number;
  nivelNombre: string;
  materiaId: number;
  materiaNombre: string;
}

interface Estudiante {
  id: number;
  cedula: string | null;
  nombre: string;
  nivelId: number;
}

interface AsistenciaRegistro {
  estudianteId: number;
  estado: 'presente' | 'ausente' | 'atraso' | 'justificado';
  observacion: string;
}

interface DocenteClientProps {
  materiasAsignadas: MateriaAsignada[];
  estudiantes: Estudiante[];
}

export default function DocenteClient({ materiasAsignadas, estudiantes }: DocenteClientProps) {
  // Inicializar con la primera materia asignada si existe
  const [selectedAsignacionId, setSelectedAsignacionId] = useState<number>(
    materiasAsignadas.length > 0 ? materiasAsignadas[0].id : 0
  );

  // Obtener fecha local de hoy en formato YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [fecha, setFecha] = useState<string>(getTodayString());
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Asistencia cargada/editada localmente
  const [asistenciasMap, setAsistenciasMap] = useState<Record<number, AsistenciaRegistro>>({});

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentAsignacion = materiasAsignadas.find((m) => m.id === selectedAsignacionId);

  // Estudiantes del nivel seleccionado
  const currentEstudiantes = currentAsignacion
    ? estudiantes.filter((e) => e.nivelId === currentAsignacion.nivelId)
    : [];

  // Ordenar estudiantes alfabéticamente por nombre
  const sortedEstudiantes = [...currentEstudiantes].sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );

  // Cargar asistencias existentes para la materia, nivel y fecha seleccionados
  useEffect(() => {
    if (!currentAsignacion || !fecha) return;

    const fetchAsistencias = async () => {
      setLoading(true);
      try {
        const query = `nivelId=${currentAsignacion.nivelId}&materiaId=${currentAsignacion.materiaId}&fecha=${fecha}`;
        const res = await fetch(`/api/docente/asistencias?${query}`);
        if (res.ok) {
          const data: Array<{ estudianteId: number; estado: 'presente' | 'ausente' | 'atraso' | 'justificado'; observacion: string | null }> = await res.json();
          
          // Crear mapa de registros cargados
          const map: Record<number, AsistenciaRegistro> = {};
          
          // Inicializar por defecto todos los estudiantes del nivel como "presente"
          currentEstudiantes.forEach((est) => {
            map[est.id] = {
              estudianteId: est.id,
              estado: 'presente',
              observacion: '',
            };
          });

          // Sobrescribir con los registros existentes cargados de la base de datos
          data.forEach((asis) => {
            map[asis.estudianteId] = {
              estudianteId: asis.estudianteId,
              estado: asis.estado,
              observacion: asis.observacion || '',
            };
          });

          setAsistenciasMap(map);
        } else {
          showToast('Error al obtener asistencias registradas', 'danger');
        }
      } catch {
        showToast('Error de conexión al cargar asistencias', 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchAsistencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAsignacionId, fecha]);

  const handleEstadoChange = (estudianteId: number, estado: 'presente' | 'ausente' | 'atraso' | 'justificado') => {
    setAsistenciasMap((prev) => ({
      ...prev,
      [estudianteId]: {
        ...prev[estudianteId],
        estado,
      },
    }));
  };

  const handleObservacionChange = (estudianteId: number, observacion: string) => {
    setAsistenciasMap((prev) => ({
      ...prev,
      [estudianteId]: {
        ...prev[estudianteId],
        observacion,
      },
    }));
  };

  const handleMarcarTodosPresentes = () => {
    setAsistenciasMap((prev) => {
      const nuevoMap = { ...prev };
      sortedEstudiantes.forEach((est) => {
        if (nuevoMap[est.id]) {
          nuevoMap[est.id] = {
            ...nuevoMap[est.id],
            estado: 'presente',
          };
        }
      });
      return nuevoMap;
    });
    showToast('Todos los estudiantes marcados como Presentes', 'success');
  };

  const handleGuardar = async () => {
    if (!currentAsignacion) return;

    setSaving(true);
    try {
      const registros = Object.values(asistenciasMap);
      
      const res = await fetch('/api/docente/asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nivelId: currentAsignacion.nivelId,
          materiaId: currentAsignacion.materiaId,
          fecha,
          registros,
        }),
      });

      if (res.ok) {
        showToast('Asistencias guardadas correctamente', 'success');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Error al guardar asistencias', 'danger');
      }
    } catch {
      showToast('Error de red al guardar asistencias', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (materiasAsignadas.length === 0) {
    return (
      <div className="table-container" style={{ margin: '24px' }}>
        <div className="table-empty" style={{ padding: '40px 24px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>📭 No tenés materias ni niveles asignados.</p>
          <p style={{ color: 'var(--text-muted)' }}>Contactá al administrador para asociar materias a tu cuenta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ padding: '24px' }}>
      {/* Estilos locales premium para control de asistencias del docente */}
      <style>{`
        .docente-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
          background: var(--ink-900);
          border: 1px solid var(--border-soft);
          padding: 20px;
          border-radius: var(--r-lg);
        }
        .control-item {
          flex: 1 1 280px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .docente-select {
          background: var(--ink-950);
          border: 1px solid var(--border-std);
          color: var(--text-primary);
          padding: 10px 14px;
          border-radius: var(--r-md);
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
          transition: border-color var(--dur-fast);
        }
        .docente-select:focus {
          border-color: var(--role-docente);
        }
        .attendance-btn-group {
          display: inline-flex;
          border: 1px solid var(--border-std);
          border-radius: var(--r-md);
          overflow: hidden;
          background: var(--ink-950);
        }
        .attendance-btn {
          border: none;
          padding: 8px 16px;
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          cursor: pointer;
          transition: all var(--dur-fast) var(--ease-std);
          outline: none;
        }
        .attendance-btn.active-presente {
          background: var(--success-soft);
          color: var(--success);
          box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.25);
        }
        .attendance-btn.active-atraso {
          background: var(--warning-soft);
          color: var(--warning);
          box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.25);
        }
        .attendance-btn.active-ausente {
          background: var(--danger-soft);
          color: var(--danger);
          box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.25);
        }
        .attendance-btn.active-justificado {
          background: var(--brand-soft);
          color: var(--brand);
          box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.25);
        }
        .attendance-btn:not(.active-presente):not(.active-atraso):not(.active-ausente):not(.active-justificado):hover {
          background: var(--ink-800);
          color: var(--text-primary);
        }
        .table-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
      `}</style>

      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-text">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>👨‍🏫</span>
            Registro de Asistencias
          </h1>
          <p className="page-subtitle">Gestioná y grabá las asistencias de los estudiantes por materia y nivel.</p>
        </div>
      </header>

      {/* Selectores de Nivel/Materia y Fecha */}
      <div className="docente-controls">
        <div className="control-item">
          <label htmlFor="select-asignacion" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Materia y Nivel asignado</label>
          <select
            id="select-asignacion"
            className="docente-select"
            value={selectedAsignacionId}
            onChange={(e) => setSelectedAsignacionId(Number(e.target.value))}
            disabled={loading || saving}
          >
            {materiasAsignadas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.materiaNombre} — {m.nivelNombre}
              </option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label htmlFor="input-fecha" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha de registro</label>
          <input
            id="input-fecha"
            type="date"
            className="docente-select"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            disabled={loading || saving}
          />
        </div>
      </div>

      {currentAsignacion && (
        <div className="table-container">
          <div className="table-action-row" style={{ padding: '16px 24px 0px 24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Alumnos en {currentAsignacion.nivelNombre} ({sortedEstudiantes.length})
            </h2>
            
            <button
              type="button"
              className="btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                height: 'auto',
                width: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'var(--role-docente)',
                color: 'var(--role-docente)',
              }}
              onClick={handleMarcarTodosPresentes}
              disabled={loading || saving || sortedEstudiantes.length === 0}
            >
              ✅ Marcar todos Presentes
            </button>
          </div>

          {loading ? (
            <div className="table-empty" style={{ padding: '60px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Cargando registros de asistencia...</p>
            </div>
          ) : sortedEstudiantes.length === 0 ? (
            <div className="table-empty" style={{ padding: '36px' }}>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                No hay estudiantes registrados en este nivel.
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="main-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Estudiante
                      </th>
                      <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>
                        Cédula
                      </th>
                      <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '320px', textAlign: 'center' }}>
                        Estado de Asistencia
                      </th>
                      <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Observación / Novedad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEstudiantes.map((est) => {
                      const reg = asistenciasMap[est.id] || {
                        estudianteId: est.id,
                        estado: 'presente',
                        observacion: '',
                      };

                      return (
                        <tr key={est.id} className="table-row" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '14px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {est.nombre}
                          </td>
                          <td style={{ padding: '14px 24px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {est.cedula || '—'}
                          </td>
                          <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                            <div className="attendance-btn-group">
                              <button
                                type="button"
                                className={`attendance-btn ${reg.estado === 'presente' ? 'active-presente' : ''}`}
                                onClick={() => handleEstadoChange(est.id, 'presente')}
                                disabled={saving}
                              >
                                Presente
                              </button>
                              <button
                                type="button"
                                className={`attendance-btn ${reg.estado === 'atraso' ? 'active-atraso' : ''}`}
                                onClick={() => handleEstadoChange(est.id, 'atraso')}
                                disabled={saving}
                              >
                                Atraso
                              </button>
                              <button
                                type="button"
                                className={`attendance-btn ${reg.estado === 'ausente' ? 'active-ausente' : ''}`}
                                onClick={() => handleEstadoChange(est.id, 'ausente')}
                                disabled={saving}
                              >
                                Ausente
                              </button>
                              <button
                                type="button"
                                className={`attendance-btn ${reg.estado === 'justificado' ? 'active-justificado' : ''}`}
                                onClick={() => handleEstadoChange(est.id, 'justificado')}
                                disabled={saving}
                              >
                                Justif.
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '10px 24px' }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{
                                height: '36px',
                                fontSize: '0.85rem',
                                padding: '6px 12px',
                                background: 'var(--ink-950)',
                                border: '1px solid var(--border-std)',
                              }}
                              placeholder="Ej: Justificación médica, retiro temprano..."
                              value={reg.observacion}
                              onChange={(e) => handleObservacionChange(est.id, e.target.value)}
                              disabled={saving}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botón de guardar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  padding: '20px 24px',
                  borderTop: '1px solid var(--border-soft)',
                  background: 'var(--ink-900)',
                }}
              >
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    backgroundColor: 'var(--role-docente)',
                    borderColor: 'var(--role-docente)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: 'auto',
                    padding: '10px 28px',
                    fontWeight: 600,
                  }}
                  onClick={handleGuardar}
                  disabled={saving || loading}
                >
                  {saving ? (
                    <>⏳ Guardando...</>
                  ) : (
                    <>💾 Guardar Registro de Asistencia</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Notification Toast */}
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
