import { PairingRecoveryPage } from "../../features/onboarding/pairing-recovery-page";
import { LocaleProvider } from "../../i18n/locale";

export default function PairPage() {
  return (
    <LocaleProvider>
      <PairingRecoveryPage />
    </LocaleProvider>
  );
}
