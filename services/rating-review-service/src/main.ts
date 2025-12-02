import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Configuración global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Habilitar CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Configuración de Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BarberIA Rating & Reviews Service API')
    .setDescription('Endpoints de gestión de calificaciones y reseñas')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  
  // Endpoint para API Gateway
  app.getHttpAdapter().getInstance().get('/docs-json', (req: any, res: any) => {
    res.json(document);
  });

  const port = configService.get('PORT', 3008);
  await app.listen(port);
  
  console.log(`Rating & Reviews Service is running on: http://localhost:${port}`);
}

bootstrap();