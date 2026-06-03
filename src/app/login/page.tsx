'use client';

import React, { useState } from 'react';
import { validarCedula } from '@/lib/validador';
import './login.css';

export default function LoginPage() {
  const [rol, setRol] = useState<'docente' | 'padre'>('docente');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [apiError, setApiError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Validación de cédula interactiva (Derived State)
  let cedulaError = '';
  if (cedula.length > 0 && cedula.length < 10) {
    cedulaError = 'La cédula debe tener 10 dígitos.';
  } else if (cedula.length === 10 && !validarCedula(cedula)) {
    cedulaError = 'Número de cédula inválido.';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cedulaError || !cedula || !password) return;

    setCargando(true);
    setApiError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Redirección en base al rol devuelto por el servidor
      window.location.href = `/${data.rol}`;
    } catch (err: unknown) {
      const error = err as Error;
      setApiError(error.message || 'Error de conexión.');
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>SISTEMA DE ASISTENCIA</h1>
          <p>Unidad Educativa</p>
        </div>

        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${rol === 'docente' ? 'active' : ''}`}
            onClick={() => setRol('docente')}
          >
            <span>👨‍🏫</span>
            Docente
          </button>
          <button
            type="button"
            className={`role-btn ${rol === 'padre' ? 'active' : ''}`}
            onClick={() => setRol('padre')}
          >
            <span>👪</span>
            Padre
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Número de Cédula</label>
            <input
              type="text"
              className={`form-input ${cedulaError ? 'invalid' : ''}`}
              value={cedula}
              maxLength={10}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
              disabled={cargando}
            />
            {cedulaError && <span className="error-message">⚠️ {cedulaError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={cargando}
            />
          </div>

          {apiError && <div className="error-message">❌ {apiError}</div>}

          <button
            type="submit"
            className="btn-submit"
            disabled={cargando || !!cedulaError || !cedula || !password}
          >
            {cargando ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
