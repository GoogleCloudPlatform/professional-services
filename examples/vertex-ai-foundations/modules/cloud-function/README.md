# Cloud Function Module

Cloud Function management, with support for IAM roles and optional bucket creation.

The GCS object used for deployment uses a hash of the bundle zip contents in its name, which ensures change tracking and avoids recreating the function if the GCS object is deleted and needs recreating.

## TODO

- [ ] add support for `source_repository`

## Examples

### HTTP trigger

This deploys a Cloud Function with an HTTP endpoint, using a pre-existing GCS bucket for deployment, setting the service account to the Cloud Function default one, and delegating access control to the containing project.

```hcl
module "cf-http" {
  source        = "./fabric/modules/cloud-function"
  project_id    = "my-project"
  name          = "test-cf-http"
  bucket_name   = "test-cf-bundles"
  bundle_config = {
    source_dir  = "my-cf-source-folder"
    output_path = "bundle.zip"
    excludes    = null
  }
}
# tftest skip
```

### PubSub and non-HTTP triggers

Other trigger types other than HTTP are configured via the `trigger_config` variable. This example shows a PubSub trigger.

```hcl
module "cf-http" {
  source        = "./fabric/modules/cloud-function"
  project_id    = "my-project"
  name          = "test-cf-http"
  bucket_name   = "test-cf-bundles"
  bundle_config = {
    source_dir  = "my-cf-source-folder"
    output_path = "bundle.zip"
    excludes    = null
  }
  trigger_config = {
    event = "google.pubsub.topic.publish"
    resource = local.my-topic
    retry = null
  }
}
# tftest skip
```

### Controlling HTTP access

To allow anonymous access to the function, grant the `roles/cloudfunctions.invoker` role to the special `allUsers` identifier. Use specific identities (service accounts, groups, etc.) instead of `allUsers` to only allow selective access.

```hcl
module "cf-http" {
  source        = "./fabric/modules/cloud-function"
  project_id    = "my-project"
  name          = "test-cf-http"
  bucket_name   = "test-cf-bundles"
  bundle_config = {
    source_dir  = "my-cf-source-folder"
    output_path = "bundle.zip"
    excludes    = null
  }
  iam   = {
    "roles/cloudfunctions.invoker" = ["allUsers"]
  }
}
# tftest skip
```

### GCS bucket creation

You can have the module auto-create the GCS bucket used for deployment via the `bucket_config` variable. Setting `bucket_config.location` to `null` will also use the function region for GCS.

```hcl
module "cf-http" {
  source        = "./fabric/modules/cloud-function"
  project_id    = "my-project"
  name          = "test-cf-http"
  bucket_name   = "test-cf-bundles"
  bucket_config = {
    location             = null
    lifecycle_delete_age = 1
  }
  bundle_config = {
    source_dir  = "my-cf-source-folder"
    output_path = "bundle.zip"
    excludes    = null
  }
}
# tftest skip
```

### Service account management

To use a custom service account managed by the module, set `service_account_create` to `true` and leave `service_account` set to `null` value (default).

```hcl
module "cf-http" {
  source        = "./fabric/modules/cloud-function"
  project_id    = "my-project"
  name          = "test-cf-http"
  bucket_name   = "test-cf-bundles"
  bundle_config = {
    source_dir  = "my-cf-source-folder"
    output_path = "bundle.zip"
    excludes    = null
  }
  service_account_create = true
}
# tftest skip
```

To use an externally managed service account, pass its email in `service_account` and leave `service_account_create` to `false` (the default).

```hcl
module "cf-http" {
  source        = "./fabric/modules/cloud-function"
  project_id    = "my-project"
  name          = "test-cf-http"
  bucket_name   = "test-cf-bundles"
  bundle_config = {
    source_dir  = "my-cf-source-folder"
    output_path = "bundle.zip"
    excludes    = null
  }
  service_account = local.service_account_email
}
# tftest skip
```

### Custom bundle config

In order to help prevent `archive_zip.output_md5` from changing cross platform (e.g. Cloud Build vs your local development environment), you'll have to make sure that the files included in the zip are always the same.

