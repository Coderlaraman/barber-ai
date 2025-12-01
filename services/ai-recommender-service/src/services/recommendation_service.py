"""
Servicio principal de recomendaciones que coordina los diferentes modelos ML
"""

import logging
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

from ..models.recommendation import (
    BarberRecommendationRequest,
    ClientRecommendationRequest,
    RecommendationResponse,
    RecommendationItem,
    UserProfile,
    BarberProfile
)
from .ml_models import CollaborativeFilteringModel, ContentBasedModel
from .data_service import DataService
from ..utils.redis_client import RedisClient
from ..utils.distance_calculator import DistanceCalculator

logger = logging.getLogger(__name__)

class RecommendationService:
    """
    Servicio principal que coordina la generación de recomendaciones
    utilizando múltiples modelos ML y factores contextuales
    """
    
    def __init__(
        self, 
        collaborative_model: CollaborativeFilteringModel,
        content_model: ContentBasedModel,
        redis_client: RedisClient
    ):
        self.collaborative_model = collaborative_model
        self.content_model = content_model
        self.redis_client = redis_client
        self.data_service = DataService()
        self.distance_calculator = DistanceCalculator()
        
        # Configuración de pesos para scoring híbrido (optimizables)
        self.weight_collaborative = 0.4
        self.weight_content = 0.3
        self.weight_popularity = 0.2
        self.weight_availability = 0.1
        
        # Configuración de optimización
        self.optimization_history = []
        self.is_optimized = False
        
    async def load_models(self):
        """Cargar modelos ML y datos de entrenamiento"""
        try:
            logger.info("Cargando modelos ML...")
            
            # Conectar a servicios de datos
            await self.data_service.connect()
            
            # Cargar datos históricos
            await self.data_service.load_training_data()
            
            # Entrenar o cargar modelos
            training_data = await self.data_service.get_training_data()
            
            if training_data and len(training_data.get('ratings', [])) > 10:
                self.collaborative_model.train(training_data)
                self.content_model.train(training_data)
                logger.info("Modelos entrenados exitosamente")
            else:
                logger.warning("Datos insuficientes para entrenar modelos, usando configuración por defecto")
                self.collaborative_model.initialize_default()
                self.content_model.initialize_default()
                
        except Exception as e:
            logger.error(f"Error al cargar modelos: {e}")
            # Inicializar modelos con configuración por defecto
            self.collaborative_model.initialize_default()
            self.content_model.initialize_default()
    
    async def recommend_barbers(self, request: BarberRecommendationRequest) -> List[RecommendationItem]:
        """
        Generar recomendaciones de barberos para un cliente
        """
        try:
            logger.info(f"Generando recomendaciones de barberos para cliente {request.client_id}")
            
            # Verificar caché
            cache_key = f"barber_recs:{request.client_id}:{hash(str(request.dict()))}"
            cached_result = await self.redis_client.get(cache_key)
            
            if cached_result:
                logger.info("Recomendaciones obtenidas de caché")
                return [RecommendationItem(**item) for item in json.loads(cached_result)]
            
            # Obtener perfiles de barberos disponibles
            available_barbers = await self.data_service.get_available_barbers(
                location=request.location,
                max_distance_km=request.max_distance_km,
                service_types=request.service_types,
                date=request.preferred_date
            )
            
            if not available_barbers:
                logger.info("No hay barberos disponibles con los criterios especificados")
                return []
            
            # Obtener perfil del cliente
            client_profile = await self.data_service.get_client_profile(request.client_id)
            
            # Generar scores de diferentes modelos
            recommendations = []
            
            for barber in available_barbers:
                try:
                    # Score colaborativo (basado en usuarios similares)
                    collaborative_score = self.collaborative_model.predict_rating(
                        user_id=request.client_id,
                        item_id=barber.barber_id,
                        user_profile=client_profile,
                        item_profile=barber
                    )
                    
                    # Score basado en contenido (características)
                    content_score = self.content_model.calculate_similarity(
                        user_profile=client_profile,
                        item_profile=barber
                    )
                    
                    # Score de popularidad
                    popularity_score = self._calculate_popularity_score(barber)
                    
                    # Score de disponibilidad y conveniencia
                    availability_score = await self._calculate_availability_score(
                        barber, request.preferred_date, request.time_preference
                    )
                    
                    # Score combinado (híbrido)
                    final_score = (
                        self.weight_collaborative * collaborative_score +
                        self.weight_content * content_score +
                        self.weight_popularity * popularity_score +
                        self.weight_availability * availability_score
                    )
                    
                    # Calcular distancia si hay ubicación
                    distance_km = None
                    if request.location and barber.location:
                        distance_km = self.distance_calculator.calculate_distance(
                            request.location,
                            barber.location
                        )
                    
                    # Generar razones de recomendación
                    reasons = self._generate_recommendation_reasons(
                        collaborative_score, content_score, popularity_score,
                        availability_score, barber, client_profile
                    )
                    
                    recommendation = RecommendationItem(
                        id=barber.barber_id,
                        name=barber.name if hasattr(barber, 'name') else f"Barbero {barber.barber_id}",
                        score=final_score,
                        confidence=self._calculate_confidence(
                            collaborative_score, content_score, 
                            popularity_score, availability_score
                        ),
                        reasons=reasons,
                        distance_km=distance_km,
                        estimated_price=self._estimate_price(barber, request.service_types),
                        rating=barber.rating,
                        review_count=barber.review_count,
                        specialties=barber.specialties,
                        availability=await self._get_availability_slots(barber, request.preferred_date),
                        metadata={
                            "collaborative_score": collaborative_score,
                            "content_score": content_score,
                            "popularity_score": popularity_score,
                            "availability_score": availability_score
                        }
                    )
                    
                    recommendations.append(recommendation)
                    
                except Exception as e:
                    logger.error(f"Error procesando barbero {barber.barber_id}: {e}")
                    continue
            
            # Ordenar por score y limitar
            recommendations.sort(key=lambda x: x.score, reverse=True)
            recommendations = recommendations[:request.limit]
            
            # Guardar en caché (TTL: 15 minutos)
            if recommendations:
                await self.redis_client.setex(
                    cache_key, 
                    900,  # 15 minutos
                    json.dumps([item.dict() for item in recommendations])
                )
            
            logger.info(f"Generadas {len(recommendations)} recomendaciones exitosamente")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error en recommend_barbers: {e}")
            raise
    
    async def recommend_clients(self, request: ClientRecommendationRequest) -> List[RecommendationItem]:
        """
        Generar recomendaciones de clientes para un barbero
        """
        try:
            logger.info(f"Generando recomendaciones de clientes para barbero {request.barber_id}")
            
            # Obtener perfil del barbero
            barber_profile = await self.data_service.get_barber_profile(request.barber_id)
            
            # Obtener clientes potenciales
            potential_clients = await self.data_service.get_potential_clients(
                location=request.location,
                max_distance_km=request.max_distance_km,
                date_range=request.date_range
            )
            
            recommendations = []
            
            for client in potential_clients:
                try:
                    # Calcular compatibilidad inversa
                    compatibility_score = self.content_model.calculate_reverse_similarity(
                        barber_profile=barber_profile,
                        client_profile=client
                    )
                    
                    # Score de probabilidad de reserva
                    booking_probability = self._calculate_booking_probability(
                        client, barber_profile, request.date_range
                    )
                    
                    # Score de valor potencial
                    value_score = self._calculate_client_value_score(client)
                    
                    # Score combinado
                    final_score = (
                        0.5 * compatibility_score +
                        0.3 * booking_probability +
                        0.2 * value_score
                    )
                    
                    if final_score > 0.3:  # Umbral mínimo
                        recommendation = RecommendationItem(
                            id=client.user_id,
                            name=client.name if hasattr(client, 'name') else f"Cliente {client.user_id}",
                            score=final_score,
                            confidence=self._calculate_reverse_confidence(
                                compatibility_score, booking_probability, value_score
                            ),
                            reasons=self._generate_client_recommendation_reasons(
                                compatibility_score, booking_probability, value_score, client
                            ),
                            estimated_price=self._estimate_client_value(client),
                            metadata={
                                "compatibility_score": compatibility_score,
                                "booking_probability": booking_probability,
                                "value_score": value_score
                            }
                        )
                        
                        recommendations.append(recommendation)
                        
                except Exception as e:
                    logger.error(f"Error procesando cliente {client.user_id}: {e}")
                    continue
            
            # Ordenar y limitar
            recommendations.sort(key=lambda x: x.score, reverse=True)
            recommendations = recommendations[:request.limit]
            
            logger.info(f"Generadas {len(recommendations)} recomendaciones de clientes")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error en recommend_clients: {e}")
            raise
    
    def _calculate_popularity_score(self, barber: BarberProfile) -> float:
        """Calcular score de popularidad basado en ratings y reseñas"""
        try:
            # Normalizar rating (0-5 a 0-1)
            rating_score = barber.rating / 5.0 if barber.rating else 0.0
            
            # Score de popularidad basado en número de reseñas
            # Asumir que 100 reseñas = score 1.0
            review_score = min(barber.review_count / 100.0, 1.0) if barber.review_count else 0.0
            
            # Score de experiencia (años de experiencia)
            experience_score = min(barber.experience_years / 10.0, 1.0) if barber.experience_years else 0.0
            
            # Combinar scores con pesos
            return (
                0.6 * rating_score +
                0.3 * review_score +
                0.1 * experience_score
            )
            
        except Exception as e:
            logger.error(f"Error calculando popularity score: {e}")
            return 0.0
    
    async def _calculate_availability_score(self, barber: BarberProfile, preferred_date: Optional[datetime], 
                                          time_preference: Optional[str]) -> float:
        """Calcular score de disponibilidad"""
        try:
            if not preferred_date:
                return 0.5  # Score neutral si no hay preferencia
            
            # Verificar disponibilidad en la fecha preferida
            availability = barber.availability_schedule.get(preferred_date.strftime("%Y-%m-%d"), [])
            
            if not availability:
                return 0.1  # Muy bajo si no hay disponibilidad
            
            # Score basado en número de slots disponibles
            availability_score = min(len(availability) / 8.0, 1.0)  # 8 slots máximo
            
            # Bonus por coincidencia de preferencia horaria
            time_bonus = 0.0
            if time_preference and availability:
                # Simple lógica de coincidencia horaria
                morning_slots = [slot for slot in availability if "09:00" <= slot <= "12:00"]
                afternoon_slots = [slot for slot in availability if "12:00" <= slot <= "17:00"]
                evening_slots = [slot for slot in availability if "17:00" <= slot <= "20:00"]
                
                if time_preference == "morning" and morning_slots:
                    time_bonus = 0.3
                elif time_preference == "afternoon" and afternoon_slots:
                    time_bonus = 0.3
                elif time_preference == "evening" and evening_slots:
                    time_bonus = 0.3
            
            return min(availability_score + time_bonus, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculando availability score: {e}")
            return 0.0
    
    def _calculate_confidence(self, *scores) -> float:
        """Calcular confianza general basada en la consistencia de scores"""
        try:
            if not scores:
                return 0.0
            
            # Varianza de los scores
            scores_array = np.array(scores)
            variance = np.var(scores_array)
            
            # Confianza inversa a la varianza (scores consistentes = alta confianza)
            confidence = max(0.0, 1.0 - variance)
            
            # Ajustar por número de scores disponibles
            return confidence * (len(scores) / 4.0)  # 4 scores máximo
            
        except Exception as e:
            logger.error(f"Error calculando confianza: {e}")
            return 0.0
    
    def _generate_recommendation_reasons(self, collaborative_score: float, content_score: float,
                                       popularity_score: float, availability_score: float,
                                       barber: BarberProfile, client_profile: Optional[UserProfile]) -> List[str]:
        """Generar razones legibles para la recomendación"""
        reasons = []
        
        try:
            # Razones basadas en scores
            if collaborative_score > 0.7:
                reasons.append("Muy bien calificado por clientes similares a ti")
            elif collaborative_score > 0.5:
                reasons.append("Bien valorado por clientes con preferencias similares")
            
            if content_score > 0.7:
                reasons.append("Excelente coincidencia con tus preferencias de estilo")
            elif content_score > 0.5:
                reasons.append("Buena coincidencia con tus preferencias")
            
            if popularity_score > 0.7:
                reasons.append("Muy popular y bien calificado por la comunidad")
            elif popularity_score > 0.5:
                reasons.append("Bien calificado por otros clientes")
            
            if availability_score > 0.7:
                reasons.append("Excelente disponibilidad para tu horario preferido")
            elif availability_score > 0.5:
                reasons.append("Buena disponibilidad")
            
            # Razones específicas del barbero
            if barber.rating >= 4.5:
                reasons.append(f"Calificación excepcional: {barber.rating}/5.0")
            
            if barber.experience_years and barber.experience_years >= 5:
                reasons.append(f"{barber.experience_years} años de experiencia")
            
            if barber.specialties:
                specialties_text = ", ".join(barber.specialties[:2])
                reasons.append(f"Especialista en: {specialties_text}")
            
            # Razones por defecto si no hay suficientes
            if not reasons:
                reasons.append("Recomendación basada en tu perfil y preferencias")
            
            return reasons[:3]  # Limitar a 3 razones principales
            
        except Exception as e:
            logger.error(f"Error generando razones: {e}")
            return ["Recomendación basada en tu perfil"]
    
    def _estimate_price(self, barber: BarberProfile, service_types: Optional[List[str]]) -> Optional[float]:
        """Estimar precio promedio para los servicios solicitados"""
        try:
            if not service_types or not barber.price_range:
                return None
            
            # Usar precio medio del rango del barbero
            min_price = barber.price_range.get('min', 0)
            max_price = barber.price_range.get('max', 100)
            
            return (min_price + max_price) / 2.0
            
        except Exception as e:
            logger.error(f"Error estimando precio: {e}")
            return None
    
    async def _get_availability_slots(self, barber: BarberProfile, date: Optional[datetime]) -> List[str]:
        """Obtener slots de disponibilidad formateados"""
        try:
            if not date:
                return []
            
            date_key = date.strftime("%Y-%m-%d")
            slots = barber.availability_schedule.get(date_key, [])
            
            # Formatear slots
            formatted_slots = []
            for slot in slots:
                if isinstance(slot, str):
                    formatted_slots.append(slot)
                elif isinstance(slot, dict):
                    start_time = slot.get('start', '')
                    if start_time:
                        formatted_slots.append(start_time)
            
            return formatted_slots[:5]  # Limitar a 5 slots
            
        except Exception as e:
            logger.error(f"Error obteniendo slots de disponibilidad: {e}")
            return []
    
    # Métodos para recomendación inversa (clientes para barberos)
    def _calculate_booking_probability(self, client: UserProfile, barber: BarberProfile, 
                                     date_range: Optional[Dict]) -> float:
        """Calcular probabilidad de que el cliente haga una reserva"""
        try:
            # Análisis simple basado en frecuencia de reservas pasadas
            booking_frequency = len(client.service_history) / 30.0  # Reservas por mes
            booking_probability = min(booking_frequency / 2.0, 1.0)  # Normalizar
            
            # Ajustar por compatibilidad de precios
            if hasattr(client, 'price_sensitivity') and barber.price_range:
                client_budget = client.price_sensitivity * 100  # Asumir rango 0-100
                barber_avg_price = (barber.price_range.get('min', 0) + barber.price_range.get('max', 100)) / 2
                
                # Mayor probabilidad si el precio está dentro del presupuesto del cliente
                if barber_avg_price <= client_budget:
                    booking_probability *= 1.2
                else:
                    booking_probability *= 0.7
            
            return min(booking_probability, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculando probabilidad de reserva: {e}")
            return 0.3  # Valor por defecto
    
    def _calculate_client_value_score(self, client: UserProfile) -> float:
        """Calcular score de valor del cliente"""
        try:
            # Valor basado en historial de gasto (simulado)
            avg_rating_given = sum(client.rating_history.values()) / len(client.rating_history) if client.rating_history else 3.0
            
            # Frecuencia de servicios
            service_frequency = len(client.service_history) / 30.0  # Servicios por mes
            
            # Lealtad (basada en consistencia)
            loyalty_score = 0.5  # Valor por defecto
            if service_frequency > 1:  # Más de 1 servicio al mes
                loyalty_score = 0.8
            elif service_frequency > 0.5:  # Más de 0.5 servicios al mes
                loyalty_score = 0.6
            
            # Combinar factores
            return (
                0.4 * (avg_rating_given / 5.0) +  # Normalizar rating
                0.4 * min(service_frequency / 2.0, 1.0) +  # Normalizar frecuencia
                0.2 * loyalty_score
            )
            
        except Exception as e:
            logger.error(f"Error calculando valor del cliente: {e}")
            return 0.5
    
    def _calculate_reverse_confidence(self, compatibility_score: float, 
                                     booking_probability: float, value_score: float) -> float:
        """Calcular confianza para recomendación inversa"""
        try:
            # Similar al método normal pero con pesos diferentes
            scores = [compatibility_score, booking_probability, value_score]
            variance = np.var(scores)
            confidence = max(0.0, 1.0 - variance)
            
            return confidence * (len(scores) / 3.0)
            
        except Exception as e:
            logger.error(f"Error calculando confianza inversa: {e}")
            return 0.0
    
    def _generate_client_recommendation_reasons(self, compatibility_score: float,
                                              booking_probability: float, value_score: float,
                                              client: UserProfile) -> List[str]:
        """Generar razones para recomendación de clientes"""
        reasons = []
        
        try:
            if compatibility_score > 0.7:
                reasons.append("Alta compatibilidad con tus especialidades")
            elif compatibility_score > 0.5:
                reasons.append("Buena compatibilidad con tu estilo")
            
            if booking_probability > 0.6:
                reasons.append("Alta probabilidad de reserva")
            elif booking_probability > 0.4:
                reasons.append("Buena probabilidad de reserva")
            
            if value_score > 0.7:
                reasons.append("Cliente de alto valor potencial")
            elif value_score > 0.5:
                reasons.append("Cliente valioso")
            
            # Información del cliente
            if client.service_history:
                frequency = len(client.service_history) / 30.0
                if frequency > 1:
                    reasons.append("Cliente frecuente")
            
            if not reasons:
                reasons.append("Cliente potencial basado en tu perfil")
            
            return reasons[:3]
            
        except Exception as e:
            logger.error(f"Error generando razones para cliente: {e}")
            return ["Cliente potencial"]
    
    def _estimate_client_value(self, client: UserProfile) -> Optional[float]:
        """Estimar valor promedio del cliente"""
        try:
            # Estimación simple basada en frecuencia y precio promedio del mercado
            frequency = len(client.service_history) / 30.0  # Servicios por mes
            avg_service_price = 35.0  # Precio promedio estimado
            
            return frequency * avg_service_price
            
        except Exception as e:
            logger.error(f"Error estimando valor del cliente: {e}")
            return None
    
    # Métodos de utilidad
    def is_healthy(self) -> bool:
        """Verificar si el servicio está saludable"""
        try:
            return (
                self.collaborative_model.is_healthy() and
                self.content_model.is_healthy() and
                self.redis_client is not None
            )
        except Exception as e:
            logger.error(f"Error verificando salud del servicio: {e}")
            return False
    
    def get_models_info(self) -> Dict[str, Any]:
        """Obtener información sobre los modelos"""
        return {
            "collaborative_filtering": self.collaborative_model.get_info(),
            "content_based": self.content_model.get_info(),
            "service_weights": {
                "collaborative": self.weight_collaborative,
                "content": self.weight_content,
                "popularity": self.weight_popularity,
                "availability": self.weight_availability
            }
        }
    
    async def retrain_models(self) -> Dict[str, Any]:
        """Reentrenar todos los modelos"""
        try:
            logger.info("Reentrenando modelos...")
            
            # Obtener datos actualizados
            training_data = await self.data_service.get_updated_training_data()
            
            # Reentrenar modelos
            collaborative_result = self.collaborative_model.train(training_data)
            content_result = self.content_model.train(training_data)
            
            result = {
                "timestamp": datetime.now().isoformat(),
                "collaborative_model": collaborative_result,
                "content_model": content_result,
                "training_data_size": len(training_data.get('ratings', [])),
                "status": "success"
            }
            
            logger.info("Modelos reentrenados exitosamente")
            return result
            
        except Exception as e:
            logger.error(f"Error inicializando modelos: {e}")
            return False
    
    async def optimize_models(self, training_data: Dict[str, Any], 
                             validation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimizar hiperparámetros de todos los modelos
        """
        try:
            logger.info("Optimizando modelos de recomendación...")
            
            # Debug: Verificar estructura de datos
            logger.info(f"Training data keys: {list(training_data.keys())}")
            logger.info(f"Validation data keys: {list(validation_data.keys())}")
            
            # Debug: Verificar perfiles en datos de entrenamiento
            user_profiles = training_data.get('user_profiles', [])
            item_profiles = training_data.get('item_profiles', [])
            logger.info(f"User profiles in training data: {len(user_profiles)}")
            logger.info(f"Item profiles in training data: {len(item_profiles)}")
            
            if user_profiles:
                logger.info(f"First user profile: {user_profiles[0].user_id}")
                logger.info(f"Has name attribute: {hasattr(user_profiles[0], 'name')}")
            
            optimization_results = {
                "collaborative_filtering": {},
                "content_based": {},
                "hybrid_weights": {},
                "timestamp": datetime.now().isoformat()
            }
            
            # Optimizar modelo colaborativo
            logger.info("Optimizando modelo colaborativo...")
            cf_result = self.collaborative_model.optimize_hyperparameters(
                training_data.get('collaborative_training', {}),
                validation_data.get('collaborative_validation', {})
            )
            optimization_results["collaborative_filtering"] = cf_result
            
            # Optimizar modelo basado en contenido
            logger.info("Optimizando modelo basado en contenido...")
            cb_result = self.content_model.optimize_hyperparameters(
                training_data.get('content_training', {}),
                validation_data.get('content_validation', {})
            )
            optimization_results["content_based"] = cb_result
            
            # Optimizar pesos híbridos
            logger.info("Optimizando pesos híbridos...")
            hybrid_result = await self._optimize_hybrid_weights(validation_data)
            optimization_results["hybrid_weights"] = hybrid_result
            
            # Guardar historial de optimización
            self.optimization_history.append(optimization_results)
            self.is_optimized = True
            
            logger.info("Optimización de modelos completada")
            return optimization_results
            
        except Exception as e:
            logger.error(f"Error optimizando modelos: {e}")
            logger.error(f"Exception details: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {"status": "error", "message": str(e)}
    
    async def _optimize_hybrid_weights(self, validation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimizar pesos de combinación híbrida
        """
        try:
            # Rangos de pesos a probar
            weight_combinations = [
                {"collaborative": 0.5, "content": 0.3, "popularity": 0.15, "availability": 0.05},
                {"collaborative": 0.4, "content": 0.4, "popularity": 0.15, "availability": 0.05},
                {"collaborative": 0.3, "content": 0.5, "popularity": 0.15, "availability": 0.05},
                {"collaborative": 0.6, "content": 0.2, "popularity": 0.15, "availability": 0.05},
                {"collaborative": 0.35, "content": 0.35, "popularity": 0.2, "availability": 0.1},
                {"collaborative": 0.45, "content": 0.25, "popularity": 0.2, "availability": 0.1},
                {"collaborative": 0.25, "content": 0.45, "popularity": 0.2, "availability": 0.1},
            ]
            
            best_score = -1
            best_weights = {}
            results = []
            
            # Probar cada combinación
            for weights in weight_combinations:
                # Aplicar pesos temporalmente
                original_weights = {
                    "collaborative": self.weight_collaborative,
                    "content": self.weight_content,
                    "popularity": self.weight_popularity,
                    "availability": self.weight_availability
                }
                
                self.weight_collaborative = weights["collaborative"]
                self.weight_content = weights["content"]
                self.weight_popularity = weights["popularity"]
                self.weight_availability = weights["availability"]
                
                # Validar con datos de validación
                validation_score = await self._validate_hybrid_model(validation_data)
                
                results.append({
                    "weights": weights,
                    "validation_score": validation_score
                })
                
                if validation_score > best_score:
                    best_score = validation_score
                    best_weights = weights.copy()
                
                # Restaurar pesos originales
                self.weight_collaborative = original_weights["collaborative"]
                self.weight_content = original_weights["content"]
                self.weight_popularity = original_weights["popularity"]
                self.weight_availability = original_weights["availability"]
            
            # Aplicar mejores pesos
            if best_weights:
                self.weight_collaborative = best_weights["collaborative"]
                self.weight_content = best_weights["content"]
                self.weight_popularity = best_weights["popularity"]
                self.weight_availability = best_weights["availability"]
                
                logger.info(f"Pesos híbridos optimizados: {best_weights}")
                logger.info(f"Mejor score de validación híbrida: {best_score:.4f}")
            
            return {
                "status": "success",
                "best_weights": best_weights,
                "best_score": best_score,
                "all_results": results,
                "n_combinations_tested": len(results)
            }
            
        except Exception as e:
            logger.error(f"Error optimizando pesos híbridos: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _validate_hybrid_model(self, validation_data: Dict[str, Any]) -> float:
        """
        Validar el modelo híbrido completo
        """
        try:
            validation_requests = validation_data.get('hybrid_validation_requests', [])
            if not validation_requests:
                return 0.0
            
            scores = []
            
            for request_data in validation_requests:
                # Crear request de validación
                request = BarberRecommendationRequest(**request_data)
                
                # Generar recomendaciones
                recommendations = await self.recommend_barbers(request)
                
                # Calcular score basado en métricas de calidad
                if recommendations:
                    # Score basado en diversidad, relevancia y precisión
                    diversity_score = self._calculate_diversity_score(recommendations)
                    relevance_score = self._calculate_relevance_score(recommendations, request)
                    
                    combined_score = (diversity_score + relevance_score) / 2.0
                    scores.append(combined_score)
            
            return np.mean(scores) if scores else 0.0
            
        except Exception as e:
            logger.error(f"Error validando modelo híbrido: {e}")
            return 0.0
    
    def _calculate_diversity_score(self, recommendations: List[RecommendationItem]) -> float:
        """Calcular score de diversidad en recomendaciones"""
        try:
            if len(recommendations) < 2:
                return 1.0
            
            # Calcular diversidad basada en diferentes atributos
            barber_ids = [rec.barber_id for rec in recommendations]
            scores = [rec.score for rec in recommendations]
            
            # Diversidad de barberos únicos
            unique_barbers = len(set(barber_ids))
            diversity_score = unique_barbers / len(recommendations)
            
            # Diversidad de scores (evitar scores muy similares)
            score_variance = np.var(scores) if len(scores) > 1 else 0.0
            score_diversity = min(1.0, score_variance * 10)  # Normalizar
            
            return (diversity_score + score_diversity) / 2.0
            
        except Exception:
            return 0.5
    
    def _calculate_relevance_score(self, recommendations: List[RecommendationItem], 
                                  request: BarberRecommendationRequest) -> float:
        """Calcular score de relevancia de recomendaciones"""
        try:
            if not recommendations:
                return 0.0
            
            # Score promedio de las recomendaciones
            avg_score = np.mean([rec.score for rec in recommendations])
            
            # Penalizar si hay muchas recomendaciones con score bajo
            low_score_count = sum(1 for rec in recommendations if rec.score < 0.3)
            penalty = low_score_count / len(recommendations) * 0.5
            
            return max(0.0, avg_score - penalty)
            
        except Exception:
            return 0.5