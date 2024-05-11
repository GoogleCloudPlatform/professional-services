# Singularity

This build step invokes `singularity` commands in [Google Cloud Build](cloud.google.com/cloud-build/).

Arguments passed to this builder will be passed to `singularity` directly,
allowing callers to run [any singularity
command](https://www.sylabs.io/guides/3.0/user-guide/cli.html).

