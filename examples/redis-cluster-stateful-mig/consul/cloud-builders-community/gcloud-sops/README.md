# [SOPS](https://github.com/mozilla/sops)

## Using this builder with Google Container Engine

To use this builder, your
[builder service account](https://cloud.google.com/cloud-build/docs/how-to/service-account-permissions)
will need IAM permissions to use the GCloud KMS service. For example setting the permission "Cloud KMS CryptoKey Decrypter" will allow cloud build to decrypt encrypted files. Check the
[GKE IAM page](https://cloud.google.com/container-engine/docs/iam-integration)
for details.

For more information on how to use SOPS with GCP look at [Mozilla Sops - using GCP KMS](https://github.com/mozilla/sops#encrypting-using-gcp-kms)

## Applying the build

The default entrypoint will run sops. To decrypt a single file you can have a configuration that looks like the following:

```yaml
- id: decrypt
  name: gcr.io/$PROJECT_ID/gcloud-sops
  args:
  - --output
  - decrypted.file
  - -d
  - path/to/encrypted.file
- name: gcr.io/cloud-builders/go
  entrypoint: sh
  args:
  - -c
  - cat decrypted.file
  waitFor:
  - decrypt
```

To apply the build yourself, you can use a custom entrypoint, e.g.

```yaml
- id: deploy
  name: gcr.io/$PROJECT_ID/gcloud-sops
  entrypoint: bash
  args:
  - -c
  - |
    sops -d encrypted.file > decrypted.file
    cat decrypted.file
```

## Building this builder

To build this builder, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml
