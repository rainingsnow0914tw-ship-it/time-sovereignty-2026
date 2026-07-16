# GCP walking-skeleton evidence — 2026-07-16

## Scope

Create and verify a dedicated Google Cloud foundation and deploy the current
Next.js application without deploying any OpenAI secret.

## Tooling and identity

- Workstation: 4070 Windows machine
- Google Cloud SDK: 576.0.0
- Authenticated account: `soulfaihk@gmail.com`
- Commands used explicit project and account flags; no old project was changed.

## Project

- Project name: `Time Sovereignty`
- Project ID: `time-sovereignty-2026`
- Project number: `29309448808`
- Lifecycle: `ACTIVE`
- Billing enabled: `true`

## Enabled APIs

- `run.googleapis.com`
- `firestore.googleapis.com`
- `cloudtasks.googleapis.com`
- `storage.googleapis.com`
- `secretmanager.googleapis.com`
- `cloudbuild.googleapis.com`
- `logging.googleapis.com`
- `artifactregistry.googleapis.com`
- `billingbudgets.googleapis.com`

## Firestore

- Database: `(default)`
- Location: `asia-east1`
- Type: `FIRESTORE_NATIVE`
- Edition: Standard
- Delete protection: `DELETE_PROTECTION_ENABLED`

## Cloud Run

- Service: `time-sovereignty`
- Region: `asia-east1`
- Revision: `time-sovereignty-00001-hl6`
- Traffic: 100% to the latest revision
- CPU limit: 1 vCPU
- Memory limit: 512 MiB
- Minimum instances: no minimum-instance override; default zero applies
- Canonical URL: `https://time-sovereignty-defqnamrrq-de.a.run.app`

Live HTTP verification:

```text
StatusCode: 200
Title: Time Sovereignty
Expected project name present: true
```

## Source-upload safety

Before deployment, `gcloud meta list-files-for-upload` reported 29 files. The
upload set was checked and did not contain:

- `.env.local`;
- `GPTAPIKEY.txt`;
- `node_modules`;
- `.next`.

`OPENAI_API_KEY` was not added to Cloud Run or Secret Manager during this
bootstrap.

## Cost guardrail

- Budget display name: `Time Sovereignty Build Week USD30`
- Scope: project `29309448808` only
- Monthly amount: US$30
- Current-spend alerts: 50%, 90%, and 100%

## Honest completion boundary

Confirmed:

- project creation;
- billing linkage;
- API enablement;
- Firestore creation;
- Cloud Build and Cloud Run deployment;
- public HTTP 200;
- budget creation.

Not yet confirmed:

- Cloud Tasks queue or real scheduled task;
- authenticated callback;
- Firestore persistence from the callback;
- idempotent retry behavior;
- live OpenAI provider access.

Therefore this evidence proves the public infrastructure walking skeleton, not
the complete Phase 3 exit gate.
