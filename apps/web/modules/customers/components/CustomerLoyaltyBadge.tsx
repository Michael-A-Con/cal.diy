"use client";

// [looknbook] Maps a loyalty status to a themed Badge.
import type { LoyaltyStatus } from "@calcom/features/customers/types";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Badge } from "@calcom/ui/components/badge";

type BadgeVariant = "green" | "gray" | "blue" | "red" | "grayWithoutHover";

const STATUS_MAP: Record<LoyaltyStatus, { variant: BadgeVariant; labelKey: string }> = {
  loyal: { variant: "green", labelKey: "loyalty_loyal" }, // brand green
  regular: { variant: "gray", labelKey: "loyalty_regular" },
  new: { variant: "blue", labelKey: "loyalty_new" },
  at_risk: { variant: "red", labelKey: "loyalty_at_risk" },
  occasional: { variant: "grayWithoutHover", labelKey: "loyalty_occasional" }, // muted/subtle
};

export function CustomerLoyaltyBadge({ status }: { status: LoyaltyStatus }) {
  const { t } = useLocale();
  const { variant, labelKey } = STATUS_MAP[status];
  return <Badge variant={variant}>{t(labelKey)}</Badge>;
}
