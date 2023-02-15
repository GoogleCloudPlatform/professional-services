# Migrate for Compute Engine (v5) blueprints

The blueprints in this folder implement **Migrate for Compute Engine (v5)** environments for the main migration scenarios like the ones with host and target project, or with shared VPC.

They are meant to be used as minimal but complete starting points to create migration environment **on top of existing cloud foundations**, and as playgrounds to experiment with specific Google Cloud features.

## Blueprints

### M4CE on a single project

<a href="./single-project/" title="M4CE with single project"><img src="./single-project/diagram.png" align="left" width="280px"></a> This [blueprint](./single-project/) implements a simple environment for Migrate for Compute Engine (v5) where both the API backend and the migration target environment are deployed on a single GCP project.

This blueprint represents the easiest scenario to implement a Migrate for Compute Engine (v5) environment suitable for small migrations on simple environments or for product showcases. 
<br clear="left">

### M4CE with host and target projects

<a href="./host-target-projects/" title="M4CE with host and target projects"><img src="./host-target-projects/diagram.png" align="left" width="280px"></a> This [blueprint](./host-target-projects/) implements a Migrate for Compute Engine (v5) host and target projects topology where the API backend and access grants are implemented on the host project while workloads are migrated on a different target project.

This blueprint shows a complex scenario where Migrate for Compute Engine (v5) can be deployed on top of and existing HUB and SPOKE topology and the migration target projects are deployed with platform foundations.
<br clear="left">

### M4CE with Host and Target Projects and Shared VPC

<a href="./host-target-sharedvpc/" title="M4CE with host and target projects and shared VPC"><img src="./host-target-sharedvpc/diagram.png" align="left" width="280px"></a> This [blueprint](./host-target-sharedvpc/) implements a Migrate for Compute Engine (v5) host and target projects topology as described above with the support of shared VPC. 

The blueprint shows how to implement a Migrate for Compute Engine (v5) environment on top of an existing shared VPC topology where the shared VPC service projects are the target projects for the migration. 
<br clear="left">

### ESXi Connector

<a href="./esxi/" title="M4CE ESXi connector"><img src="./esxi/diagram.png" align="left" width="280px"></a> This [blueprint](./esxi/) implements a Migrate for Compute Engine (v5) environment on a VMWare ESXi cluster as source for VM migrations.

The blueprint shows how to deploy the Migrate for Compute Engine (v5) connector and implement all the security prerequisites for the migration to GCP.
