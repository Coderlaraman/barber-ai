"""
Servicio de procesamiento de eventos para actualizar modelos ML
"""

import logging
from typing import Dict, Any
from datetime import datetime
from .event_bus import Event, handle_booking_created, handle_booking_cancelled, handle_rating_created, handle_user_profile_updated
from ..services.recommendation_service import RecommendationService
from ..services.data_service import DataService

logger = logging.getLogger(__name__)

class EventProcessor:
    """
    Procesa eventos del sistema y actualiza modelos ML
    """
    
    def __init__(self, recommendation_service: RecommendationService, data_service: DataService):
        self.recommendation_service = recommendation_service
        self.data_service = data_service
        self.event_stats = {
            "processed": 0,
            "errors": 0,
            "by_type": {}
        }
    
    async def process_booking_created(self, event: Event):
        """Procesar creación de booking"""
        try:
            payload = event.payload
            logger.info(f"Procesando booking creado: {payload.get('appointmentId')}")
            
            # Extraer datos relevantes
            booking_data = {
                "appointment_id": payload.get("appointmentId"),
                "barber_id": payload.get("barberId"),
                "client_id": payload.get("clientId"),
                "service_id": payload.get("serviceId"),
                "start_time": payload.get("startTime"),
                "end_time": payload.get("endTime"),
                "date": payload.get("date"),
                "price": payload.get("price"),
                "notes": payload.get("notes", ""),
                "created_at": event.timestamp
            }
            
            # Actualizar datos en el servicio
            await self.data_service.add_booking(booking_data)
            
            # Actualizar estadísticas de popularidad del barbero
            await self._update_barber_popularity(payload.get("barberId"))
            
            # Actualizar preferencias del cliente
            await self._update_client_preferences(
                payload.get("clientId"), 
                payload.get("barberId"), 
                payload.get("serviceId")
            )
            
            self._update_stats("booking.created")
            logger.info(f"✅ Booking procesado exitosamente")
            
        except Exception as e:
            logger.error(f"❌ Error procesando booking creado: {e}")
            self.event_stats["errors"] += 1
            raise
    
    async def process_booking_cancelled(self, event: Event):
        """Procesar cancelación de booking"""
        try:
            payload = event.payload
            logger.info(f"Procesando booking cancelado: {payload.get('appointmentId')}")
            
            # Marcar booking como cancelado
            await self.data_service.cancel_booking(
                payload.get("appointmentId"),
                payload.get("reason", ""),
                payload.get("cancelledBy"),
                event.timestamp
            )
            
            # Actualizar popularidad del barbero
            await self._update_barber_popularity(payload.get("barberId"), increment=False)
            
            self._update_stats("booking.cancelled")
            logger.info(f"✅ Booking cancelado procesado")
            
        except Exception as e:
            logger.error(f"❌ Error procesando booking cancelado: {e}")
            self.event_stats["errors"] += 1
            raise
    
    async def process_rating_created(self, event: Event):
        """Procesar nuevo rating"""
        try:
            payload = event.payload
            logger.info(f"Procesando nuevo rating: {payload.get('ratingId')}")
            
            # Extraer datos del rating
            rating_data = {
                "rating_id": payload.get("ratingId"),
                "user_id": payload.get("userId"),
                "barber_id": payload.get("barberId"),
                "appointment_id": payload.get("appointmentId"),
                "rating": payload.get("rating"),
                "comment": payload.get("comment", ""),
                "created_at": event.timestamp
            }
            
            # Agregar rating al sistema
            await self.data_service.add_rating(rating_data)
            
            # Actualizar rating promedio del barbero
            await self._update_barber_rating(payload.get("barberId"))
            
            # Reentrenar modelos si hay suficientes datos nuevos
            await self._check_model_retraining_needed()
            
            self._update_stats("rating.created")
            logger.info(f"✅ Rating procesado exitosamente")
            
        except Exception as e:
            logger.error(f"❌ Error procesando rating creado: {e}")
            self.event_stats["errors"] += 1
            raise
    
    async def process_user_profile_updated(self, event: Event):
        """Procesar actualización de perfil de usuario"""
        try:
            payload = event.payload
            logger.info(f"Procesando actualización de perfil: {payload.get('userId')}")
            
            # Actualizar perfil en el sistema
            await self.data_service.update_user_profile(
                payload.get("userId"),
                payload.get("profileData", {}),
                event.timestamp
            )
            
            # Actualizar modelo basado en contenido
            await self._update_content_model_for_user(payload.get("userId"))
            
            self._update_stats("user.profile_updated")
            logger.info(f"✅ Perfil actualizado procesado")
            
        except Exception as e:
            logger.error(f"❌ Error procesando actualización de perfil: {e}")
            self.event_stats["errors"] += 1
            raise
    
    async def _update_barber_popularity(self, barber_id: str, increment: bool = True):
        """Actualizar popularidad del barbero"""
        try:
            # Obtener estadísticas actuales
            stats = await self.data_service.get_barber_stats(barber_id)
            
            # Actualizar contador
            if increment:
                stats["booking_count"] = stats.get("booking_count", 0) + 1
            else:
                stats["booking_count"] = max(0, stats.get("booking_count", 0) - 1)
            
            # Recalcular popularidad
            stats["popularity_score"] = self._calculate_popularity_score(stats)
            
            # Guardar estadísticas
            await self.data_service.update_barber_stats(barber_id, stats)
            
        except Exception as e:
            logger.error(f"❌ Error actualizando popularidad del barbero {barber_id}: {e}")
    
    async def _update_barber_rating(self, barber_id: str):
        """Actualizar rating promedio del barbero"""
        try:
            # Obtener todos los ratings del barbero
            ratings = await self.data_service.get_barber_ratings(barber_id)
            
            if ratings:
                # Calcular promedio
                avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
                
                # Actualizar en el perfil del barbero
                await self.data_service.update_barber_rating(barber_id, avg_rating, len(ratings))
                
                logger.info(f"⭐ Rating actualizado para barbero {barber_id}: {avg_rating:.2f}")
            
        except Exception as e:
            logger.error(f"❌ Error actualizando rating del barbero {barber_id}: {e}")
    
    async def _update_client_preferences(self, client_id: str, barber_id: str, service_id: str):
        """Actualizar preferencias del cliente basadas en booking"""
        try:
            # Obtener perfil actual del cliente
            profile = await self.data_service.get_user_profile(client_id)
            
            # Actualizar historial de servicios
            if "service_history" not in profile:
                profile["service_history"] = []
            
            if service_id not in profile["service_history"]:
                profile["service_history"].append(service_id)
            
            # Actualizar barberos preferidos
            if "preferred_barbers" not in profile:
                profile["preferred_barbers"] = []
            
            if barber_id not in profile["preferred_barbers"]:
                profile["preferred_barbers"].append(barber_id)
            
            # Guardar perfil actualizado
            await self.data_service.update_user_profile(client_id, profile)
            
            logger.info(f"👤 Preferencias actualizadas para cliente {client_id}")
            
        except Exception as e:
            logger.error(f"❌ Error actualizando preferencias del cliente {client_id}: {e}")
    
    async def _update_content_model_for_user(self, user_id: str):
        """Actualizar modelo de contenido para usuario específico"""
        try:
            # Obtener perfil actualizado
            profile = await self.data_service.get_user_profile(user_id)
            
            # Actualizar modelo basado en contenido
            if hasattr(self.recommendation_service, 'content_model'):
                await self.recommendation_service.content_model.update_user_profile(user_id, profile)
            
            logger.info(f"🔄 Modelo de contenido actualizado para usuario {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Error actualizando modelo de contenido para usuario {user_id}: {e}")
    
    async def _check_model_retraining_needed(self):
        """Verificar si es necesario reentrenar modelos"""
        try:
            # Obtener estadísticas de nuevos datos
            new_ratings_count = await self.data_service.get_new_ratings_count()
            new_bookings_count = await self.data_service.get_new_bookings_count()
            
            # Umbrales configurables
            RATING_THRESHOLD = 50  # Reentrenar cada 50 nuevos ratings
            BOOKING_THRESHOLD = 100  # Reentrenar cada 100 nuevos bookings
            
            should_retrain = (
                new_ratings_count >= RATING_THRESHOLD or
                new_bookings_count >= BOOKING_THRESHOLD
            )
            
            if should_retrain:
                logger.info(f"🔄 Suficientes nuevos datos para reentrenar modelos")
                logger.info(f"   - Nuevos ratings: {new_ratings_count}")
                logger.info(f"   - Nuevos bookings: {new_bookings_count}")
                
                # Iniciar reentrenamiento asíncrono
                asyncio.create_task(self._retrain_models())
            
        except Exception as e:
            logger.error(f"❌ Error verificando necesidad de reentrenamiento: {e}")
    
    async def _retrain_models(self):
        """Reentrenar modelos ML"""
        try:
            logger.info("🧠 Iniciando reentrenamiento de modelos...")
            
            # Obtener datos actualizados
            training_data = await self.data_service.get_training_data()
            
            # Reentrenar modelo colaborativo
            if hasattr(self.recommendation_service, 'collaborative_model'):
                await self.recommendation_service.collaborative_model.train(training_data)
                logger.info("✅ Modelo colaborativo reentrenado")
            
            # Reentrenar modelo basado en contenido
            if hasattr(self.recommendation_service, 'content_model'):
                content_data = {
                    "user_profiles": training_data.get("users", []),
                    "item_profiles": training_data.get("items", [])
                }
                await self.recommendation_service.content_model.train(content_data)
                logger.info("✅ Modelo basado en contenido reentrenado")
            
            # Resetear contadores de nuevos datos
            await self.data_service.reset_new_data_counters()
            
            logger.info("🎉 Reentrenamiento completado exitosamente")
            
        except Exception as e:
            logger.error(f"❌ Error durante reentrenamiento: {e}")
    
    def _calculate_popularity_score(self, stats: Dict[str, Any]) -> float:
        """Calcular score de popularidad basado en estadísticas"""
        booking_count = stats.get("booking_count", 0)
        rating_avg = stats.get("rating_average", 0)
        rating_count = stats.get("rating_count", 0)
        
        # Fórmula de popularidad (normalizada entre 0-1)
        popularity_score = (
            (booking_count * 0.4) +  # 40% bookings
            (rating_avg * 0.4) +     # 40% rating promedio
            (rating_count * 0.2)     # 20% cantidad de ratings
        ) / 100  # Normalizar
        
        return min(1.0, max(0.0, popularity_score))
    
    def _update_stats(self, event_type: str):
        """Actualizar estadísticas de eventos"""
        self.event_stats["processed"] += 1
        if event_type not in self.event_stats["by_type"]:
            self.event_stats["by_type"][event_type] = 0
        self.event_stats["by_type"][event_type] += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de procesamiento"""
        return self.event_stats.copy()