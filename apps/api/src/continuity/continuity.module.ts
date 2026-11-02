import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ContinuityController } from './continuity.controller.js';
import { ContinuityService } from './continuity.service.js';
@Module({ imports: [AuthModule, PrismaModule], controllers: [ContinuityController], providers: [ContinuityService] })
export class ContinuityModule {}
