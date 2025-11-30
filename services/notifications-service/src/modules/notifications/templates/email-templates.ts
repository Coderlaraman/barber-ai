export interface EmailTemplate {
  name: string
  subject: string
  htmlTemplate: string
  textTemplate?: string
}

export const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    name: 'welcome',
    subject: 'Bienvenido a {{appName}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{appName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido a {{appName}}!</h1>
        </div>
        <div class="content">
            <h2>Hola {{userName}},</h2>
            <p>Gracias por unirte a {{appName}}. Estamos emocionados de tenerte con nosotros.</p>
            <p>Para comenzar, te recomendamos explorar nuestras funciones principales:</p>
            <ul>
                <li>Reserva citas en línea</li>
                <li>Administra tu perfil</li>
                <li>Recibe notificaciones importantes</li>
            </ul>
            <a href="{{dashboardUrl}}" class="button">Ir al Dashboard</a>
        </div>
        <div class="footer">
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>© {{year}} {{appName}}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `,
    textTemplate: `
Hola {{userName}},

Gracias por unirte a {{appName}}. Estamos emocionados de tenerte con nosotros.

Para comenzar, te recomendamos explorar nuestras funciones principales:
- Reserva citas en línea
- Administra tu perfil  
- Recibe notificaciones importantes

Visita tu dashboard: {{dashboardUrl}}

Si tienes alguna pregunta, no dudes en contactarnos.

© {{year}} {{appName}}. Todos los derechos reservados.
    `
  },

  booking_confirmation: {
    name: 'booking_confirmation',
    subject: 'Confirmación de reserva - {{serviceName}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Reserva</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .detail-item { margin-bottom: 10px; }
        .detail-label { font-weight: bold; color: #555; }
        .button { display: inline-block; background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Reserva Confirmada!</h1>
        </div>
        <div class="content">
            <h2>Hola {{userName}},</h2>
            <p>Tu reserva ha sido confirmada exitosamente. Aquí están los detalles:</p>
            
            <div class="details">
                <div class="detail-item">
                    <span class="detail-label">Servicio:</span> {{serviceName}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fecha:</span> {{appointmentDate}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Hora:</span> {{appointmentTime}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Barbero:</span> {{barberName}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duración:</span> {{duration}} minutos
                </div>
                <div class="detail-item">
                    <span class="detail-label">Precio:</span> {{price}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ubicación:</span> {{location}}
                </div>
            </div>

            <p>Te recordamos que puedes cancelar o reprogramar tu cita hasta 24 horas antes.</p>
            
            <a href="{{cancelUrl}}" class="button">Cancelar Reserva</a>
        </div>
        <div class="footer">
            <p>Gracias por confiar en nosotros.</p>
            <p>© {{year}} {{appName}}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `,
    textTemplate: `
Hola {{userName}},

Tu reserva ha sido confirmada exitosamente. Aquí están los detalles:

Servicio: {{serviceName}}
Fecha: {{appointmentDate}}
Hora: {{appointmentTime}}
Barbero: {{barberName}}
Duración: {{duration}} minutos
Precio: {{price}}
Ubicación: {{location}}

Te recordamos que puedes cancelar o reprogramar tu cita hasta 24 horas antes.

Para cancelar tu reserva, visita: {{cancelUrl}}

Gracias por confiar en nosotros.

© {{year}} {{appName}}. Todos los derechos reservados.
    `
  },

  booking_reminder: {
    name: 'booking_reminder',
    subject: 'Recordatorio: {{serviceName}} mañana',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recordatorio de Reserva</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f39c12; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .detail-item { margin-bottom: 10px; }
        .detail-label { font-weight: bold; color: #555; }
        .button { display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Recordatorio de Reserva</h1>
        </div>
        <div class="content">
            <h2>Hola {{userName}},</h2>
            <p>Este es un recordatorio amistoso de tu cita programada para mañana:</p>
            
            <div class="details">
                <div class="detail-item">
                    <span class="detail-label">Servicio:</span> {{serviceName}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fecha:</span> {{appointmentDate}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Hora:</span> {{appointmentTime}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Barbero:</span> {{barberName}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ubicación:</span> {{location}}
                </div>
            </div>

            <p>Por favor llega 10 minutos antes de tu cita.</p>
            <p>Si necesitas cancelar o reprogramar, hazlo con al menos 24 horas de anticipación.</p>
            
            <a href="{{rescheduleUrl}}" class="button">Reprogramar Cita</a>
        </div>
        <div class="footer">
            <p>¡Te esperamos!</p>
            <p>© {{year}} {{appName}}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `,
    textTemplate: `
Hola {{userName}},

Este es un recordatorio amistoso de tu cita programada para mañana:

Servicio: {{serviceName}}
Fecha: {{appointmentDate}}
Hora: {{appointmentTime}}
Barbero: {{barberName}}
Ubicación: {{location}}

Por favor llega 10 minutos antes de tu cita.
Si necesitas cancelar o reprogramar, hazlo con al menos 24 horas de anticipación.

Para reprogramar, visita: {{rescheduleUrl}}

¡Te esperamos!

© {{year}} {{appName}}. Todos los derechos reservados.
    `
  },

  payment_confirmation: {
    name: 'payment_confirmation',
    subject: 'Confirmación de Pago - {{serviceName}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Pago</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .detail-item { margin-bottom: 10px; }
        .detail-label { font-weight: bold; color: #555; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Pago Confirmado</h1>
        </div>
        <div class="content">
            <h2>Hola {{userName}},</h2>
            <p>Tu pago ha sido procesado exitosamente. Aquí están los detalles:</p>
            
            <div class="details">
                <div class="detail-item">
                    <span class="detail-label">Servicio:</span> {{serviceName}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Monto Pagado:</span> {{amount}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Método de Pago:</span> {{paymentMethod}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fecha de Pago:</span> {{paymentDate}}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Referencia:</span> {{reference}}
                </div>
            </div>

            <p>Gracias por tu preferencia. Tu cita está confirmada.</p>
        </div>
        <div class="footer">
            <p>Si tienes alguna pregunta sobre este pago, no dudes en contactarnos.</p>
            <p>© {{year}} {{appName}}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `,
    textTemplate: `
Hola {{userName}},

Tu pago ha sido procesado exitosamente. Aquí están los detalles:

Servicio: {{serviceName}}
Monto Pagado: {{amount}}
Método de Pago: {{paymentMethod}}
Fecha de Pago: {{paymentDate}}
Referencia: {{reference}}

Gracias por tu preferencia. Tu cita está confirmada.

Si tienes alguna pregunta sobre este pago, no dudes en contactarnos.

© {{year}} {{appName}}. Todos los derechos reservados.
    `
  }
}