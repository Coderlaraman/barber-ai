import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsController } from '../src/modules/notifications/notifications.controller'
import { NotificationService } from '../src/modules/notifications/services/notification.service'
import { TemplateService } from '../src/modules/notifications/services/template.service'
import { CreateNotificationDto } from '../src/modules/notifications/dto/create-notification.dto'
import { CreateTemplateDto } from '../src/modules/notifications/dto/create-template.dto'
import { UpdateNotificationPreferencesDto } from '../src/modules/notifications/dto/update-preferences.dto'
import { NotificationStatus, NotificationChannel, NotificationType } from '../src/modules/notifications/enums/notification.enum'

describe('NotificationsController', () => {
  let controller: NotificationsController
  let notificationService: jest.Mocked<NotificationService>
  let templateService: jest.Mocked<TemplateService>

  const mockNotificationService = {
    createNotification: jest.fn(),
    sendNotification: jest.fn(),
    getNotificationHistory: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    retryFailedNotifications: jest.fn(),
    getUserPreferences: jest.fn(),
  }

  const mockTemplateService = {
    createTemplate: jest.fn(),
    getAllTemplates: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    seedDefaultTemplates: jest.fn(),
    getTemplate: jest.fn(),
    renderNotification: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: TemplateService,
          useValue: mockTemplateService,
        },
      ],
    }).compile()

    controller = module.get<NotificationsController>(NotificationsController)
    notificationService = mockNotificationService as any
    templateService = mockTemplateService as any
  })

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health()
      
      expect(result).toEqual({
        status: 'ok',
        service: 'notifications',
        timestamp: expect.any(String),
      })
    })
  })

  describe('createNotification', () => {
    it('should create and return a notification', async () => {
      const createDto: CreateNotificationDto = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.APPOINTMENT_CONFIRMED,
        channel: NotificationChannel.EMAIL,
        title: 'Cita Confirmada',
        content: 'Su cita ha sido confirmada',
        metadata: { email: 'test@example.com' },
      }

      const mockNotification = {
        id: 'notification-id',
        ...createDto,
        status: NotificationStatus.PENDING,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockNotificationService.createNotification.mockResolvedValue(mockNotification)
      mockNotificationService.sendNotification.mockResolvedValue([])

      const result = await controller.createNotification(createDto)

      expect(result).toEqual(mockNotification)
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(createDto)
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(mockNotification)
    })
  })

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001'
      const limit = 10
      const mockNotifications = [
        {
          id: '1',
          userId,
          type: NotificationType.APPOINTMENT_CONFIRMED,
          status: NotificationStatus.SENT,
          createdAt: new Date(),
        },
      ]

      mockNotificationService.getNotificationHistory.mockResolvedValue(mockNotifications)

      const result = await controller.getUserNotifications(userId, limit)

      expect(result).toEqual(mockNotifications)
      expect(mockNotificationService.getNotificationHistory).toHaveBeenCalledWith(userId, limit)
    })

    it('should use default limit when not provided', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001'
      const mockNotifications: any[] = []

      mockNotificationService.getNotificationHistory.mockResolvedValue(mockNotifications)

      await controller.getUserNotifications(userId)

      expect(mockNotificationService.getNotificationHistory).toHaveBeenCalledWith(userId, 50)
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001'
      const count = 5

      mockNotificationService.getUnreadCount.mockResolvedValue(count)

      const result = await controller.getUnreadCount(userId)

      expect(result).toEqual({ count })
      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith(userId)
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = '123e4567-e89b-12d3-a456-426614174001'

      mockNotificationService.markAsRead.mockResolvedValue(undefined)

      const result = await controller.markAsRead(notificationId)

      expect(result).toEqual({ message: 'Notificación marcada como leída' })
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(notificationId)
    })
  })

  describe('Template Management', () => {
    describe('createTemplate', () => {
      it('should create a template', async () => {
        const createTemplateDto: CreateTemplateDto = {
          name: 'Test Template',
        type: NotificationType.APPOINTMENT_CONFIRMED,
        channel: NotificationChannel.EMAIL,
        subject: 'Test Subject',
        contentTemplate: 'Test Content',
        }

        const mockTemplate = {
          id: 'template-id',
          ...createTemplateDto,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        mockTemplateService.createTemplate.mockResolvedValue(mockTemplate)

        const result = await controller.createTemplate(createTemplateDto)

        expect(result).toEqual(mockTemplate)
        expect(mockTemplateService.createTemplate).toHaveBeenCalledWith(createTemplateDto)
      })
    })

    describe('getAllTemplates', () => {
      it('should return all templates', async () => {
        const mockTemplates = [
          {
            id: '1',
            name: 'Template 1',
            isActive: true,
            createdAt: new Date(),
          },
        ]

        mockTemplateService.getAllTemplates.mockResolvedValue(mockTemplates)

        const result = await controller.getAllTemplates()

        expect(result).toEqual(mockTemplates)
        expect(mockTemplateService.getAllTemplates).toHaveBeenCalled()
      })
    })

    describe('updateTemplate', () => {
      it('should update a template', async () => {
        const templateId = '123e4567-e89b-12d3-a456-426614174001'
        const updateDto = { name: 'Updated Template' }

        const mockUpdatedTemplate = {
          id: templateId,
          name: 'Updated Template',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        mockTemplateService.updateTemplate.mockResolvedValue(mockUpdatedTemplate)

        const result = await controller.updateTemplate(templateId, updateDto)

        expect(result).toEqual(mockUpdatedTemplate)
        expect(mockTemplateService.updateTemplate).toHaveBeenCalledWith(templateId, updateDto)
      })
    })

    describe('disableTemplate', () => {
      it('should disable a template', async () => {
        const templateId = '123e4567-e89b-12d3-a456-426614174001'

        mockTemplateService.deleteTemplate.mockResolvedValue(undefined)

        const result = await controller.disableTemplate(templateId)

        expect(result).toEqual({ message: 'Plantilla desactivada exitosamente' })
        expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(templateId)
      })
    })

    describe('seedDefaultTemplates', () => {
      it('should seed default templates', async () => {
        mockTemplateService.seedDefaultTemplates.mockResolvedValue(undefined)

        const result = await controller.seedDefaultTemplates()

        expect(result).toEqual({ message: 'Plantillas por defecto creadas exitosamente' })
        expect(mockTemplateService.seedDefaultTemplates).toHaveBeenCalled()
      })
    })
  })

  describe('User Preferences', () => {
    describe('getUserPreferences', () => {
      it('should return user preferences', async () => {
        const userId = '123e4567-e89b-12d3-a456-426614174001'
        const mockPreferences = {
          id: 'prefs-id',
          userId,
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          timezone: 'America/New_York',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        mockNotificationService.getUserPreferences.mockResolvedValue(mockPreferences)

        const result = await controller.getUserPreferences(userId)

        expect(result).toEqual(mockPreferences)
        expect(mockNotificationService.getUserPreferences).toHaveBeenCalledWith(userId)
      })
    })

    describe('updateUserPreferences', () => {
      it('should update user preferences', async () => {
        const userId = '123e4567-e89b-12d3-a456-426614174001'
        const updateDto: UpdateNotificationPreferencesDto = {
          emailEnabled: false,
          pushEnabled: true,
        }

        const mockUpdatedPreferences = {
          id: 'prefs-id',
          userId,
          emailEnabled: false,
          pushEnabled: true,
          smsEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          timezone: 'America/New_York',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        mockNotificationService.getUserPreferences.mockResolvedValue(mockUpdatedPreferences)

        const result = await controller.updateUserPreferences(userId, updateDto)

        expect(result).toEqual(mockUpdatedPreferences)
        expect(mockNotificationService.getUserPreferences).toHaveBeenCalledWith(userId)
      })
    })
  })

  describe('Admin Operations', () => {
    describe('retryFailedNotifications', () => {
      it('should retry failed notifications', async () => {
        const retriedCount = 3

        mockNotificationService.retryFailedNotifications.mockResolvedValue(retriedCount)

        const result = await controller.retryFailedNotifications()

        expect(result).toEqual({
          retriedCount,
          message: `${retriedCount} notificaciones reintentadas exitosamente`,
        })
        expect(mockNotificationService.retryFailedNotifications).toHaveBeenCalled()
      })
    })
  })
})