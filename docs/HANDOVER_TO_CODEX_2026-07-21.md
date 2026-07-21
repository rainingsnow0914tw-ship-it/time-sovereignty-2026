# 交接給 Codex — 2026-07-21

寫給接手的 Codex（也寫給任何一個接手的人）。
上一棒是 Claude Code（Chloe 叫我阿寶）。我從 7/20 你額度用完的地方接手，
做到 7/21 中午。以下是你需要知道的全部。

**先讀這一份，再讀 `AGENTS.md`，再讀 `docs/PRODUCT_DIRECTION.md`。**

---

## 0. 一句話狀態

**產品已經在真手機上完整跑通一次，端到端有伺服器記錄佐證。
主線功能沒有已知的壞掉的東西。剩下的是素材（圖、影片）與收尾。**

截止時間：**2026-07-21 17:00 PT ＝ 澳門時間 2026-07-22 08:00**。

---

## 1. 你要知道的第一件事：有兩個工作區

這件事害我跟你都各自浪費過時間，所以放在最前面。

| 工作區 | 路徑 | 分支 | GitHub |
|---|---|---|---|
| **A. 桌面版**（你原本那個） | `C:\Users\soulf\Desktop\openAI build week202607130721` | `codex/longitudinal-goal-loop` | ✅ 有 remote |
| **B. 私人版**（今天的工作都在這） | `C:\Users\soulf\Documents\New project\time-sovereignty-v2-private` | `codex/v2-private` | ✅ 今天剛接上 |

**兩個是同源**（最初 commit 都是 `dd57cd0d`），但**內容已經分岔**：

- A 有：「My goals」清單、出席表、計畫修訂
- B 有：**Android App、真實來電、catch-v2 升級機制**、今天做的全部東西

**兩條線都部署到同一個 Cloud Run 服務、同一個 Firestore。**

### ⛔ 交件前絕對不要做的事（⚠️ 這條有期限，讀完下一段再動作）

**在 2026-07-22 08:00（澳門時間）交件之前，不要合併這兩條線。**

**但這是暫時凍結，不是永久禁令。** `docs/PRODUCT_DIRECTION.md` 的
**決策一就是「兩條開發線合併為一」，狀態 Accepted**，Chloe 的理由是
「雖然難，但是對之後的新版本應該是有好處」。

| 時間 | 合併兩條線 |
|---|---|
| 交件前（現在） | ⛔ 禁止——風險太高，會賠掉比賽 |
| 交件後 / V3 起 | ✅ **這是原定計畫，決策一，請執行** |

換句話說：**如果你是在交件之後才讀到這份文件，上面那個禁令已經失效，
合併正是你該做的第一件事。** 合併時請重讀決策一與決策二（把「My goals」
清單與出席表從 `codex/longitudinal-goal-loop` 搬過來）。

禁令的來源是 Chloe 交件前夜的原話：

> 禁止他做的就是合併兩條線、不删 Firestore 资料、不重构整个资料模型、
> 不替你决定产品取舍。如果遇到需要产品选择的地方，请停止，
> 写清楚选项和代价，等我醒来决定。

**不要動 GitHub 的 `main`。** 那是已送出的 V1（commit `20ca832`），凍結中。
今天的東西推在 `codex/v2-private` 分支，`main` 完全沒動。
這是工程安全，不是比賽規則——比賽規則不管分支。

---

## 2. 今天（7/21）做了什麼

六個 commit，全部有測試、typecheck、lint、build 通過，並且部署驗證過。

| Commit | 做了什麼 | 為什麼 |
|---|---|---|
| `bc93767` | 對話摘要（按維度合併） | 說「五次改一次」再說「十分鐘後」是**兩個不同的修改**，不是兩個承諾。數量與時間**取代**，處境**累積**。判斷不出來時**必須問使用者**，不准猜 |
| `c260673` | 語音查證工具 `look_up` | 「我不知道」對使用者是死路。現在會查、會講來源、證據弱會說弱 |
| `6f2b031` | 規劃層的能力邊界 | 它以前叫使用者「自己設 5 個鬧鐘、記 1/5」——把產品要扛的認知負荷退還給使用者 |
| `17db1f8` | 語音果斷、可停止、講得完 | 見下方「最重要的一條」 |
| `98ea0ba` | 失敗說人話 + props 翻譯 | 目標過期時按鈕沒反應，使用者連按七次 |
| `9aa15c7` | 接進介面 + Demo Lab 補洞 | |
| `85be8fa` | 架構圖補上 Android 來電與查證 | 舊圖沒畫最有代表性的能力 |

