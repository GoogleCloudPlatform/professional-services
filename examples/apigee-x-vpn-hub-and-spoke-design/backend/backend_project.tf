### Create 3 identical backend project and each with a VPC that has a DNS peering with the apigee-x-vpc
### The VPC has 2 subnets us-east1 and us-west2 
 
# resource "google_project" "backend-project-a" {
#   name       = "backend-project-a"
#   project_id = "backend-project-a"
#   org_id     = "174736863632"
# }



# resource "google_compute_network" "backend-project-a-vpc" {
#   name                    = "backend-project-a-vpc"
#   auto_create_subnetworks = false
#   project_id              = google_project.backend-project-a.id
# }

# resource "google_compute_subnetwork" "backend-project-a-us-east1-subnet" {
#   name          = "us-east1-subnet"
#   ip_cidr_range = "10.2.0.0/16"
#   region        = "us-east1"
#   network       = google_compute_network.backend-project-a-vpc.id
# }

# resource "google_compute_subnetwork" "backend-project-a-us-west2-subnet" {
#   name          = "us-west2-subnet"
#   ip_cidr_range = "10.2.0.0/16"
#   region        = "us-west2"
#   network       = google_compute_network.backend-project-a-vpc.id
# }

# resource "google_project" "backend-project-b" {
#   name       = "backend-project-b"
#   project_id = "backend-project-b"
#   org_id     = "174736863632"
# }

# resource "google_compute_network" "backend-project-b-vpc" {
#   name                    = "backend-project-b-vpc"
#   auto_create_subnetworks = false
#   project_id              = google_project.backend-project-b.id
# }

# resource "google_compute_subnetwork" "backend-project-b-us-east1-subnet" {
#   name          = "us-east1-subnet"
#   ip_cidr_range = "10.2.0.0/16"
#   region        = "us-east1"
#   network       = google_compute_network.backend-project-b-vpc.id
# }

# resource "google_compute_subnetwork" "backend-project-b-us-west2-subnet" {
#   name          = "us-west2-subnet"
#   ip_cidr_range = "10.2.0.0/16"
#   region        = "us-west2"
#   network       = google_compute_network.backend-project-b-vpc.id
# }

# resource "google_project" "backend-project-c" {
#   name       = "backend-project-c"
#   project_id = "backend-project-c"
#   org_id     = "174736863632"
# }
# resource "google_compute_network" "backend-project-c-vpc" {
#   name                    = "backend-project-c-vpc"
#   auto_create_subnetworks = false
#   project_id              = google_project.backend-project-c.id
# }

# resource "google_compute_subnetwork" "backend-project-c-us-east1-subnet" {
#   name          = "us-east1-subnet"
#   ip_cidr_range = "10.2.0.0/16"
#   region        = "us-east1"
#   network       = google_compute_network.backend-project-c-vpc.id
# }

# resource "google_compute_subnetwork" "backend-project-c-us-west2-subnet" {
#   name          = "us-west2-subnet"
#   ip_cidr_range = "10.2.0.0/16"
#   region        = "us-west2"
#   network       = google_compute_network.backend-project-c-vpc.id
# }