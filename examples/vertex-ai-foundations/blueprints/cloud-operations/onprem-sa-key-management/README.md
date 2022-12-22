# Managing on-prem service account keys by uploading public keys

When managing GCP Service Accounts with terraform, it's often a question on **how to avoid Service Account Key in the terraform state?**

This blueprint shows how to manage IAM Service Account Keys by manually generating a key pair and uploading the public part of the key to GCP. It has the following benefits:

 - no [passing keys between users](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys#pass-between-users) or systems
 - no private keys stored in the terraform state (only public part of the key is in the state)
 - let keys [expire automatically](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys#key-expiryhaving)


## Running the blueprint 

Clone this repository or [open it in cloud shell](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fterraform-google-modules%2Fcloud-foundation-fabric&cloudshell_print=cloud-shell-readme.txt&cloudshell_working_dir=blueprints%2Fcloud-operations%2Fonprem-sa-key-management&cloudshell_open_in_editor=cloudshell_open%2Fcloud-foundation-fabric%2Fblueprints%2Fcloud-operations%2Fonprem-sa-key-management%2Fvariables.tf), then go through the following steps to create resources:

Cleaning up blueprint keys
```bash
rm -f /public-keys/data-uploader/
rm -f /public-keys/prisma-security/
```

Generate keys for service accounts
```bash
mkdir keys && cd keys
openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
    -keyout data_uploader_private_key.pem \
    -out ../public-keys/data-uploader/public_key.pem \
    -subj "/CN=unused"
openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
    -keyout prisma_security_private_key.pem \
    -out ../public-keys/prisma-security/public_key.pem \
    -subj "/CN=unused"
```

Deploy service accounts and keys
```bash
cd ..
terraform init
terraform apply -var project_id=$GOOGLE_CLOUD_PROJECT

```

Extract JSON credentials templates from terraform output and put the private part of the keys into templates
```bash
terraform show -json | jq '.values.outputs."sa-credentials".value."data-uploader"."public_key.pem" | fromjson' > data-uploader.json
terraform show -json | jq '.values.outputs."sa-credentials".value."prisma-security"."public_key.pem" | fromjson' > prisma-security.json

contents=$(jq --arg key "$(cat keys/data_uploader_private_key.pem)" '.private_key=$key' data-uploader.json) && echo "$contents" > data-uploader.json
contents=$(jq --arg key "$(cat keys/prisma_security_private_key.pem)" '.private_key=$key' prisma-security.json) && echo "$contents" > prisma-security.json
```

## Testing the blueprint 
Validate that service accounts json credentials are valid
```bash
gcloud auth activate-service-account --key-file prisma-security.json
gcloud auth activate-service-account --key-file data-uploader.json
```

## Cleaning up
```bash
terraform destroy -var project_id=$GOOGLE_CLOUD_PROJECT
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L23) | Project id. | <code>string</code> | ✓ |  |
| [project_create](variables.tf#L17) | Create project instead of using an existing one. | <code>bool</code> |  | <code>false</code> |
| [service_accounts](variables.tf#L28) | List of service accounts. | <code title="list&#40;object&#40;&#123;&#10;  name              &#61; string&#10;  iam_project_roles &#61; list&#40;string&#41;&#10;  public_keys_path  &#61; string&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code title="&#91;&#10;  &#123;&#10;    name &#61; &#34;data-uploader&#34;&#10;    iam_project_roles &#61; &#91;&#10;      &#34;roles&#47;bigquery.dataOwner&#34;,&#10;      &#34;roles&#47;bigquery.jobUser&#34;,&#10;      &#34;roles&#47;storage.objectAdmin&#34;&#10;    &#93;&#10;    public_keys_path &#61; &#34;public-keys&#47;data-uploader&#47;&#34;&#10;  &#125;,&#10;  &#123;&#10;    name &#61; &#34;prisma-security&#34;&#10;    iam_project_roles &#61; &#91;&#10;      &#34;roles&#47;iam.securityReviewer&#34;&#10;    &#93;&#10;    public_keys_path &#61; &#34;public-keys&#47;prisma-security&#47;&#34;&#10;  &#125;,&#10;&#93;">&#91;&#8230;&#93;</code> |
| [services](variables.tf#L56) | Service APIs to enable. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [sa-credentials](outputs.tf#L17) | SA json key templates. |  |

<!-- END TFDOC -->
