# Proposal: CRUD de Usuarios con Rol en el Panel de Administrador

## Intent
Implementar un panel de administración en Next.js que permita realizar la creación, lectura, actualización y eliminación (CRUD) de usuarios del sistema académico, asociándoles roles de forma segura y validando su número de cédula.

## Scope

### In Scope
- Creación de API Routes `/api/admin/usuarios` y `/api/admin/usuarios/[id]` con soporte para operaciones GET, POST, PUT y DELETE.
- Creación de la vista principal del panel en `/src/app/admin/usuarios/page.tsx` para listar usuarios con filtros por rol y búsqueda.
- Formulario de creación y edición interactivo con validaciones de campos (nombre no vacío, email válido, cédula ecuatoriana válida).
- Middleware de Next.js (`src/proxy.ts`) configurado para asegurar que solo los usuarios con rol `'admin'` accedan a estas rutas de API y vistas.
- Pruebas unitarias de las operaciones del CRUD y validación de entrada usando Vitest (TDD).

### Out of Scope
- Interfaz para vincular docentes con materias (se posterga para la fase académica).
- Recuperación de contraseñas por email.

## Approach
- Mapear las acciones del frontend a los Route Handlers de API de Next.js.
- Consultar y modificar datos en MySQL mediante Drizzle ORM con transacciones seguras.
- Contraseñas de nuevos usuarios hasheadas por defecto con `bcryptjs` (usando su cédula como contraseña inicial si no se provee una).
- Restricción de acceso en `/api/admin/*` y `/admin/*` mediante validación de JWT en `proxy.ts`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/admin/usuarios/page.tsx` | New | Interfaz de usuario para la administración de usuarios (CSS Vanilla). |
| `src/app/api/admin/usuarios/route.ts` | New | API para listar y crear usuarios. |
| `src/app/api/admin/usuarios/[id]/route.ts`| New | API para obtener, actualizar y eliminar un usuario específico. |
| `src/proxy.ts` | Modified | Ampliar el middleware para denegar el acceso a subrutas de `/admin` y `/api/admin` si el rol no es 'admin'. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Eliminación accidental de administradores | Low | Impedir que un administrador se elimine a sí mismo del sistema. |
| Elevación de privilegios | Medium | Validar que el rol del usuario que realiza la petición sea estrictamente 'admin' antes de procesar cambios de rol. |

## Rollback Plan
Revertir los commits de Git y borrar las rutas de API y vistas de administración creadas.

## Dependencies
- Ninguna dependencia externa adicional (usaremos `drizzle-orm`, `bcryptjs` y `jose` que ya están configuradas).

## Success Criteria
- [ ] Listado de usuarios cargando correctamente desde MySQL.
- [ ] Creación exitosa de usuarios con cédula válida y asignación de rol.
- [ ] Edición correcta de nombre, email y rol de un usuario existente.
- [ ] Un usuario no administrador (docente/padre) recibe 403 Forbidden al intentar acceder al CRUD.
- [ ] Todos los tests de integración del CRUD en verde.
