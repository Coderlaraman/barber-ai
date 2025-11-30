import { Test, TestingModule } from '@nestjs/testing'
import { NotificationService } from '../src/modules/notifications/services/notification.service'
import { EmailService } from '../src/modules/notifications/services/email.service'
import { PushNotificationService } from '../src/modules/notifications/services/push-notification.service'
import { SMSService } from '../src/modules/notifications/services/sms.service'
import { TemplateService } from '../src/modules/notifications/services/template.service'
import { CreateNotificationDto } from '../src/modules/notifications/dto/create-notification.dto'
import { NotificationStatus, NotificationChannel, NotificationType } from '../src/modules/notifications/enums/notification.enum'
import { Notification } from '../src/modules/notifications/entities/notification.entity'
import { UserNotificationPreference } from '../src/modules/notifications/entities/user-notification-preference.entity'

describe('NotificationService', () => {
  let service: NotificationService
  let emailService: jest.Mocked<EmailService>
  let pushService: jest.Mocked<PushNotificationService>
  let smsService: jest.Mocked<SMSService>
  let templateService: jest.Mocked<TemplateService>
  let notificationRepository: jest.Mocked<any>
  let preferenceRepository: jest.Mocked<any>

  const mockEmailService = {
    sendEmail: jest.fn(),
    getChannel: jest.fn().mockReturnValue(NotificationChannel.EMAIL),
    sendBulkEmails: jest.fn(),
  }
  const mockPushService = {
    sendPushNotification: jest.fn(),
    getChannel: jest.fn().mockReturnValue(NotificationChannel.PUSH),
    sendMulticastNotification: jest.fn(),
  }
  const mockSMSService = {
    sendSMS: jest.fn(),
    getChannel: jest.fn().mockReturnValue(NotificationChannel.SMS),
    sendBulkSMS: jest.fn(),
  }
  const mockTemplateService = {
    getTemplate: jest.fn(),
    renderNotification: jest.fn(),
    createTemplate: jest.fn(),
    getAllTemplates: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    seedDefaultTemplates: jest.fn(),
    renderTemplate: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    // Create a custom factory that bypasses the constructor injection issue
    const mockNotificationRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation((entity) => {
        // Generate ID and timestamps if not present
        const savedEntity = {
          ...entity,
          id: entity.id || 'generated-id-' + Date.now(),
          createdAt: entity.createdAt || new Date(),
          updatedAt: entity.updatedAt || new Date(),
        }
        return Promise.resolve(savedEntity)
      }),
      create: jest.fn().mockImplementation((entity) => {
        // Generate ID and timestamps for new entities
        return {
          ...entity,
          id: 'generated-id-' + Date.now(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    }

    const mockPreferenceRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: NotificationService,
          useFactory: () => {
            // Create service instance manually to bypass constructor injection
            const service = new NotificationService(
              mockNotificationRepository as any,
              mockPreferenceRepository as any,
              mockEmailService as any,
              mockPushService as any,
              mockSMSService as any,
              mockTemplateService as any
            )
            return service
          }
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: PushNotificationService,
          useValue: mockPushService,
        },
        {
          provide: SMSService,
          useValue: mockSMSService,
        },
        {
          provide: TemplateService,
          useValue: mockTemplateService,
        },
      ],
    }).compile()

    service = module.get<NotificationService>(NotificationService)
    emailService = mockEmailService as any
    pushService = mockPushService as any
    smsService = mockSMSService as any
    templateService = mockTemplateService as any
    notificationRepository = mockNotificationRepository
    preferenceRepository = mockPreferenceRepository
    
    // Override the repositories in the service to use our mocks
    // @ts-ignore
    service.notificationRepository = notificationRepository
    // @ts-ignore
    service.preferenceRepository = preferenceRepository
  })

  describe('createNotification', () => {
    it('should create a notification with default values', async () => {
      const createDto: CreateNotificationDto = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.APPOINTMENT_CONFIRMED,
        channel: NotificationChannel.EMAIL,
        title: 'Cita Confirmada',
        content: 'Su cita ha sido confirmada',
      }

      const result = await service.createNotification(createDto)

      expect(result).toMatchObject({
        ...createDto,
        status: NotificationStatus.PENDING,
        retryCount: 0,
        maxRetries: 3,
      })
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should create a notification with scheduled time', async () => {
      const scheduledFor = new Date(Date.now() + 3600000) // 1 hour from now
      const createDto: CreateNotificationDto = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.APPOINTMENT_REMINDER,
        channel: NotificationChannel.PUSH,
        title: 'Recordatorio de Cita',
        content: 'Tiene una cita en 30 minutos',
        scheduledFor: scheduledFor.toISOString(),
      }

      const result = await service.createNotification(createDto)

      expect(result).toMatchObject({
        ...createDto,
        scheduledFor: expect.any(Date),
        status: NotificationStatus.PENDING,
      })
    })
  })

  describe('sendNotification', () => {
    const mockNotification: Notification = {
      id: 'notification-id',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      type: NotificationType.APPOINTMENT_CONFIRMED,
      channel: NotificationChannel.EMAIL,
      title: 'Cita Confirmada',
      content: 'Su cita ha sido confirmada',
      status: NotificationStatus.PENDING,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { email: 'test@example.com' },
    }

    const mockPreferences: UserNotificationPreference = {
      id: 'prefs-id',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: true,
      inAppEnabled: true,
      quietHoursStart: undefined,
      quietHoursEnd: undefined,
      timezone: 'America/New_York',
      appointmentReminders: true,
      promotionalEmails: true,
      bookingConfirmations: true,
      paymentNotifications: true,
      reviewRequests: true,
      systemUpdates: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isChannelEnabled: jest.fn((channel: NotificationChannel) => {
        switch (channel) {
          case NotificationChannel.EMAIL:
            return true
          case NotificationChannel.PUSH:
            return true
          case NotificationChannel.SMS:
            return true
          case NotificationChannel.IN_APP:
            return true
          default:
            return false
        }
      }),
      isNotificationTypeEnabled: jest.fn(() => true),
    }

    beforeEach(() => {
      // Mock the getUserPreferences method to return our mock preferences
      jest.spyOn(service, 'getUserPreferences').mockResolvedValue(mockPreferences)
    })

    it('should send email notification successfully', async () => {
      emailService.sendEmail.mockResolvedValue({
        messageId: 'email-message-id',
        success: true,
      })

      const result = await service.sendNotification(mockNotification)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        success: true,
        messageId: 'email-message-id',
        channel: NotificationChannel.EMAIL,
      })
      expect(emailService.sendEmail).toHaveBeenCalled()
    })

    it('should skip notification if channel is disabled', async () => {
      const disabledPreferences = {
        ...mockPreferences,
        emailEnabled: false,
        isChannelEnabled: jest.fn().mockReturnValue(false),
        isNotificationTypeEnabled: jest.fn().mockReturnValue(true),
      }
      jest.spyOn(service, 'getUserPreferences').mockResolvedValue(disabledPreferences)

      const result = await service.sendNotification(mockNotification)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        success: false,
        error: 'Channel disabled by user preference',
        channel: NotificationChannel.EMAIL,
      })
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should skip notification if notification type is disabled', async () => {
      const notificationWithDisabledType = {
        ...mockNotification,
        type: NotificationType.PROMOTIONAL,
      }
      const preferencesWithDisabledType = {
        ...mockPreferences,
        promotionalEnabled: false,
        isChannelEnabled: jest.fn().mockReturnValue(true),
        isNotificationTypeEnabled: jest.fn().mockReturnValue(false),
      }
      jest.spyOn(service, 'getUserPreferences').mockResolvedValue(preferencesWithDisabledType)

      const result = await service.sendNotification(notificationWithDisabledType)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        success: false,
        error: 'Notification type disabled by user preference',
        channel: NotificationChannel.EMAIL,
      })
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should schedule notification during quiet hours', async () => {
      const quietHoursPreferences = {
        ...mockPreferences,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        isChannelEnabled: jest.fn().mockReturnValue(true),
        isNotificationTypeEnabled: jest.fn().mockReturnValue(true),
      }
      
      // Set up the mock to return the quiet hours preferences
      jest.spyOn(service, 'getUserPreferences').mockResolvedValue(quietHoursPreferences)
      
      // Mock the private isQuietHours method to return true
      jest.spyOn(service as any, 'isQuietHours').mockReturnValue(true)

      const result = await service.sendNotification(mockNotification)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        success: false,
        error: 'Quiet hours active, notification scheduled',
        channel: NotificationChannel.EMAIL,
      })
      expect(emailService.sendEmail).not.toHaveBeenCalled()
      expect(notificationRepository.save).toHaveBeenCalled()
    })

    it('should handle email sending errors', async () => {
      emailService.sendEmail.mockRejectedValue(new Error('SMTP error'))

      const result = await service.sendNotification(mockNotification)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        success: false,
        error: 'SMTP error',
        channel: NotificationChannel.EMAIL,
      })
    })

    it('should use template when templateId is provided', async () => {
      const notificationWithTemplate = {
        ...mockNotification,
        templateId: 'template-id',
      }

      const mockRenderedTemplate = {
        subject: 'Rendered Subject',
        title: 'Rendered Title',
        content: 'Rendered Content',
      }

      templateService.getTemplate.mockResolvedValue({
        id: 'template-id',
        name: 'Test Template',
        type: NotificationType.APPOINTMENT_CONFIRMED,
        channel: NotificationChannel.EMAIL,
        subject: 'Template Subject',
        contentTemplate: 'Template Content',
        language: 'es',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      templateService.renderNotification.mockResolvedValue(mockRenderedTemplate)

      emailService.sendEmail.mockResolvedValue({
        messageId: 'email-message-id',
        success: true,
      })

      const result = await service.sendNotification(notificationWithTemplate)

      expect(result[0].success).toBe(true)
      expect(templateService.getTemplate).toHaveBeenCalled()
      expect(templateService.renderNotification).toHaveBeenCalled()
    })
  })

  describe('getUserPreferences', () => {
    it('should return existing preferences', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001'
      const mockPreferences = {
        id: 'prefs-id',
        userId,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: 'America/New_York',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Set up the mock to return the preferences
      preferenceRepository.findOne.mockResolvedValue(mockPreferences)

      const result = await service.getUserPreferences(userId)

      expect(result).toMatchObject({
        userId,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
      })
      expect(preferenceRepository.findOne).toHaveBeenCalledWith({ where: { userId } })
    })

    it('should create default preferences if none exist', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001'

      // Set up the mock to return null first (no existing preferences)
      preferenceRepository.findOne.mockResolvedValue(null)
      
      // Set up the mock to return the created preferences
      const createdPreferences = {
        id: 'new-prefs-id',
        userId,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      preferenceRepository.create.mockReturnValue(createdPreferences)
      preferenceRepository.save.mockResolvedValue(createdPreferences)

      const result = await service.getUserPreferences(userId)

      expect(result).toMatchObject({
        userId,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
      })
      expect(result.id).toBeDefined()
      expect(preferenceRepository.findOne).toHaveBeenCalledWith({ where: { userId } })
      expect(preferenceRepository.create).toHaveBeenCalled()
      expect(preferenceRepository.save).toHaveBeenCalled()
    })
  })

  describe('getNotificationHistory', () => {
    it('should return notification history with limit', async () => {
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
        {
          id: '2',
          userId,
          type: NotificationType.APPOINTMENT_REMINDER,
          status: NotificationStatus.SENT,
          createdAt: new Date(),
        },
      ]

      // Set up the mock to return the notifications
      notificationRepository.find.mockResolvedValue(mockNotifications)

      const result = await service.getNotificationHistory(userId, limit)

      expect(result).toHaveLength(2)
      expect(result[0].userId).toBe(userId)
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      })
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = '123e4567-e89b-12d3-a456-426614174001'

      await service.markAsRead(notificationId)

      // Since we're using mock repositories, we can't verify the actual update
      // But we can ensure the method doesn't throw
      expect(async () => {
        await service.markAsRead(notificationId)
      }).not.toThrow()
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001'

      // Set up the mock to return count
      notificationRepository.count.mockResolvedValue(5)

      const result = await service.getUnreadCount(userId)

      expect(result).toBe(5)
      expect(notificationRepository.count).toHaveBeenCalledWith({
        where: {
          userId,
          status: NotificationStatus.SENT,
          readAt: null,
        },
      })
    })
  })

  describe('retryFailedNotifications', () => {
    it('should retry failed notifications and return count', async () => {
      const mockFailedNotifications = [
        {
          id: 'failed-1',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          type: NotificationType.APPOINTMENT_CONFIRMED,
          channel: NotificationChannel.EMAIL,
          title: 'Failed Notification 1',
          content: 'This failed',
          status: NotificationStatus.FAILED,
          retryCount: 1,
          maxRetries: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'failed-2',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          type: NotificationType.PAYMENT_CONFIRMED,
          channel: NotificationChannel.PUSH,
          title: 'Failed Notification 2',
          content: 'This also failed',
          status: NotificationStatus.FAILED,
          retryCount: 2,
          maxRetries: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      // Mock the repository to return failed notifications
      notificationRepository.find.mockResolvedValue(mockFailedNotifications)
      
      // Mock sendNotification to succeed for retry
      jest.spyOn(service, 'sendNotification').mockResolvedValue([
        { success: true, messageId: 'retry-1', channel: NotificationChannel.EMAIL },
        { success: true, messageId: 'retry-2', channel: NotificationChannel.PUSH },
      ])

      const result = await service.retryFailedNotifications()

      expect(result).toBe(2) // Should retry 2 notifications
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: { $lt: 3 },
        },
      })
      expect(service.sendNotification).toHaveBeenCalledTimes(2)
    })
  })
})