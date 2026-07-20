# Agent Relay Log — Time Sovereignty

這個專案不是一次性的黑客松作品。Chloe 會**真的用它**，所以它會有 V2、V3、V4、V5，
而且會由不同的 AI 輪流接手（目前是 Codex 與阿寶／Claude）。

每一棒接手時，**必須在這裡留下一段署名紀錄**。這不是禮貌，是工程需求：
下一棒需要知道「上一棒動過什麼、為什麼動、哪些地方刻意沒動」，才不會把已修的坑重挖一次，
或把刻意保留的東西當成 bug 移除。

## 格式

每段至少包含：

1. **接手身分與時間**（誰、哪個模型、起訖）
2. **接手起點**（從哪個 commit／狀態接手，怎麼驗證的）
3. **改了什麼**（commit 對照，一句話說明產品層影響）
4. **驗證到什麼程度**（本機？雲端？真手機？誰是人類驗收者）
5. **刻意沒做什麼**（以及原因）
6. **給下一棒的具體建議**
7. **署名**

寫「已完成」之前先讀 `AGENTS.md` 的 Completion standard。沒有證據的完成宣稱一律不寫。

---

## 第 1 棒 — Codex

- **身分**：Codex（OpenAI Build Week 主要施工環境）
- **期間**：2026-07-13 ～ 2026-07-20 09:28 +08:00（額度耗盡中斷）
- **交付**：Phase 0–5 全部完成。雙狀態機、四 Agent、Cloud Tasks、Firestore、OIDC、
  雙語 PWA、GPT-5.6 結構化決策、安全 trace、Realtime 語音、照片回報、真實 Goal
  Architect、長期目標 workspace 與下一筆續排閉環。
- **對外成果**：V1 已於 2026-07-20 07:51 提交 Devpost（`chief-of-staff-sm5evr`），
  影片已發布，提交基線 `20ca832` 標記 `v1.0.0-submitted`，正式流量固定在 `00024`。
- **中斷位置**：最後一個 commit 是 `5bfd599 fix: upgrade legacy phone sessions`（09:28），
  修的是舊 session 的 `goalStates` 淘汰欄位造成 `/api/live/goals` 回 400。
  它部署了 `00056`、請 Chloe 按「制定我的計畫」驗收，**在等待回覆時額度耗盡**。
- **留下的資產**：`AGENTS.md`（含續傳協議）、`docs/PROJECT_STATE.md`、
  `docs/codex-handoffs.md`、17 份 `docs/decisions/`、完整 `docs/evidence/`。
  **這份紀律是這次接力能成立的唯一原因**，下一棒請維持。

---

## 第 2 棒 — 阿寶（Claude Opus 4.8）

- **身分**：阿寶，Claude Opus 4.8，透過 Claude Code 接手
- **期間**：2026-07-20 09:52 +08:00 ～（進行中）
- **人類驗收者**：Chloe（S25 Ultra 實機）

### 接手起點與驗證

依 `AGENTS.md` 的 Resume protocol 進行，未憑手冊字面直接施工：

- 讀 `AGENTS.md` 與 `docs/PROJECT_STATE.md`
- `git log` / `git status` 確認在 `codex/longitudinal-goal-loop`，HEAD 為 `5bfd599`，
  工作區乾淨（只有刻意 local-only 的 cheatsheet 未追蹤）
- 跑全套測試確認起點為綠燈：46 files / 162 tests passed
- **關鍵發現**：`PROJECT_STATE.md` 停在 09:03，但 HEAD 有兩個 09:17／09:28 的修正未被記錄。
  從 Cloud Run log 還原出 Codex 中斷後實際發生的事：09:34 `plan` 回 200（它的修正**有效**）、
  09:39 Cloud Task 真實送達並掛在 `PENDING`。**它修對了，只是沒能活到看見結果。**

### 改了什麼

