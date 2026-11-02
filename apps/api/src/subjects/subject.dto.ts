import { Transform } from 'class-transformer';
import { IsBoolean, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class CreateSubjectDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}

export class UpdateSubjectDto {
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  archived?: boolean;
}
