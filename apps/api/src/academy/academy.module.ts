import { Controller, Get, Inject, Module, Query, Req, UseGuards } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AcademyService } from './academy.service.js';
import { RewardQuery } from './academy.dto.js';

@Controller('academy') @UseGuards(AuthGuard)
class AcademyController {
  constructor(@Inject(AcademyService) private readonly academy: AcademyService) {}
  @Get() get(@Req() req: AuthenticatedRequest) { return this.academy.get(req.auth.userId); }
  @Get('events') events(@Req() req: AuthenticatedRequest, @Query() query: RewardQuery) { return this.academy.events(req.auth.userId,query); }
}

@Module({ imports: [AuthModule, PrismaModule], controllers: [AcademyController], providers: [AcademyService], exports: [AcademyService] })
export class AcademyModule {}
