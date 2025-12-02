# Arquitectura de Microservicios - BarberIA

Documentación de la arquitectura de microservicios del sistema BarberIA, incluyendo patrones de diseño, comunicación entre servicios, y mejores prácticas implementadas.

## 📋 Índice

- [Visión General](#visión-general)
- [Arquitectura de Microservicios](#arquitectura-de-microservicios)
- [Servicios del Sistema](#servicios-del-sistema)
- [Comunicación entre Servicios](#comunicación-entre-servicios)
- [Patrones de Diseño](#patrones-de-diseño)
- [Gestión de Datos](#gestión-de-datos)
- [Seguridad](#seguridad)
- [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
- [Escalabilidad](#escalabilidad)
- [Despliegue](#despliegue)
- [Mejores Prácticas](#mejores-prácticas)

## 🏗️ Visión General

BarberIA utiliza una arquitectura de microservicios basada en eventos, diseñada para ser escalable, mantenible y resiliente. Cada servicio tiene una responsabilidad específica y puede ser desarrollado, desplegado y escalado independientemente.

### Principios de Diseño

- **Single Responsibility**: Cada servicio tiene una única responsabilidad
- **Autonomía**: Los servicios pueden operar independientemente
- **Resiliencia**: El sistema puede recuperarse de fallos parciales
- **Escalabilidad**: Capacidad de escalar horizontalmente
- **Event-Driven**: Comunicación asíncrona basada en eventos
- **API-First**: Diseño primero de APIs antes de implementación

## 🏛️ Arquitectura de Microservicios

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                    (Proxy + Rate Limiting)                       │
└─────────────────────┬───────────────────────┬─────────────────────┘
                      │                       │
                      │ HTTP/REST             │ WebSocket
                      │                       │
┌─────────────────────▼───────────────────────▼─────────────────────┐
│                    Microservicios                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │Auth-Service │  │Booking-Svc  │  │Scheduler-Svc│             │
│  │(Port: 3001) │  │(Port: 3002) │  │(Port: 3003) │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                 │                 │                    │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐             │
│  │Portfolio-Svc│  │Ranking-Svc  │  │Search-Svc   │             │
│  │(Port: 3004) │  │(Port: 3006) │  │(Port: 3005) │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                 │                 │                    │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐             │
│  │Notif-Svc    │  │AI-Recommender│              │             │
│  │(Port: 3007) │  │(Port: 8001)  │              │             │
│  └──────┬──────┘  └──────┬──────┘              │             │
└─────────┼─────────────────┼──────────────────────┼─────────────┘
          │                 │                      │
          │                 │                      │
          │ Redis Pub/Sub   │ HTTP/REST            │ gRPC
          │                 │                      │
┌─────────▼─────────────────▼──────────────────────▼─────────────┐
│                      Infraestructura                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Redis Cluster│  │PostgreSQL   │  │Docker Swarm │         │
│  │(Event Bus)  │  │(Databases)  │  │(Orchestration)│        │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Servicios del Sistema

### 1. API Gateway (Port 3000)
**Tecnología**: Node.js + Express + http-proxy-middleware

**Responsabilidades**:
- Enrutamiento de peticiones
- Rate limiting y throttling
- Autenticación y autorización
- Logging centralizado
- Transformación de respuestas

**Rutas Principales**:
```typescript
/api/auth/*     → Auth-Service (3001)
/api/bookings/* → Booking-Service (3002)
/api/schedule/*  → Scheduler-Service (3003)
/api/portfolio/* → Portfolio-Service (3004)
/api/search/*    → Search-Service (3005)
/api/ranking/*   → Ranking-Service (3006)
/api/notifications/* → Notifications-Service (3007)
/api/recommendations/* → AI-Recommender-Service (8001)
```

### 2. Auth Service (Port 3001)
**Tecnología**: NestJS + PostgreSQL + JWT

**Responsabilidades**:
- Registro y autenticación de usuarios
- Gestión de roles y permisos
- Emisión y validación de tokens JWT
- Auditoría de accesos
- Rate limiting por IP/usuario

**Características**:
- JWT con refresh tokens
- Bcrypt para hash de contraseñas
- Rate limiting configurable
- Logs de auditoría detallados

### 3. Booking Service (Port 3002)
**Tecnología**: NestJS + PostgreSQL + TypeORM

**Responsabilidades**:
- Gestión de citas y reservas
- Validación de disponibilidad
- Prevención de conflictos de horarios
- Gestión de estados de citas
- Integración con servicios de pago

**Características**:
- Validación de conflictos en tiempo real
- Estados: pending, confirmed, cancelled, completed, no_show
- Índices optimizados para búsquedas por fecha
- Integración con eventos del sistema

### 4. Scheduler Service (Port 3003)
**Tecnología**: NestJS + PostgreSQL + date-fns

**Responsabilidades**:
- Gestión de disponibilidad de barberos
- Generación de franjas horarias
- Cálculo de tiempos de servicio
- Gestión de bloqueos de calendario
- Optimización de agendas

**Características**:
- Generación batch de slots horarios
- Validación de disponibilidad compleja
- Soporte para diferentes zonas horarias
- Integración con calendarios externos

### 5. Portfolio Service (Port 3004)
**Tecnología**: NestJS + PostgreSQL + TypeORM

**Responsabilidades**:
- Gestión de portafolio de barberos
- Almacenamiento de imágenes de trabajos
- Etiquetado y categorización
- Búsqueda dentro de portafolios
- Gestión de metadatos

**Características**:
- Soporte para múltiples formatos de imagen
- Sistema de tags flexible
- Búsqueda por texto y filtros
- Metadatos extensibles

### 6. Search Service (Port 3005)
**Tecnología**: NestJS + Redis + Algoritmos de búsqueda

**Responsabilidades**:
- Búsqueda de barberos por múltiples criterios
- Filtrado geoespacial
- Ordenamiento por relevancia
- Autocompletado y sugerencias
- Caché de resultados

**Características**:
- Búsqueda multi-criteria
- Filtros avanzados (precio, rating, distancia)
- Caché inteligente con invalidación
- Algoritmos de ranking personalizados

### 7. Ranking Service (Port 3006)
**Tecnología**: NestJS + Redis + Event Processing

**Responsabilidades**:
- Cálculo de rankings de barberos
- Procesamiento de eventos del sistema
- Actualización de reputaciones
- Análisis de métricas de rendimiento
- Recálculos batch periódicos

**Características**:
- Procesamiento en tiempo real de eventos
- Múltiples factores de ranking
- Recálculos batch programados
- Almacenamiento en caché optimizado

### 8. Notifications Service (Port 3007)
**Tecnología**: NestJS + Redis Pub/Sub + Multi-channel

**Responsabilidades**:
- Envío de notificaciones multi-canal
- Gestión de preferencias de usuario
- Plantillas de mensajes
- Programación de notificaciones
- Tracking de entrega

**Características**:
- Soporte: Email, SMS, Push, In-app
- Plantillas personalizables
- Rate limiting por canal
- Gestión de preferencias

### 9. AI Recommender Service (Port 8001)
**Tecnología**: FastAPI + Python + Scikit-learn + Pandas

**Responsabilidades**:
- Recomendaciones personalizadas de barberos
- Análisis de patrones de usuario
- Procesamiento de datos históricos
- Optimización de modelos ML
- Predicción de preferencias

**Características**:
- Sistema híbrido (collaborative + content-based)
- Modelos de ML optimizados
- Procesamiento asíncrono
- Caché de recomendaciones

## 🔗 Comunicación entre Servicios

### Patrones de Comunicación

#### 1. Síncrono (HTTP/REST)
**Uso**: Para operaciones que requieren respuesta inmediata

**Ejemplos**:
- Login de usuario → Auth-Service
- Crear reserva → Booking-Service → Scheduler-Service
- Búsqueda de barberos → Search-Service

**Implementación**:
```typescript
// API Gateway proxy configuration
const proxyConfig = {
  '/api/bookings': {
    target: 'http://booking-service:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/bookings': '' }
  }
}
```

#### 2. Asíncrono (Event-Driven)
**Uso**: Para operaciones que no requieren respuesta inmediata

**Ejemplos**:
- Envío de notificaciones
- Actualización de rankings
- Sincronización de datos

**Implementación**:
```typescript
// Event publisher
@Injectable()
export class EventBusService {
  async publish(event: string, data: any) {
    await this.redisClient.publish(event, JSON.stringify(data))
  }
}

// Event subscriber
@Injectable()
export class EventProcessor {
  @EventPattern('booking.created')
  async handleBookingCreated(data: BookingCreatedEvent) {
    // Process event
  }
}
```

### Eventos del Sistema

#### Booking Events
```typescript
// booking.created
{
  event: 'booking.created',
  data: {
    bookingId: 'uuid',
    clientId: 'uuid',
    barberId: 'uuid',
    date: '2024-01-15',
    time: '10:00',
    services: ['corte', 'barba']
  },
  timestamp: '2024-01-10T10:30:00Z'
}

// booking.completed
{
  event: 'booking.completed',
  data: {
    bookingId: 'uuid',
    barberId: 'uuid',
    rating: 4.5,
    price: 25.00
  }
}
```

#### User Events
```typescript
// user.registered
{
  event: 'user.registered',
  data: {
    userId: 'uuid',
    email: 'user@example.com',
    role: 'CLIENT' | 'BARBER' | 'ADMIN'
  }
}

// user.profile.updated
{
  event: 'user.profile.updated',
  data: {
    userId: 'uuid',
    changes: ['name', 'location']
  }
}
```

#### Rating Events
```typescript
// rating.created
{
  event: 'rating.created',
  data: {
    ratingId: 'uuid',
    bookingId: 'uuid',
    barberId: 'uuid',
    clientId: 'uuid',
    score: 4.5,
    comment: 'Excelente servicio'
  }
}
```

## 🎨 Patrones de Diseño

### 1. API Gateway Pattern
**Propósito**: Punto único de entrada para todos los clientes

**Beneficios**:
- Encapsulación de la complejidad de microservicios
- Responsabilidad única de enrutamiento
- Facilita cross-cutting concerns (auth, logging, rate limiting)

**Implementación**:
```typescript
// Proxy configuration with load balancing
const proxyOptions = {
  target: 'http://service-cluster',
  changeOrigin: true,
  pathRewrite: { '^/api/service': '' },
  onProxyReq: (proxyReq, req, res) => {
    // Add authentication headers
    proxyReq.setHeader('X-User-Id', req.user?.id)
  },
  onError: (err, req, res) => {
    // Handle service unavailability
    res.status(503).json({ error: 'Service temporarily unavailable' })
  }
}
```

### 2. Event Sourcing Pattern
**Propósito**: Almacenar cambios de estado como secuencia de eventos

**Implementación**:
```typescript
// Event store
interface EventStore {
  eventId: string
  aggregateId: string
  eventType: string
  eventData: any
  timestamp: Date
  version: number
}

// Event sourcing for bookings
class BookingAggregate {
  private events: Event[] = []
  
  applyEvent(event: Event) {
    this.events.push(event)
    this.state = this.reduce(this.state, event)
  }
  
  private reduce(state: BookingState, event: Event): BookingState {
    switch(event.type) {
      case 'BookingCreated':
        return { ...state, status: 'PENDING' }
      case 'BookingConfirmed':
        return { ...state, status: 'CONFIRMED' }
      case 'BookingCompleted':
        return { ...state, status: 'COMPLETED' }
      default:
        return state
    }
  }
}
```

### 3. CQRS (Command Query Responsibility Segregation)
**Propósito**: Separar operaciones de lectura y escritura

**Implementación**:
```typescript
// Command side
@Controller('bookings')
export class BookingCommandController {
  @Post()
  async createBooking(@Body() dto: CreateBookingDto) {
    return this.commandBus.execute(new CreateBookingCommand(dto))
  }
}

// Query side
@Controller('bookings')
export class BookingQueryController {
  @Get(':id')
  async getBooking(@Param('id') id: string) {
    return this.queryBus.execute(new GetBookingQuery(id))
  }
  
  @Get()
  async getBookings(@Query() filters: BookingFilters) {
    return this.queryBus.execute(new GetBookingsQuery(filters))
  }
}
```

### 4. Circuit Breaker Pattern
**Propósito**: Prevenir fallos en cascada

**Implementación**:
```typescript
class CircuitBreaker {
  private failures = 0
  private lastFailureTime: Date | null = null
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = new Date()
    
    if (this.failures >= 5) {
      this.state = 'OPEN'
    }
  }
}
```

## 💾 Gestión de Datos

### Estrategia de Base de Datos

#### PostgreSQL - Base de Datos Principal
**Uso**: Datos transaccionales, relaciones complejas

**Servicios**:
- Auth-Service: Usuarios, roles, permisos
- Booking-Service: Citas, reservas, disponibilidad
- Scheduler-Service: Horarios, bloqueos, configuraciones
- Portfolio-Service: Portafolios, imágenes, metadatos

#### Redis - Caché y Mensajería
**Uso**: Caché, eventos pub/sub, sesiones

**Servicios**:
- Search-Service: Índices de búsqueda, resultados en caché
- Ranking-Service: Rankings calculados, eventos
- Notifications-Service: Colas de notificaciones, sesiones
- API Gateway: Rate limiting, sesiones

### Esquema de Base de Datos

#### Patrón de Base de Datos por Servicio
Cada servicio tiene su propia base de datos, evitando acoplamiento:

```sql
-- Auth Service Database
CREATE DATABASE barberia_auth;
-- Tables: users, roles, permissions, audit_logs

-- Booking Service Database
CREATE DATABASE barberia_bookings;
-- Tables: bookings, booking_states, services, prices

-- Scheduler Service Database
CREATE DATABASE barberia_scheduler;
-- Tables: availability, time_slots, calendar_blocks, schedules
```

### Migraciones de Base de Datos

```typescript
// TypeORM migration example
export class CreateBookingTable1612345678901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bookings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid'
          },
          {
            name: 'barber_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false
          },
          {
            name: 'start_time',
            type: 'time',
            isNullable: false
          },
          {
            name: 'end_time',
            type: 'time',
            isNullable: false
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP'
          }
        ],
        indices: [
          {
            name: 'IDX_bookings_barber_date',
            columnNames: ['barber_id', 'date']
          },
          {
            name: 'IDX_bookings_client_date',
            columnNames: ['client_id', 'date']
          }
        ],
        uniques: [
          {
            name: 'UNIQUE_barber_date_time',
            columnNames: ['barber_id', 'date', 'start_time']
          }
        ]
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('bookings')
  }
}
```

## 🔐 Seguridad

### Autenticación y Autorización

#### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string          // User ID
  email: string        // User email
  role: UserRole       // CLIENT | BARBER | ADMIN
  permissions: string[] // Array of permissions
  iat: number          // Issued at
  exp: number          // Expiration
}
```

#### Role-Based Access Control (RBAC)
```typescript
enum UserRole {
  CLIENT = 'CLIENT',
  BARBER = 'BARBER',
  ADMIN = 'ADMIN'
}

const rolePermissions = {
  [UserRole.CLIENT]: [
    'bookings:create',
    'bookings:read:own',
    'bookings:update:own',
    'bookings:cancel:own',
    'profile:read:own',
    'profile:update:own'
  ],
  [UserRole.BARBER]: [
    'bookings:read:own',
    'bookings:update:own',
    'schedule:manage:own',
    'portfolio:manage:own',
    'profile:read:own',
    'profile:update:own'
  ],
  [UserRole.ADMIN]: [
    'users:manage',
    'bookings:manage',
    'system:configure',
    'analytics:read'
  ]
}
```

### Rate Limiting

```typescript
// Rate limiting configuration
const rateLimitConfig = {
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP'
  },
  auth: {
    login: {
      windowMs: 15 * 60 * 1000,
      max: 5, // 5 login attempts per 15 minutes
      skipSuccessfulRequests: true
    },
    register: {
      windowMs: 60 * 60 * 1000,
      max: 5, // 5 registrations per hour per IP
    }
  },
  api: {
    '/api/bookings': {
      windowMs: 60 * 1000,
      max: 30 // 30 booking requests per minute
    }
  }
}
```

### Validación y Sanitización

```typescript
// Input validation with class-validator
export class CreateBookingDto {
  @IsUUID()
  barberId: string

  @IsDateString()
  date: string

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) // HH:MM format
  startTime: string

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string

  @IsArray()
  @IsString({ each: true })
  services: string[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}
```

## 📊 Monitoreo y Observabilidad

### Logging Estructurado

```typescript
// Using winston for structured logging
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'booking-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Usage
logger.info('Booking created', {
  bookingId,
  clientId,
  barberId,
  date,
  duration: 45,
  metadata: {
    userAgent: req.get('User-Agent'),
    ip: req.ip
  }
})
```

### Métricas con Prometheus

```typescript
// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
})

const bookingCreations = new promClient.Counter({
  name: 'booking_creations_total',
  help: 'Total number of booking creations',
  labelNames: ['status', 'barber_id']
})

const activeUsers = new promClient.Gauge({
  name: 'active_users_current',
  help: 'Current number of active users'
})
```

### Distributed Tracing

```typescript
// OpenTelemetry configuration
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'booking-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0'
  })
})

// Trace context propagation
const tracer = provider.getTracer('booking-service')

const span = tracer.startSpan('create-booking')
span.setAttributes({
  'booking.id': bookingId,
  'user.id': userId,
  'barber.id': barberId
})

try {
  // Business logic
  span.setStatus({ code: SpanStatusCode.OK })
} catch (error) {
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message
  })
  span.recordException(error)
} finally {
  span.end()
}
```

### Health Checks

```typescript
// Comprehensive health check
@Get('health')
async healthCheck() {
  const checks = {
    database: await this.checkDatabase(),
    redis: await this.checkRedis(),
    diskSpace: await this.checkDiskSpace(),
    memory: await this.checkMemoryUsage()
  }
  
  const isHealthy = Object.values(checks).every(check => check.status === 'healthy')
  
  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'booking-service',
    version: process.env.npm_package_version,
    checks
  }
}

