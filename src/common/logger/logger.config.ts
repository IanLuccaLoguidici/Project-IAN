import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export function createWinstonConfig(
  logLevel = 'info',
  isProduction = false,
): winston.LoggerOptions {

  const transports: winston.transport[] = [
    isProduction
      ? new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        })
      : new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('ProjectIAN', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
  ];

  return {
    level: logLevel,
    transports,
  };
}
