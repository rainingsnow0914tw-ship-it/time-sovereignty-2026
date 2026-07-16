# Phase 3 GCP Bootstrap Checklist

This checklist is specific to Time Sovereignty. Run one numbered command at a
time and verify its stated result before continuing.

## Fixed deployment map

- account: `soulfaihk@gmail.com`
- project: `time-sovereignty-2026`
- project number: `29309448808`
- region: `asia-east1`
- Firestore database: `(default)`
- Cloud Run service: `time-sovereignty`
- Cloud Tasks queue: `time-sovereignty-checkins`
- runtime identity:
  `time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com`
- task-caller identity:
  `time-sovereignty-tasks@time-sovereignty-2026.iam.gserviceaccount.com`
- OIDC audience and public service base:
  `https://time-sovereignty-defqnamrrq-de.a.run.app`

## Atomic bootstrap

### 1. Verify the signed-in account

```bash
gcloud auth list --filter=status:ACTIVE --format='value(account)'
```

Expected: `soulfaihk@gmail.com`.

### 2. Set the project

```bash
gcloud config set project time-sovereignty-2026
```

Expected: project updated without an error.

### 3. Verify the existing Firestore database

```bash
gcloud firestore databases describe --database='(default)' --project=time-sovereignty-2026 --format='value(name,locationId,type,deleteProtectionState)'
```

Expected: `(default)`, `asia-east1`, Firestore Native, delete protection on.

### 4. Create or verify the runtime identity

```bash
gcloud iam service-accounts describe time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com --project=time-sovereignty-2026 >/dev/null 2>&1 || gcloud iam service-accounts create time-sovereignty-runtime --display-name='Time Sovereignty runtime' --project=time-sovereignty-2026
```

Expected: the service account exists.

### 5. Create or verify the Cloud Tasks caller identity

```bash
gcloud iam service-accounts describe time-sovereignty-tasks@time-sovereignty-2026.iam.gserviceaccount.com --project=time-sovereignty-2026 >/dev/null 2>&1 || gcloud iam service-accounts create time-sovereignty-tasks --display-name='Time Sovereignty Cloud Tasks caller' --project=time-sovereignty-2026
```

Expected: the service account exists.

### 6. Grant Firestore access to the runtime identity

```bash
gcloud projects add-iam-policy-binding time-sovereignty-2026 --member='serviceAccount:time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com' --role='roles/datastore.user'
```

Expected: the binding appears once in the returned policy.

### 7. Grant Cloud Tasks enqueue access to the runtime identity

```bash
gcloud projects add-iam-policy-binding time-sovereignty-2026 --member='serviceAccount:time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com' --role='roles/cloudtasks.enqueuer'
```

Expected: the binding appears once in the returned policy.

### 8. Allow the runtime identity to mint tasks as the caller identity

```bash
gcloud iam service-accounts add-iam-policy-binding time-sovereignty-tasks@time-sovereignty-2026.iam.gserviceaccount.com --member='serviceAccount:time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com' --role='roles/iam.serviceAccountUser' --project=time-sovereignty-2026
```

Expected: the task-caller policy contains the runtime identity.

### 9. Grant the task caller Cloud Run invocation permission

```bash
gcloud run services add-iam-policy-binding time-sovereignty --region=asia-east1 --project=time-sovereignty-2026 --member='serviceAccount:time-sovereignty-tasks@time-sovereignty-2026.iam.gserviceaccount.com' --role='roles/run.invoker'
```

Expected: the service policy contains the task-caller identity.

### 10. Create or verify the queue

```bash
gcloud tasks queues describe time-sovereignty-checkins --location=asia-east1 --project=time-sovereignty-2026 >/dev/null 2>&1 || gcloud tasks queues create time-sovereignty-checkins --location=asia-east1 --project=time-sovereignty-2026 --max-dispatches-per-second=10 --max-concurrent-dispatches=10
```

Expected: queue state `RUNNING`.

### 11. Deploy without resource flags

```bash
gcloud run deploy time-sovereignty --source=. --region=asia-east1 --project=time-sovereignty-2026 --quiet
```

Expected: a new ready revision with 100% traffic. Existing CPU, memory,
min-instances, and scaling settings must remain unchanged.

### 12. Bind the runtime identity and non-secret configuration

```bash
gcloud run services update time-sovereignty --region=asia-east1 --project=time-sovereignty-2026 --service-account=time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com --update-env-vars='GCP_PROJECT_ID=time-sovereignty-2026,FIRESTORE_DATABASE_ID=(default),CLOUD_TASKS_LOCATION=asia-east1,CLOUD_TASKS_QUEUE=time-sovereignty-checkins,CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL=time-sovereignty-tasks@time-sovereignty-2026.iam.gserviceaccount.com,CLOUD_TASKS_OIDC_AUDIENCE=https://time-sovereignty-defqnamrrq-de.a.run.app,CLOUD_TASKS_CALLBACK_BASE_URL=https://time-sovereignty-defqnamrrq-de.a.run.app,TASK_CALLBACK_LEASE_SECONDS=60'
```

Expected: a new ready revision using the dedicated runtime identity. No secret
or OpenAI key appears in the environment list.

### 13. Verify service configuration

```bash
gcloud run services describe time-sovereignty --region=asia-east1 --project=time-sovereignty-2026 --format='yaml(status.latestReadyRevisionName,status.traffic,spec.template.spec.serviceAccountName,spec.template.spec.containers[0].resources,spec.template.spec.containers[0].env[].name)'
```

Expected: 100% traffic, dedicated runtime identity, 1 CPU, 512 MiB, and only
the seven non-secret Phase 3 variable names.

## Acceptance proof

After bootstrap, create one schema-valid `SCHEDULED` intervention, enqueue one
OIDC task, and preserve before/after Firestore reads. Then enqueue a second task
with the same intervention ID. The second callback must return success as a
duplicate without changing the intervention a second time.

Do not claim Phase 3 complete until the queue, task names, callback logs,
Firestore transition, completed receipt, and duplicate result are all recorded
under `docs/evidence/`.
