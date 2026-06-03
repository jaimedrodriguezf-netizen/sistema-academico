# Database Specification

## Purpose
Definir la estructura de base de datos relacional básica y las restricciones necesarias para el sistema de asistencia y roles.

## Requirements

### Requirement: Estructura de Tablas y Restricciones
La base de datos MySQL MUST estructurar las tablas base con integridad referencial e índices en columnas de búsqueda frecuente.

#### Scenario: Creación de Usuario Único por Cédula
- GIVEN la base de datos con la tabla `usuarios`
- WHEN se intenta registrar un usuario con una cédula que ya existe en la tabla `usuarios`
- THEN la base de datos MUST rechazar la inserción con un error de clave duplicada (Unique Constraint Violation)

### Requirement: Roles de Sistema
El sistema MUST admitir tres roles definidos: `admin`, `docente` y `padre`.

#### Scenario: Inicialización de Roles por Defecto (Seed)
- GIVEN que la tabla `roles` se inicializa mediante migraciones
- THEN la tabla MUST contener exactamente tres registros con identificadores para `admin`, `docente` y `padre`
