import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma, type Role, type TimeEntry } from '@prisma/client';

import { PermissionsService } from '../auth/permissions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * A single stretch of presence is never counted for more than this.
 *
 * Somebody who forgets to clock out would otherwise be credited with the whole
 * night and the next morning. The entry itself stays as it was recorded; only
 * the hours derived from it are capped.
 */
const MAX_SHIFT_MS = 16 * 60 * 60 * 1000;

/** The widest range a report may ask for. */
const MAX_RANGE_DAYS = 62;

export interface EntryView {
  id: string;
  clockInAt: Date;
  clockOutAt: Date | null;
  open: boolean;
  minutes: number;
  note: string | null;
}

export interface TeamRow {
  userId: string;
  name: string;
  email: string;
  role: Role;
  department: { id: string; name: string } | null;
  /** Set while the person is clocked in. */
  presentSince: Date | null;
  minutes: number;
  daysPresent: number;
}

function minutesOf(
  entry: Pick<TimeEntry, 'clockInAt' | 'clockOutAt'>,
  now: Date,
): number {
  const end = entry.clockOutAt ?? now;
  const ms = Math.min(
    Math.max(end.getTime() - entry.clockInAt.getTime(), 0),
    MAX_SHIFT_MS,
  );

  return Math.round(ms / 60_000);
}

function toView(entry: TimeEntry, now: Date): EntryView {
  return {
    id: entry.id,
    clockInAt: entry.clockInAt,
    clockOutAt: entry.clockOutAt,
    open: entry.clockOutAt === null,
    minutes: minutesOf(entry, now),
    note: entry.note,
  };
}

/**
 * Attendance: clocking in and out.
 *
 * Times are taken from the server, never from the client, so a person cannot
 * back-date their own arrival. Everyone clocks themselves; managers read their
 * department's presence and the CEO reads everyone's.
 */
@Injectable()
export class TimeclockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  /** The caller's open entry, if they are clocked in, with the server's clock. */
  async status(
    organizationId: string,
    userId: string,
  ): Promise<{ open: EntryView | null; now: Date }> {
    const now = new Date();
    const open = await this.prisma.timeEntry.findFirst({
      where: { organizationId, userId, clockOutAt: null },
    });

    return { open: open ? toView(open, now) : null, now };
  }

  async clockIn(organizationId: string, userId: string): Promise<EntryView> {
    const scope = await this.permissions.scope(organizationId, userId);

    if (!scope.role) {
      throw new ForbiddenException('Only members of the team can clock in');
    }

    try {
      const entry = await this.prisma.timeEntry.create({
        data: { organizationId, userId, departmentId: scope.departmentId },
      });

      return toView(entry, new Date());
    } catch (cause: unknown) {
      // The partial unique index decides, so two simultaneous clock-ins cannot
      // both open an entry.
      if (
        cause instanceof Prisma.PrismaClientKnownRequestError &&
        cause.code === 'P2002'
      ) {
        throw new ConflictException('You are already clocked in');
      }

      throw cause;
    }
  }

  async clockOut(
    organizationId: string,
    userId: string,
    note?: string,
  ): Promise<EntryView> {
    const now = new Date();

    // One statement closes the open entry, so a double click cannot close it
    // twice or close an entry that a concurrent clock-in just opened.
    const closed = await this.prisma.timeEntry.updateMany({
      where: { organizationId, userId, clockOutAt: null },
      data: { clockOutAt: now, note: note?.trim() || null },
    });

    if (closed.count === 0) {
      throw new ConflictException('You are not clocked in');
    }

    const entry = await this.prisma.timeEntry.findFirstOrThrow({
      where: { organizationId, userId, clockOutAt: now },
      orderBy: { clockInAt: 'desc' },
    });

    return toView(entry, now);
  }

  /** The caller's own entries over a range, newest first. */
  async mine(
    organizationId: string,
    userId: string,
    from: Date,
    to: Date,
  ): Promise<{ entries: EntryView[]; totalMinutes: number }> {
    this.assertRange(from, to);

    const now = new Date();
    const rows = await this.prisma.timeEntry.findMany({
      where: { organizationId, userId, clockInAt: { gte: from, lt: to } },
      orderBy: { clockInAt: 'desc' },
    });
    const entries = rows.map((row) => toView(row, now));

    return {
      entries,
      totalMinutes: entries.reduce((sum, entry) => sum + entry.minutes, 0),
    };
  }

  /**
   * Who is present, and the hours each person did over a range.
   *
   * The CEO reads every department; a manager only their own.
   */
  async team(
    organizationId: string,
    actorId: string,
    from: Date,
    to: Date,
  ): Promise<TeamRow[]> {
    this.assertRange(from, to);

    const scope = await this.permissions.scope(organizationId, actorId);

    if (!scope.seeAll && !scope.departmentId) {
      throw new ForbiddenException('You do not belong to any department');
    }

    const members = await this.prisma.teamMember.findMany({
      where: {
        organizationId,
        ...(scope.seeAll ? {} : { departmentId: scope.departmentId }),
      },
      select: {
        role: true,
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const now = new Date();
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        organizationId,
        userId: { in: members.map((member) => member.user.id) },
        OR: [{ clockInAt: { gte: from, lt: to } }, { clockOutAt: null }],
      },
    });

    return members.map((member) => {
      const mine = entries.filter((entry) => entry.userId === member.user.id);
      const inRange = mine.filter(
        (entry) => entry.clockInAt >= from && entry.clockInAt < to,
      );
      const open = mine.find((entry) => entry.clockOutAt === null);

      return {
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        department: member.department,
        presentSince: open?.clockInAt ?? null,
        minutes: inRange.reduce((sum, entry) => sum + minutesOf(entry, now), 0),
        daysPresent: new Set(
          inRange.map((entry) => entry.clockInAt.toDateString()),
        ).size,
      };
    });
  }

  private assertRange(from: Date, to: Date): void {
    if (!(from < to)) {
      throw new BadRequestException('from must be before to');
    }

    if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      throw new BadRequestException(
        `The range is limited to ${MAX_RANGE_DAYS} days`,
      );
    }
  }
}
