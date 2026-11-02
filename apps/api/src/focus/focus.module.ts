import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FocusService } from './focus.service.js';
import { FocusController } from './focus.controller.js';
import { RewardsService } from '../rewards/rewards.service.js';

@Module({ imports: [AuthModule, PrismaModule], controllers: [FocusController], providers: [FocusService, RewardsService], exports: [FocusService] })
export class FocusModule {}
