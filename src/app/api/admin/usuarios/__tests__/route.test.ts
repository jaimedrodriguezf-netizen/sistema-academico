// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

const { mockSelect, mockInsert } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

describe('API Route Handler: GET and POST /api/admin/usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/usuarios', () => {
    it('debe retornar la lista de usuarios con sus roles', async () => {
      const mockUsuarios = [
        {
          id: 1,
          cedula: '1710034057',
          nombre: 'Admin Original',
          email: 'admin@academico.com',
          rolId: 1,
          creadoEn: new Date(),
          rol: 'admin',
        },
      ];

      // Configurar el mock encadenado para db.select().from().innerJoin()
      const mockInnerJoin = vi.fn().mockResolvedValue(mockUsuarios);
      const mockFrom = vi.fn().mockReturnValue({
        innerJoin: mockInnerJoin,
      });
      mockSelect.mockReturnValue({
        from: mockFrom,
      });

      const req = new NextRequest('http://localhost/api/admin/usuarios');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([
        {
          ...mockUsuarios[0],
          creadoEn: mockUsuarios[0].creadoEn.toISOString(),
        },
      ]);
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('POST /api/admin/usuarios', () => {
    it('debe retornar 400 si los campos obligatorios están vacíos', async () => {
      const req = new NextRequest('http://localhost/api/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '',
          nombre: '',
          email: 'invalido',
          rolId: null,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Cédula, nombre y rol son obligatorios');
    });

    it('debe retornar 400 si la cédula es inválida', async () => {
      const req = new NextRequest('http://localhost/api/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1722210389', // Cédula inválida (dígito verificador incorrecto)
          nombre: 'Juan Pérez',
          email: 'juan@correo.com',
          rolId: 2,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Cédula ecuatoriana inválida');
    });

    it('debe retornar 409 si la cédula ya existe', async () => {
      // Mock para buscar cédula duplicada
      const mockWhere = vi.fn().mockResolvedValue([{ id: 1, cedula: '1710034057' }]);
      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      mockSelect.mockReturnValue({
        from: mockFrom,
      });

      const req = new NextRequest('http://localhost/api/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1710034057', // Cédula válida y existente
          nombre: 'Nuevo Usuario',
          email: 'nuevo@correo.com',
          rolId: 2,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe('La cédula ya está registrada');
    });

    it('debe crear el usuario correctamente hasheando la cédula como contraseña', async () => {
      // Mock para cédula duplicada (retorna vacío)
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      mockSelect.mockReturnValue({
        from: mockFrom,
      });

      // Mock para inserción
      const mockValues = vi.fn().mockResolvedValue([{ insertId: 10 }]);
      mockInsert.mockReturnValue({
        values: mockValues,
      });

      const req = new NextRequest('http://localhost/api/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1710034057', // Cédula válida
          nombre: 'Juan Pérez',
          email: 'juan@correo.com',
          rolId: 2,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.usuarioId).toBeDefined();

      expect(mockInsert).toHaveBeenCalled();
      const insertArg = mockValues.mock.calls[0][0];
      expect(insertArg.cedula).toBe('1710034057');
      expect(insertArg.password).not.toBe('1710034057'); // Debe estar hasheada
    });
  });
});