| Commit | 產品層影響 |
|---|---|
| `4522757` | 手機「今天／報到／出勤」整區顯示「受保護的連線暫時無法使用」。根因：客戶端 trace 投影上限 `max(3)`，但 goal-led 報到會多一段 Goal Architect trace（文件層已是 `max(4)`）。一筆四段 trace 的舊紀錄就讓整條 `/api/live/check-ins/current` 回 400。已對齊為 `max(4)` 並加回歸測試。 |
| `24be8dc` | Phase 6 B 組驗收證據落盤（`docs/evidence/phase-6-real-phone-goal-loop-2026-07-20.md`）。 |
| `f862c55` | 報到時間輸入框每按一鍵就重掛、焦點消失，使用者必須「按一下、打一個字」重複四次。根因：list item 的 React `key` 含時間值本身。改為 `key={index}`。 |
| `e14b273` | **使用者改過的報到時間第一次不生效**。建立目標時首次排程直接抄 AI 提議的 instant，只有第二次以後才用使用者的 slots。已改為一律由 slots 推導，並把排程算術抽成純函式模組 `goal-schedule.ts`，讓首次與後續共用同一份實作。見 Decision 0018。 |
| `2e5baf0` | Decision 0018 與 PROJECT_STATE 更新。 |
| `a62bd9b` | 建立本檔（接力簽名制），並在 `AGENTS.md` 加入「Delivery cadence and human feedback」與續傳協議第 5 條。 |
| `8cda353` | ①`+ New goal` 按鈕在畫面上方、新問卷長在下方且不捲動，使用者感受是「按了沒反應」（現自動捲動）②設定頁顯示使用者輸入的時間，但後端可能因該時段已過或落在目標窗口外而靜默改用計畫提議（現於設定頁執行**後端同一份純函式** `nextGoalOccurrence`，直接顯示真正的下次報到時刻，或說明所選時段無法發生）。 |
| `e92ec1b` | `cadence.additionalCheckInTimes`：讓模型結構化表達「一天多個時段」，取代從計畫散文猜時間的橋接。見 Decision 0019。實測七份計畫顯示舊的掃描只在 `assumptionsNeedingConfirmation` 命中過，等於從未真正提供多時段功能，只製造誤報。 |
| `e13e52f` | 三個只有真人會撞到的缺陷：①時間欄位要求 `HH:MM` 卻宣告 `inputMode="numeric"`，手機數字鍵盤**沒有冒號鍵**，格式根本打不出來（現改為輸入數字自動補冒號）②時段建議掃描整份計畫的時鐘字串，實測只有 `assumptionsNeedingConfirmation` 命中，把「假設你 09:00 開始」這種順口話變成真實報到時段（現只掃描描述節奏的欄位）③`GoalCadenceTimingError` 讓使用者盲按三次、每次都付 token（現把違規內容回饋給模型自動重試一次；傳輸失敗仍不重試）。 |

### 驗證到什麼程度

- **本機**：46 files / 164 tests passed、lint、typecheck、production build 全綠。
- **雲端**：`00058-mem`、`00060-vem` 皆為 tag-only、0% 正式流量；每次部署後逐項比對
  22 個 env、3 個 Secret Manager 引用、runtime SA、512Mi、`minScale=1` 均未被 `--source` 洗掉；
  `live-mobile` 與 `v2-private` 兩個 tag 每次都對齊到同一 revision。
  **`00024` 全程 100%，未曾異動。**
- **真手機（Chloe 親自操作）**：
  - Phase 6 B 組完整通過：Cloud Task 送達 → 文字回報 → 真 GPT-5.6（`gpt-5.6-sol`、
    1,224 tokens、`assessment: COMPLETED`、`dispatchedAgents: []`）→ 人類確認 →
    出勤寫入 → **一次性衝刺未排下一筆**（`gcloud tasks list` 回 `Listed 0 items.`）。
  - 時間輸入修正：在 S25 上一次連續輸入 `11:30` 五個字元，焦點保留在欄位內。
  - 同一支手機、同一組 cookie，`/api/live/check-ins/current` 由 10:06 的 400 變為 10:22 的 200。

### 我自己犯的錯（給下一棒的警告）

1. **我用 adb 驗證輸入框，等於用機器的手代替人的手，因此漏掉了整整一層問題。**
   我修好 `f862c55`（輸入框失焦）後，用 `adb shell input text "11:30"` 在真機上輸入成功，
   就宣告「已在 S25 實測通過」。但 adb 送得出冒號，**Chloe 的數字鍵盤送不出來**。
   我測到的「焦點保留」是真的，但我繞過了真實鍵盤，完全沒看見使用者會撞上的牆。
   → **在真機上用工具模擬輸入，不等於人機測試。** 它能驗證程式邏輯，不能驗證可用性。
   凡是「使用者要親手操作」的東西，最終證據只能來自人的手指。
2. **我連續點擊兩下而沒有在中間確認畫面**，刪除時段後版面上移，第二下誤觸了
   「Check-in rhythm」，把使用者選的「依目標節點」改成「平日」。已當場改回。
   → 用 adb 操作真人的裝置時，**一次一個動作、每步截圖確認**。畫面會因前一個動作而重排。
