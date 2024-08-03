# Dataflow Python DataflowRunner example

This example shows the process of triggering Dataflow runners from Container
Builder.

To run the example, first build the builder as described [in the
instructions](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/dataflow-python/README.md).  Be sure to follow the instructions to permission your service account.

Then, execute the pipeline:

```
gcloud builds submit --config=cloudbuild.yaml .
```

This loads the text of Shakespeare's _King Lear_ from Google Cloud Storage and
generates some word count statistics.

