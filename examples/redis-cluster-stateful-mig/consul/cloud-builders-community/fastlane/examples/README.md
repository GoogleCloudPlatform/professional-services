# Android + Fastlane example

This directory contains code to run a simple Android build and Fastlane actions.

This assumes you have already built the `fastlane` and `android` build steps and pushed them to
`gcr.io/$PROJECT_ID/fastlane` and `gcr.io/$PROJECT_ID/android` separately.

## Executing the builder

To run this example, you first need to add Fastlane config, and required credentials as documented in [official guide](https://docs.fastlane.tools/getting-started/android/setup/). Then update `cloudbuild.yml` with the lane name, and add it to your project repo.

Inside the repo, run the following command:

```bash
gcloud builds submit --config=cloudbuild.yaml .
```