// [looknbook] Customer loyalty calculation — pure, side-effect-free, unit-tested.
import type { LoyaltyStatus } from "../types";

// Tunable thresholds (confirmed defaults; revisit once we have real data).
export const NEW_WINDOW_DAYS = 14;
export const REGULAR_MIN_VISITS = 3;
export const LOYAL_MIN_VISITS = 6;
export const CONSISTENCY_MAX_CV = 0.6;
export const AT_RISK_MULTIPLIER = 2;

const DAY_MS = 1000 * 60 * 60 * 24;

export type LoyaltyResult = {
  loyaltyStatus: LoyaltyStatus;
  visitCount: number;
  firstVisitAt: Date;
  lastVisitAt: Date;
  daysSinceLastVisit: number;
  /** Mean days between consecutive visits; null when fewer than 2 visits. */
  avgDaysBetweenVisits: number | null;
  /** Coefficient of variation of inter-visit gaps (stddev/mean); null when fewer than 2 visits. */
  consistencyCV: number | null;
};

/**
 * Computes loyalty signals + status from a customer's realized visit dates.
 * `now` is injectable for deterministic testing.
 */
export function computeLoyalty(visitDates: Date[], now: Date = new Date()): LoyaltyResult {
  if (visitDates.length === 0) {
    throw new Error("computeLoyalty requires at least one visit date");
  }

  // Defensive ascending sort (repository already sorts, but keep this pure-fn self-contained).
  const sorted = [...visitDates].sort((a, b) => a.getTime() - b.getTime());
  const visitCount = sorted.length;
  const firstVisitAt = sorted[0];
  const lastVisitAt = sorted[visitCount - 1];

  const daysSinceLastVisit = Math.max(0, (now.getTime() - lastVisitAt.getTime()) / DAY_MS);

  let avgDaysBetweenVisits: number | null = null;
  let consistencyCV: number | null = null;

  if (visitCount >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < visitCount; i++) {
      gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / DAY_MS);
    }
    const mean = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    avgDaysBetweenVisits = mean;
    if (mean > 0) {
      const variance = gaps.reduce((sum, g) => sum + (g - mean) ** 2, 0) / gaps.length;
      consistencyCV = Math.sqrt(variance) / mean;
    } else {
      consistencyCV = 0; // all visits effectively same instant
    }
  }

  const loyaltyStatus = resolveStatus({
    visitCount,
    daysSinceLastVisit,
    avgDaysBetweenVisits,
    consistencyCV,
  });

  return {
    loyaltyStatus,
    visitCount,
    firstVisitAt,
    lastVisitAt,
    daysSinceLastVisit,
    avgDaysBetweenVisits,
    consistencyCV,
  };
}

/**
 * Status decision tree. Order matters — "at risk" is evaluated first because it's the actionable
 * churn signal that should override loyal/regular when someone has gone quiet.
 */
function resolveStatus({
  visitCount,
  daysSinceLastVisit,
  avgDaysBetweenVisits,
  consistencyCV,
}: {
  visitCount: number;
  daysSinceLastVisit: number;
  avgDaysBetweenVisits: number | null;
  consistencyCV: number | null;
}): LoyaltyStatus {
  // 1. At risk: has an established cadence but current gap exceeds 2x the historical average.
  if (
    visitCount >= 2 &&
    avgDaysBetweenVisits !== null &&
    avgDaysBetweenVisits > 0 &&
    daysSinceLastVisit > AT_RISK_MULTIPLIER * avgDaysBetweenVisits
  ) {
    return "at_risk";
  }

  // 2. Loyal: high visit count AND consistent cadence.
  if (visitCount >= LOYAL_MIN_VISITS && consistencyCV !== null && consistencyCV <= CONSISTENCY_MAX_CV) {
    return "loyal";
  }

  // 3. Regular: 3+ visits (erratic high-count customers land here rather than "loyal").
  if (visitCount >= REGULAR_MIN_VISITS) {
    return "regular";
  }

  // 4. New: a single visit within the recent window.
  if (visitCount === 1 && daysSinceLastVisit <= NEW_WINDOW_DAYS) {
    return "new";
  }

  // 5. Occasional: catch-all (e.g. 2 inconsistent visits not yet at-risk, or 1 older visit).
  return "occasional";
}
