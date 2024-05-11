# s2i test-ruby-app example

This `cloudbuild.yaml` invokes a `s2i build` with the test-ruby-app provided by the [s2i github readme](https://github.com/openshift/source-to-image):
```
gcloud builds submit --config=cloudbuild.yaml .
docker pull gcr.io/<your-project>/s2i-test-ruby-app
docker run --rm -i -p :8080 -t gcr.io/<your-project>/s2i-test-ruby-app
```
