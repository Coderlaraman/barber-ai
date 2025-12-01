"""
Utilidades de logging para el servicio de recomendaciones
"""

import logging
import structlog
import sys
from typing import Dict, Any

def setup_logging() -> logging.Logger:
    """
    Configurar logging estructurado para el servicio
    """
    
    # Configurar structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configurar logging estándar
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    # Crear logger para el servicio
    logger = structlog.get_logger("ai-recommender")
    
    return logger

def log_recommendation_request(
    user_id: str, 
    recommendation_type: str, 
    context: Dict[str, Any]
) -> None:
    """
    Loguear solicitud de recomendación
    """
    logger = structlog.get_logger("ai-recommender")
    logger.info(
        "recommendation_request",
        user_id=user_id,
        recommendation_type=recommendation_type,
        context=context
    )

def log_recommendation_result(
    user_id: str,
    recommendation_type: str,
    n_recommendations: int,
    algorithm_used: str,
    confidence_score: float,
    execution_time_ms: int
) -> None:
    """
    Loguear resultado de recomendación
    """
    logger = structlog.get_logger("ai-recommender")
    logger.info(
        "recommendation_result",
        user_id=user_id,
        recommendation_type=recommendation_type,
        n_recommendations=n_recommendations,
        algorithm_used=algorithm_used,
        confidence_score=confidence_score,
        execution_time_ms=execution_time_ms
    )

def log_model_training(
    model_type: str,
    n_samples: int,
    training_time_ms: int,
    accuracy: float = None
) -> None:
    """
    Loguear entrenamiento de modelo
    """
    logger = structlog.get_logger("ai-recommender")
    logger.info(
        "model_training",
        model_type=model_type,
        n_samples=n_samples,
        training_time_ms=training_time_ms,
        accuracy=accuracy
    )