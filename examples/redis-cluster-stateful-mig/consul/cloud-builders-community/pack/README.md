# Pack

[pack](https://github.com/buildpack/pack) is the CLI for building apps using [Cloud Native Buildpacks](https://buildpacks.io).

This build step invokes `pack` commands in [Google Cloud Build](cloud.google.com/cloud-build/).

Arguments passed to this builder will be passed to `pack` directly, allowing
callers to run [any pack
command](https://buildpacks.io/docs/using-pack/).

## Usage:

To build a Docker image from sources:

```
steps:
- name: gcr.io/$PROJECT_ID/pack
  args: ["build", "--builder", "heroku/buildpacks:18", "gcr.io/$PROJECT_ID/sample:tag"]
```
