// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminLoginPage from '../page';
import React from 'react';

vi.mock('@/lib/auth', () => ({
  verificarToken: vi.fn(),
}));

describe('Admin Login Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe compilar y renderizar la interfaz de login exclusiva para administradores', () => {
    render(<AdminLoginPage />);
    
    expect(screen.getByText('INGRESO ADMINISTRATIVO')).toBeDefined();
    expect(screen.getByPlaceholderText('Cédula de administrador...')).toBeDefined();
  });
});
