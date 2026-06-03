// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

// Usamos vi.hoisted para declarar mocks que necesitan ser accedidos en fábricas de vi.mock
const { mockSetCookie, mockWhere } = vi.hoisted(() => ({
  mockSetCookie: vi.fn(),
  mockWhere: vi.fn(),
}));

// Mock de Drizzle db
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: mockWhere
        })
      })
    })
  }
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    set: mockSetCookie
  })
}));

describe('API Route Handler: POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe retornar 400 si la cédula es inválida', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1722210389', password: 'password123' }) // dígito verificador incorrecto
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Cédula inválida');
  });

  it('debe retornar 401 si el usuario no existe', async () => {
    // Simulamos que la consulta no devuelve ningún usuario
    vi.mocked(mockWhere).mockResolvedValue([] as never);

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1710034065', password: 'password123' }) // Cédula sintácticamente válida
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Credenciales incorrectas');
  });

  it('debe retornar 401 si la contraseña es incorrecta', async () => {
    // Simulamos que la consulta devuelve un usuario, pero la contraseña no coincide
    const hash = await bcrypt.hash('clave_correcta', 10);
    vi.mocked(mockWhere).mockResolvedValue([
      {
        id: 1,
        cedula: '1710034065',
        password: hash,
        nombre: 'Jaime Docente',
        rol: { nombre: 'docente' } // En nuestro schema real usaremos joins, pero simulamos el resultado necesario
      }
    ] as never);

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1710034065', password: 'clave_incorrecta' })
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Credenciales incorrectas');
  });

  it('debe loguear al usuario con éxito, setear cookie y retornar el rol si las credenciales son correctas', async () => {
    const hash = await bcrypt.hash('clave_correcta', 10);
    vi.mocked(mockWhere).mockResolvedValue([
      {
        id: 1,
        cedula: '1710034065',
        password: hash,
        nombre: 'Jaime Docente',
        rol: 'docente'
      }
    ] as never);

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1710034065', password: 'clave_correcta' })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.rol).toBe('docente');
    expect(body.nombre).toBe('Jaime Docente');
    
    // Verificamos que se haya seteado la cookie
    expect(mockSetCookie).toHaveBeenCalled();
    const [cookieName, cookieValue, cookieOpts] = mockSetCookie.mock.calls[0];
    expect(cookieName).toBe('session');
    expect(cookieValue).toBeTypeOf('string'); // Debe ser el JWT firmado
    expect(cookieOpts.httpOnly).toBe(true);
  });
});
