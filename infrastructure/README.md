# Professional Services
## Infrastructure
A repository of Infrastructure solutions.

 * [dns-sync](#dns-sync)
 * [labelmaker](#labelmaker)
 * [cloudconnect](#cloudconnect)
 * [identity-aware-proxy](#identity-aware-proxy)

### [dns-sync](dns-sync/)
  Sync a Cloud DNS zone with GCE resources. Instances and load balancers are added to the cloud DNS zone as they start from compute_engine_activity log events sent from a pub/sub push subscription. Can sync multiple projects to a single Cloud DNS zone.

### [labelmaker](labelmaker/)
  _labelmaker.py_ is a tool that reads key:value pairs from a json file and labels the running instance and all attached drives accordingly. It is designed to run on boot in a startup-script or userdata. Labels show up in billing exports to BigQuery, and allows organizations to run complex cost analysis over their cloud spend.

### [cloudconnect](cloudconnect/)
  CloudConnect is a package that automates the setup of dual VPN tunnels between AWS and GCP. While this connection is **NOT** meant for high throughput, low latency connections (1Gbps+), it can certainly support basic management and configuration traffic. Currently it supports the creation of both _static-routes_ and _bgp_ connections.

### [identity-aware-proxy](identity-aware-proxy/)
  This package contains samples which demonstrate how to properly
  communicate with applications behind GCP's identity aware proxy (IAP). 
