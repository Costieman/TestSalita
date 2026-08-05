#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project)}"
REGION="${REGION:-asia-southeast1}"
SERVICE_NAME="${SERVICE_NAME:-salita-quest-social-share}"
BUCKET_NAME="${SHARE_BUCKET:-${PROJECT_ID}-salita-share-cards}"
SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-salita-share-service}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
APP_URL="${PUBLIC_APP_URL:-https://costieman.github.io/SalitaQuest/}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://costieman.github.io}"

if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  echo "No Google Cloud project is active." >&2
  exit 1
fi

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
BUILD_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
DETERMINISTIC_URL="https://${SERVICE_NAME}-${PROJECT_NUMBER}.${REGION}.run.app"

echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo "Bucket: ${BUCKET_NAME}"

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  --project="${PROJECT_ID}"

# Source deployments use the project's default compute service account to read
# the uploaded source archive and build the container. Newer projects often need
# this role granted explicitly.
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/run.builder" \
  --condition=None \
  --quiet >/dev/null

if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
    --display-name="Salita Quest social share service" \
    --project="${PROJECT_ID}"
fi

if ! gcloud storage buckets describe "gs://${BUCKET_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --uniform-bucket-level-access
fi

LIFECYCLE_FILE="$(mktemp)"
cat >"${LIFECYCLE_FILE}" <<'JSON'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 365}
    }
  ]
}
JSON

gcloud storage buckets update "gs://${BUCKET_NAME}" \
  --lifecycle-file="${LIFECYCLE_FILE}" \
  --project="${PROJECT_ID}"
rm -f "${LIFECYCLE_FILE}"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectAdmin" \
  --project="${PROJECT_ID}" >/dev/null

gcloud run deploy "${SERVICE_NAME}" \
  --source="services/social-share" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --service-account="${SERVICE_ACCOUNT}" \
  --allow-unauthenticated \
  --default-url \
  --ingress=all \
  --set-env-vars="SHARE_BUCKET=${BUCKET_NAME},PUBLIC_APP_URL=${APP_URL},ALLOWED_ORIGINS=${ALLOWED_ORIGINS},MAX_UPLOADS_PER_HOUR=30" \
  --memory="512Mi" \
  --cpu="1" \
  --min-instances="0" \
  --max-instances="3"

DESCRIBED_URL="$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)')"
SERVICE_URL=""

# Cloud Run can report both a deterministic URL and a hashed legacy URL. Verify
# the endpoint instead of assuming every reported hostname is routed correctly.
for candidate in "${DESCRIBED_URL}" "${DETERMINISTIC_URL}"; do
  [[ -n "${candidate}" ]] || continue
  if curl --fail --silent --show-error --max-time 30 "${candidate}/health" >/tmp/salita-share-health.json 2>/dev/null; then
    SERVICE_URL="${candidate}"
    break
  fi
done

if [[ -z "${SERVICE_URL}" ]]; then
  echo "Deployment completed, but neither Cloud Run URL passed the health check." >&2
  echo "Try: curl --fail ${DESCRIBED_URL}/health" >&2
  exit 1
fi

echo
echo "Hosted sharing service deployed:"
echo "${SERVICE_URL}"
echo
echo "Health check:"
cat /tmp/salita-share-health.json
rm -f /tmp/salita-share-health.json

echo
echo "Running end-to-end public-card verification..."
SALITA_APP_ORIGIN="https://costieman.github.io" \
  node services/social-share/verify-deployment.mjs "${SERVICE_URL}"

echo
echo "Hosted achievement sharing is ready."
echo "The built-in Salita Quest client should use:"
echo "${SERVICE_URL}"
