import { OnboardingFlow } from "../features/onboarding/onboarding-flow";
import { LocaleProvider } from "../i18n/locale";

export default function Home() {
  return (
    <LocaleProvider>
      <OnboardingFlow />
    </LocaleProvider>
  );
}
