# s2i builder

This bulid step invokes `s2i` commands in [Google Cloud Build](cloud.google.com/cloud-build/)

By using this builder you are uploading a s2i builder image to your project (i.e. gcr.io/$PROJECT_ID/s2i.

You may run into authentication issue if you were running s2i on top of a image registered in your private gcr repo. One way to work around is to add a docker step in cloud build to pull that image before your s2i step.

[s2i](https://github.com/openshift/source-to-image) is a tookit and workflow for building reproducible Docker images from source code.

Arguments passed to this builder will be passed to `s2i` directly, allowing callers to build images with `s2i` directly.

## Examples

See examples in the `examples` subdirectry.
