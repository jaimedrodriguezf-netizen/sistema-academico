// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminUsuariosPage from '../page';
import { verificarToken } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  verificarToken: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue({ value: 'session-token' }),
  }),
}));

describe('Admin Usuarios Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe compilar y renderizar la estructura básica del CRUD de usuarios', async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      usuarioId: 1,
      rol: 'admin',
      cedula: '1710034057',
    });

    const pageElement = await AdminUsuariosPage();
    render(pageElement);
    
    expect(screen.getByText('Usuarios')).toBeDefined();
    expect(screen.getByPlaceholderText('Buscar por nombre o cédula...')).toBeDefined();
  });
});
