# Google KMS Module

This module allows creating and managing KMS crypto keys and IAM bindings at both the keyring and crypto key level. An existing keyring can be used, or a new one can be created and managed by the module if needed.

When using an existing keyring be mindful about applying IAM bindings, as all bindings used by this module are authoritative, and you might inadvertently override bindings managed by the keyring creator.

## Protecting against destroy

In this module **no lifecycle blocks are set on resources to prevent destroy**, in order to allow for experimentation and testing where rapid `apply`/`destroy` cycles are needed. If you plan on using this module to manage non-development resources, **clone it and uncomment the lifecycle blocks** found in `main.tf`.

## Examples

### Using an existing keyring

```hcl
module "kms" {
  source         = "./fabric/modules/kms"
  project_id     = "my-project"
  iam    = {
    "roles/cloudkms.admin" = ["user:user1@example.com"]
  }
  keyring        = { location = "europe-west1", name = "test" }
  keyring_create = false
  keys           = { key-a = null, key-b = null, key-c = null }
}
# tftest skip
```

### Keyring creation and crypto key rotation and IAM roles

```hcl
module "kms" {
  source     = "./fabric/modules/kms"
  project_id = "my-project"
  iam_additive = {
    "roles/cloudkms.cryptoKeyEncrypterDecrypter" = [
      "user:user1@example.com", "user:user2@example.com"
    ]
  }
  key_iam = {
    key-a = {
      "roles/cloudkms.admin" = ["user:user3@example.com"]
    }
  }
  key_iam_additive = {
    key-b = {
      "roles/cloudkms.cryptoKeyEncrypterDecrypter" = [
        "user:user4@example.com", "user:user5@example.com"
      ]
    }
  }
  keyring = { location = "europe-west1", name = "test" }
  keys = {
    key-a = null
    key-b = { rotation_period = "604800s", labels = null }
    key-c = { rotation_period = null, labels = { env = "test" } }
  }
}
# tftest modules=1 resources=9
```

### Crypto key purpose

```hcl
module "kms" {
  source      = "./fabric/modules/kms"
  project_id  = "my-project"
  key_purpose = {
    key-c = {
      purpose = "ASYMMETRIC_SIGN"
      version_template = {
        algorithm        = "EC_SIGN_P384_SHA384"
        protection_level = null
      }
    }
  }
  keyring     = { location = "europe-west1", name = "test" }
  keys        = { key-a = null, key-b = null, key-c = null }
}
# tftest modules=1 resources=4
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [keyring](variables.tf#L70) | Keyring attributes. | <code title="object&#40;&#123;&#10;  location &#61; string&#10;  name     &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [project_id](variables.tf#L93) | Project id where the keyring will be created. | <code>string</code> | ✓ |  |
| [iam](variables.tf#L17) | Keyring IAM bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_additive](variables.tf#L23) | Keyring IAM additive bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [key_iam](variables.tf#L29) | Key IAM bindings in {KEY => {ROLE => [MEMBERS]}} format. | <code>map&#40;map&#40;list&#40;string&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [key_iam_additive](variables.tf#L35) | Key IAM additive bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;map&#40;list&#40;string&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [key_purpose](variables.tf#L41) | Per-key purpose, if not set defaults will be used. If purpose is not `ENCRYPT_DECRYPT` (the default), `version_template.algorithm` is required. | <code title="map&#40;object&#40;&#123;&#10;  purpose &#61; string&#10;  version_template &#61; object&#40;&#123;&#10;    algorithm        &#61; string&#10;    protection_level &#61; string&#10;  &#125;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [key_purpose_defaults](variables.tf#L53) | Defaults used for key purpose when not defined at the key level. If purpose is not `ENCRYPT_DECRYPT` (the default), `version_template.algorithm` is required. | <code title="object&#40;&#123;&#10;  purpose &#61; string&#10;  version_template &#61; object&#40;&#123;&#10;    algorithm        &#61; string&#10;    protection_level &#61; string&#10;  &#125;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  purpose          &#61; null&#10;  version_template &#61; null&#10;&#125;">&#123;&#8230;&#125;</code> |
| [keyring_create](variables.tf#L78) | Set to false to manage keys and IAM bindings in an existing keyring. | <code>bool</code> |  | <code>true</code> |
| [keys](variables.tf#L84) | Key names and base attributes. Set attributes to null if not needed. | <code title="map&#40;object&#40;&#123;&#10;  rotation_period &#61; string&#10;  labels          &#61; map&#40;string&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [tag_bindings](variables.tf#L98) | Tag bindings for this keyring, in key => tag value id format. | <code>map&#40;string&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [id](outputs.tf#L17) | Keyring self link. |  |
| [key_ids](outputs.tf#L25) | Key self links. |  |
| [keyring](outputs.tf#L36) | Keyring resource. |  |
| [keys](outputs.tf#L44) | Key resources. |  |
| [location](outputs.tf#L52) | Keyring location. |  |
| [name](outputs.tf#L60) | Keyring name. |  |

<!-- END TFDOC -->
