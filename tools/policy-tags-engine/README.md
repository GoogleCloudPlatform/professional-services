# Automated BigQuery Policy Tagging via GCS

This project provides a serverless solution for automatically applying BigQuery column-level security (Policy Tags) based on metadata files uploaded to a Google Cloud Storage (GCS) bucket.

It is designed to integrate into a data governance workflow where an external system (like Informatica or another metadata catalog) generates a JSON file describing the security classifications of columns. This function consumes that file and enforces the policy in Google Cloud.


## Deployment Guide

### Phase 1: Deploy the Cloud Function

Now, deploy the Python application code.

1.  **Navigate to the Function Directory:**
    ```bash
    cd path/to/ups-cloud-function-main
    ```

2.  **Create and Configure `dev.vars`:**
    Create a file named `dev.vars`. **This file must be in valid YAML format.**
    -   To get your Policy Tag resource names, go to **Data Catalog > Policy Tags** in the GCP console, click on a tag, and use the "Copy resource name" button.

    **Example `dev.vars`:**
    ```yaml
    # This file MUST be in valid YAML format.

    POLICY_TAG_TAXONOMY: |
      {
        "personalInformation": {
          "confidential": "projects/your-gcp-project-id/locations/us-central1/taxonomies/TAXONOMY_ID/policyTags/PI_CONFIDENTIAL_ID",
          "highlyConfidential": "projects/your-gcp-project-id/locations/us-central1/taxonomies/TAXONOMY_ID/policyTags/PI_HIGHLY_CONFIDENTIAL_ID"
        },
        "nonPersonalInformation": {
          "confidential": "projects/your-gcp-project-id/locations/us-central1/taxonomies/TAXONOMY_ID/policyTags/NPI_CONFIDENTIAL_ID",
          "highlyConfidential": "projects/your-gcp-project-id/locations/us-central1/taxonomies/TAXONOMY_ID/policyTags/NPI_HIGHLY_CONFIDENTIAL_ID"
        }
      }
    DATE_LIMIT_ENABLED: "False"
    DATE_LIMIT_DAYS: "1"
    FILE_PREFIX: "taxonomy_example"
    BUCKET_NAME: "gcs-metadata"
    SUCCESS_PATH: "success"
    FAILURE_PATH: "failure"
    ```

3.  **Deploy with `gcloud`:**
    Run the following command and replace the placeholder values with your own.

    ```bash
    gcloud functions deploy policy-tagger-function \
      --gen2 \
      --project="your-gcp-project-id" \
      --region="your-region" \
      --runtime="python311" \
      --source="." \
      --entry-point="main" \
      --trigger-bucket="dev-informatica-metadata" \
      --trigger-location="your-region" \
      --service-account="cloud-function-service@your-gcp-project-id.iam.gserviceaccount.com" \
      --env-vars-file="dev.vars"
    ```
    Deployment will take several minutes.

---

1.  **Prepare a Target Table:**
    In BigQuery, create a test dataset and table (e.g., `my_dataset.customers`) with columns that match your test file (e.g., `id` and `email`).

2.  **Create a Test JSON File:**
    Create a local file named `taxonomy_example.json`. Ensure the project, dataset, and table names match your target.

    **`taxonomy_example.json`:**
    ```json
    {
      "resources": [{
        "resourceName": "test_customers",
        "projects": [{
          "projectName": "your-gcp-project-id",
          "datasets": [{
            "datasetName": "my_dataset",
            "tables": [{
              "tableName": "customers",
              "columns": [
                { "columnName": "id", "PII": false, "securityClassification": "Confidential" },
                { "columnName": "email", "PII": true, "securityClassification": "Highly Confidential" }
              ]
            }]
          }]
        }]
      }]
    }
    ```

3.  **Trigger the Function:**
    Upload the test file to the GCS bucket created by Terraform (`dev-informatica-metadata`).

    ```bash
    gsutil cp taxonomy_example.json gs://dev-informatica-metadata/
    ```

4.  **Verify the Results:**
    -   **Cloud Function Logs:** Check the logs for `policy-tagger-function` in the GCP Console to see processing details.
    -   **GCS Bucket:** Verify the test file has been moved to the `success/` folder.
    -   **BigQuery Schema:** **This is the final proof.** Navigate to your `customers` table in the BigQuery UI. The `email` column should now have a Policy Tag applied. If you run the process again, the tag will not be changed.

---

## Configuration Reference

### Environment Variables (`dev.vars`)

| Variable              | Description                                                                                             | Example                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `POLICY_TAG_TAXONOMY` | A JSON string mapping classifications to full Policy Tag resource names.                                | `{"personalInformation": {"confidential": "projects/.../policyTags/..."}}`                              |
| `DATE_LIMIT_ENABLED`  | `True` or `False`. If `True`, only process records where `last_modified` is recent.                     | `"False"`                                                                                               |
| `DATE_LIMIT_DAYS`     | If `DATE_LIMIT_ENABLED` is `True`, sets the number of days to look back for recent records.               | `"1"`                                                                                                   |
| `FILE_PREFIX`         | The required prefix for input files. Files without this prefix will be moved to the failure path.         | `"INFORMATICA_TAXONOMY"`                                                                                |
| `BUCKET_NAME`         | The name of the GCS bucket that triggers the function.                                                  | `"dev-informatica-metadata"`                                                                            |
| `SUCCESS_PATH`        | The folder within the bucket to move successfully processed files to.                                   | `"success"`                                                                                             |
| `FAILURE_PATH`        | The folder within the bucket to move failed files to.                                                   | `"failure"`                                                                                             |

### Input JSON Format

The function expects a JSON file with the following structure:

-   `projectName`, `datasetName`, `tableName`: Specify the BigQuery target.
-   `columnName`: The name of the column to tag.
-   `PII`: A boolean (`true`/`false`) indicating if the data is Personally Identifiable Information.
-   `securityClassification`: The security level, typically `Confidential` or `Highly Confidential`.
-   `last_modified` (Optional): An ISO 8601 timestamp (e.g., `2023-10-27T10:00:00Z`) used when `DATE_LIMIT_ENABLED` is true.

## Unittest

Execute the test using `python3 -m unittest discover`