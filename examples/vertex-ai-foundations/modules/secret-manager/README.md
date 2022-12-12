# Google Secret Manager Module

Simple Secret Manager module that allows managing one or more secrets, their versions, and IAM bindings.

Secret Manager locations are available via the `gcloud secrets locations list` command.

**Warning:** managing versions will persist their data (the actual secret you want to protect) in the Terraform state in unencrypted form, accessible to any identity able to read or pull the state file.

## Examples

### Secrets

The secret replication policy is automatically managed if no location is set, or manually managed if a list of locations is passed to the secret.

```hcl
module "secret-manager" {
  source     = "./fabric/modules/secret-manager"
  project_id = "my-project"
  secrets    = {
    test-auto   = null
    test-manual = ["europe-west1", "europe-west4"]
  }
}
# tftest modules=1 resources=2
```

### Secret IAM bindings

IAM bindings can be set per secret in the same way as for most other modules supporting IAM, using the `iam` variable.

```hcl
module "secret-manager" {
  source     = "./fabric/modules/secret-manager"
  project_id = "my-project"
  secrets    = {
    test-auto   = null
    test-manual = ["europe-west1", "europe-west4"]
  }
  iam = {
    test-auto   = {
      "roles/secretmanager.secretAccessor" = ["group:auto-readers@example.com"]
    }
    test-manual = {
      "roles/secretmanager.secretAccessor" = ["group:manual-readers@example.com"]
    }
  }
}
# tftest modules=1 resources=4
```

### Secret versions

As mentioned above, please be aware that **version data will be stored in state in unencrypted form**.

```hcl
module "secret-manager" {
  source     = "./fabric/modules/secret-manager"
  project_id = "my-project"
  secrets    = {
    test-auto   = null
    test-manual = ["europe-west1", "europe-west4"]
  }
  versions = {
    test-auto = {
      v1 = { enabled = false, data = "auto foo bar baz" }
      v2 = { enabled = true, data = "auto foo bar spam" }
    },
    test-manual = {
      v1 = { enabled = true, data = "manual foo bar spam" }
    }
  }
}
# tftest modules=1 resources=5
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L29) | Project id where the keyring will be created. | <code>string</code> | ✓ |  |
| [iam](variables.tf#L17) | IAM bindings in {SECRET => {ROLE => [MEMBERS]}} format. | <code>map&#40;map&#40;list&#40;string&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [labels](variables.tf#L23) | Optional labels for each secret. | <code>map&#40;map&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [secrets](variables.tf#L34) | Map of secrets to manage and their locations. If locations is null, automatic management will be set. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [versions](variables.tf#L40) | Optional versions to manage for each secret. Version names are only used internally to track individual versions. | <code title="map&#40;map&#40;object&#40;&#123;&#10;  enabled &#61; bool&#10;  data    &#61; string&#10;&#125;&#41;&#41;&#41;">map&#40;map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [ids](outputs.tf#L17) | Secret ids keyed by secret_ids (names). |  |
| [secrets](outputs.tf#L24) | Secret resources. |  |
| [version_ids](outputs.tf#L29) | Version ids keyed by secret name : version name. |  |
| [versions](outputs.tf#L36) | Secret versions. | ✓ |

<!-- END TFDOC -->
## Requirements

These sections describe requirements for using this module.

### IAM

The following roles must be used to provision the resources of this module:

- Cloud KMS Admin: `roles/cloudkms.admin` or
- Owner: `roles/owner`

### APIs

A project with the following APIs enabled must be used to host the
resources of this module:

- Google Cloud Key Management Service: `cloudkms.googleapis.com`
