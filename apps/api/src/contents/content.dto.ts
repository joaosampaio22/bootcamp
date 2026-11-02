import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsString, IsUrl, IsUUID, Max, MaxLength, Min, MinLength, registerDecorator, ValidateIf } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const link = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() || null : value;
export function isCivilDate(value: unknown): boolean {
  return typeof value === 'string' && /^[1-9]\d{3}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0,10) === value;
}
function IsCivilDate(): PropertyDecorator {
  return (target, key) => registerDecorator({ name: 'isCivilDate', target: target.constructor, propertyName: String(key), validator: { validate: isCivilDate, defaultMessage: () => 'Informe uma data civil válida no formato YYYY-MM-DD.' } });
}
export class CreateContentDto {
  @IsUUID('4') subjectId!: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(160) title!: string;
  @IsString() @MaxLength(10000) notes = '';
  @Transform(link) @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null)
  @IsUrl({ protocols: ['http','https'], require_protocol: true, require_tld: false, disallow_auth: true }) materialUrl?: string | null;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsCivilDate() studiedOn?: string;
  @IsBoolean() reviewEnabled = true;
}
export class UpdateContentDto {
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsUUID('4') subjectId?: string;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @Transform(trim) @IsString() @MinLength(1) @MaxLength(160) title?: string;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsString() @MaxLength(10000) notes?: string;
  @Transform(link) @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null)
  @IsUrl({ protocols: ['http','https'], require_protocol: true, require_tld: false, disallow_auth: true }) materialUrl?: string | null;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsCivilDate() studiedOn?: string;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsBoolean() reviewEnabled?: boolean;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsBoolean() archived?: boolean;
}
export class ContentQuery {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsIn(['true','false']) archived = 'false';
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsUUID('4') subjectId?: string;
  @Transform(trim) @IsString() @MaxLength(200) q = '';
}
