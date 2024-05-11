# s2i hello-python example

This `cloudbuild.yaml` invokes a `s2i build` with the hello-python example provided by the [s2i github readme](https://github.com/openshift/source-to-image):
```
gcloud builds submit --config=cloudbuild.yaml .
docker pull gcr.io/<your-project>/s2i-hello-python
docker run -p :8080 gcr.io/<your-project>/s2i-hello-python
```
