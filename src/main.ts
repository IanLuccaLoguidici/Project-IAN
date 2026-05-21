import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

async function bootstrap() {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });

  // Capture unhandled process errors
  process.on('uncaughtException', (err) => {
    Sentry.captureException(err);
    console.error('Uncaught Exception:', err);
    // Give Sentry some time to send the event before exiting
    setTimeout(() => process.exit(1), 2000);
  });

  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason);
    console.error('Unhandled Rejection:', reason);
  });

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Apply Sentry Interceptor globally
  app.useGlobalInterceptors(new SentryInterceptor());

  // Enable URI Versioning (e.g., /v1/..., /v2/...)
  app.enableVersioning({
    type: VersioningType.URI,
  });

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
  SwaggerModule.setup('/', app, document);

  const port = process.env.PORT || configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();

