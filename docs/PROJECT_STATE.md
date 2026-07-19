# 已完成

- 從公開 V1 checkpoint `20ca832` 建立獨立本機 V2 repo；已移除 remote，V1 未受影響。
- 讀取 Catch Contract、交接摘要與蒸餾包；確認只搬行為契約，不碰兩份 dirty 參考 repo。
- Decision 0017 已定義私人 V2 的排程、FCM、假電話、回應、follow-up 與記憶驗收邊界。
- 已建立 `src/catch-v2/` escalation domain：`1 -> 2 -> 4 -> null`、安靜時段／同意／暫停／健康狀態等停止條件，以及五種 response domain events。
- `reschedule` 已由 schema 強制攜帶延後分鐘數，後續 adapter 必須建立可持久化的下一個事件。
- 已建立全新包名 `ai.timesovereignty.privateapp` 的 Android thin client 外殼，與既有 Catch Loop 並存且不覆蓋。
- S25 Ultra 實機已驗證：靜音時不越權響／震；有聲時 bounded 鈴聲與震動、完整四按鈕畫面、選擇後立即停止並回主畫面。
- 已建立 `scripts/call-chloe.ps1`；只有需要 Chloe 解鎖、批准或按手機時才播放兩次指定提示音。
- 已建立 native pairing／auth 邊界：PWA 簽發 10 分鐘一次性票、Android 換取雜湊保存的可撤銷憑證，期限不超過原 live session。
- 已建立 FCM HTTP v1 data-only adapter：flat string payload、高優先 Android delivery、零內部 retries、穩定 idempotency key，且錯誤不暴露 token。
- PWA live session 撤銷會同步撤銷 native device；手機也可用 bearer credential 自我撤銷。
- 已在 `time-sovereignty-2026` 啟用 Firebase Management、FCM 與 Installations，建立獨立 Android app `ai.timesovereignty.privateapp`；設定檔僅存在 Git ignored 本機路徑。
- 真 FCM Level 4 鎖屏驗收通過：SM-S9380 從 `Dozing` 自行變 `Awake`，全螢幕 Incoming Check-in、鈴聲、震動與四按鈕均正常，選擇後立即停止。
- 已建立 V2 專用 runtime 身分；只具 Firestore、Cloud Tasks、FCM 發送與三個既有 Secret 的必要存取，V1 runtime 未被加入 FCM 權限。
- tag-only Cloud Run preview `time-sovereignty-00039-fev` 已上線；`v2-private` 健康檢查 200，未授權 native API 401，正式 V1 仍為 `00024`、100% 流量。
- PWA 已加入 10 分鐘一次性 Android handoff；原生 App 可接 deep link、取得 FCM token、向受保護端點配對，並以 Android Keystore 加密保存 credential。
- S25 已完成真實 PWA → native 配對；Firestore 安全遮罩確認 session、token fingerprint、通知／全螢幕同意、期限與未撤銷狀態均存在，秘密未進日誌或 Git。
- 已實作 Cloud Tasks 驅動的 `1 → 2 → 4 → stop`：每級重新檢查回應 marker、安靜時段、同意、撤銷與狀態；FCM delivery receipt 可重試且 Android 依 idempotency key 去重。
- native 四按鈕現在會先停止鈴聲、寫入 immutable response event，再走與 PWA 共用的真 GPT-5.6 Chief／Recovery 管線並在原生畫面顯示結構化決策。
- 私人 revision `time-sovereignty-00048-yuz` 已使用 15 秒驗收間隔上線於 `v2-private`／`live-mobile` tags；正式 V1 仍為 `00024-dih`、100% 流量。
- S25 已更新 APK 且原 pairing credential 保留；正確的 WebAPK `profile=play` 可開到「開始下一個真實行動時段」。
- 修正第 1 級推播可能穿透安靜時段的安全洞；現在每一級送出前都走同一組安靜時段與同意圍欄。
- S25 真實抓人閉環已通過：Cloud Tasks `1 → 2 → 4`、全螢幕原生回應、GPT-5.6 Recovery／Chief 決策、PWA review、Firestore Episode／記憶與下一次 follow-up 均已落盤。
- 已確認「按鈕閃一下仍停舊頁」只是成功回傳中斷：雲端狀態為 `CONFIRMED` 且下一筆 Cloud Task 已存在，沒有資料遺失或重複呼叫。
- 已加入只讀式確認回復：回傳中斷時向雲端核對 current／last-confirmed，不重送 POST、不重打 GPT-5.6、不重建 task。
- S25 重整揭露第二個契約問題：確認後共有 Chief／Recovery／Chief／Memory Curator 四筆安全 trace，但 client schema 舊上限為三，導致 `/current` 讀回 400；已把 client 與 persisted schema 對齊為四並加回歸測試。
- `00048` 上 S25 已驗證 `/current` 200：current follow-up 為 `SCHEDULED`、last-confirmed 為 `CONFIRMED` 且四筆安全 trace；錯誤確認按鈕與舊失敗提示均已消失。
- 後續真實 follow-up 已完成記憶讀回與收尾：讀回 4 筆有限證據，Chief of Staff 判斷 `COMPLETED / RETIRE`，Chloe 確認後 Episode 與 Memory Curator 均落盤，且沒有建立下一筆 check-in 或 Cloud Task。
- 本次 follow-up 使用 Chief of Staff 與 Memory Curator 兩筆真 `openai / gpt-5.6-sol` 安全軌跡，共 3,336 tokens；安靜時段已恢復為 `22:30–08:00`。
- 原生「回到 PWA 確認」已從 finish-only 修為安全導向精確 `/?profile=play`；優先開啟 Chrome WebAPK、其次 Chrome，S25 實機已確認回到原杯子素描旅程且沒有掉進北極星 onboarding。
- Android 14+ 已加入全螢幕特殊存取的真實狀態檢查與使用者授權入口；debug-only 本機 Level 4 驗收讓 S25 從 `Dozing` 變 `Awake`，Chloe 確認全螢幕、鈴聲與震動三項均通過，全程未連雲端或 GPT-5.6。

