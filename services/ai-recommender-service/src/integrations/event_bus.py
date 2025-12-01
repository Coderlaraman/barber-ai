"""
Integración con el sistema de eventos NestJS
"""

import json
import asyncio
import logging
from typing import Dict, Any, Callable, List
from dataclasses import dataclass
from datetime import datetime
import redis.asyncio as redis
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

@dataclass
class Event:
    """Evento del sistema"""
    eventType: str
    aggregateId: str
    aggregateType: str
    payload: Dict[str, Any]
    timestamp: str
    version: int = 1
    correlationId: str = None
    causationId: str = None

class NestJSEventBus:
    """
    Cliente para conectarse al sistema de eventos NestJS
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        parsed_url = urlparse(redis_url)
        self.redis_host = parsed_url.hostname or "localhost"
        self.redis_port = parsed_url.port or 6379
        self.redis_password = parsed_url.password
        
        self.publisher: redis.Redis = None
        self.subscriber: redis.Redis = None
        self.handlers: Dict[str, List[Callable]] = {}
        self.is_connected = False
        
    async def connect(self):
        """Conectar al bus de eventos"""
        try:
            # Crear conexiones separadas para pub/sub
            self.publisher = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                password=self.redis_password,
                decode_responses=True
            )
            
            self.subscriber = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                password=self.redis_password,
                decode_responses=True
            )
            
            # Verificar conexiones
            await self.publisher.ping()
            await self.subscriber.ping()
            
            self.is_connected = True
            logger.info("✅ Conectado al EventBus de NestJS")
            
        except Exception as e:
            logger.error(f"❌ Error conectando al EventBus: {e}")
            raise
    
    async def disconnect(self):
        """Desconectar del bus de eventos"""
        if self.publisher:
            await self.publisher.quit()
        if self.subscriber:
            await self.subscriber.quit()
        self.is_connected = False
        logger.info("🔌 Desconectado del EventBus")
    
    def subscribe(self, event_type: str, handler: Callable):
        """Suscribirse a un tipo de evento"""
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)
        logger.info(f"📋 Suscrito a eventos: {event_type}")
    
    async def publish(self, event: Event):
        """Publicar un evento"""
        if not self.is_connected:
            raise RuntimeError("EventBus no está conectado")
        
        try:
            # Formato compatible con NestJS
            message = {
                "eventType": event.eventType,
                "aggregateId": event.aggregateId,
                "aggregateType": event.aggregateType,
                "payload": event.payload,
                "timestamp": event.timestamp,
                "version": event.version,
                "correlationId": event.correlationId,
                "causationId": event.causationId
            }
            
            # Publicar en el canal de Redis
            channel = f"{event.aggregateType}.{event.eventType}"
            await self.publisher.publish(channel, json.dumps(message))
            
            logger.info(f"📤 Evento publicado: {channel}")
            
        except Exception as e:
            logger.error(f"❌ Error publicando evento: {e}")
            raise
    
    async def start_consuming(self):
        """Iniciar consumición de eventos"""
        if not self.is_connected:
            raise RuntimeError("EventBus no está conectado")
        
        try:
            # Suscribirse a todos los canales relevantes
            channels = []
            
            # Eventos de booking
            booking_channels = [
                "BOOKING.booking.created",
                "BOOKING.booking.cancelled", 
                "BOOKING.booking.rescheduled",
                "BOOKING.booking.confirmed"
            ]
            
            # Eventos de usuario
            user_channels = [
                "USER.user.created",
                "USER.user.updated",
                "USER.user.profile_updated"
            ]
            
            # Eventos de rating
            rating_channels = [
                "RATING.rating.created",
                "RATING.rating.updated",
                "RATING.rating.deleted"
            ]
            
            channels = booking_channels + user_channels + rating_channels
            
            for channel in channels:
                await self.subscriber.subscribe(channel)
                logger.info(f"📻 Suscrito a canal: {channel}")
            
            # Configurar manejador de mensajes
            self.subscriber.on("message", self._handle_message)
            
            logger.info("🚀 Consumición de eventos iniciada")
            
        except Exception as e:
            logger.error(f"❌ Error iniciando consumición: {e}")
            raise
    
    async def _handle_message(self, channel: str, message: str):
        """Manejar mensaje recibido"""
        try:
            # Parsear mensaje
            data = json.loads(message)
            event = Event(
                eventType=data["eventType"],
                aggregateId=data["aggregateId"],
                aggregateType=data["aggregateType"],
                payload=data["payload"],
                timestamp=data["timestamp"],
                version=data.get("version", 1),
                correlationId=data.get("correlationId"),
                causationId=data.get("causationId")
            )
            
            logger.info(f"📨 Evento recibido: {channel}")
            
            # Ejecutar handlers registrados
            if event.eventType in self.handlers:
                for handler in self.handlers[event.eventType]:
                    try:
                        await handler(event)
                    except Exception as e:
                        logger.error(f"❌ Error en handler {handler.__name__}: {e}")
            
        except Exception as e:
            logger.error(f"❌ Error procesando mensaje: {e}")

# Handler functions para eventos específicos
async def handle_booking_created(event: Event):
    """Manejar creación de booking"""
    logger.info(f"🆕 Booking creado: {event.payload.get('appointmentId')}")
    # Aquí actualizaríamos nuestros modelos ML

async def handle_booking_cancelled(event: Event):
    """Manejar cancelación de booking"""
    logger.info(f"❌ Booking cancelado: {event.payload.get('appointmentId')}")
    # Actualizar modelos para reflejar cambios

async def handle_rating_created(event: Event):
    """Manejar nuevo rating"""
    logger.info(f"⭐ Nuevo rating creado por usuario: {event.payload.get('userId')}")
    # Reentrenar modelos con nuevo rating

async def handle_user_profile_updated(event: Event):
    """Manejar actualización de perfil de usuario"""
    logger.info(f"👤 Perfil actualizado: {event.payload.get('userId')}")
    # Actualizar perfiles en modelos de contenido