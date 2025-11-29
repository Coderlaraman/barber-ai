# Guía de Funcionalidad – Ranking

## Objetivo
- Cálculo de ranking por eventos y procesos batch.

## Reglas
- Métrica compuesta: rating ponderado, volumen, retención, premium realizados.
- Rankings por ubicación, ciudad, país y global.

## API
- `POST /ranking/recalculate`

## Suscripción
- Eventos: `booking.completed`, `review.created`, `portfolio.item.created`.

## Arquitectura
- Domain: `Ranking`, `Metrica`.
- Application: agregación y normalización.
- Infra: suscriptor Redis y repositorio Postgres.