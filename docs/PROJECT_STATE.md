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
- 私人 revision `time-sovereignty-00046-woz` 已使用 15 秒驗收間隔上線於 `v2-private`／`live-mobile` tags；正式 V1 仍為 `00024-dih`、100% 流量。
- S25 已更新 APK 且原 pairing credential 保留；正確的 WebAPK `profile=play` 可開到「開始下一個真實行動時段」。
- 修正第 1 級推播可能穿透安靜時段的安全洞；現在每一級送出前都走同一組安靜時段與同意圍欄。
- S25 真實抓人閉環已通過：Cloud Tasks `1 → 2 → 4`、全螢幕原生回應、GPT-5.6 Recovery／Chief 決策、PWA review、Firestore Episode／記憶與下一次 follow-up 均已落盤。
- 已確認「按鈕閃一下仍停舊頁」只是成功回傳中斷：雲端狀態為 `CONFIRMED` 且下一筆 Cloud Task 已存在，沒有資料遺失或重複呼叫。
- 已加入只讀式確認回復：回傳中斷時向雲端核對 current／last-confirmed，不重送 POST、不重打 GPT-5.6、不重建 task。
- S25 重整揭露第二個契約問題：確認後共有 Chief／Recovery／Chief／Memory Curator 四筆安全 trace，但 client schema 舊上限為三，導致 `/current` 讀回 400；已把 client 與 persisted schema 對齊為四並加回歸測試。

# 正在做

- 將已通過完整本機驗證的四軌跡讀回修正部署到私人 V2 tags；公開 V1 不動。

# 下一步

- 第一個動作：建立 tag-only 私人 revision，驗證 `/current` 由 400 恢復為 200；不得再次按確認或重跑 GPT-5.6。
- 若顯示已確認／下一次報到已排程，記錄最終手機驗收並凍結本段；若仍顯示待確認，只檢查 service worker／快取，不重做後端閉環。

# 已知問題

- V2 尚未建立私有 Git remote；原生端確認後續承諾目前仍回到 PWA 完成。
- `00046` 的 `/current` 因 client trace 上限落後 persisted schema 而回 400；本機已修正，尚待新私人 revision 與 S25 最後視覺確認。
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
- V1 與兩份 Catch Loop 參考 repo 均未被修改；V2 仍無 remote。

# 最後更新時間

- 2026-07-20 01:41（Asia/Shanghai）
