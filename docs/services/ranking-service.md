# Ranking Service

Servicio de cálculo de ranking y reputación para barberos. Procesa eventos del sistema para actualizar rankings y proporciona endpoints para recálculos batch.

## 📋 Índice

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Endpoints](#endpoints)
- [Modelos de Datos](#modelos-de-datos)
- [Reglas de Negocio](#reglas-de-negocio)
- [Integración con otros servicios](#integración-con-otros-servicios)
- [Despliegue](#despliegue)

## ✨ Características

- **Cálculo de Ranking**: Procesamiento de eventos para actualizar rankings
- **Recálculo Batch**: Endpoint para recalcular todos los rankings
- **Almacenamiento en Redis**: Uso de Redis para caché de rankings
- **Procesamiento de Eventos**: Consumidor de eventos del sistema
- **API RESTful**: Interfaz RESTful documentada con Swagger

## 🛠 Tecnologías

- **Framework**: NestJS 10.4.10
- **Lenguaje**: TypeScript
- **Cache**: Redis 4.7.0
- **Documentación**: Swagger/OpenAPI
- **Validación**: class-validator 0.14.1
- **Transformación**: class-transformer 0.5.1

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Construir el proyecto
npm run build

# Iniciar el servicio
npm run start
```

## ⚙️ Configuración

### Variables de Entorno

```env
PORT=3006
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

### Configuración de Redis

El servicio utiliza Redis para:
- Almacenar rankings calculados
- Caché de resultados
- Procesamiento de eventos pub/sub

## 🔗 Endpoints

### Ranking

#### Recalcular rankings
```http
POST /ranking/recalculate
```

**Descripción**: Inicia el recálculo de todos los rankings de barberos

**Response** (200):
```json
{
  "status": "started",
  "action": "recalculate",
  "message": "Recálculo de rankings iniciado"
}
```

**Response** (202):
```json
{
  "status": "processing",
  "action": "recalculate",
  "jobId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Health Check

#### Verificar salud del servicio
```http
GET /ranking/health
```

**Descripción**: Verifica el estado de salud del servicio de ranking

**Response** (200):
```json
{
  "status": "ok",
  "service": "ranking",
  "redis": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response** (503):
```json
{
  "status": "error",
  "service": "ranking",
  "redis": "disconnected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📊 Modelos de Datos

### Estructura de Ranking en Redis

```typescript
interface RankingData {
  barberId: string
  score: number
  factors: {
    appointments: number
    ratings: number
    portfolio: number
    punctuality: number
    clientRetention: number
  }
  lastCalculated: string
  version: number
}
```

### Factores de Ranking

1. **Citas Completadas** (30%)
   - Número total de citas completadas
   - Tasa de completitud vs cancelaciones
   - Recencia de las citas

2. **Calificaciones** (25%)
   - Promedio de calificaciones
   - Número total de calificaciones
   - Distribución de calificaciones

3. **Portafolio** (20%)
   - Número de elementos en portafolio
   - Calidad de imágenes
   - Diversidad de estilos

4. **Puntualidad** (15%)
   - Porcentaje de citas iniciadas a tiempo
   - Tiempo promedio de retraso
   - Cancelaciones de última hora

5. **Retención de Clientes** (10%)
   - Tasa de clientes recurrentes
   - Frecuencia de visitas
   - Tiempo entre citas

### Fórmula de Cálculo

```typescript
totalScore = (
  appointmentsWeight * appointmentsScore +
  ratingsWeight * ratingsScore +
  portfolioWeight * portfolioScore +
  punctualityWeight * punctualityScore +
  retentionWeight * retentionScore
) / 5 * 100
```

## 📋 Reglas de Negocio

### Cálculo de Ranking

1. **Frecuencia**: El ranking se actualiza:
   - En tiempo real cuando llegan eventos relevantes
   - Diariamente mediante proceso batch
   - Semanalmente con recálculo completo

2. **Ponderación**: Los factores se ponderan según:
   - Importancia para la satisfacción del cliente
   - Impacto en la calidad del servicio
   - Datos históricos de rendimiento

3. **Decaimiento**: Los eventos antiguos tienen menos peso:
   - Eventos de últimos 30 días: 100% peso
   - Eventos de 30-90 días: 75% peso
   - Eventos de 90-180 días: 50% peso
   - Eventos > 180 días: 25% peso

4. **Normalización**: Los scores se normalizan:
   - Escala de 0-100
   - Comparación con promedio de la plataforma
   - Ajuste por categoría de servicio

### Eventos Procesados

#### Booking Events
- `booking.completed`: Incrementa contador de citas
- `booking.cancelled`: Afecta puntualidad y retención
- `booking.no_show`: Impacta negativamente en ranking

#### Rating Events
- `rating.created`: Actualiza promedio de calificaciones
- `rating.updated`: Recalcula con nueva calificación
- `rating.deleted`: Elimina calificación del cálculo

#### Portfolio Events
- `portfolio.item.created`: Incrementa factor de portafolio
- `portfolio.item.updated`: Recalcula calidad de portafolio
- `portfolio.item.deleted`: Decrementa factor de portafolio

## 🔗 Integración con otros servicios

### Servicios Relacionados

1. **Booking-Service**: Recibe eventos de finalización de citas
2. **Rating-Service**: Recibe eventos de calificaciones
3. **Portfolio-Service**: Recibe eventos de cambios en portafolio
4. **Scheduler-Service**: Recibe eventos de puntualidad
5. **User-Service**: Valida existencia de barberos

### Eventos Publicados

- `ranking.updated`: Cuando se actualiza el ranking de un barbero
- `ranking.recalculation.started`: Inicio de recálculo batch
- `ranking.recalculation.completed`: Fin de recálculo batch

### Eventos Consumidos

```typescript
@EventPattern('booking.completed')
async handleBookingCompleted(data: BookingCompletedEvent) {
  await this.updateRanking(data.barberId, 'appointments')
}

@EventPattern('rating.created')
async handleRatingCreated(data: RatingCreatedEvent) {
  await this.updateRanking(data.barberId, 'ratings')
}

@EventPattern('portfolio.item.created')
async handlePortfolioItemCreated(data: PortfolioItemCreatedEvent) {
  await this.updateRanking(data.barberId, 'portfolio')
}
```

## 🚀 Despliegue

### Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

### Producción

```bash
# Construir el proyecto
npm run build

# Iniciar en modo producción
npm run start
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3006

CMD ["npm", "run", "start"]
```

### Docker Compose

```yaml
ranking-service:
  build: ./services/ranking-service
  ports:
    - "3006:3006"
  environment:
    - REDIS_URL=redis://redis:6379
    - NODE_ENV=production
  depends_on:
    - redis
  networks:
    - barberia-network
```

### Health Check

El servicio expone un endpoint de health check en `/ranking/health` que verifica:
- Estado del servicio
- Conexión a Redis
- Timestamp de última actualización

### Métricas de Rendimiento

- **Tiempo de respuesta promedio**: < 50ms
- **Capacidad de procesamiento**: 1000+ eventos/segundo
- **Latencia de actualización**: < 5 segundos
- **Tiempo de recálculo batch**: < 5 minutos para 10k barberos

### Monitoreo

Se recomienda implementar:
- Métricas de Redis (memoria, latencia, hits/misses)
- Contadores de eventos procesados por tipo
- Tiempos de procesamiento de eventos
- Alertas para fallos de procesamiento
- Dashboard de distribución de rankings

### Optimización

1. **Redis Pipeline**: Usar pipelines para operaciones batch
2. **Caché Local**: Implementar caché local para rankings frecuentes
3. **Procesamiento Asíncrono**: Usar colas para procesamiento pesado
4. **Índices Redis**: Crear índices apropiados para búsquedas
5. **Compresión**: Comprimir datos antiguos para ahorrar memoria

### Seguridad

Consideraciones de seguridad pendientes:
- Autenticación para endpoint de recálculo
- Rate limiting para prevenir sobrecarga
- Validación de eventos entrantes
- Encriptación de datos sensibles en Redis
- Auditoría de cambios en rankings