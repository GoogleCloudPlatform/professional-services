# Table of Contents
- [Table of Contents](#table-of-contents)
- [Sync Cloud DNS with GCE Resources](#sync-cloud-dns-with-gce-resources)
  - [Problem](#problem)
  - [Proposed Solution](#proposed-solution)
    - [The DNS Server](#the-dns-server)
    - [Syncing with Cloud Resources](#syncing-with-cloud-resources)
  - [Configuring Cloud DNS](#configuring-cloud-dns)
  - [Enable Compute Engine Activity Log Export](#enable-compute-engine-activity-log-export)
  - [Grant the Application Access To the GCE Project](#grant-the-application-access-to-the-gce-project)
  - [Configure and Deploy the Application](#configure-and-deploy-the-application)
  - [Testing the Application](#testing-the-application)
  - [Building and Unit Tests](#building-and-unit-tests)

# Sync Cloud DNS with GCE Resources

DNS "A" records are added to a Cloud DNS zone as GCE instance and load balancer
start and stopped events are received from compute engine activity logs exported
to a pub/sub topic. Can sync multiple projects to a single Cloud DNS zone.


## Problem

Consider an on-premise machine accessing a GCE instance through Cloud VPN. Since
the internal IP address of the host can change as the instance is deleted or
created it's best to use a hostname like
“instance-1.my-cloud.project.domain.com”, but unfortunately the internal GCE DNS
server available to GCE instances is not exported via the Cloud VPN.

Similarly, an external HTTP or network load balancer provisioned in a project
should be able to be accessed using a familiar name like
“new-web-service.domain.com” rather than having to use an ephemeral external IP
address which can change with each deployment of the service.

## Proposed Solution

Setup a DNS server with a zone that is synced with the GCE instances and load
balancers being provisioned and deleted across multiple cloud projects. Then
configure GCE instances and external services to use the DNS server to resolve
names for our custom domain.

### The DNS Server

To establish a DNS service which is accessible from within and outside the GCE
environment we'll use Google Cloud DNS but it should be possible to adapt this
solution to use a standard BIND server that supports dynamic dns updates. The
current example code provided uses Google Cloud DNS API calls to update DNS
records, but it might work with the http://www.dnspython.org/ library to send
DDNS records with some modification.

### Syncing with Cloud Resources

Every GCE operation like starting/stopping instances, creating/deleting load
balancers can be configured to send out a Cloud Pub/Sub message to a topic. A
subscriber to this topic can listen for resources that should have a DNS mapping
and create/delete the mapping in the DNS zones.

![alt text](https://dns-sync-demo.storage.googleapis.com/diagram_1.png "GCE Event Diagram")


## Configuring Cloud DNS

A single Cloud DNS zone can be created to manage the mappings for multiple
Google Cloud projects. The project name will be encoded in the DNS name:

`<resource-name>.<project-id>.<domain-name>`

The domain-name suffix will be the Cloud DNS managed zone dns name. To create a
Cloud DNS zone, use the UI console:

[https://console.cloud.google.com/networking/dns/zones/~new](https://console.cloud.google.com/networking/dns/zones/~new)

![alt text](https://dns-sync-demo.storage.googleapis.com/screenshot_1.png "New DNS zone")

Or via the command line:

```
> gcloud dns managed-zones create --dns-name="my.domain.name." --description="mydomain" "my-zone-name"
```

It might be necessary to enable the Cloud DNS API on your project.

[https://console.cloud.google.com/flows/enableapi?apiid=dns](https://console.cloud.google.com/flows/enableapi?apiid=dns)

## Enable Compute Engine Activity Log Export

The connect_with_dns_sync.sh will perform all of these steps in an automated
fashion:

```
> connect_with_dns_sync.sh <DNS_PROJECT> <GCE_PROJECT> <PUSH_ENDPOINT>
```

For example

```
> connect_with_dns_sync.sh dns-project-1 gce-project-1 'https://compute-engine-activity-dot-dns-project-1.appspot.com/push_notification?secret=my-shared-secret-key'
```

We can perform these steps manually via gcloud or the UI by performing these
steps:

For all the projects we want to sync GCE resources to this zone enable
compute_engine_activity logs be sent to a pub/sub topic. First create the
pub/sub topic in the project we are going to track (which can be the same or
different project that owns the Cloud DNS zone). This can be done in the UI :

[https://console.cloud.google.com/cloudpubsub/topicList](https://console.cloud.google.com/cloudpubsub/topicList)

![alt text](https://dns-sync-demo.storage.googleapis.com/screenshot_2.png "New Pubsub Topic")

Or via the gcloud command line tool:

```
> gcloud --project dns-sync-gce-project alpha pubsub topics create compute_engine_activity
```

We now need to add the cloud-logs@system.gserviceaccount.com account as an
editor to the topic so the Cloud Logging system sends messages to the topic.
This can only be done in the UI at the moment (it's in the API, but the gcloud
command line utility doesn't have the features yet). Click the checkbox next to
the topic we just created and click permissions. Enter the account and make it
an editor of the topic.

![alt text](https://dns-sync-demo.storage.googleapis.com/screenshot_3.png "Select Topic")
![alt text](https://dns-sync-demo.storage.googleapis.com/screenshot_4.png "Add Topic Editor")

Now configure the the logging export system to send events to this topic.

This can be done in the UI if you had created a GCE instance in the project
previously and waited about an hour or so for the event source to appear in the
UI, or can be done in via the command line immediately. The UI is
[here](https://console.cloud.google.com/logs/exports), select the “Compute
Engine” service and add the compute.googleapis.com/activity_log source to be
exported to the topic we created. If you don't see “Compute Engine” service
listed, create an instance and then wait about an hour for the UI to recognize a
new event source exists.

![alt text](https://dns-sync-demo.storage.googleapis.com/screenshot_5.png "Log Sink config")

To perform the same action using the command line utility:

```
> gcloud --project dns-sync-gce-project beta logging sinks create compute_engine_activity pubsub.googleapis.com/projects/dns-sync-gce-project/topics/compute_engine_activity --log compute.googleapis.com/activity_log --output-version-format 'V1'
```

We next need to create a push subscription to this topic from the project
hosting our zone. If this is a different project than the GCE project it must be
done from the command line:

```
> gcloud --project dns-sync-demo alpha pubsub subscriptions create compute_engine_activity_push --topic-project dns-sync-gce-project --topic compute_engine_activity --push-endpoint 'https://compute-engine-activity-dot-dns-sync-demo.appspot.com/push_notification?secret=my-shared-secret-key'
```

Otherwise if it's the same project it can be done via the UI, click on “new
subscription” to the topic, and configure a push subscription pushing to
“https://compute-engine-activity-dot-dns-sync-demo.appspot.com/push_notification?secret=my-shared-secret-key”

You can choose your own shared secret to ensure nobody else can mock a
notification. We'll configure the same secret on the sync application in just a
bit.

![alt text](https://dns-sync-demo.storage.googleapis.com/screenshot_5.png "New Subscription")

## Grant the Application Access To the GCE Project

The dns-sync application will need to read GCE resources from the GCE project to
determine their IP address. If the application is running in a separate project
from the GCE resources, we'll need to grant the application access to those
resources. First get the name of the App Engine default service account from the
dns-sync-demo project. This is available from the console at:

[https://console.cloud.google.com/permissions/serviceaccounts](https://console.cloud.google.com/permissions/serviceaccount)

You can also list service accounts from the command line with:

```
> gcloud --project dns-sync-demo beta iam service-accounts list
```

This should look something like:

dns-sync-demo@appspot.gserviceaccount.com

We need to now add it as a VIEWER to the dns-sync-gce-project on the permissions page:

[https://console.cloud.google.com/permissions/projectpermissions](https://console.cloud.google.com/permissions/projectpermissions)

This can also be done with the gcloud command line tool:
Get the IAM policy for the project

```
> gcloud --format json beta projects get-iam-policy dns-sync-gce-project> policy.json
```

Edit the policy and add the dns-sync App Engine service account to the bindings
list. This is adding an element to the bindings list like:

{ "members": ["serviceAccount:dns-sync-demo@appspot.gserviceaccount.com"],
  "role": "roles/viewer"}

Or adding the account to the list of existing viewers.

```
> vi policy.json
```

Then set this policy on the project:

```
> gcloud beta projects set-iam-policy dns-sync-gce-project policy.json
```

## Configure and Deploy the Application

The application hsa some configuration stored in datastore including

1. The name of the Cloud DNS managed zones to sync to. This isn't the same as
   the domain name, but the name of the Cloud DNS zone resource.
1. The shared secret you added to the App Engine push url.
   (pubsub_shared_secret)

`
default_zone: my-zone-name
pubsub_shared_secret: my-shared-secret-key
`

The zone can be chosen based on the GCE resource network or resource name, for
example we can configure the service to add a entry in the development Cloud DNS
zone by starting an instance name "my-dev-instance", while "my-stg-instance"
would be added to the staging dns zone:

regular_expression_zone_mapping:
  - ['-dev-', dev-zone-name]
  - ['-stg-', staging-zone-name]
default_zone: dev-zone-name
pubsub_shared_secret: my-shared-secret-key

These configurations are made within the application once deployed at
"http://<application-url>/static/index.html#/zones"

To deploy the application to App Engine you might have to first download the
python App Engine SDK in order to run the appcfg.py command from the same
directory as the dns-sync application:

```
> gcloud --project dns-sync-demo app deploy app.yaml
```

You might get an error about needing to upload a default version first before
you can upload a module.

> “The first module you upload to a new application must be the 'default' module.”

No problem, we can do that! Just upload a default version and then this
application module.

```
> mkdir blank
> cd blank
> cat << EOF > app.yaml

api_version: 1
runtime: python27
threadsafe: true
version: v1


handlers:
- url: /
  upload: index.html
  static_files: index.html
EOF
> appcfg.py -A dns-sync-demo update .
```

Then change directories to the dns-sync app directory and run appcfg.py -A
dns-sync-demo update . again.

That's it!

## Testing the Application

Now that the app is deployed, we can start a GCE resource in the GCE project via
the UI


[https://console.cloud.google.com/compute/instancesAdd](https://console.cloud.google.com/compute/instancesAdd)


 or command line tool :

```
> gcloud --project dns-sync-gce-project compute instances create instance-1
```

Then examine the DNS zone and you'll see the DNS records defined for this
instance:


[https://console.cloud.google.com/networking/dns/zones](https://console.cloud.google.com/networking/dns/zones)

Or via the command line:

```
> gcloud --project dns-sync-demo dns record-sets list --zone my-zone-name
```

This should show two A records for the instance, one for the internal and external IP addresses


instance-1.dns-sync-gce-project.my.domain.name.           A     300    104.196.8.38
instance-1.internal.dns-sync-gce-project.my.domain.name.  A     300    10.142.0.2

If you don't, then look at the application of the compute-activity app engine module for possible errors:


[https://console.cloud.google.com/logs?service=appengine.googleapis.com&key1=compute-engine-activity&key2=v1&logName=appengine.googleapis.com%2Frequest_log&minLogLevel=0&expandAll=false](https://console.cloud.google.com/logs?service=appengine.googleapis.com&key1=compute-engine-activity&key2=v1&logName=appengine.googleapis.com%2Frequest_log&minLogLevel=0&expandAll=false)


## Building and Unit Tests

To build and run unit tests run

```
> python setup.py install
> python setup.py test
```
