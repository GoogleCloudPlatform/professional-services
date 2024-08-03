# docker-reuse

The `docker-reuse` builder uses the standard `docker` builder under the hood
and has the same function: building a Docker image and pushing it to the
registry.  The difference is that `docker-reuse` also:

1.  computes a tag that uniquely identifies the exact set of sources that go
    into the image;
2.  skips the image build step entirely if an image with that tag already
    exists in the repository;
3.  updates (in place) a user-provided text file by adding the computed image
    tag to all image references in that file.

## Rationale

If not a single image source has changed, reusing a previously built image
means that:

1.  Docker does not need to rebuild this image and push it to the registry,
    saving both time and bandwidth (which is especially important for Cloud
    Build because it does not preserve Docker layer cache between builds).
2.  Kubernetes or another container orchestration system does not need to
    redeploy the image (since the image tag does not change, the existing
    containers can keep running).

## Building this builder

Before using this builder in a Cloud Build config, it must be built and pushed
to your project's container registry. Run the following command in this
directory:

    gcloud builds submit .

## How to use

The provided examples best explain how to use this builder. After the builder
itself has been built, run the following command in one of the subdirectories
under the `examples` directory:

    gcloud builds submit .
