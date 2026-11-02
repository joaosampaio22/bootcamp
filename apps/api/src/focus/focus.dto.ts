import { Type } from 'class-transformer';
import { IsIn, IsInt, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class StartFocusDto {
  @IsInt() @Min(5) @Max(120) plannedMinutes!: number;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null)
  @IsUUID('4') subjectId?: string | null;
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined && v !== null)
  @IsUUID('4') contentId?: string | null;
}

export class TransitionDto {
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined)
  @IsInt() @Min(1) expectedVersion?: number;
}

export class FinishFocusDto extends TransitionDto {
  @IsIn(['COMPLETED', 'INTERRUPTED']) outcome!: 'COMPLETED' | 'INTERRUPTED';
}

export class ReconcileFocusDto extends TransitionDto {
  @IsIn(['COMPLETED', 'INTERRUPTED', 'DISCARDED']) outcome!: 'COMPLETED' | 'INTERRUPTED' | 'DISCARDED';
  @ValidateIf((o: ReconcileFocusDto, v: unknown) => o.outcome !== 'DISCARDED' || v !== undefined)
  @IsInt() @Min(0) @Max(7200) confirmedActiveSeconds?: number;
}

export class FocusHistoryQuery {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
