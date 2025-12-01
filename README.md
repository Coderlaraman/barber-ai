# BarberAI - Sistema Inteligente de Gestión de Barberías

Una plataforma completa de gestión de barberías que integra inteligencia artificial para recomendaciones personalizadas, gestión de citas, pagos y servicios premium.

## 🚀 Características Principales

- **Recomendaciones con IA**: Sistema híbrido de recomendación que combina filtrado colaborativo y basado en contenido
- **Gestión de Citas**: Sistema completo de reservas con disponibilidad en tiempo real
- **Pagos Seguros**: Integración con múltiples pasarelas de pago
- **Servicios Premium**: Catálogo configurable de servicios adicionales
- **Búsqueda Inteligente**: Filtros avanzados por ubicación, precio, calificación y especialidades
- **Sistema de Reseñas**: Rating y comentarios con moderación anti-spam
- **Notificaciones Multicanal**: Push, email y SMS con preferencias personalizadas
- **Portafolio Digital**: Gestión de imágenes y servicios de barberos

## 🏗️ Arquitectura

BarberAI utiliza una arquitectura de microservicios basada en:

- **API Gateway**: Punto de entrada único para todos los servicios
- **Servicios NestJS**: 8 microservicios principales
- **AI Recommender Service**: Servicio FastAPI para recomendaciones inteligentes
- **Base de Datos**: PostgreSQL para datos persistentes
- **Caché**: Redis para rendimiento y sesiones
- **Mensajería**: Redis Pub/Sub para comunicación entre servicios

### Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cliente Web   │    │  App Móvil      │    │  Panel Admin    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      API Gateway        │
                    │    (Port 3000)          │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  Auth Service     │  │  User Service   │  │ Barber Service  │
│   (Port 3001)     │  │  (Port 3002)    │  │  (Port 3003)    │
└─────────┬─────────┘  └────────┬────────┘  └────────┬────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│ Booking Service   │  │Search Service   │  │Scheduler Service│
│   (Port 3004)     │  │  (Port 3005)    │  │  (Port 3006)    │
└─────────┬─────────┘  └────────┬────────┘  └────────┬────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│Ranking Service    │  │Portfolio Service│  │Notifications   │
│  (Port 3007)      │  │  (Port 3008)    │  │Service (3009) │
└─────────┬─────────┘  └────────┬────────┘  └────────┬────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  AI Recommender Service │
                    │     (Port 8001)         │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│   PostgreSQL      │  │     Redis       │  │  Event Bus      │
│   (Port 5432)     │  │   (Port 6379)   │  │  (Redis Pub/Sub)│
└───────────────────┘  └─────────────────┘  └─────────────────┘
```

## 📋 Servicios del Sistema

### Servicios NestJS

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API Gateway | 3000 | Punto de entrada único, routing y autenticación |
| Auth Service | 3001 | Gestión de autenticación y autorización |
| User Service | 3002 | Gestión de perfiles de clientes |
| Barber Service | 3003 | Gestión de perfiles de barberos |
| Booking Service | 3004 | Sistema de reservas y citas |
| Search Service | 3005 | Motor de búsqueda y filtros |
| Scheduler Service | 3006 | Gestión de disponibilidad y horarios |
| Ranking Service | 3007 | Sistema de calificaciones y rankings |
| Portfolio Service | 3008 | Gestión de portafolios y servicios |
| Notifications Service | 3009 | Sistema de notificaciones multicanal |

### Servicios Externos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| AI Recommender | 8001 | Servicio de recomendaciones con ML |
| PostgreSQL | 5432 | Base de datos principal |
| Redis | 6379 | Caché y mensajería |

## 🚀 Instalación y Despliegue

### Requisitos Previos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Python 3.9+ (para AI Recommender Service)

### Despliegue con Docker Compose

```bash
# Clonar el repositoriogit clone <repository-url>
cd barber_ai

# Configurar variables de entorno
cp env.example .env

# Iniciar todos los servicios
docker-compose up -d

# Verificar estado
docker-compose ps
```

### Desarrollo Local

```bash
# Instalar dependencias del proyecto
npm install

# Iniciar servicios individualmente
npm run start:dev <service-name>

# Ejecutar tests
npm run test
npm run test:e2e
```

## 📊 Monitoreo y Métricas

- **Health Checks**: Todos los servicios exponen endpoints `/health`
- **Métricas**: Integración con sistemas de monitoreo
- **Logs**: Centralización de logs con estructura JSON
- **Performance**: Métricas de latencia y throughput

## 🔧 Configuración

### Variables de Entorno

Las variables de entorno se configuran en el archivo `.env`:

```bash
# Base de Datos
DATABASE_URL=postgresql://user:password@localhost:5432/barberai

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Servicios
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
# ... otras URLs de servicios
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests de integración
npm run test:e2e

# Tests de cobertura
npm run test:cov
```

## 📚 Documentación de Servicios

Para documentación detallada de cada servicio, consulte:

- [AI Recommender Service](./docs/services/ai-recommender-service.md)
- [API Gateway](./docs/services/api-gateway.md)
- [Auth Service](./docs/services/auth-service.md)
- [User Service](./docs/services/user-service.md)
- [Barber Service](./docs/services/barber-service.md)
- [Booking Service](./docs/services/booking-service.md)
- [Search Service](./docs/services/search-service.md)
- [Scheduler Service](./docs/services/scheduler-service.md)
- [Ranking Service](./docs/services/ranking-service.md)
- [Portfolio Service](./docs/services/portfolio-service.md)
- [Notifications Service](./docs/services/notifications-service.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Equipo de Desarrollo**: BarberAI Team
- **Arquitectura**: Microservicios con NestJS y FastAPI
- **Machine Learning**: Sistema híbrido de recomendación

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contactar al equipo de desarrollo.

---

**Nota**: Este proyecto está en desarrollo activo. Para reportar bugs o solicitar features, usar el sistema de issues del repositorio.