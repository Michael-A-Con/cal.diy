"use client";

import type { CustomerListFilter } from "@calcom/features/customers/types";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { EmptyScreen } from "@calcom/ui/components/empty-screen";
// [looknbook] Customers dashboard view — stats cards, filter pills, customer list, load-more.
import { useState } from "react";
import { CustomerFilterPills } from "./components/CustomerFilterPills";
import { CustomerListItem } from "./components/CustomerListItem";
import { CustomerStatsCards } from "./components/CustomerStatsCards";

const PAGE_SIZE = 50;

const EMPTY_STATS = { totalCustomers: 0, returning: 0, newThisMonth: 0, atRisk: 0 };

export function CustomersView() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<CustomerListFilter>("all");
  // Simple "load more": grow the limit from offset 0 so results accumulate in one query.
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data, isPending } = trpc.viewer.customers.list.useQuery({
    filter,
    sortBy: "visits", // default: most total bookings first
    limit,
    offset: 0,
  });

  const stats = data?.stats ?? EMPTY_STATS;
  const customers = data?.customers ?? [];

  const handleFilterChange = (next: CustomerListFilter) => {
    setFilter(next);
    setLimit(PAGE_SIZE); // reset paging when the filter changes
  };

  return (
    <div className="flex flex-col gap-6">
      <CustomerStatsCards stats={stats} />

      <CustomerFilterPills active={filter} onChange={handleFilterChange} />

      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-subtle h-16 w-full animate-pulse rounded-lg" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyScreen Icon="users" headline={t("no_customers_yet")} description={t("customers_subtitle")} />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {customers.map((customer) => (
              <CustomerListItem key={customer.id} customer={customer} />
            ))}
          </div>

          {data?.hasMore ? (
            <div className="flex justify-center">
              <Button color="secondary" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
                {t("load_more")}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
