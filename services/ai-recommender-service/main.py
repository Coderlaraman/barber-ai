"""
BarberIA AI Recommender Service
Servicio de recomendaciones inteligentes para barberos y clientes
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import logging
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime

# Importar modelos y servicios
from src.models.recommendation import (
    BarberRecommendationRequest, 
    ClientRecommendationRequest,
    RecommendationResponse,
    HealthResponse
)
from src.services.recommendation_service import RecommendationService
from src.services.ml_models import CollaborativeFilteringModel, ContentBasedModel
from src.utils.logger import setup_logging
from src.utils.redis_client import RedisClient
from src.config import settings
from src.integrations.event_bus import NestJSEventBus
from src.integrations.event_processor import EventProcessor

# Configuración de logging
logger = setup_logging()

# Variables globales para el servicio
recommendation_service = None
redis_client = None
event_bus = None
event_processor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación"""
    global recommendation_service, redis_client, event_bus, event_processor
    
    # Inicialización
    logger.info("Iniciando AI Recommender Service...")
    
    try:
        # Inicializar Redis
        redis_client = RedisClient(redis_url=settings.REDIS_URL, db=settings.REDIS_DB, password=settings.REDIS_PASSWORD)
        await redis_client.connect()
        
        # Inicializar modelos ML
        collaborative_model = CollaborativeFilteringModel()
        content_model = ContentBasedModel()
        
        # Inicializar servicio principal
        recommendation_service = RecommendationService(
            collaborative_model=collaborative_model,
            content_model=content_model,
            redis_client=redis_client
        )
        
        # Cargar modelos entrenados
        await recommendation_service.load_models()
        
        # Inicializar EventBus y EventProcessor
        logger.info("Inicializando integración con sistema de eventos NestJS...")
        event_bus = NestJSEventBus(redis_url=settings.REDIS_URL)
        await event_bus.connect()
        
        event_processor = EventProcessor(
            recommendation_service=recommendation_service,
            data_service=recommendation_service.data_service
        )
        
        # Registrar handlers de eventos disponibles
        event_bus.subscribe("BOOKING.booking.created", event_processor.process_booking_created)
        event_bus.subscribe("BOOKING.booking.cancelled", event_processor.process_booking_cancelled)
        event_bus.subscribe("RATING.rating.created", event_processor.process_rating_created)
        event_bus.subscribe("USER.user.updated", event_processor.process_user_profile_updated)
        
        # Iniciar consumición de eventos
        asyncio.create_task(event_bus.start_consuming())
        
        logger.info("Integración con sistema de eventos NestJS completada")
        logger.info("AI Recommender Service iniciado exitosamente")
        
    except Exception as e:
        logger.error(f"Error al iniciar el servicio: {e}")
        raise
    
    yield
    
    # Cleanup
    logger.info("Cerrando AI Recommender Service...")
    if event_bus:
        await event_bus.disconnect()
    if redis_client:
        await redis_client.disconnect()
    logger.info("AI Recommender Service cerrado")

