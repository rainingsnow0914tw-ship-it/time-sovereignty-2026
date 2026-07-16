import { spawnSync } from "node:child_process";

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not available in the local environment.");
}

const result = spawnSync(
  process.execPath,
  [
    "node_modules/vitest/vitest.mjs",
    "run",
    "src/orchestration/chief-of-staff.live.test.ts",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, RUN_PHASE4_LIVE: "1" },
  },
);

process.exit(result.status ?? 1);
