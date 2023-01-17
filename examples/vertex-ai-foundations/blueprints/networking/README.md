# Networking and infrastructure blueprints

The blueprints in this folder implement **typical network topologies** like hub and spoke, or **end-to-end scenarios** that allow testing specific features like on-premises DNS policies and Private Google Access.

They are meant to be used as minimal but complete starting points to create actual infrastructure, and as playgrounds to experiment with specific Google Cloud features.

## Blueprints

### Decentralized firewall management

<a href="./decentralized-firewall/" title="Decentralized firewall management"><img src="./decentralized-firewall/diagram.png" align="left" width="280px"></a> This [blueprint](./decentralized-firewall/) shows how a decentralized firewall management can be organized using the [firewall factory](../factories/net-vpc-firewall-yaml/).

<br clear="left">

### Network filtering with Squid

<a href="./filtering-proxy/" title="Network filtering with Squid"><img src="./filtering-proxy/squid.png" align="left" width="280px"></a> This [blueprint](./filtering-proxy/) how to deploy a filtering HTTP proxy to restrict Internet access, in a simplified setup using a VPC with two subnets and a Cloud DNS zone, and an optional MIG for scaling.

<br clear="left">

## HTTP Load Balancer with Cloud Armor

<a href="./glb-and-armor/" title="HTTP Load Balancer with Cloud Armor"><img src="./glb-and-armor/architecture.png" align="left" width="280px"></a> This [blueprint](./glb-and-armor/) contains all necessary Terraform modules to build a multi-regional infrastructure with horizontally scalable managed instance group backends, HTTP load balancing and Google’s advanced WAF security tool (Cloud Armor) on top to securely deploy an application at global scale.

<br clear="left">

### Hub and Spoke via Peering

<a href="./hub-and-spoke-peering/" title="Hub and spoke via peering blueprint"><img src="./hub-and-spoke-peering/diagram.png" align="left" width="280px"></a> This [blueprint](./hub-and-spoke-peering/) implements a hub and spoke topology via VPC peering, a common design where a landing zone VPC (hub) is connected to on-premises, and then peered with satellite VPCs (spokes) to further partition the infrastructure.

The sample highlights the lack of transitivity in peering: the absence of connectivity between spokes, and the need create workarounds for private service access to managed services. One such workaround is shown for private GKE, allowing access from hub and all spokes to GKE masters via a dedicated VPN.

<br clear="left">

### Hub and Spoke via Dynamic VPN

<a href="./hub-and-spoke-vpn/" title="Hub and spoke via dynamic VPN"><img src="./hub-and-spoke-vpn/diagram.png" align="left" width="280px"></a> This [blueprint](./hub-and-spoke-vpn/) implements a hub and spoke topology via dynamic VPN tunnels, a common design where peering cannot be used due to limitations on the number of spokes or connectivity to managed services.

The blueprint shows how to implement spoke transitivity via BGP advertisements, how to expose hub DNS zones to spokes via DNS peering, and allows easy testing of different VPN and BGP configurations.

<br clear="left">

### ILB as next hop

<a href="./ilb-next-hop/" title="ILB as next hop"><img src="./ilb-next-hop/diagram.png" align="left" width="280px"></a> This [blueprint](./ilb-next-hop/) allows testing [ILB as next hop](https://cloud.google.com/load-balancing/docs/internal/ilb-next-hop-overview) using simple Linux gateway VMS between two VPCs, to emulate virtual appliances. An optional additional ILB can be enabled to test multiple load balancer configurations and hashing.

<br clear="left">

### Nginx-based reverse proxy cluster

<a href="./nginx-reverse-proxy-cluster/" title="Nginx-based reverse proxy cluster"><img src="./nginx-reverse-proxy-cluster/reverse-proxy.png" align="left" width="280px"></a> This [blueprint](./nginx-reverse-proxy-cluster/) how to deploy an autoscaling reverse proxy cluster using Nginx, based on regional Managed Instance Groups. The autoscaling is driven by Nginx current connections metric, sent by Cloud Ops Agent.

<br clear="left">

### DNS and Private Access for On-premises

<a href="./onprem-google-access-dns/" title="DNS and Private Access for On-premises"><img src="./onprem-google-access-dns/diagram.png" align="left" width="280px"></a> This [blueprint](./onprem-google-access-dns/) uses an emulated on-premises environment running in Docker containers inside a GCE instance, to allow testing specific features like DNS policies, DNS forwarding zones across VPN, and Private Access for On-premises hosts.

The emulated on-premises environment can be used to test access to different services from outside Google Cloud, by implementing a VPN connection and BGP to Google CLoud via Strongswan and Bird.

<br clear="left">

### Calling a private Cloud Function from on-premises

<a href="./private-cloud-function-from-onprem/" title="Private Cloud Function from On-premises"><img src="./private-cloud-function-from-onprem/diagram.png" align="left" width="280px"></a> This [blueprint](./private-cloud-function-from-onprem/) shows how to invoke a [private Google Cloud Function](https://cloud.google.com/functions/docs/networking/network-settings) from the on-prem environment via a [Private Service Connect endpoint](https://cloud.google.com/vpc/docs/private-service-connect#benefits-apis).

<br clear="left">

### Calling on-premise services through PSC and hybrid NEGs

<a href="./psc-hybrid/" title="Hybrid connectivity to on-premise services thrugh PSC"><img src="./psc-hybrid/diagram.png" align="left" width="280px"></a> This [blueprint](./psc-hybrid/) shows how to privately connect to on-premise services (IP + port) from GCP, leveraging [Private Service Connect (PSC)](https://cloud.google.com/vpc/docs/private-service-connect) and [Hybrid Network Endpoint Groups](https://cloud.google.com/load-balancing/docs/negs/hybrid-neg-concepts).

<br clear="left">

### Shared VPC with GKE and per-subnet support

<a href="./shared-vpc-gke/" title="Shared VPC with GKE"><img src="./shared-vpc-gke/diagram.png" align="left" width="280px"></a> This [blueprint](./shared-vpc-gke/) shows how to configure a Shared VPC, including the specific IAM configurations needed for GKE, and to give different level of access to the VPC subnets to different identities.

It is meant to be used as a starting point for most Shared VPC configurations, and to be integrated to the above blueprints where Shared VPC is needed in more complex network topologies.

<br clear="left">
