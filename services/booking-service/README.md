# Booking Service

Servicio de gestión de citas para BarberIA. Este servicio maneja la creación, modificación y cancelación de citas, además de integrarse con el sistema de eventos para notificaciones y recordatorios.

## Características

- ✅ CRUD completo de citas
- ✅ Validación de disponibilidad de barberos
- ✅ Integración con sistema de eventos
- ✅ Recordatorios automáticos (24h, 1h, 15min)
- ✅ Documentación Swagger
- ✅ Manejo de conflictos de horarios

## Instalación

```bash
cd services/booking-service
npm install
```

## Configuración

Crear archivo `.env`:

```env
PORT=3005
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=barberia_booking
NODE_ENV=development
```

## Uso

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Crear cita
```http
POST /bookings
Content-Type: application/json

{
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "barberId": "123e4567-e89b-12d3-a456-426614174001",
  "serviceId": "123e4567-e89b-12d3-a456-426614174002",
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "11:00",
  "price": 25.00,
  "notes": "Corte de cabello y barba"
}
```

### Confirmar cita
```http
PUT /bookings/:id/confirm?confirmedBy=CLIENT
```

### Cancelar cita
```http
PUT /bookings/:id/cancel?reason=Cliente+enfermo&cancelledBy=123e4567-e89b-12d3-a456-426614174000
```

### Reprogramar cita
```http
PUT /bookings/:id/reschedule?newDate=2024-01-16&newStartTime=14:00&newEndTime=15:00&reason=Cambio+de+horario
```

### Consultar citas
```http
GET /bookings/:id
GET /bookings/client/:clientId
GET /bookings/barber/:barberId
GET /bookings/date/:date
```

## Documentación Swagger

Acceder a: `http://localhost:3005/docs`

## Integración con Eventos

El servicio publica los siguientes eventos:

- `booking.created` - Cuando se crea una nueva cita
- `booking.confirmed` - Cuando se confirma una cita
- `booking.cancelled` - Cuando se cancela una cita
- `booking.rescheduled` - Cuando se reprograma una cita
- `booking.reminder.sent` - Cuando se envían recordatorios

## Recordatorios Automáticos

El servicio envía recordatorios automáticamente:

- **24 horas antes**: Email al cliente y barbero
- **1 hora antes**: SMS al cliente
- **15 minutos antes**: Notificación push

## Base de Datos

El servicio utiliza PostgreSQL con la siguiente estructura:

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clientId UUID NOT NULL,
  barberId UUID NOT NULL,
  serviceId UUID NOT NULL,
  date DATE NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  notes TEXT,
  confirmedBy VARCHAR(20),
  confirmedAt TIMESTAMP,
  cancellationReason TEXT,
  cancelledBy UUID,
  cancelledAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```