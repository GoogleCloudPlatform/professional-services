# Api Gateway
This module allows creating an API with its associated API config and API gateway. It also allows you grant IAM roles on the created resources.

# Examples

## Basic example
```hcl
module "gateway" {
  source                = "./fabric/modules/api-gateway"
  project_id            = "my-project"
  api_id                = "api"
  region                = "europe-west1"
  spec                  = <<EOT
  # The OpenAPI spec contents
  # ...
  EOT
}
# tftest modules=1 resources=4
```

## Basic example + customer service account
```hcl
module "gateway" {
  source                = "./fabric/modules/api-gateway"
  project_id            = "my-project"
  api_id                = "api"
  region                = "europe-west1"
  spec                  = <<EOT
  # The OpenAPI spec contents
  # ...
  EOT
  service_account_email = "sa@my-project.iam.gserviceaccount.com"
  iam = {
    "roles/apigateway.admin" = [ "user:user@example.com" ]
  }
}
# tftest modules=1 resources=7
```

## Basic example + service account creation
```hcl
module "gateway" {
  source                = "./fabric/modules/api-gateway"
  project_id            = "my-project"
  api_id                = "api"
  region                = "europe-west1"
  spec                  = <<EOT
  # The OpenAPI spec contents
  # ...
  EOT
  service_account_create = true
  iam = {
    "roles/apigateway.admin" = [ "user:mirene@google.com" ]
    "roles/apigateway.viewer" = [ "user:mirene@google.com" ]
  }
}
# tftest modules=1 resources=11
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [api_id](variables.tf#L17) | API identifier. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L34) | Project identifier. | <code>string</code> | ✓ |  |
| [region](variables.tf#L39) | Region | <code>string</code> | ✓ |  |
| [spec](variables.tf#L56) | String with the contents of the OpenAPI spec. | <code>string</code> | ✓ |  |
| [iam](variables.tf#L22) | IAM bindings for the API in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>null</code> |
| [labels](variables.tf#L28) | Map of labels. | <code>map&#40;string&#41;</code> |  | <code>null</code> |
| [service_account_create](variables.tf#L44) | Flag indicating whether a service account needs to be created | <code>bool</code> |  | <code>false</code> |
| [service_account_email](variables.tf#L50) | Service account for creating API configs | <code>string</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [api](outputs.tf#L17) | API. |  |
| [api_config](outputs.tf#L28) | API configs. |  |
| [api_config_id](outputs.tf#L39) | The identifiers of the API configs. |  |
| [api_id](outputs.tf#L50) | API identifier. |  |
| [default_hostname](outputs.tf#L61) | The default host names of the API gateway. |  |
| [gateway](outputs.tf#L72) | API gateways. |  |
| [gateway_id](outputs.tf#L83) | The identifiers of the API gateways. |  |
| [service_account](outputs.tf#L94) | Service account resource. |  |
| [service_account_email](outputs.tf#L99) | The service account for creating API configs. |  |
| [service_account_iam_email](outputs.tf#L104) | The service account for creating API configs. |  |

<!-- END TFDOC -->
