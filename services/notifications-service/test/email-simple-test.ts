import { ConfigService } from '@nestjs/config'
import { EmailService } from '../src/modules/notifications/services/email.service'

// Create a mock ConfigService
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

async function testEmailService() {
  console.log('🚀 Testing Email Service Standalone...\n')

  // Initialize email service with mock config
  const emailService = new EmailService(mockConfigService)

  // Test 1: Welcome email with template
  console.log('📧 Test 1: Welcome Email with Template')
  try {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Bienvenido a Barbería',
      html: '<p>Default HTML content</p>', // Required field, will be replaced by template
      template: 'welcome',
      templateVariables: {
        userName: 'Juan Pérez',
        dashboardUrl: 'https://barberia.com/dashboard',
      }
    })
    console.log('✅ Welcome email sent:', result)
  } catch (error: any) {
    console.error('❌ Welcome email failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Simple HTML email (no template)
  console.log('📧 Test 2: Simple HTML Email')
  try {
    const result = await emailService.sendEmail({
      to: 'cliente@example.com',
      subject: 'Reserva Confirmada',
      html: '<h2>¡Reserva Confirmada!</h2><p>Tu corte de cabello está confirmado para el 15 de diciembre a las 14:30 con Luis Martínez.</p>',
      text: '¡Reserva Confirmada! Tu corte de cabello está confirmado para el 15 de diciembre a las 14:30 con Luis Martínez.'
    })
    console.log('✅ Simple HTML email sent:', result)
  } catch (error: any) {
    console.error('❌ Simple HTML email failed:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Template with variables in HTML
  console.log('📧 Test 3: Template Variables in HTML')
  try {
    const result = await emailService.sendEmail({
      to: 'pagador@example.com',
      subject: 'Pago Confirmado - {{serviceName}}',
      html: `
        <h2>¡Hola {{userName}}!</h2>
        <p>Tu pago ha sido procesado exitosamente:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalles del pago:</h3>
          <p><strong>Servicio:</strong> {{serviceName}}</p>
          <p><strong>Monto:</strong> {{amount}}</p>
          <p><strong>Método:</strong> {{paymentMethod}}</p>
          <p><strong>Fecha:</strong> {{date}}</p>
        </div>
        <p>Gracias por tu preferencia.</p>
      `,
      templateVariables: {
        userName: 'María González',
        serviceName: 'Tratamiento Capilar',
        amount: '$35.00',
        paymentMethod: 'Tarjeta de Crédito',
        date: '10 de diciembre, 2024',
      }
    })
    console.log('✅ Template variables email sent:', result)
  } catch (error: any) {
    console.error('❌ Template variables email failed:', error.message)
  }

  console.log('\n✅ All email tests completed!')
}

// Run the tests
testEmailService().catch(console.error)