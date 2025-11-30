import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import { NotificationService } from './services/notification.service'
import { TemplateService } from './services/template.service'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { CreateTemplateDto } from './dto/create-template.dto'
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto'
import { Notification } from './entities/notification.entity'
import { NotificationTemplate } from './entities/notification-template.entity'
import { UserNotificationPreference } from './entities/user-notification-preference.entity'

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly templateService: TemplateService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check del servicio de notificaciones' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Servicio funcionando correctamente' })
  health() {
    return { status: 'ok', service: 'notifications', timestamp: new Date().toISOString() }
  }

  @Post()
  @ApiOperation({ summary: 'Crear y enviar una notificación' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notificación creada exitosamente', type: Notification })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos de entrada inválidos' })
  async createNotification(@Body(new ValidationPipe()) dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.notificationService.createNotification(dto)
    
    // Send notification asynchronously
    this.notificationService.sendNotification(notification).catch(error => {
      console.error('Failed to send notification:', error)
    })
    
    return notification
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener historial de notificaciones de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiQuery({ name: 'limit', description: 'Número máximo de notificaciones a retornar', required: false, example: 50 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Historial de notificaciones', type: [Notification] })
  async getUserNotifications(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number
  ): Promise<Notification[]> {
    return this.notificationService.getNotificationHistory(userId, limit || 50)
  }

  @Get('user/:userId/unread-count')
  @ApiOperation({ summary: 'Obtener cantidad de notificaciones no leídas' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cantidad de notificaciones no leídas' })
  async getUnreadCount(@Param('userId', ParseUUIDPipe) userId: string): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(userId)
    return { count }
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiParam({ name: 'id', description: 'ID de la notificación', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notificación no encontrada' })
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.notificationService.markAsRead(id)
    return { message: 'Notificación marcada como leída' }
  }

  // Template Management
  @Post('templates')
  @ApiOperation({ summary: 'Crear una nueva plantilla de notificación' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Plantilla creada exitosamente', type: NotificationTemplate })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos de entrada inválidos' })
  async createTemplate(@Body(new ValidationPipe()) dto: CreateTemplateDto): Promise<NotificationTemplate> {
    return this.templateService.createTemplate(dto)
  }

  @Get('templates')
  @ApiOperation({ summary: 'Obtener todas las plantillas activas' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de plantillas', type: [NotificationTemplate] })
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    return this.templateService.getAllTemplates()
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Actualizar una plantilla' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Plantilla actualizada', type: NotificationTemplate })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Plantilla no encontrada' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe()) dto: Partial<CreateTemplateDto>
  ): Promise<NotificationTemplate> {
    return this.templateService.updateTemplate(id, dto)
  }

  @Put('templates/:id/disable')
  @ApiOperation({ summary: 'Desactivar una plantilla' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Plantilla desactivada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Plantilla no encontrada' })
  @HttpCode(HttpStatus.OK)
  async disableTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.templateService.deleteTemplate(id)
    return { message: 'Plantilla desactivada exitosamente' }
  }

  @Post('templates/seed')
  @ApiOperation({ summary: 'Crear plantillas por defecto' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Plantillas por defecto creadas' })
  @HttpCode(HttpStatus.OK)
  async seedDefaultTemplates(): Promise<{ message: string }> {
    await this.templateService.seedDefaultTemplates()
    return { message: 'Plantillas por defecto creadas exitosamente' }
  }

  // User Preferences
  @Get('preferences/:userId')
  @ApiOperation({ summary: 'Obtener preferencias de notificaciones de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preferencias del usuario', type: UserNotificationPreference })
  async getUserPreferences(@Param('userId', ParseUUIDPipe) userId: string): Promise<UserNotificationPreference> {
    // This will create default preferences if they don't exist
    return this.notificationService.getUserPreferences(userId)
  }

  @Put('preferences/:userId')
  @ApiOperation({ summary: 'Actualizar preferencias de notificaciones' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preferencias actualizadas', type: UserNotificationPreference })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos de entrada inválidos' })
  async updateUserPreferences(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ValidationPipe()) dto: UpdateNotificationPreferencesDto
  ): Promise<UserNotificationPreference> {
    // TODO: Implement update preferences logic
    // For now, return existing preferences
    return this.notificationService.getUserPreferences(userId)
  }

  // Admin Operations
  @Post('retry-failed')
  @ApiOperation({ summary: 'Reintentar notificaciones fallidas' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notificaciones reintentadas' })
  async retryFailedNotifications(): Promise<{ retriedCount: number; message: string }> {
    const retriedCount = await this.notificationService.retryFailedNotifications()
    return { 
      retriedCount, 
      message: `${retriedCount} notificaciones reintentadas exitosamente` 
    }
  }
}