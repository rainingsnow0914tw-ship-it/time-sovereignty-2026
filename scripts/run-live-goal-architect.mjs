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
    "src/live-checkin/goal-architect.contract.live.test.ts",
    "--disableConsoleIntercept",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, RUN_LIVE_GOAL_ARCHITECT: "1" },
  },
);

process.exit(result.status ?? 1);
