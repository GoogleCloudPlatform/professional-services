# Cloud Run Module

Cloud Run management, with support for IAM roles and optional Eventarc trigger creation.

## Examples

### Environment variables

This deploys a Cloud Run service and sets some environment variables.

```hcl
module "cloud_run" {
  source     = "./fabric/modules/cloud-run"
  project_id = "my-project"
  name       = "hello"
  containers = [{
    image   = "us-docker.pkg.dev/cloudrun/container/hello"
    options = {
      command = null
      args    = null
      env     = {
        "VAR1": "VALUE1",
        "VAR2": "VALUE2",
      }
      env_from = null
    }
    ports = null
    resources = null
    volume_mounts = null
  }]
}
# tftest modules=1 resources=1
```

### Environment variables (value read from secret)

```hcl
module "cloud_run" {
  source     = "./fabric/modules/cloud-run"
  project_id = "my-project"
  name       = "hello"
  containers = [{
    image = "us-docker.pkg.dev/cloudrun/container/hello"
    options = {
      command   = null
      args      = null
      env       = null
      env_from  = {
        "CREDENTIALS": {
          name = "credentials"
          key = "1"
        }
      }
    }
    ports = null
    resources = null
    volume_mounts = null
  }]
}
# tftest modules=1 resources=1
```

### Secret mounted as volume

```hcl
module "cloud_run" {
  source     = "./fabric/modules/cloud-run"
  project_id = var.project_id
  name       = "hello"
  region     = var.region
  revision_name = "green"
  containers = [{
    image         = "us-docker.pkg.dev/cloudrun/container/hello"
    options       = null
    ports         = null
    resources     = null
    volume_mounts = {
      "credentials": "/credentials"
    }
  }]
  volumes = [
    {
      name = "credentials"
      secret_name = "credentials"
      items = [{
        key = "1"
        path = "v1.txt"
      }]
    }
  ]
}
# tftest modules=1 resources=1
```

### Traffic split

This deploys a Cloud Run service with traffic split between two revisions.

```hcl
module "cloud_run" {
  source     = "./fabric/modules/cloud-run"
  project_id = "my-project"
  name       = "hello"
  revision_name = "green"
  containers = [{
    image         = "us-docker.pkg.dev/cloudrun/container/hello"
    options       = null
    ports         = null
    resources     = null
    volume_mounts = null
  }]
  traffic = {
    "blue" = 25
    "green" = 75
  }
}
# tftest modules=1 resources=1
```

### Eventarc trigger (Pub/Sub)

This deploys a Cloud Run service that will be triggered when messages are published to Pub/Sub topics.

```hcl
module "cloud_run" {
  source     = "./fabric/modules/cloud-run"
  project_id = "my-project"
  name       = "hello"
  containers = [{
    image         = "us-docker.pkg.dev/cloudrun/container/hello"
    options       = null
    ports         = null
    resources     = null
    volume_mounts = null
  }]
  pubsub_triggers = [
    "topic1",
    "topic2"
  ]
}
# tftest modules=1 resources=3
```

### Eventarc trigger (Audit logs)

This deploys a Cloud Run service that will be triggered when specific log events are written to Google Cloud audit logs.

```hcl
module "cloud_run" {
  source     = "./fabric/modules/cloud-run"
  project_id = "my-project"
  name       = "hello"
  containers = [{
    image         = "us-docker.pkg.dev/cloudrun/container/hello"
    options       = null
    ports         = null
    resources     = null
    volume_mounts = null
  }]
  audit_log_triggers = [
    {
      service_name  = "cloudresourcemanager.googleapis.com"
      method_name   = "SetIamPolicy"
    }
  ]
}
# tftest modules=1 resources=2
```

### Service account management

To use a custom service account managed by the module, set `service_account_create` to `true` and leave `service_account` set to `null` value (default).

```hcl
module "cloud_run" {
  source     = "./fabric/modules/cloud-run"
  project_id = "my-project"
  name       = "hello"
  containers = [{
    image         = "us-docker.pkg.dev/cloudrun/container/hello"
    options       = null
    ports         = null
    resources     = null
    volume_mounts = null
  }]
  service_account_create = true
}
# tftest modules=1 resources=2
```

To use an externally managed service account, pass its email in `service_account` and leave `service_account_create` to `false` (the default).

