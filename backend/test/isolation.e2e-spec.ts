import type { Server } from 'node:http';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

/**
 * Roles, departments and data isolation, end to end.
 *
 * Builds its own throwaway organization with a random slug, so it never reads
 * or writes a real company's rows, and deletes it (everything cascades) when
 * it is done.
 */
describe('Roles and data isolation (e2e)', () => {
  const run = Math.random().toString(36).slice(2, 8);
  const email = (name: string) => `${name}.${run}@iso-test.local`;
  const PASSWORD = 'IsolationTest!2026';

  let app: INestApplication<Server>;
  let prisma: PrismaService;
  let organizationId: string;

  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function login(who: string, password = PASSWORD): Promise<string> {
    const res = await api()
      .post('/auth/login')
      .send({ email: email(who), password });

    return res.body.accessToken as string;
  }

  let ceo: string;
  let alphaManager: string;
  let betaManager: string;
  let sam: string; // developer, Alpha
  let lina: string; // designer, Alpha
  let omar: string; // developer, Beta
  let alphaId: string;
  let betaId: string;
  let alphaProjectId: string;
  let betaProjectId: string;
  let workspaceId: string;
  let samId: string;
  let linaId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const org = await prisma.organization.create({
      data: {
        slug: `iso-${run}`,
        name: `Isolation ${run}`,
        issuePrefix: 'ISO',
      },
    });

    organizationId = org.id;

    const ceoUser = await prisma.user.create({
      data: {
        organizationId,
        email: email('ceo'),
        name: 'CEO Test',
        passwordHash: await bcrypt.hash(PASSWORD, 4),
      },
    });

    await prisma.teamMember.create({
      data: { organizationId, userId: ceoUser.id, role: 'owner' },
    });

    ceo = await login('ceo');

    const mkDepartment = async (name: string, who: string) => {
      const res = await api()
        .post('/departments')
        .set(auth(ceo))
        .send({
          name,
          manager: {
            name: `${name} Manager`,
            email: email(who),
            password: PASSWORD,
          },
        });

      return res.body.id as string;
    };

    alphaId = await mkDepartment('Alpha', 'alpha.manager');
    betaId = await mkDepartment('Beta', 'beta.manager');
    alphaManager = await login('alpha.manager');
    betaManager = await login('beta.manager');

    const invite = (token: string, who: string, role: string) =>
      api()
        .post('/team-members/invite')
        .set(auth(token))
        .send({ email: email(who), name: who, password: PASSWORD, role });

    const samRes = await invite(alphaManager, 'sam', 'developer');
    const linaRes = await invite(alphaManager, 'lina', 'designer');

    await invite(betaManager, 'omar', 'developer');
    samId = samRes.body.user.id;
    linaId = linaRes.body.user.id;
    sam = await login('sam');
    lina = await login('lina');
    omar = await login('omar');

    workspaceId = (await api().get('/workspaces').set(auth(alphaManager)))
      .body[0].id;
    alphaProjectId = (
      await api()
        .post('/projects')
        .set(auth(alphaManager))
        .send({ name: 'Alpha project' })
    ).body.id;
    betaProjectId = (
      await api()
        .post('/projects')
        .set(auth(betaManager))
        .send({ name: 'Beta project' })
    ).body.id;
  }, 60_000);

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await app.close();
  });

  const createIssue = (token: string, body: Record<string, unknown>) =>
    api()
      .post('/issues')
      .set(auth(token))
      .send({ workspaceId, ...body });

  describe('sign in', () => {
    it('needs only an email and a password, in any letter case', async () => {
      const res = await api()
        .post('/auth/login')
        .send({ email: email('ceo').toUpperCase(), password: PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
    });

    it('refuses a wrong password', async () => {
      const res = await api()
        .post('/auth/login')
        .send({ email: email('ceo'), password: 'not-the-password' });

      expect(res.status).toBe(401);
    });

    it('pauses sign-in after five wrong passwords', async () => {
      const attempt = () =>
        api()
          .post('/auth/login')
          .send({ email: email('throttle'), password: 'wrong-password' });

      for (let i = 0; i < 5; i += 1) {
        expect((await attempt()).status).toBe(401);
      }

      expect((await attempt()).status).toBe(429);
    });

    it('has no public sign-up', async () => {
      const res = await api().post('/auth/register').send({});

      expect(res.status).toBe(404);
    });
  });

  describe('departments', () => {
    it('are created by the CEO only', async () => {
      const asManager = await api()
        .post('/departments')
        .set(auth(alphaManager))
        .send({ name: 'Rogue' });
      const asMember = await api()
        .post('/departments')
        .set(auth(sam))
        .send({ name: 'Rogue' });

      expect(asManager.status).toBe(403);
      expect(asMember.status).toBe(403);
    });

    it('refuse a duplicate name', async () => {
      const res = await api()
        .post('/departments')
        .set(auth(ceo))
        .send({ name: 'Alpha' });

      expect(res.status).toBe(409);
    });

    it('show a manager only their own department', async () => {
      const res = await api().get('/departments').set(auth(alphaManager));

      expect(res.body.map((d: { name: string }) => d.name)).toEqual(['Alpha']);
    });

    it('show the CEO every department', async () => {
      const res = await api().get('/departments').set(auth(ceo));

      expect(res.body).toHaveLength(2);
    });
  });

  describe('tasks', () => {
    let samIssueId: string;

    beforeAll(async () => {
      samIssueId = (
        await createIssue(alphaManager, {
          title: 'Sam task',
          projectId: alphaProjectId,
          assigneeId: samId,
        })
      ).body.id;
      await createIssue(alphaManager, {
        title: 'Lina task',
        projectId: alphaProjectId,
        assigneeId: linaId,
      });
      await createIssue(betaManager, {
        title: 'Beta task',
        projectId: betaProjectId,
      });
    });

    const titles = async (token: string) =>
      (await api().get('/issues').set(auth(token))).body
        .map((i: { title: string }) => i.title)
        .sort();

    it('give the CEO every task', async () => {
      expect(await titles(ceo)).toEqual(['Beta task', 'Lina task', 'Sam task']);
    });

    it('give a manager their department only', async () => {
      expect(await titles(alphaManager)).toEqual(['Lina task', 'Sam task']);
      expect(await titles(betaManager)).toEqual(['Beta task']);
    });

    it('give a member only what is assigned to them', async () => {
      expect(await titles(sam)).toEqual(['Sam task']);
      expect(await titles(lina)).toEqual(['Lina task']);
      expect(await titles(omar)).toEqual([]);
    });

    it('hide another department’s task as missing, not forbidden', async () => {
      const res = await api()
        .patch(`/issues/${samIssueId}`)
        .set(auth(betaManager))
        .send({ status: 'done' });

      expect(res.status).toBe(404);
    });

    it('stop a member working on a colleague’s task', async () => {
      const res = await api()
        .patch(`/issues/${samIssueId}`)
        .set(auth(lina))
        .send({ status: 'done' });

      expect(res.status).toBe(404);
    });

    it('stop a member assigning a task to somebody else', async () => {
      const res = await api()
        .patch(`/issues/${samIssueId}`)
        .set(auth(sam))
        .send({ assigneeId: linaId });

      expect(res.status).toBe(403);
    });

    it('stop a manager assigning across departments', async () => {
      const res = await createIssue(alphaManager, {
        title: 'Cross',
        projectId: alphaProjectId,
        assigneeId: (
          await prisma.user.findFirstOrThrow({
            where: { email: email('omar') },
          })
        ).id,
      });

      expect(res.status).toBe(400);
    });

    it('keep a CEO task that was assigned without a department visible to its assignee', async () => {
      await createIssue(ceo, { title: 'From the CEO', assigneeId: samId });

      expect(await titles(sam)).toContain('From the CEO');
    });

    it('notify the assignee, and the manager when a member moves a task', async () => {
      await api()
        .patch(`/issues/${samIssueId}`)
        .set(auth(sam))
        .send({ status: 'in_progress' });

      const forManager = await api()
        .get('/notifications')
        .set(auth(alphaManager));

      expect(
        forManager.body.some((n: { title: string }) =>
          n.title.includes('Sam task'),
        ),
      ).toBe(true);

      const forSam = await api().get('/notifications').set(auth(sam));

      expect(
        forSam.body.some((n: { type: string }) => n.type === 'task_assigned'),
      ).toBe(true);
    });
  });

  describe('projects and team', () => {
    it('show a manager only their department’s projects', async () => {
      const res = await api().get('/projects').set(auth(alphaManager));

      expect(res.body.map((p: { name: string }) => p.name)).toEqual([
        'Alpha project',
      ]);
    });

    it('let nobody edit another department’s project', async () => {
      const res = await api()
        .patch(`/projects/${betaProjectId}`)
        .set(auth(alphaManager))
        .send({ completionPercent: 99 });

      expect(res.status).toBe(404);
    });

    it('let a manager set the completion of their own project', async () => {
      const res = await api()
        .patch(`/projects/${alphaProjectId}`)
        .set(auth(alphaManager))
        .send({ completionPercent: 40 });

      expect(res.body.completionPercent).toBe(40);
    });

    it('stop a member creating projects or inviting people', async () => {
      const project = await api()
        .post('/projects')
        .set(auth(sam))
        .send({ name: 'x' });
      const invite = await api()
        .post('/team-members/invite')
        .set(auth(sam))
        .send({
          email: email('x'),
          name: 'x',
          password: PASSWORD,
          role: 'viewer',
        });

      expect(project.status).toBe(403);
      expect(invite.status).toBe(403);
    });

    it('stop a manager inviting a manager', async () => {
      const res = await api()
        .post('/team-members/invite')
        .set(auth(alphaManager))
        .send({
          email: email('y'),
          name: 'y',
          password: PASSWORD,
          role: 'dev_team_leader',
        });

      expect(res.status).toBe(400);
    });

    it('show a manager only their own team', async () => {
      const res = await api().get('/team-members').set(auth(alphaManager));
      const names = res.body
        .map((m: { user: { name: string } }) => m.user.name)
        .sort();

      expect(names).toEqual(['Alpha Manager', 'lina', 'sam']);
    });

    it('keep the executive pages for the CEO', async () => {
      expect(
        (await api().get('/company/kpis').set(auth(alphaManager))).status,
      ).toBe(403);
      expect((await api().get('/app-usage').set(auth(sam))).status).toBe(403);
      expect((await api().get('/company/kpis').set(auth(ceo))).status).toBe(
        200,
      );
    });
  });

  describe('time clock', () => {
    it('lets a member clock in once and out once', async () => {
      const first = await api().post('/timeclock/clock-in').set(auth(sam));
      const second = await api().post('/timeclock/clock-in').set(auth(sam));

      expect(first.status).toBe(201);
      expect(second.status).toBe(409);

      const out = await api()
        .post('/timeclock/clock-out')
        .set(auth(sam))
        .send({});
      const again = await api()
        .post('/timeclock/clock-out')
        .set(auth(sam))
        .send({});

      expect(out.status).toBe(200);
      expect(again.status).toBe(409);
    });

    it('opens only one entry when clock-ins race', async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          api().post('/timeclock/clock-in').set(auth(lina)),
        ),
      );

      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      expect(results.filter((r) => r.status === 409)).toHaveLength(4);
    });

    const week = () => {
      const from = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const to = new Date(Date.now() + 86_400_000).toISOString();

      return `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    };

    it('shows a manager their department’s presence only', async () => {
      await api().post('/timeclock/clock-in').set(auth(omar));

      const res = await api()
        .get(`/timeclock/team?${week()}`)
        .set(auth(alphaManager));
      const names = res.body.map((r: { name: string }) => r.name);

      expect(names).toContain('lina');
      expect(names).not.toContain('omar');
    });

    it('keeps the team view from members', async () => {
      const res = await api().get(`/timeclock/team?${week()}`).set(auth(sam));

      expect(res.status).toBe(403);
    });
  });

  describe('removing people and departments', () => {
    it('locks a removed member out', async () => {
      const members = await api().get('/team-members').set(auth(alphaManager));
      const linaMember = members.body.find(
        (m: { user: { name: string } }) => m.user.name === 'lina',
      );
      const removed = await api()
        .delete(`/team-members/${linaMember.id}`)
        .set(auth(alphaManager));

      expect(removed.status).toBe(204);
      expect(
        (
          await api()
            .post('/auth/login')
            .send({ email: email('lina'), password: PASSWORD })
        ).status,
      ).toBe(401);
    });

    it('refuses to delete a department that still has projects or people', async () => {
      const res = await api().delete(`/departments/${alphaId}`).set(auth(ceo));

      expect(res.status).toBe(409);
    });

    it('deletes a department once only its manager is left', async () => {
      await prisma.issue.deleteMany({ where: { departmentId: betaId } });
      await prisma.project.deleteMany({ where: { departmentId: betaId } });

      const members = await api().get('/team-members').set(auth(ceo));
      const omarMember = members.body.find(
        (m: { user: { name: string } }) => m.user.name === 'omar',
      );

      await api().delete(`/team-members/${omarMember.id}`).set(auth(ceo));

      const res = await api().delete(`/departments/${betaId}`).set(auth(ceo));

      expect(res.status).toBe(204);

      const manager = await prisma.teamMember.findFirstOrThrow({
        where: { user: { email: email('beta.manager') } },
      });

      expect(manager.role).toBe('viewer');
      expect(manager.departmentId).toBeNull();
    });
  });
});
