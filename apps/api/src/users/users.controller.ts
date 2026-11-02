import { Body, Controller, Inject, Patch, Req, UseGuards } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PUBLIC_USER } from '../auth/auth.service.js';
import { IsIanaTimeZone } from '../common/iana-time-zone.js';

export class UpdateProfileDto {
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined)
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(1) @MaxLength(100) name?: string;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined)
  @IsIanaTimeZone() timeZone?: string;
}

@Controller('users') @UseGuards(AuthGuard)
export class UsersController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  @Patch('me')
  update(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id: req.auth.userId }, data: dto, select: PUBLIC_USER });
  }
}
