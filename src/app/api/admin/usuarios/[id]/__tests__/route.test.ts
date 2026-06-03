// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { verificarToken } from '@/lib/auth';

const { mockUpdate, mockDelete, mockSelect } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockSelect: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

vi.mock('@/lib/auth', () => ({
  verificarToken: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue({ value: 'session-token' }),
  }),
}));

describe('API Route Handler: PUT and DELETE /api/admin/usuarios/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/admin/usuarios/[id]', () => {
    it('debe retornar 400 si el administrador intenta degradar su propio rol', async () => {
      // Mock de autenticación: el admin logueado tiene ID 1
      vi.mocked(verificarToken).mockResolvedValue({
        usuarioId: 1,
        rol: 'admin',
        cedula: '1710034057',
      });

      const req = new NextRequest('http://localhost/api/admin/usuarios/1', {
        method: 'PUT',
        body: JSON.stringify({
          nombre: 'Admin Editado',
          email: 'admin@correo.com',
          rolId: 2, // Rol de docente (intento de degradación)
        }),
      });

      const res = await PUT(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('No puedes cambiar tu propio rol de administrador');
    });

    it('debe actualizar el usuario correctamente si no es el administrador logueado o si mantiene su rol', async () => {
      vi.mocked(verificarToken).mockResolvedValue({
        usuarioId: 1,
        rol: 'admin',
        cedula: '1710034057',
      });

      const mockWhere = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
      const mockSet = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      mockUpdate.mockReturnValue({
        set: mockSet,
      });

      const req = new NextRequest('http://localhost/api/admin/usuarios/2', {
        method: 'PUT',
        body: JSON.stringify({
          nombre: 'Docente Modificado',
          email: 'docente@correo.com',
          rolId: 2,
        }),
      });

      const res = await PUT(req, { params: Promise.resolve({ id: '2' }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({
        nombre: 'Docente Modificado',
        email: 'docente@correo.com',
        rolId: 2,
      });
    });
  });

  describe('DELETE /api/admin/usuarios/[id]', () => {
    it('debe retornar 400 si el administrador intenta eliminarse a sí mismo', async () => {
      vi.mocked(verificarToken).mockResolvedValue({
        usuarioId: 1,
        rol: 'admin',
        cedula: '1710034057',
      });

      const req = new NextRequest('http://localhost/api/admin/usuarios/1', {
        method: 'DELETE',
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('No puedes eliminar tu propia cuenta de administrador');
    });

    it('debe eliminar el usuario correctamente si no es el administrador logueado', async () => {
      vi.mocked(verificarToken).mockResolvedValue({
        usuarioId: 1,
        rol: 'admin',
        cedula: '1710034057',
      });

      const mockWhere = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
      mockDelete.mockReturnValue({
        where: mockWhere,
      });

      const req = new NextRequest('http://localhost/api/admin/usuarios/2', {
        method: 'DELETE',
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: '2' }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
