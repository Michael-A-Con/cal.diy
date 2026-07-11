import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { MembershipRepository } from "@calcom/features/membership/repositories/MembershipRepository";
import { APP_NAME } from "@calcom/lib/constants";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { _generateMetadata } from "app/_utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// [looknbook] Plan-selection screen skipped — every business is a single "personal" account.
// To restore the plan picker, uncomment the import below and the <OnboardingView> render.
// import { OnboardingView } from "~/onboarding/getting-started/onboarding-view";

export const generateMetadata = async () => {
  return await _generateMetadata(
    (t) => `${APP_NAME} - ${t("getting_started")}`,
    () => "",
    true,
    undefined,
    "/onboarding/getting-started"
  );
};

const ServerPage = async () => {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });

  if (!session?.user?.id) {
    return redirect("/auth/login");
  }

  // If user has any team membership (pending or accepted), redirect them directly to personal onboarding
  // This handles the case where users sign up with an invite token (membership is auto-accepted)
  const hasTeamMembership = await MembershipRepository.hasAnyTeamMembershipByUserId({
    userId: session.user.id,
  });
  if (hasTeamMembership) {
    return redirect("/onboarding/personal/settings");
  }

  // [looknbook] Skip the plan-selection step and go straight to personal onboarding.
  // The onboarding store defaults selectedPlan to "personal" and the personal flow
  // never reads selectedPlan, so this is a safe, direct passthrough.
  return redirect("/onboarding/personal/settings");
};

export default ServerPage;
