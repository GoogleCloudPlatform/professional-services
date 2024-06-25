# Binauthz Attestation Cloud Build Step

A custom build step for signing and uploading Binary Authorization Attestations.

## Background

Binary Authorization (Binauthz) is a Cloud product that enforces deploy-time
constraints on applications. Its GKE integration allows users to enforce that
containers deployed to a Kubernetes cluster are cryptographically attested by a
trusted authority.

NOTE: This build step assumes some familiarity with Binary Authorization,
including how to set up an Binary Authorization enforcement policy with an
Attestor on a GKE cluster.

To learn more:

-   [A general introduction to Binary Authorization](https://cloud.google.com/binary-authorization/)
-   [An introductory codelab](https://codelabs.developers.google.com/codelabs/cloud-binauthz-intro/index.html#0)

## Auth

To use this build step, the Cloud Build service account needs the following IAM
roles:

-   Binary Authorization Attestor Viewer
    -   `roles/binaryauthorization.attestorsViewer`
-   Cloud KMS CryptoKey Decrypter (if providing KMS-encrypted PGP key through
    secret environment variable)
    -   `roles/cloudkms.cryptoKeyDecrypter`
-   Cloud KMS CryptoKey Signer/Verifier (if using key in KMS to sign
    attestation)
    -   `roles/cloudkms.signerVerifier`
-   Container Analysis Notes Attacher
    -   `roles/containeranalysis.notes.attacher`

The following commands can be used to add the roles to your project's Cloud
Build Service Account:

```bash
# Replace PROJECT_ID with the Google Cloud Project ID
PROJECT="PROJECT_ID"

# Set the project in gcloud
gcloud config set project $PROJECT

# Get the project number
PROJECT_NUMBER=$(gcloud projects list --filter="$PROJECT" --format="value(PROJECT_NUMBER)")

# Add Binary Authorization Attestor Viewer role to Cloud Build Service Account
gcloud projects add-iam-policy-binding $PROJECT \
  --member serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role roles/binaryauthorization.attestorsViewer

# Add Cloud KMS CryptoKey Decrypter role to Cloud Build Service Account (PGP-based Signing)
gcloud projects add-iam-policy-binding $PROJECT \
  --member serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role roles/cloudkms.cryptoKeyDecrypter

# Add Cloud KMS CryptoKey Signer/Verifier role to Cloud Build Service Account (KMS-based Signing)
gcloud projects add-iam-policy-binding $PROJECT \
  --member serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role roles/cloudkms.signerVerifier

# Add Container Analysis Notes Attacher role to Cloud Build Service Account
gcloud projects add-iam-policy-binding $PROJECT \
  --member serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role roles/containeranalysis.notes.attacher
```

## Usage

### KMS Key-based Signing (Recommended)

1.  Create a key ring and a key for asymmetric signing using
    [these instructions](https://cloud.google.com/kms/docs/creating-asymmetric-keys)
2.  Use `gcloud alpha container binauthz attestors public-keys add` to add the
    asymmetric signing key to the Attestor
    ([docs](https://cloud.google.com/sdk/gcloud/reference/alpha/container/binauthz/attestors/public-keys/add)).
3.  Add this step to your `cloudbuild.yaml` file after the step where your
    container is uploaded to GCR, replacing ATTESTOR_NAME, KEY_LOCATION,
    KEYRING_NAME, KEY_NAME, and KEY_VERSION with your own values:

    ```yaml
    - id: 'attest'
      name: 'gcr.io/$PROJECT_ID/binauthz-attestation:latest'
      args:
        - '--artifact-url'
        - 'gcr.io/$PROJECT_ID/helloworld:latest'
        - '--attestor'
        - 'projects/$PROJECT_ID/attestors/ATTESTOR_NAME'
        - '--keyversion'
        - 'projects/$PROJECT_ID/locations/KEY_LOCATION/keyRings/KEYRING_NAME/cryptoKeys/KEY_NAME/cryptoKeyVersions/KEY_VERSION'
    ```

    The following is also valid:

    ```yaml
    - id: 'attest'
      name: 'gcr.io/$PROJECT_ID/binauthz-attestation:latest'
      args:
        - '--artifact-url'
        - 'gcr.io/$PROJECT_ID/helloworld:latest'
        - '--attestor'
        - 'ATTESTOR_NAME'
        - '--attestor-project'
        - '$PROJECT_ID'
        - '--keyversion'
        - 'KEY_VERSION'
        - '--keyversion-project'
        - '$PROJECT_ID'
        - '--keyversion-location'
        - 'KEY_LOCATION'
        - '--keyversion-keyring'
        - 'KEYRING_NAME'
        - '--keyversion-key'
        - 'KEY_NAME'
    ```

### PGP Key-based Signing

1.  [Create a KMS encryption key](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials#creating_a_cloud_kms_keyring_and_cryptokey).
2.  [Encrypt the ASCII-armored PGP private key that will be used to sign the
    attestation](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials#encrypting_an_environment_variable_using_the_cryptokey).
3.  OPTIONAL: If the PGP private key has a passphrase, the same instructions can
    be used to encrypt the passphrase.
4.  Place the following at the bottom of the `cloudbuild.yaml` file:

    ```yaml
    secrets:
    - kmsKeyName: projects/$PROJECT_ID/locations/KEY_LOCATION/keyRings/KEYRING_NAME/cryptoKeys/KEY_NAME
      secretEnv:
        PGP_SECRET_KEY: "<result from step 2>"
        PGP_SECRET_KEY_PASSPHRASE: "<result from step 3>" # Optional
    ```

5.  Add this step to your `cloudbuild.yaml` file after the step where your
    container is uploaded to GCR, replacing ATTESTOR_NAME, PGP_KEY_FINGERPRINT,
    PGP_SECRET_KEY, and PGP_SECRET_KEY_PASSPHRASE with your own values:

    ```yaml
    - id: create_attestation
      name: 'gcr.io/$PROJECT_ID/binauthz-attestation'
      args:
        - '--artifact-url'
        - 'gcr.io/$PROJECT_ID/helloworld:latest'
        - '--attestor'
        - 'projects/$PROJECT_ID/attestors/ATTESTOR_NAME'
        - '--pgp-key-fingerprint'
        - 'PGP_KEY_FINGERPRINT'
      secretEnvs:
        - "PGP_SECRET_KEY"
        - "PGP_SECRET_KEY_PASSPHRASE" # Optional
    ```

    The following is also valid:

    ```yaml
    - id: create_attestation
      name: 'gcr.io/$PROJECT_ID/binauthz-attestation'
      args:
        - '--artifact-url'
        - 'gcr.io/$PROJECT_ID/helloworld:latest'
        - '--attestor'
        - 'ATTESTOR_NAME'
        - '--attestor-project'
        - '$PROJECT_ID'
        - '--pgp-key-fingerprint'
        - 'PGP_KEY_FINGERPRINT'
      secretEnvs:
        - "PGP_SECRET_KEY"
        - "PGP_SECRET_KEY_PASSPHRASE" # Optional
    ```

## How to build this step for use in your project

To build this build step, run the following command while in this directory.
This will build the build step container and push it to your current project's
Google Container Repository.

```bash
gcloud builds submit . --config cloudbuild.yaml
```
