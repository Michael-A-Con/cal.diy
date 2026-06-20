// [looknbook] Read-only data access for resolving a user's business team. No business logic here.
import { prisma } from "@calcom/prisma";
import type { PrismaClient } from "@calcom/prisma/client";
import { MembershipRole } from "@calcom/prisma/enums";

export type BusinessTeamDto = { id: number; name: string };

export class BusinessTeamRepository {
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  /**
   * Finds the user's business team (non-organization, accepted membership).
   * MVP assumes one business per account (Q2); prefers the OWNER membership if more than one exists.
   */
  async findBusinessTeamByUserId(userId: number): Promise<BusinessTeamDto | null> {
    const memberships = await this.prismaClient.membership.findMany({
      where: { userId, accepted: true, team: { isOrganization: false } },
      select: { role: true, team: { select: { id: true, name: true } } },
      orderBy: { id: "asc" },
    });
    if (memberships.length === 0) return null;
    const ownerMembership = memberships.find((m) => m.role === MembershipRole.OWNER);
    const chosen = ownerMembership ?? memberships[0];
    return { id: chosen.team.id, name: chosen.team.name };
  }

  /** Accepted member userIds for a team (includes the owner). */
  async listMemberUserIds(teamId: number): Promise<number[]> {
    const members = await this.prismaClient.membership.findMany({
      where: { teamId, accepted: true },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }
}
