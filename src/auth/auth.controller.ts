import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { SessionService } from './session.service';
import { LoginDto } from './dto/login.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import * as express from 'express';
import { RedisSessionGuard } from './redis-session.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly sessionService: SessionService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req) {
    const userId = req.user.userId || req.user.sub || req.user.id;
    await this.authService.logout(userId);
    return { message: 'Tokens revoked successfully' };
  }

  @Post('api-key')
  @UseGuards(JwtAuthGuard)
  async createApiKey(@Req() req) {
    const userId = req.user.userId || req.user.sub || req.user.id;
    return this.authService.generateApiKey(userId);
  }

  @Post('magic-link')
  async sendMagicLink(@Body() dto: MagicLinkDto) {
    await this.authService.sendMagicLink(dto.email);
    return { message: 'El enlace relámpago ha sido despachado hacia el correo' };
  }

  @Get('verify')
  async verifyMagicLink(@Query('token') token: string) {
    return this.authService.verifyMagicLink(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('session-login')
  async sessionLogin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = await this.authService.validateUserForSession(loginDto);
    const sessionId = await this.sessionService.create(user.userId);
    
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: false, // Localhost dev
      path: '/',
      maxAge: 3600 * 1000,
    });

    return { message: 'Inicio de sesión por Redis exitoso' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('session-logout')
  async sessionLogout(
    @Req() req: any,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, pair) => {
        const [key, val] = pair.split('=');
        if (key && val) acc[key.trim()] = val.trim();
        return acc;
      }, {} as Record<string, string>);
      
      const sessionId = cookies['sessionId'];
      if (sessionId) {
        await this.sessionService.destroy(sessionId);
      }
    }

    res.clearCookie('sessionId', { path: '/' });
    return { message: 'Sesión finalizada y cookie eliminada' };
  }

  @Get('session-profile')
  @UseGuards(RedisSessionGuard)
  getSessionProfile(@Req() req: any) {
    return req.user;
  }
}
