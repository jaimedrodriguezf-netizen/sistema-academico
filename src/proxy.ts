import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verificarToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas estáticas de activos públicos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Leer token de la cookie
  const token = request.cookies.get('session')?.value;

  // 2. Verificar autenticación
  const payload = token ? await verificarToken(token) : null;

  // Redirección si ya está autenticado e intenta ir a login
  if (pathname === '/login') {
    if (payload) {
      if (payload.rol === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      if (payload.rol === 'docente') {
        return NextResponse.redirect(new URL('/docente', request.url));
      }
      if (payload.rol === 'padre') {
        return NextResponse.redirect(new URL('/padre', request.url));
      }
    }
    return NextResponse.next();
  }

  // 3. Proteger las rutas específicas según el rol
  const pathsProtegidos = ['/admin', '/docente', '/padre'];
  const pathProtegido = pathsProtegidos.find((p) => pathname.startsWith(p));

  if (pathProtegido) {
    if (!payload) {
      // No autenticado, redirigir a login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Validar autorización por rol
    const rolUsuario = payload.rol;
    const rutaRequerida = pathProtegido;

    if (rutaRequerida === '/admin' && rolUsuario !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (rutaRequerida === '/docente' && rolUsuario !== 'docente') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (rutaRequerida === '/padre' && rolUsuario !== 'padre') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/docente/:path*', '/padre/:path*', '/login'],
};
