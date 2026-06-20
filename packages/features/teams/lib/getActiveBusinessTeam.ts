// [looknbook] Resolve the business team a user is acting for (read-only).
// Phase 1: defined but NOT yet wired into any handler. No side effects (never creates rows).
import type { BusinessTeamDto } from "../repositories/BusinessTeamRepository";
import { BusinessTeamRepository } from "../repositories/BusinessTeamRepository";

export async function getActiveBusinessTeam(
  userId: number,
  repo: BusinessTeamRepository = new BusinessTeamRepository()
): Promise<BusinessTeamDto | null> {
  return repo.findBusinessTeamByUserId(userId);
}
