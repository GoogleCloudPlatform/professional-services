# Internal HTTP Load Balancer Terraform Example
This example shows how to deploy an internal HTTP load balancer using
plain terraform (i.e. without using any external modules). This
example will create all the required resources needed for a working
internal load balancer except the GCP project.

## Design
In this example we use simple application (an nginx serving a simple
 HTML file) configured using a [startup
 script](https://cloud.google.com/compute/docs/instances/startup-scripts/linux).
 This application is deployed using a [Managed Instance
 Group](https://cloud.google.com/compute/docs/instance-groups) with a
 minimum of two instances.

Besides the computing resources, the code also deploys a VPC, the
required subnets, and all the components elements of a load balancer
(forwarding rule, URL map, health check, etc).

For testing purposes, an additional VM is also created. You can use
this VM to confirm the load balancer is correctly configured.

## Prerequisites
1. You must have a recent version of Terraform installed (0.14+).
1. A working GCP project with the GCE API enabled.

## Deploy
The terraform code defines multiple variables. Most of the variables
provide default values that can be safely used but you must provide
the project id where the resources will be created. Check the
Variables section below for more details.

In the following command, we define the `project_id` variable using
terraform's `-var` option. Make sure to replace `$MYPROJECT` with your
GCP project ID.

```console
$ terraform init
$ terraform apply -var project_id=$MYPROJECT
[Output omitted]
Apply complete! Resources: 13 added, 0 changed, 0 destroyed.

Outputs:

ilb_ip = "10.0.1.5"
```

After the apply completes, terraform will output the IP address of the load
balancer. You can connect to the test instance and use curl to test
the load balancer. You should see an output similar to this:
```console
user@local:~$ gcloud compute ssh --tunnel-through-iap vm-test
Last login: xxxx
user@vm-test:~$ curl 10.0.1.5
<pre>
Name: vm-snv1.europe-west1-c.c.$MYPROJECT.internal
IP: 10.0.1.4
Metadata: {
  "created-by": "projects/xxxx/regions/europe-west1/instanceGroupManagers/mig",
  "instance-template": "projects/xxxx/global/instanceTemplates/mig-template-20210518224515151200000001"
}
</pre>
user@vm-test:~$ curl 10.0.1.5
<pre>
Name: vm-tjg7.europe-west1-b.c.$MYPROJECT.internal
IP: 10.0.1.3
Metadata: {
  "created-by": "projects/xxxx/regions/europe-west1/instanceGroupManagers/mig",
  "instance-template": "projects/xxxx/global/instanceTemplates/mig-template-20210518224515151200000001"
}
</pre>
jccb@vm-test:~$
```

After you're finished, you can destroy all resources with `terraform destroy`.

<!-- BEGIN TFDOC -->
## Variables

| name | description | type | required | default |
|---|---|:---: |:---:|:---:|
| project_id | Project where resources will be created | <code title="">string</code> | ✓ |  |
| *ranges* | CIDR ranges for proxy and backend instances | <code title="object&#40;&#123;&#10;proxy   &#61; string&#10;backend &#61; string&#10;&#125;&#41;">object({...})</code> |  | <code title="&#123;&#10;proxy   &#61; &#34;10.0.0.0&#47;24&#34;&#10;backend &#61; &#34;10.0.1.0&#47;24&#34;&#10;&#125;">...</code> |
| *region* | Default region for resources | <code title="">string</code> |  | <code title="">europe-west1</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| ilb_ip | IP of the internal load balancer |  |
<!-- END TFDOC -->
