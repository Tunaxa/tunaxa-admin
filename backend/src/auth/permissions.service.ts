import { Injectable } from '@nestjs/common';
import type { AppKey, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { type Permission, permissionsFor } from './permissions.js';

/** What somebody may do, and where the answer came from. */
export interface EffectivePermissions {
  /** Null when the person has no membership at all. */
  role: Role | null;
  /** True when a per-application ownership decided it rather than the org role. */
  scopedToApp: boolean;
  permissions: readonly Permission[];
  /** The department the person works in. Null for the CEO, who spans them all. */
  departmentId: string | null;
}

/**
 * Which slice of the company a person may see.
 *
 * The role says what kinds of action are open; the scope says over what. The
 * CEO (`seeAll`) spans every department, a manager is held to their own, and
 * everyone else sees only what is assigned to them inside it.
 */
export interface AccessScope {
  role: Role | null;
  departmentId: string | null;
  seeAll: boolean;
  isManager: boolean;
}

interface MemberRow {
  role: Role;
  departmentId: string | null;
  ownerships: { app: AppKey; role: Role }[];
}

/**
 * How long a person's role and department are remembered.
 *
 * Every request asks several times (the guard, then the service), and the
 * answer almost never changes. A few seconds removes the repeated queries; the
 * writes that do change it call `invalidate()` so a demotion is felt at once.
 */
const CACHE_TTL_MS = 3000;
const CACHE_MAX_ENTRIES = 2000;

/**
 * Works out what one person may do, optionally within one application.
 *
 * The organization role applies everywhere; an `AppOwnership` row **replaces**
 * it for that application. Replaces, not adds: the schema says ownership
 * applies "wherever no per-application ownership overrides it", so somebody
 * who is a developer across the company and a viewer on `axacrm` is a viewer
 * on `axacrm`.
 *
 * That direction matters. Treating ownership as extra permissions — the
 * obvious shortcut — would mean holding any application at a senior role
 * quietly raised somebody everywhere, which is privilege escalation wearing a
 * feature's clothes.
 */
@Injectable()
export class PermissionsService {
  private readonly cache = new Map<
    string,
    { at: number; member: MemberRow | null }
  >();

  constructor(private readonly prisma: PrismaService) {}

  /** Forgets every remembered role. Call it after a role or department changes. */
  invalidate(): void {
    this.cache.clear();
  }

  private async member(
    organizationId: string,
    userId: string,
  ): Promise<MemberRow | null> {
    const key = `${organizationId}:${userId}`;
    const hit = this.cache.get(key);

    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return hit.member;
    }

    const member = await this.prisma.teamMember.findFirst({
      where: { userId, organizationId },
      select: {
        role: true,
        departmentId: true,
        ownerships: { select: { app: true, role: true } },
      },
    });

    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      this.cache.clear();
    }

    this.cache.set(key, { at: Date.now(), member });

    return member;
  }

  async resolve(
    organizationId: string,
    userId: string,
    app?: AppKey | null,
  ): Promise<EffectivePermissions> {
    const member = await this.member(organizationId, userId);

    if (!member) {
      return {
        role: null,
        scopedToApp: false,
        permissions: [],
        departmentId: null,
      };
    }

    const ownership = app
      ? member.ownerships.find((o) => o.app === app)
      : undefined;
    const role = ownership?.role ?? member.role;

    return {
      role,
      scopedToApp: Boolean(ownership),
      permissions: permissionsFor(role),
      departmentId: member.departmentId,
    };
  }

  /** The slice of the company this person may see. */
  async scope(organizationId: string, userId: string): Promise<AccessScope> {
    const member = await this.member(organizationId, userId);

    if (!member) {
      return {
        role: null,
        departmentId: null,
        seeAll: false,
        isManager: false,
      };
    }

    return {
      role: member.role,
      departmentId: member.departmentId,
      seeAll: member.role === 'owner',
      isManager: member.role === 'dev_team_leader' || member.role === 'pm_lead',
    };
  }

  /**
   * Everything this person can do *somewhere* — the organization role plus
   * every application they hold a role in.
   *
   * This is a gate, not an authorisation, and the distinction matters. A
   * route-level guard runs before the handler, so it cannot know which
   * application a request concerns when that comes from the record being
   * acted on; refusing on the organization role alone would mean somebody
   * who may decide `axacrm` requests could never reach the code that would
   * have let them.
   *
   * So the guard asks "could you do this anywhere", and the handler asks
   * "may you do this here" with the record in hand. The union never decides
   * anything on its own — and a route that uses the gate without the precise
   * check behind it would be a hole, which is why the two live together in
   * the account requests service.
   */
  async anywhere(
    organizationId: string,
    userId: string,
  ): Promise<readonly Permission[]> {
    const member = await this.member(organizationId, userId);

    if (!member) {
      return [];
    }

    const everywhere = new Set<Permission>(permissionsFor(member.role));

    for (const ownership of member.ownerships) {
      for (const permission of permissionsFor(ownership.role)) {
        everywhere.add(permission);
      }
    }

    return [...everywhere];
  }

  /** Does this person hold `permission` within `app`? */
  async can(
    organizationId: string,
    userId: string,
    permission: Permission,
    app?: AppKey | null,
  ): Promise<boolean> {
    const effective = await this.resolve(organizationId, userId, app);

    return effective.permissions.includes(permission);
  }
}
