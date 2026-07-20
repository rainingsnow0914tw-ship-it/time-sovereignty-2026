// Outer-loop live check: does GPT-5.6 actually reach the web and come back
// with something a person could act on? Run deliberately, not in CI.
//   node scripts/run-live-web-search.mjs
// It performs exactly one real search. Cost is bounded by the token budget.
import { readFileSync } from "node:fs";
import OpenAI from "openai";

// This workspace keeps no .env.local of its own; the key lives in the sibling
// workspace. Read it, never print it.
const ENV_CANDIDATES = [
  new URL("../.env.local", import.meta.url),
  new URL(
    "file:///C:/Users/soulf/Desktop/openAI%20build%20week202607130721/.env.local",
  ),
];
if (!process.env.OPENAI_API_KEY) {
  for (const candidate of ENV_CANDIDATES) {
    try {
      const env = readFileSync(candidate, "utf8");
      for (const line of env.split("\n")) {
        const match = line.match(/^\s*OPENAI_API_KEY\s*=\s*(.+)\s*$/u);
        if (match) process.env.OPENAI_API_KEY = match[1].trim();
      }
      if (process.env.OPENAI_API_KEY) break;
    } catch {
      // try the next candidate
    }
  }
}
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set. Add it to .env.local or the shell.");
  process.exit(1);
}

const model = process.env.OPENAI_MODEL ?? "gpt-5.6";
const client = new OpenAI({ maxRetries: 0 });

// A question the assistant genuinely cannot answer from the user's own goal,
// history, or memory - which is the only situation search is allowed in.
const question =
  "有下背疼痛時，白天久坐族群可以做哪些低強度的替代活動？請引用來源。";

console.log(`model        : ${model}`);
console.log(`question     : ${question}`);
console.log("searching…\n");

const started = Date.now();
const response = await client.responses.create({
  model,
  instructions:
    "Answer in Traditional Chinese as used in Taiwan. Use web search when the answer depends on current external information. Cite the sources you used. Say plainly when evidence is weak or mixed; never invent a source.",
  input: question,
  tools: [{ type: "web_search" }],
  reasoning: { effort: "low" },
  max_output_tokens: 2_000,
  store: false,
});

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
const searchCalls = (response.output ?? []).filter(
  (item) => item.type === "web_search_call",
);

console.log("--- answer ---");
console.log(response.output_text ?? "(no text)");
console.log("\n--- evidence ---");
console.log(`model returned    : ${response.model}`);
console.log(`web_search_call   : ${searchCalls.length} 次`);
console.log(`elapsed           : ${elapsed}s`);
if (response.usage) {
  console.log(
    `tokens            : in ${response.usage.input_tokens} / out ${response.usage.output_tokens} / total ${response.usage.total_tokens}`,
  );
}
console.log(
  searchCalls.length > 0
    ? "\nRESULT: the model really searched the web."
    : "\nRESULT: no search call was made — it answered from its own knowledge.",
);
