# Dataflow Python DirectRunner example

This example shows the Apache Beam DirectRunner in use, executing a small
pipeline inside Container Builder.

To run the example, first build the builder as described [in the
instructions](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/dataflow-python3/README.md).

Then, execute the pipeline:

```
gcloud builds submit --config=cloudbuild.yaml .
```

This small example counts the words in `/etc/hosts`, a Linux system file, and
prints some statistics.
