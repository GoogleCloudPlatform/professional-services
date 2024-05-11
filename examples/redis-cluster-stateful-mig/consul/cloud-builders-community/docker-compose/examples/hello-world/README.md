# Example Build
The provided `cloudbuild.yaml` simply invokes `docker-compose up` for a service that says "Hello world".

```bash
cd cloud-builders-community/docker-compose/examples/hello-world
gcloud builds submit --config=cloudbuild.yaml .
```
