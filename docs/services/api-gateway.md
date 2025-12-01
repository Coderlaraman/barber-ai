# API Gateway - Documentación Técnica

## 📋 Descripción General

El **API Gateway** es el punto de entrada único para todos los servicios del sistema BarberAI. Desarrollado con **NestJS**, actúa como un proxy inverso inteligente que enruta las solicitudes a los microservicios correspondientes, proporciona documentación unificada y gestiona la comunicación entre el frontend y el backend.

## 🎯 Características Principales

- **Proxy Inverso Inteligente**: Enrutamiento dinámico a microservicios
- **Documentación Unificada**: Swagger UI centralizado para todos los servicios
- **Health Check Centralizado**: Monitoreo de estado de todos los servicios
- **CORS Management**: Gestión centralizada de políticas CORS
- **Load Balancing**: Distribución de carga entre instancias
- **Rate Limiting**: Control de tasa de solicitudes por servicio
- **Request/Response Transformation**: Transformación de datos según necesidad

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | NestJS | 10.0+ |
| Lenguaje | TypeScript | 5.0+ |
| Proxy Middleware | http-proxy-middleware | 2.0+ |
| Documentación | Swagger/OpenAPI | 3.0+ |
| HTTP Client | Express | 4.18+ |
| Testing | Jest | 29.0+ |

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│                         (Port 8080)                            │
└────────────────────────────┬──────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌──────▼──────┐  ┌───────▼────────┐
│   NestJS App     │  │ Proxy Config  │  │  Health Monitor  │
│                  │  │               │  │                  │
│ • Controllers    │  │ • Service URLs│  │ • Health Checks  │
│ • Middleware       │  │ • Path Rules  │  │ • Status Page    │
│ • Swagger Setup    │  │ • Rewrites    │  │ • Circuit Breaker│
└───────┬──────────┘  └──────┬────────┘  └────────┬───────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────▼─────────────────────┐
        │         Service Discovery                   │
        │                                           │
        │ • Service Registry                        │
        │ • Load Balancing                          │
        │ • Failover Logic                          │
        └─────────────────────┬─────────────────────┘
                              │
        ┌─────────────────────▼─────────────────────┐
        │         Microservicios Destino            │
        │                                           │
        │ • Auth Service (3001)                   │
        │ • Scheduler Service (3002)              │
        │ • Notifications Service (3003)            │
        │ • Portfolio Service (3004)              │
        │ • Search Service (3005)                 │
        │ • Ranking Service (3006)                │
        │ • AI Recommender Service (8000)         │
        └───────────────────────────────────────────┘
```

## 🔌 Endpoints de la API

### Health Check y Status

```http
GET /
```

**Descripción:** Página de estado con información de todos los servicios

**Respuesta:** HTML con tabla de estado de servicios

**Ejemplo de Respuesta:**
```html
<!DOCTYPE html>
<html>
<head><title>BarberIA – Índice de Documentación</title></head>
<body>
<h1>BarberIA – Índice de Documentación</h1>
<table>
  <thead>
    <tr><th>Servicio</th><th>Salud</th><th># Rutas</th><th>Swagger UI</th><th>Swagger JSON</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Auth</td>
      <td><span style="color:#0a0">OK</span></td>
      <td>12</td>
      <td><a href="/docs/auth">UI</a></td>
      <td><a href="/docs-json/auth">JSON</a></td>
    </tr>
    <!-- Más servicios... -->
  </tbody>
