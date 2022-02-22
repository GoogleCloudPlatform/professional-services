Unit Tests
===

Run unit tests after installing development dependencis:

```bash
pip install -r requirements-dev.txt
pytest
```

Save and Replay VM Deletion Events
===

It is useful to replay VM deletion events to test out changes to the Background
Function.  See the [Replay Quickstart][replay-qs] for more information.

 1. Deploy the function
 2. Get the subscription of the function with `gcloud pubsub subscriptions
    list`
 3. Create a pubsub snapshot with `gcloud pubsub snapshots create vm-deletions
    --subscription <subscription>`
 4. Delete a VM instance
 5. Deploy a new version of the same function
 6. Replay the deletion events to the new version `gcloud pubsub subscriptions
    seek <subscription> --snapshot=vm-deletions`
 7. Inspect the function output with `gcloud functions logs read --limit 50`

Interactive Testing
===

A run helper method is provided to run the function from a local workstation.
First, make sure you have the following environment variables set as if they
would be in the context of GCF.

```bash
# env | grep DNS
DNS_VM_GC_DNS_PROJECT=dnsregistration
DNS_VM_GC_DNS_ZONES=nonprod-private-zone
```

If necessary, use Application Default Credentials:

```bash
# env | grep GOOG
GOOGLE_APPLICATION_CREDENTIALS=/Users/jmccune/.credentials/dns-logging-83a9d261f444.json
```

Run the python REPL with debugging enabled via the DEBUG environment variable.

```ipython
Python 3.7.3 (default, Mar 27 2019, 09:23:39)
[Clang 10.0.0 (clang-1000.11.45.5)] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> import conftest
>>> from main_test import run
>>> run()
{"message": "BEGIN Zone cleanup", "managed_zone": "nonprod-private-zone"}
{"message": "BEGIN search for deletion candidates", "instance": "test", "ip": "10.138.0.45"}
{"message": "Skipped, not an A record", "record": {"name": "gcp.example.com.", "type": "NS", "ttl": 21600, "rrdatas": ["ns-gcp-private.googledomains.com."], "signatureRrdatas": [], "kind": "dns#resourceRecordSet"}}
{"message": "Skipped, not an A record", "record": {"name": "gcp.example.com.", "type": "SOA", "ttl": 21600, "rrdatas": ["ns-gcp-private.googledomains.com. cloud-dns-hostmaster.google.com. 1 21600 3600 259200 300"], "signatureRrdatas": [], "kind": "dns#resourceRecordSet"}}
{"message": "Skipped, shortname != instance", "record": {"name": "keep.gcp.example.com.", "type": "A", "ttl": 300, "rrdatas": ["10.138.0.45"], "signatureRrdatas": [], "kind": "dns#resourceRecordSet"}}
{"message": "Skipped, ip does not match", "record": {"name": "test.keep.gcp.example.com.", "type": "A", "ttl": 300, "rrdatas": ["10.138.0.43", "10.138.0.44", "10.138.0.45"], "signatureRrdatas": [], "kind": "dns#resourceRecordSet"}}
{"message": "Skipped, ip does not match", "record": {"name": "test.nonprod.gcp.example.com.", "type": "A", "ttl": 300, "rrdatas": ["10.138.0.250"], "signatureRrdatas": [], "kind": "dns#resourceRecordSet"}}
{"message": "END search for deletion candidates", "candidates": []}
{"message": "END Zone cleanup", "managed_zone": "nonprod-private-zone"}
>>>
```

Unit Tests
===

Run unit tests to interact with fixture data.  Fixture data is provided for the
main entry point of a pubsub message sent to Google Cloud Functions and for the
API response when collecting the IP address from the compute API.

Test dependencies
---

Install test dependencies:

```bash
pip install pytest
pip install google-api-python-client
```

Run the tests
---

```
pytest -vv tests
```

Sample events
===

This is the JSON log data sent from Stackdriver's compute.instances.delete
event to Pub/Sub and then to the Background Function implemented in Python.
There are two events, one for the GCE_API_CALL initiating the VM deletion, the
second for the GCE_OPERATION_DONE event concluding the VM deletion.

