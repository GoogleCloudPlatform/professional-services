# OPA

This build step invokes `opa` commands in [Google Cloud Build](https://cloud.google.com/cloud-build).

Arguments passed to this builder will be passed to `opa` directly, allowing
callers to run [any opa command](https://www.openpolicyagent.org/docs/latest/get-started).

See examples in the `examples` subdirectory.

## Building this builder
To build this builder, run the following command in this directory.

$ gcloud builds submit --config=cloudbuild.yaml

## Status

This is unsupported demo-ware. Use at your own risk!
