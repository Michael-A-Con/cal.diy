// [looknbook] Unit tests for the loyalty calculation.
import { describe, expect, it } from "vitest";

import { computeLoyalty } from "./computeLoyalty";

const NOW = new Date("2026-06-13T12:00:00.000Z");
const DAY_MS = 1000 * 60 * 60 * 24;

/** Build a Date `n` days before NOW. */
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * DAY_MS);
}

/** Build `count` visits ending `lastDaysAgo` days ago, spaced `gap` days apart. */
function evenVisits(count: number, gap: number, lastDaysAgo: number): Date[] {
  return Array.from({ length: count }, (_, i) => daysAgo(lastDaysAgo + (count - 1 - i) * gap));
}

describe("computeLoyalty", () => {
  it("throws when there are no visits", () => {
    expect(() => computeLoyalty([], NOW)).toThrow();
  });

  it("classifies a single recent visit as 'new'", () => {
    const result = computeLoyalty([daysAgo(5)], NOW);
    expect(result.loyaltyStatus).toBe("new");
    expect(result.visitCount).toBe(1);
    expect(result.avgDaysBetweenVisits).toBeNull();
    expect(result.consistencyCV).toBeNull();
  });

  it("classifies a single old visit as 'occasional' (outside the new window)", () => {
    const result = computeLoyalty([daysAgo(30)], NOW);
    expect(result.loyaltyStatus).toBe("occasional");
  });

  it("classifies 3+ consistent recent visits as 'regular'", () => {
    // 3 visits every 10 days, last one 5 days ago
    const result = computeLoyalty(evenVisits(3, 10, 5), NOW);
    expect(result.loyaltyStatus).toBe("regular");
    expect(result.avgDaysBetweenVisits).toBeCloseTo(10, 5);
    expect(result.consistencyCV).toBeCloseTo(0, 5);
  });

  it("classifies 6+ consistent recent visits as 'loyal'", () => {
    const result = computeLoyalty(evenVisits(6, 7, 3), NOW);
    expect(result.loyaltyStatus).toBe("loyal");
  });

  it("downgrades a high-but-erratic-cadence customer to 'regular' (not loyal)", () => {
    // 6 visits but wildly irregular spacing, most recent very recent so not at-risk
    const dates = [daysAgo(200), daysAgo(190), daysAgo(180), daysAgo(60), daysAgo(20), daysAgo(2)];
    const result = computeLoyalty(dates, NOW);
    expect(result.consistencyCV).not.toBeNull();
    expect(result.consistencyCV as number).toBeGreaterThan(0.6);
    expect(result.loyaltyStatus).toBe("regular");
  });

  it("classifies an established cadence with a long current gap as 'at_risk'", () => {
    // ~every 10 days historically, but last visit was 40 days ago (40 > 2*10)
    const dates = [daysAgo(70), daysAgo(60), daysAgo(50), daysAgo(40)];
    const result = computeLoyalty(dates, NOW);
    expect(result.loyaltyStatus).toBe("at_risk");
  });

  it("prioritizes 'at_risk' over 'loyal' when a loyal customer goes quiet", () => {
    // 6 consistent visits every 7 days, but the most recent was 30 days ago (30 > 2*7=14)
    const dates = [daysAgo(65), daysAgo(58), daysAgo(51), daysAgo(44), daysAgo(37), daysAgo(30)];
    const result = computeLoyalty(dates, NOW);
    expect(result.loyaltyStatus).toBe("at_risk");
  });

  it("classifies 2 recent visits (not enough for regular, not at-risk) as 'occasional'", () => {
    const result = computeLoyalty([daysAgo(8), daysAgo(2)], NOW);
    expect(result.loyaltyStatus).toBe("occasional");
    expect(result.visitCount).toBe(2);
  });

  it("computes avgDaysBetweenVisits and firstVisit/lastVisit correctly", () => {
    const dates = evenVisits(4, 15, 10); // every 15 days, last 10 days ago
    const result = computeLoyalty(dates, NOW);
    expect(result.avgDaysBetweenVisits).toBeCloseTo(15, 5);
    expect(result.daysSinceLastVisit).toBeCloseTo(10, 5);
    expect(result.firstVisitAt.getTime()).toBe(dates[0].getTime());
    expect(result.lastVisitAt.getTime()).toBe(dates[dates.length - 1].getTime());
  });

  it("sorts unordered input defensively", () => {
    const result = computeLoyalty([daysAgo(2), daysAgo(40), daysAgo(20)], NOW);
    expect(result.firstVisitAt.getTime()).toBe(daysAgo(40).getTime());
    expect(result.lastVisitAt.getTime()).toBe(daysAgo(2).getTime());
  });
});
