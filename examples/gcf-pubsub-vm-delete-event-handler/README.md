VM DNS Garbage Collection
===

This folder contains a [Background Function][bg] which deletes DNS A records
when a VM is deleted.

**Please note** DNS record deletion is implemented, however, cannot be
guaranteed.  A race exists between the function obtaining the VM IP address and
the `compute.instances.delete` operation.  If the VM is deleted before the IP
is obtained, the function will not delete the DNS record because it cannot
check the IP address matches the VM being deleted.

In practice this background function collects the IP address well within the
~30 second window of the VM delete operation.

Project Setup
===

This example has been developed for use with multiple service projects.  A
centralized logs project is used to host one pubsub topic for all VM deletion
events.  One deployment of the function implements the event handler.

 * The logs project contains the dns-vm-gc Pub/Sub topic and the
   dns_vm_gc function deployed as a Background Function.
 * One or more service projects contain VM resources to be deleted.
 * The host project contains a VPC shared with the user project and DNS
   resource record sets needing to be cleaned up automatically.

Identify the Logs Project
===

Identify a project to host the `vm-deletions` Pub/Sub topic and the DNS VM GC
Cloud Function.  Service projects are configured to export filtered logs into
this topic.

If a project does not already exist, create a new project.  A suggested name is
`logs`.  The rest of this document will use `logs-123456` as the project ID for
the centralized logs project.

Create the vm-deletions Pub/Sub topic
---

Service projects export `compute.instances.delete` events to the `vm-deletions`
topic.  The VM DNS GC background function subscribes to this topic and triggers
on each event.

Create a topic named `vm-deletions` in the logs project as per [Create a
topic][pubsub-quickstart].

Configure Log Exports
---

Configure Log Exports in one or more service projects.  Logs are exported to
the `vm-deletions` topic in the logs project.

[Stackdriver logs exports][logs-exports] are used to convey VM lifecycle events
to the DNS VM GC function via Cloud Pub/Sub.  A Stackdriver filter is used to
limit logs to VM deletion events, reducing data traveling through Pub/Sub.

Configure an export to the `vm-deletions` topic with the following filter, for
example `projects/logs-123456/topics/vm-deletions`.

```
resource.type="gce_instance"
jsonPayload.event_subtype="compute.instances.delete"
```

Note: Two events are generated for each VM delete.

 1. A `GCE_API_CALL` event occurs when the VM deletion is requested.
 2. A `GCE_OPERATION_DONE` event occurs after the VM deletion has completed.

The function triggers on both events but takes action only on GCE_API_CALL
events.

Service Account
===

The Background Function runs with a service account identity.  Create a service
account named `dns-vm-gc` in the logs project for this purpose.  This example
assumes [GCP-managed][sa-gcp-managed] keys.

If you are modifying this example you may download the service account key and
run locally as the service account using the GOOGLE_APPLICATION_CREDENTIALS
environment file.  See [Providing credentials to your application][adc] for
details.

Grant the DNS Admin role to the dns-vm-gc service account in the host project.
DNS Admin allows the DNS VM GC function to delete DNS records in the host
project.

Grant the Compute Viewer role to the dns-vm-gc service account in the Service
Projects.  Compute Viewer allows the DNS VM GC function to read the IP address
of the VM, necessary to ensure the correct A record is deleted.

Deployment
===

Deploy this function into the logs project to simplify the subscription to the
`vm-deletions` topic.

Environment variables are used to configure the behavior of the function.
Update the env.yaml file to reflect the correct VPC Host project and Managed
Zone names for your environment.  A sample is provided in env.yaml.sample.

```yaml
# env.yaml
---
DNS_VM_GC_DNS_PROJECT: my-vpc-host-project
DNS_VM_GC_DNS_ZONES: my-nonprod-private-zone,my-prod-private-zone
```

```bash
gcloud functions deploy dns_vm_gc \
  --retry \
  --runtime=python37 \
  --service-account=dns-vm-gc@logs-123456.iam.gserviceaccount.com \
  --trigger-topic=vm-deletions \
  --env-vars-file=env.yaml
```

Expected output:

