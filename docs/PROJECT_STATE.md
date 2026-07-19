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

# 正在做

- 準備 native pairing／FCM contract checkpoint；接著建立 Firebase Android app 與 tag-only Cloud Run preview。

# 下一步

- 第一個動作：在現有 GCP project 新增獨立 Firebase Android app，讓 `google-services.json` 只留本機且維持 Git ignored；取得 S25 的真 FCM token。
- 然後以 tag-only Cloud Run preview 驗證 PWA pairing ticket → Android pair → 一次真 push；未回應升級與 response persistence 後接。

# 已知問題

- Android App 尚未配對 Firebase，因此目前只通過本機假電話外殼；按鈕尚未回寫後端或真正排程。
- V2 尚未建立 Firebase Android app、tag-only Cloud Run preview 或私有 Git remote。
- Catch Loop 本機 backend 可能落後 Cloud Shell；第一階段不依賴它的 runtime 狀態。
- V1 Devpost submission 仍為 Draft，預計臺灣時間 2026-07-20 20:00 起進行正式提交。

# 最近測試結果

- `npm test -- src/catch-v2/escalation.test.ts`：18/18 通過。
- `npm run typecheck`：通過。
- `npm run lint`：通過。
- `npm test -- src/catch-v2`：4 test files、26/26 通過；native credential、一次性票、撤銷與 FCM 單次送出契約均已覆蓋。
- Android `:app:assembleDebug`：通過；APK 已安裝到 SM-S9380。
- 2026-07-19 19:17 +08:00 實機：有聲響鈴＋震動、畫面完整、選擇後 `MainActivity` 恢復，vibrator `IDLE`、amplitude `0.0`、audio `In ring or call: false`。
- V1 與兩份 Catch Loop 參考 repo 均未被修改；V2 仍無 remote。

# 最後更新時間

- 2026-07-19 19:28（Asia/Shanghai）
