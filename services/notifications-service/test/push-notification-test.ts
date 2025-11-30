import { ConfigService } from '@nestjs/config'
import { PushNotificationService } from '../src/modules/notifications/services/push-notification-mock.service'
import { NotificationChannel } from '../src/modules/notifications/enums/notification.enum'

// Create a mock ConfigService
const mockConfigService = {
  get: (key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      'FIREBASE_SERVICE_ACCOUNT_PATH': null, // Mock mode
      'FIREBASE_DATABASE_URL': null,
    }
    return config[key] ?? defaultValue
  }
} as ConfigService

async function testPushNotificationService() {
  console.log('🚀 Testing Push Notification Service...\n')

  // Initialize push notification service with mock config
  const pushService = new PushNotificationService(mockConfigService)

  // Test 1: Single push notification
  console.log('📱 Test 1: Single Push Notification')
  try {
    const result = await pushService.sendPushNotification({
      token: 'fCMXyZ1234567890abcdef',
      title: '¡Cita Confirmada!',
      body: 'Tu corte de cabello está confirmado para mañana a las 14:30',
      data: {
        appointmentId: '12345',
        type: 'appointment_confirmed',
        date: '2024-12-15',
        time: '14:30'
      },
      sound: 'default',
      badge: 1,
      clickAction: 'OPEN_APPOINTMENT_DETAIL'
    })
    console.log('✅ Push notification sent:', result)
  } catch (error: any) {
    console.error('❌ Push notification failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Promotional notification
  console.log('📱 Test 2: Promotional Push Notification')
  try {
    const result = await pushService.sendPushNotification({
      token: 'fCMXyZ0987654321fedcba',
      title: '¡Oferta Especial! 🎉',
      body: '20% de descuento en todos los servicios esta semana',
      data: {
        promotionId: 'PROMO001',
        type: 'promotional',
        discount: '20%',
        validUntil: '2024-12-31'
      },
      imageUrl: 'https://barberia.com/images/promo-banner.jpg',
      sound: 'notification_sound'
    })
    console.log('✅ Promotional push notification sent:', result)
  } catch (error: any) {
    console.error('❌ Promotional push notification failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Appointment reminder
  console.log('📱 Test 3: Appointment Reminder')
  try {
    const result = await pushService.sendPushNotification({
      token: 'fCMXyZ1122334455667788',
      title: '⏰ Recordatorio de Cita',
      body: 'Tienes una cita con Luis Martínez en 30 minutos',
      data: {
        appointmentId: '67890',
        type: 'appointment_reminder',
        barberName: 'Luis Martínez',
        service: 'Corte de Cabello'
      },
      sound: 'reminder_sound',
      badge: 2
    })
    console.log('✅ Appointment reminder sent:', result)
  } catch (error: any) {
    console.error('❌ Appointment reminder failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 4: Multicast notification
  console.log('📱 Test 4: Multicast Push Notification')
  try {
    const tokens = [
      'fCMXyZ1234567890abcdef',
      'fCMXyZ0987654321fedcba',
      'fCMXyZ1122334455667788',
      'fCMXyZ2233445566778899',
      'fCMXyZ3344556677889900'
    ]
    
    const result = await pushService.sendMulticastNotification(
      tokens,
      '📢 Notificación General',
      'Todos los barberos están disponibles hoy',
      {
        type: 'general_announcement',
        priority: 'normal',
        validUntil: '2024-12-15T18:00:00Z'
      }
    )
    console.log('✅ Multicast notification completed:', result)
  } catch (error: any) {
    console.error('❌ Multicast notification failed:', error.message)
  }

  console.log('\n✅ All push notification tests completed!')
  console.log(`📊 Channel: ${pushService.getChannel()}`)
}

// Run the tests
testPushNotificationService().catch(console.error)