"""
Modelos de datos para el servicio de recomendaciones
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class AlgorithmType(str, Enum):
    """Tipos de algoritmos de recomendación"""
    COLLABORATIVE_FILTERING = "collaborative_filtering"
    CONTENT_BASED = "content_based"
    HYBRID = "hybrid"
    POPULARITY_BASED = "popularity_based"

class ServiceType(str, Enum):
    """Tipos de servicios de barbería"""
    HAIRCUT = "haircut"
    BEARD_TRIM = "beard_trim"
    SHAVE = "shave"
    HAIR_TREATMENT = "hair_treatment"
    BEARD_TREATMENT = "beard_treatment"
    COLORING = "coloring"
    STYLE = "style"

class RecommendationType(str, Enum):
    """Tipos de recomendaciones"""
    BARBER_TO_CLIENT = "barber_to_client"
    CLIENT_TO_BARBER = "client_to_barber"
    SERVICE_RECOMMENDATION = "service_recommendation"
    TIME_SLOT_RECOMMENDATION = "time_slot_recommendation"

# Request Models
class BarberRecommendationRequest(BaseModel):
    """Request para recomendar barberos a un cliente"""
    client_id: str = Field(..., description="ID del cliente")
    location: Optional[Dict[str, float]] = Field(None, description="Ubicación del cliente {lat, lng}")
    max_distance_km: Optional[float] = Field(10.0, description="Distancia máxima en km")
    budget_range: Optional[Dict[str, float]] = Field(None, description="Rango de presupuesto {min, max}")
    service_types: Optional[List[ServiceType]] = Field(None, description="Tipos de servicios deseados")
    preferred_date: Optional[datetime] = Field(None, description="Fecha preferida para el servicio")
    time_preference: Optional[str] = Field(None, description="Preferencia horaria (morning, afternoon, evening)")
    limit: int = Field(10, description="Número máximo de recomendaciones", ge=1, le=50)
    
    class Config:
        json_schema_extra = {
            "example": {
                "client_id": "client_123",
                "location": {"lat": 40.7128, "lng": -74.0060},
                "max_distance_km": 15.0,
                "budget_range": {"min": 20, "max": 80},
                "service_types": ["haircut", "beard_trim"],
                "preferred_date": "2024-12-15T10:00:00",
                "time_preference": "morning",
                "limit": 5
            }
        }

class ClientRecommendationRequest(BaseModel):
    """Request para recomendar clientes a un barbero"""
    barber_id: str = Field(..., description="ID del barbero")
    date_range: Optional[Dict[str, datetime]] = Field(None, description="Rango de fechas {start, end}")
    service_types: Optional[List[ServiceType]] = Field(None, description="Servicios que ofrece el barbero")
    location: Optional[Dict[str, float]] = Field(None, description="Ubicación del barbero {lat, lng}")
    max_distance_km: Optional[float] = Field(15.0, description="Distancia máxima para servicio a domicilio")
    price_range: Optional[Dict[str, float]] = Field(None, description="Rango de precios del barbero")
    specialization: Optional[List[str]] = Field(None, description="Especialidades del barbero")
    limit: int = Field(20, description="Número máximo de recomendaciones", ge=1, le=100)
    
    class Config:
        json_schema_extra = {
            "example": {
                "barber_id": "barber_456",
                "date_range": {
                    "start": "2024-12-15T00:00:00",
                    "end": "2024-12-22T23:59:59"
                },
                "service_types": ["haircut", "shave"],
                "location": {"lat": 40.7128, "lng": -74.0060},
                "max_distance_km": 20.0,
                "price_range": {"min": 25, "max": 100},
                "specialization": ["classic_cuts", "beard_specialist"],
                "limit": 10
            }
        }

# Response Models
class RecommendationItem(BaseModel):
    """Item individual de recomendación"""
    id: str = Field(..., description="ID del item recomendado (barbero o cliente)")
    name: str = Field(..., description="Nombre del item")
    score: float = Field(..., description="Puntuación de recomendación (0-1)", ge=0.0, le=1.0)
    confidence: float = Field(..., description="Confianza en la recomendación (0-1)", ge=0.0, le=1.0)
    reasons: List[str] = Field(..., description="Razones de la recomendación")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Metadatos adicionales")
    distance_km: Optional[float] = Field(None, description="Distancia en km")
    estimated_price: Optional[float] = Field(None, description="Precio estimado")
    availability: Optional[List[datetime]] = Field(None, description="Disponibilidad")
    rating: Optional[float] = Field(None, description="Calificación promedio", ge=0.0, le=5.0)
    review_count: Optional[int] = Field(None, description="Número de reseñas")
    specialties: Optional[List[str]] = Field(None, description="Especialidades")
    profile_image: Optional[str] = Field(None, description="URL de imagen de perfil")

class RecommendationResponse(BaseModel):
    """Response de recomendaciones"""
    recommendations: List[RecommendationItem] = Field(..., description="Lista de recomendaciones")
    total_count: int = Field(..., description="Número total de recomendaciones")
    algorithm_used: str = Field(..., description="Algoritmo utilizado")
    confidence_score: float = Field(..., description="Puntuación de confianza general", ge=0.0, le=1.0)
    execution_time_ms: int = Field(..., description="Tiempo de ejecución en milisegundos")
    cached: Optional[bool] = Field(False, description="Si el resultado fue obtenido de caché")
    cache_key: Optional[str] = Field(None, description="Clave de caché utilizada")
    
    class Config:
        json_schema_extra = {
            "example": {
                "recommendations": [
                    {
                        "id": "barber_789",
                        "name": "Carlos Rodriguez",
                        "score": 0.92,
                        "confidence": 0.88,
                        "reasons": [
                            "Excelente coincidencia con tus preferencias anteriores",
                            "Muy bien calificado por clientes similares",
                            "Disponible en tu horario preferido"
                        ],
                        "distance_km": 2.5,
                        "estimated_price": 35.0,
                        "rating": 4.8,
                        "review_count": 127,
                        "specialties": ["classic_cuts", "beard_specialist"],
                        "availability": ["2024-12-15T10:00:00", "2024-12-15T14:00:00"]
                    }
                ],
                "total_count": 5,
                "algorithm_used": "hybrid_cf_content",
                "confidence_score": 0.85,
                "execution_time_ms": 150,
                "cached": False
            }
        }

# Health Check Models
class HealthResponse(BaseModel):
    """Response de health check"""
    status: str = Field(..., description="Estado del servicio")
    service: str = Field(..., description="Nombre del servicio")
    version: str = Field(..., description="Versión del servicio")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="Timestamp")
    dependencies: Optional[Dict[str, str]] = Field(None, description="Estado de dependencias")
    error: Optional[str] = Field(None, description="Mensaje de error si aplica")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "service": "ai-recommender",
                "version": "0.1.0",
                "timestamp": "2024-12-01T12:00:00",
                "dependencies": {
                    "redis": "healthy",
                    "ml_models": "healthy"
                }
            }
        }

# Modelos para ML
class UserProfile(BaseModel):
    """Perfil de usuario para recomendaciones"""
    user_id: str
    name: Optional[str] = None
    preferences: Dict[str, float] = Field(default_factory=dict)
    service_history: List[str] = Field(default_factory=list)
    rating_history: Dict[str, float] = Field(default_factory=dict)
    price_sensitivity: float = Field(0.5, ge=0.0, le=1.0)
    location_preference: Optional[Dict[str, float]] = None
    time_preferences: List[str] = Field(default_factory=list)
    style_preferences: List[str] = Field(default_factory=list)

class BarberProfile(BaseModel):
    """Perfil de barbero para recomendaciones"""
    barber_id: str
    name: Optional[str] = None
    specialties: List[str] = Field(default_factory=list)
    services_offered: List[ServiceType] = Field(default_factory=list)
    price_range: Dict[str, float] = Field(default_factory=dict)
    location: Dict[str, float]
    rating: float = Field(0.0, ge=0.0, le=5.0)
    review_count: int = Field(0, ge=0)
    experience_years: Optional[int] = None
    style_tags: List[str] = Field(default_factory=list)
    availability_schedule: Dict[str, List[str]] = Field(default_factory=dict)
    client_types: List[str] = Field(default_factory=list)

class TrainingData(BaseModel):
    """Datos de entrenamiento para modelos ML"""
    user_interactions: List[Dict[str, Any]] = Field(default_factory=list)
    ratings: List[Dict[str, Any]] = Field(default_factory=list)
    bookings: List[Dict[str, Any]] = Field(default_factory=list)
    user_profiles: List[UserProfile] = Field(default_factory=list)
    barber_profiles: List[BarberProfile] = Field(default_factory=list)