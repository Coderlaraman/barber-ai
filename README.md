# BarberIA – Plataforma de Microservicios

BarberIA es un ecosistema para barberos y clientes compuesto por:
- App móvil para barberos (gestión profesional)
- Web para clientes (descubrimiento, reservas y portafolio)

La arquitectura está basada en microservicios con NestJS y FastAPI, un API Gateway, Postgres y Redis, todo orquestado con Docker Compose.

## Servicios
- `api-gateway` (NestJS): Proxy de rutas públicas y documentación de API (`/docs`).
- `auth-service` (NestJS): Autenticación y usuarios (JWT). Endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`.
- `scheduler-service` (NestJS): Agenda y disponibilidad. Endpoints: `/scheduler/blocks`, `/scheduler/blocks/release`, `/scheduler/availability`.
- `notifications-service` (NestJS): Suscripción a eventos y envío de notificaciones. Endpoint: `/notifications/health`.
- `portfolio-service` (NestJS): Portafolio del barbero y media. Endpoint: `/portfolio/items`.
- `search-service` (NestJS): Búsqueda avanzada de barberos. Endpoint: `/search`.
- `ranking-service` (NestJS): Ranking por eventos. Endpoint: `/ranking/recalculate`.
- `ai-recommender-service` (FastAPI): Salud y recomendación (stub). Endpoints: `/health`, `/recommend`.

## Levantar el entorno
```bash
docker compose build
docker compose up -d
```

Gateway disponible en `http://localhost:8085`. Auth-service en `http://localhost:3001`.

## Autenticación
```bash
curl -X POST http://localhost:3001/auth/register -H 'Content-Type: application/json' -d '{"email":"barber@example.com","password":"password123","role":"BARBER"}'
curl -X POST http://localhost:8085/auth/login -H 'Content-Type: application/json' -d '{"email":"barber@example.com","password":"password123"}'
```

## Documentación de API
- Gateway: `http://localhost:8085/docs`
- Auth: `http://localhost:3001/docs`

## Principios de arquitectura
- Clean Architecture por servicio
- Eventos en Redis para integración y cache
- Postgres como fuente de verdad, Redis para cache/pub-sub
- Observabilidad y CORS activados

## Desarrollo
- Cada servicio posee su propio `package.json` y `tsconfig.json`.
- Instalar dependencias por servicio: `npm install && npm run build` dentro de cada carpeta.

## Próximos pasos
- Definir contratos de eventos y librería de tipos compartidos
- Añadir casos de uso y entidades por servicio
- Integrar autorizaciones y auditoría