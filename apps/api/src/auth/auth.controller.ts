import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import type { AuthenticatedRequest } from './auth.guard.js';
import { AuthRateGuard } from './auth-rate.guard.js';
import { LoginDto, RegisterDto } from './auth.dto.js';
import { AUTH_SETTINGS } from './auth-settings.js';
import type { AuthSettings } from './auth-settings.js';
import { SESSION_TTL_SECONDS } from './session-token.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService, @Inject(AUTH_SETTINGS) private readonly settings: AuthSettings) {}

  private respond(result: Awaited<ReturnType<AuthService['login']>>, response: Response) {
    response.cookie(this.settings.cookieName, result.token, {
      httpOnly: true, secure: this.settings.secure, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS * 1000
    });
    response.setHeader('Cache-Control', 'no-store');
    return { user: result.user, csrfToken: result.identity.csrfToken };
  }

  @Post('register') @UseGuards(AuthRateGuard)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    return this.respond(await this.auth.register(dto), response);
  }

  @Post('login') @HttpCode(200) @UseGuards(AuthRateGuard)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.respond(await this.auth.login(dto), response);
  }

  @Get('me') @UseGuards(AuthGuard)
  me(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return { user: req.user, csrfToken: req.auth.csrfToken };
  }

  @Post('logout') @HttpCode(204) @UseGuards(AuthGuard)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(req.auth);
    response.clearCookie(this.settings.cookieName, { httpOnly: true, secure: this.settings.secure, sameSite: 'lax', path: '/' });
    response.setHeader('Cache-Control', 'no-store');
  }
}
