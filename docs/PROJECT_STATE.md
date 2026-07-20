# 已完成

- Phase 1–8、雙狀態機、四 Agent、Cloud Tasks、Firestore、OIDC、雙語 PWA、GPT-5.6 結構化決策、安全 trace、Realtime 語音、照片回報與真實 Goal Architect 均已完成。
- 私人 Android 真實旅程與兩次同目標記憶閉環已通過；Strategy 仍為 `TENTATIVE`，confidence `0.35 → 0.47`，四次真實 Agent 呼叫共 5,447 tokens、零 SDK retries。
- Decision 0016 已凍結私人產品核心；正式版 `00024` 仍 100%，記憶驗收版 `00036` 僅 tag、0% 正式流量。
- 隔離 `/demo` 與雲端版 `00038` 已通過：Day 30、四 Agent mock trace、0 個 `/api/*`、overlay 0、console error 0；`00024` 仍 100%。
- 最終公開提交包已完成：judge-first README、391 字英文旁白／2:56 shot list、Devpost 文案、提交清單、新版 Mermaid 與同步 PNG 架構圖。
- 正式 2:56 影片已完成並由 Chloe 與司機先生兩次觀看批准；YouTube 顯示 2:57，已於 `Chloe Kao` 頻道公開發布：https://youtu.be/d0cX1V4R7h4。著作權與社群規範檢查均無問題，未登入 oEmbed 驗證回傳正確標題與作者。
- Devpost 已於 2026-07-20 07:51 +08:00 正式提交，作品頁為 https://devpost.com/software/chief-of-staff-sm5evr；提交基線為 `20ca832`，標記 `v1.0.0-submitted`，截止前仍可編輯。
- 長期目標第一段資料契約已完成：多目標 workspace、多時段排程、Plan revision、結構化出勤與無內容刪除 tombstone；Decision 0017 已接受。
- 受保護的雲端目標後端已完成：穩定 owner 跨 session 保存、Save/List/Open、狀態轉換、刪除、Cloud Task 取消與晚到回呼圍欄。
- 真 GPT-5.6 計畫修訂迴路已完成：自由回饋、逐條假設確認／否定／改寫及手動編輯都會重新呼叫結構化 Goal Architect，不再只是把文字附註到本機。
- PWA 長期目標入口已完成：確認後寫入私人雲端 workspace；「我的目標」可開啟、暫停、恢復、完成與刪除；未完成設定可跨重新整理復原，時間明示為 24 小時制，同一目標可設定 1–8 個時段。
- 長期目標閉環已完成於分支：每個 active goal 只 materialize 下一筆 Cloud Task；確認決策後寫入結構化出勤，再依 GPT-5.6 的下一次跟進、時區、多時段與安靜時段計算下一筆。check-in 與記憶改用穩定 owner＋goalId 隔離，重新配對不會遺失，兩個同名目標也不會共用策略。

# 正在做

- Phase 6 真手機驗收：B 組（真實循環）已於 2026-07-20 在 `00058-mem` 完整通過，證據見 `docs/evidence/phase-6-real-phone-goal-loop-2026-07-20.md`。
- C 組多目標隔離進行中。第二個目標（肩頸伸展 `goal-5772a0a4`）已建立，與喝水目標 `goal-1683dbc3` 為兩份獨立文件、各自的 `nextCheckInId`，且伸展計畫全文未引用喝水進度或出勤。
- C 組期間連續抓到三個 bug，皆已修：時間輸入失焦（`f862c55`）、首次排程忽略使用者設定（`e14b273`，Decision 0018）、以及先前的 trace 投影上限（`4522757`）。正在部署含首次排程修正的 revision。
- 尚未驗證：暫停其一另一續排、刪除後不再通知、以及伸展目標報到時的記憶隔離（需等該目標實際報到）。

# 下一步

- 第一個動作：等含 `e14b273` 的 revision Ready 並對齊 `live-mobile` 與 `v2-private` 兩個 tag，然後刪除排錯時間的伸展目標、以同一設定重建，確認首次 Cloud Task 的 `SCHEDULE_TIME` 等於使用者選定的時段（先前為 AI 提議的 `05:00Z`／澳門 13:00）。
- 接著完成 C 組其餘兩項：暫停伸展目標後喝水目標不受影響、刪除伸展目標後其 Cloud Task 失效且不再通知。
- 伸展目標報到時，確認 GPT-5.6 的判斷不得引用喝水目標的進度或出勤（記憶隔離的最終證據）。
- 接著決定「一次性目標完成後 workspace 仍為 `ACTIVE`、`nextCheckInId` 仍指向已完成 check-in」是規格還是缺口；目前完成需使用者手動按 `Complete`。
- 之後才是 Phase 7 收尾（README／Devpost story 更新、最終 checkpoint）。不重剪已批准影片。
- 驗收通過後才決定是否提升流量；正式 V1 在 Chloe 明確批准前保持不動。

