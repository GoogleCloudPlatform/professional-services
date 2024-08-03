# protoc

This tool defines a custom build step that allows the Cloud Build worker to run the
[protocol buffer compiler](https://github.com/protocolbuffers/protobuf), `protoc`.

## When to use this builder

The `gcr.io/cloud-builders/protoc` build step should be used when you want to run
`protoc`. It may be used as part of a Google Cloud Build process.

## Building this builder

You will need to build this Builder and push it to a container registry before you may use it. 
To build and push to Google Container Registry, run the following command in this directory:

```bash
gcloud builds submit . --config=cloudbuild.yaml
```

If you wish to specify a different version or architecture for the build, run the following:

```bash
gcloud builds submit . --config=cloudbuild.yaml --substitutions=_VERS=${VERS},_ARCH=${ARCH}
```

Where `${VERS}` and `${ARCH}` are defined to contain values for the release and architecture as listed on:

https://github.com/protocolbuffers/protobuf/releases

**NB** Due to inconsistent handling of URLs for release candidates, the build will fail when 
referencing these ([issue](https://github.com/protocolbuffers/protobuf/issues/6522)).

## Referencing protoc compiler plugins

It is common to augment `protoc` with language-specific compiler plugins. Here is a list of plugins:

https://github.com/protocolbuffers/protobuf/blob/master/docs/third_party.md

These plugins take the form `protoc-gen-[[NAME]]`. For example, the plugin to generate Golang 
is called `protoc-gen-go`

The usual command takes the form:

```bash
protoc \
--proto-path=... \
- --go_out=plugins=grpc:...
```

But this assumes that `protoc-gen-go` is accessible in `${PATH}` and configuring `${PATH}` 
is challenging across containers.

The solution is to install the compiler plugins either to `/workspace` or using `volumes:` 
and then reference it using `--plugin`

E.g.:

```
- name: gcr.io/${PROJECT_ID}/protoc
  args:
  - --proto_path=...
  - --plugin=protoc-gen-go=/workspace/plugins/protoc-gen-go
  - --go_out=plugins=grpc:...
    - /workspace/protos/my.proto
```

In this example, `protoc-gen-go` must have been installed during a previous step into `/workspace/plugins`.
