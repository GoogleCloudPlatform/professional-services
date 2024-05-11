# Swift Version Example

This `cloudbuild.yaml` invokes  the `swift --version` command for all of the swift versions:
```
gcloud container builds submit --config=cloudbuild.yaml .
```
You should see the output of all of the swift versions supported.