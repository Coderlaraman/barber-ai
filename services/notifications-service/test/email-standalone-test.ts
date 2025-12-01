import { EmailService } from '../src/modules/notifications/services/email.service'
import { TemplateService } from '../src/modules/notifications/services/template.service'
import { NotificationType, NotificationChannel } from '../src/modules/notifications/enums/notification.enum'
import { ConfigService } from '@nestjs/config'

async function testEmailService() {
  console.log('🚀 Testing Email Service Standalone...\n')

  // Mock ConfigService for testing
  const mockConfigService = {
    get: (key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'SMTP_HOST': 'smtp.gmail.com',
        'SMTP_PORT': 587,
        'SMTP_SECURE': false,
        'SMTP_USER': null, // Will trigger mock transport
        'SMTP_PASSWORD': null,
        'SMTP_FROM': 'noreply@barber_ai.com',
        'APP_NAME': 'Barbería',
        'SUPPORT_EMAIL': 'support@barber_ai.com',
        'year': new Date().getFullYear()
      }
      return config[key] ?? defaultValue
    }
  } as ConfigService

  // Initialize services with mock dependencies
  const templateService = new TemplateService({} as any) // Pass empty mock repository
  const emailService = new EmailService(mockConfigService)

  // Test 1: Simple email with template
  console.log('📧 Test 1: Welcome Email with Template')
  try {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Bienvenido a Barbería',
      html: '<h1>Bienvenido a Barbería</h1><p>Hola Juan Pérez,</p><p>Gracias por registrarte. Tu cuenta ha sido creada exitosamente.</p><p>Puedes acceder a tu panel en: <a href="https://barberia.com/dashboard">https://barberia.com/dashboard</a></p>',
      text: 'Bienvenido a Barbería\n\nHola Juan Pérez,\n\nGracias por registrarte. Tu cuenta ha sido creada exitosamente.\n\nPuedes acceder a tu panel en: https://barberia.com/dashboard'
    })
    console.log('✅ Welcome email sent:', result)
  } catch (error: any) {
    console.error('❌ Welcome email failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Booking confirmation
  console.log('📧 Test 2: Booking Confirmation Email')
  try {
    const result = await emailService.sendEmail({
      to: 'cliente@example.com',
      subject: 'Reserva Confirmada',
      html: `<h1>¡Reserva Confirmada!</h1>
             <p>Hola Carlos Rodríguez,</p>
             <p>Tu cita ha sido confirmada:</p>
             <ul>
               <li><strong>Fecha:</strong> 15 de diciembre, 2024</li>
               <li><strong>Hora:</strong> 14:30</li>
               <li><strong>Barbero:</strong> Luis Martínez</li>
               <li><strong>Servicio:</strong> Corte de Cabello + Barba</li>
               <li><strong>Lugar:</strong> Barbería Principal, Calle 123 #45-67</li>
             </ul>
             <p>¡Te esperamos!</p>`,
      text: `¡Reserva Confirmada!\n\nHola Carlos Rodríguez,\n\nTu cita ha sido confirmada:\n\n• Fecha: 15 de diciembre, 2024\n• Hora: 14:30\n• Barbero: Luis Martínez\n• Servicio: Corte de Cabello + Barba\n• Lugar: Barbería Principal, Calle 123 #45-67\n\n¡Te esperamos!`
    })
    console.log('✅ Booking confirmation email sent:', result)
  } catch (error: any) {
    console.error('❌ Booking confirmation failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Payment confirmation
  console.log('📧 Test 3: Payment Confirmation Email')
  try {
    const result = await emailService.sendEmail({
      to: 'pagador@example.com',
      subject: 'Pago Confirmado',
      html: `<h1>¡Pago Confirmado!</h1>
             <p>Hola María González,</p>
             <p>Tu pago ha sido procesado exitosamente:</p>
             <ul>
               <li><strong>Concepto:</strong> Tratamiento Capilar</li>
               <li><strong>Monto:</strong> $35.00</li>
               <li><strong>Método de Pago:</strong> Tarjeta de Crédito</li>
               <li><strong>Fecha:</strong> 10 de diciembre, 2024</li>
             </ul>
             <p>Gracias por tu preferencia.</p>`,
      text: `¡Pago Confirmado!\n\nHola María González,\n\nTu pago ha sido procesado exitosamente:\n\n• Concepto: Tratamiento Capilar\n• Monto: $35.00\n• Método de Pago: Tarjeta de Crédito\n• Fecha: 10 de diciembre, 2024\n\nGracias por tu preferencia.`
    })
    console.log('✅ Payment confirmation email sent:', result)
  } catch (error: any) {
    console.error('❌ Payment confirmation failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 4: Simple HTML email (no template)
  console.log('📧 Test 4: Simple HTML Email')
  try {
    const result = await emailService.sendEmail({
      to: 'promo@example.com',
      subject: 'Promoción Especial',
      html: '<h2>¡Oferta Especial!</h2><p>Aprovecha nuestro descuento del 20% en todos los servicios esta semana.</p><p>¡Válido hasta el 31 de diciembre!</p>',
      text: '¡Oferta Especial! Aprovecha nuestro descuento del 20% en todos los servicios esta semana. ¡Válido hasta el 31 de diciembre!'
    })
    console.log('✅ Simple HTML email sent:', result)
  } catch (error: any) {
    console.error('❌ Simple email failed:', error.message)
  }

  console.log('\n✅ All email tests completed!')
}

// Run the tests
testEmailService().catch(console.error)