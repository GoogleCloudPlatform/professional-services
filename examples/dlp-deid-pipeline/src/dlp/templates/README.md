# DLP Templates

[Templates](https://cloud.google.com/sensitive-data-protection/docs/concepts-templates) are reusable configurations that tell DLP how to inspect, de-identify, or re-identify your data.
This solution considers the following as sensitive data and provides the expected outcome:

| PII Info Type    | Original          | De-identified      |
|-----------------|-------------------|-------------------|
| Customer ID     | A935492          | A678512          |
| Email Address   | email@example.net | 9jRsv@example.net |
| Credit Card Number | 3524882434259679 | 1839406548854298 |
| SSN             | 298-34-4337      | 515-57-9132      |
| Date            | 1979-10-29      | 1982-08-24      |

In this solution, the templates are created using [Cloud Functions](https://cloud.google.com/functions/1stgendocs/concepts/overview).

## Setup and Deploy the Templates
- Set Project ID and Region
  ```
  PROJECT_ID=<project_id>
  REGION=<region>
  PROJECT_NUMBER=<project_number>
  ```
- Enable required APIs 
  ```
  gcloud services enable \
    cloudfunctions.googleapis.com \
    secretmanager.googleapis.com \
    dlp.googleapis.com \
    cloudkms.googleapis.com
  ```
- Ensure the service account has the required permissions (since a 1st Gen function is used, the default service account is the App Engine service account)
  ```
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --role="roles/dlp.user" \
    --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
  ```
- Create a KMS key ring
  ```
  gcloud kms keyrings create "dlp-keyring" \
    --location "global"
  ```
- Create a key
  ```
  gcloud kms keys create "dlp-key" \
    --location "global" \
    --keyring "dlp-keyring" \
    --purpose "encryption"
  ```
- Create a 256-bit AES key using openssl:
  ```
  openssl rand -out "./aes_key.bin" 32
  ```
- Encode the key as base64 string and wrap key using Cloud KMS key
  ```
  curl "https://cloudkms.googleapis.com/v1/projects/datastream-rm/locations/global/keyRings/dlp-keyring/cryptoKeys/dlp-key:encrypt" \
    --request "POST" \
    --header "Authorization:Bearer $(gcloud auth application-default print-access-token)" \
    --header "content-type: application/json" \
    --data "{\"plaintext\": \"$(base64 -i ./aes_key.bin)"}"
  ```
- Store wrapped key in secret manager
  ```
  echo -n "<ciphertext from previous result>" | gcloud secrets create dlp-wrapped-key \
    --replication-policy="automatic" \
    --data-file=-
  ```
- Set the key name and the wrapped key
  ```
  KMS_KEY_NAME=projects/$PROJECT/locations/global/keyRings/dlp-keyring/cryptoKeys/dlp-key
  SECRET_NAME=projects/$PROJECT_NUMBER/secrets/tdm-dlp-wrapped-key

  ```
- Deploy the function to create an inspect template
  ```
  gcloud functions deploy create-inspect-template \
    --runtime python311 \
    --trigger-http \
    --source src/dlp/templates/inspect \
    --entry-point main \
    --region $REGION 
  ```
- Deploy the function to create a de-identify template
  ```
  gcloud functions deploy create-deidentify-template \
    --runtime python311 \
    --trigger-http \
    --source src/dlp/templates/deidentify \
    --entry-point main \
    --region $REGION
  ```
- Create inspect template
  ```
  gcloud functions call create-inspect-template \
    --data '{"project": "{$PROJECT_ID}"}'
  ```
- Create deidentify template
  ```
  gcloud functions call create-deidentify-template \
    --data '{"project": "{$PROJECT_ID}", "kms_key_name: "{$KMS_KEY_NAME}", "secret_name": "{$SECRET_NAME}}'
  ```

## Templates
If you followed the steps correctly, you should now have two DLP templates in your project. These templates names should look like below:
```
projects/<project_id>/locations/global/inspectTemplates/inspect_template
projects/<project_id>/locations/global/inspectTemplates/deidentify_template
```