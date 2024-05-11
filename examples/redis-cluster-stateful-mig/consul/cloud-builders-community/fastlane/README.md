# fastlane

This build step runs [fastlane](https://fastlane.tools/).

It works perfectly with [Android builder](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/android).

## Build the builder

To build the builder, run the following command:

```bash
$ gcloud builds submit . --config=cloudbuild.yaml
```

## Examples

See the `examples` directory.