Obtained using `gcloud functions logs read --limit 100`.

```txt
D      dns_vm_gc  578383257362746  2019-06-12 01:30:09.128  Function execution started
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145  {
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      "insertId": "6o9bdnfxt05mn",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      "jsonPayload": {
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "actor": {
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "user": "jmccune@google.com"
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          },
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "event_subtype": "compute.instances.delete",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "event_timestamp_us": "1560300993146327",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "event_type": "GCE_API_CALL",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "ip_address": "",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "operation": {
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "id": "971500189857477422",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "name": "operation-1560300992590-58b15e267f2cc-e7529c4d-f1343924",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "type": "operation",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "zone": "us-west1-a"
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          },
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "request": {
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "body": "null",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "url": "https://www.googleapis.com/compute/v1/projects/user-dev-242122/zones/us-west1-a/instances/test?key=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          },
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "resource": {
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "id": "613579339353422259",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "name": "test",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "type": "instance",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "zone": "us-west1-a"
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          },
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "trace_id": "operation-1560300992590-58b15e267f2cc-e7529c4d-f1343924",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "version": "1.2"
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      },
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      "labels": {
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "compute.googleapis.com/resource_id": "613579339353422259",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "compute.googleapis.com/resource_name": "test",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "compute.googleapis.com/resource_type": "instance",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "compute.googleapis.com/resource_zone": "us-west1-a"
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      },
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      "logName": "projects/user-dev-242122/logs/compute.googleapis.com%2Factivity_log",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      "receiveTimestamp": "2019-06-12T00:56:33.188262452Z",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      "resource": {
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "labels": {
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "instance_id": "613579339353422259",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "project_id": "user-dev-242122",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145              "zone": "us-west1-a"
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          },
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145          "type": "gce_instance"
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      },
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      "severity": "INFO",
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145      "timestamp": "2019-06-12T00:56:33.146327Z"
I      dns_vm_gc  578383257362746  2019-06-12 01:30:09.145  }
D      dns_vm_gc  578383257362746  2019-06-12 01:30:09.146  Function execution took 20 ms, finished with status: 'ok'
D      dns_vm_gc  578389534045377  2019-06-12 01:30:20.433  Function execution started
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438  {
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      "insertId": "hrbv6bfh9qzr2",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      "jsonPayload": {
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "actor": {
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "user": "jmccune@google.com"
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          },
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "event_subtype": "compute.instances.delete",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "event_timestamp_us": "1560301035092322",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "event_type": "GCE_OPERATION_DONE",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "operation": {
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "id": "971500189857477422",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "name": "operation-1560300992590-58b15e267f2cc-e7529c4d-f1343924",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "type": "operation",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "zone": "us-west1-a"
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          },
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "resource": {
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "id": "613579339353422259",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "name": "test",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "type": "instance",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "zone": "us-west1-a"
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          },
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "trace_id": "operation-1560300992590-58b15e267f2cc-e7529c4d-f1343924",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "version": "1.2"
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      },
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      "labels": {
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "compute.googleapis.com/resource_id": "613579339353422259",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "compute.googleapis.com/resource_name": "test",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "compute.googleapis.com/resource_type": "instance",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "compute.googleapis.com/resource_zone": "us-west1-a"
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      },
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      "logName": "projects/user-dev-242122/logs/compute.googleapis.com%2Factivity_log",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      "receiveTimestamp": "2019-06-12T00:57:15.146606691Z",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      "resource": {
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "labels": {
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "instance_id": "613579339353422259",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "project_id": "user-dev-242122",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438              "zone": "us-west1-a"
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          },
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438          "type": "gce_instance"
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      },
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      "severity": "INFO",
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438      "timestamp": "2019-06-12T00:57:15.092322Z"
I      dns_vm_gc  578389534045377  2019-06-12 01:30:20.438  }
D      dns_vm_gc  578389534045377  2019-06-12 01:30:20.439  Function execution took 7 ms, finished with status: 'ok'
```
