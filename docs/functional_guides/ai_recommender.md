# Guía de Funcionalidad – IA de Recomendación

## Objetivo
- Sugerir cortes basados en rasgos, historial y tendencias.

## Reglas
- Confirmación del cliente requerida; registro de inputs/outputs.
- Transparencia de recomendaciones y posibilidad de feedback.

## API
- `GET /health`
- `POST /recommend`

## Arquitectura
- Carga de modelo (ONNX) y preprocesamiento.
- Domain: `Sugerencia`, `RasgosFaciales`.
- Application: inferencia y postprocesado.
- Infra: almacenamiento de resultados y auditoría.