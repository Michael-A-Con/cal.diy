// [looknbook] Thin handler — maps the request to the customer aggregation service.
import { CustomerRepository } from "@calcom/features/customers/repository/CustomerRepository";
import { CustomerAggregationService } from "@calcom/features/customers/service/CustomerAggregationService";
import type { PrismaClient } from "@calcom/prisma/client";

import type { TrpcSessionUser } from "../../../types";
import type { TListCustomersInputSchema } from "./list.schema";

type ListOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
    prisma: PrismaClient;
  };
  input: TListCustomersInputSchema;
};

export const listHandler = async ({ ctx, input }: ListOptions) => {
  const service = new CustomerAggregationService(new CustomerRepository(ctx.prisma));

  return service.list({
    userId: ctx.user.id,
    hostEmail: ctx.user.email ?? null,
    filter: input.filter,
    sortBy: input.sortBy,
    search: input.search,
    limit: input.limit,
    offset: input.offset,
  });
};
