# Guía de Despliegue - BarberIA

Documentación completa sobre el despliegue del sistema BarberIA, incluyendo configuración de entornos, Docker, Kubernetes, CI/CD y monitoreo.

## 📋 Índice

- [Requisitos del Sistema](#requisitos-del-sistema)
- [Configuración de Entornos](#configuración-de-entornos)
- [Despliegue con Docker](#despliegue-con-docker)
- [Despliegue con Kubernetes](#despliegue-con-kubernetes)
- [Integración y Despliegue Continuo (CI/CD)](#integración-y-despliegue-continuo-cicd)
- [Monitoreo y Alertas](#monitoreo-y-alertas)
- [Backup y Recuperación](#backup-y-recuperación)
- [Seguridad](#seguridad)
- [Rendimiento](#rendimiento)
- [Solución de Problemas](#solución-de-problemas)

## 🔧 Requisitos del Sistema

### Requisitos Mínimos

#### Desarrollo
- **CPU**: 2 cores
- **RAM**: 4GB
- **Almacenamiento**: 20GB SSD
- **Sistema Operativo**: Ubuntu 20.04+ / macOS 10.15+ / Windows 10+
- **Docker**: 20.10+
- **Docker Compose**: 1.29+

#### Producción (Pequeña escala)
- **CPU**: 4 cores
- **RAM**: 8GB
- **Almacenamiento**: 50GB SSD
- **Sistema Operativo**: Ubuntu 20.04+ / CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 1.29+ o Kubernetes 1.20+

#### Producción (Gran escala)
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Almacenamiento**: 100GB+ SSD
- **Cluster Kubernetes**: 3+ nodos
- **Load Balancer**: HAProxy / NGINX / AWS ELB

### Dependencias Externas

#### Base de Datos
- **PostgreSQL**: 14.0+
- **Redis**: 7.0+

#### Herramientas de Monitoreo
- **Prometheus**: 2.40+
- **Grafana**: 9.0+
- **Jaeger**: 1.40+ (opcional para tracing)

#### Registro y Log Management
- **Elasticsearch**: 8.0+ (opcional)
- **Kibana**: 8.0+ (opcional)
- **Fluentd/Fluent Bit**: 1.9+ (opcional)

## 🌍 Configuración de Entornos

### Estructura de Variables de Entorno

#### Archivo `.env.example`
```bash
# ===================================
# BarberIA Environment Configuration
# ===================================

# Entorno
NODE_ENV=development
APP_ENV=local
DEBUG=barberia:*

# ===================================
# API Gateway Configuration
# ===================================
API_GATEWAY_PORT=3000
API_GATEWAY_HOST=0.0.0.0
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# ===================================
# Database Configuration
# ===================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=barberia
DB_PASSWORD=your_secure_password
DB_NAME=barberia_main
DATABASE_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Database per service
AUTH_DB_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/barberia_auth
BOOKING_DB_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/barberia_bookings
SCHEDULER_DB_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/barberia_scheduler
PORTFOLIO_DB_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/barberia_portfolio

# ===================================
# Redis Configuration
# ===================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://${REDIS_HOST}:${REDIS_PORT}

# ===================================
# JWT Configuration
# ===================================
JWT_SECRET=your_jwt_secret_key_min_32_characters_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d

# ===================================
# Service-specific Configuration
# ===================================

# Auth Service
AUTH_SERVICE_PORT=3001
AUTH_SERVICE_HOST=auth-service

# Booking Service
BOOKING_SERVICE_PORT=3002
BOOKING_SERVICE_HOST=booking-service

# Scheduler Service
SCHEDULER_SERVICE_PORT=3003
SCHEDULER_SERVICE_HOST=scheduler-service

# Portfolio Service
PORTFOLIO_SERVICE_PORT=3004
PORTFOLIO_SERVICE_HOST=portfolio-service

# Search Service
SEARCH_SERVICE_PORT=3005
SEARCH_SERVICE_HOST=search-service

# Ranking Service
RANKING_SERVICE_PORT=3006
RANKING_SERVICE_HOST=ranking-service

# Notifications Service
NOTIFICATIONS_SERVICE_PORT=3007
NOTIFICATIONS_SERVICE_HOST=notifications-service

# AI Recommender Service
AI_RECOMMENDER_PORT=8001
AI_RECOMMENDER_HOST=ai-recommender-service

# ===================================
# External Services
# ===================================

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_password

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# ===================================
# Monitoring & Logging
# ===================================
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
JAEGER_PORT=14268

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_REQUEST_LOGGING=true

# ===================================
# Security Configuration
# ===================================
CORS_ORIGIN=http://localhost:3000,https://barberia.com
CORS_CREDENTIALS=true
BCRYPT_ROUNDS=12

# ===================================
# Performance Configuration
# ===================================
CACHE_TTL=3600
CONNECTION_POOL_SIZE=20
MAX_UPLOAD_SIZE=10mb

# ===================================
# Development Configuration
# ===================================
SWAGGER_ENABLED=true
SWAGGER_PATH=/docs
MOCK_SERVICES=false
```

### Configuración por Entorno

#### Desarrollo Local (`.env.local`)
```bash
NODE_ENV=development
DEBUG=barberia:*
SWAGGER_ENABLED=true
MOCK_SERVICES=true
LOG_LEVEL=debug

# Local development overrides
DB_HOST=localhost
REDIS_HOST=localhost
RATE_LIMIT_MAX_REQUESTS=10000
```

#### Desarrollo Remoto (`.env.dev`)
```bash
NODE_ENV=development
APP_ENV=development
DEBUG=barberia:error
SWAGGER_ENABLED=true
LOG_LEVEL=info

# Development database
DATABASE_URL=postgresql://dev_user:dev_password@dev-db.barberia.com:5432/barberia_dev
REDIS_URL=redis://dev-redis.barberia.com:6379
```

#### Staging (`.env.staging`)
```bash
NODE_ENV=production
APP_ENV=staging
DEBUG=barberia:error
SWAGGER_ENABLED=false
LOG_LEVEL=warn

# Staging database
DATABASE_URL=postgresql://staging_user:staging_password@staging-db.barberia.com:5432/barberia_staging
REDIS_URL=redis://staging-redis.barberia.com:6379

# Staging specific
RATE_LIMIT_MAX_REQUESTS=500
CACHE_TTL=1800
```

#### Producción (`.env.production`)
```bash
NODE_ENV=production
APP_ENV=production
DEBUG=barberia:error
SWAGGER_ENABLED=false
LOG_LEVEL=error

# Production database (use connection pooling)
DATABASE_URL=postgresql://prod_user:prod_password@prod-db-cluster.barberia.com:5432/barberia_prod?ssl=true&pool_size=20
REDIS_URL=redis://prod-redis-cluster.barberia.com:6379?tls=true

# Production security
JWT_SECRET=${PRODUCTION_JWT_SECRET}  # From secrets management
BCRYPT_ROUNDS=14
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL=7200
```

## 🐳 Despliegue con Docker

### Docker Compose para Desarrollo

#### `docker-compose.dev.yml`
```yaml
version: '3.8'

services:
  # Infrastructure
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: barberia
      POSTGRES_PASSWORD: dev_password
      POSTGRES_MULTIPLE_DATABASES: barberia_auth,barberia_bookings,barberia_scheduler,barberia_portfolio
    volumes:
      - ./docker/postgres/init-multiple-databases.sh:/docker-entrypoint-initdb.d/init-multiple-databases.sh
      - postgres_dev_data:/var/lib/postgresql/data
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
      - redis_dev_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Services
  api-gateway:
    build:
      context: .
      dockerfile: services/api-gateway/Dockerfile
    environment:
      - NODE_ENV=development
      - PORT=3000
      - AUTH_SERVICE_URL=http://auth-service:3001
      - BOOKING_SERVICE_URL=http://booking-service:3002
      - SCHEDULER_SERVICE_URL=http://scheduler-service:3003
      - PORTFOLIO_SERVICE_URL=http://portfolio-service:3004
      - SEARCH_SERVICE_URL=http://search-service:3005
      - RANKING_SERVICE_URL=http://ranking-service:3006
      - NOTIFICATIONS_SERVICE_URL=http://notifications-service:3007
      - AI_RECOMMENDER_URL=http://ai-recommender-service:8001
    ports:
      - "3000:3000"
    depends_on:
      - auth-service
      - booking-service
      - scheduler-service
    volumes:
      - ./services/api-gateway:/app
      - /app/node_modules
    command: npm run dev

  auth-service:
    build:
      context: .
      dockerfile: services/auth-service/Dockerfile
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=postgresql://barberia:dev_password@postgres:5432/barberia_auth
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev_jwt_secret_key_32_characters_long
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/auth-service:/app
      - /app/node_modules
    command: npm run dev

  booking-service:
    build:
      context: .
      dockerfile: services/booking-service/Dockerfile
    environment:
      - NODE_ENV=development
      - PORT=3002
      - DATABASE_URL=postgresql://barberia:dev_password@postgres:5432/barberia_bookings
      - REDIS_URL=redis://redis:6379
    ports:
      - "3002:3002"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/booking-service:/app
      - /app/node_modules
    command: npm run dev

  scheduler-service:
    build:
      context: .
      dockerfile: services/scheduler-service/Dockerfile
    environment:
      - NODE_ENV=development
      - PORT=3003
      - DATABASE_URL=postgresql://barberia:dev_password@postgres:5432/barberia_scheduler
      - REDIS_URL=redis://redis:6379
    ports:
      - "3003:3003"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/scheduler-service:/app
      - /app/node_modules
    command: npm run dev

  portfolio-service:
    build:
      context: .
      dockerfile: services/portfolio-service/Dockerfile
    environment:
      - NODE_ENV=development
      - PORT=3004
      - DATABASE_URL=postgresql://barberia:dev_password@postgres:5432/barberia_portfolio
      - REDIS_URL=redis://redis:6379
    ports:
      - "3004:3004"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/portfolio-service:/app
      - /app/node_modules
    command: npm run dev

  search-service:
    build:
      context: .
      dockerfile: services/search-service/Dockerfile
    environment:
      - NODE_ENV=development
      - PORT=3005
      - REDIS_URL=redis://redis:6379
    ports:
      - "3005:3005"
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./services/search-service:/app
      - /app/node_modules
    command: npm run dev

  ranking-service:
    build:
      context: .
      dockerfile: services/ranking-service/Dockerfile
    environment:
      - NODE_ENV=development
      - PORT=3006
      - REDIS_URL=redis://redis:6379
    ports:
      - "3006:3006"
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./services/ranking-service:/app
      - /app/node_modules
    command: npm run dev

  notifications-service:
    build:
      context: .
      dockerfile: services/notifications-service/Dockerfile
    environment:
      - NODE_ENV=development
      - PORT=3007
      - REDIS_URL=redis://redis:6379
    ports:
      - "3007:3007"
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./services/notifications-service:/app
      - /app/node_modules
    command: npm run dev

  ai-recommender-service:
    build:
      context: .
      dockerfile: services/ai-recommender-service/Dockerfile
    environment:
      - ENVIRONMENT=development
      - PORT=8001
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://barberia:dev_password@postgres:5432/barberia_main
    ports:
      - "8001:8001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/ai-recommender-service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8001 --reload

volumes:
  postgres_dev_data:
  redis_dev_data:

networks:
  default:
    driver: bridge
    name: barberia-dev-network
```

### Docker Compose para Producción

#### `docker-compose.prod.yml`
```yaml
version: '3.8'

services:
  # Production Infrastructure
  postgres-primary:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    networks:
      - barberia-prod-network
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  redis-cluster:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_prod_data:/data
    networks:
      - barberia-prod-network
    deploy:
      replicas: 3
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # API Gateway with load balancing
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api-gateway
    networks:
      - barberia-prod-network
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        max_attempts: 3

  api-gateway:
    image: barberia/api-gateway:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3000
    networks:
      - barberia-prod-network
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Microservices
  auth-service:
    image: barberia/auth-service:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - barberia-prod-network
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        max_attempts: 3
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  booking-service:
    image: barberia/booking-service:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3002
      - DATABASE_URL=${BOOKING_DB_URL}
      - REDIS_URL=${REDIS_URL}
    networks:
      - barberia-prod-network
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        max_attempts: 3

  scheduler-service:
    image: barberia/scheduler-service:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3003
      - DATABASE_URL=${SCHEDULER_DB_URL}
      - REDIS_URL=${REDIS_URL}
    networks:
      - barberia-prod-network
    deploy:
      replicas: 2

  portfolio-service:
    image: barberia/portfolio-service:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3004
      - DATABASE_URL=${PORTFOLIO_DB_URL}
      - REDIS_URL=${REDIS_URL}
    networks:
      - barberia-prod-network
    deploy:
      replicas: 2

  search-service:
    image: barberia/search-service:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3005
      - REDIS_URL=${REDIS_URL}
    networks:
      - barberia-prod-network
    deploy:
      replicas: 3

  ranking-service:
    image: barberia/ranking-service:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3006
      - REDIS_URL=${REDIS_URL}
    networks:
      - barberia-prod-network
    deploy:
      replicas: 2

  notifications-service:
    image: barberia/notifications-service:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3007
      - REDIS_URL=${REDIS_URL}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    networks:
      - barberia-prod-network
    deploy:
      replicas: 2

  ai-recommender-service:
    image: barberia/ai-recommender-service:${VERSION:-latest}
    environment:
      - ENVIRONMENT=production
      - PORT=8001
      - REDIS_URL=${REDIS_URL}
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - barberia-prod-network
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

volumes:
  postgres_prod_data:
    driver: local
  redis_prod_data:
    driver: local

networks:
  barberia-prod-network:
    driver: overlay
    attachable: true
```

### Scripts de Despliegue

#### `scripts/deploy.sh`
```bash
#!/bin/bash

# BarberIA Deployment Script
set -e

# Configuration
ENVIRONMENT=${1:-development}
VERSION=${2:-latest}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting BarberIA deployment for ${ENVIRONMENT} environment...${NC}"

# Validate environment file
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    echo -e "${RED}❌ Environment file .env.${ENVIRONMENT} not found!${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    exit 1
fi

# Check Docker Compose is available
if ! docker-compose version > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p logs/nginx logs/postgres logs/redis
mkdir -p backup/postgres backup/redis
mkdir -p ssl/certs ssl/private

# Build and start services
echo -e "${YELLOW}🏗️  Building and starting services...${NC}"

if [ "${ENVIRONMENT}" = "production" ]; then
    # Production deployment with rolling updates
    docker-compose -f ${COMPOSE_FILE} build --parallel
    docker-compose -f ${COMPOSE_FILE} up -d --remove-orphans
    
    # Wait for services to be healthy
    echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
    sleep 30
    
    # Check service health
    for service in auth-service booking-service scheduler-service; do
        if docker-compose -f ${COMPOSE_FILE} ps | grep -q "${service}.*Up.*healthy"; then
            echo -e "${GREEN}✅ ${service} is healthy${NC}"
        else
            echo -e "${RED}❌ ${service} is not healthy${NC}"
            docker-compose -f ${COMPOSE_FILE} logs ${service}
            exit 1
        fi
    done
else
    # Development deployment
    docker-compose -f ${COMPOSE_FILE} up -d --build --remove-orphans
fi

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
docker-compose -f ${COMPOSE_FILE} exec auth-service npm run migration:run || true
docker-compose -f ${COMPOSE_FILE} exec booking-service npm run migration:run || true
docker-compose -f ${COMPOSE_FILE} exec scheduler-service npm run migration:run || true
docker-compose -f ${COMPOSE_FILE} exec portfolio-service npm run migration:run || true

# Post-deployment verification
echo -e "${YELLOW}🔍 Running post-deployment verification...${NC}"

# Check API Gateway
if curl -f http://localhost:${API_GATEWAY_PORT:-3000}/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway is responding${NC}"
else
    echo -e "${RED}❌ API Gateway is not responding${NC}"
    exit 1
fi

# Display service status
echo -e "${GREEN}📊 Service Status:${NC}"
docker-compose -f ${COMPOSE_FILE} ps

# Display endpoints
echo -e "${GREEN}🌐 Available Endpoints:${NC}"
echo "  • API Gateway: http://localhost:${API_GATEWAY_PORT:-3000}"
echo "  • Swagger Docs: http://localhost:${API_GATEWAY_PORT:-3000}/docs"
echo "  • PostgreSQL: localhost:${DB_PORT:-5432}"
echo "  • Redis: localhost:${REDIS_PORT:-6379}"

if [ "${ENVIRONMENT}" = "production" ]; then
    echo "  • Grafana: http://localhost:${GRAFANA_PORT:-3001}"
    echo "  • Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}💡 Use 'docker-compose -f ${COMPOSE_FILE} logs -f' to view logs${NC}"
```

#### `scripts/undeploy.sh`
```bash
#!/bin/bash

# BarberIA Undeployment Script
set -e

ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo -e "\033[0;31m🛑 Stopping BarberIA services for ${ENVIRONMENT}...\033[0m"

# Stop services
docker-compose -f ${COMPOSE_FILE} down --remove-orphans

# Remove volumes (optional - add flag to confirm)
if [ "$2" = "--volumes" ]; then
    echo -e "\033[0;33m⚠️  Removing volumes...\033[0m"
    docker-compose -f ${COMPOSE_FILE} down -v --remove-orphans
fi

# Remove images (optional)
if [ "$2" = "--images" ]; then
    echo -e "\033[0;33m🗑️  Removing images...\033[0m"
    docker image prune -f
fi

echo -e "\033[0;32m✅ Services stopped successfully!\033[0m"
```

## ☸️ Despliegue con Kubernetes

### Configuración Base de Kubernetes

#### `k8s/namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: barberia
  labels:
    name: barberia
    environment: production
```

#### `k8s/configmap.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: barberia-config
  namespace: barberia
data:
  NODE_ENV: "production"
  API_GATEWAY_PORT: "3000"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"
  RATE_LIMIT_MAX_REQUESTS: "100"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: barberia
data:
  POSTGRES_DB: "barberia_prod"
  POSTGRES_USER: "barberia"
```

#### `k8s/secrets.yaml` (Template)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: barberia-secrets
  namespace: barberia
type: Opaque
data:
  # Base64 encoded values
  DB_PASSWORD: eW91cl9zZWN1cmVfcGFzc3dvcmQ=  # your_secure_password
  JWT_SECRET: eW91cl9qd3Rfc2VjcmV0X2tleQ==      # your_jwt_secret
  REDIS_PASSWORD: eW91cl9yZWRpc19wYXNzd29yZA== # your_redis_password
  SMTP_PASSWORD: eW91cl9zbXRwX3Bhc3N3b3Jk    # your_smtp_password
```

### Despliegue de Infraestructura

#### `k8s/infrastructure/postgres.yaml`
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: barberia
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: barberia
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
  type: ClusterIP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: barberia
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: postgres-config
              key: POSTGRES_DB
        - name: POSTGRES_USER
          valueFrom:
            configMapKeyRef:
              name: postgres-config
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: barberia-secrets
              key: DB_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - $(POSTGRES_USER)
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - $(POSTGRES_USER)
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

#### `k8s/infrastructure/redis.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: barberia
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
  type: ClusterIP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: barberia
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command: ["redis-server", "--appendonly", "yes", "--maxmemory", "512mb", "--maxmemory-policy", "allkeys-lru"]
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Despliegue de Microservicios

#### `k8s/services/api-gateway.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: barberia
spec:
  selector:
    app: api-gateway
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: barberia
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: barberia/api-gateway:${VERSION:-latest}
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: barberia-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: barberia-config
              key: API_GATEWAY_PORT
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: barberia-secrets
              key: JWT_SECRET
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
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

#### `k8s/services/auth-service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: barberia
spec:
  selector:
    app: auth-service
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: barberia
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
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
        image: barberia/auth-service:${VERSION:-latest}
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: barberia-config
              key: NODE_ENV
        - name: PORT
          value: "3001"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: barberia-secrets
              key: AUTH_DB_URL
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: barberia-config
              key: REDIS_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: barberia-secrets
              key: JWT_SECRET
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

### Scripts de Kubernetes

#### `scripts/k8s-deploy.sh`
```bash
#!/bin/bash

# Kubernetes Deployment Script
set -e

ENVIRONMENT=${1:-development}
NAMESPACE="barberia"
VERSION=${2:-latest}

echo -e "\033[0;32m🚀 Deploying BarberIA to Kubernetes (${ENVIRONMENT})...\033[0m"

# Create namespace if it doesn't exist
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Apply configurations in order
echo -e "\033[0;33m📋 Applying configurations...\033[0m"

# ConfigMaps and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Infrastructure
kubectl apply -f k8s/infrastructure/postgres.yaml
kubectl apply -f k8s/infrastructure/redis.yaml

# Wait for infrastructure to be ready
echo -e "\033[0;33m⏳ Waiting for infrastructure to be ready...\033[0m"
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n ${NAMESPACE}
kubectl wait --for=condition=available --timeout=300s deployment/redis -n ${NAMESPACE}

# Services
kubectl apply -f k8s/services/api-gateway.yaml
kubectl apply -f k8s/services/auth-service.yaml
kubectl apply -f k8s/services/booking-service.yaml
kubectl apply -f k8s/services/scheduler-service.yaml
kubectl apply -f k8s/services/portfolio-service.yaml
kubectl apply -f k8s/services/search-service.yaml
kubectl apply -f k8s/services/ranking-service.yaml
kubectl apply -f k8s/services/notifications-service.yaml
kubectl apply -f k8s/services/ai-recommender-service.yaml

# Wait for services to be ready
echo -e "\033[0;33m⏳ Waiting for services to be ready...\033[0m"
kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n ${NAMESPACE}

# Get service information
echo -e "\033[0;32m📊 Deployment Status:\033[0m"
kubectl get services -n ${NAMESPACE}
kubectl get deployments -n ${NAMESPACE}

# Get external IP if available
EXTERNAL_IP=$(kubectl get service api-gateway-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ ! -z "$EXTERNAL_IP" ]; then
    echo -e "\033[0;32m🌐 External IP: http://${EXTERNAL_IP}\033[0m"
fi

echo -e "\033[0;32m🎉 Kubernetes deployment completed!\033[0m"
echo -e "\033[0;33m💡 Use 'kubectl get pods -n ${NAMESPACE}' to check pod status\033[0m"
```

## 🔄 Integración y Despliegue Continuo (CI/CD)

### GitHub Actions Workflow

#### `.github/workflows/ci-cd.yml`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth-service, booking-service, scheduler-service, portfolio-service, search-service, ranking-service, notifications-service]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: services/${{ matrix.service }}/package-lock.json
    
    - name: Install dependencies
      run: |
        cd services/${{ matrix.service }}
        npm ci
    
    - name: Run linter
      run: |
        cd services/${{ matrix.service }}
        npm run lint
    
    - name: Run type checking
      run: |
        cd services/${{ matrix.service }}
        npm run typecheck
    
    - name: Run tests
      run: |
        cd services/${{ matrix.service }}
        npm run test:coverage
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: services/${{ matrix.service }}/coverage/lcov.info
        flags: ${{ matrix.service }}

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push API Gateway
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./services/api-gateway/Dockerfile
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api-gateway:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Build and push Auth Service
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./services/auth-service/Dockerfile
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/auth-service:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    # Repeat for other services...

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.25.0'
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Update kubeconfig
      run: aws eks update-kubeconfig --name barberia-staging --region us-west-2
    
    - name: Deploy to staging
      run: |
        envsubst < k8s/kustomization.yaml.template > k8s/kustomization.yaml
        kubectl apply -k k8s/
      env:
        IMAGE_TAG: ${{ github.sha }}
        ENVIRONMENT: staging
    
    - name: Wait for deployment
      run: |
        kubectl rollout status deployment/api-gateway -n barberia-staging
        kubectl rollout status deployment/auth-service -n barberia-staging
    
    - name: Run smoke tests
      run: |
        STAGING_URL=$(kubectl get service api-gateway-service -n barberia-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
        curl -f https://${STAGING_URL}/health
        curl -f https://${STAGING_URL}/api/v1/auth/health

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Update kubeconfig
      run: aws eks update-kubeconfig --name barberia-production --region us-west-2
    
    - name: Deploy to production
      run: |
        envsubst < k8s/kustomization.yaml.template > k8s/kustomization.yaml
        kubectl apply -k k8s/
      env:
        IMAGE_TAG: ${{ github.sha }}
        ENVIRONMENT: production
    
    - name: Wait for deployment
      run: |
        kubectl rollout status deployment/api-gateway -n barberia-production
        kubectl rollout status deployment/auth-service -n barberia-production
    
    - name: Run health checks
      run: |
        PROD_URL=$(kubectl get service api-gateway-service -n barberia-production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
        curl -f https://${PROD_URL}/health
        curl -f https://${PROD_URL}/api/v1/auth/health
    
    - name: Notify deployment success
      uses: 8398a7/action-slack@v3
      with:
        status: success
        text: '✅ Production deployment successful!'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### GitLab CI/CD Pipeline (Alternativa)

#### `.gitlab-ci.yml`
```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_REGISTRY: $CI_REGISTRY
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA

# Test stage
test:auth-service:
  stage: test
  image: node:18-alpine
  script:
    - cd services/auth-service
    - npm ci
    - npm run lint
    - npm run typecheck
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: services/auth-service/coverage/cobertura-coverage.xml

# Build stage
build:docker:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_REGISTRY/api-gateway:$IMAGE_TAG ./services/api-gateway
    - docker build -t $DOCKER_REGISTRY/auth-service:$IMAGE_TAG ./services/auth-service
    - docker build -t $DOCKER_REGISTRY/booking-service:$IMAGE_TAG ./services/booking-service
    - docker push $DOCKER_REGISTRY/api-gateway:$IMAGE_TAG
    - docker push $DOCKER_REGISTRY/auth-service:$IMAGE_TAG
    - docker push $DOCKER_REGISTRY/booking-service:$IMAGE_TAG
  only:
    - main
    - develop

# Deploy stages
deploy:staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/api-gateway api-gateway=$DOCKER_REGISTRY/api-gateway:$IMAGE_TAG
    - kubectl set image deployment/auth-service auth-service=$DOCKER_REGISTRY/auth-service:$IMAGE_TAG
    - kubectl rollout status deployment/api-gateway
    - kubectl rollout status deployment/auth-service
  environment:
    name: staging
    url: https://staging.barberia.com
  only:
    - develop

deploy:production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context production
    - kubectl set image deployment/api-gateway api-gateway=$DOCKER_REGISTRY/api-gateway:$IMAGE_TAG
    - kubectl set image deployment/auth-service auth-service=$DOCKER_REGISTRY/auth-service:$IMAGE_TAG
    - kubectl rollout status deployment/api-gateway
    - kubectl rollout status deployment/auth-service
  environment:
    name: production
    url: https://barberia.com
  when: manual
  only:
    - main
```

## 📊 Monitoreo y Alertas

### Stack de Monitoreo

#### Prometheus Configuration
```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3001']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'booking-service'
    static_configs:
      - targets: ['booking-service:3002']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 15s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 15s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s
```

#### Alert Rules
```yaml
# prometheus/alert_rules.yml
groups:
- name: barberia-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Service {{ $labels.service }} has error rate of {{ $value }}"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }}s"

  - alert: DatabaseConnectionsHigh
    expr: pg_stat_activity_count > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High database connections"
      description: "Database has {{ $value }} active connections"

  - alert: RedisMemoryHigh
    expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Redis memory usage high"
      description: "Redis memory usage is {{ $value | humanizePercentage }}"

  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service is down"
      description: "Service {{ $labels.job }} is down"
```

### Grafana Dashboards

#### Dashboard de Servicios
```json
{
  "dashboard": {
    "title": "BarberIA Service Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{ service }} - {{ method }}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "{{ service }}"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "nodejs_active_handles_total",
            "legendFormat": "{{ service }}"
          }
        ]
      }
    ]
  }
}
```

### Configuración de Alertmanager
```yaml
# alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@barberia.com'
  smtp_auth_username: 'alerts@barberia.com'
  smtp_auth_password: 'your_smtp_password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      severity: warning
    receiver: 'warning-alerts'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://localhost:5001/webhook'

- name: 'critical-alerts'
  email_configs:
  - to: 'oncall@barberia.com'
    subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}

- name: 'warning-alerts'
  email_configs:
  - to: 'devops@barberia.com'
    subject: 'WARNING: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}

- name: 'slack-alerts'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts'
    title: 'BarberIA Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## 💾 Backup y Recuperación

### Estrategia de Backup

#### Backup de Base de Datos
```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

DB_NAME=${1:-barberia_prod}
BACKUP_DIR=${2:-/backup/postgres}
RETENTION_DAYS=${3:-30}
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Create backup
echo "Creating backup of ${DB_NAME}..."
pg_dump -h localhost -U barberia -d ${DB_NAME} -f ${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz --compress=9

# Verify backup
if [ -f "${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz" ]; then
    echo "Backup created successfully: ${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"
    
    # Clean old backups
    find ${BACKUP_DIR} -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    echo "Old backups cleaned (retention: ${RETENTION_DAYS} days)"
else
    echo "Backup failed!"
    exit 1
fi
```

#### Backup de Redis
```bash
#!/bin/bash
# scripts/backup-redis.sh

set -e

BACKUP_DIR=${1:-/backup/redis}
RETENTION_DAYS=${2:-7}
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Create Redis backup
echo "Creating Redis backup..."
redis-cli BGSAVE

# Wait for background save to complete
while [ $(redis-cli LASTSAVE) -eq 0 ]; do
    sleep 1
done

# Copy dump file
cp /var/lib/redis/dump.rdb ${BACKUP_DIR}/redis_${DATE}.rdb

# Compress backup
gzip ${BACKUP_DIR}/redis_${DATE}.rdb

# Verify backup
if [ -f "${BACKUP_DIR}/redis_${DATE}.rdb.gz" ]; then
    echo "Redis backup created successfully: ${BACKUP_DIR}/redis_${DATE}.rdb.gz"
    
    # Clean old backups
    find ${BACKUP_DIR} -name "redis_*.rdb.gz" -mtime +${RETENTION_DAYS} -delete
    echo "Old Redis backups cleaned (retention: ${RETENTION_DAYS} days)"
else
    echo "Redis backup failed!"
    exit 1
fi
```

### Automatización de Backups

#### Cron Jobs
```bash
# /etc/cron.d/barberia-backups
# Backup database daily at 2 AM
0 2 * * * barberia /opt/barberia/scripts/backup-database.sh barberia_prod /backup/postgres 30 >> /var/log/barberia/backup-db.log 2>&1

# Backup Redis daily at 3 AM
0 3 * * * barberia /opt/barberia/scripts/backup-redis.sh /backup/redis 7 >> /var/log/barberia/backup-redis.log 2>&1

# Full system backup weekly on Sunday at 1 AM
0 1 * * 0 barberia /opt/barberia/scripts/backup-system.sh >> /var/log/barberia/backup-system.log 2>&1
```

### Recuperación de Desastres

#### Script de Recuperación
```bash
#!/bin/bash
# scripts/restore-database.sh

set -e

BACKUP_FILE=${1}
DB_NAME=${2:-barberia_prod}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file> [database_name]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring database ${DB_NAME} from ${BACKUP_FILE}..."

# Create database if it doesn't exist
psql -h localhost -U barberia -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || true

# Restore from backup
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql -h localhost -U barberia -d ${DB_NAME}
else
    psql -h localhost -U barberia -d ${DB_NAME} < $BACKUP_FILE
fi

echo "Database restoration completed!"
```

## 🔒 Seguridad

### Certificados SSL/TLS

#### Generación de Certificados
```bash
#!/bin/bash
# scripts/generate-ssl-certs.sh

set -e

DOMAIN=${1:-barberia.com}
CERT_DIR=${2:-./ssl}

mkdir -p ${CERT_DIR}

# Generate private key
openssl genrsa -out ${CERT_DIR}/barberia.key 4096

# Generate certificate signing request
openssl req -new -key ${CERT_DIR}/barberia.key -out ${CERT_DIR}/barberia.csr \
    -subj "/C=US/ST=State/L=City/O=BarberIA/CN=${DOMAIN}"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in ${CERT_DIR}/barberia.csr \
    -signkey ${CERT_DIR}/barberia.key -out ${CERT_DIR}/barberia.crt

# Set proper permissions
chmod 600 ${CERT_DIR}/barberia.key
chmod 644 ${CERT_DIR}/barberia.crt

echo "SSL certificates generated in ${CERT_DIR}"
```

### Configuración de Seguridad

#### Security Policies
```yaml
# k8s/security/pod-security-policy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: barberia-restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

#### Network Policies
```yaml
# k8s/security/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: barberia-network-policy
  namespace: barberia
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: barberia
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: barberia
  - to:
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

### Gestión de Secretos

#### HashiCorp Vault Integration
```yaml
# k8s/vault/vault-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: vault-token
  namespace: barberia
type: Opaque
data:
  token: eW91cl92YXVsdF90b2tlbg==  # base64 encoded vault token
```

## ⚡ Rendimiento

### Optimización de Recursos

#### Resource Limits
```yaml
# k8s/resources/resource-limits.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: barberia-limits
  namespace: barberia
spec:
  limits:
  - default:
      memory: "1Gi"
      cpu: "1"
    defaultRequest:
      memory: "256Mi"
      cpu: "250m"
    type: Container
```

#### Horizontal Pod Autoscaler
```yaml
# k8s/resources/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: barberia
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### Performance Testing

#### K6 Load Testing Script
```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test health endpoint
  let healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Test auth endpoint
  let authResponse = http.post(`${BASE_URL}/api/v1/auth/login`, {
    email: 'test@barberia.com',
    password: 'testpassword123'
  });
  
  check(authResponse, {
    'auth status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'auth response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test booking endpoint
  let bookingResponse = http.get(`${BASE_URL}/api/v1/bookings/health`);
  check(bookingResponse, {
    'booking health status is 200': (r) => r.status === 200,
    'booking response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}