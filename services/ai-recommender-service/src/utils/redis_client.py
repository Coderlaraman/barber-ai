"""
Cliente Redis para caché y gestión de datos en memoria
"""

import json
import redis.asyncio as redis
import logging
from typing import Optional, Any, Dict
import pickle
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class RedisClient:
    """
    Cliente Redis asíncrono para caché y gestión de datos
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379", db: int = 0, password: Optional[str] = None):
        # Parsear URL de Redis
        parsed_url = urlparse(redis_url)
        self.host = parsed_url.hostname or "localhost"
        self.port = parsed_url.port or 6379
        self.db = db
        self.password = password or parsed_url.password
        self.client: Optional[redis.Redis] = None
        self.is_connected = False
        
    async def connect(self):
        """Conectar a Redis"""
        try:
            self.client = redis.Redis(
                host=self.host,
                port=self.port,
                db=self.db,
                password=self.password,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            
            # Verificar conexión
            await self.client.ping()
            self.is_connected = True
            logger.info(f"Conectado a Redis en {self.host}:{self.port}")
            
        except Exception as e:
            logger.error(f"Error conectando a Redis: {e}")
            self.client = None
            self.is_connected = False
            raise
    
    async def disconnect(self):
        """Desconectar de Redis"""
        if self.client:
            await self.client.close()
            self.is_connected = False
            logger.info("Desconectado de Redis")
    
    async def ping(self) -> bool:
        """Verificar conexión con Redis"""
        try:
            if self.client:
                result = await self.client.ping()
                return result is True
            return False
        except Exception as e:
            logger.error(f"Error en ping a Redis: {e}")
            return False
    
    async def get(self, key: str) -> Optional[str]:
        """Obtener valor de Redis"""
        try:
            if not self.client:
                return None
            
            value = await self.client.get(key)
            return value
            
        except Exception as e:
            logger.error(f"Error obteniendo key {key}: {e}")
            return None
    
    async def setex(self, key: str, seconds: int, value: str) -> bool:
        """Establecer valor con expiración"""
        try:
            if not self.client:
                return False
            
            result = await self.client.setex(key, seconds, value)
            return result is True
            
        except Exception as e:
            logger.error(f"Error estableciendo key {key}: {e}")
            return False
    
    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Establecer valor"""
        try:
            if not self.client:
                return False
            
            result = await self.client.set(key, value, ex=ex)
            return result is True
            
        except Exception as e:
            logger.error(f"Error estableciendo key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Eliminar key"""
        try:
            if not self.client:
                return False
            
            result = await self.client.delete(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error eliminando key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Verificar si existe key"""
        try:
            if not self.client:
                return False
            
            result = await self.client.exists(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error verificando existencia de key {key}: {e}")
            return False
    
    async def get_json(self, key: str) -> Optional[Dict[str, Any]]:
        """Obtener y deserializar JSON"""
        try:
            value = await self.get(key)
            if value:
                return json.loads(value)
            return None
            
        except Exception as e:
            logger.error(f"Error deserializando JSON para key {key}: {e}")
            return None
    
    async def set_json(self, key: str, value: Dict[str, Any], ex: Optional[int] = None) -> bool:
        """Serializar y establecer JSON"""
        try:
            json_value = json.dumps(value, default=str)
            return await self.set(key, json_value, ex=ex)
            
        except Exception as e:
            logger.error(f"Error serializando JSON para key {key}: {e}")
            return False
    
    async def get_pickle(self, key: str) -> Optional[Any]:
        """Obtener y deserializar objeto con pickle"""
        try:
            if not self.client:
                return None
            
            value = await self.client.get(key)
            if value:
                return pickle.loads(value)
            return None
            
        except Exception as e:
            logger.error(f"Error deserializando pickle para key {key}: {e}")
            return None
    
    async def set_pickle(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        """Serializar y establecer objeto con pickle"""
        try:
            if not self.client:
                return False
            
            pickled_value = pickle.dumps(value)
            result = await self.client.set(key, pickled_value, ex=ex)
            return result is True
            
        except Exception as e:
            logger.error(f"Error serializando pickle para key {key}: {e}")
            return False
    
    async def hget(self, name: str, key: str) -> Optional[str]:
        """Obtener valor de hash"""
        try:
            if not self.client:
                return None
            
            value = await self.client.hget(name, key)
            return value
            
        except Exception as e:
            logger.error(f"Error obteniendo hash {name}:{key}: {e}")
            return None
    
    async def hset(self, name: str, key: str, value: str) -> bool:
        """Establecer valor en hash"""
        try:
            if not self.client:
                return False
            
            result = await self.client.hset(name, key, value)
            return result >= 0
            
        except Exception as e:
            logger.error(f"Error estableciendo hash {name}:{key}: {e}")
            return False
    
    async def hgetall(self, name: str) -> Dict[str, str]:
        """Obtener todos los valores de hash"""
        try:
            if not self.client:
                return {}
            
            result = await self.client.hgetall(name)
            return result or {}
            
        except Exception as e:
            logger.error(f"Error obteniendo hash {name}: {e}")
            return {}
    
    async def lpush(self, key: str, *values) -> int:
        """Agregar valores al inicio de lista"""
        try:
            if not self.client:
                return 0
            
            result = await self.client.lpush(key, *values)
            return result
            
        except Exception as e:
            logger.error(f"Error agregando a lista {key}: {e}")
            return 0
    
    async def lrange(self, key: str, start: int, end: int) -> list:
        """Obtener rango de lista"""
        try:
            if not self.client:
                return []
            
            result = await self.client.lrange(key, start, end)
            return result
            
        except Exception as e:
            logger.error(f"Error obteniendo rango de lista {key}: {e}")
            return []
    
    async def flushdb(self) -> bool:
        """Limpiar base de datos actual"""
        try:
            if not self.client:
                return False
            
            result = await self.client.flushdb()
            return result is True
            
        except Exception as e:
            logger.error(f"Error limpiando base de datos: {e}")
            return False
    
    def generate_cache_key(self, prefix: str, params: Dict[str, Any]) -> str:
        """Generar clave de caché consistente"""
        # Ordenar parámetros para consistencia
        sorted_params = sorted(params.items())
        param_str = ":".join(f"{k}={v}" for k, v in sorted_params)
        
        # Hash para limitar longitud
        import hashlib
        param_hash = hashlib.md5(param_str.encode()).hexdigest()[:8]
        
        return f"{prefix}:{param_hash}"
    
    async def get_or_set(self, key: str, default_func, ex: int = 300) -> Any:
        """Obtener valor o establecer si no existe"""
        try:
            value = await self.get(key)
            if value is not None:
                return value
            
            # Generar valor por defecto
            default_value = default_func()
            
            # Establecer en caché
            await self.set(key, str(default_value), ex=ex)
            
            return default_value
            
        except Exception as e:
            logger.error(f"Error en get_or_set para key {key}: {e}")
            return default_func()