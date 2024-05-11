# Hello Boot example

This directory contains code to run a proof-of-concept using `boot`.

This assumes you have already built the `boot` build step and pushed it to
`gcr.io/$PROJECT_ID/boot`.

## Executing the builder

Inside this directory, run the following command:

```
gcloud builds submit --config=cloudbuild.yaml .
```

Build output will be displayed.  At the end you should see the following:

```
Congratulations! You're running Clojure code via Boot.
```

