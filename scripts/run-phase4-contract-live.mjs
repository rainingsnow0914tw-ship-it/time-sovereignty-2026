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
    "src/providers/ai/openai-provider.contract.live.test.ts",
    "--disableConsoleIntercept",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, RUN_PHASE4_CONTRACT_LIVE: "1" },
  },
);

process.exit(result.status ?? 1);
