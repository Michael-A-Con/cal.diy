// [looknbook] Frequency label helper for the Customers list.
import type { TFunction } from "i18next";

/**
 * Returns a localized cadence label (e.g. "every ~21 days"), or null when there's no
 * established cadence yet (single-visit customers — no label shown, per product decision).
 */
export function formatFrequency(avgDaysBetweenVisits: number | null, t: TFunction): string | null {
  if (avgDaysBetweenVisits === null) return null;
  return t("every_n_days", { count: avgDaysBetweenVisits });
}
