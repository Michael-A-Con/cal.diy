"use client";

// [looknbook] A single customer row in the Customers list.
import type { CustomerDto } from "@calcom/features/customers/types";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { formatFrequency } from "../lib/formatFrequency";
import { CustomerLoyaltyBadge } from "./CustomerLoyaltyBadge";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CustomerListItem({ customer }: { customer: CustomerDto }) {
  const {
    t,
    i18n: { language },
  } = useLocale();

  const eventTypeTitle = customer.eventTypes[0]?.title;
  const frequency = formatFrequency(customer.avgDaysBetweenVisits, t);
  const subline = [eventTypeTitle, frequency].filter(Boolean).join(" · ");
  const lastVisit = new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(
    new Date(customer.lastVisitAt)
  );

  return (
    <button
      type="button"
      // [looknbook] detail view comes in a later phase — log for now
      onClick={() => console.log("[looknbook] customer clicked", customer.id)}
      className="bg-default hover:bg-accent border-subtle flex w-full items-center gap-3 rounded-lg border p-3 text-left transition">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: "#9AB17A" }}
        aria-hidden="true">
        {getInitials(customer.displayName)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-emphasis truncate font-medium">{customer.displayName}</p>
        {subline ? <p className="text-subtle truncate text-sm">{subline}</p> : null}
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-emphasis text-sm font-semibold">
          {customer.visitCount} {t("visits_label")}
        </p>
        <p className="text-subtle text-xs">
          {t("last_visit")}: {lastVisit}
        </p>
      </div>

      <CustomerLoyaltyBadge status={customer.loyaltyStatus} />
    </button>
  );
}
