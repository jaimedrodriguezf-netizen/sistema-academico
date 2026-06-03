# Tasks: Inicialización de Base de Datos y Sistema de Login

## Phase 1: Infrastructure & Database
- [x] 1.1 Configurar `drizzle.config.ts` en el root para mapear los esquemas y migraciones.
- [x] 1.2 Crear `src/db/schema.ts` definiendo las tablas base (`roles`, `usuarios`, `niveles`, `docentes`, `padres`, `estudiantes`, `materias`).
- [x] 1.3 Crear `src/db/index.ts` inicializando el pool de `mysql2` y exportando la instancia `db` de Drizzle.
- [x] 1.4 Generar la migración inicial ejecutando `npx drizzle-kit generate` y revisar el archivo SQL resultante.

## Phase 2: Domain Utilities (Test-First)
- [x] 2.1 **RED**: Crear prueba unitaria en `src/lib/__tests__/validador.test.ts` que falle para validar el algoritmo de la cédula ecuatoriana.
- [x] 2.2 **GREEN**: Implementar la validación de cédulas en `src/lib/validador.ts` para que pase el test.
- [x] 2.3 **REFACTOR**: Optimizar la lógica del validador de cédula manteniendo la suite de pruebas en verde.
- [x] 2.4 **RED**: Crear prueba unitaria en `src/lib/__tests__/auth.test.ts` que falle para firmar y verificar tokens JWT.
- [x] 2.5 **GREEN**: Implementar utilidades de JWT en `src/lib/auth.ts` usando la librería `jose` para hacer pasar el test.
- [x] 2.6 **REFACTOR**: Limpiar y tipar adecuadamente las utilidades de JWT.

## Phase 3: Core Logic & Middleware
- [x] 3.1 **RED**: Crear prueba de integración para el Route Handler en `src/app/api/auth/login/__tests__/route.test.ts`.
- [x] 3.2 **GREEN**: Implementar el Route Handler en `src/app/api/auth/login/route.ts` que procese el login y asigne la cookie JWT HttpOnly.
- [x] 3.3 Crear el middleware `src/proxy.ts` (Next 16) para controlar el acceso a `/docente`, `/padre` y `/admin` validando la sesión.

## Phase 4: UI & Styling
- [x] 4.1 Crear la UI del Login en `src/app/login/page.tsx` con selector de roles y entrada de cédula, con diseño moderno.
- [x] 4.2 Crear los estilos CSS Vanilla para el login en `src/app/login/login.css` con estética premium.

## Phase 5: Verification & Seed
- [x] 5.1 Crear script de seed `src/db/seed.ts` para precargar roles y usuarios iniciales para pruebas.
- [x] 5.2 Ejecutar `npx tsc --noEmit` y `npm run lint -- --fix` para validar que el proyecto compila y no tiene errores.
