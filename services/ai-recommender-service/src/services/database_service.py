"""
Servicio de base de datos para acceso a datos reales
"""
import asyncpg
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from ..config import settings
from ..utils.logger import setup_logging


class DatabaseService:
    """Servicio para acceso a la base de datos PostgreSQL"""
    
    def __init__(self):
        self.pool = None
        self.connection_string = settings.DATABASE_URL
        self.logger = setup_logging()
    
    async def connect(self):
        """Establecer conexión con la base de datos"""
        try:
            self.pool = await asyncpg.create_pool(
                self.connection_string,
                min_size=5,
                max_size=20,
                command_timeout=30,
                server_settings={
                    'application_name': 'ai-recommender-service'
                }
            )
            self.logger.info("Conexión a PostgreSQL establecida")
        except Exception as e:
            self.logger.error(f"Error al conectar a PostgreSQL: {e}")
            raise
    
    async def disconnect(self):
        """Cerrar conexión con la base de datos"""
        if self.pool:
            await self.pool.close()
            self.logger.info("Conexión a PostgreSQL cerrada")
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Obtener usuario por ID"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT id, email, name, role, created_at, updated_at
                FROM users 
                WHERE id = $1
            """
            row = await conn.fetchrow(query, user_id)
            return dict(row) if row else None

    async def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Obtener preferencias del usuario"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT preference_type, preference_value
                FROM user_preferences
                WHERE user_id = $1 AND is_active = true
            """
            rows = await conn.fetch(query, user_id)
            if not rows:
                return None
            
            preferences = {}
            for row in rows:
                preferences[row['preference_type']] = row['preference_value']
            
            return preferences

    async def get_user_location(self, user_id: str) -> Optional[Dict[str, float]]:
        """Obtener ubicación del usuario"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT latitude, longitude
                FROM user_locations
                WHERE user_id = $1 AND is_active = true
                ORDER BY updated_at DESC
                LIMIT 1
            """
            row = await conn.fetchrow(query, user_id)
            if row:
                return {"lat": row['latitude'], "lng": row['longitude']}
            return None
    
    async def get_user_bookings(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtener historial de reservas del usuario"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT b.id, b.barber_id, b.service_id, b.date, b.start_time, 
                       b.price, b.status, b.created_at
                FROM bookings b
                JOIN services s ON b.service_id = s.id
                WHERE b.client_id = $1 AND b.status IN ('CONFIRMED', 'COMPLETED')
                ORDER BY b.date DESC, b.start_time DESC
                LIMIT $2
            """
            rows = await conn.fetch(query, user_id, limit)
            return [dict(row) for row in rows]
    
    async def get_user_ratings(self, user_id: str) -> List[Dict[str, Any]]:
        """Obtener calificaciones del usuario"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT r.barber_id, r.rating, r.review, r.created_at
                FROM ratings r
                WHERE r.client_id = $1
                ORDER BY r.created_at DESC
            """
            rows = await conn.fetch(query, user_id)
            return [dict(row) for row in rows]
    
    async def get_barber_profile(self, barber_id: str) -> Optional[Dict[str, Any]]:
        """Obtener perfil del barbero"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT u.id, u.name, u.email, u.created_at
                FROM users u
                WHERE u.id = $1 AND u.role = 'BARBER'
            """
            row = await conn.fetchrow(query, barber_id)
            return dict(row) if row else None
    
    async def get_barber_specialties(self, barber_id: str) -> List[str]:
        """Obtener especialidades del barbero"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT s.name
                FROM barber_specialties bs
                JOIN specialties s ON bs.specialty_id = s.id
                WHERE bs.barber_id = $1 AND bs.is_active = true
            """
            rows = await conn.fetch(query, barber_id)
            return [row['name'] for row in rows]
    
    async def get_barber_services(self, barber_id: str) -> List[Dict[str, Any]]:
        """Obtener servicios del barbero"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT s.id, s.name, s.description, s.base_price, s.duration_minutes
                FROM barber_services bs
                JOIN services s ON bs.service_id = s.id
                WHERE bs.barber_id = $1 AND bs.is_active = true
            """
            rows = await conn.fetch(query, barber_id)
            return [dict(row) for row in rows]
    
    async def get_barber_location(self, barber_id: str) -> Optional[Dict[str, float]]:
        """Obtener ubicación del barbero"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT latitude, longitude
                FROM barber_locations 
                WHERE barber_id = $1 AND is_active = true
                ORDER BY updated_at DESC
                LIMIT 1
            """
            row = await conn.fetchrow(query, barber_id)
            if row:
                return {"lat": row['latitude'], "lng": row['longitude']}
            return None
    
    async def get_barber_stats(self, barber_id: str) -> Dict[str, Any]:
        """Obtener estadísticas del barbero"""
        async with self.pool.acquire() as conn:
            # Rating promedio
            rating_query = """
                SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
                FROM ratings
                WHERE barber_id = $1
            """
            rating_row = await conn.fetchrow(rating_query, barber_id)
            
            # Total de reservas completadas
            bookings_query = """
                SELECT COUNT(*) as completed_bookings
                FROM bookings
                WHERE barber_id = $1 AND status = 'COMPLETED'
            """
            bookings_row = await conn.fetchrow(bookings_query, barber_id)
            
            # Experiencia (tiempo desde la primera reserva)
            experience_query = """
                SELECT MIN(created_at) as first_booking
                FROM bookings
                WHERE barber_id = $1
            """
            experience_row = await conn.fetchrow(experience_query, barber_id)
            
            return {
                "avg_rating": float(rating_row['avg_rating']) if rating_row['avg_rating'] else 0.0,
                "review_count": int(rating_row['review_count']) if rating_row['review_count'] else 0,
                "completed_bookings": int(bookings_row['completed_bookings']) if bookings_row['completed_bookings'] else 0,
                "first_booking": experience_row['first_booking'],
                "experience_years": self._calculate_experience_years(experience_row['first_booking'])
            }
    
    def _calculate_experience_years(self, first_booking_date) -> int:
        """Calcular años de experiencia"""
        if not first_booking_date:
            return 0
        
        if isinstance(first_booking_date, str):
            first_booking_date = datetime.fromisoformat(first_booking_date)
        
        return max(0, (datetime.now() - first_booking_date).days // 365)
    
    async def get_available_barbers(
        self,
        date: Optional[datetime] = None,
        location: Optional[Dict[str, float]] = None,
        max_distance_km: Optional[float] = None,
        service_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Obtener barberos disponibles"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT DISTINCT u.id, u.name, u.email
                FROM users u
                WHERE u.role = 'BARBER'
            """
            
            rows = await conn.fetch(query)
            barbers = []
            
            for row in rows:
                barber_id = row['id']
                
                # Obtener información adicional del barbero
                services = await self.get_barber_services(barber_id)
                specialties = await self.get_barber_specialties(barber_id)
                location = await self.get_barber_location(barber_id)
                stats = await self.get_barber_stats(barber_id)
                
                # Filtrar por tipos de servicio si se especifican
                if service_types:
                    service_names = [s['name'] for s in services]
                    if not any(st in service_names for st in service_types):
                        continue
                
                barbers.append({
                    "barber_id": barber_id,
                    "name": row['name'],
                    "specialties": specialties,
                    "services": services,
                    "location": location,
                    "rating": stats['avg_rating'],
                    "review_count": stats['review_count'],
                    "experience_years": stats['experience_years'],
                    "price_range": self._calculate_price_range(services)
                })
            
            return barbers
    
    def _calculate_price_range(self, services: List[Dict[str, Any]]) -> Dict[str, int]:
        """Calcular rango de precios"""
        if not services:
            return {"min": 0, "max": 0}
        
        prices = [s['base_price'] for s in services]
        return {"min": int(min(prices)), "max": int(max(prices))}
    
    async def get_user_interactions(self, user_id: str) -> List[Dict[str, Any]]:
        """Obtener todas las interacciones del usuario"""
        interactions = []
        
        # Obtener ratings
        ratings = await self.get_user_ratings(user_id)
        for rating in ratings:
            interactions.append({
                "user_id": user_id,
                "item_id": rating['barber_id'],
                "interaction_type": "rating",
                "value": rating['rating'],
                "timestamp": rating['created_at']
            })
        
        # Obtener reservas
        bookings = await self.get_user_bookings(user_id)
        for booking in bookings:
            interactions.append({
                "user_id": user_id,
                "item_id": booking['barber_id'],
                "interaction_type": "booking",
                "value": 1.0,  # Booking es una interacción positiva
                "timestamp": booking['created_at']
            })
        
        return interactions
    
    async def get_new_ratings_count(self, since_date: Optional[datetime] = None) -> int:
        """Obtener cantidad de nuevas calificaciones"""
        if not since_date:
            since_date = datetime.now() - timedelta(days=7)  # Última semana por defecto
        
        async with self.pool.acquire() as conn:
            query = """
                SELECT COUNT(*) as count
                FROM ratings
                WHERE created_at >= $1
            """
            row = await conn.fetchrow(query, since_date)
            return int(row['count']) if row else 0
    
    async def get_new_bookings_count(self, since_date: Optional[datetime] = None) -> int:
        """Obtener cantidad de nuevas reservas"""
        if not since_date:
            since_date = datetime.now() - timedelta(days=7)  # Última semana por defecto
        
        async with self.pool.acquire() as conn:
            query = """
                SELECT COUNT(*) as count
                FROM bookings
                WHERE created_at >= $1
            """
            row = await conn.fetchrow(query, since_date)
            return int(row['count']) if row else 0
    
    async def get_training_data(self) -> Dict[str, Any]:
        """Obtener datos de entrenamiento completos"""
        self.logger.info("Obteniendo datos de entrenamiento de la base de datos...")
        
        # Obtener todos los usuarios clientes
        async with self.pool.acquire() as conn:
            users_query = """
                SELECT id, email, name, created_at
                FROM users
                WHERE role = 'CLIENT'
            """
            users_rows = await conn.fetch(users_query)
            users = [dict(row) for row in users_rows]
            
            # Obtener todos los barberos
            barbers_query = """
                SELECT u.id, u.name, u.email, u.created_at
                FROM users u
                WHERE u.role = 'BARBER'
            """
            barbers_rows = await conn.fetch(barbers_query)
            barbers = [dict(row) for row in barbers_rows]
            
            # Obtener todas las calificaciones
            ratings_query = """
                SELECT client_id as user_id, barber_id as item_id, rating, created_at as timestamp
                FROM ratings
                ORDER BY created_at DESC
            """
            ratings_rows = await conn.fetch(ratings_query)
            ratings = [dict(row) for row in ratings_rows]
            
            # Obtener todas las reservas
            bookings_query = """
                SELECT client_id, barber_id, service_id, date, start_time, 
                       price, status, created_at
                FROM bookings
                WHERE status IN ('CONFIRMED', 'COMPLETED')
                ORDER BY created_at DESC
            """
            bookings_rows = await conn.fetch(bookings_query)
            bookings = [dict(row) for row in bookings_rows]
        
        return {
            "users": users,
            "items": barbers,
            "ratings": ratings,
            "bookings": bookings
        }

    async def get_validation_data(self) -> Dict[str, Any]:
        """Obtener datos de validación (últimos 30 días)"""
        self.logger.info("Obteniendo datos de validación...")
        
        # Obtener datos de los últimos 30 días para validación
        async with self.pool.acquire() as conn:
            # Usuarios activos recientemente
            users_query = """
                SELECT DISTINCT u.id, u.email, u.name, u.created_at
                FROM users u
                JOIN bookings b ON u.id = b.client_id
                WHERE u.role = 'CLIENT' AND b.created_at >= NOW() - INTERVAL '30 days'
            """
            users_rows = await conn.fetch(users_query)
            users = [dict(row) for row in users_rows]
            
            # Barberos con actividad reciente
            barbers_query = """
                SELECT DISTINCT u.id, u.name, u.email, u.created_at
                FROM users u
                JOIN bookings b ON u.id = b.barber_id
                WHERE u.role = 'BARBER' AND b.created_at >= NOW() - INTERVAL '30 days'
            """
            barbers_rows = await conn.fetch(barbers_query)
            barbers = [dict(row) for row in barbers_rows]
            
            # Calificaciones recientes
            ratings_query = """
                SELECT client_id as user_id, barber_id as item_id, rating, created_at as timestamp
                FROM ratings
                WHERE created_at >= NOW() - INTERVAL '30 days'
                ORDER BY created_at DESC
            """
            ratings_rows = await conn.fetch(ratings_query)
            ratings = [dict(row) for row in ratings_rows]
            
            # Reservas recientes
            bookings_query = """
                SELECT client_id, barber_id, service_id, date, start_time, 
                       price, status, created_at
                FROM bookings
                WHERE status IN ('CONFIRMED', 'COMPLETED') 
                AND created_at >= NOW() - INTERVAL '30 days'
                ORDER BY created_at DESC
            """
            bookings_rows = await conn.fetch(bookings_query)
            bookings = [dict(row) for row in bookings_rows]
        
        return {
            "users": users,
            "items": barbers,
            "ratings": ratings,
            "bookings": bookings
        }

    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Obtener todos los usuarios"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT id, email, name, role, created_at, updated_at
                FROM users 
                ORDER BY created_at DESC
            """
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]

    async def get_recent_bookings(self, limit: int = 24) -> List[Dict[str, Any]]:
        """Obtener reservas recientes"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT client_id, barber_id, service_id, date, start_time, 
                       price, status, created_at
                FROM bookings
                ORDER BY created_at DESC
                LIMIT $1
            """
            rows = await conn.fetch(query, limit)
            return [dict(row) for row in rows]

    async def get_active_users(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Obtener usuarios activos recientemente"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT DISTINCT u.id, u.email, u.name, u.created_at
                FROM users u
                JOIN bookings b ON u.id = b.client_id
                WHERE u.role = 'CLIENT' 
                AND b.created_at >= NOW() - INTERVAL '30 days'
                LIMIT $1
            """
            rows = await conn.fetch(query, limit)
            return [dict(row) for row in rows]

    async def get_all_barbers(self) -> List[Dict[str, Any]]:
        """Obtener todos los barberos"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT u.id, u.name, u.email, u.created_at, u.updated_at
                FROM users u
                WHERE u.role = 'BARBER'
                ORDER BY u.created_at DESC
            """
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]

    async def get_potential_clients(
        self,
        location: Optional[Dict[str, float]] = None,
        max_distance_km: Optional[float] = None,
        date_range: Optional[Dict[str, datetime]] = None
    ) -> List[Dict[str, Any]]:
        """Obtener clientes potenciales para barberos"""
        async with self.pool.acquire() as conn:
            # Obtener clientes que han tenido reservas en el pasado
            query = """
                SELECT DISTINCT u.id, u.name, u.email, u.created_at,
                       COUNT(b.id) as booking_count,
                       AVG(b.price) as avg_price
                FROM users u
                LEFT JOIN bookings b ON u.id = b.client_id
                WHERE u.role = 'CLIENT' 
                GROUP BY u.id, u.name, u.email, u.created_at
                HAVING COUNT(b.id) > 0
                ORDER BY booking_count DESC, avg_price DESC
                LIMIT 100
            """
            
            rows = await conn.fetch(query)
            clients = []
            
            for row in rows:
                clients.append({
                    "client_id": row['id'],
                    "name": row['name'],
                    "email": row['email'],
                    "booking_count": row['booking_count'],
                    "avg_price": float(row['avg_price']) if row['avg_price'] else 0.0
                })
            
            return clients

    async def get_similar_users(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Obtener usuarios similares basados en patrones de reserva"""
        async with self.pool.acquire() as conn:
            # Encontrar usuarios que hayan reservado con los mismos barberos
            query = """
                SELECT DISTINCT u2.id as similar_user_id, u2.name,
                       COUNT(DISTINCT b2.barber_id) as common_barbers,
                       AVG(b2.price) as avg_price
                FROM users u1
                JOIN bookings b1 ON u1.id = b1.client_id
                JOIN bookings b2 ON b1.barber_id = b2.barber_id AND b1.client_id != b2.client_id
                JOIN users u2 ON b2.client_id = u2.id
                WHERE u1.id = $1 AND u2.role = 'CLIENT'
                GROUP BY u2.id, u2.name
                ORDER BY common_barbers DESC, avg_price DESC
                LIMIT $2
            """
            
            rows = await conn.fetch(query, user_id, limit)
            return [dict(row) for row in rows]

    async def get_popular_items(self, category: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Obtener items (barberos) populares"""
        async with self.pool.acquire() as conn:
            # Calcular popularidad basada en ratings y reservas
            query = """
                SELECT u.id as item_id, u.name,
                       AVG(r.rating) as rating,
                       COUNT(DISTINCT r.id) as review_count,
                       COUNT(DISTINCT b.id) as booking_count,
                       (AVG(r.rating) / 5.0 * LOG(COUNT(DISTINCT r.id) + 1) + 
                        LOG(COUNT(DISTINCT b.id) + 1) * 0.5) as popularity_score
                FROM users u
                LEFT JOIN ratings r ON u.id = r.barber_id
                LEFT JOIN bookings b ON u.id = b.barber_id AND b.status = 'COMPLETED'
                WHERE u.role = 'BARBER'
                GROUP BY u.id, u.name
                HAVING COUNT(DISTINCT r.id) > 0 OR COUNT(DISTINCT b.id) > 0
                ORDER BY popularity_score DESC
                LIMIT $1
            """
            
            rows = await conn.fetch(query, limit)
            items = []
            
            for row in rows:
                items.append({
                    "item_id": row['item_id'],
                    "name": row['name'],
                    "rating": float(row['rating']) if row['rating'] else 0.0,
                    "review_count": row['review_count'],
                    "booking_count": row['booking_count'],
                    "popularity_score": float(row['popularity_score']) if row['popularity_score'] else 0.0
                })
            
            return items