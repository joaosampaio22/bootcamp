import { Body, Controller, Get, Headers, HttpCode, Inject, Param, ParseUUIDPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { FinishFocusDto, FocusHistoryQuery, ReconcileFocusDto, StartFocusDto, TransitionDto } from './focus.dto.js';
import { FocusService } from './focus.service.js';

@Controller('focus-sessions') @UseGuards(AuthGuard)
export class FocusController {
  constructor(@Inject(FocusService) private readonly focus: FocusService) {}
  @Post()
  start(@Req() req: AuthenticatedRequest, @Body() dto: StartFocusDto) { return this.focus.start(req.auth.userId, dto); }
  @Get('active')
  async active(@Req() req: AuthenticatedRequest, @Res() response: Response) { response.json(await this.focus.active(req.auth.userId)); }
  @Get()
  history(@Req() req: AuthenticatedRequest, @Query() query: FocusHistoryQuery) { return this.focus.history(req.auth.userId, query.page, query.pageSize); }
  @Post(':id/pause') @HttpCode(200)
  pause(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: TransitionDto) { return this.focus.change(req.auth.userId, id, 'pause', dto); }
  @Post(':id/resume') @HttpCode(200)
  resume(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: TransitionDto) { return this.focus.change(req.auth.userId, id, 'resume', dto); }
  @Post(':id/finish') @HttpCode(200)
  finish(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: FinishFocusDto, @Headers('idempotency-key') key?: string) { return this.focus.finish(req.auth.userId, id, 'finish', dto, key); }
  @Post(':id/reconcile') @HttpCode(200)
  reconcile(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: ReconcileFocusDto, @Headers('idempotency-key') key?: string) { return this.focus.finish(req.auth.userId, id, 'reconcile', dto, key); }
}
