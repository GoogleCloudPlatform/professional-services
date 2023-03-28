<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_gitlab"></a> [gitlab](#requirement\_gitlab) | >= 3.18.0 |
| <a name="requirement_helm"></a> [helm](#requirement\_helm) | >= 2.7.1 |
| <a name="requirement_kubernetes"></a> [kubernetes](#requirement\_kubernetes) | >= 2.15.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_gitlab"></a> [gitlab](#provider\_gitlab) | 15.8.0 |
| <a name="provider_google"></a> [google](#provider\_google) | 4.52.0 |
| <a name="provider_helm"></a> [helm](#provider\_helm) | 2.8.0 |
| <a name="provider_kubernetes"></a> [kubernetes](#provider\_kubernetes) | 2.17.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [gitlab_cluster_agent.this](https://registry.terraform.io/providers/gitlabhq/gitlab/latest/docs/resources/cluster_agent) | resource |
| [gitlab_cluster_agent_token.this](https://registry.terraform.io/providers/gitlabhq/gitlab/latest/docs/resources/cluster_agent_token) | resource |
| [gitlab_repository_file.agent_config](https://registry.terraform.io/providers/gitlabhq/gitlab/latest/docs/resources/repository_file) | resource |
| [helm_release.gitlab_agent](https://registry.terraform.io/providers/hashicorp/helm/latest/docs/resources/release) | resource |
| [kubernetes_cluster_role_binding_v1.gitlab-kubernetes-agent-write-cm](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/cluster_role_binding_v1) | resource |
| [kubernetes_cluster_role_v1.gitlab-kubernetes-agent-write-cm](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/cluster_role_v1) | resource |
| [kubernetes_namespace.product](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/namespace) | resource |
| [kubernetes_namespace_v1.gitlab](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/namespace_v1) | resource |
| [kubernetes_role_binding_v1.gitlab_agent-read](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_binding_v1) | resource |
| [kubernetes_role_binding_v1.gitlab_agent-read-product_namespace](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_binding_v1) | resource |
| [kubernetes_role_binding_v1.gitlab_agent-read_cm](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_binding_v1) | resource |
| [kubernetes_role_binding_v1.gitlab_agent-write](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_binding_v1) | resource |
| [kubernetes_role_binding_v1.gitlab_agent-write-product_namespace](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_binding_v1) | resource |
| [kubernetes_role_binding_v1.gitlab_agent-write_cm](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_binding_v1) | resource |
| [kubernetes_role_v1.gitlab_agent-read](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_v1) | resource |
| [kubernetes_role_v1.gitlab_agent-read-product_namespace](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_v1) | resource |
| [kubernetes_role_v1.gitlab_agent-read_cm](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_v1) | resource |
| [kubernetes_role_v1.gitlab_agent-write](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_v1) | resource |
| [kubernetes_role_v1.gitlab_agent-write-product_namespace](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_v1) | resource |
| [kubernetes_role_v1.gitlab_agent-write_cm](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/role_v1) | resource |
| [kubernetes_service_account_v1.gitlab](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/service_account_v1) | resource |
| [google_client_config.default](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/client_config) | data source |
| [google_container_cluster.my_cluster](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/container_cluster) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_agentk_image_tag"></a> [agentk\_image\_tag](#input\_agentk\_image\_tag) | Tag of agentk image | `string` | `"v15.9.0-rc1"` | no |
| <a name="input_agentk_image_url"></a> [agentk\_image\_url](#input\_agentk\_image\_url) | Image URL of Gitlab agentk image hosted in a container registry | `string` | `"registry.gitlab.com/gitlab-org/cluster-integration/gitlab-agent/agentk"` | no |
| <a name="input_cluster_location"></a> [cluster\_location](#input\_cluster\_location) | The location (zone or region) this cluster has been created in. One of location, region, zone, or a provider-level zone must be specified. | `string` | n/a | yes |
| <a name="input_cluster_name"></a> [cluster\_name](#input\_cluster\_name) | The name of the cluster | `string` | n/a | yes |
| <a name="input_config_author_email"></a> [config\_author\_email](#input\_config\_author\_email) | Author email to use for commits in gitlab repo | `string` | `""` | no |
| <a name="input_config_author_name"></a> [config\_author\_name](#input\_config\_author\_name) | Author name to use for commits in gitlab repo | `string` | `""` | no |
| <a name="input_gitlab_agent"></a> [gitlab\_agent](#input\_gitlab\_agent) | Name of gitlab KAS agent | `string` | `"gitlab-kas"` | no |
| <a name="input_gitlab_agent_chart_name"></a> [gitlab\_agent\_chart\_name](#input\_gitlab\_agent\_chart\_name) | Name of gitlab agent chat in repository | `string` | `"gitlab-agent"` | no |
| <a name="input_gitlab_agent_chart_repo"></a> [gitlab\_agent\_chart\_repo](#input\_gitlab\_agent\_chart\_repo) | Repository for gitlab Helm chart | `string` | `"https://charts.gitlab.io"` | no |
| <a name="input_gitlab_repo_name"></a> [gitlab\_repo\_name](#input\_gitlab\_repo\_name) | Name of repository in Gitlab | `string` | n/a | yes |
| <a name="input_kas_address"></a> [kas\_address](#input\_kas\_address) | Address of Gitlab Agent server for KAS clients | `string` | `"wss://kas.gitlab.com"` | no |
| <a name="input_product_name"></a> [product\_name](#input\_product\_name) | Name of project/product by which to distinguish k8s resources | `string` | n/a | yes |
| <a name="input_project_id"></a> [project\_id](#input\_project\_id) | Default GCP project where all of your resources will be created in | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_cluster_name"></a> [cluster\_name](#output\_cluster\_name) | Cluster where resources are created. (Data) |
| <a name="output_gitlab_cluster_agent"></a> [gitlab\_cluster\_agent](#output\_gitlab\_cluster\_agent) | Gitlab cluster agent details. |
| <a name="output_gitlab_cluster_agent_token"></a> [gitlab\_cluster\_agent\_token](#output\_gitlab\_cluster\_agent\_token) | Gitlab cluster agent token (sensitive) |
| <a name="output_gitlab_repository_file"></a> [gitlab\_repository\_file](#output\_gitlab\_repository\_file) | Gitlab repository file details |
| <a name="output_kubernetes_namespace_gitlab"></a> [kubernetes\_namespace\_gitlab](#output\_kubernetes\_namespace\_gitlab) | Namepace where gitlab agent is deployed |
| <a name="output_kubernetes_namespace_product"></a> [kubernetes\_namespace\_product](#output\_kubernetes\_namespace\_product) | Namespace where product containers are deployed |
| <a name="output_kubernetes_service_account_gitlab"></a> [kubernetes\_service\_account\_gitlab](#output\_kubernetes\_service\_account\_gitlab) | Service account that updates product pods on behalf of KAS agent |
<!-- END_TF_DOCS -->