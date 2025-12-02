# Rating & Reviews Service

Servicio de calificaciones y reseñas para Barber AI. Este servicio gestiona las calificaciones y reseñas de los clientes sobre los barberos y sus servicios.

## Características

- CRUD completo de calificaciones
- Validación de rangos de calificación (1-5)
- Prevención de calificaciones duplicadas
- Estadísticas de calificaciones por barbero
- Integración con el servicio de Ranking para actualización automática

## Instalación

```bash
npm install
```

## Configuración

Copia el archivo `.env.example` a `.env` y configura las variables de entorno:

```bash
cp .env.example .env
```

## Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

## Endpoints

- `POST /ratings` - Crear una nueva calificación
- `GET /ratings/:id` - Obtener una calificación por ID
- `GET /ratings` - Listar calificaciones con filtros
- `PUT /ratings/:id` - Actualizar una calificación
- `DELETE /ratings/:id` - Eliminar una calificación
- `GET /ratings/barber/:barberId/stats` - Estadísticas de calificaciones por barbero
- `GET /ratings/appointment/:appointmentId/check` - Verificar si una cita fue calificada

## Documentación

La documentación Swagger está disponible en: `http://localhost:3008/docs`

## Integración con Ranking Service

Este servicio emite eventos que son consumidos por el Ranking Service para actualizar las métricas de los barberos:

- `rating.created` - Cuando se crea una nueva calificación
- `rating.updated` - Cuando se actualiza una calificación
- `rating.deleted` - Cuando se elimina una calificación