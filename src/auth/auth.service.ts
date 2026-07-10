import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Redis } from 'ioredis';

@Injectable()
export class AuthService {
  private redisClient: Redis;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.usersService.create(
      registerDto.email,
      passwordHash,
      registerDto.name,
    );

    return {
      id: user._id,
      email: user.email,
      name: user.name,
    };
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from google');
    }

    const { email, firstName, lastName } = req.user;
    const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || email;

    const user = await this.usersService.findOrCreateOAuthUser(email, name);

    return this.generateTokens(user._id.toString(), user.email);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user._id.toString(), user.email);
  }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const access_token = this.jwtService.sign(payload);
    // Refresh tokens valid for 7 days
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
    
    // Hash refresh token for DB storage
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(refresh_token, salt);
    await this.usersService.updateRefreshToken(userId, hash);

    return {
      access_token,
      refresh_token,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const userId = payload.sub;
      
      const user = await this.usersService.findById(userId);
      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Access denied');
      }
      
      const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isMatch) {
        throw new UnauthorizedException('Access denied');
      }
      
      return this.generateTokens(user._id.toString(), user.email);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async generateApiKey(userId: string): Promise<{ apiKey: string }> {
    // Generate robust raw hex string (32 bytes = 64 characters)
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    
    await this.usersService.addApiKey(userId, keyHash);
    
    // We only send it raw once to the user (like AWS/GitHub APIs)
    return { apiKey: rawKey };
  }

  async sendMagicLink(email: string): Promise<void> {
    const token = crypto.randomUUID();
    // Cache map: token -> email over 900 seconds TTL (15 minutes)
    await this.redisClient.setex(`magic-link:${token}`, 900, email);
    
    const magicUrl = `http://localhost:3000/auth/verify?token=${token}`;
    await this.emailQueue.add('send-magic-link', { email, url: magicUrl });
  }

  async verifyMagicLink(token: string) {
    const email = await this.redisClient.get(`magic-link:${token}`);
    
    if (!email) {
      throw new UnauthorizedException('Token de acceso mágico inválido o caducado');
    }
    
    // Self-destruct single-use token immediately
    await this.redisClient.del(`magic-link:${token}`);
    
    // Creates shell-user automatically if doesn't exist
    const user = await this.usersService.findOrCreateOAuthUser(email, email.split('@')[0]);
    
    return this.generateTokens(user._id.toString(), user.email);
  }
}
