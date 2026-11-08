import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './jwt-payload.js';

/** What the auth endpoints return. Never includes the password hash. */
export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    organizationId: string;
    email: string;
    name: string;
  };
}


/** Wrong passwords tolerated per ip and email before sign-in is paused. */
const MAX_FAILURES = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto, ip = 'unknown'): Promise<AuthResult> {
    const key = `${ip}|${dto.email.trim().toLowerCase()}`;

    this.assertNotLocked(key);

    // The same address may exist in two tenants, so every account with it is
    // tried and the one whose password matches signs in.
    const candidates = await this.prisma.user.findMany({
      where: { email: { equals: dto.email.trim(), mode: 'insensitive' } },
    });

    // Compare against a dummy hash when there is no account, so a missing
    // account and a wrong password take a similar amount of time to reject.
    const dummyHash =
      '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';

    let matched: (typeof candidates)[number] | null = null;

    for (const candidate of candidates.length > 0 ? candidates : [null]) {
      const ok = await bcrypt.compare(
        dto.password,
        candidate?.passwordHash ?? dummyHash,
      );

      if (ok && candidate && !matched) {
        matched = candidate;
      }
    }

    // An account without a place on the team (somebody who was removed) has
    // nothing to open, and must not keep a way in.
    const member = matched
      ? await this.prisma.teamMember.findFirst({
          where: { userId: matched.id, organizationId: matched.organizationId },
          select: { id: true },
        })
      : null;

    if (!matched || !member) {
      this.recordFailure(key);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.failures.delete(key);

    return this.buildResult(matched);
  }

  /** Failed sign-ins per `ip|email`, kept in memory for the throttling window. */
  private readonly failures = new Map<
    string,
    { count: number; resetAt: number }
  >();

  private assertNotLocked(key: string): void {
    const now = Date.now();
    const entry = this.failures.get(key);

    if (entry && entry.resetAt <= now) {
      this.failures.delete(key);

      return;
    }

    if (entry && entry.count >= MAX_FAILURES) {
      const minutes = Math.ceil((entry.resetAt - now) / 60_000);

      throw new HttpException(
        `Trop de tentatives. Réessaie dans ${minutes} min.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordFailure(key: string): void {
    const now = Date.now();
    const entry = this.failures.get(key);

    // Drop expired entries now and then so the map cannot grow without bound.
    if (this.failures.size > 5_000) {
      for (const [k, v] of this.failures) {
        if (v.resetAt <= now) this.failures.delete(k);
      }
    }

    this.failures.set(key, {
      count: (entry && entry.resetAt > now ? entry.count : 0) + 1,
      resetAt:
        entry && entry.resetAt > now ? entry.resetAt : now + LOCK_WINDOW_MS,
    });
  }

  private async buildResult(user: {
    id: string;
    organizationId: string;
    email: string;
    name: string;
  }): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      org: user.organizationId,
      email: user.email,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        name: user.name,
      },
    };
  }
}
