import os
from typing import Optional

class Settings:
    """Configuración del AI Recommender Service"""
    
    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgres://barber:barber@localhost:5432/barber")
    
    # Service Configuration
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    SERVICE_NAME: str = "ai-recommender-service"
    SERVICE_VERSION: str = "0.1.0"
    
    # ML Configuration
    ML_MODEL_CACHE_TTL: int = int(os.getenv("ML_MODEL_CACHE_TTL", "3600"))  # 1 hour
    RECOMMENDATION_CACHE_TTL: int = int(os.getenv("RECOMMENDATION_CACHE_TTL", "1800"))  # 30 minutes
    MIN_RATING_COUNT: int = int(os.getenv("MIN_RATING_COUNT", "5"))
    MAX_RECOMMENDATIONS: int = int(os.getenv("MAX_RECOMMENDATIONS", "10"))
    
    # Model Training Configuration
    TRAINING_BATCH_SIZE: int = int(os.getenv("TRAINING_BATCH_SIZE", "1000"))
    SVD_N_COMPONENTS: int = int(os.getenv("SVD_N_COMPONENTS", "50"))
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.3"))
    
    # Geographic Configuration
    DEFAULT_MAX_DISTANCE_KM: int = int(os.getenv("DEFAULT_MAX_DISTANCE_KM", "25"))
    EARTH_RADIUS_KM: float = 6371.0  # Radio de la Tierra en kilómetros
    
    # API Configuration
    API_TITLE: str = "BarberIA AI Recommender API"
    API_VERSION: str = "0.1.0"
    API_DOCS_URL: str = "/docs"
    API_REDOC_URL: str = "/redoc"
    
    # Security Configuration
    CORS_ORIGINS: list = ["*"]  # En producción, especificar dominios específicos
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]
    
    # Performance Configuration
    WORKERS: int = int(os.getenv("WORKERS", "1"))
    TIMEOUT: int = int(os.getenv("TIMEOUT", "30"))
    KEEP_ALIVE: int = int(os.getenv("KEEP_ALIVE", "5"))
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"
    
    def get_redis_config(self) -> dict:
        """Obtener configuración de Redis"""
        config = {
            "url": self.REDIS_URL,
            "db": self.REDIS_DB,
            "decode_responses": True,
            "encoding": "utf-8"
        }
        
        if self.REDIS_PASSWORD:
            config["password"] = self.REDIS_PASSWORD
            
        return config

# Instancia global de configuración
settings = Settings()