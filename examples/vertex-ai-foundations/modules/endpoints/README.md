# Google Cloud Endpoints

This module allows simple management of ['Google Cloud Endpoints'](https://cloud.google.com/endpoints/) services. It supports creating ['OpenAPI'](https://cloud.google.com/endpoints/docs/openapi) or ['gRPC'](https://cloud.google.com/endpoints/docs/grpc/about-grpc) endpoints.

## Examples

### OpenAPI

```hcl
module "endpoint" {
  source         = "./fabric/modules/endpoints"
  project_id     = "my-project"
  service_name   = "YOUR-API.endpoints.YOUR-PROJECT-ID.cloud.goog"
  openapi_config = { "yaml_path" = "openapi.yaml" }
  iam = {
    "servicemanagement.serviceController" = [
      "serviceAccount:123456890-compute@developer.gserviceaccount.com"
    ]
  }
}
# tftest skip
```

[Here](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/endpoints/getting-started/openapi.yaml) you can find an example of an openapi.yaml file. Once created the endpoint, remember to activate the service at project level.
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [openapi_config](variables.tf#L32) | The configuration for an OpenAPI endopoint. Either this or grpc_config must be specified. | <code title="object&#40;&#123;&#10;  yaml_path &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [service_name](variables.tf#L45) | The name of the service. Usually of the form '$apiname.endpoints.$projectid.cloud.goog'. | <code>string</code> | ✓ |  |
| [grpc_config](variables.tf#L17) | The configuration for a gRPC enpoint. Either this or openapi_config must be specified. | <code title="object&#40;&#123;&#10;  yaml_path          &#61; string&#10;  protoc_output_path &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [iam](variables.tf#L26) | IAM bindings for topic in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [project_id](variables.tf#L39) | The project ID that the service belongs to. | <code>string</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [endpoints](outputs.tf#L17) | A list of Endpoint objects. |  |
| [endpoints_service](outputs.tf#L22) | The Endpoint service resource. |  |
| [service_name](outputs.tf#L27) | The name of the service.. |  |

<!-- END TFDOC -->
