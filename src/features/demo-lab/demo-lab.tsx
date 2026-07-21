"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { useLocale } from "../../i18n/locale";
import { JourneyWorkspace } from "../journey/journey-workspace";
import { createDemoLabRecord } from "./story";

export function DemoLab() {
  const { locale } = useLocale();
  const [resetVersion, setResetVersion] = useState(0);
  const record = useMemo(() => createDemoLabRecord(locale), [locale]);
  const chinese = locale === "zh-TW";

  return (
    <main className="min-h-screen bg-[#eef2eb] px-3 py-4 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-[1480px]">
        <section className="mb-4 overflow-hidden rounded-[1.7rem] border border-[#173f35]/10 bg-white shadow-[0_18px_55px_rgba(23,63,53,0.08)]">
          <div className="grid gap-6 bg-[#173f35] px-6 py-7 text-white lg:grid-cols-[1.25fr_0.75fr] lg:px-9">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#d8f48a]">
                <span>Demo Lab</span>
                <span className="rounded-full border border-[#d8f48a]/35 px-3 py-1">
                  {chinese ? "腳本模擬" : "Scripted simulation"}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                {chinese
                  ? "把 30 天壓縮成 90 秒，看見計畫如何熬過真實生活。"
                  : "Compress 30 days into 90 seconds and watch a plan survive real life."}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
                {chinese
                  ? "這是一個隔離的插畫練習故事：延後、恢復、縮小行動、進度見證、有限記憶與目標校準都會出現。"
                  : "This isolated illustration-practice story shows delay, recovery, a smaller action, progress witness, limited memory, and goal recalibration."}
              </p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-white/6 p-5 text-sm leading-6 text-white/72">
              <p className="font-bold text-[#d8f48a]">
                {chinese ? "誠實邊界" : "Honest boundary"}
              </p>
              <ul className="mt-3 space-y-2">
                <li>✓ {chinese ? "不呼叫 API" : "No API calls"}</li>
                <li>✓ {chinese ? "不讀取私人手機工作階段" : "No private phone session"}</li>
                <li>✓ {chinese ? "所有 trace 明確標示 mock" : "Every trace is labeled mock"}</li>
                <li>✓ {chinese ? "使用同一套狀態與 schema" : "Same state and schema contracts"}</li>
              </ul>
              {/* The live layer is deliberately absent here: opening it to an
                  unpaired visitor would mean anyone could spend the owner's
                  model budget. Saying what it does, and showing it on video,
                  costs nothing and stops the pairing link being a dead end. */}
              <p className="mt-5 font-bold text-[#d8f48a]">
                {chinese ? "配對後的即時層另外包含" : "The paired live layer also has"}
              </p>
              <ul className="mt-2 space-y-2">
                <li>· {chinese ? "可以打斷的即時語音對話" : "Interruptible real-time voice"}</li>
                <li>· {chinese ? "把對話整理成重點，不確定就反問" : "Spoken turns merged into a report, questions when unsure"}</li>
                <li>· {chinese ? "答案需要外部事實時會查證來源" : "Sourced web lookup when an answer needs it"}</li>
                <li>· {chinese ? "Android 全螢幕來電，拒絕比忽略難" : "Android full-screen call, harder to ignore than a chime"}</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href="https://youtu.be/d0cX1V4R7h4"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-[#d8f48a] px-4 py-2 text-xs font-bold text-[#173f35] hover:bg-[#c7e86f]"
                >
                  {chinese ? "▶ 看即時層實際運作" : "▶ Watch the live layer"}
                </a>
                <Link
                  href="/?profile=play"
                  className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  {chinese ? "私人真實產品（需要配對）" : "Private live product (pairing required)"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <JourneyWorkspace
          key={`${locale}-${resetVersion}`}
          record={record}
          onReset={() => setResetVersion((current) => current + 1)}
          liveCheckInEnabled={false}
          showLocalSimulation
          demoLab
        />
      </div>
    </main>
  );
}
