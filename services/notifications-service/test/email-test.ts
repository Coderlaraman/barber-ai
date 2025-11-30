import { NestFactory } from '@nestjs/core'
import { NotificationsModule } from '../src/modules/notifications/notifications.module'
import { NotificationService } from '../src/modules/notifications/services/notification.service'
import { CreateNotificationDto } from '../src/modules/notifications/dto/create-notification.dto'
import { NotificationType, NotificationChannel } from '../src/modules/notifications/enums/notification.enum'

async function testEmailNotifications() {
  const app = await NestFactory.createApplicationContext(NotificationsModule)
  const notificationService = app.get(NotificationService)

  console.log('🚀 Testing Email Notification System...\n')

  // Test 1: Welcome email with template
  console.log('📧 Test 1: Welcome Email with Template')
  const welcomeNotification: CreateNotificationDto = {
    userId: 'test-user-123',
    type: NotificationType.WELCOME,
    channel: NotificationChannel.EMAIL,
    title: 'Bienvenido a Barbería',
    content: 'Gracias por registrarte en nuestra plataforma.',
    metadata: {
      email: 'test@example.com',
      userName: 'Juan Pérez',
      templateVariables: {
        userName: 'Juan Pérez',
        dashboardUrl: 'https://barberia.com/dashboard',
      }
    }
  }

  try {
    const notification = await notificationService.createNotification(welcomeNotification)
    console.log('✅ Welcome notification created:', notification.id)
    
    // Send the notification
    const results = await notificationService.sendNotification(notification)
    console.log('📤 Email sent result:', results)
  } catch (error: any) {
    console.error('❌ Welcome email failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Booking confirmation with template
  console.log('📧 Test 2: Booking Confirmation Email')
  const bookingNotification: CreateNotificationDto = {
    userId: 'test-user-456',
    type: NotificationType.APPOINTMENT_CONFIRMED,
    channel: NotificationChannel.EMAIL,
    title: 'Reserva Confirmada',
    content: 'Tu reserva ha sido confirmada exitosamente.',
    metadata: {
      email: 'cliente@example.com',
      userName: 'Carlos Rodríguez',
      templateVariables: {
        serviceName: 'Corte de Cabello + Barba',
        appointmentDate: '15 de diciembre, 2024',
        appointmentTime: '14:30',
        barberName: 'Luis Martínez',
        duration: '45',
        price: '$25.00',
        location: 'Barbería Principal, Calle 123 #45-67',
        cancelUrl: 'https://barberia.com/cancel/12345',
      }
    }
  }

  try {
    const notification = await notificationService.createNotification(bookingNotification)
    console.log('✅ Booking notification created:', notification.id)
    
    const results = await notificationService.sendNotification(notification)
    console.log('📤 Email sent result:', results)
  } catch (error: any) {
    console.error('❌ Booking confirmation failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Payment confirmation
  console.log('📧 Test 3: Payment Confirmation Email')
  const paymentNotification: CreateNotificationDto = {
    userId: 'test-user-789',
    type: NotificationType.PAYMENT_CONFIRMED,
    channel: NotificationChannel.EMAIL,
    title: 'Pago Confirmado',
    content: 'Tu pago ha sido procesado exitosamente.',
    metadata: {
      email: 'pagador@example.com',
      userName: 'María González',
      templateVariables: {
        serviceName: 'Tratamiento Capilar',
        amount: '$35.00',
        paymentMethod: 'Tarjeta de Crédito',
        paymentDate: '10 de diciembre, 2024',
        reference: 'PAY-2024-12345',
      }
    }
  }

  try {
    const notification = await notificationService.createNotification(paymentNotification)
    console.log('✅ Payment notification created:', notification.id)
    
    const results = await notificationService.sendNotification(notification)
    console.log('📤 Email sent result:', results)
  } catch (error: any) {
    console.error('❌ Payment confirmation failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 4: Simple inline email (no template)
  console.log('📧 Test 4: Simple Inline Email')
  const simpleNotification: CreateNotificationDto = {
    userId: 'test-user-000',
    type: NotificationType.PROMOTIONAL,
    channel: NotificationChannel.EMAIL,
    title: 'Promoción Especial',
    content: '<h2>¡Oferta Especial!</h2><p>Aprovecha nuestro descuento del 20% en todos los servicios esta semana.</p>',
    metadata: {
      email: 'promo@example.com',
      templateVariables: {
        discount: '20%',
        validUntil: '31 de diciembre',
      }
    }
  }

  try {
    const notification = await notificationService.createNotification(simpleNotification)
    console.log('✅ Simple notification created:', notification.id)
    
    const results = await notificationService.sendNotification(notification)
    console.log('📤 Email sent result:', results)
  } catch (error: any) {
    console.error('❌ Simple email failed:', error.message)
  }

  console.log('\n✅ All email tests completed!')
  
  // Show notification history
  console.log('\n📊 Notification History:')
  const history = await notificationService.getNotificationHistory('test-user-123', 10)
  console.log('Recent notifications:', history.map(n => ({
    id: n.id,
    type: n.type,
    status: n.status,
    createdAt: n.createdAt,
  })))

  await app.close()
}

// Run the tests
testEmailNotifications().catch(console.error)