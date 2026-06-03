# Design: Inicialización de Base de Datos y Sistema de Login

## Technical Approach
Implementar un sistema de autenticación basado en JWT guardado en una cookie `HttpOnly`. La base de datos será MySQL, mapeada usando Drizzle ORM. El control de acceso a las vistas protegidas (`/docente`, `/padre`, `/admin`) se implementará mediante el middleware de Next.js 16 (`proxy.ts`).

## Architecture Decisions

| Decision | Option | Tradeoff | Decision |
|----------|--------|----------|----------|
| **ORM / Acceso BD** | Drizzle ORM | Ligero, tipado estricto, sin binarios complejos. Ideal para Hostinger. | **Elegido** |
| **Manejo de Sesión** | Cookies JWT HttpOnly | Seguro contra XSS, fácil de implementar con middleware Next.js. | **Elegido** |
| **Cifrado de Claves** | `bcryptjs` | Cifrado robusto en JS puro. No requiere dependencias nativas de C. | **Elegido** |
| **Formato Middleware** | `proxy.ts` (Next 16) | Requerido por la versión 16 de Next.js. Reemplaza a `middleware.ts`. | **Elegido** |

## Data Flow

```
[Cliente (Login UI)] ──(Cédula / Clave)──→ [API Login (/api/auth/login)]
       ▲                                               │
  (Redirección)                                 (Validar BD con Drizzle)
       │                                               ▼
[Proxy (proxy.ts)] ◄──(Cookie HttpOnly JWT)─── [Generar JWT (jose)]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `drizzle.config.ts` | Create | Configuración de Drizzle Kit para migraciones. |
| `src/db/index.ts` | Create | Conexión de cliente Drizzle con driver `mysql2`. |
| `src/db/schema.ts` | Create | Modelos y relaciones de base de datos en TypeScript. |
| `src/lib/auth.ts` | Create | Utilidades para firmas y verificaciones de JWT usando `jose`. |
| `src/lib/validador.ts`| Create | Lógica pura para validar el algoritmo de la cédula ecuatoriana. |
| `src/proxy.ts` | Create | Middleware para interceptar peticiones y validar JWT. |
| `src/app/login/page.tsx`| Create | Página de inicio de sesión premium (CSS Vanilla). |
| `src/app/api/auth/login/route.ts`| Create | Endpoint para autenticación. |

## Interfaces / Contracts

### Esquema de Datos Conceptual (`src/db/schema.ts`)
```typescript
import { mysqlTable, varchar, int, mysqlEnum } from 'drizzle-orm/mysql-core';

export const roles = mysqlTable('roles', {
  id: int('id').primaryKey().autoincrement(),
  nombre: mysqlEnum('nombre', ['admin', 'docente', 'padre']).notNull(),
});

export const usuarios = mysqlTable('usuarios', {
  id: int('id').primaryKey().autoincrement(),
  cedula: varchar('cedula', { length: 10 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  rolId: int('rol_id').references(() => roles.id).notNull(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
});
// Niveles, docentes, padres, estudiantes se definirán en base a esta estructura.
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Validación de algoritmo de cédula ecuatoriana | Casos válidos e inválidos con Vitest. |
| Unit | Firma y verificación de JWT | Testear expiración y payloads corruptos. |
| Integration | Endpoint `/api/auth/login` | Mockear llamadas a DB y verificar respuestas HTTP. |

## Migration / Rollout
Se configurará Drizzle Kit para generar archivos SQL de migración en la carpeta `drizzle/`. Las migraciones se podrán ejecutar en local con `npx drizzle-kit push` y migrar en Hostinger usando exportación/importación del script SQL.

## Open Questions
- [ ] ¿El número de cédula será la contraseña inicial de los usuarios creados por el admin? (Asumiremos que sí, pero permitiendo cambiarla después).
