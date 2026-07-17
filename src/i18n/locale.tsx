"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

export type AppLocale = "zh-TW" | "en";
const LOCALE_STORAGE_KEY = "time-sovereignty.locale.v1";

const zhTW: Record<string, string> = {
  "AI Chief of Staff": "AI 幕僚長",
  "Make the next move survive real life.": "讓下一步經得起真實生活。",
  "One meaningful goal. A plan you approve. Support that adapts without taking control away from you.": "一個真正重要的目標、一份由你確認的計畫，以及會隨生活調整、卻不奪走主導權的支持。",
  "You approve the plan": "計畫由你確認",
  "You set the boundaries": "界線由你決定",
  "You stay in control": "主導權始終在你手上",
  "Private setup": "私人設定",
  "Question": "第",
  "Local journey · protected cloud orchestration": "本機旅程 · 受保護的雲端編排",
  "Mock mode · no API usage": "模擬模式 · 不使用 API",
  "Journey state and safe traces persist in this browser": "旅程狀態與安全軌跡會保留在此瀏覽器",
  "Saved only in this browser after confirmation": "確認後只儲存在此瀏覽器",
  "Your first plan": "你的第一份計畫",
  "Support agreement": "支持協議",
  "Setup complete": "設定完成",
  "Your north star": "你的北極星",
  "· Your north star": "· 你的北極星",
  "Back": "返回",
  "Natural, unfinished answers are welcome.": "自然、尚未整理完整的回答也沒關係。",
  "Designing your plan…": "正在設計你的計畫…",
  "Create my plan": "制定我的計畫",
  "Continue": "繼續",
  "Goal Architect · mock preview": "目標架構師 · 模擬預覽",
  "Here's what I understood.": "我理解的是這樣。",
  "This is a starting hypothesis—not a permanent contract. Change anything that doesn't feel true.": "這是一份初步假設，不是永久協議；任何不符合真實情況的地方都可以修改。",
  "Schema validated": "結構已驗證",
  "Goal": "目標",
  "Target window": "目標期限",
  "First milestone": "第一個里程碑",
  "Why it matters": "為什麼重要",
  "Best next action": "下一步最佳行動",
  "Minimum version on a hard day": "狀態不好時的最低版本",
  "Done adjusting": "完成調整",
  "North star": "北極星",
  "Minimum version": "最低版本",
  "Assumptions to confirm": "待確認的假設",
  "Tell me what feels wrong": "告訴我哪裡不對勁",
  "Example: This assumes I have energy every evening…": "例如：這好像假設我每天晚上都有精力…",
  "Add this to the plan": "把這點加入計畫",
  "Adjust plan": "調整計畫",
  "This feels right": "感覺很對",
  "Your boundaries": "你的界線",
  "How should I support you?": "我該如何支持你？",
  "You choose the rhythm, tone, and limits. This agreement stays editable and never gives the AI permission to override you.": "節奏、語氣與界線都由你決定。這份協議可以隨時修改，也不會授權 AI 凌駕你的選擇。",
  "Check-in rhythm": "報到節奏",
  "When should support show up?": "什麼時候需要我出現？",
  "Every day": "每天",
  "Weekdays": "平日",
  "Weekly": "每週",
  "Check in at": "報到時間",
  "Quiet from": "安靜時段開始",
  "Quiet until": "安靜時段結束",
  "Intervention style": "介入風格",
  "How direct should I be?": "希望我多直接？",
  "Gentle": "溫和",
  "Invite me back without pressure.": "不施壓地邀請我回到行動。",
  "Balanced": "均衡",
  "Warm first, direct when a pattern repeats.": "先溫暖陪伴，模式重複時直接指出。",
  "Firm": "堅定",
  "Name avoidance clearly and ask for a decision.": "清楚指出逃避，並請我做出選擇。",
  "Preferred tone": "偏好的語氣",
  "Channels and progress": "管道與進度",
  "Start with text, photo, and voice. Nothing is sent yet.": "可使用文字、照片與語音；目前不會送出任何內容。",
  "Check-in channels": "報到管道",
  "Text": "文字",
  "Tap-to-play voice": "點按播放語音",
  "Voice reply": "語音回覆",
  "Ways I can share progress": "我可以分享進度的方式",
  "Photo": "照片",
  "Voice": "語音",
  "Protection and consent": "保護與同意",
  "The assistant must know when to stop and when firmer follow-up is allowed.": "幕僚長必須知道何時停止，以及何時可以更堅定地跟進。",
  "Feedback that helps": "對我有幫助的回饋",
  "Pause support when": "以下情況暫停支持",
  "Stronger follow-up is okay when": "以下情況可以加強跟進",
  "Review this agreement every": "每隔多久檢視協議",
  "days": "天",
  "Confirm how you'll support me": "確認支持方式",
  "Agreement confirmed": "協議已確認",
  "Your goal has a protected path.": "你的目標已有一條受保護的路徑。",
  "Your longitudinal workspace is ready. The browser journey stays local-first, while the protected Cloud Run and Cloud Tasks path is verified separately with the live provider.": "你的長期工作區已準備就緒。瀏覽器旅程以本機為優先；受保護的 Cloud Run 與 Cloud Tasks 路徑則透過即時模型獨立驗證。",
  "Hard day version": "狀態不好時的版本",
  "Hard day version:": "狀態不好時的版本：",
  "Next check-in": "下次報到",
  "Support style": "支持風格",
  "Quiet hours": "安靜時段",
  "Start over": "重新開始",
  "Phases 1–8 · integrated local build": "第 1–8 階段 · 本機整合版",
  "What do you want to achieve?": "你想完成什麼？",
  "Choose one meaningful direction. It can be ambitious, uncertain, or still taking shape.": "先選一個真正重要的方向；它可以很有野心、還不確定，或仍在成形。",
  "I want to finish this hackathon…": "我想完成這場黑客松…",
  "When would you like to achieve it?": "你希望何時完成？",
  "An approximate window is enough. We can recalibrate when reality changes.": "大約的時間範圍就足夠；現實改變時，我們可以重新校準。",
  "Before Sunday, within three months, no hard deadline…": "星期日前、三個月內、沒有硬性期限…",
  "Why does this matter to you?": "這件事為什麼對你重要？",
  "This becomes the reason I bring back when the work gets hard—not a motivational slogan.": "工作變難時，我會把這個真正的理由帶回來，而不是丟給你一句口號。",
  "Because I want to prove I can build something that genuinely protects people’s time…": "因為我不只想參加比賽，我想做出真正能保護時間、之後每天都能使用的 AI 幕僚長…",
  "Start with one visible milestone instead of a long task inventory.": "先建立一個看得見的里程碑，而不是列出一長串任務。",
  "Protect energy and quiet hours while keeping the goal moving.": "保護精力與安靜時段，同時讓目標繼續前進。",
  "Spend one focused 25-minute block creating the first visible result.": "先專注 25 分鐘，做出第一個看得見的成果。",
  "Open the work and write the smallest useful next step in one sentence.": "打開工作，用一句話寫下最小但有用的下一步。",
  "Check in after one protected work window, while the first decision is still fresh.": "在一段受保護的工作時間後報到，趁第一個決定仍然清楚時檢視進度。",
  "The target window can be adjusted if real-life constraints change.": "如果現實條件改變，目標期限可以調整。",
  "A brief daily check-in is useful during the first week.": "第一週每天一次簡短報到會有幫助。",
  "Warm, direct, and practical": "溫暖、直接、務實",
  "Be specific about what worked, then give me one clear next move.": "具體指出哪些做法有效，再給我一個清楚的下一步。",
  "Pause when I am ill, handling an emergency, or explicitly ask for space.": "當我生病、處理緊急事件，或明確要求空間時暫停。",
  "Follow up more firmly after the same action is delayed twice without a replacement commitment.": "同一行動延後兩次且沒有替代承諾時，可以更堅定地跟進。",
  "The local journey needs to restart.": "本機旅程需要重新開始。",
  "Restart setup": "重新設定",
  "Your Chief of Staff command center": "你的幕僚長指揮中心",
  "Simulated Day": "模擬第",
  "events": "個事件",
  "30-day proof ready": "30 天證據已完成",
  "Accelerated time": "加速時間",
  "Product sections": "產品分區",
  "Today": "今天",
  "Your protected next move": "受保護的下一步",
  "Check-in": "報到",
  "Voice and recovery": "語音與恢復",
  "Progress": "進度",
  "Text, photo, or voice": "文字、照片或語音",
  "Journey": "旅程",
  "Longitudinal proof": "長期證據",
  "Developer": "開發者",
  "Safe agent trace": "安全的 Agent 軌跡",
  "Time Sovereignty command center": "時間主權指揮中心",
  "Incoming check-in": "收到報到",
  "Time Sovereignty check-in": "時間主權報到",
  "Quiet hours are active. In-app review is available, but proactive notification is withheld.": "目前是安靜時段。你仍可在 App 內查看，但系統不會主動通知。",
  "Tone:": "語氣：",
  ". You can answer without performing certainty.": "。你可以照實回答，不必假裝確定。",
  "▶ Play voice": "▶ 播放語音",
  "Show text notice": "顯示文字通知",
  "Listening…": "正在聆聽…",
  "🎙 Reply by voice": "🎙 用語音回覆",
  "Voice transcript or text reply": "語音轉錄或文字回覆",
  "I was pulled into cloud debugging, and the original action no longer fits tonight…": "我被雲端除錯拉走了，原本的行動已不適合今晚…",
  "Send update": "送出更新",
  "Delay once": "延後一次",
  "Delay again": "再次延後",
  "Something changed": "情況有變",
  "Recovery conversation": "恢復對話",
  "Change the plan, not the truth.": "調整計畫，不扭曲事實。",
  "This panel opens automatically after repeated delay. You can also use it early.": "重複延後後會自動開啟此面板，你也可以提前使用。",
  "The timing is wrong": "時間點不合適",
  "The action is too large": "行動太大",
  "The method is unpleasant or blocked": "方法令人抗拒或受到阻礙",
  "The direction needs calibration": "方向需要重新校準",
  "Confirm a new commitment": "確認新的承諾",
  "Share progress": "分享進度",
  "Show what moved.": "讓進展被看見。",
  "Selected progress evidence": "已選擇的進度證據",
  "● Start recording": "● 開始錄音",
  "■ Stop recording": "■ 停止錄音",
  "What does this evidence show?": "這份證據說明了什麼？",
  "I finished the smaller recovery flow and confirmed the cloud callback still works…": "我完成了縮小後的恢復流程，也確認雲端回呼仍然正常…",
  "Specific feedback": "具體回饋",
  "Feedback will name the real evidence, connect it to your goal, and preserve the next resume point.": "回饋會指出真正的證據、連回你的目標，並保留下次接續的位置。",
  "Stored together": "一併保存",
  "✓ Progress evidence": "✓ 進度證據",
  "✓ Specific feedback": "✓ 具體回饋",
  "✓ Resume point": "✓ 接續點",
  "✓ Memory for the next interaction": "✓ 下次互動使用的記憶",
  "Journey timeline": "旅程時間線",
  "A plan that remembers real life.": "一份記得真實生活的計畫。",
  "Retrieved memory": "取回的記憶",
  "Needs confirmation": "需要確認",
  "Confirmed": "已確認",
  "Intervention effectiveness": "介入成效",
  "Did this support help you continue?": "這次支持有幫助你繼續嗎？",
  "Rate intervention from one to five": "為這次介入評分，一到五分",
  "Agent run trace": "Agent 執行軌跡",
  "Auditable orchestration": "可稽核的編排",
  "Local simulation · cloud health pending": "本機模擬 · 等待雲端健康狀態",
  "Agent": "Agent",
  "Provider / model": "供應商／模型",
  "Schema": "結構契約",
  "Day": "天數",
  "Status": "狀態",
  "Raw prompts, secrets, media, and private reasoning are excluded. Live traces add safe token usage.": "不記錄原始提示詞、密鑰、媒體與私人推理；即時軌跡只加入安全的 token 用量。",
  "Acceptance path": "驗收路徑",
  "○ Cloud runtime health pending": "○ 等待雲端執行環境健康狀態",
  "✓ Two real state machines": "✓ 兩個真實狀態機",
  "✓ Four Agent contracts": "✓ 四個 Agent 契約",
  "✓ Text + tap-to-play TTS": "✓ 文字＋點按播放 TTS",
  "✓ Voice transcription boundary": "✓ 語音轉錄邊界",
  "✓ Text, photo, voice progress": "✓ 文字、照片、語音進度",
  "✓ Memory + resume point": "✓ 記憶＋接續點",
  "✓ 30-day accelerated simulation": "✓ 30 天加速模擬",
  "✓ Journey + safe trace": "✓ 旅程＋安全軌跡",
  "Safe runtime snapshot": "安全執行環境快照",
  "Saved in this browser · media stays local until cloud upload is activated": "已儲存在此瀏覽器 · 啟用雲端上傳前，媒體只留在本機",
  "Reset this journey": "重設這段旅程",
  "Open check-in": "開啟報到",
  "Resume point": "接續點",
  "Last checkpoint": "上一個檢查點",
  "Current blocker": "目前阻礙",
  "No blocker confirmed": "尚未確認阻礙",
  "Next physical action": "下一個具體動作",
  "Accelerated simulation": "加速模擬",
  "Compress time, not behavior.": "壓縮時間，不壓縮行為。",
  "The UI clearly labels simulated days while the same state, memory, recovery, and trace contracts remain visible.": "介面會清楚標示模擬天數，同時讓同一套狀態、記憶、恢復與軌跡契約保持可見。",
  "Advance to next meaningful day": "前往下一個有意義的日子",
  "Run full 30-day story": "跑完 30 天旅程",
  "Protection status": "保護狀態",
  "Protected now": "目前受保護",
  "Repeated delays": "重複延後",
  "Stored memories": "已保存的記憶",
  "Was the last support useful?": "上次的支持有幫助嗎？",
  "Text-to-speech is unavailable in this browser.": "此瀏覽器無法使用文字轉語音。",
  "There is no readable text.": "目前沒有可朗讀的文字。",
  "Voice message played.": "語音訊息已播放。",
  "The browser could not play this voice message.": "瀏覽器無法播放這段語音訊息。",
  "Voice locale changed. Start the natural voice again when ready.": "語音語言已切換；準備好時請重新開啟高擬真語音。",
  "Natural voice reply transcribed. Review it before sending.": "高擬真語音已轉成文字，請確認後再送出。",
  "Natural voice stopped safely. Text and standard voice still work.": "高擬真語音已安全停止；文字與標準語音仍可使用。",
  "Connecting the protected natural voice…": "正在連接受保護的高擬真語音…",
  "Natural voice is on. Speak once, then review the transcript.": "高擬真語音已開啟；說完一次後，請確認轉錄內容。",
  "Natural voice could not connect. Text and standard voice still work.": "高擬真語音無法連接；文字與標準語音仍可使用。",
  "Natural voice is off. The microphone has been released.": "高擬真語音已關閉，麥克風也已釋放。",
  "Notifications are unavailable in this browser.": "此瀏覽器無法使用通知。",
  "Notification permission was not granted.": "尚未授予通知權限。",
  "A protected check-in notification was shown.": "已顯示一則受保護的報到通知。",
  "Goal and support agreement confirmed": "目標與支持協議已確認",
  "Goal created": "目標已建立",
  "Support agreement confirmed": "支持協議已確認",
  "First protected check-in": "第一次受保護的報到",
  "One delay accepted": "已接受一次延後",
  "The check-in moved without judgment because real life interrupted.": "因為真實生活打斷了行動，報到已在不批判的情況下順延。",
  "Repeated-delay pattern detected": "偵測到重複延後模式",
  "Commitment Recovery asks whether timing, task size, method, or direction is wrong.": "承諾恢復 Agent 會確認問題出在時間、任務大小、方法或方向。",
  "Action resized": "已縮小行動",
  "Strategy proposed for memory": "已提出記憶策略",
  "Reducing the action restored continuity after infrastructure work ran long.": "基礎設施工作拖長後，縮小行動幫助恢復了連續性。",
  "Voice progress shared": "已分享語音進度",
  "The protected minimum was completed.": "已完成受保護的最低版本。",
  "Specific feedback returned": "已回傳具體回饋",
  "Goal calibration": "目標校準",
  "Direction retained; method adjusted around the user's real constraints.": "保留方向，並依使用者的真實限制調整方法。",
  "Thirty-day continuity visible": "30 天連續性已可見",
  "The journey connects planning, interruption, adaptation, evidence, memory, and continuation.": "旅程已串連計畫、中斷、調整、證據、記憶與接續。",
  "Live polling will retry.": "即時輪詢將自動重試。",
  "This device is paired for twelve hours.": "此裝置已配對，有效期十二小時。",
  "Pairing was denied or this one-time code is already used.": "配對遭拒，或此單次配對碼已使用。",
  "Scheduling a real Cloud Task…": "正在排程真實 Cloud Task…",
  "Scheduled. The open PWA is polling for the pending check-in.": "排程完成。開啟中的 PWA 正在輪詢待處理報到。",
  "The cloud schedule did not complete. The same request can be retried safely.": "雲端排程未完成；可安全地重試同一個請求。",
  "Listening for one reply…": "正在聆聽一次回覆…",
  "Voice reply transcribed. Review it before sending.": "語音已轉成文字，請確認後再送出。",
  "No clear transcript was captured. Try again or type.": "沒有取得清楚的轉錄，請重試或改用文字。",
  "Speech transcription is unavailable here; text still works.": "此處無法使用語音轉錄，仍可使用文字。",
  "GPT-5.6 is asking Recovery and Chief of Staff…": "GPT-5.6 正在請恢復 Agent 與幕僚長共同判斷…",
  "Real structured decision received. Review it before confirming.": "已收到真實的結構化決策，請確認後再保存。",
  "The live reply stopped safely. Retry uses the same reply identity.": "即時回覆已安全停止；重試會沿用同一個回覆識別碼。",
  "Persisting confirmation, memory, and next follow-up…": "正在保存確認、記憶與下次跟進…",
  "Confirmed. The next real follow-up is scheduled.": "已確認，下一次真實跟進已排程。",
  "Confirmation did not finish. Repeating it is safe and idempotent.": "確認尚未完成；重複操作安全且具冪等性。",
  "This device session is revoked.": "此裝置工作階段已撤銷。",
  "Session revocation needs another attempt.": "撤銷工作階段需要再試一次。",
  "Private live path": "私人即時路徑",
  "This stable public revision keeps the single-device path disabled. It is activated only in the protected recording preview.": "公開穩定版本會關閉單裝置路徑；只有受保護的錄影預覽版本會啟用。",
  "Checking private live connection…": "正在檢查私人即時連線…",
  "The protected connection is temporarily unavailable.": "受保護的連線暫時無法使用。",
  "Single-device pairing · 12 hours": "單一裝置配對 · 12 小時",
  "Connect this PWA without exposing the API key.": "連接此 PWA，且不暴露 API Key。",
  "One-time pairing code": "單次配對碼",
  "Device label": "裝置名稱",
  "Pair this device": "配對此裝置",
  "Pair from Check-in mode to reveal real provider, model, tokens, and trace IDs.": "請從「報到」頁配對，以查看真實供應商、模型、token 與軌跡 ID。",
  "Real mobile trace": "真實手機軌跡",
  "Provider evidence from the user-facing path": "來自使用者實際路徑的供應商證據",
  "Natural voice layer": "高擬真語音層",
  "Provider": "供應商",
  "Model / transport": "模型／傳輸方式",
  "Session status": "連線狀態",
  "User-start only. The voice layer transcribes and speaks; GPT-5.6 remains the structured decision brain.": "只會由使用者主動開啟。語音層負責聆聽與說話；GPT-5.6 仍是結構化決策大腦。",
  "Revoke device": "撤銷裝置",
  "No live mobile Agent call has completed yet.": "尚未完成任何手機端即時 Agent 呼叫。",
  "Raw reply, prompt, secrets, and private reasoning are excluded. These rows come from Firestore, not the local simulation.": "不記錄原始回覆、提示詞、密鑰與私人推理；這些資料列來自 Firestore，不是本機模擬。",
  "Real Cloud Tasks + GPT-5.6": "真實 Cloud Tasks + GPT-5.6",
  "Private incoming check-in": "私人即時報到",
  "No active live check-in. Start the recorded story with one real scheduled callback.": "目前沒有進行中的即時報到。可用一次真實排程回呼開始示範故事。",
  "Schedule demo check-in · 15 sec": "排程示範報到 · 15 秒",
  "Scheduled for": "已排程於",
  ". Polling only while this PWA is open.": "。只在此 PWA 開啟時輪詢。",
  "Polling only while this PWA is open.": "只在此 PWA 開啟時輪詢。",
  "What changed, in your own words…": "用你自己的話說，發生了什麼變化…",
  "■ Stop natural voice": "■ 關閉高擬真語音",
  "✦ Start natural voice": "✦ 開啟高擬真語音",
  "▶ Standard voice": "▶ 標準語音",
  "🎙 Standard voice reply": "🎙 標準語音回覆",
  "Natural voice:": "高擬真語音：",
  "It starts only after your tap and releases the microphone when stopped.": "只會在你點按後啟動，停止時會釋放麥克風。",
  "▶ Play with natural voice": "▶ 以高擬真語音播放",
  "connecting": "連接中",
  "ready and listening": "已就緒並正在聆聽",
  "hearing your reply": "正在聽取你的回覆",
  "speaking": "播放中",
  "stopped safely": "已安全停止",
  "off": "已關閉",
  "Retry the same live decision": "重試同一筆即時決策",
  "Send to real Agents": "送給真實 Agents",
  "Recovery and Chief of Staff are producing one structured decision. Polling is active.": "恢復 Agent 與幕僚長正在產生一筆結構化決策；輪詢進行中。",
  "Confirmed live decision": "已確認的即時決策",
  "Review before persistence": "保存前確認",
  "Adapted commitment": "調整後的承諾",
  "Strategy": "策略",
  "Next follow-up": "下次跟進",
  "Memory proposal": "記憶提案",
  "Memory proposal:": "記憶提案：",
  "Confirm adapted commitment": "確認調整後的承諾",
  "✓ Decision, memory, and next follow-up persisted": "✓ 決策、記憶與下次跟進已保存",
  "Provider / returned model": "供應商／回傳模型",
  "Tokens": "Tokens",
  "Trace ID": "軌跡 ID",
  "Saved": "儲存於",
  "Agent trace:": "Agent 軌跡：",
  "validated": "已驗證",
};

