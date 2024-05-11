# The Ballerina Cloud Builders

This build step invokes the `ballerina` command provided by the [Ballerina Compiler](https://ballerina.io) distributed in [Google Cloud Build](cloud.google.com/cloud-build/).

Arguments passed to this builder will be passed to the `ballerina` command directly,
allowing callers to run [any `ballerina`
command](https://ballerina.io/learn/cli-commands/).

## Available builders

For convenience, we have included different versions of the Ballerina CLI:
- `gcr.io/$PROJECT_ID/ballerina:v1.2.7`: provides the `v1.2.7` stable branch

## Getting started

In order to use call one of these builder, simply invoke the builder (and version), for instance:

```yaml
steps:
  - name: "gcr.io/$PROJECT_ID/ballerina"
    args: ["build", "-a"]
```

See the `examples` folder for a complete example.

## Building these builders

To build these builders, run the following command in this directory:

```shell
$ gcloud builds submit . --config=cloudbuild.yaml
```
