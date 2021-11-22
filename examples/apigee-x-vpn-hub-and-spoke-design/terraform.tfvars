/**
 * Copyright 2021 Google LLC
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

# Rename this file to terraform.tfvars and update the below variables

gcp_org_id = "Your Org ID"
gcp_billing_id= "Your Billing Account ID"

subnet_1 = "us-east1"
subnet_2 = "us-west2"
apigee_x_project_subnet = "us-central1"
cidr_mask = 22


apigee_x_project_router1_asn = 64514
backend_project_a_router1_asn = 64515
apigee_x_project_router2_asn = 64516
backend_project_a_router2_asn = 64517

private_zone_domain = ""

peering_zone_domain_a = "" 
forwarding_server_1 = ""

project_id = "" # Replace with your project ID
backend_a_project_id = ""


region     = ""
backend_a_vpc = ""
router_asn = 64514