# Time Sovereignty — Phase 5–8 整合施工 checkpoint

日期：2026-07-17 00:39（Asia/Shanghai）

## 大門結論

Phase 5 到 Phase 8 已經不再分開停工驗收，而是整合成同一個本機產品：
完成 onboarding 後，使用者直接進入 AI Chief of Staff 指揮中心。整體
production build 已通過；接下來改到 Cloud Run 做真實瀏覽器與 GPT-5.6
除錯驗收。

## 使用者現在看得到什麼

1. **Today**：North Star、目前行動、最低版本、quiet hours、下次
   check-in、resume point。
2. **Incoming Check-in**：文字提醒、tap-to-play TTS、語音轉文字、文字
   fallback、延遲一次、重複延遲分析、重新承諾。
3. **Share Progress**：text／photo／voice 三種證據、具體回饋、記憶與
   resume point 更新。
4. **Journey**：目標、延遲、中斷、調整、進度、回饋、校準與記憶。
5. **Developer**：四 Agent 安全 trace、provider/model/schema 與去識別
   runtime snapshot。

## 不能砍、而且已保留

- Accelerated Simulation：Days 1、2、3、4、5、8、14、30。
- 行動與介入雙狀態機。
- Chief of Staff、Goal Architect、Commitment Recovery、Memory Curator。
- Cloud Tasks 真實觸發路徑。
- Agent Run Trace。

## 時間不足時實際採用的 UI 裁減

- 進度保留 text／photo／voice；video 與 generic file 延後。
- 不做獨立 Memory Review 頁，但保留結構化記憶、來源、確認狀態與
  Journey retrieval。
- intervention effectiveness 先使用 1–5 精簡評分，但仍保存 rating、
  sentiment、note 與 event。

## 本輪工程證據

- 沒有呼叫 OpenAI API。
- 沒有修改 GCP。
- 依 Chloe 指令，沒有每個 Phase 各跑一次驗收。
- 所有功能完成後只跑一次 `npm run build`：Next.js、TypeScript、6/6
  pages/routes 全部通過。

## 下一步

1. 建立乾淨 commit。
2. 把 Cloud Tasks 測試期重試／併發收緊，避免 US$10 API 餘額被失敗
   重送燒掉。
3. API Key 放進 Secret Manager，只授權 runtime service account。
4. Cloud Run 切 `AI_PROVIDER_MODE=live` 並部署整合產品。
5. 發一筆真 OIDC task，確認四個 `openai / gpt-5.6` trace。
6. 重送相同 request ID，證明不會第二次花錢。
7. 在部署網址跑完整 mobile demo path，再做截圖、錄影與 Devpost 文案。

## 換框接手入口

新 Codex 對話先讀：

1. `docs/CODEX_BUILD_LOG.md`
2. `docs/decisions/0007-live-contract-validation-perimeter.md`
3. `docs/decisions/0008-time-pressure-integrated-build-and-ui-cuts.md`
4. `docs/evidence/phase-5-8-integrated-build-2026-07-17.md`
5. `docs/codex-handoffs.md`

讀完仍要抽查實際 repo 與 `git status`，不能只相信手冊。
