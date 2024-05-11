# Replicated Vendor CLI

This build step invokes `replicated` command line tool in [Google Cloud Build](https://cloud.google.com/cloud-build).

Arguments passed to this builder will be passed to `replicated` directly.

See [replicated tool documentation](https://github.com/replicatedhq/replicated) for more details and usage examples.

As you know, the interaction with Replicated Vendor requires an API token. It is recommended to store the token on [KMS](https://cloud.google.com/kms/), then use it as an [encrypted resource](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials). See [example](./examples/cloudbuild.yaml).

## Examples
Please check [`examples`](./examples)

[examples/replicated.yaml](examples/replicated.yaml) is borrowed from [replicatedhq/replicated-starter-kubernetes](https://github.com/replicatedhq/replicated-starter-kubernetes/blob/master/replicated.yaml).
