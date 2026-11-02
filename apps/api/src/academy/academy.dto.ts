import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min, ValidateIf } from 'class-validator';

export class RewardQuery {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsIn(['FOCUS_SESSION','REVIEW_ATTEMPT']) sourceType?: 'FOCUS_SESSION' | 'REVIEW_ATTEMPT';
}
