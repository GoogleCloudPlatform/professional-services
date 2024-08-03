# Make builder

This builder can be used to execute simple make targets without non-standard
dependencies.  It's intended use is for executing simple make targets that
perform tasks like preparing a workspace for a Docker build.

This assumes you have already built the `make` build step and pushed it to
`gcr.io/$PROJECT_ID/make`.

## Executing the builder

Inside this directory, run the following command:

```
gcloud builds submit --config=cloudbuild.yaml .
```

Build output will be displayed.  At the end you should see the following:

```
Hello Make!
```