private async checkDatabase(): Promise<HealthCheck> {
  try {
    await this.dataSource.query('SELECT 1')
    return { status: 'healthy', latency: 15 }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}
```

## 📈 Escalabilidad

### Estrategias de Escalado

#### 1. Horizontal Scaling
```yaml
# Docker Compose scaling
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3

# Load balancing
services:
  booking-service:
    deploy:
      replicas: 3
    networks:
      - barberia-network
    depends_on:
      - postgres
      - redis
```

#### 2. Database Sharding
```typescript
// Sharding by user ID
function getShardForUser(userId: string): number {
  const hash = crypto.createHash('md5').update(userId).digest('hex')
  const shardCount = 4
  return parseInt(hash.substring(0, 8), 16) % shardCount
}

// Connection pooling per shard
const shardConnections = {
  0: createConnectionPool(process.env.DATABASE_SHARD_0),
  1: createConnectionPool(process.env.DATABASE_SHARD_1),
  2: createConnectionPool(process.env.DATABASE_SHARD_2),
  3: createConnectionPool(process.env.DATABASE_SHARD_3)
}
```

#### 3. Caching Strategy
```typescript
// Multi-level caching
class CacheManager {
  private l1Cache = new Map() // In-memory
  private l2Cache: Redis // Redis
  
  async get<T>(key: string): Promise<T | null> {
    // L1 Cache
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key)
    }
    
    // L2 Cache
    const l2Value = await this.l2Cache.get(key)
    if (l2Value) {
      this.l1Cache.set(key, JSON.parse(l2Value))
      return JSON.parse(l2Value)
    }
    
    return null
  }
  
  async set(key: string, value: any, ttl: number) {
    this.l1Cache.set(key, value)
    await this.l2Cache.setex(key, ttl, JSON.stringify(value))
  }
}
```

### Performance Optimization

#### Database Query Optimization
```sql
-- Optimized indexes
CREATE INDEX CONCURRENTLY idx_bookings_barber_date_status 
ON bookings(barber_id, date, status) 
WHERE status IN ('CONFIRMED', 'COMPLETED')

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_active 
ON users(email) 
WHERE is_active = true AND deleted_at IS NULL

