# Guía de Funcionalidad – Buscador

## Objetivo
- Búsqueda de barberos por filtros y relevancia.

## Reglas
- Filtros: ubicación, disponibilidad, precio, calificación, especialización.
- Relevancia: cercanía, rating ponderado, recencia y actividad.

## API
- `GET /search`

## Cache
- Redis para respuestas parametrizadas; invalidación por eventos de agenda y reseñas.

## Arquitectura
- Domain: `CriterioBusqueda`, `Resultado`.
- Application: composición de filtros y ranking.
- Infra: cache Redis y data providers.