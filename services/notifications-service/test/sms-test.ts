import { ConfigService } from '@nestjs/config'
import { SMSService } from '../src/modules/notifications/services/sms.service'

// Mock ConfigService for testing
const mockConfigService = {
  get: (key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      'TWILIO_ACCOUNT_SID': null, // Will trigger mock behavior
      'TWILIO_AUTH_TOKEN': null,
      'TWILIO_FROM_NUMBER': null,
      'APP_NAME': 'Barbería',
      'year': new Date().getFullYear()
    }
    return config[key] ?? defaultValue
  }
} as ConfigService

// Mock ConfigService with Twilio credentials
const mockConfigServiceWithTwilio = {
  get: (key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      'TWILIO_ACCOUNT_SID': 'AC_mock_account_sid',
      'TWILIO_AUTH_TOKEN': 'mock_auth_token',
      'TWILIO_FROM_NUMBER': '+1234567890',
      'APP_NAME': 'Barbería',
      'year': new Date().getFullYear()
    }
    return config[key] ?? defaultValue
  }
} as ConfigService

async function testSMSService() {
  console.log('🚀 Testing SMS Service...\n')
  
  // Test 1: SMS without Twilio credentials (mock mode)
  console.log('📱 Test 1: SMS sin credenciales Twilio (modo mock)')
  try {
    const smsService = new SMSService(mockConfigService)
    const result = await smsService.sendSMS({
      to: '+1234567890',
      message: '¡Hola! Tu corte de cabello está confirmado para mañana a las 14:30. Gracias por elegir Barbería.'
    })
    console.log('✅ SMS enviado (mock):', result)
  } catch (error: any) {
    console.error('❌ SMS falló:', error.message)
  }

  // Test 2: Appointment confirmation SMS
  console.log('\n📱 Test 2: SMS de confirmación de cita')
  try {
    const smsService = new SMSService(mockConfigService)
    const result = await smsService.sendSMS({
      to: '+1234567890',
      message: `🎯 ¡CITA CONFIRMADA!\n\nHola Juan,\nTu corte de cabello está confirmado para:\n📅 Mañana 15 de diciembre\n🕐 14:30 horas\n📍 Barbería Premium\n\n¿Necesitas cancelar o reprogramar?\nLlámanos al 555-1234\n\n¡Te esperamos!`
    })
    console.log('✅ SMS de confirmación enviado:', result)
  } catch (error: any) {
    console.error('❌ SMS de confirmación falló:', error.message)
  }

  // Test 3: Appointment reminder SMS
  console.log('\n📱 Test 3: SMS de recordatorio de cita')
  try {
    const smsService = new SMSService(mockConfigService)
    const result = await smsService.sendSMS({
      to: '+1234567890',
      message: `⏰ RECORDATORIO\n\nHola Juan,\n\nTu corte de cabello es HOY:\n🕐 14:30 horas\n📍 Barbería Premium\n\nPor favor llega 5 minutos antes.\n\n¡Nos vemos pronto!`
    })
    console.log('✅ SMS de recordatorio enviado:', result)
  } catch (error: any) {
    console.error('❌ SMS de recordatorio falló:', error.message)
  }

  // Test 4: Promotional SMS
  console.log('\n📱 Test 4: SMS promocional')
  try {
    const smsService = new SMSService(mockConfigService)
    const result = await smsService.sendSMS({
      to: '+1234567890',
      message: `🎉 ¡OFERTA ESPECIAL!\n\nEste mes de diciembre:\n💈 Corte + Barba = $25\n(Normal: $35)\n\nReserva ahora y ahorra $10\n📞 555-1234\n\nVálido hasta 31/dic. No acumulable con otras promociones.`
    })
    console.log('✅ SMS promocional enviado:', result)
  } catch (error: any) {
    console.error('❌ SMS promocional falló:', error.message)
  }

  // Test 5: Bulk SMS
  console.log('\n📱 Test 5: SMS masivos (bulk)')
  try {
    const smsService = new SMSService(mockConfigService)
    const recipients = [
      '+1234567890',
      '+1234567891',
      '+1234567892',
      '+1234567893',
      '+1234567894'
    ]
    const result = await smsService.sendBulkSMS(
      recipients,
      `🎄 ¡FELICES FIESTAS!\n\nLa familia Barbería Premium les desea:\n✨ Feliz Navidad y próspero año nuevo\n\nGracias por confiar en nosotros.\n\nNos vemos en 2025 🎅`
    )
    console.log('✅ SMS masivos enviados:', result)
  } catch (error: any) {
    console.error('❌ SMS masivos fallaron:', error.message)
  }

  // Test 6: Invalid phone number
  console.log('\n📱 Test 6: Número de teléfono inválido')
  try {
    const smsService = new SMSService(mockConfigService)
    const result = await smsService.sendSMS({
      to: '123', // Invalid phone number
      message: 'Este mensaje no debería enviarse'
    })
    console.log('❌ SMS no debería haberse enviado:', result)
  } catch (error: any) {
    console.log('✅ Validación funcionó correctamente:', error.message)
  }

  // Test 7: SMS with Twilio credentials (simulated)
  console.log('\n📱 Test 7: SMS con credenciales Twilio (simulado)')
  try {
    const smsService = new SMSService(mockConfigServiceWithTwilio)
    console.log('ℹ️  Simulando envío con Twilio...')
    const result = await smsService.sendSMS({
      to: '+1234567890',
      message: 'Este es un mensaje de prueba con Twilio configurado'
    })
    console.log('✅ SMS con Twilio simulado:', result)
  } catch (error: any) {
    console.error('❌ SMS con Twilio falló:', error.message)
  }

  console.log('\n🎉 ¡Pruebas de SMS completadas!')
}

// Run the tests
testSMSService().catch(console.error)