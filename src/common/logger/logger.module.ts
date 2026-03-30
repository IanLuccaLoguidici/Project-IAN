import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { createWinstonConfig } from './logger.config';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logLevel = config.get<string>('LOG_LEVEL', 'info');
        const isProduction =
          config.get<string>('NODE_ENV') === 'production';
        return createWinstonConfig(logLevel, isProduction);
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