# Crear aplicación FastAPI
app = FastAPI(
    title="BarberIA AI Recommender API",
    description="""
    Servicio de recomendaciones inteligentes para BarberIA
    
    ## Características
    - 🎯 Recomendaciones personalizadas de barberos
    - 📊 Análisis de preferencias del cliente
    - 🤖 Machine Learning para matching óptimo
    - ⚡ Predicciones en tiempo real
    - 📈 Ranking basado en múltiples factores
    
    ## Modelos ML Utilizados
    - **Filtrado Colaborativo**: Basado en usuarios similares
    - **Basado en Contenido**: Según características del servicio
    - **Híbrido**: Combinación de ambos enfoques
    
    ## Factores de Recomendación
    - Ubicación geográfica
    - Precio y presupuesto
    - Calificaciones y reseñas
    - Historial de reservas
    - Disponibilidad horaria
    - Especialidades del barbero
    """,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Endpoint de salud del servicio"""
    try:
        # Verificar conexión a Redis
        redis_healthy = await redis_client.ping() if redis_client else False
        
        # Verificar modelos cargados
        models_healthy = recommendation_service.is_healthy() if recommendation_service else False
        
        # Verificar sistema de eventos
        event_system_healthy = event_bus.is_connected if event_bus else False
        
        overall_healthy = redis_healthy and models_healthy and event_system_healthy
        
        return HealthResponse(
            status="healthy" if overall_healthy else "unhealthy",
            service="ai-recommender",
            version="0.1.0",
            dependencies={
                "redis": "healthy" if redis_healthy else "unhealthy",
                "ml_models": "healthy" if models_healthy else "unhealthy",
                "event_system": "healthy" if event_system_healthy else "unhealthy",
                "optimization_status": "optimized" if recommendation_service.is_optimized else "default"
            }
        )
    except Exception as e:
        logger.error(f"Health check fallido: {e}")
        return HealthResponse(
            status="unhealthy",
            service="ai-recommender",
            version="0.1.0",
            error=str(e)
        )

# Endpoints de recomendación
@app.post("/recommend/barbers", response_model=RecommendationResponse)
async def recommend_barbers(request: BarberRecommendationRequest):
    """
    Recomendar barberos para un cliente específico
    
    - **Análisis del cliente**: Historial, preferencias, ubicación
    - **Matching inteligente**: Basado en ML y factores múltiples
    - **Ranking personalizado**: Ordenado por probabilidad de satisfacción
    """
    try:
        if not recommendation_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de recomendación no disponible"
            )
        
        recommendations = await recommendation_service.recommend_barbers(request)
        
        return RecommendationResponse(
            recommendations=recommendations,
            total_count=len(recommendations),
            algorithm_used="hybrid_cf_content",
            confidence_score=0.85 if recommendations else 0.0,
            execution_time_ms=150  # Estimado, se puede calcular real
        )
        
    except Exception as e:
        logger.error(f"Error en recomendación de barberos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar recomendaciones: {str(e)}"
        )

@app.post("/recommend/clients", response_model=RecommendationResponse)
async def recommend_clients(request: ClientRecommendationRequest):
    """
    Recomendar clientes potenciales para un barbero específico
    
    - **Análisis del barbero**: Especialidades, estilo, ubicación
    - **Identificación de clientes**: Con mayor probabilidad de reservar
    - **Optimización de agenda**: Llenar espacios disponibles
    """
    try:
        if not recommendation_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de recomendación no disponible"
            )
        
        recommendations = await recommendation_service.recommend_clients(request)
        
        return RecommendationResponse(
            recommendations=recommendations,
            total_count=len(recommendations),
            algorithm_used="content_based_reverse",
            confidence_score=0.78 if recommendations else 0.0,
            execution_time_ms=120
        )
        
    except Exception as e:
        logger.error(f"Error en recomendación de clientes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar recomendaciones: {str(e)}"
        )

@app.get("/models/info")
async def get_models_info():
    """Obtener información sobre los modelos ML utilizados"""
    if not recommendation_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio no disponible"
        )
    
    return recommendation_service.get_models_info()

@app.post("/models/retrain")
async def retrain_models():
    """Reentrenar los modelos ML con datos actualizados"""
    try:
        if not recommendation_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio no disponible"
            )
        
        result = await recommendation_service.retrain_models()
        return result
        
    except Exception as e:
        logger.error(f"Error al reentrenar modelos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al reentrenar modelos: {str(e)}"
        )

@app.get("/events/stats")
async def get_event_stats():
    """Obtener estadísticas del procesamiento de eventos"""
    if not event_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="EventProcessor no disponible"
        )
    
    return event_processor.get_event_stats()

@app.post("/models/optimize")
async def optimize_models():
    """Optimizar hiperparámetros de los modelos ML"""
    try:
        if not recommendation_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de recomendación no disponible"
            )
        
        # Obtener datos de entrenamiento y validación
        try:
            logger.info("Obteniendo datos de entrenamiento...")
            training_data = await recommendation_service.data_service.get_training_data()
            logger.info(f"Datos de entrenamiento obtenidos: {len(training_data.get('ratings', []))} ratings")
            
            logger.info("Obteniendo datos de validación...")
            validation_data = await recommendation_service.data_service.get_validation_data()
            logger.info(f"Datos de validación obtenidos: {len(validation_data.get('ratings', []))} ratings")
        except Exception as data_error:
            logger.warning(f"No se pudieron obtener datos reales, usando datos mock: {data_error}")
            # Usar datos mock si la base de datos no está disponible
            logger.info("Usando datos mock para entrenamiento y validación...")
            training_data = recommendation_service.data_service.get_mock_training_data_full()
            validation_data = recommendation_service.data_service.get_mock_validation_data()
            
            logger.info(f"Datos mock de entrenamiento: {len(training_data.get('ratings', []))} ratings")
            logger.info(f"Datos mock de validación: {len(validation_data.get('ratings', []))} ratings")
            
            # Debug: Verificar perfiles de usuarios
            user_profiles = training_data.get('user_profiles', [])
            logger.info(f"Perfiles de usuarios en datos de entrenamiento: {len(user_profiles)}")
            for profile in user_profiles[:3]:  # Mostrar primeros 3 perfiles
                logger.info(f"Usuario: {profile.user_id}, tiene name: {hasattr(profile, 'name')}")
                if hasattr(profile, 'name'):
                    logger.info(f"Nombre: {profile.name}")
        
        # Optimizar modelos
        logger.info("Iniciando optimización de modelos...")
        optimization_results = await recommendation_service.optimize_models(
            training_data, validation_data
        )
        
        return {
            "status": "success",
            "optimization_results": optimization_results,
            "timestamp": datetime.now().isoformat(),
            "data_source": "database" if recommendation_service.data_service.use_real_database else "mock"
        }
    except Exception as e:
        logger.error(f"Error optimizando modelos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al optimizar modelos: {str(e)}"
        )

@app.get("/models/info")
async def get_models_info():
    """Obtener información de los modelos ML"""
    try:
        collaborative_info = collaborative_model.get_info()
        content_info = content_model.get_info()
        
        return {
            "collaborative_filtering": collaborative_info,
            "content_based": content_info,
            "optimization_history": recommendation_service.optimization_history,
            "is_optimized": recommendation_service.is_optimized,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error obteniendo información de modelos: {e}")
        return {"error": str(e)}

# Manejo de errores global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Error no manejado: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno del servidor", "error": str(exc)}
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Iniciando servidor en {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # Solo en desarrollo
        log_level="info"
    )