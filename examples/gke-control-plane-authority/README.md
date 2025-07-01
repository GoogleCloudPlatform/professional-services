# Running a GKE cluster with control plane authority features

In GKE, Google Cloud fully manages the security configuration of the control plane, including **encryption of storage at rest**, and configuring the keys and certificate authorities (CAs) that sign and verify credentials in your clusters. The control plane nodes for GKE clusters exist in projects that Google Cloud manages. For details about what Google Cloud does, see **GKE shared responsibility**.

GKE control plane authority is an optional set of visibility and control capabilities that let you verify and manage specific aspects of these fully-managed control plane nodes. These capabilities are ideal if you have requirements like the following:

* **Ideal Use Cases**: Highly regulated industries, sensitive data, or those needing enhanced visibility, compliance, or auditing.
* **Benefits**: Enhanced visibility/control, streamlined compliance, increased trust/transparency, risk mitigation, and standardized CA/key management.
* **Availability**: GA. Check GKE documentation for specific feature regional availability.

## Capabilities

### Key and Credential Management

* By default, GKE manages cluster keys and Certificate Authorities (CAs).
* Optionally through GKE control plane authority, use Cloud KMS and CA Service for self-management, enhancing control over data sovereignty, encryption, and customization. Manage signing/verification keys for Service Accounts and various CAs (cluster, etcd, aggregation).

You create the following resources for GKE to use when issuing identities:

1. **Service Account signing keys**: sign the Kubernetes ServiceAccount bearer tokens for service accounts in the cluster. These bearer tokens are JSON Web Tokens (JWTs) that facilitate Pod communication with the Kubernetes API server.
2. **Service Account verification keys**: verify the Kubernetes Service Account JWTs. This key is normally the same as the signing key, but is configured separately so that you can rotate your keys more safely.
3. **Cluster CA**: issue signed certificates for purposes like certificate signing requests (CSRs) and kubelet communication.
4. **etcd peer CA**: issue signed certificates for communication between etcd instances in the cluster.
5. **etcd API CA**: issue signed certificates for communication with the etcd API server.
6. **Aggregation CA**: issue signed certificates for enabling communication between the Kubernetes API server and extension servers.

### Access/Identity Issuance Logs

GKE control plane authority provides a comprehensive audit trail for control plane events, including direct access, identity issuance/verification, identity usage in Kubernetes, and Access Transparency.

* Audit logs in Cloud Logging track identity issuance.
* Helps maintain compliance, identify suspicious activity, and verify authorized access.
* Refer to GKE documentation for details on viewing and processing these logs.

## Example for creating a GKE cluster with control plane authority

This Terraform module creates a GKE cluster with user-managed keys for service account signing and control plane encryption purposes, with user-managed certificate authorities for the control plane, and enables the logging options for SSH and connections into the control plane. Additionally, it builds the necessary resources (keys and CAs) as well as configures the necessary permissions for use by the GKE cluster.

### How to run this example

Before you run this example, ensure:

* Request access to this feature by contacting your Google Cloud account team. GKE control plane authority is a general availability feature available for eligible Google Cloud customers.
* The required permissions are enabled to run the Terraform example.
* The specific Cloud Audit logs are enabled for tracking credential issuance and usage.
* This blueprint will provision the GKE cluster and KMS keys within the same GCP Project.
* Ensure the required variables are populated in a ```terraform.tfvars``` file or passed in as arguments in the apply command.

Sample variables file:
```
project_id             = "my-gcp-project"
org_id                 = "1234567890"
cluster_name           = "cpa-cluster"
network_project_id     = "my-gcp-project"
network                = "default"
subnetwork             = "default"
worker_service_account = "default"
```

Provision the infrastructure using the Terraform CLI:

```HCL
terraform init
terraform apply
```

## Suggested Next Steps

Once your GKE cluster is up and running with GKE control plane authority features, you can verify credential issuance and usage logs by following the documented tutorial.
