# Admin Usuarios Specification

## Purpose
Establecer las reglas de negocio y escenarios para el CRUD (Creación, Lectura, Actualización y Eliminación) de usuarios y la asignación de sus roles en el panel de administración.

## Requirements

### Requirement: Acceso Protegido al Panel
El panel de administración y sus endpoints asociados MUST ser accesibles única y exclusivamente por usuarios con el rol `'admin'`.

#### Scenario: Acceso de Admin Exitoso
- GIVEN un usuario autenticado con rol `'admin'`
- WHEN intenta acceder a `/admin/usuarios` u operar sobre `/api/admin/usuarios`
- THEN el sistema le permite el acceso y devuelve la información solicitada

#### Scenario: Acceso Rechazado para No-Admins
- GIVEN un usuario autenticado con rol `'docente'` o `'padre'`
- WHEN intenta acceder a `/admin/usuarios` o realizar llamadas a `/api/admin/usuarios`
- THEN el sistema MUST denegar el acceso redirigiendo a `/login` o retornando código HTTP 403 Forbidden

### Requirement: Validación en la Creación de Usuarios
El sistema MUST validar que la cédula ingresada sea válida bajo el algoritmo de verificación ecuatoriano y que no esté duplicada en la base de datos.

#### Scenario: Creación Exitosa
- GIVEN el formulario de creación con la cédula válida "1710034057", nombre "Nuevo Admin", email "admin@academico.com" y rol "admin"
- WHEN el administrador envía el formulario
- THEN el sistema crea el usuario hasheando la contraseña y lo persiste en la base de datos

#### Scenario: Error por Cédula Duplicada
- GIVEN que la cédula "1710034057" ya existe en la base de datos
- WHEN el administrador intenta registrar un nuevo usuario con la misma cédula
- THEN el sistema MUST rechazar el registro con un código de error de conflicto (HTTP 409)

### Requirement: Edición Segura de Datos
El sistema MUST permitir la actualización del nombre, email y rol del usuario, pero MUST impedir que un administrador se edite su propio rol a uno inferior.

#### Scenario: Auto-Degradación Prohibida
- GIVEN un administrador logueado con ID 1
- WHEN intenta cambiar su propio rol a "docente" o "padre"
- THEN el sistema MUST denegar la actualización con un error HTTP 400 Bad Request

### Requirement: Eliminación Restringida
El sistema MUST permitir la eliminación de usuarios, pero un administrador bajo ninguna circunstancia MUST ser capaz de eliminarse a sí mismo.

#### Scenario: Auto-Eliminación Prohibida
- GIVEN un administrador logueado con ID 1
- WHEN intenta enviar una petición DELETE para su propio ID
- THEN el sistema MUST denegar la eliminación con un error HTTP 400 Bad Request
