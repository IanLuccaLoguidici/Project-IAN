import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);

  // Replace NestJS default logger with Winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Security Middlewares
  app.use(helmet());

  // Configure CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || '*';
  app.enableCors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
    credentials: true,
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Project IAN API')
    .setDescription('NestJS CQRS Todos API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();

