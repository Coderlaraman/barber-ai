# Guía de Funcionalidad – Notificaciones

## Objetivo
- Consumir eventos y enviar notificaciones.

## Reglas
- Preferencias por usuario; respetar "no molestar".
- Idempotencia y registro de entregas.

## API
- `GET /notifications/health`

## Suscripción
- Canales Redis: `schedule.*`, `booking.*`, `review.*`.

## Arquitectura
- Domain: `Notificacion`, `Preferencia`.
- Application: enrutamiento por tipo de evento.
- Infra: proveedores (push/email/SMS) y suscriptor Redis.