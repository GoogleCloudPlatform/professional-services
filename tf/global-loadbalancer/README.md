# Global GCP LoadBalancer
This module allows you to create HTTP and/or HTTPS GLB as well as TCP GLB. In comparison with other similar modules this one solves named ports issue, supports TCP GLB and is more configurable in general.

## Prerequisites
This module relies on **gcloud** utility. Therefore it should be installed and configured properly for the user from which Terraform is run. This user should be authenticated with any supported method. The reason for such a stretch is that TF does not work with Named Ports of Instance Groups.

## Example
```ruby
module "glb" {
  source           = "GoogleCloudPlatform/professional-services/tf/global-loadbalancer"
  name             = "demo-service"
  project          = "gke-demos"
  instance_groups  = ["gke-demo2-default-pool-3333-grp:us-east1-b",
                      "gke-demo1-default-pool-4444-grp:us-east1-b"]
  details          = {
    name        = "demoservice" # unique port name per service
    protocol    = "HTTP" # HTTP allows you to create either
                         # HTTP lb or HTTPS lb or both at the same time
                         # TCP allows you to create TCP lb only
    http_both   = true   # with true HTTPS and HTTP endpoints will be created
                         # make sure that certificate variable is set
                         # With false only HTTP or HTTPS endpoint will be created
                         # depending on certificates variable
                         # For TCP loadbalancer this variable should be false
    port        = "30808" # NodePort of your service
    health_path = "/"     # HealthCheck path
    timeout     = "10"    # HealthCheck timeout
    public_port = "80,443" # 1st port corresponds to either HTTP or TCP
                           # depending on protocol variable
                           # 2nd port corresponds to HTTPS
                           # TCP ports are constrained to the following ports:
                           # 25, 43, 110, 143, 195, 443, 465, 587, 700, 993, 995, 1883, 5222
  }
  backends         = [
    {group          = "projects/gke-demos/zones/us-east1-b/instanceGroups/gke-demo2-default-pool-3333-grp:us-east1-b"
     balancing_mode = "RATE"
     max_rate       = 1},
    {group          = "projects/gke-demos/zones/us-east1-b/instanceGroups/gke-demo1-default-pool-4444-grp:us-east1-b"
     balancing_mode = "RATE"
     max_rate       = 1}]
  # You can specify empty array for certificates if you create HTTP or TCP GLB
  certificates = ["projects/gke-demos/global/sslCertificates/demo"]
}
```