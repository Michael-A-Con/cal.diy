// [looknbook] Compatibility-window scope resolver — the single source of truth for
// "how do I scope all data for this business?". Phase 1: defined but not yet wired into handlers.
//
// Behavior over the migration timeline (no code changes needed between phases):
//  - flag OFF, or no team yet → { teamId: null, memberUserIds: [userId] }  (identical to pre-Phase-1)
//  - flag ON + team exists    → { teamId, memberUserIds: [...accepted members] }
// Callers scope queries as: eventType.teamId = teamId OR userId IN memberUserIds.
import { LOOKNBOOK_TEAMS_ENABLED } from "../config";
import { BusinessTeamRepository } from "../repositories/BusinessTeamRepository";

export type BusinessScope = {
  teamId: number | null;
  memberUserIds: number[];
};

export async function getBusinessScope(
  userId: number,
  repo: BusinessTeamRepository = new BusinessTeamRepository()
): Promise<BusinessScope> {
  // Flag off → behave exactly as before Phase 1 (virtual team of one).
  if (!LOOKNBOOK_TEAMS_ENABLED) {
    return { teamId: null, memberUserIds: [userId] };
  }

  const team = await repo.findBusinessTeamByUserId(userId);
  if (!team) {
    // Safety fallback: a user without a backfilled team behaves as a solo business.
    return { teamId: null, memberUserIds: [userId] };
  }

  const memberUserIds = await repo.listMemberUserIds(team.id);
  // Defensive: always include the acting user even if membership data is incomplete.
  if (!memberUserIds.includes(userId)) {
    memberUserIds.push(userId);
  }
  return { teamId: team.id, memberUserIds };
}
