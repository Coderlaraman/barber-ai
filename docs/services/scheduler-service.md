# Scheduler Service

Servicio de agenda y disponibilidad para el sistema BarberIA. Gestiona el calendario de barberos, franjas horarias, disponibilidad y conflictos de citas. Proporciona la lógica de negocio para la programación de citas.

## Características Principales

### Gestión de Disponibilidad
- **Horarios de Trabajo**: Definición de horarios por barbero y día de la semana
- **Bloques de Tiempo**: Gestión de franjas horarias disponibles
- **Excepciones**: Manejo de días festivos, vacaciones y ausencias
- **Duración de Servicios**: Cálculo automático según servicio seleccionado

### Gestión de Citas
- **Creación de Citas**: Validación de disponibilidad y conflictos
- **Modificación**: Cambios de fecha/hora con validación
- **Cancelación**: Liberación de espacos y notificaciones
- **Confirmación**: Sistema de confirmación bidireccional

### Validaciones Inteligentes
- **Conflictos de Horario**: Prevención de citas superpuestas
- **Tiempo de Servicio**: Validación según duración del servicio
- **Antelación Mínima**: Restricciones de tiempo para nuevas citas
- **Horario Laboral**: Respeto a horarios establecidos

### Optimización de Agenda
- **Búsqueda de Huecos**: Identificación de espacios disponibles
- **Reorganización**: Sugerencias de cambios optimizados
- **Estadísticas**: Análisis de ocupación y eficiencia
- **Predicción**: Estimación de tiempos basada en histórico

## Endpoints

### Gestión de Citas

#### POST /appointments
Crea una nueva cita con validación de disponibilidad.

**Request Body:**
```json
{
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "branchId": "123e4567-e89b-12d3-a456-426614174002",
  "serviceId": "123e4567-e89b-12d3-a456-426614174003",
  "appointmentDate": "2024-01-15",
  "startTime": "14:00",
  "endTime": "15:00",
  "totalPrice": 25.00,
  "notes": "Corte de cabello y barba",
  "type": "HAIRCUT"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "branchId": "123e4567-e89b-12d3-a456-426614174002",
  "serviceId": "123e4567-e89b-12d3-a456-426614174003",
  "appointmentDate": "2024-01-15T00:00:00.000Z",
  "startTime": "14:00",
  "endTime": "15:00",
  "totalPrice": 25.00,
  "status": "PENDING",
  "type": "HAIRCUT",
  "notes": "Corte de cabello y barba",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
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

#### GET /appointments/:id
Obtiene los detalles de una cita específica.

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "branchId": "123e4567-e89b-12d3-a456-426614174002",
  "serviceId": "123e4567-e89b-12d3-a456-426614174003",
  "appointmentDate": "2024-01-15T00:00:00.000Z",
  "startTime": "14:00",
  "endTime": "15:00",
  "totalPrice": 25.00,
  "status": "CONFIRMED",
  "type": "HAIRCUT",
  "notes": "Corte de cabello y barba",
  "paymentStatus": "PENDING",
  "confirmedAt": "2024-01-01T13:00:00.000Z",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T13:00:00.000Z"
}
```

#### GET /appointments
Obtiene citas con filtros opcionales.

**Query Parameters:**
- `barberId` (opcional): ID del barbero
- `clientId` (opcional): ID del cliente
- `date` (opcional): Fecha específica (YYYY-MM-DD)
- `startDate` (opcional): Fecha de inicio del rango
- `endDate` (opcional): Fecha de fin del rango
- `status` (opcional): Estado de la cita

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174004",
    "clientId": "123e4567-e89b-12d3-a456-426614174000",
    "barberId": "123e4567-e89b-12d3-a456-426614174001",
    "branchId": "123e4567-e89b-12d3-a456-426614174002",
    "serviceId": "123e4567-e89b-12d3-a456-426614174003",
    "appointmentDate": "2024-01-15T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "15:00",
    "totalPrice": 25.00,
    "status": "CONFIRMED",
    "type": "HAIRCUT",
    "notes": "Corte de cabello y barba"
  }
]
```

#### PUT /appointments/:id
Actualiza una cita existente.

**Request Body:**
```json
{
  "appointmentDate": "2024-01-16",
  "startTime": "15:00",
  "endTime": "16:00",
  "notes": "Corte de cabello y barba - actualizado"
}
```

#### PUT /appointments/:id/confirm
Confirma una cita pendiente.

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "status": "CONFIRMED",
  "confirmedAt": "2024-01-01T13:00:00.000Z",
  "updatedAt": "2024-01-01T13:00:00.000Z"
}
```

