// One real lookup through the exact path the voice layer uses.
//   npm run test:live:voice-search
// Costs roughly 20-25k tokens. Run deliberately, never in CI.
import { spawnSync } from "node:child_process";

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true);
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not available in the local environment.");
}

const result = spawnSync(
  process.execPath,
  [
    "node_modules/vitest/vitest.mjs",
    "run",
    "src/live-checkin/voice-search.live.test.ts",
    "--disableConsoleIntercept",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", env: { ...process.env, RUN_LIVE_VOICE_SEARCH: "1" } },
);

process.exit(result.status ?? 1);
