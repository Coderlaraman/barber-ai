import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppDevModule } from './modules/app.dev.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppDevModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  
  // Configuración mejorada de Swagger
  const config = new DocumentBuilder()
    .setTitle('BarberIA Portfolio API')
    .setDescription(`
      ## API de Gestión de Portafolio
      
      Esta API permite gestionar el portafolio de trabajos de los barberos, incluyendo:
      - Crear nuevos elementos de portafolio
      - Consultar el portafolio de un barbero
      - Buscar elementos por etiquetas o título
      - Eliminar elementos del portafolio
      
      ### Autenticación
      Actualmente esta API no requiere autenticación (en desarrollo).
      
      ### Formatos de respuesta
      - **Éxito**: Código 2xx con datos solicitados
      - **Error**: Código 4xx/5xx con mensaje descriptivo
      
      ### Convenciones
      - Todos los IDs son UUID v4
      - Las fechas están en formato ISO 8601
      - Las etiquetas (tags) son strings en minúsculas sin espacios
    `)
    .setVersion('0.1.0')
    .setContact(
      'BarberIA Team',
      'https://github.com/barberia',
      'support@barberia.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .setExternalDoc('Documentación adicional', 'https://docs.barberia.com')
    .addServer('http://localhost:3004', 'Servidor de desarrollo')
    .addServer('https://api.barberia.com', 'Servidor de producción')
    .build()
  
  const document = SwaggerModule.createDocument(app, config)
  
  // Configuración personalizada del UI de Swagger
  const swaggerOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      tryItOutEnabled: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete'],
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { display: none }
      .swagger-ui .opblock-summary-method { font-weight: bold }
    `,
    customSiteTitle: 'BarberIA Portfolio API Documentation',
  }
  
  SwaggerModule.setup('docs', app, document, swaggerOptions)
  
  // Endpoint adicional para obtener el documento JSON
  app.getHttpAdapter().getInstance().get('/docs-json', (req: any, res: any) => {
    res.json(document)
  })
  
  // Información de inicio
  const port = process.env.PORT ? Number(process.env.PORT) : 3004
  await app.listen(port)
  
  console.log(`🚀 Portfolio service running on port ${port}`)
  console.log(`📚 Swagger documentation available at http://localhost:${port}/docs`)
  console.log(`📄 API JSON available at http://localhost:${port}/docs-json`)
}

bootstrap()