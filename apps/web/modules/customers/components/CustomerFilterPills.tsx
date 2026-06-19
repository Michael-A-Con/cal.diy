"use client";

// [looknbook] Filter pills for the Customers list.
import type { CustomerListFilter } from "@calcom/features/customers/types";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import classNames from "@calcom/ui/classNames";

const PILLS: { value: CustomerListFilter; labelKey: string }[] = [
  { value: "all", labelKey: "all" },
  { value: "loyal", labelKey: "most_loyal" },
  { value: "recent", labelKey: "recent" },
  { value: "at_risk", labelKey: "at_risk" },
];

export function CustomerFilterPills({
  active,
  onChange,
}: {
  active: CustomerListFilter;
  onChange: (filter: CustomerListFilter) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap gap-2">
      {PILLS.map((pill) => {
        const isActive = pill.value === active;
        return (
          <button
            key={pill.value}
            type="button"
            onClick={() => onChange(pill.value)}
            className={classNames(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              isActive
                ? "bg-brand-default text-brand"
                : "bg-default text-emphasis border-subtle hover:bg-accent border"
            )}>
            {t(pill.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
