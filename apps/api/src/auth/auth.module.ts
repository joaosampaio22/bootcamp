import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ClockService } from '../common/clock.service.js';
import { ENVIRONMENT } from '../common/environment.js';
import type { Environment } from '../common/environment.js';
import { AUTH_SETTINGS, readAuthSettings } from './auth-settings.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { PasswordService } from './password.service.js';
import { AuthController } from './auth.controller.js';
import { OriginGuard } from './origin.guard.js';
import { AuthRateGuard } from './auth-rate.guard.js';

@Module({
  imports: [PrismaModule], controllers: [AuthController],
  providers: [AuthService, AuthGuard, PasswordService, ClockService, AuthRateGuard,
    { provide: AUTH_SETTINGS, inject: [ENVIRONMENT], useFactory: (env: Environment) => readAuthSettings(process.env, env) },
    { provide: APP_GUARD, useClass: OriginGuard }],
  exports: [AuthGuard, AuthService, ClockService, AUTH_SETTINGS]
})
export class AuthModule {}
