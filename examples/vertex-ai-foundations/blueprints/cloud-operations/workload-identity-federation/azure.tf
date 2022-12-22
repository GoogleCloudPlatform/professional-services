/**
 * Copyright 2022 Google LLC
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

locals {
  username = "azureuser"
  app_name = "test-app"
}

provider "azurerm" {
  features {}
}

data "azuread_client_config" "config" {}

resource "azuread_application" "app" {
  display_name    = local.app_name
  identifier_uris = ["api://${local.app_name}"]
  app_role {
    allowed_member_types = ["Application"]
    description          = "User"
    display_name         = "User"
    enabled              = true
    id                   = "3a9a28d5-f98d-47f5-ad0b-07d919533886"
    value                = "user"
  }
}

resource "azuread_service_principal" "service_principal" {
  application_id               = azuread_application.app.application_id
  app_role_assignment_required = true
}

resource "azurerm_resource_group" "resource_group" {
  count    = var.vm_test ? 1 : 0
  name     = "resourceGroup"
  location = "West Europe"
}

resource "azurerm_virtual_network" "vnet" {
  count               = var.vm_test ? 1 : 0
  name                = "vnet"
  address_space       = ["10.0.0.0/16"]
  resource_group_name = azurerm_resource_group.resource_group[0].name
  location            = azurerm_resource_group.resource_group[0].location
}

resource "azurerm_subnet" "subnet" {
  count                = var.vm_test ? 1 : 0
  name                 = "subnet"
  resource_group_name  = azurerm_resource_group.resource_group[0].name
  virtual_network_name = azurerm_virtual_network.vnet[0].name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_public_ip" "public_ip" {
  count               = var.vm_test ? 1 : 0
  name                = "vm"
  resource_group_name = azurerm_resource_group.resource_group[0].name
  location            = azurerm_resource_group.resource_group[0].location
  allocation_method   = "Static"
  sku                 = "Basic"
}

resource "azurerm_network_interface" "nic" {
  count               = var.vm_test ? 1 : 0
  name                = "nic"
  resource_group_name = azurerm_resource_group.resource_group[0].name
  location            = azurerm_resource_group.resource_group[0].location

  ip_configuration {
    name                          = "ipconfig"
    subnet_id                     = azurerm_subnet.subnet[0].id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.public_ip[0].id
  }
}

resource "azurerm_network_security_group" "security_group" {
  count               = var.vm_test ? 1 : 0
  name                = "security-group"
  resource_group_name = azurerm_resource_group.resource_group[0].name
  location            = azurerm_resource_group.resource_group[0].location

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_interface_security_group_association" "security_group_association" {
  count                     = var.vm_test ? 1 : 0
  network_interface_id      = azurerm_network_interface.nic[0].id
  network_security_group_id = azurerm_network_security_group.security_group[0].id
}

resource "tls_private_key" "private_key" {
  count     = var.vm_test ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}


resource "azurerm_linux_virtual_machine" "vm" {
  count                 = var.vm_test ? 1 : 0
  name                  = "vm"
  resource_group_name   = azurerm_resource_group.resource_group[0].name
  location              = azurerm_resource_group.resource_group[0].location
  network_interface_ids = [azurerm_network_interface.nic[0].id]
  size                  = "Standard_DS1_v2"

  os_disk {
    name                 = "disk"
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }

  computer_name                   = "vm"
  admin_username                  = "azureuser"
  disable_password_authentication = true
  custom_data                     = filebase64("${path.module}/setup.sh")

  admin_ssh_key {
    username   = local.username
    public_key = tls_private_key.private_key[0].public_key_openssh
  }

  identity {
    type = "SystemAssigned"
  }

}

resource "azuread_app_role_assignment" "app_role_assignment" {
  count               = var.vm_test ? 1 : 0
  app_role_id         = azuread_application.app.app_role_ids["user"]
  principal_object_id = azurerm_linux_virtual_machine.vm[0].identity[0].principal_id
  resource_object_id  = azuread_service_principal.service_principal.object_id
}
