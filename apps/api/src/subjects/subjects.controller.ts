import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { CreateSubjectDto, UpdateSubjectDto } from './subject.dto.js';
import { SubjectsService } from './subjects.service.js';

export class SubjectQuery {
  @IsOptional() @IsIn(['true', 'false']) archived = 'false';
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}

@Controller('subjects') @UseGuards(AuthGuard)
export class SubjectsController {
  constructor(@Inject(SubjectsService) private readonly subjects: SubjectsService) {}
  @Get()
  list(@Req() req: AuthenticatedRequest, @Query() query: SubjectQuery) {
    return this.subjects.list(req.auth.userId, query.archived === 'true', query.page, query.pageSize);
  }
  @Get(':id')
  get(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.subjects.get(req.auth.userId, id); }
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateSubjectDto) { return this.subjects.create(req.auth.userId, dto); }
  @Patch(':id')
  update(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: UpdateSubjectDto) { return this.subjects.update(req.auth.userId, id, dto); }
}