function translatePattern(text: string): string | null {
  const patterns: Array<[RegExp, (...parts: string[]) => string]> = [
    [/^Question (\d+) of 3$/u, (number) => `第 ${number} 題，共 3 題`],
    [/^0(\d+) · Your north star$/u, (number) => `0${number} · 你的北極星`],
    [/^Simulated Day (\d+)$/u, (day) => `模擬第 ${day} 天`],
    [/^Day (\d+) \/ 30$/u, (day) => `第 ${day}／30 天`],
    [/^Day (\d+)$/u, (day) => `第 ${day} 天`],
    [/^(\d+) events$/u, (count) => `${count} 個事件`],
    [/^Assumptions to confirm \((\d+)\)$/u, (count) => `待確認的假設（${count}）`],
    [/^Tone: (.+)\. You can answer without performing certainty\.$/u, (tone) => `語氣：${tone}。你可以照實回答，不必假裝確定。`],
    [/^You planned to continue “(.+)”\. Are you still at the same checkpoint\?$/u, (action) => `你原本打算繼續「${action}」。現在還在同一個進度點嗎？`],
    [/^You planned to continue “(.+)”\. What is true right now\?$/u, (action) => `你原本打算繼續「${action}」。現在真實的情況是什麼？`],
    [/^Hard day version: (.+)$/u, (action) => `狀態不好時的版本：${action}`],
    [/^Saved (.+)$/u, (date) => `儲存於 ${date}`],
    [/^Create the first visible proof of progress for: (.+)$/u, (goal) => `為「${goal}」建立第一個看得見的進度證據`],
    [/^How did “(.+)” go\?$/u, (action) => `「${action}」進行得如何？`],
  ];
  for (const [pattern, render] of patterns) {
    const match = text.match(pattern);
    if (match) return render(...match.slice(1));
  }
  return null;
}

