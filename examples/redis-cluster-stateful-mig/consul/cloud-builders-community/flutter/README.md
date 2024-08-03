# Tool builder: `gcr.io/cloud-builders/flutter`

This Container Builder build step runs the [`flutter`](https://flutter.io/) binary.
[`flutter`](https://flutter.io/) is is an app SDK for crafting high-quality native interfaces on iOS and Android in record time.

### When to use this builder

The `gcr.io/cloud-builders/flutter` build step should be used when you want to build
`apk` binary from flutter code.

## Examples

You can build the hello world example by running those commands inside the examples directory:

    $ gcloud builds submit . --config=cloudbuild.yaml

## Building this builder

To build this builder, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml
