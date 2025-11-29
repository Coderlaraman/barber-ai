import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as swaggerUi from 'swagger-ui-express'

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
  const expressApp = app.getHttpAdapter().getInstance()
  expressApp.use('/docs/scheduler', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/scheduler' }
  }))
  expressApp.use('/docs/notifications', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/notifications' }
  }))
  expressApp.use('/docs/portfolio', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/portfolio' }
  }))
  expressApp.use('/docs/search', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/search' }
  }))
  expressApp.use('/docs/ranking', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/ranking' }
  }))
  app.use(
    '/docs-json/scheduler',
    createProxyMiddleware({
      target: 'http://scheduler-service:3002',
      changeOrigin: true,
      pathRewrite: { '^/docs-json/scheduler': '/docs-json' }
    })
  )
  app.use(
    '/docs-json/notifications',
    createProxyMiddleware({
      target: 'http://notifications-service:3003',
      changeOrigin: true,
      pathRewrite: { '^/docs-json/notifications': '/docs-json' }
    })
  )
  app.use(
    '/docs-json/portfolio',
    createProxyMiddleware({
      target: 'http://portfolio-service:3004',
      changeOrigin: true,
      pathRewrite: { '^/docs-json/portfolio': '/docs-json' }
    })
  )
  app.use(
    '/docs-json/search',
    createProxyMiddleware({
      target: 'http://search-service:3005',
      changeOrigin: true,
      pathRewrite: { '^/docs-json/search': '/docs-json' }
    })
  )
  app.use(
    '/docs-json/ranking',
    createProxyMiddleware({
      target: 'http://ranking-service:3006',
      changeOrigin: true,
      pathRewrite: { '^/docs-json/ranking': '/docs-json' }
    })
  )
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
