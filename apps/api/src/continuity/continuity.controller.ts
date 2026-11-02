import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { ContinuityService } from './continuity.service.js';
import { CreateReturnPointDto, ReturnPointQuery, UpdateReturnPointDto } from './return-point.dto.js';
@Controller('return-points') @UseGuards(AuthGuard)
export class ContinuityController {
  constructor(@Inject(ContinuityService) private readonly continuity: ContinuityService) {}
  @Get() list(@Req() req: AuthenticatedRequest, @Query() query: ReturnPointQuery) { return this.continuity.list(req.auth.userId, query); }
  @Get(':id') get(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.continuity.get(req.auth.userId, id); }
  @Post() create(@Req() req: AuthenticatedRequest, @Body() dto: CreateReturnPointDto) { return this.continuity.create(req.auth.userId, dto); }
  @Patch(':id') update(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: UpdateReturnPointDto) { return this.continuity.update(req.auth.userId, id, dto); }
}
