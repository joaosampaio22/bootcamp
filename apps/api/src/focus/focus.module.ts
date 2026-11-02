import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FocusService } from './focus.service.js';
import { FocusController } from './focus.controller.js';
import { RewardsModule } from '../rewards/rewards.module.js';

@Module({ imports: [AuthModule, PrismaModule, RewardsModule], controllers: [FocusController], providers: [FocusService], exports: [FocusService] })
export class FocusModule {}
