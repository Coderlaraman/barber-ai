# Guía de Funcionalidad – Agenda y Disponibilidad

## Objetivo
- Gestionar bloqueos, liberar bloques y consultar disponibilidad.

## Reglas
- Duración mínima de bloque: 15m.
- No se permite bloquear pasado; evitar colisiones con citas.
- Liberar bloque sólo si no hay citas confirmadas dentro.

## API
- `POST /scheduler/blocks`
- `POST /scheduler/blocks/release`
- `GET /scheduler/availability`

## Eventos
- `schedule.blocked`, `schedule.released`, `schedule.updated`.

## Arquitectura
- Domain: entidades `Bloque`, `Disponibilidad`.
- Application: casos de uso crear/liberar/consultar.
- Infra: repositorio Postgres y publisher Redis.