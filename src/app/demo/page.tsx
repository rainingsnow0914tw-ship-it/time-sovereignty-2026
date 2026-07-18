import { DemoLab } from "../../features/demo-lab/demo-lab";
import { LocaleProvider } from "../../i18n/locale";

export default function DemoPage() {
  return (
    <LocaleProvider>
      <DemoLab />
    </LocaleProvider>
  );
}
