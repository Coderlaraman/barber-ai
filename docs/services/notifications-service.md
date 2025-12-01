# Notifications Service

Servicio de notificaciones multicanal para el sistema BarberIA. Proporciona envío de notificaciones a través de múltiples canales (email, SMS, push, in-app) con plantillas personalizables y gestión de preferencias de usuario.

## Características Principales

### Canales de Notificación
- **Email**: Envío de correos electrónicos con plantillas HTML
- **SMS**: Mensajes de texto a través de Twilio
- **Push Notifications**: Notificaciones push móviles via Firebase
- **In-App**: Notificaciones dentro de la aplicación

### Gestión de Plantillas
- **Plantillas Personalizables**: Templates para diferentes tipos de notificaciones
- **Variables Dinámicas**: Inyección de datos personalizados
- **Multiidioma**: Soporte para múltiples idiomas
- **Versionado**: Control de versiones de plantillas

### Preferencias de Usuario
- **Canal Preferido**: Usuario elige cómo recibir notificaciones
- **Frecuencia**: Control de frecuencia de notificaciones
- **Categorías**: Suscripción/desuscripción por tipo de notificación
- **Horarios**: Configuración de horarios de recepción

### Características Avanzadas
- **Programación**: Envío programado de notificaciones
- **Reintentos**: Sistema automático de reintentos en caso de fallo
- **Tracking**: Seguimiento de entrega y lectura
- **Batch Processing**: Procesamiento de notificaciones en lote

## Endpoints

### Gestión de Notificaciones

#### POST /notifications
Crea y envía una nueva notificación.

**Request Body:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174001",
  "type": "appointment_confirmed",
  "channel": "email",
  "title": "Cita Confirmada",
  "content": "Tu cita para el 15 de enero a las 14:00 ha sido confirmada.",
  "metadata": {
    "bookingId": "123e4567-e89b-12d3-a456-426614174003",
    "date": "2024-01-15",
    "time": "14:00",
    "barberName": "Juan Pérez"
  },
  "scheduledFor": "2024-01-14T20:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "userId": "123e4567-e89b-12d3-a456-426614174001",
  "type": "appointment_confirmed",
  "channel": "email",
  "title": "Cita Confirmada",
  "content": "Tu cita para el 15 de enero a las 14:00 ha sido confirmada.",
  "status": "pending",
  "metadata": {
    "bookingId": "123e4567-e89b-12d3-a456-426614174003",
    "date": "2024-01-15",
    "time": "14:00",
    "barberName": "Juan Pérez"
  },
  "createdAt": "2024-01-01T12:00:00Z"
}
```

#### GET /notifications/user/:userId
Obtiene el historial de notificaciones de un usuario.

**Query Parameters:**
- `limit` (opcional): Número máximo de notificaciones (default: 50)

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174004",
    "userId": "123e4567-e89b-12d3-a456-426614174001",
    "type": "appointment_confirmed",
    "channel": "email",
    "title": "Cita Confirmada",
    "content": "Tu cita para el 15 de enero a las 14:00 ha sido confirmada.",
    "status": "sent",
    "sentAt": "2024-01-01T12:05:00Z",
    "deliveredAt": "2024-01-01T12:06:00Z",
    "readAt": "2024-01-01T12:10:00Z",
    "createdAt": "2024-01-01T12:00:00Z"
  }
]
```

#### GET /notifications/user/:userId/unread-count
Obtiene la cantidad de notificaciones no leídas de un usuario.

**Response (200):**
```json
{
  "count": 3
}
```

#### PUT /notifications/:id/read
Marca una notificación como leída.

**Response (200):**
```json
{
  "message": "Notificación marcada como leída"
}
```

### Gestión de Plantillas

#### POST /notifications/templates
Crea una nueva plantilla de notificación.

**Request Body:**
```json
{
  "name": "appointment_confirmed_email",
  "type": "appointment_confirmed",
  "channel": "email",
  "subject": "Cita Confirmada - {{barberShopName}}",
  "content": "Hola {{clientName}},\n\nTu cita para el {{date}} a las {{time}} con {{barberName}} ha sido confirmada.\n\nServicio: {{serviceName}}\nPrecio: ${{price}}\n\nGracias por confiar en nosotros.\n\n{{barberShopName}}",
  "variables": ["clientName", "date", "time", "barberName", "serviceName", "price", "barberShopName"],
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "name": "appointment_confirmed_email",
  "type": "appointment_confirmed",
  "channel": "email",
  "subject": "Cita Confirmada - {{barberShopName}}",
  "content": "Hola {{clientName}},\n\nTu cita para el {{date}} a las {{time}} con {{barberName}} ha sido confirmada...",
  "variables": ["clientName", "date", "time", "barberName", "serviceName", "price", "barberShopName"],
  "isActive": true,
  "createdAt": "2024-01-01T12:00:00Z"
}
```

