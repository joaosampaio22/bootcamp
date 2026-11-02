import { Controller, Get, Inject, Module, Req, UseGuards } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FocusModule } from '../focus/focus.module.js';
import { FocusService } from '../focus/focus.service.js';
import { RETURN_INCLUDE } from '../continuity/continuity.service.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { ReviewsService } from '../reviews/reviews.service.js';

@Controller('dashboard') @UseGuards(AuthGuard)
class DashboardController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(FocusService) private readonly focus: FocusService, @Inject(ReviewsService) private readonly reviews: ReviewsService) {}
  @Get() async get(@Req() req: AuthenticatedRequest) {
    const activeSession = await this.focus.active(req.auth.userId);
    const nextReturnPoint = await this.prisma.returnPoint.findFirst({ where: { userId: req.auth.userId, status: 'OPEN' }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], include: RETURN_INCLUDE });
    return { activeSession, nextReturnPoint, dueReviewCount: await this.reviews.dueCount(req.auth.userId) };
  }
}
@Module({ imports: [AuthModule, PrismaModule, FocusModule, ReviewsModule], controllers: [DashboardController] })
export class DashboardModule {}
