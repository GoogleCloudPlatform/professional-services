# Singularity example

This `cloudbuild.yaml` invokes a `singularity build` to build a singularity image file (SIF) from lolcow.def:
```
gcloud builds submit --config=cloudbuild.yaml .
```
