// [looknbook] Input schema for viewer.customers.list
import { z } from "zod";

export const ZListCustomersInputSchema = z.object({
  filter: z.enum(["all", "loyal", "recent", "at_risk"]).optional(),
  sortBy: z.enum(["visits", "lastVisit", "name"]).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type TListCustomersInputSchema = z.infer<typeof ZListCustomersInputSchema>;
