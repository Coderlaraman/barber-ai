# Configuración de Puertos - Sistema de Microservicios Barber AI

## Resumen de Puertos

Este documento describe la configuración de puertos para todos los servicios en el ecosistema de microservicios Barber AI.

### 🌐 API Gateway (Puerto Principal: 8080)
- **Servicio**: api-gateway
- **Puerto expuesto**: 8080 → 8085 (Docker)
- **Descripción**: Punto de entrada único para todos los servicios
- **URL**: http://localhost:8080

### 🔐 Servicios de Backend (NestJS)

| Servicio | Puerto Interno | Puerto Externo | Ruta API Gateway | Descripción |
|----------|-----------------|----------------|------------------|-------------|
| auth-service | 3001 | 3001 | /auth/* | Autenticación y autorización |
| scheduler-service | 3002 | No expuesto | /scheduler/* | Gestión de citas y horarios |
| notifications-service | 3003 | No expuesto | /notifications/* | Sistema de notificaciones |
| portfolio-service | 3004 | No expuesto | /portfolio/* | Gestión de portafolio de servicios |
| search-service | 3005 | 3005 | /search/* | Búsqueda de servicios y barberos |
| ranking-service | 3006 | No expuesto | /ranking/* | Sistema de valoraciones y rankings |

### 🤖 Servicios de Backend (FastAPI)

| Servicio | Puerto Interno | Puerto Externo | Ruta API Gateway | Descripción |
|----------|-----------------|----------------|------------------|-------------|
| ai-recommender-service | 8000 | No expuesto | /ai/* | Recomendaciones con IA |

### 🗄️ Servicios de Infraestructura

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| PostgreSQL | 5432:5432 | Base de datos principal |
| Redis | No expuesto | Cache y cola de mensajes |

## Configuración por Ambiente

### Desarrollo Local
- **API Gateway**: http://localhost:8080
- **Auth Service**: http://localhost:3001
- **Search Service**: http://localhost:3005
- **PostgreSQL**: localhost:5432

### Docker Compose
Los servicios se comunican entre sí usando nombres de servicio Docker:
- auth-service:3001
- scheduler-service:3002
- notifications-service:3003
- portfolio-service:3004
- search-service:3005
- ranking-service:3006
- ai-recommender-service:8000

## Variables de Entorno

### Puerto del API Gateway
```bash
PORT=8085  # Puerto interno del contenedor (se mapea a 8080 externo)
```

### Puertos de Servicios NestJS
```bash
# auth-service
PORT=3001

# scheduler-service  
PORT=3002

# notifications-service
PORT=3003

# portfolio-service
PORT=3004

# search-service
PORT=3005

# ranking-service
PORT=3006
```

### URLs de Servicios (API Gateway)
```bash
AUTH_SERVICE_URL=http://auth-service:3001
```

## Endpoints de Documentación

Todos los servicios exponen documentación OpenAPI:

- **API Gateway**: http://localhost:8080/docs-json
- **Auth Service**: http://localhost:8080/docs-json/auth
- **Scheduler Service**: http://localhost:8080/docs-json/scheduler
- **Notifications Service**: http://localhost:8080/docs-json/notifications
- **Portfolio Service**: http://localhost:8080/docs-json/portfolio
- **Search Service**: http://localhost:8080/docs-json/search
- **Ranking Service**: http://localhost:8080/docs-json/ranking
- **AI Recommender**: http://localhost:8080/docs-json/ai

## Endpoints de Health Check

- **API Gateway**: http://localhost:8080/
- **Auth Service**: http://localhost:8080/auth/health
- **Scheduler Service**: http://localhost:8080/scheduler/health
- **Notifications Service**: http://localhost:8080/notifications/health
- **Portfolio Service**: http://localhost:8080/portfolio/health
- **Search Service**: http://localhost:8080/search/health
- **Ranking Service**: http://localhost:8080/ranking/health
- **AI Recommender**: http://localhost:8080/ai/health

## Mejores Prácticas

1. **Puertos Externos vs Internos**: Solo los servicios críticos (API Gateway, Auth, Search, PostgreSQL) exponen puertos externos.

2. **Consistencia de Puertos**: Los puertos internos se mantienen consistentes entre Docker y desarrollo local.

3. **Variables de Entorno**: Siempre usar variables de entorno para configurar puertos, con valores por defecto.

4. **Health Checks**: Todos los servicios implementan endpoints de health check para monitoreo.

5. **Documentación**: Mantener actualizada esta documentación cuando se agreguen nuevos servicios o cambien puertos.

## Solución de Problemas

### Conflicto de Puertos
Si encuentras errores de "puerto ya en uso":

1. Verifica qué proceso está usando el puerto:
   ```bash
   lsof -i :8080  # macOS/Linux
   netstat -ano | findstr :8080  # Windows
   ```

2. Detén el proceso conflictivo o modifica el puerto en el archivo `.env` correspondiente.

3. Reinicia el servicio afectado.

### Servicios No Accesibles
1. Verifica que el contenedor esté ejecutándose:
   ```bash
   docker compose ps
   ```

2. Revisa los logs del servicio:
   ```bash
   docker compose logs [nombre-servicio]
   ```

3. Confirma que el health check esté pasando:
   ```bash
   curl http://localhost:8080/[servicio]/health
   ```