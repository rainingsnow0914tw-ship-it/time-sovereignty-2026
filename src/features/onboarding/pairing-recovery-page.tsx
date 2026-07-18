"use client";

import { useState, type FormEvent } from "react";

import { LanguageToggle, Localized } from "../../i18n/locale";
import {
  LivePairingClientError,
  pairLiveGoalArchitectDevice,
} from "./live-goal-architect-client";

const inputClass =
  "w-full rounded-2xl border border-[#d9dfda] bg-[#fbfbf8] px-4 py-3.5 text-[15px] text-[#17211d] outline-none focus:border-[#527b6b] focus:bg-white focus:ring-4 focus:ring-[#dce9df]/70";
const buttonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#173f35] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(23,63,53,0.18)] disabled:cursor-not-allowed disabled:opacity-45";

export function PairingRecoveryPage() {
  const [pairingCode, setPairingCode] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("Android PWA");
  const [busy, setBusy] = useState(false);
  const [paired, setPaired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pair = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await pairLiveGoalArchitectDevice({ pairingCode, deviceLabel });
      setPairingCode("");
      setPaired(true);
    } catch (caught) {
      setError(
        caught instanceof LivePairingClientError && caught.status === 401
          ? "The one-time pairing code is invalid or expired."
          : caught instanceof LivePairingClientError && caught.status === 409
            ? "This code was already used or another device is currently paired."
            : "The device could not be paired. Please retry safely.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Localized>
      <main className="min-h-screen bg-[#f5f6f1] px-5 py-8 text-[#17211d] sm:px-8">
        <div className="mx-auto flex max-w-xl justify-end">
          <LanguageToggle />
        </div>
        <section className="mx-auto mt-5 max-w-xl rounded-[2rem] border border-[#dfe5df] bg-white p-6 shadow-[0_20px_65px_rgba(23,63,53,0.1)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#547162]">
            Protected session recovery
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#173f35]">
            Re-pair without losing your goal
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#59675f]">
            Keep the original goal tab open. Pairing here restores its protected
            cookie without clearing the three answers waiting in that tab.
          </p>

          {paired ? (
            <div className="mt-6 rounded-2xl border border-[#b9d4c4] bg-[#eff8f1] p-5">
              <p className="font-semibold text-[#285440]">Pairing restored.</p>
              <p className="mt-2 text-sm leading-6 text-[#476556]">
                Return to the original goal tab and press Create my plan once.
                The same protected request will continue.
              </p>
            </div>
          ) : (
            <form onSubmit={pair} className="mt-6 space-y-4">
              <label className="block text-xs font-bold text-[#45574e]">
                New one-time pairing code
                <input
                  className={`${inputClass} mt-2`}
                  type="password"
                  autoComplete="one-time-code"
                  value={pairingCode}
                  onChange={(event) => setPairingCode(event.target.value)}
                />
              </label>
              <label className="block text-xs font-bold text-[#45574e]">
                Device label
                <input
                  className={`${inputClass} mt-2`}
                  value={deviceLabel}
                  maxLength={120}
                  onChange={(event) => setDeviceLabel(event.target.value)}
                />
              </label>
              {error ? (
                <p role="alert" className="rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#8a432c]">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className={buttonClass}
                disabled={busy || pairingCode.length < 12 || !deviceLabel.trim()}
              >
                {busy ? "Pairing…" : "Restore pairing"}
              </button>
            </form>
          )}

          <p className="mt-6 text-xs leading-5 text-[#657169]">
            The OpenAI API key remains server-side. This page receives only the
            signed, expiring device cookie.
          </p>
        </section>
      </main>
    </Localized>
  );
}
