# container-diff

This builder runs the
[`container-diff`](https://github.com/GoogleCloudPlatform/container-diff) tool,
which can analyze and diff images in a remote repository or in a local daemon.

This can be useful in debugging differences between images, and can help produce
release notes on new image releases.

## Building this image

To build this image and push it to your project's registry, run the following
command from within the `container-diff` directory:

```
gcloud builds submit . --config=cloudbuild.yaml
```

This image is built using the
[`bazel`](https://github.com/GoogleCloudPlatform/cloud-builders/tree/master/bazel)
builder and Bazel's
[`rules_docker`](https://github.com/bazelbuild/rules_docker/) support.

The image is based on an Ubuntu base image and contains the latest release of
the `container-diff` static binary.

## Example usage

```yaml
steps:
# Build a new image.
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT/image', '.']
# Diff the local image against the image currently in the remote repository.
# Differences in installed apt packages (if any) will be printed to the build
# logs.
- name: 'gcr.io/$PROJECT_ID/container-diff'
  args:
  - 'diff'
  - 'remote://gcr.io/$PROJECT_ID/image'
  - 'daemon://gcr.io/$PROJECT_ID/image'

# Push the new image.
images: ['gcr.io/$PROJECT_ID/image']
```

See [the `container-diff`
documentation](https://github.com/GoogleCloudPlatform/container-diff) for more
information about additional available options.
