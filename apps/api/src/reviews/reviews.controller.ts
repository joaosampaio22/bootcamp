import { Body, Controller, Get, Headers, Inject, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { ReviewsService } from './reviews.service.js';
import { AttemptDto, ReviewPageQuery, ReviewQueueQuery } from './review.dto.js';

@Controller('reviews') @UseGuards(AuthGuard)
export class ReviewsController {
  constructor(@Inject(ReviewsService) private readonly reviews: ReviewsService) {}
  @Get('due') due(@Req() req: AuthenticatedRequest, @Query() query: ReviewQueueQuery) { return this.reviews.queue(req.auth.userId, false, query); }
  @Get('upcoming') upcoming(@Req() req: AuthenticatedRequest, @Query() query: ReviewQueueQuery) { return this.reviews.queue(req.auth.userId, true, query); }
  @Get(':id') get(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.reviews.get(req.auth.userId, id); }
  @Get(':id/history') history(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Query() query: ReviewPageQuery) { return this.reviews.history(req.auth.userId, id, query); }
  @Post(':id/attempts') attempt(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: AttemptDto, @Headers('idempotency-key') key?: string) { return this.reviews.attempt(req.auth.userId, id, dto, key); }
}
