# Dataflow Flex Template: De-identify CSVs in GCS (DLP) → BigQuery

A runnable Flex Template that takes CSVs in Cloud Storage, calls DLP to de-identify sensitive fields, and writes sanitized rows to BigQuery.

> **Prerequisites**
> - Google Cloud project with billing enabled
> - You can run commands either in **Cloud Shell** or locally with the **gcloud** CLI
> - A DLP **De-identification Template** (`projects/<P>/locations/<L>/deidentifyTemplates/<ID>`)

---

## Parameters

| Name | Required | Default | Description |
|------|:--------:|---------|-------------|
| `file_pattern` | ✅ | — | GCS glob to input CSVs |
| `dataset` | ✅ | — | BigQuery dataset (table is created if needed) |
| `deidentify_template_name` | ✅ | — | `projects/<P>/locations/<L>/deidentifyTemplates/<ID>` |
| `csv_headers` **or** `headers_gcs_uri` | ⚙️ | — | Provide headers inline (comma-separated) **or** via a `gs://` file (first line is header) |
| `batch_size` | ⚙️ | 500 | CSV lines per DLP call |
| `dlp_api_retry_count` | ⚙️ | 3 | Retries per batch |
| `skip_header_lines` | ⚙️ | 1 | Header lines to skip in `ReadFromText` |
| `output_table` | ⚙️ | `output_<templateId>` | Output table name within `dataset` |

> **CSV & headers:** The CSV **must** have the same column order/count as the header names you supply. The DLP `table` item uses those names when returning de-identified rows.

---

## Quickstart (Cloud Shell or local with gcloud)

### Variables
```bash
# Run from: examples/dataflow-dlp-flex-deid/
export PROJECT_ID="<YOUR_PROJECT_ID>"
export REGION="us-central1"
export DATASET="sensitive_data"
export STAGING_BUCKET_NAME="${PROJECT_ID}-dataflow-assets"
export AR_REPO_NAME="dataflow-images"
export IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO_NAME}/dlp-csv-deid:latest"
export TEMPLATE_SPEC="gs://${STAGING_BUCKET_NAME}/templates/dlp-csv-deid.json"
export DEID_TEMPLATE_NAME="projects/${PROJECT_ID}/locations/global/deidentifyTemplates/<TEMPLATE_ID>"
export SERVICE_ACCOUNT_NAME="dlp-flex-template-runner"
export SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
```

### One-time resources
```bash
# Run from: examples/dataflow-dlp-flex-deid/
gcloud config set project "$PROJECT_ID"
gcloud services enable \
  dataflow.googleapis.com dlp.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com bigquery.googleapis.com compute.googleapis.com

gcloud storage buckets create "gs://${STAGING_BUCKET_NAME}" \
  --location="$REGION" --uniform-bucket-level-access || true

bq --location="$REGION" mk --dataset "${PROJECT_ID}:${DATASET}" || true

gcloud artifacts repositories create "${AR_REPO_NAME}" \
  --repository-format=docker --location="${REGION}" || true

gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
  --display-name="DLP Flex Template Runner" || true

for ROLE in roles/dataflow.worker roles/storage.objectAdmin \
           roles/bigquery.jobUser roles/bigquery.dataEditor \
           roles/artifactregistry.reader roles/dlp.user
do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="$ROLE" --condition=None
done
```

### Build and push the template
```bash
# Run from: examples/dataflow-dlp-flex-deid/
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_IMAGE_TAG="${IMAGE_TAG}" \
  --project="${PROJECT_ID}" .
```

### Build the Flex Template spec
```bash
# Run from: examples/dataflow-dlp-flex-deid/
gcloud dataflow flex-template build "${TEMPLATE_SPEC}" \
  --image "${IMAGE_TAG}" \
  --sdk-language "PYTHON" \
  --metadata-file "metadata.json" \
  --project "${PROJECT_ID}"
```

### Run the job
```bash
# Run from: anywhere
JOB_NAME="dlp-deid-csv-$(date +%Y%m%d-%H%M%S)"

# Option A — inline headers:
CSV_HEADERS="name,email,phone"

gcloud dataflow flex-template run "${JOB_NAME}" \
  --template-file-gcs-location "${TEMPLATE_SPEC}" \
  --region "${REGION}" \
  --service-account-email "${SERVICE_ACCOUNT_EMAIL}" \
  --staging-location "gs://${STAGING_BUCKET_NAME}/staging" \
  --temp-location "gs://${STAGING_BUCKET_NAME}/temp" \
  --parameters file_pattern="gs://<INPUT_BUCKET>/<PATH>/*.csv" \
  --parameters dataset="${DATASET}" \
  --parameters deidentify_template_name="${DEID_TEMPLATE_NAME}" \
  --parameters csv_headers="${CSV_HEADERS}" \
  --parameters output_table="output_example"

# Option B — headers file in GCS (first line is the header row):
HEADERS_GCS_URI="gs://<INPUT_BUCKET>/headers.txt"

gcloud dataflow flex-template run "${JOB_NAME}" \
  --template-file-gcs-location "${TEMPLATE_SPEC}" \
  --region "${REGION}" \
  --service-account-email "${SERVICE_ACCOUNT_EMAIL}" \
  --staging-location "gs://${STAGING_BUCKET_NAME}/staging" \
  --temp-location "gs://${STAGING_BUCKET_NAME}/temp" \
  --parameters file_pattern="gs://<INPUT_BUCKET>/<PATH>/*.csv" \
  --parameters dataset="${DATASET}" \
  --parameters deidentify_template_name="${DEID_TEMPLATE_NAME}" \
  --parameters headers_gcs_uri="${HEADERS_GCS_URI}" \
  --parameters output_table="output_example"
```

> **Output table name:** Defaults to `output_<templateId>` (derived from the last segment of `deidentify_template_name`) unless you set `output_table`.

---

**Optional Private IPs:** add `--network`, `--subnetwork`, and `--disable-public-ips` to the run command and ensure Private Google Access (or Cloud NAT) so workers can reach Google APIs.

---

## Troubleshooting

- **Header mismatch** → ensure headers match CSV columns and your DLP template.
- **Permission denied** → verify runner service account roles listed in “One-time resources”.
- **Template not found** → check `deidentify_template_name` and its location (`global` or regional).

---