```hcl
module "cloud_run" {
  source     = "./fabric/modules/cloud-run"
  project_id = "my-project"
  name       = "hello"
  containers = [{
    image         = "us-docker.pkg.dev/cloudrun/container/hello"
    options       = null
    ports         = null
    resources     = null
    volume_mounts = null
  }]
  service_account = "cloud-run@my-project.iam.gserviceaccount.com"
}
# tftest modules=1 resources=1
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [containers](variables.tf#L27) | Containers. | <code title="list&#40;object&#40;&#123;&#10;  image &#61; string&#10;  options &#61; object&#40;&#123;&#10;    command &#61; list&#40;string&#41;&#10;    args    &#61; list&#40;string&#41;&#10;    env     &#61; map&#40;string&#41;&#10;    env_from &#61; map&#40;object&#40;&#123;&#10;      key  &#61; string&#10;      name &#61; string&#10;    &#125;&#41;&#41;&#10;  &#125;&#41;&#10;  resources &#61; object&#40;&#123;&#10;    limits &#61; object&#40;&#123;&#10;      cpu    &#61; string&#10;      memory &#61; string&#10;    &#125;&#41;&#10;    requests &#61; object&#40;&#123;&#10;      cpu    &#61; string&#10;      memory &#61; string&#10;    &#125;&#41;&#10;  &#125;&#41;&#10;  ports &#61; list&#40;object&#40;&#123;&#10;    name           &#61; string&#10;    protocol       &#61; string&#10;    container_port &#61; string&#10;  &#125;&#41;&#41;&#10;  volume_mounts &#61; map&#40;string&#41;&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> | ✓ |  |
| [name](variables.tf#L77) | Name used for cloud run service. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L88) | Project id used for all resources. | <code>string</code> | ✓ |  |
| [audit_log_triggers](variables.tf#L18) | Event arc triggers (Audit log). | <code title="list&#40;object&#40;&#123;&#10;  service_name &#61; string&#10;  method_name  &#61; string&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>null</code> |
| [iam](variables.tf#L59) | IAM bindings for Cloud Run service in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [ingress_settings](variables.tf#L65) | Ingress settings. | <code>string</code> |  | <code>null</code> |
| [labels](variables.tf#L71) | Resource labels. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [prefix](variables.tf#L82) | Optional prefix used for resource names. | <code>string</code> |  | <code>null</code> |
| [pubsub_triggers](variables.tf#L93) | Eventarc triggers (Pub/Sub). | <code>list&#40;string&#41;</code> |  | <code>null</code> |
| [region](variables.tf#L99) | Region used for all resources. | <code>string</code> |  | <code>&#34;europe-west1&#34;</code> |
| [revision_annotations](variables.tf#L105) | Configure revision template annotations. | <code title="object&#40;&#123;&#10;  autoscaling &#61; object&#40;&#123;&#10;    max_scale &#61; number&#10;    min_scale &#61; number&#10;  &#125;&#41;&#10;  cloudsql_instances  &#61; list&#40;string&#41;&#10;  vpcaccess_connector &#61; string&#10;  vpcaccess_egress    &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [revision_name](variables.tf#L119) | Revision name. | <code>string</code> |  | <code>null</code> |
| [service_account](variables.tf#L125) | Service account email. Unused if service account is auto-created. | <code>string</code> |  | <code>null</code> |
| [service_account_create](variables.tf#L131) | Auto-create service account. | <code>bool</code> |  | <code>false</code> |
| [traffic](variables.tf#L137) | Traffic. | <code>map&#40;number&#41;</code> |  | <code>null</code> |
| [volumes](variables.tf#L143) | Volumes. | <code title="list&#40;object&#40;&#123;&#10;  name        &#61; string&#10;  secret_name &#61; string&#10;  items &#61; list&#40;object&#40;&#123;&#10;    key  &#61; string&#10;    path &#61; string&#10;  &#125;&#41;&#41;&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>null</code> |
| [vpc_connector_create](variables.tf#L156) | Populate this to create a VPC connector. You can then refer to it in the template annotations. | <code title="object&#40;&#123;&#10;  ip_cidr_range &#61; string&#10;  name          &#61; string&#10;  vpc_self_link &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [service](outputs.tf#L18) | Cloud Run service. |  |
| [service_account](outputs.tf#L23) | Service account resource. |  |
| [service_account_email](outputs.tf#L28) | Service account email. |  |
| [service_account_iam_email](outputs.tf#L33) | Service account email. |  |
| [service_name](outputs.tf#L41) | Cloud Run service name. |  |
| [vpc_connector](outputs.tf#L47) | VPC connector resource if created. |  |

<!-- END TFDOC -->
