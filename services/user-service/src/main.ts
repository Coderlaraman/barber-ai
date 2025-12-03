import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Configuración de Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BarberIA User Service API')
    .setDescription('Endpoints de gestión de usuarios y perfiles')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  
  // Endpoint para API Gateway
  app.getHttpAdapter().getInstance().get('/docs-json', (req: any, res: any) => {
    res.json(document);
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`User Service is running on: http://localhost:${port}`);
}

bootstrap();