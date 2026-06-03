// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxy } from '../proxy';
import { NextRequest, NextResponse } from 'next/server';
import { verificarToken } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  verificarToken: vi.fn(),
}));

describe('Middleware Proxy: src/proxy.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe permitir acceso a /admin/usuarios si el usuario tiene rol admin', async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      usuarioId: 1,
      rol: 'admin',
      cedula: '1710034057',
    });

    const req = new NextRequest('http://localhost/admin/usuarios');
    req.cookies.set('session', 'token-valido');

    const res = await proxy(req);
    // Un res que no es redirect (NextResponse.next()) suele no tener cabecera x-middleware-rewrite o Location.
    // En Next.js, NextResponse.next() tiene una cabecera interna.
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('debe redirigir a /login si intenta acceder a /admin/usuarios sin estar autenticado', async () => {
    vi.mocked(verificarToken).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/admin/usuarios');
    // Sin cookie

    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toBe('http://localhost/login');
  });

  it('debe redirigir a /login si intenta acceder a /admin/usuarios con rol docente', async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      usuarioId: 2,
      rol: 'docente',
      cedula: '1710034065',
    });

    const req = new NextRequest('http://localhost/admin/usuarios');
    req.cookies.set('session', 'token-docente');

    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toBe('http://localhost/login');
  });

  it('debe permitir acceso a /api/admin/usuarios si el usuario tiene rol admin', async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      usuarioId: 1,
      rol: 'admin',
      cedula: '1710034057',
    });

    const req = new NextRequest('http://localhost/api/admin/usuarios');
    req.cookies.set('session', 'token-valido');

    const res = await proxy(req);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('debe retornar 401 si intenta acceder a /api/admin/usuarios sin estar autenticado', async () => {
    vi.mocked(verificarToken).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/admin/usuarios');

    const res = await proxy(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('No autenticado');
  });

  it('debe retornar 403 si intenta acceder a /api/admin/usuarios con rol docente', async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      usuarioId: 2,
      rol: 'docente',
      cedula: '1710034065',
    });

    const req = new NextRequest('http://localhost/api/admin/usuarios');
    req.cookies.set('session', 'token-docente');

    const res = await proxy(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('No autorizado');
  });
});