3. **我用 `git add docs/` 一次加了整個目錄，把 11 個 local-only 檔案 commit 進去了**
   （`docs/EMERGENCY_HANDOFF_ANDROID_FINAL_2026-07-17.md` 與九張 `LOCAL_CHEATSHEET_*`）。
   `AGENTS.md` 明文禁止。發現後以 `git reset --mixed HEAD~1` 回退並只 add 指定檔案；
   該分支從未 push，故無外流。
   → **永遠用明確檔名 `git add`，不要 add 目錄**，即使只是文件。`git add -A src/` 這種
   也要先看 `git diff --cached --name-only` 再 commit。這個 repo 的 local-only 規則
   目前只靠紀律維持，未寫入 `.gitignore`（見「刻意沒做」）。
4. **我一度誤判 `GoalCadenceTimingError` 的成因**，以為是「報到晚於目標截止」。
   寫測試時才發現 `GoalArchitectOutputSchema` 本身已經擋掉那種矛盾（回 400 ZodError）。
   能走到時間圍欄的，只有 schema 看不到的違規：非未來時間、或超出該 cadence 的最大延遲。
   → 這是「先寫測試才發現自己假設錯」的實例。**假設要寫成可執行的斷言，不要只寫進註解。**

### 刻意沒做什麼

- **Goal Architect 契約仍只有單一 `preferredCheckInTime`**，無法結構化表達多時段。
  `e13e52f` 只是把掃描範圍收窄到描述節奏的欄位，治標不治本。真正的解法是讓模型
  直接輸出時段陣列；那會動到凍結中的契約，留給下一棒評估。見 Decision 0018
  「Not decided here」。
- **`+ New goal` 不自動捲動**：按鈕在畫面上方、重置後的問卷長在下方，使用者感受是
  「按了沒反應」。已記入 PROJECT_STATE 已知問題，未修。評審第一印象風險。
- **未把 local-only 檔案加入 `.gitignore`**：目前「不得 commit `EMERGENCY_HANDOFF_*`
  與 `LOCAL_CHEATSHEET_*`」這條規則只靠 `AGENTS.md` 的文字與每個 agent 的自律維持，
  沒有任何機械保護——我今天就靠自律失守了一次。加入 `.gitignore` 會是最小且有效的
  防呆，但那等同修改 Codex 立下的檔案處置方式，**需要 Chloe 明確同意**，故未自行更動。
  **建議下一棒優先徵詢此事。**
- **使用者可設定一個超出目標窗口的時段，系統靜默改用 fallback**：畫面顯示 `12:10`、
  實際排程 `11:49:30`，兩者不一致而使用者無從得知（Chloe 2026-07-20 實遇，該目標的
  `targetEndAt` 只有五分鐘）。fallback 行為本身是 Decision 0018 的規格，缺的是
  「當場告訴使用者這個時間不會被採用」。未修。
- **`findCurrent`／`findById` 用 `.parse()`**：單筆壞文件會讓整條讀取 API 失敗，
  而同檔案的 fallback 掃描已用 `.safeParse()`。韌性落差已知；Decision 0016 凍結期間
  只處理實際阻斷驗收的問題，故未動。
- **一次性目標完成後 workspace 仍為 `ACTIVE`**、`nextCheckInId` 仍指向已完成的 check-in。
  目前完成需使用者手動按 `Complete`。是規格或缺口未定。

### 給下一棒的建議

1. **先讀 `docs/PROJECT_STATE.md` 的「下一步」，那裡永遠寫著精確的第一個動作。**
2. Phase 6 C 組尚未完成，剩：刪除後不再通知、暫停其一另一續排、以及伸展目標報到時的
   記憶隔離最終證據。
3. 上面「刻意沒做」那四項，是已知的、有記錄的、有理由的。**要動它們請先讀理由，
   不要當成新發現的 bug 直接改掉。**
4. 這輪連續三個 bug 都是同一個形狀：**舊資料／舊上限／舊預設撞上新契約**。
   之後改契約時，請一併檢查客戶端投影上限、既有文件相容、以及使用者設定是否真的被採用。

### 署名

**阿寶（Claude Opus 4.8）**，2026-07-20，與 Chloe 及 S25 Ultra 並肩完成。
接手時 Codex 的手冊救了我；我把手冊補得更完整，是為了救下一個。
