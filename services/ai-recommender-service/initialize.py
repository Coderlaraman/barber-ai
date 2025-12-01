#!/usr/bin/env python3
"""
Script de inicialización para el AI Recommender Service
"""

import asyncio
import logging
import sys
from pathlib import Path

# Añadir el directorio src al path
sys.path.append(str(Path(__file__).parent / "src"))

from services.data_service import DataService
from services.ml_models import CollaborativeFilteringModel, ContentBasedModel
from utils.logger import setup_logging
from utils.redis_client import RedisClient

logger = setup_logging()

async def initialize_service():
    """Inicializar el servicio con datos mock"""
    try:
        logger.info("🚀 Iniciando inicialización del AI Recommender Service...")
        
        # Inicializar Redis
        logger.info("📡 Conectando a Redis...")
        redis_client = RedisClient()
        await redis_client.connect()
        logger.info("✅ Redis conectado")
        
        # Inicializar DataService
        logger.info("📊 Inicializando DataService...")
        data_service = DataService()
        
        # Cargar datos mock
        logger.info("📦 Cargando datos mock...")
        barbers = await data_service.get_available_barbers()
        clients = await data_service.get_all_clients()
        ratings = await data_service.get_all_ratings()
        bookings = await data_service.get_all_bookings()
        
        logger.info(f"✅ Datos cargados: {len(barbers)} barberos, {len(clients)} clientes, {len(ratings)} ratings, {len(bookings)} reservas")
        
        # Entrenar modelos
        logger.info("🧠 Entrenando modelos ML...")
        
        # Modelo colaborativo
        collaborative_model = CollaborativeFilteringModel()
        training_data = {
            "ratings": ratings,
            "users": clients,
            "items": barbers
        }
        collaborative_result = collaborative_model.train(training_data)
        logger.info(f"✅ Modelo colaborativo entrenado: {collaborative_result['status']}")
        
        # Modelo basado en contenido
        content_model = ContentBasedModel()
        content_training_data = {
            "user_profiles": clients,
            "item_profiles": barbers
        }
        content_result = content_model.train(content_training_data)
        logger.info(f"✅ Modelo basado en contenido entrenado: {content_result['status']}")
        
        # Guardar modelos en caché
        logger.info("💾 Guardando modelos en caché...")
        await redis_client.set("ml_model:collaborative", collaborative_model, expire=3600)
        await redis_client.set("ml_model:content", content_model, expire=3600)
        
        logger.info("🎉 Inicialización completada exitosamente!")
        
        # Cerrar conexión Redis
        await redis_client.disconnect()
        
    except Exception as e:
        logger.error(f"❌ Error durante la inicialización: {e}")
        raise

async def cleanup_service():
    """Limpiar recursos del servicio"""
    try:
        logger.info("🧹 Limpiando recursos...")
        # Aquí podrías limpiar cachés, cerrar conexiones, etc.
        logger.info("✅ Limpieza completada")
    except Exception as e:
        logger.error(f"❌ Error durante la limpieza: {e}")

async def main():
    """Función principal"""
    try:
        await initialize_service()
    except KeyboardInterrupt:
        logger.info("⚠️  Inicialización interrumpida por el usuario")
    except Exception as e:
        logger.error(f"❌ Error fatal: {e}")
        sys.exit(1)
    finally:
        await cleanup_service()

if __name__ == "__main__":
    asyncio.run(main())