```hcl
module "cf-http" {
  source        = "./fabric/modules/cloud-function"
  project_id    = "my-project"
  name          = "test-cf-http"
  bucket_name   = "test-cf-bundles"
  bundle_config = {
    source_dir  = "my-cf-source-folder"
    output_path = "bundle.zip"
    excludes    = ["__pycache__"]
  }
}
# tftest skip
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [bucket_name](variables.tf#L26) | Name of the bucket that will be used for the function code. It will be created with prefix prepended if bucket_config is not null. | <code>string</code> | ✓ |  |
| [bundle_config](variables.tf#L31) | Cloud function source folder and generated zip bundle paths. Output path defaults to '/tmp/bundle.zip' if null. | <code title="object&#40;&#123;&#10;  source_dir  &#61; string&#10;  output_path &#61; string&#10;  excludes    &#61; list&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [name](variables.tf#L88) | Name used for cloud function and associated resources. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L99) | Project id used for all resources. | <code>string</code> | ✓ |  |
| [bucket_config](variables.tf#L17) | Enable and configure auto-created bucket. Set fields to null to use defaults. | <code title="object&#40;&#123;&#10;  location             &#61; string&#10;  lifecycle_delete_age &#61; number&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [description](variables.tf#L40) | Optional description. | <code>string</code> |  | <code>&#34;Terraform managed.&#34;</code> |
| [environment_variables](variables.tf#L46) | Cloud function environment variables. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [function_config](variables.tf#L52) | Cloud function configuration. | <code title="object&#40;&#123;&#10;  entry_point &#61; string&#10;  instances   &#61; number&#10;  memory      &#61; number &#35; Memory in MB&#10;  runtime     &#61; string&#10;  timeout     &#61; number&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  entry_point &#61; &#34;main&#34;&#10;  instances   &#61; 1&#10;  memory      &#61; 256&#10;  runtime     &#61; &#34;python37&#34;&#10;  timeout     &#61; 180&#10;&#125;">&#123;&#8230;&#125;</code> |
| [iam](variables.tf#L70) | IAM bindings for topic in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [ingress_settings](variables.tf#L76) | Control traffic that reaches the cloud function. Allowed values are ALLOW_ALL, ALLOW_INTERNAL_AND_GCLB and ALLOW_INTERNAL_ONLY . | <code>string</code> |  | <code>null</code> |
| [labels](variables.tf#L82) | Resource labels. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [prefix](variables.tf#L93) | Optional prefix used for resource names. | <code>string</code> |  | <code>null</code> |
| [region](variables.tf#L104) | Region used for all resources. | <code>string</code> |  | <code>&#34;europe-west1&#34;</code> |
| [secrets](variables.tf#L110) | Secret Manager secrets. Key is the variable name or mountpoint, volume versions are in version:path format. | <code title="map&#40;object&#40;&#123;&#10;  is_volume  &#61; bool&#10;  project_id &#61; number&#10;  secret     &#61; string&#10;  versions   &#61; list&#40;string&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [service_account](variables.tf#L122) | Service account email. Unused if service account is auto-created. | <code>string</code> |  | <code>null</code> |
| [service_account_create](variables.tf#L128) | Auto-create service account. | <code>bool</code> |  | <code>false</code> |
| [trigger_config](variables.tf#L134) | Function trigger configuration. Leave null for HTTP trigger. | <code title="object&#40;&#123;&#10;  event    &#61; string&#10;  resource &#61; string&#10;  retry    &#61; bool&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [v2](variables.tf#L163) | Whether to use Cloud Function version 2nd Gen or 1st Gen. | <code>bool</code> |  | <code>false</code> |
| [vpc_connector](variables.tf#L144) | VPC connector configuration. Set create to 'true' if a new connector needs to be created. | <code title="object&#40;&#123;&#10;  create          &#61; bool&#10;  name            &#61; string&#10;  egress_settings &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [vpc_connector_config](variables.tf#L154) | VPC connector network configuration. Must be provided if new VPC connector is being created. | <code title="object&#40;&#123;&#10;  ip_cidr_range &#61; string&#10;  network       &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [bucket](outputs.tf#L17) | Bucket resource (only if auto-created). |  |
| [bucket_name](outputs.tf#L24) | Bucket name. |  |
| [function](outputs.tf#L29) | Cloud function resources. |  |
| [function_name](outputs.tf#L34) | Cloud function name. |  |
| [service_account](outputs.tf#L42) | Service account resource. |  |
| [service_account_email](outputs.tf#L47) | Service account email. |  |
| [service_account_iam_email](outputs.tf#L52) | Service account email. |  |
| [uri](outputs.tf#L38) | Cloud function service uri. |  |
| [vpc_connector](outputs.tf#L60) | VPC connector resource if created. |  |

<!-- END TFDOC -->
