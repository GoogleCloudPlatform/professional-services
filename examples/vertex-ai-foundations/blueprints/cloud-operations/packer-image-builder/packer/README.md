# Packer example

The following Packer example builds Compute Engine image based on Centos 8 Linux.
The image is provisioned with a sample shell scripts to update OS packages and install HTTP server.

The example uses following GCP features:

* [service account impersonation](https://cloud.google.com/iam/docs/impersonating-service-accounts)
* [Identity-Aware Proxy](https://cloud.google.com/iap/docs/using-tcp-forwarding) tunnel
<!-- BEGIN TFDOC -->

<!-- END TFDOC -->
