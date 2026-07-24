import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { EmailProcessor } from './processors/email.processor';

@Module({
  imports: [
    RedisModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [AuthService, SessionService, JwtStrategy, GoogleStrategy, EmailProcessor],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
