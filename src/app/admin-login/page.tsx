'use client';

import React, { useState } from 'react';
import { validarCedula } from '@/lib/validador';
import '../login/login.css'; // Reutilizamos los estilos premium del login

export default function AdminLoginPage() {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [apiError, setApiError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Validación de cédula interactiva
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

      // Restricción: Esta vista es EXCLUSIVA para administradores
      if (data.rol !== 'admin') {
        throw new Error('Acceso restringido. Esta entrada es solo para administradores.');
      }

      // Redirección exitosa
      window.location.href = '/admin/usuarios';
    } catch (err: unknown) {
      const error = err as Error;
      setApiError(error.message || 'Error de conexión.');
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ borderTop: '4px solid #8b5cf6' }}>
        <div className="login-header">
          <h1 style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            INGRESO ADMINISTRATIVO
          </h1>
          <p>Portal de Gestión de la Institución</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="form-cedula">Cédula de Identidad</label>
            <input
              type="text"
              id="form-cedula"
              className={`form-input ${cedulaError ? 'invalid' : ''}`}
              placeholder="Cédula de administrador..."
              value={cedula}
              maxLength={10}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
              disabled={cargando}
            />
            {cedulaError && <span className="error-message">⚠️ {cedulaError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-password">Contraseña</label>
            <input
              type="password"
              id="form-password"
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
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
            disabled={cargando || !!cedulaError || !cedula || !password}
          >
            {cargando ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
