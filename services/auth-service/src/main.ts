import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidUnknownValues: true, transform: true })
  )
  const config = new DocumentBuilder()
    .setTitle('BarberIA Auth API')
    .setDescription(`
      Endpoints de autenticación y gestión de usuarios
      
      ## Características de Seguridad
      
      ### Auditoría de Accesos
      - **Registro completo de eventos**: Login, logout, registro, refresco de tokens
      - **Seguimiento de intentos fallidos**: Monitoreo de credenciales inválidas
      - **Información contextual**: IP, user agent, timestamp de cada evento
      - **Detección de actividad sospechosa**: Alertas por múltiples intentos fallidos
      
      ### Tokens JWT
      - **Access tokens**: Válidos por 15 minutos, contienen permisos del usuario
      - **Refresh tokens**: Válidos por 7 días, permiten renovar access tokens
      - **Revocación**: Los tokens pueden ser invalidados en caso de compromiso
      
      ### Roles y Permisos
      - **CLIENT**: Usuarios finales del sistema
      - **BARBER**: Barberos con acceso a gestión de servicios
      - **ADMIN**: Administradores con acceso completo al sistema
    `)
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
  app.getHttpAdapter().getInstance().get('/docs-json', (req: any, res: any) => {
    res.json(document)
  })
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001)
}

bootstrap()