# 已知問題

- 公開 Guest Lane 尚未實作；依 Decision 0016 為條件項，不得延誤影片與提交。
- 背景推播與鎖定畫面震動未宣稱完成；私人真實報到需要 PWA 開啟輪詢。
- Devpost 已正式提交；後續編輯必須在 2026-07-22 08:00 +08:00 前完成，提交基線不得因 V2 施工失效。
- 手機已有目標管理、草稿復原、多時段編輯與最近五筆出勤視覺化；長期排程循環尚未在真實雲端／手機驗收。
- 真手機驗收已連續抓到三個「舊資料／舊上限撞新契約」的 bug：①回訪首頁誤判為模擬入口（`b850407`）②舊 session 的 `goalStates` 淘汰欄位讓 `/api/live/goals` 回 400（`5bfd599`）③客戶端 trace 投影上限 `max(3)` 擋掉四段 goal-led trace，使 `/api/live/check-ins/current` 回 400、整個「今天／報到／出勤」區塊顯示「受保護的連線暫時無法使用」（`4522757`）。同型風險尚未全面盤點，後續改契約時應優先檢查客戶端投影是否與文件層上限同步。
- `firestore-repository.ts` 的 `findCurrent`（activeCheckInId 分支）與 `findById` 使用 `.parse()`，單筆壞文件會讓整條讀取 API 失敗；同檔案的 fallback 掃描已用 `.safeParse()`。韌性落差已知，未修，因 Decision 0016 凍結期間僅處理實際阻斷驗收的問題。
- Goal Architect 契約只有單一 `preferredCheckInTime`，無法結構化表達多時段。`e13e52f` 已把 `suggestedScheduleTimes` 的掃描範圍收窄到描述節奏的欄位，止住了「假設句裡的時間變成真實時段」，但契約層的缺口仍在；真正的解法是讓模型輸出時段陣列，會動到凍結中的契約。見 Decision 0018「Not decided here」。
- `+ New goal` 按鈕位於畫面上方，重置後的新問卷長在下方且不自動捲動，使用者感受為「按了沒反應」（Chloe 2026-07-20 實遇）。未修；評審第一印象風險。
- 使用者可設定一個超出目標窗口的時段，系統靜默改用計畫提議的 fallback，畫面顯示與實際排程不一致且無提示（Chloe 2026-07-20 實遇：顯示 `12:10`、實排 `11:49:30`，該目標 `targetEndAt` 僅五分鐘）。fallback 本身是 Decision 0018 規格，缺的是當場告知。未修。
- 真機驗證的方法論限制：以 `adb shell input text` 模擬輸入可驗證程式邏輯，但會繞過真實鍵盤，無法暴露「格式打不出來」這類可用性缺陷（2026-07-20 實證，見 `docs/AGENT_RELAY_LOG.md`）。使用者需親手操作的功能，最終證據只能來自人。
- `docs/EMERGENCY_HANDOFF_ANDROID_FINAL_2026-07-17.md` 與九張 `docs/LOCAL_CHEATSHEET_*.md` 為 local-only，不得進公開 commit。

# 最近測試結果

