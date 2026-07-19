# 已完成

- 從公開 V1 checkpoint `20ca832` 建立獨立本機 V2 repo；已移除 remote，V1 未受影響。
- 讀取 Catch Contract、交接摘要與蒸餾包；確認只搬行為契約，不碰兩份 dirty 參考 repo。
- Decision 0017 已定義私人 V2 的排程、FCM、假電話、回應、follow-up 與記憶驗收邊界。
- 已建立 `src/catch-v2/` escalation domain：`1 -> 2 -> 4 -> null`、安靜時段／同意／暫停／健康狀態等停止條件，以及五種 response domain events。
- `reschedule` 已由 schema 強制攜帶延後分鐘數，後續 adapter 必須建立可持久化的下一個事件。
- 已建立全新包名 `ai.timesovereignty.privateapp` 的 Android thin client 外殼，與既有 Catch Loop 並存且不覆蓋。
- S25 Ultra 實機已驗證：靜音時不越權響／震；有聲時 bounded 鈴聲與震動、完整四按鈕畫面、選擇後立即停止並回主畫面。
- 已建立 `scripts/call-chloe.ps1`；只有需要 Chloe 解鎖、批准或按手機時才播放兩次指定提示音。

# 正在做

- 準備 Android 實機外殼 checkpoint；接著建立受保護的裝置註冊、FCM delivery 與 response adapter。

# 下一步

- 第一個動作：定義不進 log／trace 的 FCM device registration contract，接到現有單裝置 session 與撤銷機制。
- 然後讓既有 Cloud Tasks callback 建立一次 Level 1 data-only push，未回應才依純函數安排 Level 2／4；`reschedule` 必須原子寫入下一事件。

# 已知問題

- Android App 尚未配對 Firebase，因此目前只通過本機假電話外殼；按鈕尚未回寫後端或真正排程。
- V2 尚未建立 Firebase Android app，也沒有私有 Git remote。
- Catch Loop 本機 backend 可能落後 Cloud Shell；第一階段不依賴它的 runtime 狀態。
- V1 Devpost submission 仍為 Draft，預計臺灣時間 2026-07-20 20:00 起進行正式提交。

# 最近測試結果

- `npm test -- src/catch-v2/escalation.test.ts`：18/18 通過。
- `npm run typecheck`：通過。
- `npm run lint`：通過。
- Android `:app:assembleDebug`：通過；APK 已安裝到 SM-S9380。
- 2026-07-19 19:17 +08:00 實機：有聲響鈴＋震動、畫面完整、選擇後 `MainActivity` 恢復，vibrator `IDLE`、amplitude `0.0`、audio `In ring or call: false`。
- V1 與兩份 Catch Loop 參考 repo 均未被修改；V2 仍無 remote。

# 最後更新時間

- 2026-07-19 19:17（Asia/Shanghai）
