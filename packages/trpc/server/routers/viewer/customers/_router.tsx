// [looknbook] Customers router — customer history & loyalty aggregation.
import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { ZListCustomersInputSchema } from "./list.schema";

export const customersRouter = router({
  list: authedProcedure.input(ZListCustomersInputSchema).query(async ({ input, ctx }) => {
    const { listHandler } = await import("./list.handler");

    return listHandler({ ctx, input });
  }),
});
