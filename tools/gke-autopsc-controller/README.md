# GKE AutoPSC Controller

This is a simple K8S controller, that allows you to create ServiceAttachments for [Private Service Connect](https://cloud.google.com/vpc/docs/configure-private-service-connect-producer) for Gateways from K8S [Gateway API](https://gateway-api.sigs.k8s.io/). In GKE Gateways are backed with Internal HTTPS Load Balancer forwarding rules. Thank you to the contributors from [GKE autoneg Controller](https://github.com/GoogleCloudPlatform/gke-autoneg-controller), this code is heavily leaning on their existing work. Autopsc Controller is not using it's own CRDs but works with annotations on the Gateway object.

You can find a `yaml` resource descriptor and a `shell` script to deploy Autopsc Controller onto your GKE cluster in the `./deploy` folder. You will need to replace the project ID placeholder (`GOOGLE_CLOUD_PROJECT`) in the `autopsc.yaml` with the value of your project in order for Workload Identity to properly work.

In order to be able to create a Service Attachment for the forwarding rule of a Gateway, the following prerequisites need to be checked for the Gateway:
* The Gateway needs to `allow global access`, you can configure this using a `GatewayPolicy`
* The Gateway needs a named IP address, with purpose `GCE_ENDPOINT` in a subnet that has purpose `PRIVATE`
* You will need to private subnet with purpose `PRIVATE_SERVICE_CONNECT` as traffic source for the PSC traffic
* The Gateway needs to terminate TLS

You can find a complete example in the `/example` folder.

The following annotations can be used to control the configuration of the managed `ServiceAttachment`:

| Name                                                      | Mandatory | Description                                                                                                                                                             |
|-----------------------------------------------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| controller.autonpsc.dev/psc-serviceattachment             | Yes       | This annotation contains the name of the ServiceAttachment that should be created and managed by autopsc.                                                               |
| controller.autonpsc.dev/psc-serviceattachment-natsubnets  | Yes       | The self-link to the VPC subnets, that are used as "traffic source" for PSC.                                                                                            |
| controller.autonpsc.dev/psc-serviceattachment-allowed     | No        | A comma-separated list of project IDs that are allowed to connect to the ServiceAttachment. An empty annotation sets the connection preference to  `ACCEPT_AUTOMATIC`.  |
| controller.autonpsc.dev/psc-serviceattachment-domainNames | No        | A comman-separated list of domain names.                                                                                                                                |
# License
Apache License 2.0

# Disclaimer
This is not an official Google project.