#### GET /notifications/templates
Obtiene todas las plantillas activas.

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174005",
    "name": "appointment_confirmed_email",
    "type": "appointment_confirmed",
    "channel": "email",
    "subject": "Cita Confirmada - {{barberShopName}}",
    "content": "Hola {{clientName}},\n\nTu cita para el {{date}} a las {{time}} con {{barberName}} ha sido confirmada...",
    "variables": ["clientName", "date", "time", "barberName", "serviceName", "price", "barberShopName"],
    "isActive": true
  }
]
```

### Health Check

#### GET /notifications/health
Verifica el estado del servicio de notificaciones.

**Response (200):**
```json
{
  "status": "ok",
  "service": "notifications",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Modelos de Datos

### Notification Entity
```typescript
@Entity('notifications')
@Index(['userId', 'status'])
@Index(['type', 'status'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string

  @Column({ name: 'type', type: 'enum', enum: NotificationType, nullable: false })
  type!: NotificationType

  @Column({ name: 'channel', type: 'enum', enum: NotificationChannel, nullable: false })
  channel!: NotificationChannel

  @Column({ name: 'status', type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status!: NotificationStatus

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: false })
  title!: string

  @Column({ name: 'content', type: 'text', nullable: false })
  content!: string

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @Column({ name: 'template_id', type: 'varchar', length: 100, nullable: true })
  templateId?: string

  @Column({ name: 'scheduled_for', type: 'timestamp', nullable: true })
  scheduledFor?: Date

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string
}
```

### Tipos de Notificación
```typescript
export enum NotificationType {
  // Appointment notifications
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  
  // Payment notifications
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REMINDER = 'payment_reminder',
  REFUND_PROCESSED = 'refund_processed',
  
  // Review notifications
  REVIEW_REQUEST = 'review_request',
  REVIEW_RECEIVED = 'review_received',
  
  // User account notifications
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  PROFILE_UPDATED = 'profile_updated',
  
  // Barber/Professional notifications
  NEW_BOOKING = 'new_booking',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',
  AVAILABILITY_REMINDER = 'availability_reminder',
  
  // System notifications
  SYSTEM_UPDATE = 'system_update',
  MAINTENANCE_NOTICE = 'maintenance_notice',
  
  // Promotional notifications
  PROMOTIONAL = 'promotional',
  SPECIAL_OFFER = 'special_offer',
  LOYALTY_REWARD = 'loyalty_reward'
}
```

### Canales de Notificación
```typescript
export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app'
}
```

### Estados de Notificación
```typescript
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

## Configuración de Entorno

```bash
# Puerto del servicio
PORT=3003

# Base de datos PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=barberia_notifications
DB_USER=postgres
DB_PASSWORD=password

# Redis para caché y pub/sub
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@barberia.com
FROM_NAME=BarberIA

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key

# Rate Limiting
MAX_NOTIFICATIONS_PER_MINUTE=60
MAX_EMAILS_PER_HOUR=1000
MAX_SMS_PER_DAY=500
```

## Dependencias Principales

- **@nestjs/typeorm**: ORM para PostgreSQL
- **nodemailer**: Envío de correos electrónicos
- **twilio**: Envío de SMS
- **firebase-admin**: Notificaciones push
- **redis**: Caché y pub/sub
- **class-validator**: Validación de DTOs
- **class-transformer**: Transformación de objetos

## Despliegue

### Desarrollo
```bash
cd services/notifications-service
npm install
npm run dev
```

### Producción
```bash
cd services/notifications-service
npm install
npm run build
npm run start
```

### Docker
```bash
docker build -t barberia-notifications-service .
docker run -p 3003:3003 --env-file .env barberia-notifications-service
```

## Integración con Otros Servicios

### Event-Driven Architecture
El servicio consume eventos de otros servicios a través de Redis pub/sub:

```typescript
// Ejemplo de consumo de eventos
@EventPattern('booking.created')
async handleBookingCreated(data: BookingCreatedEvent) {
  await this.notificationService.createNotification({
    userId: data.barberId,
    type: NotificationType.NEW_BOOKING,
    channel: NotificationChannel.EMAIL,
    title: 'Nueva Cita',
    content: `Tienes una nueva cita para el ${data.date} a las ${data.time}`,
    metadata: { bookingId: data.bookingId }
  })
}
```

### Servicios Integrados
- **Booking Service**: Notificaciones de citas (confirmación, recordatorios, cancelaciones)
- **Payment Service**: Notificaciones de pagos (confirmación, fallos, reembolsos)
- **User Service**: Notificaciones de cuenta (bienvenida, verificación, actualización)
- **Review Service**: Solicitudes de reseñas y notificaciones de reseñas recibidas

## Monitoreo y Métricas

### Health Check
- Endpoint: `GET /notifications/health`
- Respuesta: `{ "status": "ok", "service": "notifications", "timestamp": "2024-01-01T12:00:00Z" }`

### Métricas de Rendimiento
- Tiempo de envío de notificaciones: < 2 segundos
- Tasa de entrega: > 98%
- Tasa de apertura de emails: > 25%
- Disponibilidad del servicio: 99.9%

### Métricas de Negocio
- Notificaciones enviadas por canal
- Tasa de lectura por tipo de notificación
- Preferencias de usuario por canal
- Tiempo promedio de lectura

## Escalabilidad y Rendimiento

### Optimizaciones
- Índices de base de datos en userId, type, status, createdAt
- Caché Redis para plantillas frecuentes
- Procesamiento asíncrono de notificaciones
- Batch processing para envíos masivos

### Escalabilidad
- Arquitectura de microservicios para escalado independiente
- Base de datos con particionamiento por fecha
- Redis Cluster para caché distribuido
- Cola de mensajes para procesamiento asíncrono

## Seguridad y Privacidad

### Protección de Datos
- Encriptación de datos sensibles en metadata
- Cumplimiento con GDPR y regulaciones de privacidad
- Control de acceso a datos de usuario
- Auditoría de acceso a notificaciones

### Prevención de Spam
- Rate limiting por usuario y canal
- Límites diarios/mensuales por tipo de notificación
- Gestión de preferencias y opt-out
- Validación de direcciones de email y números de teléfono