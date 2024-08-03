# Compodoc
This builder can be used to build documentation for your angular projects using a tool called compodoc. If you are new to compodoc [see](https://compodoc.app/) 

## Building this builder
Run the command below to build this builder

```
gcloud builds submit . --config=cloudbuild.yaml
```

## Testing the example
I used the example MVC project from compodoc github to demonstrate the use of this builder. Ideally you want to generate the documentation and push to storage bucket which is configured for static website hosting. We can easily do that by adding following snippet to cloudbuild.yaml file

```
  - name: gcr.io/cloud-builders/gsutil
    args: ['rsync', '-d', '-r', '/workspace/compodoc-demo-todomvc-angularjs/docs', 'gs://compodoc-demo-todomvc-angularjs']

```

If you are not familiar with how to configure storage bucket for static website hosting see this [link](https://cloud.google.com/storage/docs/hosting-static-website)

* Switch to examples directory and run command below

```
gcloud builds submit . --config=cloudbuild.yaml
```

