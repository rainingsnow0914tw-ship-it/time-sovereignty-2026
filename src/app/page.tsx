import { OnboardingFlow } from "../features/onboarding/onboarding-flow";
import { LocaleProvider } from "../i18n/locale";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string | string[] }>;
}) {
  const requestedProfile = (await searchParams).profile;
  const profile = requestedProfile === "play" ? "play" : "default";
  return (
    <LocaleProvider>
      <OnboardingFlow profile={profile} />
    </LocaleProvider>
  );
}
