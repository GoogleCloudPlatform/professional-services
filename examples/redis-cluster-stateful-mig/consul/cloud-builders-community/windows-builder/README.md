# windows-builder

An experimental Windows builder for Cloud Build.

## Getting started

If you are new to Google Cloud Build, we recommend you start by visiting the [manage resources page](https://console.cloud.google.com/cloud-resource-manager) in the Cloud Console, [enable billing](https://cloud.google.com/billing/docs/how-to/modify-project), [enable the Cloud Build API](https://console.cloud.google.com/flows/enableapi?apiid=cloudbuild.googleapis.com), and [install the Cloud SDK](https://cloud.google.com/sdk/docs/).

Grant Compute Engine permissions to your Cloud Build service account:

```sh
gcloud services enable compute.googleapis.com
export PROJECT=$(gcloud info --format='value(config.project)')
export MEMBER=$(gcloud projects describe $PROJECT --format 'value(projectNumber)')@cloudbuild.gserviceaccount.com
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$MEMBER --role='roles/compute.admin'
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$MEMBER --role='roles/iam.serviceAccountUser'
```

Clone this repository and build the builder:
```sh
gcloud builds submit --config=builder/cloudbuild.yaml builder/
```

Then, refer to the builder in your project's `cloudbuild.yaml`.  To spin up an ephemeral `n1-standard-1` VM on Compute Engine, simply provide the command you wish to execute.  Your Cloud Build workspace is synchronized to `C:\workspace` at server startup.

```yaml
steps:
- name: 'gcr.io/$PROJECT_ID/windows-builder'
  args: [ '--command', '<command goes here>' ]
```

To use a custom Windows image, specify the image URL using the `--image` argument.

```yaml
steps:
- name: 'gcr.io/$PROJECT_ID/windows-builder'
  args: [ '--command', '<command goes here>',
          '--image', 'projects/$PROJECT_ID/global/images/my-windows-image']
```

The VM is configured by the builder and then deleted automatically at the end of the build.  Command is executed by `cmd.exe`; in most cases it will be a build script.

To use an existing Windows server instead, also provide the hostname, username and password:

```yaml
steps:
- name: 'gcr.io/$PROJECT_ID/windows-builder'
  args: [ '--hostname', 'host.domain.net',
          '--username', 'myuser',
          '--password', 's3cret',
          '--command', '<command goes here>' ]
```

You can also provide the VPC, Subnetwork, Region, and Zone parameters to specify where to create the VM:

```yaml
steps:
- name: 'gcr.io/$PROJECT_ID/windows-builder'
  args: [ '--network', '<network-name>',
          '--subnetwork', '<subnetwork-name>',
          '--region', '<region>',
          '--zone', '<zone>',
          '--command', '<command goes here>' ]
```

As the remote copy command provided is very slow if you have a number of files in your workspace, it is also possible to avoid copying the workspace (you can use GCS to copy the workspace instead):

```yaml
steps:
- name: 'gcr.io/$PROJECT_ID/windows-builder'
  args: [ '--network', '<network-name>',
          '--subnetwork', '<subnetwork-name>',
          '--region', '<region>',
          '--zone', '<zone>',
          '--not-copy-workspace',
          '--command', '<command goes here>' ]
```

Your server must support Basic Authentication (username and password) and your network must allow access from the internet on TCP port 5986.  Do not submit plaintext passwords in your build configuration: instead, use [encrypted credentials](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials) secured with Cloud KMS.  In addition, you must clear up your workspace directory after use, and take care to manage concurrent builds.

## Examples

Several example builds are provided:

* [images/example](images/example) prints "Hello World!" from Windows
* [images/go-windows](images/go-windows) builds a Windows Go builder container
  image
* [images/go-example](images/go-example) builds a very simple Go application
  into a deployable Windows container.  This relies on the Windows Go builder
  from the step above.
* [images/docker-windows](images/docker-windows) builds a Windows container with
  a Docker executable inside - useful for building containers within a
  Docker context itself.
* [images/multi-arch_1909_2019](images/multi-arch_1909_2019) builds a multi-arch Windows container from servercore 1909 & ltsc2019.

## Performance

Starting an ephemeral VM on Compute Engine takes about 3 min 31 sec, broken down as follows:

| Step | Duration | Elapsed | Fraction |
|------|----------|---------|----------|
| Create new Compute Engine instance | 7 sec | 7 sec | 3% |
| Wait for password reset | 37 sec | 45 sec | 21% |
| Wait for Windows to finish booting | 2 min 39 sec | 3 min 24 sec | 76% |

Frequent builds will benefit from creating a persistent Windows VM.  To do this, see `scripts/start_windows.sh`.

Downloading and expanding archives is a common build step.  While Powershell offers functionality to do this (the `Expand-Archive` cmdlet) there are known performance issues.  See [PowerShell Archive issue #32](https://github.com/PowerShell/Microsoft.PowerShell.Archive/issues/32).

## Security

`windows-builder` communicates with the remote server using WinRM over HTTPS.  Basic authentication using username and password is currently supported.

For ephemeral VMs on Compute Engine, the initial password reset is performed [using public key cryptography](https://cloud.google.com/compute/docs/instances/windows/automate-pw-generation).  The cleartext password is never sent over an unencrypted connection, and is stored in memory for the duration of the build.

The latest version of Windows Server 2019 DC Core for Containers (patched 2019-12-10) is currently used.

By default, windows-builder creates an ingress firewall rule to open tcp:5986.  This allows windows-builder to communicate
with windows GCE instance over WinRM.  It's possible to avoid an external access by using a [private worker pool](https://cloud.google.com/build/docs/private-pools/private-pools-overview) and peering
it with your private VPC network.  With such set up windows-builder can communicate with GCE instance(s) over an internal network.  To do that you will need to [set up](https://cloud.google.com/build/docs/private-pools/set-up-private-pool-environment) your GCP network, create a [private worker pool](https://cloud.google.com/build/docs/private-pools/create-manage-private-pools), configure [Private Google Access](https://cloud.google.com/vpc/docs/configure-private-google-access), [configure](https://cloud.google.com/build/docs/private-pools/run-builds-in-private-pool) your builder to use a private worker pool, and use --use-internal-network windows-builder option in your cloudbuild.yaml.

Using internal network option precludes windows-builder from creating an external ip address for windows GCE instance.
You can use --create-external-ip (can only be used in conjunction with --use-internal-network) which would override the
default behavior and create an external IP address.  This can be useful in case you want to be able to RDP to your
GCE instance(s).

## Docker builds

Windows supports [two different types](https://docs.microsoft.com/en-us/virtualization/windowscontainers/manage-containers/hyperv-container) of containers: "Windows Server containers", similar to the traditional Linux container, and "Hyper-V containers", which rely on Virtual Machines.  This code uses Windows Server containers, and as a result both the major and minor version of Windows must match between container and host.

The package manager in Windows Server 1803 provides Docker 17.06.  However to run a Docker executable inside a Docker container as Cloud Build typically does, version 17.09 or higher is required to bind-mount the named pipe: see [this pull request](https://github.com/StefanScherer/insider-docker-machine/pull/1).  e.g., `docker run -v '\.\pipe\docker_engine:\.\pipe\docker_engine' ...`

## Debugging WinRM

To debug issues with WinRM, Python users may find the [PyWinRM package](https://github.com/diyan/pywinrm) helpful, for example:

```python
from winrm.protocol import Protocol
p = Protocol(
    endpoint='https://<ip address>:5986/wsman',
    username=<username>,
    password=<password>,
    server_cert_validation='ignore')
shell_id = p.open_shell()
command_id = p.run_command(shell_id, 'ipconfig', ['/all'])
std_out, std_err, status_code = p.get_command_output(shell_id, command_id)
p.cleanup_command(shell_id, command_id)
p.close_shell(shell_id)
```

