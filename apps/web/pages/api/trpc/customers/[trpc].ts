// [looknbook] tRPC HTTP endpoint for the customers (history & loyalty) router.
// Each viewer sub-router is served from its own /api/trpc/<endpoint> route (see ENDPOINTS in @calcom/trpc/react/shared).
import { createNextApiHandler } from "@calcom/trpc/server/createNextApiHandler";
import { customersRouter } from "@calcom/trpc/server/routers/viewer/customers/_router";

export default createNextApiHandler(customersRouter);