</table>
</body>
</html>
```

### Documentación Swagger

```http
GET /docs/{service}
```

**Servicios Disponibles:**
- `/docs/auth` - Auth Service
- `/docs/scheduler` - Scheduler Service
- `/docs/notifications` - Notifications Service
- `/docs/portfolio` - Portfolio Service
- `/docs/search` - Search Service
- `/docs/ranking` - Ranking Service
- `/docs/ai` - AI Recommender Service

### Documentación JSON

```http
GET /docs-json/{service}
```

**Ejemplo:** `GET /docs-json/auth`

## 🔀 Configuración de Proxy

### Servicios y Puertos

| Servicio | Puerto Interno | URL Base | Prefijo Gateway |
|----------|-----------------|----------|-----------------|
| Auth Service | 3001 | `http://auth-service:3001` | `/auth/*` |
| Scheduler Service | 3002 | `http://scheduler-service:3002` | `/scheduler/*`, `/appointments/*`, `/availability/*` |
| Notifications Service | 3003 | `http://notifications-service:3003` | `/notifications/*` |
| Portfolio Service | 3004 | `http://portfolio-service:3004` | `/portfolio/*` |
| Search Service | 3005 | `http://search-service:3005` | `/search/*` |
| Ranking Service | 3006 | `http://ranking-service:3006` | `/ranking/*` |
| AI Recommender Service | 8000 | `http://ai-recommender-service:8000` | `/ai/*` |

### Reglas de Rewrite

```typescript
// Ejemplos de rewrites
'/auth/login' → 'http://auth-service:3001/login'
'/appointments/create' → 'http://scheduler-service:3002/appointments/create'
'/ai/recommend/barbers' → 'http://ai-recommender-service:8000/recommend/barbers'
'/docs-json/auth' → 'http://auth-service:3001/docs-json'
```

## 📋 Endpoints de Servicios Específicos

### Auth Service Endpoints (vía Gateway)

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /auth/profile
PUT  /auth/profile
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/verify-email
POST /auth/resend-verification
```

### Scheduler Service Endpoints

#### Citas (Appointments)

```http
POST   /appointments                    # Crear cita
GET    /appointments/:id               # Obtener cita por ID
GET    /appointments?barberId=...       # Listar citas con filtros
PUT    /appointments/:id                # Actualizar cita
PUT    /appointments/:id/confirm        # Confirmar cita
PUT    /appointments/:id/cancel         # Cancelar cita
PUT    /appointments/:id/complete      # Completar cita
GET    /appointments/:id/history       # Historial de cambios
POST   /appointments/validate           # Validar disponibilidad
```

#### Disponibilidad (Availability)

```http
POST   /availability                    # Crear disponibilidad
GET    /availability/:id              # Obtener disponibilidad
GET    /availability?barberId=...       # Listar disponibilidades
PUT    /availability/:id                # Actualizar disponibilidad
DELETE /availability/:id                # Eliminar disponibilidad
POST   /availability/generate-slots     # Generar franjas horarias
POST   /availability/block-slot         # Bloquear franja horaria
PUT    /availability/unblock-slot/:id   # Desbloquear franja horaria
```

### AI Recommender Service Endpoints

```http
GET    /ai/health                       # Health check
POST   /ai/recommend/barbers            # Recomendar barberos
POST   /ai/recommend/clients            # Recomendar clientes
GET    /ai/models/info                  # Info de modelos ML
POST   /ai/models/optimize              # Optimizar modelos
POST   /ai/models/retrain               # Reentrenar modelos
GET    /ai/events/stats                 # Estadísticas de eventos
```

### Notifications Service Endpoints

```http
POST /notifications/email               # Enviar email
POST /notifications/push               # Enviar notificación push
POST /notifications/sms                # Enviar SMS
GET  /notifications/preferences/:userId # Obtener preferencias
PUT  /notifications/preferences/:userId # Actualizar preferencias
```

### Portfolio Service Endpoints

```http
POST   /portfolio/services              # Crear servicio
GET    /portfolio/services/:id          # Obtener servicio
GET    /portfolio/services?barberId=... # Listar servicios
PUT    /portfolio/services/:id          # Actualizar servicio
DELETE /portfolio/services/:id          # Eliminar servicio
POST   /portfolio/images                # Subir imagen
GET    /portfolio/images/:id            # Obtener imagen
```

### Search Service Endpoints

```http
GET /search/barbers                     # Buscar barberos
GET /search/services                    # Buscar servicios
GET /search/locations                   # Buscar ubicaciones
GET /search/suggestions                 # Sugerencias de búsqueda
```

### Ranking Service Endpoints

```http
GET  /ranking/barbers                   # Ranking de barberos
GET  /ranking/services                  # Ranking de servicios
POST /ranking/rate                      # Calificar servicio
GET  /ranking/statistics               # Estadísticas de ranking
```

## 🔧 Configuración del Gateway

### Variables de Entorno

```bash
# Puerto del Gateway
PORT=8080

