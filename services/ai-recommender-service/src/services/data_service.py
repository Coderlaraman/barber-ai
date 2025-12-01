"""
Servicio de datos para obtener información de usuarios, barberos y reservas
"""

import logging
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
import numpy as np

from ..models.recommendation import UserProfile, BarberProfile, ServiceType
from ..utils.redis_client import RedisClient
from .database_service import DatabaseService

logger = logging.getLogger(__name__)

class DataService:
    """
    Servicio para obtener y gestionar datos de usuarios, barberos y reservas
    Integra con la base de datos real y proporciona datos mock como fallback
    """
    
    def __init__(self, use_real_database: bool = True):
        self.redis_client = None
        self.use_real_database = use_real_database
        self.database_service = DatabaseService() if use_real_database else None
        self._initialize_mock_data()
    
    async def connect(self):
        """Conectar a servicios externos"""
        if self.use_real_database and self.database_service:
            await self.database_service.connect()
    
    async def disconnect(self):
        """Desconectar de servicios externos"""
        if self.use_real_database and self.database_service:
            await self.database_service.disconnect()
    
    def _initialize_mock_data(self):
        """Inicializar datos mock para desarrollo y testing"""
        logger.info("Inicializando datos mock...")
        
        # Datos mock de barberos
        self.mock_barbers = [
            BarberProfile(
                barber_id="barber_001",
                name="Carlos Rodriguez",
                specialties=["classic_cuts", "beard_specialist", "traditional_shave"],
                services_offered=[ServiceType.HAIRCUT, ServiceType.BEARD_TRIM, ServiceType.SHAVE],
                price_range={"min": 25, "max": 45},
                location={"lat": 40.7128, "lng": -74.0060},
                rating=4.8,
                review_count=127,
                experience_years=8,
                style_tags=["classic", "professional", "traditional"],
                availability_schedule={
                    "2024-12-15": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
                    "2024-12-16": ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]
                },
                client_types=["professional", "classic", "mature"]
            ),
            BarberProfile(
                barber_id="barber_002",
                name="Maria Gonzalez",
                specialties=["modern_styles", "coloring", "texture_specialist"],
                services_offered=[ServiceType.HAIRCUT, ServiceType.COLORING, ServiceType.STYLE],
                price_range={"min": 35, "max": 70},
                location={"lat": 40.7589, "lng": -73.9851},
                rating=4.6,
                review_count=89,
                experience_years=6,
                style_tags=["modern", "trendy", "creative"],
                availability_schedule={
                    "2024-12-15": ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"],
                    "2024-12-16": ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"]
                },
                client_types=["young", "trendy", "creative"]
            ),
            BarberProfile(
                barber_id="barber_003",
                name="Juan Martinez",
                specialties=["fade_specialist", "urban_styles", "beard_styling"],
                services_offered=[ServiceType.HAIRCUT, ServiceType.BEARD_TRIM, ServiceType.STYLE],
                price_range={"min": 20, "max": 40},
                location={"lat": 40.6500, "lng": -73.9500},
                rating=4.4,
                review_count=156,
                experience_years=5,
                style_tags=["urban", "modern", "fade"],
                availability_schedule={
                    "2024-12-15": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"],
                    "2024-12-16": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]
                },
                client_types=["urban", "young", "casual"]
            ),
            BarberProfile(
                barber_id="barber_004",
                name="Ana Lopez",
                specialties=["luxury_service", "vip_treatment", "premium_cuts"],
                services_offered=[ServiceType.HAIRCUT, ServiceType.HAIR_TREATMENT, ServiceType.STYLE],
                price_range={"min": 60, "max": 120},
                location={"lat": 40.7808, "lng": -73.9772},
                rating=4.9,
                review_count=67,
                experience_years=12,
                style_tags=["luxury", "premium", "vip"],
                availability_schedule={
                    "2024-12-15": ["11:00", "12:00", "13:00", "14:00", "15:00"],
                    "2024-12-16": ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]
                },
                client_types=["vip", "luxury", "executive"]
            ),
            BarberProfile(
                barber_id="barber_005",
                name="Luis Hernandez",
                specialties=["family_barber", "all_ages", "quick_service"],
                services_offered=[ServiceType.HAIRCUT, ServiceType.BEARD_TRIM],
                price_range={"min": 15, "max": 30},
                location={"lat": 40.6892, "lng": -74.0445},
                rating=4.3,
                review_count=203,
                experience_years=15,
                style_tags=["family", "quick", "reliable"],
                availability_schedule={
                    "2024-12-15": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
                    "2024-12-16": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
                },
                client_types=["family", "all_ages", "practical"]
            )
        ]
        
        # Datos mock de clientes
        self.mock_clients = [
            UserProfile(
                user_id="client_001",
                name="Alejandro Smith",
                preferences={"price_sensitivity": 0.3, "distance_tolerance": 0.8},
                service_history=["haircut", "beard_trim", "traditional_shave"],
                rating_history={"barber_001": 5.0, "barber_003": 4.0, "barber_005": 4.5},
                price_sensitivity=0.3,
                location_preference={"lat": 40.7128, "lng": -74.0060},
                time_preferences=["morning", "afternoon"],
                style_preferences=["classic", "professional", "traditional"]
            ),
            UserProfile(
                user_id="client_002",
                name="Sofia Johnson",
                preferences={"price_sensitivity": 0.7, "distance_tolerance": 0.5},
                service_history=["haircut", "coloring", "style"],
                rating_history={"barber_002": 4.5, "barber_004": 5.0},
                price_sensitivity=0.7,
                location_preference={"lat": 40.7589, "lng": -73.9851},
                time_preferences=["afternoon", "evening"],
                style_preferences=["modern", "trendy", "creative"]
            ),
            UserProfile(
                user_id="client_003",
                name="Diego Williams",
                preferences={"price_sensitivity": 0.8, "distance_tolerance": 0.6},
                service_history=["haircut", "fade", "beard_styling"],
                rating_history={"barber_003": 5.0, "barber_001": 3.5},
                price_sensitivity=0.8,
                location_preference={"lat": 40.6500, "lng": -73.9500},
                time_preferences=["morning", "evening"],
                style_preferences=["urban", "modern", "fade"]
            )
        ]
        
        # Datos mock de ratings
        self.mock_ratings = []
        for client in self.mock_clients:
            for barber_id, rating in client.rating_history.items():
                self.mock_ratings.append({
                    "user_id": client.user_id,
                    "item_id": barber_id,
                    "rating": rating,
                    "timestamp": datetime.now() - timedelta(days=np.random.randint(1, 365))
                })
        
        # Datos mock de reservas
        self.mock_bookings = []
        for i in range(50):
            client = np.random.choice(self.mock_clients)
            barber = np.random.choice(self.mock_barbers)
            
            self.mock_bookings.append({
                "booking_id": f"booking_{i+1:03d}",
                "client_id": client.user_id,
                "barber_id": barber.barber_id,
                "service_type": np.random.choice([s.value for s in barber.services_offered]),
                "date": datetime.now() + timedelta(days=np.random.randint(-30, 30)),
                "price": np.random.randint(barber.price_range["min"], barber.price_range["max"]),
                "rating": np.random.choice([4.0, 4.5, 5.0]) if np.random.random() > 0.3 else None
            })
    
    async def load_training_data(self):
        """Cargar datos de entrenamiento"""
        logger.info("Cargando datos de entrenamiento...")
        
        if self.use_real_database and self.database_service:
            try:
                # Obtener datos reales de entrenamiento
                return await self.database_service.get_training_data()
            except Exception as e:
                logger.error(f"Error obteniendo datos de entrenamiento reales: {e}")
                # Fallback a datos mock
        
        # Fallback a datos mock
        return {
            "ratings": self.mock_ratings,
            "bookings": self.mock_bookings,
            "user_profiles": self.mock_clients,
            "item_profiles": self.mock_barbers
        }
    
    def get_training_data(self) -> Dict[str, Any]:
        """Obtener datos de entrenamiento"""
        # Por compatibilidad, usar datos mock sincrónicos
        return {
            "ratings": self.mock_ratings,
            "bookings": self.mock_bookings,
            "user_profiles": self.mock_clients,
            "item_profiles": self.mock_barbers
        }
    
    async def get_updated_training_data(self) -> Dict[str, Any]:
        """Obtener datos actualizados para reentrenamiento"""
        # Usar el mismo método que load_training_data para consistencia
        return await self.load_training_data()
    
    async def get_client_profile(self, client_id: str) -> Optional[UserProfile]:
        """Obtener perfil de cliente"""
        if self.use_real_database and self.database_service:
            try:
                # Obtener datos reales del usuario
                user_data = await self.database_service.get_user_by_id(client_id)
                if not user_data:
                    return None
                
                # Obtener preferencias
                preferences = await self.database_service.get_user_preferences(client_id)
                
                # Obtener ubicación
                location = await self.database_service.get_user_location(client_id)
                
                # Obtener historial de reservas
                bookings = await self.database_service.get_user_bookings(client_id)
                service_history = [booking['service_id'] for booking in bookings]
                
                # Obtener calificaciones
                ratings = await self.database_service.get_user_ratings(client_id)
                rating_history = {rating['barber_id']: rating['rating'] for rating in ratings}
                
                # Calcular sensibilidad al precio basada en historial
                avg_price = sum(booking['price'] for booking in bookings) / len(bookings) if bookings else 50
                price_sensitivity = min(1.0, avg_price / 100)  # Normalizar a 0-1
                
                return UserProfile(
                    user_id=client_id,
                    name=user_data.get('name', 'Cliente'),
                    preferences=preferences or {"price_sensitivity": 0.5, "distance_tolerance": 0.5},
                    service_history=service_history,
                    rating_history=rating_history,
                    price_sensitivity=price_sensitivity,
                    location_preference=location,
                    time_preferences=self._extract_time_preferences(bookings),
                    style_preferences=self._extract_style_preferences(preferences)
                )
            except Exception as e:
                logger.error(f"Error obteniendo perfil real del cliente {client_id}: {e}")
                # Fallback a datos mock
        
        # Fallback a datos mock
        client = next((c for c in self.mock_clients if c.user_id == client_id), None)
        
        if not client:
            # Crear perfil por defecto para nuevos clientes
            client = UserProfile(
                user_id=client_id,
                preferences={"price_sensitivity": 0.5, "distance_tolerance": 0.5},
                service_history=[],
                rating_history={},
                price_sensitivity=0.5,
                time_preferences=["morning", "afternoon", "evening"],
                style_preferences=["classic", "modern"]
            )
        
        return client
    
    def _extract_time_preferences(self, bookings: List[Dict[str, Any]]) -> List[str]:
        """Extraer preferencias de tiempo basadas en reservas"""
        if not bookings:
            return ["morning", "afternoon", "evening"]
        
        time_counts = {"morning": 0, "afternoon": 0, "evening": 0}
        
        for booking in bookings:
            start_time = booking.get('start_time', '12:00')
            if isinstance(start_time, str):
                hour = int(start_time.split(':')[0])
                if hour < 12:
                    time_counts["morning"] += 1
                elif hour < 18:
                    time_counts["afternoon"] += 1
                else:
                    time_counts["evening"] += 1
        
        # Retornar tiempos ordenados por frecuencia
        return sorted(time_counts.keys(), key=lambda x: time_counts[x], reverse=True)
    
    def _extract_style_preferences(self, preferences: Dict[str, Any]) -> List[str]:
        """Extraer preferencias de estilo"""
        # Por ahora, retornar estilos por defecto
        # En el futuro, esto puede extraerse de las preferencias del usuario
        return ["classic", "modern"]
    
    async def get_barber_profile(self, barber_id: str) -> Optional[BarberProfile]:
        """Obtener perfil de barbero"""
        if self.use_real_database and self.database_service:
            try:
                # Obtener datos reales del barbero
                user_data = await self.database_service.get_user_by_id(barber_id)
                if not user_data or user_data.get('role') != 'BARBER':
                    return None
                
                # Obtener especialidades
                specialties = await self.database_service.get_barber_specialties(barber_id)
                
                # Obtener servicios
                services = await self.database_service.get_barber_services(barber_id)
                
                # Obtener ubicación
                location = await self.database_service.get_barber_location(barber_id)
                
                # Obtener estadísticas
                stats = await self.database_service.get_barber_stats(barber_id)
                
                # Mapear servicios a tipos
                service_types = []
                for service in services:
                    service_name = service.get('name', '').lower()
                    if 'haircut' in service_name:
                        service_types.append(ServiceType.HAIRCUT)
                    elif 'beard' in service_name:
                        service_types.append(ServiceType.BEARD_TRIM)
                    elif 'shave' in service_name:
                        service_types.append(ServiceType.SHAVE)
                    elif 'color' in service_name:
                        service_types.append(ServiceType.COLORING)
                    elif 'treatment' in service_name:
                        service_types.append(ServiceType.HAIR_TREATMENT)
                    else:
                        service_types.append(ServiceType.STYLE)
                
                # Calcular rango de precios
                price_range = self._calculate_price_range(services)
                
                # Determinar estilos basados en especialidades
                style_tags = self._determine_barber_styles(specialties)
                
                return BarberProfile(
                    barber_id=barber_id,
                    name=user_data.get('name', 'Barbero'),
                    specialties=specialties,
                    services_offered=service_types,
                    price_range=price_range,
                    location=location,
                    rating=stats.get('avg_rating', 0.0),
                    review_count=stats.get('review_count', 0),
                    experience_years=stats.get('experience_years', 0),
                    style_tags=style_tags,
                    client_types=self._determine_client_types(style_tags)
                )
            except Exception as e:
                logger.error(f"Error obteniendo perfil real del barbero {barber_id}: {e}")
                # Fallback a datos mock
        
        # Fallback a datos mock
        return next((b for b in self.mock_barbers if b.barber_id == barber_id), None)
    
    def _calculate_price_range(self, services: List[Dict[str, Any]]) -> Dict[str, int]:
        """Calcular rango de precios basado en servicios"""
        if not services:
            return {"min": 20, "max": 50}
        
        prices = [s.get('base_price', 0) for s in services]
        if not prices:
            return {"min": 20, "max": 50}
        
        return {"min": int(min(prices)), "max": int(max(prices))}
    
    def _determine_barber_styles(self, specialties: List[str]) -> List[str]:
        """Determinar estilos del barbero basados en especialidades"""
        styles = []
        specialties_lower = [s.lower() for s in specialties]
        
        if any('classic' in s or 'traditional' in s for s in specialties_lower):
            styles.append('classic')
        if any('modern' in s or 'contemporary' in s for s in specialties_lower):
            styles.append('modern')
        if any('fade' in s or 'urban' in s for s in specialties_lower):
            styles.append('urban')
        if any('luxury' in s or 'premium' in s for s in specialties_lower):
            styles.append('luxury')
        if any('family' in s or 'all ages' in s for s in specialties_lower):
            styles.append('family')
        
        return styles if styles else ['classic', 'modern']
    
    def _determine_client_types(self, style_tags: List[str]) -> List[str]:
        """Determinar tipos de clientes basados en estilos"""
        client_types = []
        
        if 'luxury' in style_tags:
            client_types.extend(['vip', 'luxury', 'executive'])
        if 'family' in style_tags:
            client_types.extend(['family', 'all_ages', 'practical'])
        if 'urban' in style_tags:
            client_types.extend(['urban', 'young', 'casual'])
        if 'classic' in style_tags:
            client_types.extend(['professional', 'classic', 'mature'])
        if 'modern' in style_tags:
            client_types.extend(['young', 'trendy', 'creative'])
        
        return client_types if client_types else ['all_ages']
    
    async def get_available_barbers(
        self, 
        location: Optional[Dict[str, float]] = None,
        max_distance_km: Optional[float] = None,
        service_types: Optional[List[str]] = None,
        date: Optional[datetime] = None
    ) -> List[BarberProfile]:
        """Obtener barberos disponibles según criterios"""
        if self.use_real_database and self.database_service:
            try:
                # Obtener barberos reales de la base de datos
                barbers_data = await self.database_service.get_available_barbers(
                    date=date,
                    location=location,
                    max_distance_km=max_distance_km,
                    service_types=service_types
                )
                
                # Convertir a objetos BarberProfile
                barber_profiles = []
                for barber_data in barbers_data:
                    barber_profile = await self.get_barber_profile(barber_data['barber_id'])
                    if barber_profile:
                        barber_profiles.append(barber_profile)
                
                return barber_profiles
            except Exception as e:
                logger.error(f"Error obteniendo barberos reales: {e}")
                # Fallback a datos mock
        
        # Fallback a datos mock
        available_barbers = self.mock_barbers.copy()
        
        # Filtrar por tipos de servicio
        if service_types:
            available_barbers = [
                b for b in available_barbers 
                if any(service.value in [s.value for s in b.services_offered] for service in service_types)
            ]
        
        # Filtrar por disponibilidad en fecha específica
        if date:
            date_key = date.strftime("%Y-%m-%d")
            available_barbers = [
                b for b in available_barbers 
                if date_key in b.availability_schedule and b.availability_schedule[date_key]
            ]
        
        # Filtrar por distancia (simulado)
        if location and max_distance_km:
            # En producción, aquí se calcularía la distancia real
            available_barbers = available_barbers[:max(1, int(len(available_barbers) * 0.8))]
        
        return available_barbers
    
    async def get_potential_clients(
        self,
        location: Optional[Dict[str, float]] = None,
        max_distance_km: Optional[float] = None,
        date_range: Optional[Dict[str, datetime]] = None
    ) -> List[UserProfile]:
        """Obtener clientes potenciales para barberos"""
        if self.use_real_database and self.database_service:
            try:
                # Obtener clientes potenciales de la base de datos
                clients_data = await self.database_service.get_potential_clients(
                    location=location,
                    max_distance_km=max_distance_km,
                    date_range=date_range
                )
                
                # Convertir a objetos UserProfile
                client_profiles = []
                for client_data in clients_data:
                    client_profile = await self.get_client_profile(client_data['client_id'])
                    if client_profile:
                        client_profiles.append(client_profile)
                
                return client_profiles
            except Exception as e:
                logger.error(f"Error obteniendo clientes potenciales reales: {e}")
                # Fallback a datos mock
        
        # Fallback a datos mock
        # Por ahora, retornar todos los clientes mock con filtros básicos
        potential_clients = self.mock_clients.copy()
        
        # Aplicar filtros básicos si están disponibles
        if location and max_distance_km:
            # En producción, aquí se calcularía la distancia real
            potential_clients = potential_clients[:max(1, int(len(potential_clients) * 0.8))]
        
        return potential_clients
    
    async def get_similar_users(self, user_id: str, limit: int = 10) -> List[UserProfile]:
        """Obtener usuarios similares"""
        target_user = await self.get_client_profile(user_id)
        if not target_user:
            return []
        
        if self.use_real_database and self.database_service:
            try:
                # Obtener usuarios similares de la base de datos
                similar_users_data = await self.database_service.get_similar_users(
                    user_id=user_id,
                    limit=limit
                )
                
                # Convertir a objetos UserProfile
                similar_users = []
                for user_data in similar_users_data:
                    user_profile = await self.get_client_profile(user_data['similar_user_id'])
                    if user_profile:
                        similar_users.append(user_profile)
                
                return similar_users
            except Exception as e:
                logger.error(f"Error obteniendo usuarios similares reales para {user_id}: {e}")
                # Fallback a lógica mock
        
        # Fallback a lógica mock
        # Simple similitud basada en preferencias
        similar_users = []
        for user in self.mock_clients:
            if user.user_id == user_id:
                continue
            
            # Calcular similitud simple
            common_preferences = set(target_user.style_preferences) & set(user.style_preferences)
            similarity = len(common_preferences) / max(len(target_user.style_preferences), 1)
            
            if similarity > 0.3:  # Umbral mínimo
                similar_users.append(user)
        
        return similar_users[:limit]
    
    async def get_popular_items(self, category: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Obtener items populares"""
        if self.use_real_database and self.database_service:
            try:
                # Obtener items populares de la base de datos
                popular_items_data = await self.database_service.get_popular_items(
                    category=category,
                    limit=limit
                )
                
                # Convertir a formato esperado
                popular_items = []
                for item_data in popular_items_data:
                    popular_items.append({
                        "item_id": item_data['item_id'],
                        "name": item_data['name'],
                        "popularity_score": item_data['popularity_score'],
                        "rating": item_data.get('rating', 0.0),
                        "review_count": item_data.get('review_count', 0)
                    })
                
                return popular_items
            except Exception as e:
                logger.error(f"Error obteniendo items populares reales: {e}")
                # Fallback a lógica mock
        
        # Fallback a lógica mock
        # Calcular popularidad basada en ratings y reseñas
        popular_items = []
        
        for barber in self.mock_barbers:
            popularity_score = (barber.rating / 5.0) * np.log1p(barber.review_count)
            popular_items.append({
                "item_id": barber.barber_id,
                "name": barber.name,
                "popularity_score": popularity_score,
                "rating": barber.rating,
                "review_count": barber.review_count
            })
        
        # Ordenar por popularidad
        popular_items.sort(key=lambda x: x["popularity_score"], reverse=True)
        
        # Filtrar por categoría si se especifica
        if category:
            popular_items = [item for item in popular_items if category.lower() in item["name"].lower()]
        
        return popular_items[:limit]
    
    async def get_user_item_interactions(self, user_id: str) -> List[Dict[str, Any]]:
        """Obtener interacciones usuario-item"""
        if self.use_real_database and self.database_service:
            try:
                return await self.database_service.get_user_interactions(user_id)
            except Exception as e:
                logger.error(f"Error obteniendo interacciones reales del usuario {user_id}: {e}")
                # Fallback a datos mock
        
        # Fallback a datos mock
        interactions = []
        
        # Buscar ratings del usuario
        user_ratings = [r for r in self.mock_ratings if r["user_id"] == user_id]
        
        for rating in user_ratings:
            interactions.append({
                "user_id": rating["user_id"],
                "item_id": rating["item_id"],
                "interaction_type": "rating",
                "value": rating["rating"],
                "timestamp": rating["timestamp"]
            })
        
        # Buscar reservas del usuario
        user_bookings = [b for b in self.mock_bookings if b["client_id"] == user_id]
        
        for booking in user_bookings:
            interactions.append({
                "user_id": booking["client_id"],
                "item_id": booking["barber_id"],
                "interaction_type": "booking",
                "value": 1.0,  # Booking es una interacción positiva
                "timestamp": booking["date"]
            })
        
        return interactions
    
    async def get_training_data(self) -> Dict[str, Any]:
        """Obtener datos de entrenamiento completos"""
        try:
            # Obtener datos de ratings (colaborativo)
            collaborative_training = await self.get_updated_training_data()
            
            # Obtener perfiles de usuarios y barberos (basado en contenido)
            user_profiles = []
            item_profiles = []
            
            if self.use_real_database and self.database_service:
                # Obtener perfiles reales
                users = await self.database_service.get_all_users()
                barbers = await self.database_service.get_all_barbers()
                
                for user in users:
                    profile = await self.get_client_profile(user['id'])
                    if profile:
                        user_profiles.append(profile)
                
                for barber in barbers:
                    profile = await self.get_barber_profile(barber['id'])
                    if profile:
                        item_profiles.append(profile)
            else:
                # Fallback a datos mock
                user_profiles = self._get_mock_user_profiles()
                item_profiles = self._get_mock_item_profiles()
            
            content_training = {
                'user_profiles': user_profiles,
                'item_profiles': item_profiles,
                'n_user_profiles': len(user_profiles),
                'n_item_profiles': len(item_profiles)
            }
            
            return {
                'collaborative_training': collaborative_training,
                'content_training': content_training,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo datos de entrenamiento: {e}")
            raise e
    
    async def get_validation_data(self) -> Dict[str, Any]:
        """Obtener datos de validación"""
        try:
            # Datos de validación para modelo colaborativo
            collaborative_validation = await self.database_service.get_validation_data()
            
            # Datos de validación para modelo basado en contenido
            validation_pairs = []
            
            # Crear pares de validación basados en interacciones reales
            recent_bookings = await self.database_service.get_recent_bookings(24)
            
            for booking in recent_bookings:
                client_id = booking['client_id']
                barber_id = booking['barber_id']
                
                user_profile = await self.get_client_profile(client_id)
                barber_profile = await self.get_barber_profile(barber_id)
                
                if user_profile and barber_profile:
                    # Asumir alta similitud para reservas completadas
                    validation_pairs.append({
                        'user_profile': user_profile,
                        'item_profile': barber_profile,
                        'expected_similarity': 0.8
                    })
            
            content_validation = {
                'user_item_pairs': validation_pairs,
                'n_pairs': len(validation_pairs)
            }
            
            # Requests de validación para modelo híbrido
            hybrid_validation_requests = []
            
            # Crear requests de validación basados en usuarios reales
            active_users = await self.database_service.get_active_users(limit=10)
            
            for user in active_users:
                hybrid_validation_requests.append({
                    'client_id': user['id'],
                    'location': {'latitude': 40.7128, 'longitude': -74.0060},  # Default NYC
                    'max_distance': 10.0,
                    'max_price': 100.0,
                    'service_type': 'haircut',
                    'limit': 5
                })
            
            return {
                'collaborative_validation': collaborative_validation,
                'content_validation': content_validation,
                'hybrid_validation_requests': hybrid_validation_requests,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo datos de validación: {e}")
            raise e
    
    def _get_mock_user_profiles(self) -> List[UserProfile]:
        """Obtener perfiles de usuarios mock"""
        return self.mock_clients.copy()
    
    def _get_mock_item_profiles(self) -> List[BarberProfile]:
        """Obtener perfiles de barberos mock"""
        return self.mock_barbers.copy()
    
    def _get_mock_validation_pairs(self) -> List[Dict[str, Any]]:
        """Obtener pares de validación mock"""
        pairs = []
        
        # Crear pares de validación basados en datos mock
        for i, client in enumerate(self.mock_clients[:5]):
            for j, barber in enumerate(self.mock_barbers[:3]):
                # Calcular similitud esperada basada en preferencias
                common_styles = set(client.style_preferences) & set(barber.specialties)
                expected_similarity = len(common_styles) / max(len(client.style_preferences), 1)
                
                pairs.append({
                    'user_profile': client,
                    'item_profile': barber,
                    'expected_similarity': expected_similarity
                })
        
        return pairs
    
    def _get_mock_hybrid_validation_requests(self) -> List[Dict[str, Any]]:
        """Obtener requests de validación híbrida mock"""
        requests = []
        
        for client in self.mock_clients[:5]:
            requests.append({
                'client_id': client.user_id,
                'location': {'latitude': 40.7128, 'longitude': -74.0060},
                'max_distance': 10.0,
                'max_price': 100.0,
                'service_type': 'haircut',
                'limit': 5
            })
        
        return requests
    
    def get_mock_training_data(self) -> Dict[str, Any]:
        """Obtener datos de entrenamiento colaborativo mock"""
        logger.info(f"get_mock_training_data called. mock_clients: {len(self.mock_clients)}, mock_barbers: {len(self.mock_barbers)}")
        
        # Crear datos de entrenamiento mock para filtrado colaborativo
        users = []
        items = []
        ratings = []
        
        # Generar usuarios mock
        for i, client in enumerate(self.mock_clients):
            users.append({
                'user_id': client.user_id,
                'email': f"user{i}@example.com",
                'name': f"User {i+1}",  # Generate name from index
                'created_at': datetime.now().isoformat()
            })
        
        # Generar items (barberos) mock
        for i, barber in enumerate(self.mock_barbers):
            items.append({
                'item_id': barber.barber_id,
                'name': f"Barber {i+1}",  # Generate name from index
                'email': f"barber{i}@example.com",
                'created_at': datetime.now().isoformat()
            })
        
        # Generar ratings mock basados en interacciones simuladas
        for client in self.mock_clients:
            for barber in self.mock_barbers:
                # Calcular rating basado en compatibilidad
                common_styles = set(client.style_preferences) & set(barber.specialties)
                logger.debug(f"Client {client.user_id} vs Barber {barber.barber_id}: common_styles = {common_styles}")
                if common_styles:
                    # Rating entre 3.5 y 5.0 para barberos compatibles
                    base_rating = 3.5 + (len(common_styles) / max(len(barber.specialties), 1)) * 1.5
                    rating = min(5.0, base_rating + np.random.normal(0, 0.3))
                    rating = max(1.0, rating)  # Asegurar rating mínimo de 1.0
                    
                    ratings.append({
                        'user_id': client.user_id,
                        'item_id': barber.barber_id,
                        'rating': round(rating, 1),
                        'timestamp': datetime.now().isoformat()
                    })
        
        logger.info(f"Generated {len(ratings)} ratings")
        return {
            'users': users,
            'items': items,
            'ratings': ratings
        }
    
    def get_mock_training_data_full(self) -> Dict[str, Any]:
        """Obtener datos de entrenamiento mock completos"""
        return {
            'collaborative_training': self.get_mock_training_data(),
            'content_training': {
                'user_profiles': self._get_mock_user_profiles(),
                'item_profiles': self._get_mock_item_profiles(),
                'n_user_profiles': len(self.mock_clients),
                'n_item_profiles': len(self.mock_barbers)
            },
            'timestamp': datetime.now().isoformat()
        }
    
    def get_mock_validation_data(self) -> Dict[str, Any]:
        """Obtener datos de validación mock"""
        return {
            'collaborative_validation': self.get_mock_training_data(),
            'content_validation': {
                'user_item_pairs': self._get_mock_validation_pairs(),
                'n_pairs': len(self._get_mock_validation_pairs())
            },
            'hybrid_validation_requests': self._get_mock_hybrid_validation_requests(),
            'timestamp': datetime.now().isoformat()
        }