# 正在做

- Android 本機通知到鎖屏的喚醒、全螢幕、鈴聲與震動已恢復並完成實機驗收；尚未用一筆新的真 FCM delivery 重驗先前 02:34 失敗的完整雲端到裝置路徑。

# 下一步

- 第一個動作：建立一個全新的短期橋式承諾，使用真 FCM／Cloud Tasks 跑一次 `1 → 2 → 4`，S25 鎖屏且前兩級故意不回應；不重用已 RETIRE 的杯子目標。
- Level 4 實機通過後再讓 Chloe 選擇一個真實回應，驗證寫入與後續承諾；只在需要使用者判斷時呼叫 GPT-5.6，不重跑已通過的記憶收尾。

# 已知問題

- V2 尚未建立私有 Git remote；原生端確認後續承諾目前仍回到 PWA 完成。
- 2026-07-20 02:34 的重複實機驗收中，FCM Level 1／2／4 provider receipts 均為 `DELIVERED`，但 S25 只顯示通知，沒有自動全螢幕、鈴聲或震動；需要 USB／ADB 定向診斷，不能把 provider receipt 當成裝置 UI 成功。
- `USE_FULL_SCREEN_INTENT` AppOp 的 `default`／reject timestamp 不能單獨當作根因：本機實機通過後仍可看到相同 AppOp 表面狀態；新版改以官方 `canUseFullScreenIntent()` 作產品判斷。
- 私人旅程存在 `play` storage profile；手動開缺少 `?profile=play` 的同源網址仍會正確進入空白 default onboarding，但原生返回路徑現在會強制使用正確 profile。
- Catch Loop 本機 backend 可能落後 Cloud Shell；第一階段不依賴它的 runtime 狀態。
- V1 Devpost submission 仍為 Draft，預計臺灣時間 2026-07-20 20:00 起進行正式提交。

# 最近測試結果

