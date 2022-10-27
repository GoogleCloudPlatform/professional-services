# Policy Configuration

This directory contains policy configuration that should be added to the ACM Config Sync repository.

The `cis-benchmark-bundle` contains a slightly customized version of the bundle distributed by Google. 
The base policies were fetched from https://github.com/GoogleCloudPlatform/acm-policy-controller-library/tree/master/bundles/cis-k8s-v1.5.1 on August 29th, 2022. 
Modification are added with a comment in line on the constraints.

# Policy Controller Configuration

Included is the Gatekeeper config object to configure object sync for referential policies, and to start global namespace exemptions.