export function translateUiText(text: string, locale: AppLocale): string {
  if (locale === "en") return text;
  const normalized = text.replaceAll(/\s+/gu, " ").trim();
  if (!normalized) return text;
  return zhTW[text] ?? zhTW[normalized] ?? translatePattern(normalized) ?? text;
}

export function speechLanguageForLocale(
  locale: AppLocale,
): "zh-TW" | "en-US" {
  return locale === "zh-TW" ? "zh-TW" : "en-US";
}

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (text: string) => string;
  formatDateTime: (value: Date | string) => string;
  formatTime: (value: Date | string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("zh-TW");
  useEffect(() => {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved !== "zh-TW" && saved !== "en") return;
    const hydrationTimer = window.setTimeout(() => setLocaleState(saved), 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);
  const value = useMemo<LocaleContextValue>(() => {
    const intlLocale = locale === "zh-TW" ? "zh-TW" : "en-US";
    return {
      locale,
      setLocale: setLocaleState,
      t: (text) => translateUiText(text, locale),
      formatDateTime: (input) => new Intl.DateTimeFormat(intlLocale, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(input)),
      formatTime: (input) => new Intl.DateTimeFormat(intlLocale, { hour: "numeric", minute: "2-digit" }).format(new Date(input)),
    };
  }, [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}

function localizeNode(node: ReactNode, locale: AppLocale): ReactNode {
  if (typeof node === "string") return translateUiText(node, locale);
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  const props = element.props;
  const nextProps: Record<string, unknown> = {};
  for (const name of ["placeholder", "title", "aria-label", "alt", "value"]) {
    if (typeof props[name] === "string") nextProps[name] = translateUiText(props[name], locale);
  }
  if ("children" in props) {
    nextProps.children = Children.map(props.children as ReactNode, (child) => localizeNode(child, locale));
  }
  return cloneElement(element, nextProps);
}

export function Localized({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  return <>{localizeNode(children, locale)}</>;
}

export function LanguageToggle({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale } = useLocale();
  const shell = dark ? "border-white/20 bg-white/10 text-white" : "border-[#cdd9d1] bg-white text-[#315044]";
  const active = dark ? "bg-[#d8f48a] text-[#173f35]" : "bg-[#173f35] text-white";
  return (
    <div className={`inline-flex rounded-full border p-1 text-xs font-bold ${shell}`} aria-label={locale === "zh-TW" ? "切換介面語言" : "Switch interface language"}>
      <button type="button" className={`rounded-full px-3 py-1.5 ${locale === "zh-TW" ? active : ""}`} aria-pressed={locale === "zh-TW"} onClick={() => setLocale("zh-TW")}>繁中</button>
      <button type="button" className={`rounded-full px-3 py-1.5 ${locale === "en" ? active : ""}`} aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
    </div>
  );
}