-- Composite indexes for multi-column queries
CREATE INDEX CONCURRENTLY idx_bookings_composite 
ON bookings(client_id, barber_id, date DESC)
```

#### Connection Pooling
```typescript
// Optimized connection pool
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  extra: {
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
})
```

## 🚀 Despliegue

### Docker Configuration

#### Multi-stage Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

#### Docker Compose Services
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: barberia
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: barberia_main
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U barberia"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://barberia:${DB_PASSWORD}@postgres:5432/barberia_auth
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        max_attempts: 3

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    driver: bridge
```

### Kubernetes Deployment

#### Service Definition
```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  labels:
    app: auth-service
spec:
  selector:
    app: auth-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3001
  type: ClusterIP
```

#### Deployment Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  labels:
    app: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: barberia/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: auth-db-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker images
        run: |
          docker build -t barberia/auth-service:${{ github.sha }} ./services/auth-service
          docker push barberia/auth-service:${{ github.sha }}
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/auth-service auth-service=barberia/auth-service:${{ github.sha }}
          kubectl rollout status deployment/auth-service
```

## 🎯 Mejores Prácticas

### 1. Diseño de APIs

#### Versionado de APIs
```typescript
// URL versioning
@Controller('api/v1/bookings')
export class BookingControllerV1 {
  // V1 implementation
}

