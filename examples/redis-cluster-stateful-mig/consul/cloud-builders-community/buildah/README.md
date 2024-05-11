# Buildah

This builder builds container images using Project Atomic's
[Buildah](https://github.com/projectatomic/buildah) tool, which is capable of
building and pushing container images without requiring access to the Docker
daemon socket.

This builder can be built and pushed to your GCR repository by running

```
gcloud builds submit --config=cloudbuild.yaml
```

in this directory