- `npm test -- src/catch-v2/escalation.test.ts`：18/18 通過。
- `npm run typecheck`：通過。
- `npm run lint`：通過。
- `npm test -- src/catch-v2`：4 test files、26/26 通過；native credential、一次性票、撤銷與 FCM 單次送出契約均已覆蓋。
- Android `:app:assembleDebug`：通過；APK 已安裝到 SM-S9380。
- 2026-07-19 19:17 +08:00 實機：有聲響鈴＋震動、畫面完整、選擇後 `MainActivity` 恢復，vibrator `IDLE`、amplitude `0.0`、audio `In ring or call: false`。
- 2026-07-19 19:45 +08:00 真 FCM 鎖屏實機：before `Dozing`、after `Awake`、top activity `IncomingCheckInActivity`；Chloe 確認全螢幕、鈴聲、震動與四按鈕，`downgrade` 後立即停止。
- 2026-07-19 20:03 +08:00 Cloud Run：`00039-fev` 以 V2 專用身分、min/max 1、0% stable traffic 上線；health 200、native 未授權 401；V1 `00024` 仍 100%。
- 2026-07-19 20:10 +08:00 pairing build：Vitest 37 files／153 tests 通過（另 5 files／9 tests skipped）；lint、typecheck、Next production build、Android Firebase debug APK 均通過。
- 2026-07-19 20:30 +08:00 pairing physical：原 WebAPK `profile=play` → 一次性票 → native App → Firestore device document 全鏈通過；V1 仍 `00024`、100%。
- 2026-07-19 23:51 +08:00 catch loop build：Vitest 41 files／164 tests 通過（另 5 files／9 tests skipped）；lint、typecheck、Next production build、Android Firebase APK 均通過。
- 2026-07-20 00:03 +08:00 quiet-hours regression：V2 targeted 40/40、全套 167 tests 通過（另 9 skipped）；lint、typecheck、Next production build 均通過。
- 2026-07-20 00:11 +08:00 private deploy：revision `00044-lel` Ready；兩個私人 tags 健康 200、native 無憑證 401、V1 `00024-dih` 仍 100%。
- 2026-07-20 00:28 +08:00 真實實機：Cloud Tasks Level 1／2／4 均單次送達；S25 全螢幕 `downgrade` → 三筆 GPT-5.6 trace（4,985 tokens）→ PWA review → Firestore `CONFIRMED`、Episode、memory、next task 均存在。
- 2026-07-20 00:52 +08:00 確認回復修正：focused 3/3、全套 170 tests 通過（另 9 skipped）；lint、typecheck、Next production build 均通過。
- 2026-07-20 01:03 +08:00 private deploy：revision `00046-woz` Ready；兩個私人 tags 健康 200、native 無憑證 401、V1 `00024-dih` 仍 100%。
- 2026-07-20 01:41 +08:00 四軌跡讀回修正：S25／Firestore 遮罩診斷確認 4-vs-3 schema 上限；targeted 9/9、全套 170 tests（另 9 skipped）、lint、typecheck、build 均通過。
- 2026-07-20 01:48 +08:00 final private acceptance：`00048-yuz` Ready；兩個私人 health 200、native 無憑證 401、S25 `/current` 200，確認按鈕與舊錯誤提示消失，21:14 follow-up 卡片可見；V1 仍 `00024-dih`、100%。
- 2026-07-20 02:34 +08:00 follow-up delivery：既有 task 提前執行，Level 1／2／4 provider receipts 均 `DELIVERED`，但 S25 未自動全螢幕、響鈴或震動；原生本輪回應未送出，判為 physical wake failure。
- 2026-07-20 03:06 +08:00 memory retirement：正確 `?profile=play` PWA 讀回現行旅程與 4 筆記憶；`COMPLETED / RETIRE` 經 Chloe 確認後為 `CONFIRMED`，Episode 1、Memory Curator `COMPLETED`、兩筆 `gpt-5.6-sol` traces 共 3,336 tokens、queue 空、無 next check-in／task，安靜時段 `22:30–08:00`。
- 2026-07-20 03:31 +08:00 Android return repair：`PrivatePwaReturnUrlTest` 5/5 通過，`:app:testDebugUnitTest :app:assembleDebug` BUILD SUCCESSFUL；APK 以保留資料方式安裝至指定 S25，實機由 Chrome WebAPK 開回原 `profile=play` 杯子旅程，Chloe 確認沒有出現北極星 onboarding。
- 2026-07-20 04:04 +08:00 Android local wake：全螢幕 policy 3/3＋既有導航 5/5 通過，APK BUILD SUCCESSFUL；S25 從 `Dozing` 變 `Awake` 且前景為 IncomingCheckInActivity，Chloe 確認鈴聲、震動與完整綠色全螢幕三項皆通過；零雲端、零 GPT。
- V1 與兩份 Catch Loop 參考 repo 均未被修改；V2 仍無 remote。

# 最後更新時間

- 2026-07-20 04:05（Asia/Shanghai）
