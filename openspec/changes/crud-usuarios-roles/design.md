# Design: CRUD de Usuarios con Rol en el Panel de Administrador

## Technical Approach
Implementar los Route Handlers de Next.js en `/api/admin/usuarios` y `/api/admin/usuarios/[id]` para gestionar las operaciones del CRUD. Las consultas a la base de datos MySQL se realizarán mediante Drizzle ORM. La protección se centralizará en el middleware `proxy.ts` y se reforzará dentro de los endpoints. La UI se desarrollará en `/admin/usuarios` con CSS Vanilla y soporte responsivo.

## Architecture Decisions

| Decision | Option | Tradeoff | Decision |
|----------|--------|----------|----------|
| **Eliminación** | Física | Simple de implementar. Requiere borrar en cascada (Drizzle `onDelete: 'cascade'` o validación). | **Elegido** |
| **Formularios** | Modales en la misma vista | Menos archivos y estados de navegación. UI más dinámica. | **Elegido** |
| **Validación Backend** | Zod (implícito en código) | Validaciones manuales con utilidades existentes para simplificar. | **Elegido** |

## Data Flow

```
[Admin UI (/admin/usuarios)] ──(Petición HTTP JSON)──→ [Proxy (proxy.ts)]
       ▲                                                     │
       │ (Verifica rol == 'admin' en JWT) ◄──────────────────┘
       │                                                     ▼
 [Render Listado / Modales] ◄───(JSON 200/201)─── [API `/api/admin/usuarios/*`]
                                                             │
                                                     (Drizzle Query/Command)
                                                             ▼
                                                    [Base de Datos MySQL]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/proxy.ts` | Modify | Ampliar el control de acceso para que bloquee `/admin` y `/api/admin` si el rol no es 'admin'. |
| `src/app/api/admin/usuarios/route.ts` | Create | GET (listar usuarios con join de roles) y POST (crear usuario validando cédula y hasheando clave). |
| `src/app/api/admin/usuarios/[id]/route.ts` | Create | PUT (editar nombre, email, rol) y DELETE (eliminar usuario previniendo auto-eliminación). |
| `src/app/admin/usuarios/page.tsx` | Create | Página principal del panel de administración (Tabla, Buscador, Modales de formulario). |
| `src/app/admin/usuarios/usuarios.css` | Create | Estilos CSS Vanilla premium para la interfaz de administración. |

## Interfaces / Contracts

### API Contracts

#### POST `/api/admin/usuarios`
- **Request Body**:
  ```json
  {
    "cedula": "1710034057",
    "nombre": "Juan Pérez",
    "email": "juan@correo.com",
    "rolId": 2
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "usuarioId": 4
  }
  ```

#### PUT `/api/admin/usuarios/[id]`
- **Request Body**:
  ```json
  {
    "nombre": "Juan Pérez Editado",
    "email": "juan_nuevo@correo.com",
    "rolId": 3
  }
  ```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Validación de payload del CRUD | Testear validación de cédulas repetidas y datos corruptos. |
| Integration | API Endpoint POST `/api/admin/usuarios` | Mockear la base de datos para simular inserciones correctas y duplicados de cédula. |
| Integration | API Endpoint DELETE `/api/admin/usuarios/[id]` | Probar que el backend retorne 400 Bad Request si el ID a eliminar coincide con el del administrador logueado. |

## Migration / Rollout
No se requieren migraciones de base de datos adicionales. Las tablas `usuarios` y `roles` necesarias ya fueron desplegadas y sembradas en Hostinger.

## Open Questions
*Ninguna.*
