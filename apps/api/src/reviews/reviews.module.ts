import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RewardsModule } from '../rewards/rewards.module.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({ imports: [AuthModule, PrismaModule, RewardsModule], controllers: [ReviewsController], providers: [ReviewsService], exports: [ReviewsService] })
export class ReviewsModule {}