### 最重要的一條（決策十）：語音不可以變成聊天

**同一天早上我先把語音改成「簡短但對話式」——「給一個建議，問她覺得如何，
不行再給一個」。那是錯的。** 真機測試當場被帶偏，Chloe 說：

> 我剛剛就覺得那個 AI 就很想跟我一起聊下去。我差點被他帶歪掉了。

**核心風險**：這個產品要解決的病是過度思考。如果 AI 本身變成一個可以聊的地方，
它就變成最舒服的那一種拖延。**語音層的成功指標是「這通對話越短越成功」，
不是黏著度。一般對話式 AI 的直覺在這裡是反的。**

要「提升互動性」之前，先讀 `docs/PRODUCT_DIRECTION.md` 決策十。

---

## 3. 東西都存在哪裡（Chloe 特別問的）

**全部都在本機檔案裡，而且已經 commit、已經推上 GitHub。沒有東西只存在對話裡。**

| 你要找什麼 | 檔案 |
|---|---|
| **產品決策與理由（十條）** | `docs/PRODUCT_DIRECTION.md`（356 行，含 Chloe 的中文原話）|
| **今天做了什麼、還剩什麼** | `docs/PROJECT_STATE.md`（217 行，含端到端證據）|
| **你上一次的交接筆記** | `docs/codex-handoffs.md`（436 行）|
| **兩個工作區的索引** | `START_HERE.md`（兩邊都有，內容相同）|
| **硬規矩** | `AGENTS.md`（174 行）|
| **真機 QA 清單** | `docs/QA_CHECKLIST_2026-07-21_SUMMARY.md` |
| **Devpost 要貼的文字** | `C:\Users\soulf\Desktop\openAI build week202607130721\阿寶_1_Devpost要貼的文字.md` |

`PRODUCT_DIRECTION.md` 是最重要的一份。它記錄的不只是結論，
**還記錄了被推翻的決定**——包括我早上做錯、下午推翻的那一次。
因為對接手的人來說，知道「什麼試過不行」比知道結論更有用。

---

## 4. Chloe 要你做的事

她累了，她的原話是：**「必須得靠他去做圖跟影片」**。

1. **素材圖**（架構圖已由我更新在 `README.md` 的 mermaid，但那是給工程看的；
   Devpost 需要的是**給人看的圖**）
2. **影片相關**（現有影片 `https://youtu.be/d0cX1V4R7h4` 記錄的是 V1。
   ⚠️ **不要覆蓋它** ——它忠實記錄了送出時的狀態。要做就做**補充**）
3. **GitHub 其他需要同步的部分**

### 做之前一定要問她的事

Chloe 的界線很清楚：**產品取捨不要替她決定。**
遇到「這樣改好還是那樣改好」——**停下來，寫清楚選項和代價，等她決定。**

---

## 5. 硬規矩（違反會出事）

1. **不要 `git add <目錄>`。** 我踩過：`git add docs/` 一次把 11 個本來只該留在
   本機的檔案送進 commit。**逐個檔案指定。**
2. **不要動 Cloud Run 的正式流量。** `time-sovereignty-00024-dih` 一直是 100%，
   今天二十幾次部署一次都沒碰。部署一律 `--no-traffic`，只移動 tag：
   ```
   gcloud run deploy time-sovereignty --source=. --region=asia-east1 \
     --project=time-sovereignty-2026 --clear-base-image --no-traffic --quiet
   gcloud run services update-traffic time-sovereignty --region=asia-east1 \
     --project=time-sovereignty-2026 \
     --update-tags=live-mobile=<新版本>,v2-private=<新版本> --quiet
   ```
3. **不要宣稱沒驗證過的事。** 我今天犯過一次相關的錯：修完後只看 `tail -4`，
   把失敗訊息蓋掉了，差點把壞的推上去。**看完整輸出。**
