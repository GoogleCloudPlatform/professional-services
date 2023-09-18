# GCP-Azure HA VPN with BGP Terraform Configuration

This repository contains Terraform configuration to set up High Availability (HA) VPN tunnels with BGP dynamic routing between Google Cloud Platform (GCP) and Microsoft Azure.

**Disclaimer:** This interoperability Terraform configuration is designed to be minimal and straightforward, requiring minimal user input and automatically assigning public IPs. However, customers should validate its functionality by conducting their own tests.

## Before you begin

1. Go through the steps to create [GCP to Azure HA VPN Setup](https://cloud.google.com/network-connectivity/docs/vpn/tutorials/create-ha-vpn-connections-google-cloud-azure).
2. Review information about how [dynamic routing works in Google Cloud](https://cloud.google.com/network-connectivity/docs/vpn/concepts/choosing-networks-routing#dynamic-routing).
3. Review information about how [BGP works in Microsoft Azure](https://docs.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-bgp-overview).

## Table of Contents

1. [Terminology](#terminology)
2. [Topology](#topology)
3. [Prerequisites](#prerequisites)
4. [Assumptions](#assumptions)
5. [Authentication](#authentication)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [Outputs](#outputs)
9. [Contributing](#contributing)

## Terminology

- **HA VPN**: High Availability VPN is a GCP VPN offering that provides an SLA-backed managed VPN service.
- **BGP**: Border Gateway Protocol is a standardized exterior gateway protocol designed to exchange routing and reachability information among autonomous systems (AS) on the internet.
- **VPN Gateway**: A virtual network gateway that sends encrypted traffic between your virtual network and your on-premises location across a public connection.
- **VPN Tunnel**: A secure, encrypted communication channel between two VPN gateways.
- **Cloud Router**: A GCP service that dynamically exchanges routes between your VPC and on-premises networks or other VPC networks.
- **Local Network Gateway**: A resource in Azure that represents your on-premises network and is used to configure the VPN connection.

## Topology

GCP HA VPN Supports multiple [topologies](https://cloud.google.com/network-connectivity/docs/vpn/concepts/topologies). This topology using with `REDUNDANCY_TYPE` of `TWO_IPS_REDUNDANCY`.

This configuration creates the following resources:

- GCP:
  - VPN Gateway
  - Two VPN tunnels for active-active configuration
  - Cloud Router with BGP enabled
- Azure:
  - VPN Gateway with two public IP addresses for active-active configuration
  - Two VPN connections
  - Two Local Network Gateway with BGP enabled

The GCP and Azure VPN gateways are connected with two VPN tunnels to provide an active-active HA configuration. BGP is used for dynamic routing between GCP and Azure.

![ha-vpn-google-cloud-to-azure](https://user-images.githubusercontent.com/7136208/233800865-043c13d0-df3f-4adc-b9aa-156766e55cb4.svg)

## Prerequisites

1. [Install Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli) (v1.3+ is required).
2. [Install Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (optional, for authentication purposes).
3. [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) (optional, for authentication purposes).

## Assumptions

1. Required roles are assigned to respective user (who will run the Terraform code) on GCP and Azure.
2. VPC in GCP and VNET in Azure is already created.
3. **GatewaySubnet** in Azure VNET is already created.
4. Traffic is allowed on Azure NSG for Virtual Network Gateway.
5. Traffic is allowed on GCP Firewall for VPN.

## Authentication

Use CLI or other methods to log in to GCP(gcloud) and Microsoft Azure(az cli).

## Configuration

Update `terraform.tfvars` file in the same directory as the Terraform configuration files with the following variables:

| Variable                | Description                             | Required | Default |
|-------------------------|-----------------------------------------|----------|---------|
| gcp_project_id          | The GCP project ID                      | Yes      |         |
| gcp_region              | The GCP region                          | Yes      |         |
| gcp_vpc_name            | The GCP VPC name                        | Yes      |         |
| gcp_router_name         | The GCP VPN router name                 | Yes      |         |
| gcp_bgp_asn             | The GCP VPC Router ASN                  | Yes      |  65534  |
| shared_secret           | The shared secret for the VPN connection| Yes      |         |
| azure_subscription_id   | The Azure subscription ID               | Yes      |         |
| azure_vnet_name         | The Azure VNET Name                     | Yes      |         |
| azure_region            | The Azure region                        | Yes      |         |
| azure_resource_group    | The Azure resource group                | Yes      |         |
| azure_bgp_asn           | The Azure BGP ASN                       | Yes      |  65515  |
| azure_vpn_sku           | The Azure VPN Sku                       | Yes      |  VpnGw1 |
| azure_vpn_allowed_az_skus           | The Azure VPN Availability Zones Allowed SKUs                       | No      |  ["VpnGw1AZ", "VpnGw2AZ", "VpnGw3AZ", "VpnGw4AZ", "VpnGw5AZ"] |

Replace the values as per your need.

## Usage

1. Initialize Terraform:

    ```bash
    terraform init
    ```

2. Plan and apply the Terraform configuration:

    ```bash
    terraform plan
    terraform apply
    ```

3. After the infrastructure is created, Terraform will output the GCP VPN Gateway IP, GCP VPN Tunnel Peer IPs, Azure VPN Gateway Public IPs, and Azure VPN Tunnel Peer IPs.

4. To clean up the resources, run:

    ```bash
    terraform destroy
    ```

## Outputs

The following output variables are defined in `output.tf`:

- GCP VPN Gateway IP
- GCP VPN Tunnel Peer IPs
- Azure VPN Gateway Public IPs
- Azure VPN Tunnel Peer IPs

## Contributing

If you have suggestions or improvements, feel free to submit a pull request or create an issue.
