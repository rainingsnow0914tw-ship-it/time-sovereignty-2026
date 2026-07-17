# 已完成

- Phase 1 本機基礎已收盤：原生繁中／英文切換、明確語音語系、後端安靜時段圍欄、受保護的 Realtime 2.1 WebRTC 語音層。
- 既有真實手機路徑仍保留 Cloud Tasks、Firestore、Commitment Recovery、Chief of Staff、GPT-5.6 結構化決策、安全 trace、記憶提案與下次跟進。
- Pixel 5 畫面 smoke 通過，API Key 僅存在伺服器邊界。

# 正在做

- 第一階段本機收盤已驗證；尚未開始部署本輪修改。

# 下一步

- 將 checkpoint 部署到既有 `live-mobile` tag-only preview，不移動 stable traffic；建立新單次配對 secret，完成一次真手機 Realtime＋GPT-5.6 端到端驗收與健康檢查。

# 已知問題

- Realtime WebRTC 尚未在 Cloud Run／實機呼叫真 API；目前只有本機契約、路由、production build 與隔離手機尺寸 UI 證據。
- 舊 pairing secret 已撤銷；雲端驗收前必須建立新版本。
- `docs/EMERGENCY_HANDOFF_ANDROID_FINAL_2026-07-17.md` 與三張 `docs/LOCAL_CHEATSHEET_*.md` 為 local-only，不得進公開 commit。

# 最近測試結果

- 2026-07-18 00:29 +08:00：`npm test` 79 passed／5 skipped（2 個 live-only suites skipped）；`npm run lint`、`npm run typecheck`、`npm run build`、`git diff --check` 全部通過。Next build 已包含 `/api/live/realtime/session`。

# 最後更新時間

- 2026-07-18 00:31 +08:00
