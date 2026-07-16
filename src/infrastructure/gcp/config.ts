import { z } from "zod";

const CloudConfigSchema = z
  .object({
    projectId: z.string().trim().min(1),
    firestoreDatabaseId: z.string().trim().min(1),
    tasksLocation: z.string().trim().min(1),
    tasksQueue: z.string().trim().min(1),
    tasksServiceAccountEmail: z.string().trim().email(),
    tasksOidcAudience: z.string().url(),
    tasksCallbackBaseUrl: z.string().url(),
    callbackLeaseSeconds: z.number().int().min(10).max(600),
  })
  .strict();

export type CloudConfig = z.infer<typeof CloudConfigSchema>;

export function readCloudConfig(
  env: NodeJS.ProcessEnv = process.env,
): CloudConfig {
  return CloudConfigSchema.parse({
    projectId: env.GCP_PROJECT_ID ?? env.GOOGLE_CLOUD_PROJECT,
    firestoreDatabaseId: env.FIRESTORE_DATABASE_ID ?? "(default)",
    tasksLocation: env.CLOUD_TASKS_LOCATION,
    tasksQueue: env.CLOUD_TASKS_QUEUE,
    tasksServiceAccountEmail: env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL,
    tasksOidcAudience: env.CLOUD_TASKS_OIDC_AUDIENCE,
    tasksCallbackBaseUrl: env.CLOUD_TASKS_CALLBACK_BASE_URL,
    callbackLeaseSeconds: Number(env.TASK_CALLBACK_LEASE_SECONDS ?? "60"),
  });
}
