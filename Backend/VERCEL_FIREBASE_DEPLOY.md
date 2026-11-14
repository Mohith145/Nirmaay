# Deploy Nirmaay with Vercel and Firebase

This repository is a monorepo with a Next.js frontend and a FastAPI API. Deploy them as
two Vercel projects so each has the correct runtime and environment variables.

## Services

- Vercel hosts the Next.js frontend and the FastAPI serverless API.
- Firebase Authentication handles web sign-in; the API verifies Firebase ID tokens.
- PostgreSQL remains the primary relational database because the existing API uses
  SQLAlchemy. Use a durable Postgres provider from Vercel Marketplace and set its
  `DATABASE_URL` in the backend project.
- Firestore receives committed application-record mirrors through a SQL outbox.
- Firebase Storage stores retained screening photos privately. Photos are not written
  to Firestore documents or public URLs.

Firestore mirroring is asynchronous and does not replace the relational source of truth.
Existing SQL rows are not automatically backfilled by a new deployment; do not delete
the existing database until an explicit migration and record-count reconciliation is done.

## 1. Deploy the backend API

In Vercel, create a project from `Mohith145/Nirmaay` and set **Root Directory** to
`Backend` (leave “Include files outside the root directory” enabled only if a future
backend import actually needs them). The Python entrypoint is `app/main.py`; the project
includes `vercel.json` and `.python-version` for Vercel's Python runtime in Mumbai.

Attach a durable PostgreSQL database through Vercel Marketplace. Configure these backend
environment variables for Production and Preview as appropriate:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL from the provider (or expose the Vercel integration's `POSTGRES_URL` under this name) |
| `JWT_SECRET` | Long, random secret (keep private) |
| `CORS_ORIGINS` | Exact public frontend origin, e.g. `https://nirmaay.vercel.app` |
| `FIREBASE_PROJECT_ID` | `nirmaay-9e3b0` |
| `FIREBASE_CREDENTIALS_JSON` | Entire Firebase Admin service-account JSON, stored as a Vercel secret |
| `FIREBASE_STORAGE_BUCKET` | `nirmaay-9e3b0.firebasestorage.app` |

Create the service account in Firebase Console → Project settings → Service accounts.
Add its JSON only in Vercel's encrypted environment-variable UI; never commit it, put
it in a frontend variable, or paste it into chat. The account needs Firebase Auth,
Firestore, and Storage access. Ensure Firestore and the Storage bucket are enabled.

Deploy the restrictive Firestore and Storage client rules from the repository root with
the Firebase CLI (`firebase deploy --only firestore:rules,storage`). The app's backend
uses the Admin SDK, which bypasses these client rules.

Deploy and open `https://<backend-domain>/health`. It should return a JSON status.

## 2. Configure the frontend project

Use the existing Next.js Vercel project and set its **Root Directory** to `FRONTEND`.
Set the following public web configuration in its Vercel environment variables:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend deployment origin, e.g. `https://nirmaay-api.vercel.app` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web App config value |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Web App config value |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `nirmaay-9e3b0` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `nirmaay-9e3b0.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Web App config value |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web App config value |
| `NEXT_PUBLIC_JAAS_APP_ID` | Existing JaaS App ID, if video calls are enabled |

Firebase web config is public client configuration. Do not add service-account JSON or
private keys to any `NEXT_PUBLIC_*` variable. Redeploy the frontend after changing env
variables; Next.js values are embedded at build time.

## 3. Confirm access and data behavior

- Add the frontend's production and preview origins to backend `CORS_ORIGINS` exactly.
- Visit the public homepage, register a patient, sign in, and confirm `/me` succeeds.
- Confirm clinician/admin registration remains restricted to authorized staff.
- Check Vercel function logs for database, Firebase Auth, Firestore, or Storage errors.
- Firestore client security rules should deny direct unauthenticated access; backend
  Firestore writes use the Admin SDK and bypass client rules.
- The existing relational records still live in PostgreSQL. If the current app has
  records in SQLite, migrate and reconcile them before switching production traffic.
- After migrating the existing relational database into PostgreSQL, set the same
  `DATABASE_URL` and Firebase Admin variables locally, then run
  `cd Backend && python -m scripts.backfill_firestore` once to copy current rows into
  Firestore. Reconcile counts before considering that backfill complete.

## Runtime limitations

Vercel Functions are stateless and have a 4.5 MB request-body limit. This backend caps
photo payloads at 4 MB, stores retained photos in Firebase Storage, and rejects Vercel
configuration that uses ephemeral SQLite. Large ONNX/OpenCV dependencies may exceed
Vercel's function bundle limit; check the deployment build log. If that happens, the
vision endpoint must be separated into a supported inference service or the model
dependencies must be made optional for the Vercel API build.
