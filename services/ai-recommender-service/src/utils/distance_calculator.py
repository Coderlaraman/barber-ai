"""
Utilidades para cálculo de distancias geográficas
"""

import math
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class DistanceCalculator:
    """
    Calculadora de distancias geográficas usando fórmula de Haversine
    """
    
    @staticmethod
    def calculate_distance(point1: Dict[str, float], point2: Dict[str, float]) -> float:
        """
        Calcular distancia entre dos puntos geográficos en kilómetros
        
        Args:
            point1: Dict con 'lat' y 'lng' del primer punto
            point2: Dict con 'lat' y 'lng' del segundo punto
            
        Returns:
            Distancia en kilómetros
        """
        try:
            # Validar coordenadas
            if not all(key in point1 for key in ['lat', 'lng']):
                raise ValueError("Point1 debe contener 'lat' y 'lng'")
            if not all(key in point2 for key in ['lat', 'lng']):
                raise ValueError("Point2 debe contener 'lat' y 'lng'")
            
            # Convertir a radianes
            lat1 = math.radians(point1['lat'])
            lon1 = math.radians(point1['lng'])
            lat2 = math.radians(point2['lat'])
            lon2 = math.radians(point2['lng'])
            
            # Diferencias
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            # Fórmula de Haversine
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            
            # Radio de la Tierra en kilómetros
            earth_radius_km = 6371.0
            
            distance = earth_radius_km * c
            
            return round(distance, 2)  # Redondear a 2 decimales
            
        except Exception as e:
            logger.error(f"Error calculando distancia: {e}")
            return 0.0
    
    @staticmethod
    def is_within_radius(center: Dict[str, float], point: Dict[str, float], radius_km: float) -> bool:
        """
        Verificar si un punto está dentro de un radio desde un centro
        
        Args:
            center: Dict con 'lat' y 'lng' del centro
            point: Dict con 'lat' y 'lng' del punto a verificar
            radius_km: Radio en kilómetros
            
        Returns:
            True si el punto está dentro del radio
        """
        try:
            distance = DistanceCalculator.calculate_distance(center, point)
            return distance <= radius_km
            
        except Exception as e:
            logger.error(f"Error verificando radio: {e}")
            return False
    
    @staticmethod
    def filter_by_distance(center: Dict[str, float], points: list, max_distance_km: float) -> list:
        """
        Filtrar puntos que estén dentro de una distancia máxima
        
        Args:
            center: Dict con 'lat' y 'lng' del centro
            points: Lista de dicts con 'lat' y 'lng'
            max_distance_km: Distancia máxima en kilómetros
            
        Returns:
            Lista de puntos dentro del radio
        """
        try:
            filtered_points = []
            
            for point in points:
                if DistanceCalculator.is_within_radius(center, point, max_distance_km):
                    # Agregar distancia al punto
                    point_with_distance = point.copy()
                    point_with_distance['distance_km'] = DistanceCalculator.calculate_distance(center, point)
                    filtered_points.append(point_with_distance)
            
            # Ordenar por distancia
            filtered_points.sort(key=lambda x: x['distance_km'])
            
            return filtered_points
            
        except Exception as e:
            logger.error(f"Error filtrando por distancia: {e}")
            return []
    
    @staticmethod
    def calculate_travel_time(distance_km: float, avg_speed_kmh: float = 30.0) -> float:
        """
        Estimar tiempo de viaje basado en distancia
        
        Args:
            distance_km: Distancia en kilómetros
            avg_speed_kmh: Velocidad promedio en km/h (por defecto 30 km/h para ciudad)
            
        Returns:
            Tiempo de viaje en minutos
        """
        try:
            if avg_speed_kmh <= 0:
                return 0.0
            
            travel_time_hours = distance_km / avg_speed_kmh
            travel_time_minutes = travel_time_hours * 60
            
            return round(travel_time_minutes, 1)
            
        except Exception as e:
            logger.error(f"Error calculando tiempo de viaje: {e}")
            return 0.0
    
    @staticmethod
    def get_nearby_locations(center: Dict[str, float], radius_km: float, grid_resolution: int = 5) -> list:
        """
        Generar una cuadrícula de ubicaciones cercanas para búsqueda
        
        Args:
            center: Centro de búsqueda
            radius_km: Radio de búsqueda
            grid_resolution: Número de puntos por dimensión
            
        Returns:
            Lista de ubicaciones en la cuadrícula
        """
        try:
            # Convertir radio de km a grados aproximados
            # 1 grado ≈ 111 km
            radius_degrees = radius_km / 111.0
            
            center_lat = center['lat']
            center_lng = center['lng']
            
            locations = []
            
            # Generar cuadrícula
            for i in range(-grid_resolution, grid_resolution + 1):
                for j in range(-grid_resolution, grid_resolution + 1):
                    lat = center_lat + (i * radius_degrees / grid_resolution)
                    lng = center_lng + (j * radius_degrees / grid_resolution)
                    
                    # Validar coordenadas
                    if -90 <= lat <= 90 and -180 <= lng <= 180:
                        locations.append({
                            'lat': round(lat, 6),
                            'lng': round(lng, 6)
                        })
            
            return locations
            
        except Exception as e:
            logger.error(f"Error generando cuadrícula de ubicaciones: {e}")
            return []
    
    @staticmethod
    def calculate_bounding_box(center: Dict[str, float], radius_km: float) -> Dict[str, float]:
        """
        Calcular cuadro delimitador (bounding box) para búsqueda eficiente
        
        Args:
            center: Centro del área
            radius_km: Radio en kilómetros
            
        Returns:
            Dict con lat_min, lat_max, lng_min, lng_max
        """
        try:
            # Convertir radio de km a grados
            radius_degrees = radius_km / 111.0
            
            center_lat = center['lat']
            center_lng = center['lng']
            
            # Calcular límites
            lat_min = center_lat - radius_degrees
            lat_max = center_lat + radius_degrees
            
            # Ajustar para longitud (varía con latitud)
            lng_degrees = radius_degrees / math.cos(math.radians(center_lat))
            lng_min = center_lng - lng_degrees
            lng_max = center_lng + lng_degrees
            
            return {
                'lat_min': max(-90, lat_min),
                'lat_max': min(90, lat_max),
                'lng_min': max(-180, lng_min),
                'lng_max': min(180, lng_max)
            }
            
        except Exception as e:
            logger.error(f"Error calculando bounding box: {e}")
            return {
                'lat_min': center['lat'] - 1,
                'lat_max': center['lat'] + 1,
                'lng_min': center['lng'] - 1,
                'lng_max': center['lng'] + 1
            }