# Apigee X VPN Hub and Spoke Design
The purspose is to showcase that multiple backends can use Cloud VPN to connect to the Apigee X VPC and then connect to the Apigee Runtime. 

## Setup

### GCP Project

`apigee_x_project.tf` is for creating a GCP project and enabling all the necessary GCP APIs. 

```
compute.googleapis.com
apigee.googleapis.com
servicenetworking.googleapis.com
cloudkms.googleapis.com
dns.googleapis.com
```

### Apigee Org

`apigee_x_organization.tf` is for creating the Apigee Runtime and environments in the GCP managed service environment. Be default, the name/ID of the organization will have the same name/ID as the GCP project. 


## Networking

### VPCs 
`apigee_x_project_vpc.tf` sets up a VPC for the GCP project that the Apigee runtime can connect to via VPC peering. It also creates a VPC subnet that is reserved for Apigee runtime with /16. Please note that the VPC currently only has one subnet and when more subnets are needed later, please do not overlap the IP ranges.

`apigee_x_project_subnets.tf` creates two subnets (us-east1 and us-west2) within the Apigee VPC and one VMs in each zone for testing the connectivity. Please note that Apigee Runtime requires ssh and icmp connections. 

### VPN Gateways
In order to connect to other VPCs from the Apigee VPC, HA Tunnels are needed in this case. `apigee_x_project_router_vpn.tf` sets up a Cloud Router and VPN gateway in each zone for the Apigee X VPC. `backend_project_a.tf` creates a GCP project and a VPC for the Backend a. `backend_project_a_vpn_subnet1.tf` and `backend_project_a_vpn_subnet2.tf` will create th VPN gateway interfaces, tunnels and router peering.

_If the connections are established, you will be able to ping the VM in the same zone from the other VPC._


### DNS Peering
WIP

### Backends
WIP