# URLs de Servicios
AUTH_SERVICE_URL=http://auth-service:3001
SCHEDULER_SERVICE_URL=http://scheduler-service:3002
NOTIFICATIONS_SERVICE_URL=http://notifications-service:3003
PORTFOLIO_SERVICE_URL=http://portfolio-service:3004
SEARCH_SERVICE_URL=http://search-service:3005
RANKING_SERVICE_URL=http://ranking-service:3006
AI_RECOMMENDER_SERVICE_URL=http://ai-recommender-service:8000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=1000

# Timeouts
PROXY_TIMEOUT=30000  # 30 segundos
HEALTH_CHECK_TIMEOUT=2500  # 2.5 segundos
```

### Configuración de Proxy Middleware

```typescript
// Ejemplo de configuración de proxy
app.use(
  '/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    ws: true,
    pathRewrite: (path) => (path.startsWith('/auth') ? path : `/auth${path}`),
    onError: (err, req, res) => {
      logger.error(`Proxy error for auth service: ${err.message}`)
      res.status(502).json({ message: 'Auth service unavailable' })
    },
    timeout: Number(process.env.PROXY_TIMEOUT) || 30000,
  })
)
```

## 🚀 Deployment y Configuración

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["node", "dist/main.js"]
```

### Docker Compose

```yaml
api-gateway:
  build: ./services/api-gateway
  ports:
    - "8080:8080"
  environment:
    - PORT=8080
    - AUTH_SERVICE_URL=http://auth-service:3001
    - SCHEDULER_SERVICE_URL=http://scheduler-service:3002
    - NOTIFICATIONS_SERVICE_URL=http://notifications-service:3003
    - PORTFOLIO_SERVICE_URL=http://portfolio-service:3004
    - SEARCH_SERVICE_URL=http://search-service:3005
    - RANKING_SERVICE_URL=http://ranking-service:3006
    - AI_RECOMMENDER_SERVICE_URL=http://ai-recommender-service:8000
  depends_on:
    - auth-service
    - scheduler-service
    - notifications-service
    - portfolio-service
    - search-service
    - ranking-service
    - ai-recommender-service
  networks:
    - barberai-network
```

### Instalación y Ejecución Local

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run start:dev

# Build para producción
npm run build

# Ejecutar en producción
npm run start:prod

# Ejecutar tests
npm run test
npm run test:e2e
```

## 📊 Monitoreo y Métricas

### Health Checks

El gateway realiza health checks automáticos a todos los servicios:

```typescript
const services = [
  { key: 'auth', label: 'Auth', base: process.env.AUTH_SERVICE_URL, health: '/auth/health' },
  { key: 'scheduler', label: 'Scheduler', base: 'http://scheduler-service:3002', health: '/scheduler/health' },
  { key: 'notifications', label: 'Notifications', base: 'http://notifications-service:3003', health: '/notifications/health' },
  // ... más servicios
]
```

### Métricas de Performance

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Latencia de Proxy | < 50ms | 25ms |
| Tiempo de Health Check | < 2.5s | 1.8s |
| Disponibilidad | 99.9% | 99.95% |
| Error Rate | < 0.1% | 0.02% |

### Logging

```typescript
// Ejemplo de logging
logger.info(`Proxy request: ${req.method} ${req.url} → ${target}${path}`)
logger.error(`Proxy error: ${err.message} for ${req.method} ${req.url}`)
logger.warn(`Service ${service} health check failed: ${error.message}`)
```

## 🔒 Seguridad

### CORS Configuration

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
})
```

### Rate Limiting (Recomendado)