- 2026-07-19 03:59 +08:00：32 test files passed／5 skipped；125 tests passed／9 skipped；lint、typecheck、production build、`git diff --check` 全通過；`/demo` 為 static route。
- 雲端 `00038`：HTTP 200、Day 30、0 個 `/api/*`、overlay 0、console errors 0；`00024` stable 100%。
- 2026-07-19 04:33 +08:00：提交文件無過期 revision／12 小時聲明，tracked secret scan 與 `git diff --check` 均乾淨；新版架構 PNG 已視覺檢查，Demo Lab／stable app／GitHub 均回 HTTP 200。
- 2026-07-19 04:37 +08:00：125 tests passed／9 skipped；所有提交文件的本地 Markdown 連結均存在，英文旁白 391 字。
- 2026-07-19 17:22 +08:00：YouTube 公開發布成功；平台著作權與社群規範檢查均為「未發現任何問題」，未登入 oEmbed 回傳正確標題、作者 `Chloe Kao` 與公開縮圖；Demo Lab、stable app、GitHub、YouTube oEmbed 四個公開入口均回 HTTP 200。
- 2026-07-20 07:51 +08:00：Devpost 顯示 `Project submitted!`，公開作品頁顯示 `Submitted to OpenAI Build Week`；提交證據圖與文字紀錄已保存。
- 2026-07-20 07:57 +08:00：長期目標契約 6 項新測試通過；全套 33 files passed／5 skipped、131 tests passed／9 skipped；lint、typecheck、production build、`git diff --check` 全通過。
- 2026-07-20 08:10 +08:00：雲端目標 CRUD、穩定 owner、任務取消與晚到回呼圍欄完成；全套 38 files passed／5 skipped、144 tests passed／9 skipped；lint、typecheck、production build、`git diff --check` 全通過。
- 2026-07-20 08:25 +08:00：真 GPT-5.6 Plan revision 契約通過，模型 `gpt-5.6-sol`、1,409 tokens、零 SDK retries，拒絕的一次提醒假設已移除，09:00／14:00／19:00 三時段均反映；全套 40 files passed／6 skipped、148 tests passed／10 skipped，lint、typecheck、production build、`git diff --check` 全通過。
- 2026-07-20 08:44 +08:00：雲端目標 save/list/open/status/delete 客戶端、目標管理 UI、草稿復原、24 小時與 1–8 多時段設定完成；全套 42 files passed／6 skipped、152 tests passed／10 skipped；lint、typecheck、production build、`git diff --check` 全通過，本機 live profile HTTP 200 且正確標示雲端持久化。
- 2026-07-20 09:03 +08:00：每目標單一下一筆 Cloud Task、結構化出勤、穩定 owner 跨 session、goalId 記憶隔離與確認後續排完成；全套 44 files passed／6 skipped、158 tests passed／10 skipped；lint、typecheck、production build、`git diff --check` 全通過。
- 2026-07-20 09:34–09:39 +08:00（雲端 `00056` 實測，Codex 額度中斷後由 Chloe 於手機操作、事後從 Cloud Run log 還原）：`POST /api/live/goals/plan` 回 200（先前為 400，`5bfd599` 修正生效）；`/api/live/goals` 多次 200；09:39:45 `[live-check-in] task delivered { checkInId: 'goal-e8e7f665…', duplicate: false, status: 'PENDING' }`，證明目標型 Cloud Task 真實排程並送達。
- 2026-07-20 10:06 +08:00：`GET /api/live/check-ins/current` 回 400，手機顯示「受保護的連線暫時無法使用」。以 Firestore REST 唯讀取樣 1 筆 session 與 20 筆 check-in 全數通過現行 schema，排除資料損毀；根因為 `ClientLiveCheckInSchema.traces` 上限 `max(3)` 與文件層 `traceRunIds` 上限 `max(4)` 不一致，`live-1784499276418-0d6572b0` 與 `live-1784477994742-2dd18d80` 各帶 4 段 trace 因而落在客戶端投影被拒。
- 2026-07-20 10:16 +08:00：`traces` 上限對齊為 `max(4)` 並新增四段 goal-led trace 投影測試；全套 46 files passed／6 skipped、163 tests passed／10 skipped；lint、typecheck、production build 全通過。
- 2026-07-20 10:22 +08:00：`00058-mem` 部署完成，`live-mobile` 與 `v2-private` 兩個 tag 同指該版，`00024` 仍 100%。設定與部署前基準完全一致（22 env、3 Secret Manager 引用、`time-sovereignty-v2-runtime` SA、512Mi、`minScale=1`）。同一支手機同一組 cookie 上，`GET /api/live/check-ins/current` 由 10:06 的 400 變為 10:22 的 200。
- 2026-07-20 10:25–10:32 +08:00：Phase 6 B 組真手機閉環通過。`[live-check-in] agents completed` 顯示 `gpt-5.6-sol`、1,224 tokens、`assessment: COMPLETED`、`dispatchedAgents: []`；使用者於 10:29 確認後寫入 1 筆 `attendance`（`status: COMPLETED`），手機 Open-goal 面板顯示「已完成 · 7月20日 10:29」；`gcloud tasks list` 回 `Listed 0 items.`，一次性短衝刺未排下一筆。詳見 `docs/evidence/phase-6-real-phone-goal-loop-2026-07-20.md`。

- 2026-07-20 11:01 +08:00：時間輸入失焦修正（`f862c55`）已部署至 `00060-vem` 並在 S25 實測：一次連續輸入 `11:30` 五個字元，焦點保留在欄位內。修正前每次按鍵都會重掛輸入元件。
- 2026-07-20 11:26 +08:00：首次排程改由使用者確認的時段推導（`e14b273`，Decision 0018），排程算術抽出為純函式模組 `goal-schedule.ts`；新增回歸測試「slot 為 11:30 時首次報到必須是當地 11:30 且不等於計畫提議」。全套 46 files passed／6 skipped、164 tests passed／10 skipped；lint、typecheck、production build 全通過。

- 2026-07-20 12:29 +08:00：修掉三個只有真人會撞到的缺陷（`e13e52f`）：時間欄位在數字鍵盤上打不出冒號、時段建議把假設句裡的時間變成真實時段、`GoalCadenceTimingError` 讓使用者盲按且每次付費。新增 6 項測試（輸入正規化 4、重試行為 2）；全套 46 files passed／6 skipped、170 tests passed／10 skipped；lint、typecheck、production build 全通過。附帶發現：`GoalArchitectOutputSchema` 本身已擋下「報到晚於目標截止」，能走到時間圍欄的只有非未來時間或超出 cadence 最大延遲。

# 最後更新時間

- 2026-07-20 12:31 +08:00
