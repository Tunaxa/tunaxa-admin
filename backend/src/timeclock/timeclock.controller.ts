import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RequirePermissions } from '../auth/permissions.decorator.js';
import { ClockOutDto, RangeQuery } from './dto/timeclock.dto.js';
import {
  type EntryView,
  type TeamRow,
  TimeclockService,
} from './timeclock.service.js';

/**
 * Attendance. The person and the tenant come from the verified token, so
 * nobody can clock somebody else in or read another tenant's hours.
 */
@Controller('timeclock')
export class TimeclockController {
  constructor(private readonly timeclock: TimeclockService) {}

  @RequirePermissions('timeclock:use')
  @Get('status')
  status(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ open: EntryView | null; now: Date }> {
    return this.timeclock.status(request.user.org, request.user.sub);
  }

  @RequirePermissions('timeclock:use')
  @Post('clock-in')
  clockIn(@Req() request: AuthenticatedRequest): Promise<EntryView> {
    return this.timeclock.clockIn(request.user.org, request.user.sub);
  }

  @RequirePermissions('timeclock:use')
  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  clockOut(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ClockOutDto,
  ): Promise<EntryView> {
    return this.timeclock.clockOut(
      request.user.org,
      request.user.sub,
      dto.note,
    );
  }

  @RequirePermissions('timeclock:use')
  @Get('me')
  mine(
    @Req() request: AuthenticatedRequest,
    @Query() query: RangeQuery,
  ): Promise<{ entries: EntryView[]; totalMinutes: number }> {
    return this.timeclock.mine(
      request.user.org,
      request.user.sub,
      new Date(query.from),
      new Date(query.to),
    );
  }

  /** Who is present and the hours of each person, for the CEO or a manager. */
  @RequirePermissions('timeclock:read')
  @Get('team')
  team(
    @Req() request: AuthenticatedRequest,
    @Query() query: RangeQuery,
  ): Promise<TeamRow[]> {
    return this.timeclock.team(
      request.user.org,
      request.user.sub,
      new Date(query.from),
      new Date(query.to),
    );
  }
}