### Gestión de Disponibilidad

#### POST /availability
Crea una nueva disponibilidad de barbero.

**Request Body:**
```json
{
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "branchId": "123e4567-e89b-12d3-a456-426614174002",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "18:00",
  "isActive": true,
  "breakStartTime": "13:00",
  "breakEndTime": "14:00"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "branchId": "123e4567-e89b-12d3-a456-426614174002",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "18:00",
  "isActive": true,
  "breakStartTime": "13:00",
  "breakEndTime": "14:00",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

#### GET /availability
Obtiene disponibilidades con filtros.

**Query Parameters:**
- `barberId` (opcional): ID del barbero
- `dayOfWeek` (opcional): Día de la semana (0-6)
- `startDate` (opcional): Fecha de inicio del rango
- `endDate` (opcional): Fecha de fin del rango

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174005",
    "barberId": "123e4567-e89b-12d3-a456-426614174001",
    "branchId": "123e4567-e89b-12d3-a456-426614174002",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "18:00",
    "isActive": true,
    "breakStartTime": "13:00",
    "breakEndTime": "14:00"
  }
]
```

#### POST /availability/generate-slots
Genera franjas horarias automáticamente.

**Request Body:**
```json
{
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "startDate": "2024-01-15",
  "endDate": "2024-01-21",
  "slotDuration": 30
}
```

### Health Check

#### GET /health
Verifica el estado del servicio.

**Response (200):**
```json
{
  "status": "ok",
  "service": "scheduler",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Modelos de Datos

### Appointment Entity
```typescript
@Entity('appointments')
@Unique(['barberId', 'appointmentDate', 'startTime'])
@Check('end_time > start_time')
@Check('total_price >= 0')
@Index(['clientId', 'appointmentDate'])
@Index(['barberId', 'appointmentDate'])
@Index(['status', 'appointmentDate'])
@Index(['appointmentDate', 'startTime'])
export class Appointment extends BaseEntity {
  @ApiProperty({ description: 'ID del cliente' })
  @Column({ name: 'client_id', type: 'uuid', nullable: false })
  clientId!: string;

  @ApiProperty({ description: 'ID del barbero' })
  @Column({ name: 'barber_id', type: 'uuid', nullable: false })
  barberId!: string;

  @ApiProperty({ description: 'ID de la sucursal' })
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId!: string;

  @ApiProperty({ description: 'ID del servicio' })
  @Column({ name: 'service_id', type: 'uuid', nullable: false })
  serviceId!: string;

  @ApiProperty({ description: 'Fecha de la cita' })
  @Column({ name: 'appointment_date', type: 'date', nullable: false })
  appointmentDate!: Date;

  @ApiProperty({ description: 'Hora de inicio' })
  @Column({ name: 'start_time', type: 'time', nullable: false })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin' })
  @Column({ name: 'end_time', type: 'time', nullable: false })
  endTime!: string;

  @ApiProperty({ description: 'Precio total' })
  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, nullable: false })
  totalPrice!: number;

  @ApiProperty({ description: 'Estado de la cita' })
  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: AppointmentStatus, 
    default: AppointmentStatus.PENDING 
  })
  status!: AppointmentStatus;

  @ApiProperty({ description: 'Tipo de cita' })
  @Column({ 
    name: 'type', 
    type: 'enum', 
    enum: AppointmentType, 
    default: AppointmentType.HAIRCUT 
  })
  type!: AppointmentType;

  @ApiProperty({ description: 'Estado del pago' })
  @Column({ 
    name: 'payment_status', 
    type: 'enum', 
    enum: PaymentStatus, 
    default: PaymentStatus.PENDING 
  })
  paymentStatus!: PaymentStatus;

  @ApiProperty({ description: 'Notas adicionales' })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Fecha de confirmación' })
  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  @ApiProperty({ description: 'Razón de cancelación' })
  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string;
}
```

### BarberAvailability Entity
```typescript
@Entity('barber_availabilities')
@Unique(['barberId', 'branchId', 'dayOfWeek'])
@Index(['barberId', 'isActive'])
@Index(['branchId', 'isActive'])
export class BarberAvailability extends BaseEntity {
  @ApiProperty({ description: 'ID del barbero' })
  @Column({ name: 'barber_id', type: 'uuid', nullable: false })
  barberId!: string;

