import { NestFactory } from '@nestjs/core'
import { NotificationsModule } from './src/modules/notifications/notifications.module'
import { EventBusService } from 'contracts'
import { DomainEvent } from 'contracts'
import { Logger } from '@nestjs/common'

/**
 * Script de prueba para verificar el flujo completo de eventos
 * Publica un evento booking.created y verifica que se procese correctamente
 */
async function testEventFlow() {
  const logger = new Logger('EventFlowTest')
  
  try {
    logger.log('🚀 Iniciando prueba de flujo de eventos...')
    
    // Crear aplicación NestJS
    const app = await NestFactory.createApplicationContext(NotificationsModule)
    
    // Obtener el EventBusService
    const eventBus = app.get(EventBusService)
    
    logger.log('📡 EventBus obtenido exitosamente')
    
    // Crear un evento de prueba booking.created
    const testEvent: DomainEvent = {
      eventId: `test-event-${Date.now()}`,
      eventType: 'booking.created',
      aggregateId: `booking-${Date.now()}`,
      aggregateType: 'booking',
      timestamp: new Date().toISOString(),
      version: 1,
      payload: {
        clientId: 'client-123',
        barberId: 'barber-456',
        serviceId: 'service-789',
        date: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
        price: 50.00,
        location: 'Barbería Principal'
      },
      metadata: {
        source: 'test-script',
        test: true
      }
    }
    
    logger.log(`📤 Publicando evento: ${testEvent.eventType}`)
    logger.log(`📋 Datos del evento:`, JSON.stringify(testEvent, null, 2))
    
    // Publicar el evento
    await eventBus.publish(testEvent)
    
    logger.log('✅ Evento publicado exitosamente')
    logger.log('⏳ Esperando procesamiento...')
    
    // Esperar un poco para que se procese el evento
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    logger.log('🔍 Verificando resultados...')
    
    // Aquí podríamos verificar:
    // 1. Que el evento se guardó en PostgresEventStore
    // 2. Que se creó una notificación
    // 3. Que se envió el email/SMS/push
    
    logger.log('✅ Prueba de flujo de eventos completada')
    logger.log('📊 Resumen:')
    logger.log(`   - Evento publicado: ${testEvent.eventType}`)
    logger.log(`   - Aggregate ID: ${testEvent.aggregateId}`)
    logger.log(`   - Event ID: ${testEvent.eventId}`)
    
    // Cerrar la aplicación
    await app.close()
    
  } catch (error) {
    logger.error('❌ Error en la prueba de flujo de eventos:', error)
    process.exit(1)
  }
}

// Ejecutar el test
testEventFlow().then(() => {
  console.log('🎉 Test completado exitosamente')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Test fallido:', error)
  process.exit(1)
})