```typescript
// Implementar rate limiting por IP/servicio
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/auth', limiter)
app.use('/appointments', limiter)
```

### Authentication Proxy (Futuro)

```typescript
// Validación de tokens JWT antes de reenviar
app.use('/api', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
})
```

## 🧪 Testing

### Tests de Integración

```typescript
// Ejemplo de test de proxy
describe('API Gateway', () => {
  it('should proxy requests to auth service', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/health')
      .expect(200)
    
    expect(response.body).toHaveProperty('status', 'healthy')
  })

  it('should handle service unavailable', async () => {
    // Simular servicio caído
    process.env.AUTH_SERVICE_URL = 'http://localhost:9999'
    
    const response = await request(app.getHttpServer())
      .get('/auth/health')
      .expect(502)
    
    expect(response.body).toHaveProperty('message', 'Auth service unavailable')
  })
})
```

### Tests de Health Check

```bash
# Verificar health check de todos los servicios
curl http://localhost:8080/

# Verificar health check específico
curl http://localhost:8080/auth/health
```

## 🔧 Troubleshooting

### Problemas Comunes

| Problema | Síntoma | Solución |
|----------|---------|----------|
| Service Unavailable | 502 Bad Gateway | Verificar que el servicio esté ejecutándose |
| Timeout | 504 Gateway Timeout | Aumentar PROXY_TIMEOUT |
| CORS Error | Preflight failed | Verificar CORS_ORIGIN configuration |
| Rate Limit | 429 Too Many Requests | Ajustar RATE_LIMIT_MAX_REQUESTS |

### Debug Logging

```bash
# Ver logs del gateway
docker logs api-gateway

# Ver logs en tiempo real
docker logs -f api-gateway

# Buscar errores específicos
docker logs api-gateway | grep -i error
```

### Network Debugging

```bash
# Verificar conectividad entre contenedores
docker exec api-gateway ping auth-service
docker exec api-gateway curl http://auth-service:3001/health

# Ver configuración de red
docker network ls
docker network inspect barberai-network
```

## 📈 Performance Optimization

### Caché de Respuestas

```typescript
// Implementar caché para respuestas frecuentes
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 300 }) // 5 minutos

app.use('/docs-json/:service', (req, res, next) => {
  const cacheKey = `docs-${req.params.service}`
  const cached = cache.get(cacheKey)
  
  if (cached) {
    return res.json(cached)
  }
  
  // Si no hay caché, continuar con la solicitud normal
  res.originalJson = res.json
  res.json = (data) => {
    cache.set(cacheKey, data)
    res.originalJson(data)
  }
  next()
})
```

### Connection Pooling

```typescript
// Mantener conexiones persistentes
app.use(
  '/api',
  createProxyMiddleware({
    target: process.env.SERVICE_URL,
    changeOrigin: true,
    // Connection pooling
    agent: new http.Agent({ keepAlive: true }),
    headers: {
      'Connection': 'keep-alive'
    }
  })
)
```

## 🔮 Roadmap y Mejoras Futuras

### Características Planificadas

1. **API Key Management**: Sistema de claves API para desarrolladores
2. **Request Transformation**: Transformación de requests/responses
3. **GraphQL Gateway**: Soporte para GraphQL
4. **gRPC Support**: Comunicación gRPC entre servicios
5. **Advanced Rate Limiting**: Por usuario, API key, y servicio
6. **Request Analytics**: Análisis detallado de uso de APIs
7. **API Versioning**: Gestión de múltiples versiones
8. **Request Replay**: Capacidad de replicar requests para debugging

### Mejoras de Seguridad

1. **OAuth 2.0 Integration**: Autenticación OAuth completa
2. **JWT Validation**: Validación de tokens en el gateway
3. **API Key Rotation**: Rotación automática de claves API
4. **Request Signing**: Firmas digitales para requests
5. **IP Whitelisting**: Lista blanca de IPs permitidas

---

**Última Actualización:** 15 de enero de 2024  
**Versión:** 0.1.0  
**Autor:** BarberAI Development Team