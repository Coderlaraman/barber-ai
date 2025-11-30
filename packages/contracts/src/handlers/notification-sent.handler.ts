import { Injectable, Logger } from '@nestjs/common'
import { NotificationEventHandler } from '../services/event-handler'
import { NotificationSentEvent } from '../events/notification-events'

/**
 * Handler para el evento NotificationSent
 * Ejemplo de implementación para trackear notificaciones enviadas
 */
@Injectable()
export class NotificationSentHandler extends NotificationEventHandler<NotificationSentEvent> {
  protected readonly logger = new Logger(NotificationSentHandler.name)

  canHandle(eventType: string): boolean {
    return eventType === 'notification.sent'
  }

  protected async processEvent(event: NotificationSentEvent): Promise<void> {
    this.logger.log(`Procesando notificación enviada: ${event.aggregateId}`)
    
    const { payload } = event
    
    // Validar datos requeridos
    if (!payload.recipientId || !payload.channel || !payload.type) {
      throw new Error('Datos incompletos en el evento de notificación')
    }

    // Aquí se implementaría la lógica específica
    // Por ejemplo:
    // - Actualizar métricas de notificaciones
    // - Trackear engagement
    // - Actualizar estado en base de datos
    // - Trigger de eventos follow-up

    this.logger.log(`Notificación enviada exitosamente:
      - ID: ${payload.notificationId}
      - Destinatario: ${payload.recipientId} (${payload.recipientType})
      - Canal: ${payload.channel}
      - Tipo: ${payload.type}
      - Estado: ${payload.status}
      - Enviado en: ${payload.sentAt}
    `)

    // Si la notificación falló, podríamos implementar lógica de reintento
    if (payload.status === 'FAILED') {
      await this.handleFailedNotification(event)
    }
  }

  private async handleFailedNotification(event: NotificationSentEvent): Promise<void> {
    this.logger.warn(`Notificación falló: ${event.aggregateId}`)
    
    // Implementar lógica de reintento o notificación alternativa
    // Por ejemplo:
    // - Reintentar con otro canal
    // - Notificar a administradores
    // - Guardar en cola de mensajes fallidos
    
    this.logger.log(`Procesando notificación fallida para reintento`)
  }
}