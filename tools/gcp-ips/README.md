# GCP Internal IPs by Subnet

A utility to list all internal IPs reserved or in-use for all service projects,
i.e. projects using a shared VPC, grouped by subnet. This includes IPs used by
GCE instances, forwarding rules, and IPs that have been reserved but not in use.

## Motivation

Currently, there is no easy way to list all internal IPs being used in a subnet.
This is not a problem when a VPC is not shared - the IPs can only be used by
resources in the same project. However, with shared VPCs, the IPs can be used by
resources in any service projects attached to the host project. One has to scan
through every service project to compile the list of IPs and organize it by subnet.

## Prerequisites

* go >= 1.10
* GCP Application Default Credentials
    - this credential needs permissions to:
        1. list service projects in the host project
        2. list addresses and instances in service projects:
             `compute.instances.list` and
             `compute.addresses.list`

## Usage

1) Setup GCP credentials
```
export GOOGLE_APPLICATION_CREDENTIALS=<path_to_creds>
```

2a) you can either compile for your current environment
```
go build
./gcp-ips <host_project_name>
```

2b) or cross-compile to another environment (e.g. Linux)
```
env GOOS=linux GOARCH=amd64 go build
./gcp-ips <host_project_name>
```

2c) or just run
```
go run main.go <host_project_name>
```

## Output example

```
# IPs for us-west1-subnet
|     IP     |   GCP PROJECT   |  STATUS  |          USER          |
|------------|-----------------|----------|------------------------|
| 10.11.0.3  | acme-production |  IN_USE  | some-gce-instance_0    |
| 10.11.0.4  | acme-production |  IN_USE  | some-gce-instance_1    |
| 10.11.0.5  | acme-production |  IN_USE  | some-gce-instance_2    |
| 10.11.0.7  | acme-production |          | another-gce-instance_0 |
| 10.11.0.8  | acme-production |          | another-gce-instance_1 |
| 10.11.0.9  | acme-production |          | another-gce-instance_2 |
| 10.11.0.17 | acme-production | RESERVED |                        |
```