@Controller('api/v2/bookings')
export class BookingControllerV2 {
  // V2 implementation with breaking changes
}
```

#### Documentación con Swagger
```typescript
@ApiTags('Bookings')
@Controller('api/v1/bookings')
export class BookingController {
  @Post()
  @ApiOperation({ 
    summary: 'Create a new booking',
    description: 'Creates a booking with the provided details'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Booking created successfully',
    type: BookingResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Time slot not available'
  })
  async createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto)
  }
}
```

### 2. Manejo de Errores

```typescript
// Global exception filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      message = exception.message
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST
      message = 'Database operation failed'
    }
    
    logger.error('Request failed', {
      error: exception,
      status,
      message,
      path: ctx.getRequest().url
    })
    
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url
    })
  }
}
```

### 3. Testing Strategy

#### Unit Tests
```typescript
describe('BookingService', () => {
  let service: BookingService
  let mockRepository: MockType<Repository<Booking>>
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepository
        }
      ]
    }).compile()
    
    service = module.get<BookingService>(BookingService)
  })
  
  describe('create', () => {
    it('should create a booking successfully', async () => {
      const dto = createBookingDto()
      const expected = bookingEntity()
      
      mockRepository.create.mockReturnValue(expected)
      mockRepository.save.mockReturnValue(expected)
      
      const result = await service.create(dto)
      
      expect(result).toEqual(expected)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
      expect(mockRepository.save).toHaveBeenCalledWith(expected)
    })
    
    it('should throw error when time slot is not available', async () => {
      const dto = createBookingDto()
      mockRepository.findOne.mockReturnValue({ id: 'existing-booking' })
      
      await expect(service.create(dto))
        .rejects.toThrow(ConflictException)
    })
  })
})
```

#### Integration Tests
```typescript
describe('BookingController (e2e)', () => {
  let app: INestApplication
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    
    app = moduleFixture.createNestApplication()
    await app.init()
  })
  
  it('/api/v1/bookings (POST)', async () => {
    const createBookingDto = {
      barberId: '123e4567-e89b-12d3-a456-426614174000',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      services: ['haircut', 'beard']
    }
    
    return request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send(createBookingDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id')
        expect(res.body.status).toBe('PENDING')
      })
  })
})
```

### 4. Configuration Management

#### Environment-based Configuration
```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'simple'
  }
})
```

### 5. Deployment Best Practices

#### Blue-Green Deployment
```yaml
# Kubernetes deployment strategy
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  
  # Or use blue-green with services
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: booking-service-green
  spec:
    selector:
      app: booking-service
      version: green
