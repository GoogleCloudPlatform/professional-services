# k8s-secret-syncer

## Overview

In k8s, Secrets are only available to resources in the same namespace as the Secret itself.
This means that if multiple namespaces need to use the same Secret, the only workaround is 
to maintain a copy of the Secret in each namespace that requires it.

The *secret-syncer* tool is deployed into a k8s cluster to watch for any Secrets
created in a given namespace and copy them to specified target namespaces, allowing
one to maintain only a single copy of each Secret.

## Installation

The easiest way to install *secret-syncer* is by running the below from this directory:
```bash
./create.sh
```
This script uses `gcloud` and `kubectl` to build/push the container image for *secret-syncer*
and create a Deployment `secret-syncer` to the namespace `secrets` in the currently active k8s cluster,
along with necessary RBAC resources.

** Note that this script has only been tested on MacOS, and may need some tweaking to support 
other environments.

## Configuration

*secret-syncer* can be configured with the below environment variables.

Env Var | Description | Default
--- | --- | ---
SOURCE_NS | The namespace to copy secrets from | secrets
SOURCE_ANNO | The annotation key to look for on secrets to determine the namespaces to it copy it to -- a secret will be copied to all namespaces that (regex) match this value | ns-propagate
NS_BLACKLIST | A comma-separated list of namespaces to ignore as destinations for copying -- note that SOURCE_NS is automatically appended to this| kube-system,kube-public,default
SYNC_INTERVAL_SECONDS | The interval at which to look for and copy secrets | 300
RESOURCE_KIND | The kind of resources to copy (change at your own risk) | secret

## Example Secret

Below is an example secret that would be copied to all namespaces (excluding those in `NS_BLACKLIST`).

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-registry-credentials
  namespace: secrets
  annotations:
    ns-propagate: .*
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: [REDACTED]
```

## Notes

- *secret-syncer* does **not** delete secrets, even if they are deleted from the source namespace.
- Secrets can be modified to change annotations via `kubectl edit`.