```
Deploying function (may take a while - up to 2 minutes)...done.
availableMemoryMb: 256
entryPoint: dns_vm_gc
environmentVariables:
  DNS_VM_GC_DNS_PROJECT: my-vpc-host-project
  DNS_VM_GC_DNS_ZONES: my-nonprod-private-zone,my-prod-private-zone
eventTrigger:
  eventType: google.pubsub.topic.publish
  failurePolicy:
    retry: {}
  resource: projects/logs-123456/topics/vm-deletions
  service: pubsub.googleapis.com
labels:
  deployment-tool: cli-gcloud
name: projects/logs-123456/locations/us-west1/functions/dns_vm_gc
runtime: python37
serviceAccountEmail: dns-vm-gc@logs-123456.iam.gserviceaccount.com
sourceUploadUrl: https://storage.googleapis.com/gcf-upload-us-west1-973b4cc1-05d6-4a78-b8c5-c3b99267db38/ad8a3129-ca46-434f-bd76-ac9bd1efffdc.zip?GoogleAccessId=service-4551223416
18@gcf-admin-robot.iam.gserviceaccount.com&Expires=1560296818&Signature=WBo9JaIipBEf59tH289ea5ftzTqqipuDZTqNFwiwSL%2B1JMbHkvj0yLf1wT%2BsEguhHnWVe0DO0o9yzrvJCWlDwEZDwx8j0X%2B808Q7swGZ
O7cQ1RMdxj9Bk8742b4KhoZkBAcO9t5iOOAz3qpdHL2jsEvprghZous21T5FSTfcdiPvwNGAVQyiLKiX%2F1peuk0hzGMx2MVxVUQb6XbuaXQooCftsQ38Gp4IuKxusCMGs7o4UERHLFUy5RwgROeDJSTX4%2BgPe0ZJfJtAxUsenGtVfGBLO0
V2OfiRwBtB3zPJU57b8sroZfN4s%2BimX0h1hVIdSKsersiESFsFX%2BwMUi%2Bhgg%3D%3D
status: ACTIVE
timeout: 60s
updateTime: '2019-06-11T23:17:29Z'
versionId: '2'
```

Function Logs
===

This function uses the [Logging facility for Python].  When running in the
Google Cloud Functions environment, the Python log messages are logged with
Stackdriver severity according to the following table.

| Python log level | Stackdriver severity |
|------------------|----------------------|
| debug            | info                 |
| info             | info                 |
| warning          | error                |
| error            | error                |
| critical         | error                |

Note the debug level of the Python logger is respected.  For this reason debug
messages will not appear in Stackdriver unless the function is deployed with
the DEBUG environment variable.

Example Logs
===

Note these log message formats are subject to change.  They're provided here to
assist with tracing the function behavior when deployed.

When the function cannot obtain the IP address of the VM the log messages look
like:

```
Function execution started
{"message": "<HttpError 404 when requesting https://www.googleapis.com/compute/v1/projects/user-dev-242122/zones/us-west1-a/instances/test?alt=json returned \"The resource 'projects/user-dev-242122/zones/us-west1-a/instances/test' was not found\">"}
{"instance": "test", "message": "Could not get IP address. Obtaining the IP is not guaranteed because of race condition with VM deletion. Aborting with no action taken"}
Function execution took 1910 ms, finished with status: 'ok'
```

A successful deletion looks like:

```
Function execution started
{"message": "Processing VM deletion event", "event_type": "GCE_API_CALL", "project": "user-dev-242122", "zone": "us-west1-c", "instance": "thursday-dw1"}
{"message": "DNS RECORD DELETED", "project": "dnsregistration", "managed_zone": "nonprod-private-zone", "record": {"name": "thursday-dw1.nonprod.gcp.example.com.", "type": "A", "ttl": 300, "rrdatas": ["10.138.0.63"], "signatureRrdatas": [], "kind": "dns#resourceRecordSet"}, "response": {"additions": [], "deletions": [{"name": "thursday-dw1.nonprod.gcp.example.com.", "type": "A", "ttl": 300, "rrdatas": ["10.138.0.63"], "signatureRrdatas": [], "kind": "dns#resourceRecordSet"}], "startTime": "2019-06-20T23:15:37.962Z", "id": "31", "status": "pending", "kind": "dns#change"}}
Function execution took 2925 ms, finished with status: 'ok'
```

[bg]: https://cloud.google.com/functions/docs/writing/background
[sa-gcp-managed]: https://cloud.google.com/iam/docs/understanding-service-accounts#managing_service_account_keys
[pubsub-quickstart]: https://cloud.google.com/pubsub/docs/quickstart-console#create_a_topic
[logs-exports]: https://cloud.google.com/logging/docs/export/
[adc]: https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application
