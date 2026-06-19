// [looknbook] Customers (history & loyalty) route — server component.
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { _generateMetadata, getTranslate } from "app/_utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { CustomersView } from "~/customers/customers-view";
import { ShellMainAppDir } from "../ShellMainAppDir";

export const generateMetadata = async () => {
  return await _generateMetadata(
    (t) => t("customers"),
    (t) => t("customers_subtitle"),
    undefined,
    undefined,
    "/customers"
  );
};

const Page = async () => {
  const _headers = await headers();
  const _cookies = await cookies();
  const session = await getServerSession({ req: buildLegacyRequest(_headers, _cookies) });
  if (!session?.user?.id) {
    return redirect("/auth/login");
  }

  const t = await getTranslate();

  return (
    <ShellMainAppDir heading={t("customers")} subtitle={t("customers_subtitle")}>
      <CustomersView />
    </ShellMainAppDir>
  );
};

export default Page;
