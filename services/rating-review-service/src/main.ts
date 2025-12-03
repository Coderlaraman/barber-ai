import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.enableCors()
  
  const config = new DocumentBuilder()
    .setTitle('Rating & Review Service')
    .setDescription('API for managing ratings and reviews')
    .setVersion('1.0')
    .build()
    
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('ratings/docs', app, document)

  app.getHttpAdapter().get('/ratings/health', (req, res) => {
    res.json({ status: 'ok', service: 'rating-review' })
  })

  app.getHttpAdapter().get('/docs-json', (req, res) => {
    res.json(document)
  })

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3008)
  console.log(`Rating service running on port ${process.env.PORT || 3008}`)
}
bootstrap()
