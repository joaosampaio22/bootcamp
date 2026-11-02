import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { ContentsService } from './contents.service.js';
import { ContentQuery, CreateContentDto, UpdateContentDto } from './content.dto.js';

@Controller('contents') @UseGuards(AuthGuard)
export class ContentsController {
  constructor(@Inject(ContentsService) private readonly contents: ContentsService) {}
  @Get() list(@Req() req: AuthenticatedRequest, @Query() query: ContentQuery) { return this.contents.list(req.auth.userId, query); }
  @Get(':id') get(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.contents.get(req.auth.userId, id); }
  @Post() create(@Req() req: AuthenticatedRequest, @Body() dto: CreateContentDto) { return this.contents.create(req.auth.userId, dto); }
  @Patch(':id') update(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: UpdateContentDto) { return this.contents.update(req.auth.userId, id, dto); }
}
