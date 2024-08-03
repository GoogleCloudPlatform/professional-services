# Klar
This builder allows you to use Klar to integrate Clair and Docker Registry (supports both Clair API v1 and v3).

To use this builder, you should configure a minimum number of variables as shown in the [example](./examples/cloudbuild.yaml). 

## Building this builder
Run the command below to build this builder

```
gcloud builds submit . --config=cloudbuild.yaml
```
