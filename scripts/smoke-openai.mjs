import { readFile } from "node:fs/promises";
import process from "node:process";

function readEnvValue(source, name) {
  const line = source
    .split(/\r?\n/u)
    .find((candidate) => candidate.trimStart().startsWith(`${name}=`));

  if (!line) return null;

  const raw = line.slice(line.indexOf("=") + 1).trim();
  if (!raw) return null;

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }

  return raw;
}

function outputText(response) {
  const message = response.output?.find((item) => item.type === "message");
  const text = message?.content?.find((item) => item.type === "output_text");
  return text?.text ?? null;
}

async function main() {
  const envSource = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  const apiKey = readEnvValue(envSource, "OPENAI_API_KEY");

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing from .env.local");
  }

  const startedAt = new Date();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6",
      input: "Set ok to true.",
      store: false,
      reasoning: { effort: "none" },
      max_output_tokens: 32,
      text: {
        format: {
          type: "json_schema",
          name: "build_week_smoke_test",
          strict: true,
          schema: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
            },
            required: ["ok"],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = payload?.error ?? {};
    console.error(
      JSON.stringify(
        {
          passed: false,
          requested_model: "gpt-5.6",
          responses_api_attempted: true,
          model_name_validated: false,
          account_model_access_validated: false,
          structured_output_validated: false,
          http_status: response.status,
          error_type: error.type ?? null,
          error_code: error.code ?? null,
          error_message: error.message ?? "OpenAI API request failed",
          started_at: startedAt.toISOString(),
          completed_at: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const text = outputText(payload);
  let parsed = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  const structuredOutputValid =
    parsed !== null &&
    typeof parsed === "object" &&
    parsed.ok === true &&
    Object.keys(parsed).length === 1;

  const evidence = {
    passed: response.ok && structuredOutputValid,
    requested_model: "gpt-5.6",
    returned_model: payload.model ?? null,
    account_access_confirmed: true,
    responses_api_confirmed: true,
    structured_output_confirmed: structuredOutputValid,
    structured_output_value: parsed,
    response_status: payload.status ?? null,
    response_id: payload.id ?? null,
    store: false,
    reasoning_effort: "none",
    started_at: startedAt.toISOString(),
    completed_at: new Date().toISOString(),
    usage: {
      input_tokens: payload.usage?.input_tokens ?? null,
      output_tokens: payload.usage?.output_tokens ?? null,
      total_tokens: payload.usage?.total_tokens ?? null,
    },
  };

  console.log(JSON.stringify(evidence, null, 2));

  if (!evidence.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        passed: false,
        error_type: error?.name ?? "Error",
        error_message: error?.message ?? "Unknown smoke test failure",
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
