# Google Apigee Organization Module

This module allows managing a single Apigee organization and its environments and environmentgroups.

## Examples

### Apigee X Evaluation Organization

```hcl
module "apigee-organization" {
  source     = "./fabric/modules/apigee-organization"
  project_id = "my-project"
  analytics_region = "us-central1"
  runtime_type = "CLOUD"
  authorized_network = "my-vpc"
  apigee_environments = {
    eval1 = {
      api_proxy_type  = "PROGRAMMABLE"
      deployment_type = "PROXY"
    }
    eval2 = {
      api_proxy_type  = "CONFIGURABLE"
      deployment_type = "ARCHIVE"
    }
  }
  apigee_envgroups = {
    eval = {
      environments = [
        "eval1",
        "eval2"
      ]
      hostnames    = [
        "eval.api.example.com"
      ]
    }
  }
}
# tftest modules=1 resources=6
```

### Apigee X Paid Organization

```hcl
module "apigee-organization" {
  source     = "./fabric/modules/apigee-organization"
  project_id = "my-project"
  analytics_region = "us-central1"
  runtime_type = "CLOUD"
  authorized_network = "my-vpc"
  database_encryption_key = "my-data-key"
  apigee_environments = {
    dev1 = {
      api_proxy_type  = "PROGRAMMABLE"
      deployment_type = "PROXY"
    }
    dev2 = {
      api_proxy_type  = "CONFIGURABLE"
      deployment_type = "ARCHIVE"
    }
    test1 = {}
    test2 = {}
  } 
  apigee_envgroups = {
    dev = {
      environments = [
        "dev1",
        "dev2"
      ]
      hostnames    = [
        "dev.api.example.com"
      ]
    }
    test = {
      environments = [
        "test1",
        "test2"
      ]
      hostnames    = [
        "test.api.example.com"
      ]
    }
  }
}
# tftest modules=1 resources=11
```

### Apigee hybrid Organization

```hcl
module "apigee-organization" {
  source     = "./fabric/modules/apigee-organization"
  project_id = "my-project"
  analytics_region = "us-central1"
  runtime_type = "HYBRID"
  apigee_environments = {
    eval1 = {
      api_proxy_type  = "PROGRAMMABLE"
      deployment_type = "PROXY"
    }
    eval2 = {}
  }
  apigee_envgroups = {
    eval = {
      environments = [
        "eval1",
        "eval2"
      ]
      hostnames    = [
        "eval.api.example.com"
      ]
    }
  }
}
# tftest modules=1 resources=6
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [analytics_region](variables.tf#L17) | Analytics Region for the Apigee Organization (immutable). See https://cloud.google.com/apigee/docs/api-platform/get-started/install-cli. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L72) | Project ID to host this Apigee organization (will also become the Apigee Org name). | <code>string</code> | ✓ |  |
| [runtime_type](variables.tf#L77) | Apigee runtime type. Must be `CLOUD` or `HYBRID`. | <code>string</code> | ✓ |  |
| [apigee_envgroups](variables.tf#L22) | Apigee Environment Groups. | <code title="map&#40;object&#40;&#123;&#10;  environments &#61; list&#40;string&#41;&#10;  hostnames    &#61; list&#40;string&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [apigee_environments](variables.tf#L31) | Apigee Environment Names. | <code title="map&#40;object&#40;&#123;&#10;  api_proxy_type  &#61; optional&#40;string, &#34;API_PROXY_TYPE_UNSPECIFIED&#34;&#41;&#10;  deployment_type &#61; optional&#40;string, &#34;DEPLOYMENT_TYPE_UNSPECIFIED&#34;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [authorized_network](variables.tf#L48) | VPC network self link (requires service network peering enabled (Used in Apigee X only). | <code>string</code> |  | <code>null</code> |
| [billing_type](variables.tf#L86) | Billing type of the Apigee organization. | <code>string</code> |  | <code>null</code> |
| [database_encryption_key](variables.tf#L54) | Cloud KMS key self link (e.g. `projects/foo/locations/us/keyRings/bar/cryptoKeys/baz`) used for encrypting the data that is stored and replicated across runtime instances (immutable, used in Apigee X only). | <code>string</code> |  | <code>null</code> |
| [description](variables.tf#L60) | Description of the Apigee Organization. | <code>string</code> |  | <code>&#34;Apigee Organization created by tf module&#34;</code> |
| [display_name](variables.tf#L66) | Display Name of the Apigee Organization. | <code>string</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [envs](outputs.tf#L17) | Apigee Environments. |  |
| [org](outputs.tf#L22) | Apigee Organization. |  |
| [org_ca_certificate](outputs.tf#L27) | Apigee organization CA certificate. |  |
| [org_id](outputs.tf#L32) | Apigee Organization ID. |  |
| [subscription_type](outputs.tf#L37) | Apigee subscription type. |  |

<!-- END TFDOC -->