```

#### Feature Flags
```typescript
// Feature flag configuration
const features = {
  newRecommendationAlgorithm: process.env.ENABLE_NEW_ALGO === 'true',
  enhancedSearch: process.env.ENABLE_ENHANCED_SEARCH === 'true',
  realTimeNotifications: process.env.ENABLE_REALTIME_NOTIF === 'true'
}

// Usage in code
if (features.newRecommendationAlgorithm) {
  return this.aiRecommender.getRecommendations(userId)
} else {
  return this.legacyRecommender.getRecommendations(userId)
}
```

### 6. Documentation Standards

#### Code Documentation
```typescript
/**
 * Creates a new booking for a barber
 * 
 * @param createBookingDto - Booking creation data
 * @param userId - ID of the user making the booking
 * @returns Created booking with generated ID
 * 
 * @throws ConflictException if time slot is not available
 * @throws NotFoundException if barber or service not found
 * @throws BadRequestException if invalid time slot
 * 
 * @example
 * ```typescript
 * const booking = await bookingService.create({
 *   barberId: '123e4567-e89b-12d3-a456-426614174000',
 *   date: '2024-01-15',
 *   startTime: '10:00',
 *   services: ['haircut', 'beard']
 * }, 'user-id')
 * ```
 */
async createBooking(
  createBookingDto: CreateBookingDto,
  userId: string
): Promise<Booking> {
  // Implementation
}
```

#### API Documentation
```typescript
@ApiTags('Bookings')
@Controller('api/v1/bookings')
export class BookingController {
  /**
   * Create a new booking
   * 
   * Creates a booking for the specified barber and time slot.
   * Validates availability and prevents double bookings.
   * 
   * Status flow: PENDING → CONFIRMED → COMPLETED
   * 
   * @param createBookingDto Booking details
   * @param req Request with authenticated user
   * @returns Created booking details
   * 
   * @response 201 - Booking created successfully
   * @response 400 - Invalid input data
   * @response 409 - Time slot not available
   * @response 422 - Business rule violation
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create a new booking',
    description: 'Creates a booking with validation of availability and business rules'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Booking created successfully',
    type: BookingResponseDto,
    headers: {
      'Location': {
        description: 'URL of the created booking',
        schema: { type: 'string' }
      }
    }
  })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.bookingService.create(createBookingDto, req.user.id)
  }
}
```

### Política de Documentación Obligatoria

**⚠️ IMPORTANTE**: Para mantener la calidad y consistencia del código, se ha establecido una [Política de Documentación Obligatoria](./documentation-policy.md) que todos los nuevos endpoints deben seguir. Esta política incluye:

- **Documentación TSDoc completa** con descripciones detalladas, parámetros, retornos y ejemplos
- **Decoradores Swagger/OpenAPI** para todos los endpoints, incluyendo todas las respuestas posibles
- **DTOs documentados** con validaciones y ejemplos
- **Manejo de errores documentado** con todas las excepciones posibles
- **Checklist de verificación** antes de crear Pull Requests

Los desarrolladores deben consultar esta política antes de crear nuevos endpoints para asegurar el cumplimiento de los estándares establecidos.

---

Esta arquitectura de microservicios proporciona una base sólida para el sistema BarberIA, con énfasis en escalabilidad, mantenibilidad y resiliencia. Cada servicio puede ser desarrollado, desplegado y escalado independientemente, mientras mantiene la cohesión del sistema completo a través de patrones de comunicación bien definidos.