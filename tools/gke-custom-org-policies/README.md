# Custom GKE Organizational Policies

The Center for Internet Security (CIS) releases benchmarks for best practice security recommendations. The CIS Kubernetes Benchmark is a set of recommendations for configuring Kubernetes to support a strong security posture. The Benchmark is tied to a specific Kubernetes release. This repository is an attempt to provide sample organizational policies that could be enforced in order to comply with the [GKE portion](https://cloud.google.com/kubernetes-engine/docs/concepts/cis-benchmarks#default_values_on) of CIS benchmarks.

## Repository Structure
The policies in this repo are structured according to the enumeration convention on the [Default values on GKE](https://cloud.google.com/kubernetes-engine/docs/concepts/cis-benchmarks#default_values_on) section of [CIS benchmark documentation for Kubernetes](https://cloud.google.com/kubernetes-engine/docs/concepts/cis-benchmarks). 
Each folder contains: 
```
- policy_number_constraint.yaml 
- policy_number_policy.yaml
```
## Testing and Customizing Organizational Policies
Custom Organization Policies can be configured on CREATE or UPDATE methods on any field in the Cluster or NodePool resource of the Google Kubernetes Engine API v1, except for the following fields:
- projects.locations.clusters.tpuConfig.enabled (Preview)
- projects.locations.clusters.tpuConfig.ipv4CidrBlock (Preview)
- projects.locations.clusters.masterAuth.clientKey
- projects.locations.clusters.masterAuth.password

**Note**: Some configuration settings do not support all methods (E.g., Private / Public Nodes configuration is immutable and cannot be changed after cluster provisioning using the UPDATE method) and it is important to identify if the above list of custom GKE organization policies

**Example below shows how a custom Organization Policy constraint can be created and enforced for GKE private clusters:**
1. Save the below yaml constraint (E.g., gke_privatenodes_constraint.yaml)
    ```
    name: organizations/[ORGANIZATIONID]/customConstraints/custom.gkeprivatenodes
    resourceTypes:
    - container.googleapis.com/Cluster
    methodTypes:
    - CREATE
    - UPDATE
    condition: resource.privateClusterConfig.enablePrivateNodes == false
    actionType: DENY
    displayName: enforcegkeprivatenodes
    description: Custom Constraint to enforce GKE private nodes
    ```
2. Set the custom constraint using the below gcloud command
    `gcloud org-policies set-custom-constraint ./gke_privatenodes_constraint.yaml`
3. Save the below yaml policy (gke_privatenodes_policy.yaml, name must match from the policy yaml created in step 1)
    ```
    name: organizations/[ORGANIZATIONID]/policies/custom.gkeprivatenodes
    spec:
    rules:
    - enforce: true 
    ```
    Organizational policies can also be applied at the project level. Here's an example policy yaml to apply `gke_privatenodes_constraint.yaml` to a project
    ```
    name: projects/[PROJECT_ID]/policies/custom.gkeprivatenodes
    spec:
    rules:
    - enforce: true
    ```
4. Enforce the policy defining the custom constraint using the command below
`gcloud org-policies set-policy ./gke_privatenodes_policy.yaml`
Review the [public docs page](https://cloud.google.com/kubernetes-engine/docs/how-to/custom-org-policies) on GKE custom organization policies to learn more

## Applying Organizational Policies from this repository
1. Replace **`[ORGANIZATIONID]`** in constraint file with organization ID of the org you are trying to apply the policy to. For example if your organization id is `12345678910`,
    <pre>
    name: organizations/<b>[ORGANIZATIONID]</b>/customConstraints/custom.gkeprivatenodes
    resourceTypes:
    - container.googleapis.com/Cluster
    methodTypes:
    - CREATE
    - UPDATE
    condition: resource.privateClusterConfig.enablePrivateNodes == false
    actionType: DENY
    displayName: enforcegkeprivatenodes
    description: Custom Constraint to enforce GKE private nodes
    </pre>
    becomes
    <pre>
    name: organizations/<b>12345678910</b>/customConstraints/custom.gkeprivatenodes
    resourceTypes:
    - container.googleapis.com/Cluster
    methodTypes:
    - CREATE
    - UPDATE
    condition: resource.privateClusterConfig.enablePrivateNodes == false
    actionType: DENY
    displayName: enforcegkeprivatenodes
    description: Custom Constraint to enforce GKE private nodes
    </pre>
2. Set the custom constraint using the below gcloud command
    `gcloud org-policies set-custom-constraint CONSTRAINT_PATH` eg. `gcloud org-policies set-custom-constraint ./gke_privatenodes_constraint.yaml`
3. Next replace **`[RESOURCE_HIERARCHY]`** with the location of the new policy, which affects the scope of enforcement. . For example, if you wanted to enforce the policy in a specific project, use `projects/PROJECT_ID`. To enforce the policy in a specific organization, use `organizations/ORGANIZATION_ID`.  
    For instance, if you want to enforce the constraint above at the project level to a project with project id: custom-org-policy-test,
    <pre>
    name: <b>\[RESOURCE_HIERARCHY]</b>/policies/custom.gkeprivatenodes
    spec:
    rules:
    - enforce: true 
    </pre>
    becomes
    <pre>
    name: <b>projects/custom-org-policy-test</b>/policies/custom.gkeprivatenodes
    spec:
    rules:
    - enforce: true
    </pre>
Review the [public docs page](https://cloud.google.com/kubernetes-engine/docs/how-to/custom-org-policies) on GKE custom organization policies to learn more

## Automation
### Scripts for bulk applying org policies
Several scripts are included in this repo to in application of org policies. Here's how to run them.
- **[run.sh]()**: This script allows you to apply all org policy constraints and policy files in different fashions. It takes arguments `organization_id`, `type`, and `spec`. The `type` parameter specifies whether you want to apply just constraint files (`constraints`) or policy files (`policies`) or both(`all`). The spec parameter specifies whether to apply in dry run mode (`dryRunSpec`) or regular mode (`spec`)

    - To apply all constraints: `./run.sh organization_id constraints`
    - To apply all policies in dry run mode: `./run.sh organization_id policies dryRunSpec`
    - To apply all policies in regular mode: `./run.sh organization_id policies spec`
    - Apply constraints and policies at the same time in dry run mode: `./run.sh organization_id all dryRunSpec`
    - Apply constraints and policies at the same time in dry regular mode: `./run.sh organization_id all spec`

    **Note**: It's important that no additional files are added in the policy folders for this script to run correctly.

