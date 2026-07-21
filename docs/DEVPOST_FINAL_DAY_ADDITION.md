# Devpost 補充文字（2026-07-21 撰寫，供 Chloe 貼上）

> 我看不到妳目前 Devpost 上的描述（那頁要登入）。所以這是**可以直接接在後面的一段**，
> 不是改寫。妳貼上去之後自己調語氣就好。
>
> **我不會、也不應該替妳編輯或送出 Devpost。** 那是妳的帳號、妳的參賽作品。

---

## 建議貼在「Project description」最後面（英文，評審讀的）

### The final day: closing the loop with a real person

The last 24 hours were spent making the assistant survive contact with an
actual user rather than a script. Every change below came from a defect found
by using the product on a real phone, and each one is verifiable in server
logs rather than only in a demo.

**The voice layer became a partner instead of a reader.** It previously
transcribed the user and read the plan back. It now answers, can be
interrupted mid-sentence, and merges what the user changes her mind about.
Saying "make it once instead of five" and then "in ten minutes" is two
different revisions, not two commitments — amount and timing replace, while
circumstances accumulate. That merge is a language judgement, so the rules
live in the prompt and GPT-5.6 decides. When it genuinely cannot tell what was
meant, it is required to ask rather than guess.

**It looks things up instead of dead-ending.** When an answer depends on
external or current facts, the assistant calls a `look_up` tool backed by
GPT-5.6 with web search, and names its sources aloud. It reports weak or
contradictory evidence as weak evidence. It is explicitly forbidden from
searching anything about the user's own goal, plan, or history — it already
has those. Search is capped at two calls per spoken session, because one
measured lookup costs roughly 11k tokens.

**It is decisive on purpose.** An earlier revision made it brief but
conversational — offer a suggestion, ask how it feels, offer another. Testing
showed that this turns the assistant into the most comfortable possible way to
keep deliberating. A product whose job is to end over-deliberation must not
become a new place to over-deliberate, so the voice layer now closes: one
concrete version, a yes/no question, then go and do it. The one exception is
explaining something, where completeness matters more than brevity.

**It knows what it can and cannot do.** The planner used to write "set five
reminders and log 1/5, 2/5" — handing the cognitive load straight back to the
user, and naming an interface that does not exist. Both planning agents now
receive an explicit capability boundary, stated in both directions: what the
app really does (it schedules and returns the check-in itself; it escalates to
a full-screen call), and what it must never promise (phone alarms, calendar
entries, repetition counters). The next action must be the thing the user
physically does, not the admin around it.

**Failures say what happened.** A goal whose end date had passed could not
schedule a follow-up, so replies failed — silently, behind a button that
appeared to do nothing. The reason now reaches the screen in plain language.

### Verified end to end, on a real phone

On 2026-07-21 the full loop ran with a real user and a real glass of water.
Every step is a server-side timestamp, not a screenshot:

```
11:23:38  /api/live/check-ins/schedule           200   user starts the work block
11:25:38  /api/tasks/live-checkins/{id}          200   Cloud Tasks fires on its own
11:25:50  /api/live/realtime/session             200   spoken conversation
11:25:53  /api/tasks/catch-v2/.../levels/2       200   escalation
11:26:08  /api/tasks/catch-v2/.../levels/4       200   full-screen incoming call
11:26:58  /api/live/check-ins/summary            200   conversation merged into a report
11:27:16  /api/live/native/events/{id}/responses 200   answered on the Android app
11:32:08  /api/live/check-ins/{id}/confirm       200   user confirms
```

Final state: `CONFIRMED`, memory disposition `DEFER`, no error, two agent
traces. The user drank the water. The assistant said she had done it, then
offered a different action rather than pushing the same one again.

### How the AI tools were used, honestly

Codex built the core of this project during the submission period, including
the agent architecture, the Cloud Run and Cloud Tasks path, the Firestore
schemas, and the Android channel. The primary Codex session ID is in the
repository README.

On the final day Codex ran out of quota mid-debugging. A second assistant,
Claude Code, took over from Codex's handover notes and did the work described
above: fixing the defects found in live use, adding the conversation summary
and the lookup tool, and verifying each change against server logs before
claiming it worked. Both assistants were development tools; the product's own
reasoning is GPT-5.6 (`gpt-5.6-sol`) and `gpt-realtime-2.1`, on every real
request.

The reason for every product decision — including the ones that were later
reversed — is recorded in `docs/PRODUCT_DIRECTION.md`, in the user's own
words, so that a future maintainer can tell what was deliberate from what was
accidental.

---

## 中文（給妳自己看的，不用貼）

上面那段講了五件事：

1. **語音變成夥伴** — 會回答、可以打斷、會合併妳改過主意的地方；判斷不出來會問妳
2. **會查證** — 講出來源，證據弱就說弱，不准查妳自己的事，一次對話最多查兩次
3. **果斷不聊天** — 並且老實寫出「早期版本做錯了、測試才發現」
4. **知道自己有哪些手** — 不再叫使用者自己設鬧鐘記 1/5
5. **失敗說人話**

然後放了**今天那八行後台記錄**當證據 —— 那是別人偽造不了的東西。

最後那段「How the AI tools were used, honestly」就是妳說的「用了兩個 AI 就要老實寫」：
Codex 建主體、額度用完、阿寶接手做最後一天。**而且明講兩個都只是開發工具，
產品本身的腦是 GPT-5.6。**

規則要求既有專案要「clear documentation distinguishing prior work from new work」——
妳想老實寫的，剛好就是它要的。
