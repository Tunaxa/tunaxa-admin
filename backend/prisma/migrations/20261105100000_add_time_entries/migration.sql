CREATE TABLE "time_entries" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "departmentId" UUID,
    "clockInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clockOutAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "time_entries_organizationId_userId_clockInAt_idx"
    ON "time_entries" ("organizationId", "userId", "clockInAt");
CREATE INDEX "time_entries_organizationId_departmentId_clockInAt_idx"
    ON "time_entries" ("organizationId", "departmentId", "clockInAt");

-- A person has at most one open stretch of presence at a time. Two clock-ins
-- racing each other cannot both win: the second one hits this index.
CREATE UNIQUE INDEX "time_entries_one_open_per_user"
    ON "time_entries" ("userId") WHERE "clockOutAt" IS NULL;

ALTER TABLE "time_entries"
    ADD CONSTRAINT "time_entries_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "time_entries"
    ADD CONSTRAINT "time_entries_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "time_entries"
    ADD CONSTRAINT "time_entries_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
