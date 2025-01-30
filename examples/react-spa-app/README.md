# React single page app on Cloud Run + Cloud Storage

## Introduction

This blueprint contains a simple React single page application created with [`create-react-app`](https://create-react-app.dev/)
and necessary Terraform resources to deploy it in on Google Cloud. The blueprint also contains a very simple Python backend
that returns `Hello World`.

This example incorporates several HTTP security features like:
- Hashes script files for `Content-Security-Policy`
- Cross domain control for backend (when using DNS; see configuration for DNS below)
- Backend ingress settings
- Minimally permissioned service accounts
- [Cloud Armor policy](cloud-armor.tf) (though permissive)
- Support for Identity-Aware Proxy (when using DNS; see below)

## Prerequisites

You will need an existing [project](https://cloud.google.com/resource-manager/docs/creating-managing-projects) with [billing enabled](https://cloud.google.com/billing/docs/how-to/modify-project) and a user with the “Project owner” [IAM](https://cloud.google.com/iam) role on that project. __Note__: to grant a user a role, take a look at the [Granting and Revoking Access](https://cloud.google.com/iam/docs/granting-changing-revoking-access#grant-single-role) documentation.

## Spinning up the architecture

### General steps

1. Clone the repo to your local machine or Cloud Shell:

```bash
git clone https://github.com/GoogleCloudPlatform/cloud-foundation-fabric
```

2. Change to the directory of the blueprint:

```bash
cd cloud-foundation-fabric/blueprints/serverless/cloud-run-react-spa
```

You should see this README and some terraform files.

3. To deploy a specific use case, you will need to create a file in this directory called `terraform.tfvars` and follow the corresponding instructions to set variables. Values that are meant to be substituted will be shown inside brackets but you need to omit these brackets. E.g.:

```tfvars
project_id = "[your-project_id]"
region = "[region-to-deploy-in]"
```

may become

```tfvars
project_id = "my-project-id"
region = "europe-west4"
```

Although each use case is somehow built around the previous one they are self-contained so you can deploy any of them at will.

4. Now, you should build the React application:

```sh
# cd my-app
# npm install
# npm run build
# cd..
```

5. The usual terraform commands will do the work:

```bash
terraform init
terraform plan
terraform apply
```

It will take a few minutes. When complete, you should see an output stating the command completed successfully, a list of the created resources, and some output variables with information to access your services.

__Congratulations!__ You have successfully deployed the use case you chose based on the variables configuration.

### Deploy regional load balancer

You can choose between global and regional load balancer (or use both) by setting `regional_lb` and `global_lb` variables in
your `terraform.tfvars`.

### Create DNS 

If you want to create a DNS config which separates the frontend and backend to separate hosts, you can set the
`dns_config` parameter:

```hcl
dns_config = {
  zone_name     = "react-test-example-com"
  zone_dns_name = "react.test.example.com."
}
```

*Note*: Enabling DNS also turns on TLS certificate provisioning.

### Enable Identity-Aware Proxy

You can also enable Identity-Aware Proxy (works best with regional proxy, due to Cloud Run proxy for the bucket). Please 
note you need DNS configured for this (see above):

```hcl
iap_config = {
  enabled       = true
  support_email = "support@react.test.example.com"
}
```

(if you already have a brand, you can specify the number ID for it in `brand` variable, which you canfetch via `gcloud iap oauth-brands list`).

*Note*: enabling IAP can take quite a while (O(minutes)).

You also need to set `backendUrl` to (for example) `https://backend.react.test.example.com` (or the regional equivalent) 
in [`my-app/App/index.js`](my-app/App/index.js) (and run `cd my-app/ && npm run build && cd ..` afterwards).

*Note:* you can't have both global and load balancers active in this configuration.
<!-- BEGIN TFDOC -->
## Variables

| name                               | description                                                                           |                                                                                                                                                                                                                                                                         type                                                                                                                                                                                                                                                                          | required |                                                                                                                                default                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| [project_id](variables.tf#L91)     | Google Cloud project ID.                                                              |                                                                                                                                                                                                                                                                  <code>string</code>                                                                                                                                                                                                                                                                  |    ✓     |                                                                                                                                                                                                                                                                       |
| [region](variables.tf#L96)         | Region where to deploy the function and resources.                                    |                                                                                                                                                                                                                                                                  <code>string</code>                                                                                                                                                                                                                                                                  |    ✓     |                                                                                                                                                                                                                                                                       |
| [backend](variables.tf#L15)        | Backend settings.                                                                     |                                                                                                                                         <code title="object&#40;&#123;&#10;  function_name   &#61; optional&#40;string, &#34;my-react-app-backend&#34;&#41;&#10;  service_account &#61; optional&#40;string, &#34;my-react-app-backend&#34;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code>                                                                                                                                          |          |                                                                                                                       <code>&#123;&#125;</code>                                                                                                                       |
| [bucket](variables.tf#L24)         | Bucket settings for hosting the SPA.                                                  |                                                                                                      <code title="object&#40;&#123;&#10;  name          &#61; optional&#40;string, &#34;my-react-app&#34;&#41;&#10;  random_suffix &#61; optional&#40;bool, true&#41;&#10;  build_name    &#61; optional&#40;string, &#34;my-react-app-build&#34;&#41; &#35; Build bucket for CF v2&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code>                                                                                                       |          |                                                                                                                       <code>&#123;&#125;</code>                                                                                                                       |
| [dns_config](variables.tf#L34)     | Create a public DNS zone for the load balancer (and optionally subdomain delegation). | <code title="object&#40;&#123;&#10;  zone_name                       &#61; string&#10;  zone_dns_name                   &#61; string &#35; Don&#39;t specify ending dot&#10;  frontend                        &#61; optional&#40;string, &#34;www&#34;&#41;&#10;  backend                         &#61; optional&#40;string, &#34;api&#34;&#41;&#10;  subdomain_delegation_zone_name  &#61; optional&#40;string&#41;&#10;  subdomain_delegation_project_id &#61; optional&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |          |                                                                                                                           <code>null</code>                                                                                                                           |
| [enable_cdn](variables.tf#L47)     | Enable CDN for backend bucket.                                                        |                                                                                                                                                                                                                                                                   <code>bool</code>                                                                                                                                                                                                                                                                   |          |                                                                                                                          <code>false</code>                                                                                                                           |
| [global_lb](variables.tf#L53)      | Deploy a global application load balancer.                                            |                                                                                                                                                                                                                                                                   <code>bool</code>                                                                                                                                                                                                                                                                   |          |                                                                                                                           <code>true</code>                                                                                                                           |
| [iap_config](variables.tf#L60)     | Identity-Aware Proxy configuration                                                    |                                                                                                                      <code title="object&#40;&#123;&#10;  enabled       &#61; optional&#40;bool, false&#41;&#10;  support_email &#61; optional&#40;string&#41;&#10;  brand         &#61; optional&#40;string&#41; &#35; Set this if you already have a brand created&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code>                                                                                                                      |          |                                                                                                                       <code>&#123;&#125;</code>                                                                                                                       |
| [lb_name](variables.tf#L70)        | Application Load Balancer name.                                                       |                                                                                                                                                                                                                                                                  <code>string</code>                                                                                                                                                                                                                                                                  |          |                                                                                                                  <code>&#34;my-react-app&#34;</code>                                                                                                                  |
| [nginx_image](variables.tf#L76)    | Nginx image to use for regional load balancer.                                        |                                                                                                                                                                                                                                                                  <code>string</code>                                                                                                                                                                                                                                                                  |          |                                                                                            <code>&#34;gcr.io&#47;cloud-marketplace&#47;google&#47;nginx1:1.26&#34;</code>                                                                                             |
| [project_create](variables.tf#L82) | Parameters for the creation of a new project.                                         |                                                                                                                                                                                        <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  parent             &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code>                                                                                                                                                                                         |          |                                                                                                                           <code>null</code>                                                                                                                           |
| [regional_lb](variables.tf#L101)   | Deploy a regional application load balancer.                                          |                                                                                                                                                                                                                                                                   <code>bool</code>                                                                                                                                                                                                                                                                   |          |                                                                                                                          <code>false</code>                                                                                                                           |
| [vpc_config](variables.tf#L107)    | Settings for VPC (required when deploying a Regional LB).                             |       <code title="object&#40;&#123;&#10;  network                &#61; string&#10;  network_project        &#61; optional&#40;string&#41;&#10;  subnetwork             &#61; string&#10;  subnet_cidr            &#61; optional&#40;string, &#34;172.20.20.0&#47;24&#34;&#41;&#10;  proxy_only_subnetwork  &#61; string&#10;  proxy_only_subnet_cidr &#61; optional&#40;string, &#34;172.20.30.0&#47;24&#34;&#41;&#10;  create                 &#61; optional&#40;bool, true&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code>        |          | <code title="&#123;&#10;  network               &#61; &#34;my-react-app-vpc&#34;&#10;  subnetwork            &#61; &#34;my-react-app-vpc-subnet&#34;&#10;  proxy_only_subnetwork &#61; &#34;my-react-app-vpc-proxy-subnet&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |

## Outputs

| name                          | description                     | sensitive |
| ----------------------------- | ------------------------------- | :-------: |
| [global_lb](outputs.tf#L15)   | Global load balancer address.   |           |
| [regional_lb](outputs.tf#L20) | Regional load balancer address. |           |
<!-- END TFDOC -->