4. **不要憑印象改既有邏輯。** 我今天以為 catch-v2 升級有 bug，寫了修正，
   讀了原本的 guard 才發現它早就處理了，而且我的版本更差（把 `FAILED`
   誤判成已回應而停止追蹤）。**已撤回。先讀再改。**
5. **密鑰**：`.env.local`、`GPTAPIKEY.txt` 永遠不進 Git。推之前掃一次。

---

## 6. 驗證方式（每次改完都跑）

```
npm run typecheck
npm test          # 現在是 215 passed | 10 skipped
npm run lint
npm run build
```

真實 API 測試是**刻意的外環檢查**，不要反覆跑（會燒 Chloe 的額度）：

```
npm run test:live:voice-search   # 一次約 11k token
```

---

## 7. 已知但**還沒處理**的事

### 🔴 交件後必須移除（release blocker）

線上服務目前設著 `CATCH_V2_TEST_ESCALATION_SECONDS=15`。
設計的升級間隔是 **10 分 → 5 分 → 2 分**，實際跑的是 **15 秒 → 15 秒**，
也就是報到抵達後 **30 秒**就升級到全螢幕來電。

**這與產品的倫理界線直接衝突**（暗示可以、操控不行）。
Chloe 知道，選擇先留著方便測試。**交件後要拔掉。**

### 🟡 未決定（不要自行決定）

見 `docs/PRODUCT_DIRECTION.md` 最後的「尚未決定」段落，包括：

- `reviewFrequencyDays` 是死欄位（UI 顯示但沒有任何地方讀它觸發檢視）
- 限時目標到期後 workspace 不會自動轉狀態
- ConnectionService 等級的真實來電要不要做

### ⚪ 已查證為誤判，不要再修

catch-v2「在 PWA 回應時不會停止升級」看起來像缺陷，**不是**。
`evaluateCatchDeliveryGuard` 用 `responded: !["PENDING","FAILED"].includes(status)`
判斷，離開 PENDING 就會停。當時持續升級是因為使用者還沒送出回報，
加上那個 15 秒測試值。**已經有人修過一次又撤回了，不要再修第三次。**

---

## 8. 端到端證據（2026-07-21，真人操作）

Chloe 用真手機、真的喝了一杯水，跑完整條迴圈：

```
11:23:38  /api/live/check-ins/schedule           200   使用者開始行動時段
11:25:38  /api/tasks/live-checkins/{id}          200   Cloud Tasks 自行觸發
11:25:50  /api/live/realtime/session             200   語音對話
11:25:53  /api/tasks/catch-v2/.../levels/2       200   升級
11:26:08  /api/tasks/catch-v2/.../levels/4       200   全螢幕來電
11:26:58  /api/live/check-ins/summary            200   對話整理成回報
11:27:16  /api/live/native/events/{id}/responses 200   Android App 回應
11:32:08  /api/live/check-ins/{id}/confirm       200   使用者確認
```

最終：`CONFIRMED` / `memoryDisposition: DEFER` / `errorName: null` / 兩條軌跡。

**這八行是這個作品最有力的東西。別人交截圖，這裡交伺服器日誌。**

---

## 9. 跟 Chloe 溝通

- 她**沒有工程背景**，但產品直覺極準。今天每一個關鍵缺陷都是她發現的。
- 她在**手機上**看訊息的時候，**不要給她檔案連結，她打不開**。直接把內容貼進對話。
- 她累的時候會說「我有點亂」「注意力無法集中」——那時候**給她一件事就好**，
  不要給選項清單。
- **她要的是被告知真相，不是被安撫。** 我今天報告「妳那題其實沒過，它沒去查」，
  她的反應是繼續往下修，不是不高興。
- 她說過的一句話值得記住：
  > 承諾了記在下面，用戶都覺得我的壓力就減輕了。不然用戶要記就覺得很累。

  那句話是這整個產品的設計原則。

---

## 10. 如果你只有五分鐘

1. 讀 `AGENTS.md` 的「絕對不要」
2. 讀 `docs/PRODUCT_DIRECTION.md` 決策十（語音不可以變成聊天）
3. 知道有兩個工作區、不要合併、不要動 `main`
4. 開工前 `npm test` 確認是 215 綠
5. 有產品取捨就停下來問 Chloe

—— 阿寶（Claude Code），2026-07-21
