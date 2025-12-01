# Search Service

Servicio de búsqueda y filtrado de barberos. Proporciona capacidades de búsqueda avanzada con filtros múltiples y caché de resultados.

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

- **Búsqueda Multi-criteria**: Búsqueda por nombre, ubicación, servicios, precio
- **Filtros Avanzados**: Filtrado por disponibilidad, calificación, distancia
- **Ordenamiento Inteligente**: Ordenamiento por relevancia, distancia, precio, rating
- **Caché de Resultados**: Almacenamiento en caché para mejorar rendimiento
- **Sugerencias**: Autocompletado y sugerencias de búsqueda
- **Búsqueda Geoespacial**: Búsqueda por proximidad geográfica

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
PORT=3005
REDIS_URL=redis://localhost:6379
NODE_ENV=development
SEARCH_CACHE_TTL=3600
MAX_SEARCH_RESULTS=100
DEFAULT_SEARCH_RADIUS=10
```

### Configuración de Caché

- **TTL por defecto**: 1 hora (3600 segundos)
- **Máximo de resultados**: 100 barberos
- **Radio de búsqueda**: 10 km por defecto
- **Invalidación**: Event-driven mediante Redis pub/sub

## 🔗 Endpoints

### Búsqueda

#### Búsqueda de barberos
```http
GET /search?q=corte&location=40.7128,-74.0060&radius=5&services=clasic,degradado&minRating=4.0&maxPrice=50&sort=distance&limit=20&offset=0
```

**Descripción**: Búsqueda avanzada de barberos con múltiples filtros

**Query Parameters**:
- `q` (string, optional): Término de búsqueda (nombre, servicio, descripción)
- `location` (string, optional): Coordenadas "lat,lng" para búsqueda geoespacial
- `radius` (number, optional): Radio de búsqueda en km (default: 10)
- `services` (string, optional): Servicios separados por comas
- `minRating` (number, optional): Calificación mínima (0-5)
- `maxPrice` (number, optional): Precio máximo por servicio
- `availability` (string, optional): Fecha/hora de disponibilidad ISO
- `sort` (string, optional): Criterio de ordenamiento (relevance, distance, price, rating)
- `limit` (number, optional): Número máximo de resultados (default: 20, max: 100)
- `offset` (number, optional): Número de resultados a saltar (default: 0)

**Response** (200):
```json
{
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Carlos Rodriguez",
      "rating": 4.8,
      "reviewCount": 127,
      "services": ["corte-clasico", "degradado", "barba"],
      "priceRange": {
        "min": 15,
        "max": 35
      },
      "location": {
        "latitude": 40.7589,
        "longitude": -73.9851,
        "address": "123 Main St, New York, NY 10001"
      },
      "distance": 2.3,
      "availability": {
        "nextAvailable": "2024-01-16T10:00:00Z",
        "slotsToday": 3
      },
      "portfolio": {
        "imageCount": 25,
        "featuredImage": "https://example.com/portfolio/featured.jpg"
      },
      "score": 0.92,
      "relevance": "high"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "applied": {
      "q": "corte",
      "location": "40.7128,-74.0060",
      "radius": 5,
      "services": ["clasic", "degradado"],
      "minRating": 4.0,
      "maxPrice": 50
    },
    "available": {
      "services": [
        {"name": "corte-clasico", "count": 32},
        {"name": "degradado", "count": 28},
        {"name": "barba", "count": 24}
      ],
      "priceRanges": [
        {"min": 0, "max": 20, "count": 15},
        {"min": 20, "max": 40, "count": 25},
        {"min": 40, "max": 60, "count": 5}
      ]
    }
  },
  "searchId": "search_123e4567-e89b-12d3-a456-426614174000",
  "cached": false,
  "processingTime": 145
}
```

### Sugerencias

#### Obtener sugerencias de búsqueda
```http
GET /search/suggestions?q=cort
```

**Descripción**: Obtiene sugerencias de autocompletado para la búsqueda

**Query Parameters**:
- `q` (string, required): Término parcial para autocompletar
- `limit` (number, optional): Número máximo de sugerencias (default: 10)

**Response** (200):
```json
{
  "suggestions": [
    {
      "text": "corte clásico",
      "type": "service",
      "count": 156
    },
    {
      "text": "corte moderno",
      "type": "service",
      "count": 89
    },
    {
      "text": "corte degradado",
      "type": "service",
      "count": 234
    },
    {
      "text": "Corte & Style Barbería",
      "type": "barbershop",
      "count": 1
    }
  ],
  "processingTime": 23
}
```

### Popular Searches

#### Obtener búsquedas populares
```http
GET /search/popular?location=40.7128,-74.0060&limit=10
```

**Descripción**: Obtiene las búsquedas más populares en una ubicación

**Query Parameters**:
- `location` (string, optional): Coordenadas para filtrar por ubicación
- `limit` (number, optional): Número máximo de resultados (default: 10)

**Response** (200):
```json
{
  "popular": [
    {
      "query": "corte degradado",
      "count": 456,
      "trend": "up",
      "services": ["degradado", "corte-clasico"]
    },
    {
      "query": "barba",
      "count": 234,
      "trend": "stable",
      "services": ["barba", "afeitado"]
    },
    {
      "query": "corte moderno",
      "count": 189,
      "trend": "down",
      "services": ["corte-moderno", "estilista"]
    }
  ],
  "location": "New York, NY",
  "processingTime": 12
}
```

### Health Check

#### Verificar salud del servicio
```http
GET /search/health
```

**Descripción**: Verifica el estado de salud del servicio de búsqueda

**Response** (200):
```json
{
  "status": "ok",
  "service": "search",
  "redis": "connected",
  "cacheHitRate": 0.73,
  "totalSearches": 15420,
  "avgProcessingTime": 89,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📊 Modelos de Datos

### Search Result

```typescript
interface SearchResult {
  id: string                    // ID del barbero
  name: string                  // Nombre del barbero
  rating: number                // Calificación promedio (0-5)
  reviewCount: number           // Número de reseñas
  services: string[]            // Array de servicios ofrecidos
  priceRange: {                 // Rango de precios
    min: number                 // Precio mínimo
    max: number                 // Precio máximo
  }
  location: {                   // Ubicación
    latitude: number            // Latitud
    longitude: number           // Longitud
    address: string             // Dirección formateada
  }
  distance: number              // Distancia en km
  availability: {                // Disponibilidad
    nextAvailable: string       // Próxima cita disponible (ISO)
    slotsToday: number          // Número de slots hoy
  }
  portfolio: {                   // Portafolio
    imageCount: number          // Número de imágenes
    featuredImage: string       // URL imagen destacada
  }
  score: number                  // Score de relevancia (0-1)
  relevance: 'high' | 'medium' | 'low'  // Nivel de relevancia
}
```

### Search Filters

```typescript
interface SearchFilters {
  q?: string                    // Término de búsqueda
  location?: {                   // Ubicación
    latitude: number
    longitude: number
  }
  radius?: number               // Radio en km
  services?: string[]           // Servicios requeridos
  minRating?: number            // Calificación mínima
  maxPrice?: number             // Precio máximo
  availability?: {               // Disponibilidad
    date: string                // Fecha ISO
    time?: string               // Hora ISO (opcional)
  }
  sort?: 'relevance' | 'distance' | 'price' | 'rating'
  limit?: number                // Límite de resultados
  offset?: number               // Offset para paginación
}
```

## 📋 Reglas de Negocio

### Algoritmo de Búsqueda

1. **Relevancia**: Calculada basándose en:
   - Coincidencia de términos de búsqueda
   - Proximidad geográfica
   - Calificación y número de reseñas
   - Disponibilidad
   - Completitud del perfil

2. **Fórmula de Score**:
   ```
   score = (textRelevance * 0.3) + 
           (locationScore * 0.25) + 
           (ratingScore * 0.2) + 
           (availabilityScore * 0.15) + 
           (profileScore * 0.1)
   ```

3. **Boost Factors**:
   - Barberos con fotos de perfil: +10%
   - Portafolio con imágenes: +15%
   - Verificación de identidad: +5%
   - Reseñas recientes: +20%

### Filtros de Disponibilidad

1. **Verificación en Tiempo Real**: Consulta al scheduler-service
2. **Caché de Disponibilidad**: TTL de 5 minutos
3. **Slots Disponibles**: Mínimo 1 slot en el rango solicitado
4. **Zona Horaria**: Basada en ubicación del cliente

### Límites y Paginación

- **Máximo por página**: 100 resultados
- **Máximo general**: 1000 resultados por búsqueda
- **Offset máximo**: 990 (para mantener performance)
- **Sugerencias**: Máximo 10 sugerencias

## 🔗 Integración con otros servicios

### Servicios Relacionados

1. **User-Service**: Datos de perfil de barberos
2. **Scheduler-Service**: Disponibilidad en tiempo real
3. **Portfolio-Service**: Imágenes y servicios
4. **Rating-Service**: Calificaciones y reseñas
5. **Ranking-Service**: Scores de ranking

### Eventos Consumidos

```typescript
@EventPattern('user.profile.updated')
async handleProfileUpdated(data: ProfileUpdatedEvent) {
  await this.updateSearchIndex(data.userId, data.profile)
}

@EventPattern('portfolio.item.created')
async handlePortfolioItemCreated(data: PortfolioItemCreatedEvent) {
  await this.updateSearchIndex(data.barberId, { portfolioUpdated: true })
}

@EventPattern('rating.created')
async handleRatingCreated(data: RatingCreatedEvent) {
  await this.updateSearchIndex(data.barberId, { ratingUpdated: true })
}
```

### Caché Invalidation

- **Perfil actualizado**: Invalida caché del barbero
- **Disponibilidad cambia**: Invalida búsquedas con filtros de fecha
- **Nueva reseña**: Invalida caché de rating
- **Portafolio actualizado**: Invalida caché de servicios

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

EXPOSE 3005

CMD ["npm", "run", "start"]
```

### Docker Compose

```yaml
search-service:
  build: ./services/search-service
  ports:
    - "3005:3005"
  environment:
    - REDIS_URL=redis://redis:6379
    - NODE_ENV=production
  depends_on:
    - redis
  networks:
    - barberia-network
```

### Optimización de Performance

1. **Índices de Redis**:
   - Índice geoespacial para búsquedas por ubicación
   - Índice invertido para búsqueda de texto
   - Sorted sets para rankings y ratings

2. **Caché Estrategias**:
   - Caché por ubicación y radio
   - Caché por combinación de filtros
   - Caché de sugerencias con TTL corto

3. **Pre-computación**:
   - Scores de relevancia pre-calculados
   - Disponibilidad pre-cargada
   - Popular searches actualizadas diariamente

### Health Check

El servicio expone un endpoint de health check en `/search/health` que retorna:
- Estado del servicio
- Conexión a Redis
- Tasa de aciertos de caché
- Métricas de búsqueda
- Tiempo de procesamiento promedio

### Métricas de Rendimiento

- **Tiempo de respuesta promedio**: < 200ms
- **Tasa de aciertos de caché**: > 70%
- **Capacidad de concurrencia**: 500+ búsquedas/segundo
- **Precisión de resultados**: > 90% en top 10
- **Tiempo de actualización de índice**: < 5 segundos

### Monitoreo

Se recomienda implementar:
- Métricas de latencia por tipo de búsqueda
- Contadores de uso de filtros
- Análisis de términos de búsqueda fallidos
- Seguimiento de conversiones (búsqueda → reserva)
- Alertas para degradación de performance

### Seguridad

Consideraciones de seguridad pendientes:
- Rate limiting por IP/usuario
- Sanitización de términos de búsqueda
- Validación de parámetros de entrada
- Protección contra inyección de código
- Auditoría de búsquedas sensibles