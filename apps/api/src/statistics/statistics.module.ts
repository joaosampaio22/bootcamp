import { Controller, Get, Inject, Module, Query, Req, UseGuards } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StatisticsService } from './statistics.service.js';
import { StatisticsQuery } from './statistics.dto.js';

@Controller('statistics') @UseGuards(AuthGuard)
class StatisticsController {
  constructor(@Inject(StatisticsService) private readonly statistics: StatisticsService) {}
  @Get('summary') summary(@Req() req: AuthenticatedRequest, @Query() query: StatisticsQuery) { return this.statistics.summary(req.auth.userId,query); }
}

@Module({ imports: [AuthModule, PrismaModule], controllers: [StatisticsController], providers: [StatisticsService] })
export class StatisticsModule {}
