# Github cli/cli

This builder contains the [Github CLI](https://cli.github.com/) tool that allows to control more Github features
from the CLI (e.g. issue/pr comments, closing and reopening issues, etc.).

## Generating Github Personal Access Token

If you want to generate a Personal Access Token, make sure it has:
- `repo` scope to access your private repos
- `read:org` scope to access PRs within the organization

![personal access token scopes](docs/token_rights.png)

## Usage with Secret Manager

**Create the secret on GCP**

Follow the [Official Guide](https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets) to create a new secret
that holds your generated github token as a value.

**Use the Secret**

Ensure you have the following IAM role added on your `[PROJECT_ID]@cloudbuild.gserviceaccount.com` service account:
- roles/secretmanager.secretAccessor

```yaml
steps:
- name: gcr.io/cloud-builders/gcloud
  entrypoint: 'bash'
  args: [ '-c', "gcloud secrets versions access latest --secret=<secret-name> --format='get(payload.data)' | tr '_-' '/+' | base64 -d > token.txt" ]
- name: 'gcr.io/$PROJECT_ID/github'
  args: ['repo', 'view', 'GoogleCloudPlatform/cloud-builders-community']
```

The builder automatically looks for a file named `token.txt` which needs to hold the previously stored github token.

## Usage with Cloud KMS

**Create the secret on GCP**

This step will encrypt the token via KMS. Remember to replace `GENERATED_TOKEN` in the text

```bash
#### create a keyring for cloudbuilder-related keys
gcloud kms keyrings create cloudbuilder --location global

#### create a key for the github token
gcloud kms keys create github-token --location global --keyring cloudbuilder --purpose encryption

#### create the encrypted token
echo -n $TOKEN | gcloud kms encrypt \
  --plaintext-file=- \
  --ciphertext-file=- \
  --location=global \
  --keyring=cloudbuilder \
  --key=github-token | base64
```

**Use the encrypted key**

The encrypted key (output from previous command) can now simply be used within the cloudbuilder configuration file like so:

> Note that you need to specify `[PROJECT_ID]` directly instead of using `$PROJECT_ID` within secrets

```yaml
steps:
- name: 'gcr.io/$PROJECT_ID/github'
  args: ['repo', 'view', 'GoogleCloudPlatform/cloud-builders-community']
secrets:
- kmsKeyName: 'projects/[PROJECT_ID]/locations/global/keyRings/cloudbuilder/cryptoKeys/github-token'
  secretEnv:
    GITHUB_TOKEN: '<YOUR_ENCRYPTED_TOKEN>'
```
