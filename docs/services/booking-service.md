# Booking Service

Servicio de gestión de citas y reservas para el sistema BarberIA. Proporciona funcionalidades completas para la creación, modificación y seguimiento de citas entre clientes y barberos.

## Características Principales

### Gestión de Citas
- **Creación de Citas**: Reserva de citas con validación de disponibilidad
- **Confirmación de Citas**: Sistema de confirmación bidireccional (cliente/barbero)
- **Modificación de Citas**: Cambios de fecha, hora y servicios
- **Cancelación de Citas**: Cancelación con razones y notificaciones
- **Estados de Citas**: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW

### Validaciones Inteligentes
- **Disponibilidad de Barbero**: Verificación en tiempo real de horarios
- **Conflictos de Horario**: Prevención de citas superpuestas
- **Validación de Servicios**: Verificación de existencia de servicios
- **Límites de Tiempo**: Restricciones de antelación mínima

### Notificaciones y Recordatorios
- **Confirmaciones**: Notificaciones de confirmación de cita
- **Recordatorios**: Alertas automáticas antes de la cita
- **Cambios**: Notificaciones de modificaciones
- **Cancelaciones**: Alertas inmediatas de cancelación

## Endpoints

### Gestión de Citas

#### POST /bookings
Crea una nueva cita en el sistema.

**Request Body:**
```json
{
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "serviceId": "123e4567-e89b-12d3-a456-426614174002",
  "date": "2024-01-15",
  "startTime": "14:00",
  "endTime": "15:00",
  "price": 25.00,
  "notes": "Corte de cabello y barba"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "serviceId": "123e4567-e89b-12d3-a456-426614174002",
  "date": "2024-01-15",
  "startTime": "14:00",
  "endTime": "15:00",
  "price": 25.00,
  "status": "PENDING",
  "notes": "Corte de cabello y barba",
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

**Conflict Response (409):**
```json
{
  "statusCode": 409,
  "message": "El barbero no está disponible en ese horario",
  "error": "Conflict"
}
```

#### GET /bookings/:id
Obtiene los detalles de una cita específica.

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "serviceId": "123e4567-e89b-12d3-a456-426614174002",
  "date": "2024-01-15",
  "startTime": "14:00",
  "endTime": "15:00",
  "price": 25.00,
  "status": "CONFIRMED",
  "notes": "Corte de cabello y barba",
  "confirmedBy": "CLIENT",
  "confirmedAt": "2024-01-01T13:00:00Z",
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T13:00:00Z"
}
```

### Consultas por Entidad

#### GET /bookings/client/:clientId
Obtiene todas las citas de un cliente específico.

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "clientId": "123e4567-e89b-12d3-a456-426614174000",
    "barberId": "123e4567-e89b-12d3-a456-426614174001",
    "serviceId": "123e4567-e89b-12d3-a456-426614174002",
    "date": "2024-01-15",
    "startTime": "14:00",
    "endTime": "15:00",
    "price": 25.00,
    "status": "CONFIRMED",
    "notes": "Corte de cabello y barba",
    "createdAt": "2024-01-01T12:00:00Z"
  }
]
```

#### GET /bookings/barber/:barberId
Obtiene todas las citas de un barbero específico.

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "clientId": "123e4567-e89b-12d3-a456-426614174000",
    "barberId": "123e4567-e89b-12d3-a456-426614174001",
    "serviceId": "123e4567-e89b-12d3-a456-426614174002",
    "date": "2024-01-15",
    "startTime": "14:00",
    "endTime": "15:00",
    "price": 25.00,
    "status": "CONFIRMED",
    "notes": "Corte de cabello y barba",
    "createdAt": "2024-01-01T12:00:00Z"
  }
]
```

#### GET /bookings/date/:date
Obtiene todas las citas para una fecha específica.

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "clientId": "123e4567-e89b-12d3-a456-426614174000",
    "barberId": "123e4567-e89b-12d3-a456-426614174001",
    "serviceId": "123e4567-e89b-12d3-a456-426614174002",
    "date": "2024-01-15",
    "startTime": "14:00",
    "endTime": "15:00",
    "price": 25.00,
    "status": "CONFIRMED",
    "notes": "Corte de cabello y barba"
  }
]
```

### Gestión de Estado

#### PUT /bookings/:id/confirm
Confirma una cita pendiente.

**Query Parameters:**
- `confirmedBy`: CLIENT | BARBER | SYSTEM

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "status": "CONFIRMED",
  "confirmedBy": "CLIENT",
  "confirmedAt": "2024-01-01T13:00:00Z",
  "updatedAt": "2024-01-01T13:00:00Z"
}
```

