# Guía de Funcionalidad – Autenticación

## Objetivo
- Registro, login y refresh tokens con JWT.

## Reglas
- Validar email único; password con mínimo 8 caracteres.
- Roles: `Cliente`, `Barbero`, `Admin`.
- Tokens: access corto, refresh más largo; revocación en logout y cambios críticos.

## API
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

## Arquitectura
- Clean Architecture; casos de uso para registro/login/refresh.
- Persistencia en Postgres; cache de sesiones en Redis.

## Seguridad
- Hash con bcrypt; bearer auth; rate limit por IP.