import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

/** The window a report covers. Instants, because the client owns its own days. */
export class RangeQuery {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;
}

export class ClockOutDto {
  /** What was done, if the person wants to say. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
