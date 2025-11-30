import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '../../../typeorm-mock'
import { Repository } from '../../../typeorm-mock'
import { NotificationTemplate } from '../entities/notification-template.entity'
import { CreateTemplateDto } from '../dto/create-template.dto'
import { NotificationType, NotificationChannel } from '../enums/notification.enum'

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name)

  constructor(
    private templateRepository: Repository<NotificationTemplate>
  ) {}

  async createTemplate(dto: CreateTemplateDto): Promise<NotificationTemplate> {
    const template = this.templateRepository.create({
      ...dto,
      language: dto.language || 'es',
    })

    return this.templateRepository.save(template)
  }

  async getTemplate(
    type: NotificationType,
    channel: NotificationChannel,
    language: string = 'es'
  ): Promise<NotificationTemplate | null> {
    const result = await this.templateRepository.findOne({
      where: { type, channel, language, isActive: true },
    })
    return result
  }

  async getAllTemplates(): Promise<NotificationTemplate[]> {
    return this.templateRepository.find({
      where: { isActive: true },
      order: { type: 'ASC', channel: 'ASC', language: 'ASC' },
    })
  }

  async updateTemplate(id: string, updates: Partial<CreateTemplateDto>): Promise<NotificationTemplate> {
    await this.templateRepository.update(id, updates)
    const template = await this.templateRepository.findOne({ where: { id } })
    
    if (!template) {
      throw new Error('Template not found')
    }
    
    return template
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepository.update(id, { isActive: false })
  }

  renderTemplate(template: string, variables: Record<string, any>): string {
    if (!variables || Object.keys(variables).length === 0) {
      return template
    }

    let rendered = template
    
    // Replace {{variable}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })

    // Log warning for unmatched variables
    const unmatchedVariables = rendered.match(/{{\s*\w+\s*}}/g)
    if (unmatchedVariables) {
      this.logger.warn(`Unmatched template variables: ${unmatchedVariables.join(', ')}`)
    }

    return rendered
  }

  async renderNotification(
    type: NotificationType,
    channel: NotificationChannel,
    variables: Record<string, any>,
    language: string = 'es'
  ): Promise<{ subject?: string; title?: string; content: string }> {
    const template = await this.getTemplate(type, channel, language)
    
    if (!template) {
      this.logger.warn(`No template found for type: ${type}, channel: ${channel}, language: ${language}`)
      throw new Error(`Template not found for type: ${type}, channel: ${channel}`)
    }

    const renderedContent = this.renderTemplate(template.contentTemplate, variables)
    const renderedTitle = template.titleTemplate ? this.renderTemplate(template.titleTemplate, variables) : undefined
    const renderedSubject = template.subject ? this.renderTemplate(template.subject, variables) : undefined

    return {
      subject: renderedSubject,
      title: renderedTitle,
      content: renderedContent,
    }
  }

  async seedDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      // Appointment templates
      {
        type: NotificationType.APPOINTMENT_CONFIRMED,
        channel: NotificationChannel.EMAIL,
        name: 'Cita Confirmada - Email',
        subject: '✅ Tu cita ha sido confirmada',
        titleTemplate: '¡Cita Confirmada!',
        contentTemplate: `
          <h2>¡Hola {{userName}}!</h2>
          <p>Tu cita ha sido confirmada exitosamente:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalles de tu cita:</h3>
            <p><strong>Barbero:</strong> {{barberName}}</p>
            <p><strong>Fecha:</strong> {{date}}</p>
            <p><strong>Hora:</strong> {{time}}</p>
            <p><strong>Servicio:</strong> {{service}}</p>
            <p><strong>Dirección:</strong> {{address}}</p>
          </div>
          <p>¡Te esperamos!</p>
          <p>Saludos,<br>El equipo de BarberIA</p>
        `,
        variables: ['userName', 'barberName', 'date', 'time', 'service', 'address'],
        description: 'Plantilla para confirmar citas de barbería por email',
      },
      {
        type: NotificationType.APPOINTMENT_REMINDER,
        channel: NotificationChannel.PUSH,
        name: 'Recordatorio de Cita - Push',
        titleTemplate: '⏰ Recordatorio de cita',
        contentTemplate: 'Recuerda que tienes una cita con {{barberName}} mañana a las {{time}}',
        variables: ['barberName', 'time'],
        description: 'Recordatorio de cita para notificación push',
      },
      {
        type: NotificationType.APPOINTMENT_REMINDER,
        channel: NotificationChannel.SMS,
        name: 'Recordatorio de Cita - SMS',
        contentTemplate: 'Hola {{userName}}, te recordamos que tienes cita con {{barberName}} el {{date}} a las {{time}}. Dirección: {{address}}',
        variables: ['userName', 'barberName', 'date', 'time', 'address'],
        description: 'Recordatorio de cita por SMS',
      },
      // Payment templates
      {
        type: NotificationType.PAYMENT_CONFIRMED,
        channel: NotificationChannel.EMAIL,
        name: 'Pago Confirmado - Email',
        subject: '✅ Pago procesado exitosamente',
        titleTemplate: '¡Pago Confirmado!',
        contentTemplate: `
          <h2>Hola {{userName}},</h2>
          <p>Tu pago ha sido procesado exitosamente:</p>
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalles del pago:</h3>
            <p><strong>Concepto:</strong> {{concept}}</p>
            <p><strong>Monto:</strong> {{amount}}</p>
            <p><strong>Fecha:</strong> {{date}}</p>
            <p><strong>Método:</strong> {{paymentMethod}}</p>
          </div>
          <p>Gracias por tu preferencia.</p>
        `,
        variables: ['userName', 'concept', 'amount', 'date', 'paymentMethod'],
        description: 'Confirmación de pago por email',
      },
      // Welcome template
      {
        type: NotificationType.WELCOME,
        channel: NotificationChannel.EMAIL,
        name: 'Bienvenida - Email',
        subject: '¡Bienvenido a BarberIA!',
        titleTemplate: '¡Bienvenido {{userName}}!',
        contentTemplate: `
          <h2>¡Hola {{userName}}!</h2>
          <p>¡Bienvenido a <strong>BarberIA</strong>, la plataforma inteligente para gestionar tu barbería!</p>
          <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>¿Qué puedes hacer con BarberIA?</h3>
            <ul>
              <li>📅 Agendar citas en línea</li>
              <li>✂️ Gestionar tu disponibilidad</li>
              <li>💳 Procesar pagos</li>
              <li>⭐ Recibir reseñas de clientes</li>
              <li>📊 Analizar tu desempeño</li>
            </ul>
          </div>
          <p>¿Listo para comenzar? <a href="{{dashboardUrl}}" style="color: #007bff;">Accede a tu dashboard</a></p>
          <p>¡Gracias por unirte a nuestra comunidad!</p>
          <p>El equipo de BarberIA</p>
        `,
        variables: ['userName', 'dashboardUrl'],
        description: 'Email de bienvenida para nuevos usuarios',
      },
    ]

    for (const templateData of defaultTemplates) {
      const existing = await this.templateRepository.findOne({
        where: {
          type: templateData.type,
          channel: templateData.channel,
          language: 'es',
        },
      })

      if (!existing) {
        const fullTemplateData = {
          ...templateData,
          id: `template-${templateData.type}-${templateData.channel}-es`,
          language: 'es',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        await this.templateRepository.save(fullTemplateData)
        this.logger.log(`Created default template: ${templateData.name}`)
      }
    }

    this.logger.log('Default templates seeding completed')
  }
}