## Modelos de Datos

### Booking Entity
```typescript
@Entity('bookings')
@Index(['clientId', 'date'])
@Index(['barberId', 'date'])
@Index(['status', 'date'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  clientId: string

  @Column({ type: 'uuid' })
  barberId: string

  @Column({ type: 'uuid' })
  serviceId: string

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'time' })
  startTime: string

  @Column({ type: 'time' })
  endTime: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number

  @Column({ 
    type: 'enum', 
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'], 
    default: 'PENDING' 
  })
  status: BookingStatus

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ 
    type: 'enum', 
    enum: ['CLIENT', 'BARBER', 'SYSTEM'], 
    nullable: true 
  })
  confirmedBy: BookingConfirmedBy

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date

  @Column({ type: 'text', nullable: true })
  cancellationReason: string
}
```

### Estados de Cita
- **PENDING**: Cita creada pero no confirmada
- **CONFIRMED**: Cita confirmada por cliente, barbero o sistema
- **CANCELLED**: Cita cancelada
- **COMPLETED**: Cita completada exitosamente
- **NO_SHOW**: Cliente no se presentó

## Validaciones y Reglas de Negocio

### Disponibilidad
- No se pueden crear citas en horarios pasados
- Validación de conflictos de horario (no superposición)
- Verificación de disponibilidad del barbero
- Antelación mínima de 1 hora para nuevas citas

### Precios
- Los precios se basan en el servicio seleccionado
- Validación de rangos de precios (0.01 - 1000.00)
- Moneda por defecto: USD

### Duración
- La hora de fin debe ser posterior a la hora de inicio
- Duración mínima: 15 minutos
- Duración máxima: 4 horas

## Configuración de Entorno

```bash
# Puerto del servicio
PORT=3005

# Base de datos PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=barberia_bookings
DB_USER=postgres
DB_PASSWORD=password

# Redis para caché y pub/sub
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Servicios relacionados
SCHEDULER_SERVICE_URL=http://scheduler-service:3006
NOTIFICATION_SERVICE_URL=http://notifications-service:3007
```

## Dependencias Principales

- **@nestjs/typeorm**: ORM para PostgreSQL
- **@nestjs/schedule**: Programación de tareas
- **typeorm**: Mapeo objeto-relacional
- **pg**: Driver de PostgreSQL
- **ioredis**: Cliente Redis de alto rendimiento
- **class-validator**: Validación de DTOs
- **class-transformer**: Transformación de objetos

## Despliegue

### Desarrollo
```bash
cd services/booking-service
npm install
npm run dev
```

### Producción
```bash
cd services/booking-service
npm install
npm run build
npm run start:prod
```

### Docker
```bash
docker build -t barberia-booking-service .
docker run -p 3005:3005 --env-file .env barberia-booking-service
```

## Integración con Otros Servicios

### Scheduler Service
- Verificación de disponibilidad de barberos
- Validación de horarios de trabajo
- Gestión de bloqueos de tiempo

### Notification Service
- Envío de confirmaciones de cita
- Recordatorios automáticos
- Notificaciones de cambios y cancelaciones

### User Service
- Validación de clientes y barberos
- Información de contacto para notificaciones
- Preferencias de comunicación

### Barber Service
- Información de servicios ofrecidos
- Precios y duración de servicios
- Disponibilidad actualizada

## Monitoreo y Métricas

### Health Check
- Endpoint: `GET /health`
- Respuesta: `{ "status": "ok", "service": "booking" }`

### Métricas de Rendimiento
- Tiempo de creación de cita: < 200ms
- Disponibilidad del servicio: 99.9%
- Tasa de confirmación: > 85%

### Métricas de Negocio
- Total de citas por día/semana/mes
- Tasa de cancelación
- Tiempo promedio de confirmación
- Distribución de estados de cita

## Escalabilidad y Rendimiento

### Optimizaciones
- Índices de base de datos en clientId, barberId, date, status
- Caché Redis para consultas frecuentes
- Paginación en listados grandes
- Conexiones de base de datos agrupadas

### Escalabilidad
- Arquitectura de microservicios para escalado independiente
- Base de datos con replicación
- Caché distribuido con Redis Cluster
- Procesamiento asíncrono de notificaciones