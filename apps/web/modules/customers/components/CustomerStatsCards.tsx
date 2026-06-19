"use client";

// [looknbook] Four summary stat cards for the Customers dashboard.
import type { CustomerStats } from "@calcom/features/customers/types";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import classNames from "@calcom/ui/classNames";

export function CustomerStatsCards({ stats }: { stats: CustomerStats }) {
  const { t } = useLocale();

  const cards: { labelKey: string; value: number; accent?: boolean }[] = [
    { labelKey: "total_customers", value: stats.totalCustomers },
    { labelKey: "returning", value: stats.returning },
    { labelKey: "new_this_month", value: stats.newThisMonth },
    { labelKey: "at_risk", value: stats.atRisk, accent: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.labelKey} className="bg-accent border-subtle rounded-lg border p-4">
          <p className="text-subtle text-sm">{t(card.labelKey)}</p>
          <p className={classNames("mt-1 text-2xl font-bold", card.accent ? "text-error" : "text-emphasis")}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
