/**
 * [looknbook] Phase 1 — Team identity foundation (ADDITIVE ONLY).
 *
 * Creates a business Team + OWNER Membership for every user that owns >=1 event type
 * (excluding platform admins). It mutates NO existing rows (no EventType / Booking / Schedule
 * changes). Idempotent and reversible.
 *
 * Usage:
 *   yarn tsx scripts/looknbook-phase1-teams.ts             # backfill
 *   yarn tsx scripts/looknbook-phase1-teams.ts --dry-run   # report only, no writes
 *   yarn tsx scripts/looknbook-phase1-teams.ts --rollback  # delete Phase-1-stamped teams (+ cascade memberships)
 *   yarn tsx scripts/looknbook-phase1-teams.ts --rollback --dry-run
 */
import { prisma } from "@calcom/prisma";
import { MembershipRole, UserPermissionRole } from "@calcom/prisma/enums";

// Stamp written into Team.metadata so rollback can delete ONLY Phase-1-created teams.
const PHASE1_STAMP = { looknbookPhase1: true } as const;

async function backfill({ dryRun }: { dryRun: boolean }): Promise<void> {
  // "Business" = a user who owns at least one personal event type (ownedEventTypes / EventType.userId),
  // excluding platform admins. This avoids creating junk teams for empty/test/admin accounts.
  const businessUsers = await prisma.user.findMany({
    where: {
      role: { not: UserPermissionRole.ADMIN },
      ownedEventTypes: { some: {} },
    },
    select: { id: true, name: true, username: true },
    orderBy: { id: "asc" },
  });

  let created = 0;
  let skipped = 0;

  for (const user of businessUsers) {
    // Idempotency: skip if this user already owns a non-org business team.
    const existing = await prisma.membership.findFirst({
      where: { userId: user.id, role: MembershipRole.OWNER, team: { isOrganization: false } },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const teamName = user.name || user.username || `Business ${user.id}`;

    if (dryRun) {
      console.log(`[dry-run] would create team "${teamName}" + OWNER membership for user ${user.id}`);
      created++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: teamName,
          slug: null, // no public team page for MVP
          isOrganization: false, // never an organization
          metadata: PHASE1_STAMP, // for safe, surgical rollback
        },
        select: { id: true },
      });
      await tx.membership.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: MembershipRole.OWNER,
          accepted: true,
        },
      });
    });

    created++;
    console.log(`created team "${teamName}" (teamId for user ${user.id})`);
  }

  console.log(
    `\nBackfill complete. created=${created} skipped(existing)=${skipped} totalBusinesses=${businessUsers.length}`
  );
}

async function rollback({ dryRun }: { dryRun: boolean }): Promise<void> {
  // Only Phase-1-stamped, non-org teams. Memberships cascade-delete with the Team (onDelete: Cascade).
  const teams = await prisma.team.findMany({
    where: {
      isOrganization: false,
      metadata: { path: ["looknbookPhase1"], equals: true },
    },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  console.log(`found ${teams.length} Phase-1-stamped team(s)`);

  if (dryRun) {
    for (const t of teams) console.log(`[dry-run] would delete team ${t.id} "${t.name}" (+ memberships via cascade)`);
    return;
  }

  for (const t of teams) {
    await prisma.team.delete({ where: { id: t.id } });
    console.log(`deleted team ${t.id} "${t.name}"`);
  }
  console.log(`\nRollback complete. deleted=${teams.length}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const isRollback = args.includes("--rollback");

  console.log(`[looknbook] Phase 1 teams — mode=${isRollback ? "rollback" : "backfill"} dryRun=${dryRun}`);
  if (isRollback) {
    await rollback({ dryRun });
  } else {
    await backfill({ dryRun });
  }
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
