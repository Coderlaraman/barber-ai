import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Request } from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  const config = new DocumentBuilder()
    .setTitle('BarberIA API Gateway')
    .setDescription('Documentación de rutas públicas y proxy hacia microservicios')
    .setVersion('0.1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
  app.use(
    '/auth',
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/auth') ? path : `/auth${path}`)
    })
  )
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 8080)
}

bootstrap()
