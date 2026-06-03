# Auth Specification

## Purpose
Establecer las reglas para el login de usuarios (docentes, padres de familia, y administradores) en base a su número de cédula, controlando el acceso a sus respectivos paneles.

## Requirements

### Requirement: Autenticación por Cédula
El sistema MUST requerir un número de cédula como identificador (usuario) y una contraseña para autenticar a docentes y padres.

#### Scenario: Login Exitoso de Docente o Padre
- GIVEN el usuario "1724567890" existe con la contraseña hash en base de datos con rol "Docente"
- WHEN el usuario ingresa la cédula "1724567890" y contraseña válida
- THEN el sistema genera un token de sesión JWT seguro
- AND redirige al panel `/docente`

#### Scenario: Intento de Login con Contraseña Incorrecta
- GIVEN el usuario "1724567890" existe
- WHEN el usuario ingresa la cédula "1724567890" y contraseña incorrecta
- THEN el sistema deniega el acceso con un código HTTP 401
- AND muestra el mensaje "Cédula o contraseña incorrecta"

#### Scenario: Validación de Algoritmo de Cédula Ecuatoriana
El sistema MUST validar que el formato y el dígito verificador de la cédula ecuatoriana sean válidos antes de procesar el login.
- GIVEN el usuario ingresa una cédula inválida "1724567899" (dígito verificador erróneo)
- WHEN intenta iniciar sesión
- THEN el sistema responde con error de validación sin consultar la base de datos

### Requirement: Control de Acceso por Middleware
El sistema MUST restringir las páginas del sistema según el rol del usuario utilizando un proxy (middleware) de Next.js 16.

#### Scenario: Acceso no Autorizado a Panel de Docente
- GIVEN un usuario con rol "Padre" o un usuario no autenticado
- WHEN intenta acceder directamente a `/docente/dashboard`
- THEN el sistema redirige al usuario a la página de `/login` con un código HTTP 307
