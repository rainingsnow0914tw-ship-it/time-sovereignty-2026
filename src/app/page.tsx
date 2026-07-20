import { headers } from "next/headers";

import { OnboardingFlow } from "../features/onboarding/onboarding-flow";
import { LocaleProvider } from "../i18n/locale";

export type OnboardingProfile = "default" | "play";

export function resolveOnboardingProfile(
  requestedProfile: string | string[] | undefined,
  host: string | null,
): OnboardingProfile {
  const privatePreviewHost =
    typeof host === "string" &&
    /^(live-mobile|v2-private)---time-sovereignty-[a-z0-9-]+\.a\.run\.app(?::\d+)?$/i.test(
      host,
    );
  return requestedProfile === "play" || privatePreviewHost ? "play" : "default";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string | string[] }>;
}) {
  const requestedProfile = (await searchParams).profile;
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const profile = resolveOnboardingProfile(requestedProfile, host);
  return (
    <LocaleProvider>
      <OnboardingFlow profile={profile} />
    </LocaleProvider>
  );
}
