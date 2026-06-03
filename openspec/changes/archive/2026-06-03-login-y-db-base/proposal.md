# Proposal: Inicialización de Base de Datos y Sistema de Login

## Intent
Crear la base de datos MySQL con las tablas base (roles, usuarios, niveles educativos) e implementar el sistema de login seguro para docentes y padres de familia usando su número de cédula en Next.js.

## Scope

### In Scope
- Creación de base de datos MySQL y tablas base (`roles`, `usuarios`, `niveles`, `materias`, `docentes`, `padres`, `estudiantes`) usando Drizzle ORM.
- Creación de conexión segura a base de datos usando `drizzle-orm` sobre `mysql2` en `src/db/index.ts`.
- Diseño UI moderno y premium (CSS Vanilla, responsivo, estética cuidada) en `src/app/login/page.tsx`.
- Endpoint de autenticación en `src/app/api/auth/login/route.ts` que valide el número de cédula.
- Middleware en `src/proxy.ts` (Next.js 16) para interceptar y proteger rutas basadas en roles.
- Pruebas unitarias con Vitest para la lógica de autenticación y validación de cédulas.

### Out of Scope
- Interfaz gráfica del panel de administrador para crear materias.
- Módulo de justificación de faltas y envío de deberes.
- Calificaciones y visualización de asistencia.

## Approach
- Base de datos relacional MySQL mapeada con Drizzle ORM.
- Migraciones automatizadas usando Drizzle Kit.
- Autenticación usando el número de cédula como credencial (usuario y contraseña por defecto).
- Manejo de sesión con JWT cifrado guardado en una cookie HttpOnly.
- Redirección inteligente tras el login según el rol del usuario (Padre -> `/padre`, Docente -> `/docente`, Admin -> `/admin`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/db/index.ts` | New | Cliente de conexión a base de datos con Drizzle. |
| `src/db/schema.ts` | New | Esquemas y relaciones de las tablas MySQL en TypeScript. |
| `drizzle.config.ts`| New | Configuración de Drizzle Kit para migraciones. |
| `src/app/login/page.tsx` | New | Página de login para padres, docentes y admin. |
| `src/app/api/auth/login/route.ts` | New | API de autenticación y generación de JWT. |
| `src/proxy.ts` | New | Middleware de Next 16 para control de rutas. |
| `src/lib/auth.ts` | New | Utilidades de JWT (firmado/verificación). |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cédulas inválidas en el input | Medium | Validar algoritmo de la cédula ecuatoriana en frontend y backend. |
| Exposición de JWT | Low | Usar cookies `HttpOnly`, `Secure` y `SameSite=Strict`. |
| Conexión MySQL fallida en Hostinger | Low | Centralizar configuración en variables de entorno `.env`. |

## Rollback Plan
Eliminar los archivos creados y restaurar la base de datos a su estado original.

## Dependencies
- Paquetes: `mysql2`, `drizzle-orm`, `jose` (para compatibilidad de JWT en el middleware Edge/Node).
- DevDependencies: `drizzle-kit`.

## Success Criteria
- [ ] Validación exitosa de cédulas reales.
- [ ] Login exitoso redirige a la ruta correspondiente según el rol.
- [ ] Intentos de acceso no autorizados a paneles son interceptados por `proxy.ts`.
- [ ] Pruebas unitarias de validación y auth pasando en Vitest.
