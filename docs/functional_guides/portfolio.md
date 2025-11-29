# Guía de Funcionalidad – Portafolio y Media

## Objetivo
- Registrar ítems de portafolio con metadata y media.

## Reglas
- Consentimiento del cliente para publicación.
- Moderación y derecho a desindexación.

## API
- `POST /portfolio/items`

## Arquitectura
- Domain: `ItemPortafolio`, `Etiqueta`.
- Application: crear/editar/moderar ítems.
- Infra: almacenamiento S3/Firebase y repositorio Postgres.