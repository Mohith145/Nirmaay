# Deploy Nirmaay as one Vercel Services project with Firebase

The repository root `vercel.json` groups the Next.js frontend and FastAPI backend into
one Vercel Services project. Vercel builds them independently and serves the frontend
at `/` and the API through the same domain under `/api`. Firebase provides Auth,
Firestore, and Storage; PostgreSQL remains the backend's relational database.

## Services

- Vercel Services hosts the Next.js frontend and FastAPI API in one project/deployment.
- Firebase Authentication handles web sign-in; the API verifies Firebase ID tokens.
- PostgreSQL remains the primary relational database because the existing API uses
  SQLAlchemy. Use a durable Postgres provider from Vercel Marketplace and set its
  `DATABASE_URL` for the backend service.
- Firestore receives committed application-record mirrors through a SQL outbox.
- Firebase Storage stores retained screening photos privately. Photos are not written
  to Firestore documents or public URLs.

Firestore mirroring is asynchronous and does not replace the relational source of truth.
Existing SQL rows are not automatically backfilled by a new deployment; do not delete
the existing database until an explicit migration and record-count reconciliation is done.

## 1. Create the Vercel project

Import `Mohith145/Nirmaay` from the repository root. Set the project's framework to
**Services** in Vercel's Build and Deployment settings; do not set a service-specific
Root Directory on the project. The root `vercel.json` defines `frontend` (`FRONTEND`)
and `backend` (`Backend`) services. The frontend is public at `/`; `/api` and `/api/*`
are routed to FastAPI, whose middleware removes that prefix before matching its existing
routes. No service binding is needed: the browser calls the backend through this public
same-origin `/api` route, and the backend does not call another Vercel service.

The `NIRMAY` directory contains model training scripts and PyTorch checkpoints, not an
HTTP app, so it is kept in the repository but is not configured as a third runtime
service. The backend's ONNX inference artifact must be available at
`Backend/app/services/vision/model.onnx` with matching `model_metadata.json` for image
classification to run. Model training checkpoints are not automatically converted or
included in the backend deployment.

Attach a durable PostgreSQL database through Vercel Marketplace. Scope the following
environment variables to the **backend** service in Production and Preview as appropriate:

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

Deploy and open `https://<project-domain>/api/health`. It should return a JSON status.

Scope the following public web configuration variables to the **frontend** service:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web App config value |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Web App config value |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `nirmaay-9e3b0` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `nirmaay-9e3b0.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Web App config value |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web App config value |
| `NEXT_PUBLIC_JAAS_APP_ID` | Existing JaaS App ID, if video calls are enabled |

For the single-project setup, leave `NEXT_PUBLIC_API_BASE_URL` unset so the browser
uses `/api` on the shared Vercel domain. Set it only when intentionally using a separate
backend origin. Redeploy after changing frontend variables; Next.js values are embedded
at build time.

Firebase web config is public client configuration. Do not add service-account JSON or
private keys to any `NEXT_PUBLIC_*` variable.

## 2. Confirm access and data behavior

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
