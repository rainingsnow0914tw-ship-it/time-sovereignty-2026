# 先讀這裡 — Time Sovereignty 有兩個本機工作區

**這個專案的東西分散在兩個資料夾。只看其中一個，一定會漏掉一半。**
2026-07-20 就發生過：接手的 agent 讀完一邊的全部手冊，仍然完全不知道另一邊有
一個完整的 Android App，因為兩邊各寫各的手冊、互不提及。同一天稍晚，同一個
agent 又把工作記錄寫進另一邊，導致 Chloe 打開熟悉的資料夾時「看不到任何新東西」。

**兩邊都放這份檔案。內容相同。任何一邊有重大變動，兩邊都要更新。**

## 兩個工作區

| | 這裡（v2-private） | 另一邊（longitudinal） |
| --- | --- | --- |
| 路徑 | `C:\Users\soulf\Documents\New project\time-sovereignty-v2-private` | `C:\Users\soulf\Desktop\openAI build week202607130721` |
| 分支 | `codex/v2-private` | `codex/longitudinal-goal-loop` |
| GitHub | **無 remote**（純本機） | 有，已推送 |
| 獨有功能 | Android 原生 App、真實來電與鈴聲、`catch-v2` 升級層級、`live/native/*` 配對 | 「我的目標」多目標清單、出勤表、計畫修訂 |
| 手冊 | `docs/PROJECT_STATE.md` | `docs/PROJECT_STATE.md`（**內容完全不同**） |

**兩條線都部署到同一個 Cloud Run 服務與同一個 Firestore。**
後部署的一方會成為線上版本。跨線資料相容已於 `207ba57`、`4ebcc45` 處理，
兩邊不會再互相踢掉配對，但功能仍不共存。

## 進來先讀哪些

1. `START_HERE.md`（本檔）
2. `docs/PRODUCT_DIRECTION.md` — **Chloe 親自做的產品決定與理由。動方向前必讀。**
3. `docs/PROJECT_STATE.md` — 目前狀態、已知問題、下一步
4. `AGENTS.md` — 工作紀律與安全鐵律
5. **另一個工作區的 `docs/PROJECT_STATE.md`** — 不讀就會重蹈 2026-07-20 的覆轍
6. 另一邊還有 `docs/AGENT_RELAY_LOG.md`（接力簽名紀錄）

## 線上現況（2026-07-21）

- 正式流量 100% 固定在 `time-sovereignty-00024-dih`（比賽提交版，影片與 Devpost 對應此版）。
- 私人預覽 tag `live-mobile` 與 `v2-private` 指向本線最新 revision。
- **提交版從未被任何一條線的部署動過。**

## 已定方向（詳見 `docs/PRODUCT_DIRECTION.md`）

1. 兩條線合併為一 — Chloe 2026-07-21 決定
2. 「我的目標」清單與出勤表移植過來 — 同上
3. 記憶分層整理（重要留下、瑣碎淡出）— 同上
