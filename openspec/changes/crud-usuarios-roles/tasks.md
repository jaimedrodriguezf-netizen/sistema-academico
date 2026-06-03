# Tasks: CRUD de Usuarios con Rol en el Panel de Administrador

## Phase 1: Security & Middleware Updates
- [x] 1.1 Modificar `src/proxy.ts` para restringir el acceso a `/admin/:path*` y `/api/admin/:path*` solo a administradores.

## Phase 2: Core Endpoints Implementation (Test-First)
- [x] 2.1 **RED**: Crear prueba de integración en `src/app/api/admin/usuarios/__tests__/route.test.ts` que valide el listado (GET) y la creación (POST) de usuarios con sus restricciones.
- [x] 2.2 **GREEN**: Implementar el Route Handler `/api/admin/usuarios` en `src/app/api/admin/usuarios/route.ts` para que pasen las pruebas.
- [x] 2.3 **REFACTOR**: Optimizar y limpiar la lógica del Route Handler en `src/app/api/admin/usuarios/route.ts`.
- [ ] 2.4 **RED**: Crear prueba de integración en `src/app/api/admin/usuarios/[id]/__tests__/route.test.ts` que valide la edición (PUT), la eliminación (DELETE) y la prevención de auto-eliminación/degradación.
- [ ] 2.5 **GREEN**: Implementar el Route Handler en `src/app/api/admin/usuarios/[id]/route.ts` que haga pasar las pruebas.
- [ ] 2.6 **REFACTOR**: Limpiar y tipar adecuadamente el Route Handler `/api/admin/usuarios/[id]/route.ts`.

## Phase 3: UI & Styling
- [ ] 3.1 Crear la interfaz del CRUD de administración en `src/app/admin/usuarios/page.tsx` con soporte para listado, buscador de usuarios y modales.
- [ ] 3.2 Crear los estilos CSS Vanilla para la interfaz de administración en `src/app/admin/usuarios/usuarios.css`.

## Phase 4: Verification & Build
- [ ] 4.1 Ejecutar `npx tsc --noEmit` y `npm run lint` para validar que el proyecto compila limpiamente y no tiene advertencias.
- [ ] 4.2 Ejecutar la suite completa de pruebas unitarias (`npx vitest run`) confirmando cobertura total.
