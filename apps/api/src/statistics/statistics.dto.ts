import { IsString, ValidateIf } from 'class-validator';

export class StatisticsQuery {
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsString() from?: string;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsString() to?: string;
}
