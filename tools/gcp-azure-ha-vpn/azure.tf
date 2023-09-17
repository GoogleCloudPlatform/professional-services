/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

# Azure existing virtual network and subnet
data "azurerm_virtual_network" "azure_vnet" {
  name                = var.azure_vnet_name
  resource_group_name = var.azure_resource_group
}

data "azurerm_subnet" "azure_gw_subnet" {
  name                 = "GatewaySubnet"
  resource_group_name  = var.azure_resource_group
  virtual_network_name = data.azurerm_virtual_network.azure_vnet.name
}

# Azure Public IP addresses
resource "azurerm_public_ip" "azure_vpn_gateway_public_ip_1" {
  name                = "azure-vpn-gateway-public-ip-1"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = contains(var.azure_vpn_allowed_az_skus, var.azure_vpn_sku) ? ["1", "2", "3"] : []
}

resource "azurerm_public_ip" "azure_vpn_gateway_public_ip_2" {
  name                = "azure-vpn-gateway-public-ip-2"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = contains(var.azure_vpn_allowed_az_skus, var.azure_vpn_sku) ? ["1", "2", "3"] : []
}

# Azure VPN Gateway and connections
resource "azurerm_virtual_network_gateway" "azure_vpn_gateway" {
  name                = "azure-vpn-gateway"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group

  type     = "Vpn"
  vpn_type = "RouteBased"

  active_active = true
  enable_bgp    = true
  sku           = var.azure_vpn_sku

  ip_configuration {
    name                          = "vnetGatewayConfig1"
    private_ip_address_allocation = "Dynamic"
    subnet_id                     = data.azurerm_subnet.azure_gw_subnet.id
    public_ip_address_id          = azurerm_public_ip.azure_vpn_gateway_public_ip_1.id
  }

  ip_configuration {
    name                          = "vnetGatewayConfig2"
    private_ip_address_allocation = "Dynamic"
    subnet_id                     = data.azurerm_subnet.azure_gw_subnet.id
    public_ip_address_id          = azurerm_public_ip.azure_vpn_gateway_public_ip_2.id
  }

  bgp_settings {
    asn         = var.azure_bgp_asn
    peer_weight = 100

    peering_addresses {
      ip_configuration_name = "vnetGatewayConfig1"
      apipa_addresses       = ["169.254.21.1"]
    }

    peering_addresses {
      ip_configuration_name = "vnetGatewayConfig2"
      apipa_addresses       = ["169.254.22.1"]
    }

  }

}

resource "azurerm_local_network_gateway" "gcp_gw1" {
  name                = "gcp-local-network-gateway-1"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group

  gateway_address = google_compute_ha_vpn_gateway.target_gateway.vpn_interfaces[0].ip_address

  bgp_settings {
    asn                 = var.gcp_bgp_asn
    bgp_peering_address = google_compute_router_peer.router1_peer1.ip_address
  }
}

resource "azurerm_local_network_gateway" "gcp_gw2" {
  name                = "gcp-local-network-gateway-2"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group

  gateway_address = google_compute_ha_vpn_gateway.target_gateway.vpn_interfaces[1].ip_address

  bgp_settings {
    asn                 = var.gcp_bgp_asn
    bgp_peering_address = google_compute_router_peer.router1_peer2.ip_address
  }
}

resource "azurerm_virtual_network_gateway_connection" "vpn_connection1" {
  name                = "azure-to-gcp-vpn-connection-1"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group

  type = "IPsec"

  virtual_network_gateway_id = azurerm_virtual_network_gateway.azure_vpn_gateway.id
  local_network_gateway_id   = azurerm_local_network_gateway.gcp_gw1.id
  shared_key                 = var.shared_secret

  enable_bgp = true
}

resource "azurerm_virtual_network_gateway_connection" "vpn_connection2" {
  name                = "azure-to-gcp-vpn-connection-2"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group

  type = "IPsec"

  virtual_network_gateway_id = azurerm_virtual_network_gateway.azure_vpn_gateway.id
  local_network_gateway_id   = azurerm_local_network_gateway.gcp_gw2.id
  shared_key                 = var.shared_secret

  enable_bgp = true
}