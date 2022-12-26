# OpenShift on GCP user-provisioned infrastructure

This example shows how to quickly install OpenShift 4.7 on GCP user-provided infrastructure (UPI), combining [different](https://docs.openshift.com/container-platform/4.7/installing/installing_gcp/installing-gcp-user-infra-vpc.html) official [installation](https://docs.openshift.com/container-platform/4.7/installing/installing_gcp/installing-restricted-networks-gcp.html) documents into a single setup, that uses a Python script for the initial configuration via the `openshift-install` command, and a set of Terraform files to bootstrap the cluster.

Its main features are:

- remove some dependencies (eg public DNS zone) by generating the yaml file used to seed the install process
- automate the edits required to manifest files during the install process
- use Terraform to bring up the bootstrap and control plane resources
- tightly couple the install configuration and bootstrap phases via a single set of Terraform variables
- allow worker management via native OpenShift machine sets

Several GCP features and best practices are directly supported:

- internal-only clusters with no dependency on public DNS zones or load balancers
- Shared VPC support with optional separate subnets for masters, workers and load balancers
- optional encryption keys for instance disks
- optional proxy settings

The example uses a Python script to drive install configuration, and a set of Terraform files to bootstrap the cluster. The resulting infrastructure is shown in this diagram, which includes the prerequisite resources created by this example with blue icons, and the optional resources provided externally with grey icons:

![High-level diagram](diagram.png "High-level diagram")

## Prerequisites

### OpenShift commands and pull secret

From the [OpenShift GCP UPI documentation](https://cloud.redhat.com/openshift/install/gcp/user-provisioned), download

- the Installer CLI
- the Command Line CLI
- your pull secret

*Optional:* if you want to use a specific GCP RHCOS image, download it from the [RedHat library](https://mirror.openshift.com/pub/openshift-v4/dependencies/rhcos/4.7/4.7.7/), then import it as a GCE image and configure the relevant Terraform variable before bootstrap. An alternative is to run through the install steps manually via the `prepare.py` script, and use the GCP image shared by the ``rhcos-cloud` project set in the `Machine` manifests. Once you have an image URL, set it in the `rhcos_image` Terraform variable.

### OKD

For OKD you need to use

- the [OKD installer](https://github.com/openshift/okd/releases)
- an FCOS image

For FCOS, you can [download the raw file for GCP](https://getfedora.org/en/coreos/download?tab=cloud_operators&stream=stable) and prepare an image, or use the one from the Machine manifests (a recent one is in a comment in the `variables.tf` file for convenience). Then set the image URL in the `rhcos_image` Terraform variable

If the `prepare.py` command fails, check error messages for missing system packages (eg on Debian you might need to install `libvirt0`).

### GCP projects and VPC

This example is designed to fit into enterprise GCP foundations, and assumes a Shared VPC and its associated host and service projects are already available.

If you don't have them yet, you can quickly bring them up using [our example](../../networking/shared-vpc-gke). Just remember to set the `cluster_create` variable to `false` in the Shared VPC example variables, to skip creating the associated GKE cluster.

There are several services that need to be enabled in the GP projects. In the host project, make sure `dns.googleapis.com` is enabled. In the service project, use the [RedHat reference](https://docs.openshift.com/container-platform/4.7/installing/installing_gcp/installing-restricted-networks-gcp.html#installation-gcp-enabling-api-services_installing-restricted-networks-gcp) or just enable this list:

- `cloudapis.googleapis.com`
- `cloudresourcemanager.googleapis.com`
- `compute.googleapis.com`
- `dns.googleapis.com`
- `iamcredentials.googleapis.com`
- `iam.googleapis.com`
- `servicemanagement.googleapis.com`
- `serviceusage.googleapis.com`
- `storage-api.googleapis.com`
- `storage-component.googleapis.com`

Or if you're lazy, just wait for error messages to pop up during `terraform apply`, follow the link in the error message to enable the missing service, then re-run `apply`.

### Python environment

A few Python libraries are needed by the script used to configure the installation files. The simplest option is to create a new virtualenv and install via the provided requirements file:

```bash
python3 -m venv ~/ocp-venv
. ~/ocp-venv/bin/activate
pip install -r requirements.txt
```

You can then check if the provided Python cli works:

```bash
./prepare.py --help
Usage: prepare.py [OPTIONS] COMMAND [ARGS]...

[...]

Options:
  --tfdir PATH                    Terraform folder.
  --tfvars TEXT                   Terraform vars file, relative to Terraform
[...]
```

### Install service account

The OpenShift install requires a privileged service account and the associated key, which is embedded as a secret in the bootstrap files, and used to create the GCP resources directly managed by the OpenShift controllers.

The secret can be removed from the cluster after bootstrap, as individual service accounts with lesser privileges are created during the bootstrap phase. Refer to the [Mint Mode](https://docs.openshift.com/container-platform/4.7/authentication/managing_cloud_provider_credentials/cco-mode-mint.html#mint-mode-permissions-gcp) and [Cloud Credential](https://docs.openshift.com/container-platform/4.6/operators/operator-reference.html#cloud-credential-operator_red-hat-operators) documentation for more details.

The simplest way to get this service account credentials with the right permissions is to create it via `gcloud`, and assign it `owner` role on the service project:

```bash
# adjust with your project id and credentials path
export OCP_SVC_PRJ=my-ocp-svc-project-id
export OCP_DIR=~/ocp

gcloud config set project $OCP_SVC_PRJ
gcloud iam service-accounts create ocp-installer

export OCP_SA=$(\
gcloud iam service-accounts list \
  --filter ocp-installer --format 'value(email)' \
)

gcloud projects add-iam-policy-binding $OCP_SVC_PRJ \
  --role roles/owner --member "serviceAccount:$OCP_SA"
gcloud iam service-accounts keys create $OCP_DIR/credentials.json \
  --iam-account $OCP_SA
```

If you need more fine-grained control on the service account's permissions instead, refer to the [OpenShift documentation](https://docs.openshift.com/container-platform/4.7/installing/installing_gcp/installing-restricted-networks-gcp.html#installation-gcp-permissions_installing-restricted-networks-gcp) for the individual roles needed.

## Installation

As mentioned above, the installation flow is split in two parts:

- generating the configuration files used to bootstrap the cluster, via the include Python script driving the `openshift-installer` cli
- creating the bootstrap and control place resources on GCP

Both steps use a common set of variables defined in Terraform, that set the basic attributes of your GCP infrastructure (projects, VPC), configure paths for prerequisite commands and resources (`openshift-install`, pull secret, etc.), define basic cluster attributes (name, domain), and allow enabling optional features (KMS encryption, proxy).

### Configuring variables

Variable configuration is best done in a `.tfvars` file, but can also be done directly in the `terraform.tfvars` file if needed. Variables names and descriptions should be self-explanatory, here are a few extra things you might want to be aware of.

<dl>
<dt><code>allowed_ranges</code></dt>
<dd>IP CIDR ranges included in the firewall rules for SSH and API server.</dd>
<dt><code>domain</code></dt>
<dd>Domain name for the parent zone, under which a zone matching the <code>cluster_name</code> variable will be created.</dd>
<dt><code>disk_encryption_key</code></dt>
<dd>Set to <code>null</code> if you are not using CMEK keys for disk encryption. If you are using it, ensure the GCE robot account has permissions on the key.</dd>
<dt><code>fs_paths</code></dt>
<dd>Filesystem paths for the external dependencies. Home path expansion is supported. The <code>config_dir</code> path is where generated ignition files will be created. Ensure it's empty (incuding hidden files) before starting the installation process.</dd>
<dt><code>host_project</code></dt>
<dd>If you don't need installing in different subnets, pass the same subnet names for the default, masters, and workers subnets.</dd>
<dt><code>install_config_params</code></dt>
<dd>The `machine` range should match addresses used for nodes.</dd>
<dt><code>post_bootstrap_config</code></dt>
<dd>Set to `null` until bootstrap completion, then refer to the post-bootstrap instructions below.</dd>
</dl>

### Generating ignition files

Once all variables match your setup, you can generate the ignition config files that will be used to bootstrap the control plane. Make sure the directory in the `fs_paths.config_dir` variable is empty before running the following command, including hidden files.

```bash
./prepare.py --tfvars my-vars.tfvars

[output]
```

The directory specified in the `fs_paths.config_dir` variable should now contain a set of ignition files, and the credentials you will use to access the cluster.

If you need to preserve the intermediate files generated by the OpenShift installer (eg `install-config.yaml` or the manifests files), check the Python script's help and run each of its individual subcommands in order.

### Bringing up the cluster

Once you have ignition files ready, change to the `tf` folder and apply:

```bash
cd tf
terraform init
terraform apply
```

If you want to preserve state (which is always a good idea), configure a [GCS backend](https://www.terraform.io/language/settings/backends/gcs) as you would do for any other Terraform GCP setup.

### Waiting for bootstrap to complete

You have two ways of checking the bootstrap process.

The first one is from the bootstrap instance itself, by looking at its logs. The `bootstrap-ssh` Terraform output shows the command you need to use to log in. Once logged in, execute this to tail logs:

```bash
journalctl -b -f -u release-image.service -u bootkube.service
```

Wait until logs show success:

```log
May 11 07:16:38 ocp-fabric-1-px44j-b.c.tf-playground-svpc-openshift.internal bootkube.sh[2346]: bootkube.service complete
May 11 07:16:38 ocp-fabric-1-px44j-b.c.tf-playground-svpc-openshift.internal systemd[1]: bootkube.service: Succeeded.
```

The second way has less details but is more terse: copy the contents of the `fs_paths.config_dir` folder to your bastion host, then use the `openshift-install` command to wait for folder completion:

```bash
# edit commands to match your paths and names
gcloud compute scp --recurse
  ~/Desktop/dev/openshift/config bastion:
gcloud compute ssh bastion
openshift-install wait-for bootstrap-complete --dir config/
```

The command exits successfully once bootstrap has completed:

```log
INFO Waiting up to 20m0s for the Kubernetes API at https://api.ocp-fabric-1.ocp.ludomagno.net:6443...
INFO API v1.20.0+c8905da up
INFO Waiting up to 30m0s for bootstrapping to complete...
INFO It is now safe to remove the bootstrap resources
INFO Time elapsed: 0s
```

### Post-bootstrap tasks

Once bootstrap has completed, use the credentials in the OpenShift configuration folder to look for the name of the generated service account for the machine operator:

```bash
export KUBECONFIG=config/auth/kubeconfig
oc get CredentialsRequest openshift-machine-api-gcp \
  -n openshift-cloud-credential-operator \
  -o jsonpath='{.status.providerStatus.serviceAccountID}{"\n"}'
```

Take the resulting name, and put it into the `post_bootstrap_config.machine_op_sa_prefix` Terraform variable, then run `terraform apply`. This will remove the bootstrap resources which are no longer needed, and grant the correct role on the Shared VPC to the service account.

You're now ready to scale the machinesets and provision workers:

```bash
export KUBECONFIG=config/auth/kubeconfig
for m in $(oc get machineset -A -o jsonpath='{..metadata.name}'); do
  oc scale machineset $m -n openshift-machine-api --replicas 1;
done
```

Then check that machines have been provisioned:

```bash
oc get machine -A
```

### Confirming the cluster is ready

After a little while, all OpenShift operators should finish their configuration. You can confirm it by checking their status:

```bash
oc get clusteroperators
```
