# slackbot examples

Edit the `cloudbuild.yaml` files in this directory to include your Slack webhook URL:

```yaml
steps:
- name: 'gcr.io/$PROJECT_ID/slackbot'
  args: [ '--build', '$BUILD_ID',
          '--webhook', '<Add your webhook URL here>' ]
- name: 'gcr.io/cloud-builders/docker'
  args: [ 'build', '.', '-f', 'Dockerfile-success']
```

Three examples are provided:

* Run `gcloud builds submit . --config=cloudbuild-success.yaml` to generate a notification for a successful build
* Run `gcloud builds submit . --config=cloudbuild-failure.yaml` to generate a notification for a failed build
* Run `gcloud builds submit . --config=cloudbuild-timeout.yaml` to generate a notification for a build which times out.
