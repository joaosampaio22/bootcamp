import { Type } from 'class-transformer';
import { IsIn, IsInt, IsUUID, Max, Min, ValidateIf } from 'class-validator';
import { REVIEW_RATINGS } from './review.rules.js';
import type { Rating } from './review.rules.js';

export class AttemptDto {
  @IsIn(REVIEW_RATINGS) rating!: Rating;
  @IsInt() @Min(1) @Max(2147483647) expectedVersion!: number;
}

export class ReviewPageQuery {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}

export class ReviewQueueQuery extends ReviewPageQuery {
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined) @IsUUID('4') subjectId?: string;
}
