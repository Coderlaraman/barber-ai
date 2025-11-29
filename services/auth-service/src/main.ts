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
    .setDescription('Endpoints de autenticación y gestión de usuarios')
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