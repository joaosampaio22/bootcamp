import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsString, IsUrl, IsUUID, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const link = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() || null : value;
export class CreateReturnPointDto {
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null) @IsUUID('4') subjectId?: string | null;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null) @IsUUID('4') contentId?: string | null;
  @IsString() @MaxLength(2000) context = '';
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(500) nextAction!: string;
  @Transform(link) @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null)
  @IsUrl({ protocols: ['http','https'], require_protocol: true, require_tld: false, disallow_auth: true }) materialUrl?: string | null;
}
export class UpdateReturnPointDto {
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null) @IsUUID('4') subjectId?: string | null;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null) @IsUUID('4') contentId?: string | null;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsString() @MaxLength(2000) context?: string;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @Transform(trim) @IsString() @MinLength(1) @MaxLength(500) nextAction?: string;
  @Transform(link) @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null)
  @IsUrl({ protocols: ['http','https'], require_protocol: true, require_tld: false, disallow_auth: true }) materialUrl?: string | null;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsIn(['OPEN','DONE']) status?: 'OPEN' | 'DONE';
}
export class ReturnPointQuery {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsIn(['OPEN','DONE']) status: 'OPEN' | 'DONE' = 'OPEN';
}
