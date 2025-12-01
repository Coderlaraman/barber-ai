# AI-Recommender-Service

Servicio de recomendaciones inteligentes para BarberIA utilizando machine learning.

## Características

- 🤖 **Machine Learning**: Sistema híbrido de recomendaciones (filtrado colaborativo + basado en contenido)
- ⚡ **FastAPI**: API REST de alto rendimiento con documentación automática
- 📊 **Análisis predictivo**: Predicciones de ratings y matching óptimo
- 🎯 **Recomendaciones personalizadas**: Basadas en preferencias, ubicación y historial
- 💾 **Caching con Redis**: Optimización de rendimiento
- 📍 **Geolocalización**: Cálculo de distancias y barberos cercanos

## Tecnologías

- **Framework**: FastAPI
- **ML/AI**: scikit-learn, pandas, numpy
- **Cache**: Redis
- **Lenguaje**: Python 3.11
- **Documentación**: Swagger/OpenAPI

## Instalación

### Opción 1: Docker (Recomendado)

```bash
# Construir y ejecutar con Docker Compose
docker-compose up --build

# O usar el docker-compose principal del proyecto
cd /home/coderman/projects/barber_ai
docker-compose up ai-recommender-service
```

### Opción 2: Local

```bash
# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Inicializar el servicio (opcional - carga datos mock)
python3 initialize.py

# Ejecutar servicio
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Opción 3: Usando el proyecto principal

El servicio está integrado en el docker-compose.yml principal del proyecto:

```bash
cd /home/coderman/projects/barber_ai
docker-compose up  # Levanta todos los servicios incluyendo AI Recommender
```

## Endpoints

### Health Check
- `GET /health` - Verificar estado del servicio

### Recomendaciones
- `POST /recommend/barbers` - Obtener recomendaciones de barberos para un cliente
- `POST /recommend/clients` - Obtener recomendaciones de clientes para un barbero

### Modelos ML
- `POST /models/train` - Reentrenar modelos con nuevos datos
- `GET /models/status` - Estado de los modelos ML

## Ejemplos de uso

### Recomendar barberos para un cliente

```bash
curl -X POST "http://localhost:8000/recommend/barbers" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client_001",
    "location": {"lat": 40.7128, "lng": -74.0060},
    "max_distance_km": 10,
    "service_types": ["HAIRCUT", "BEARD_TRIM"],
    "preferred_date": "2024-12-15",
    "time_preference": "morning",
    "limit": 5
  }'
```

### Reentrenar modelos

```bash
curl -X POST "http://localhost:8000/models/train" \
  -H "Content-Type: application/json" \
  -d '{
    "triggered_by": "manual",
    "reason": "New data available"
  }'
```

## Arquitectura

```
ai-recommender-service/
├── main.py                    # FastAPI app y endpoints
├── requirements.txt           # Dependencias
├── Dockerfile                 # Configuración Docker
├── docker-compose.yml         # Orquestación local
├── src/
│   ├── models/               # Modelos de datos
│   │   └── recommendation.py # Pydantic models
│   ├── services/             # Lógica de negocio
│   │   ├── recommendation_service.py  # Servicio principal
│   │   ├── ml_models.py     # Modelos ML
│   │   └── data_service.py  # Gestión de datos
│   └── utils/               # Utilidades
│       ├── logger.py        # Logging estructurado
│       ├── redis_client.py  # Cliente Redis
│       └── distance_calculator.py  # Cálculos geográficos
```

## Modelos ML

### Filtrado Colaborativo
- **Algoritmo**: SVD (Singular Value Decomposition)
- **Propósito**: Identificar patrones en ratings de usuarios
- **Datos**: Historial de ratings cliente-barbero

### Basado en Contenido
- **Algoritmo**: Similitud coseno
- **Propósito**: Comparar características de servicios
- **Datos**: Perfiles de clientes y barberos

### Scoring Híbrido
```python
final_score = (
    weight_collaborative * collaborative_score +
    weight_content * content_score +
    weight_popularity * popularity_score +
    weight_availability * availability_score
)
```

## Variables de Entorno

- `REDIS_URL`: URL de conexión a Redis (default: redis://localhost:6379)
- `ENVIRONMENT`: Entorno de ejecución (development/production)
- `LOG_LEVEL`: Nivel de logging (DEBUG/INFO/WARNING/ERROR)

## Testing

### Pruebas básicas

```bash
# Verificar sintaxis
python3 -m py_compile main.py

# Probar endpoints (cuando el servicio esté ejecutándose)
curl http://localhost:8000/health
```

### Script de pruebas completo

```bash
# Ejecutar el script de pruebas
python3 test_service.py

# Esto probará:
# - Health check
# - Recomendaciones de barberos
# - Recomendaciones de clientes
# - Estado de modelos ML
# - Reentrenamiento de modelos
```

### Pruebas manuales con curl

```bash
# Health check
curl http://localhost:8000/health

# Recomendar barberos
curl -X POST "http://localhost:8000/recommend/barbers" \
  -H "Content-Type: application/json" \
  -d '{"client_id": "client_001", "location": {"lat": 40.7128, "lng": -74.0060}, "max_distance_km": 10, "service_types": ["HAIRCUT", "BEARD_TRIM"], "preferred_date": "2024-12-15", "time_preference": "morning", "limit": 5}'

# Estado de modelos
curl http://localhost:8000/models/status
```

## Documentación API

Una vez ejecutando el servicio, visita:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc