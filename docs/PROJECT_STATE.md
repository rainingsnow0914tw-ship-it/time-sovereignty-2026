# 已完成

- 公開 V1 固定在 Cloud Run revision `time-sovereignty-00024-dih`、100% 正式流量；私人 V2 repo 無 remote，不會誤推公開版。
- 私人 V2 已具備真 Cloud Tasks、Firestore、FCM、GPT-5.6、文字／語音／照片回報、結構化決策、Episode、分層記憶、後續排程與安全 trace。
- 目標隔離已完成：新排程強制攜帶穩定 `goalId`，session 以 goal-scoped pointers 分隔 active／last-confirmed；不同目標不共享 goal memory，橋式不再讀到杯子結案。
- 目標隔離版已部署至私人 tags `v2-private`／`live-mobile`（revision `time-sovereignty-00050-pid`）；兩個 health 200、未授權 native route 401，V1 未動。
- Android 提醒已改為被動通知／短促提示／來電使用不同通知身分；Level 2 真雲端鈴聲與震動可達，使用者回應後可進真 GPT-5.6 決策。
- Android 已加入硬安全出口：鈴聲最長 30 秒，離開或重開原生 App 必停，主畫面固定有「立即停止所有提醒」並清除鈴聲、震動與本 App 通知。
- Chloe 在 S25 實測六項全過：本機預覽會響／震、不回答可離開、重開 App 即停、手動停止按鈕可用、停止提示可見。

# 正在做

- 將真人測試揭露的 AI／UX 問題改為真 GPT-5.6 協商：多時段 cadence、逐條假設確認、計畫修訂、時區文字、回報 intent 按鈕與 PWA 版本更新。

# 下一步

- **第一個動作：依 `docs/QA_CHECKLIST_2026-07-20_VOICE_ANSWER.md` 做真人手機 QA。**
  該清單只需要一支手機與約 15 分鐘，每一步都寫了預期結果與失敗時該回報什麼。
  其中第 1 步（私人即時路徑是否恢復）是 `207ba57` 的驗收；第 4–6 步是「接聽並說話」
  （`82acead`）的驗收，也是本輪唯一尚未取得真人證據的功能。
- 已驗證的部分（2026-07-20，實機）：來電畫面五顆按鈕、接聽會開啟已安裝的 WebAPK
  而非預設瀏覽器、開啟後配對與目標完整保留。**未驗證：實際語音對話。**
- 先修 PWA 部署後仍可能執行舊 JavaScript 的更新機制，避免新版 backend 要求 `goalId` 時舊 client 持續 400／409。
- 再修 GPT-5.6 的時區上下文與三個假協商入口，讓 Chloe 用手機逐項真測；API 不省，mock 只做回歸。
- 恢復正式安靜時段 `22:30–08:00`，完成一次端到端驗收與乾淨 checkpoint。
- 凍結產品程式後，只更新 GitHub／README／Devpost Story；影片不重剪，Devpost 最後提交前再確認公開證據。

# 已知問題

- **兩條開發線共用同一個 Cloud Run 服務與 Firestore，資料格式互不相容（2026-07-20）**。
  本線 session 使用 `goalStates`（goal-scoped pointers）、無 `ownerId`；平行線
  `codex/longitudinal-goal-loop`（本機路徑 `Desktop/openAI build week202607130721`）
  相反——有 `ownerId`，且在 commit `5bfd599` 明確刪除 `goalStates`。因此**後部署的
  一方會讓另一方的既有配對失效**。
  **session 讀取已於 `207ba57` 以非破壞性方式修復**：`ownerId` 改為 optional，
  被接受且在寫回時保留（不刪除、不改寫任何既有文件）；`goalStates` 原本就有
  `.default({})`。跨線相容性由 `session-cross-line-compatibility.test.ts` 五項測試
  涵蓋，其中一項確認真正未知的欄位仍會被拒絕，嚴格性未被弱化。
  **仍未解決的部分**：其他集合（`live_checkins`、`live_goal_workspaces` 等）的跨線
  相容性尚未逐一驗證；本線在 `live_checkins` 上是否也會遇到同型問題，需要真人 QA
  走過一次才知道。兩線是否合併、或長期只保留一線，屬產品取捨，未決定。
- 安裝式 PWA 曾保留舊 client：舊輪詢沒有 `goalId` 而連續 400，舊 check-in confirm 409；本輪用版本化導航恢復為 `current?goalId=...` 200，但需產品化更新策略。
- 「每天三次橋式」目前仍會被單一 `preferredCheckInTime` 壓成每天一次；行動提醒與每日回顧需分開並允許 AI 產生多時段／彈性規則。
- `Assumptions to confirm`、`Tell me what feels wrong`、`Adjust plan` 仍不是完整的 GPT-5.6 修訂閉環。
- 有文字時「延後一次／情況有變」的視覺與可用狀態不清楚，只剩「送出更新」可用；需讓 intent 選擇可理解。
- GPT-5.6 曾把 UTC `2026-07-19 22:34` 錯標成 `Asia/Macau`，雖結構化 follow-up 正確顯示本地 `06:34`，但人類可見承諾文字不可保留此矛盾。
- 測試安靜時段仍為 `07:00–05:00`，驗收後必須恢復 `22:30–08:00`。
- tier-specific Android notification ID 已通過單元測試與 APK 建置；在簡化為「能響且一定能停」後，未再要求重跑多級全螢幕雲端驗收，不得對外宣稱本輪已重驗全螢幕。

# 最近測試結果

- Web：44 test files 通過、5 skipped；173 tests 通過、9 skipped；lint、typecheck、Next production build 通過。
- Goal isolation：11/11 targeted tests 通過；橋式頁面讀取穩定 goal ID，雲端輪詢 `current?goalId=...` 連續 200。
- Android：`testDebugUnitTest assembleDebug` BUILD SUCCESSFUL；修正版 APK 以保留資料方式安裝至指定 S25，配對與 `USE_FULL_SCREEN_INTENT: allow` 保留。
- 真雲端 2026-07-20 06:34：Level 1 安靜通知、Level 2 短促鈴聲／震動均到達；Chloe 親耳確認。
- 真 GPT-5.6：對「技術阻礙已解除」判為 `BLOCKED / RESCHEDULE` 並建立短期 follow-up；同時揭露時區文字 bug與回報按鈕 UX bug。
- Android safety 2026-07-20 06:49：Chloe 逐項驗證六項停止路徑全部通過。

# 最後更新時間

- 2026-07-20 06:52（Asia/Shanghai）