  @ApiProperty({ description: 'ID de la sucursal' })
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId!: string;

  @ApiProperty({ description: 'Día de la semana (0-6)' })
  @Column({ name: 'day_of_week', type: 'integer', nullable: false })
  dayOfWeek!: number;

  @ApiProperty({ description: 'Hora de inicio' })
  @Column({ name: 'start_time', type: 'time', nullable: false })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin' })
  @Column({ name: 'end_time', type: 'time', nullable: false })
  endTime!: string;

  @ApiProperty({ description: '¿Está activa esta disponibilidad?' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Hora de inicio del descanso' })
  @Column({ name: 'break_start_time', type: 'time', nullable: true })
  breakStartTime?: string;

  @ApiProperty({ description: 'Hora de fin del descanso' })
  @Column({ name: 'break_end_time', type: 'time', nullable: true })
  breakEndTime?: string;

  @ApiProperty({ description: 'Notas adicionales' })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;
}
```

### Estados de Cita
```typescript
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}
```

### Tipos de Cita
```typescript
export enum AppointmentType {
  HAIRCUT = 'HAIRCUT',
  BEARD_TRIM = 'BEARD_TRIM',
  HAIRCUT_AND_BEARD = 'HAIRCUT_AND_BEARD',
  SHAVE = 'SHAVE',
  COLORING = 'COLORING',
  TREATMENT = 'TREATMENT',
  CONSULTATION = 'CONSULTATION'
}
```

### Estados de Pago
```typescript
export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}
```

## Configuración de Entorno

```bash
# Puerto del servicio
PORT=3002

# Base de datos PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=barberia_scheduler
DB_USER=postgres
DB_PASSWORD=password

# Redis para caché y pub/sub
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Servicios relacionados
BOOKING_SERVICE_URL=http://booking-service:3005
NOTIFICATION_SERVICE_URL=http://notifications-service:3003
```

## Dependencias Principales

- **@nestjs/typeorm**: ORM para PostgreSQL
- **@nestjs/swagger**: Documentación de API
- **date-fns**: Manipulación de fechas
- **typeorm**: Mapeo objeto-relacional
- **pg**: Driver de PostgreSQL
- **redis**: Caché y pub/sub
- **class-validator**: Validación de DTOs
- **class-transformer**: Transformación de objetos

## Despliegue

### Desarrollo
```bash
cd services/scheduler-service
npm install
npm run dev
```

### Producción
```bash
cd services/scheduler-service
npm install
npm run build
npm run start
```

### Docker
```bash
docker build -t barberia-scheduler-service .
docker run -p 3002:3002 --env-file .env barberia-scheduler-service
```

## Integración con Otros Servicios

### Booking Service
- Validación de disponibilidad antes de crear citas
- Sincronización de estados de cita
- Notificación de cambios en agenda

### Notification Service
- Alertas de nuevas citas a barberos
- Recordatorios automáticos de citas
- Notificaciones de cambios/cancelaciones

### User Service
- Validación de clientes y barberos
- Gestión de preferencias de horarios
- Información de contacto para notificaciones

## Monitoreo y Métricas

### Health Check
- Endpoint: `GET /health`
- Respuesta: `{ "status": "ok", "service": "scheduler", "timestamp": "2024-01-01T12:00:00.000Z" }`

### Métricas de Rendimiento
- Tiempo de validación de disponibilidad: < 100ms
- Tiempo de creación de cita: < 200ms
- Disponibilidad del servicio: 99.9%

### Métricas de Negocio
- Ocupación de barberos por día/semana
- Tiempo promedio entre citas
- Tasa de cancelaciones
- Distribución de tipos de servicio
- Horarios más solicitados

## Escalabilidad y Rendimiento

### Optimizaciones
- Índices de base de datos en clientId, barberId, appointmentDate, status
- Caché Redis para disponibilidad frecuente
- Validaciones en memoria para conflictos
- Procesamiento asíncrono de notificaciones

### Escalabilidad
- Arquitectura de microservicios para escalado independiente
- Base de datos con particionamiento por fecha
- Redis Cluster para caché distribuido
- Replicación de base de datos para lecturas