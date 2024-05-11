# cron-helper

This tool sets up scheduled builds using the [Google App Engine Cron Service](https://cloud.google.com/appengine/docs/standard/go/config/cron).  This takes advantage of App Engine Standard's ability to "scale to zero" when unused.

## Getting started

Many people initiate builds on Cloud Build using `gcloud`, which uploads sources from the local directory.  However, since App Engine runs within a limited sandbox, cron builds must use either a Git repository or an archive of sources on Google Cloud Storage referenced in your `cloudbuild.yaml`.  For example, to setup a bucket and upload your sources to Google Cloud Storage, run the following:

```
export PROJECT=$(gcloud info --format='value(config.project)')
gsutil mb gs://$PROJECT-source
tar cvzf source.tar.gz [your files here]
gsutil cp source.tar.gz gs://$PROJECT-source
```

Then, to reference it in your `cloudbuild.yaml`, add the following lines:

```
source:
  storagesource:
    bucket: [your project name here]-source
    object: source.tar.gz
```

This is a special case, and the `source:` tag is not normally valid in YAML configuration.  For more information, see the [Cloud Build documentation](https://cloud.google.com/cloud-build/docs/build-config#source_code_location).

## Installing `cron-helper`

To begin, select (or create) a project, enable billing, and [install the Cloud SDK](https://cloud.google.com/sdk/downloads).  Make sure the [Cloud SDK for Go](https://cloud.google.com/appengine/docs/standard/go/download) is also installed.

Download this code and copy your Cloud Build `cloudbuild.yaml` into this directory, making any amendments to support remote sources as described above.

Next, edit `appengine/cron.yaml` to reflect how often your want your build to occur.  The full syntax reference can be found [here](https://cloud.google.com/appengine/docs/standard/go/config/cronref).  The default configuration provided will run a build once every 24 hours.

Then create an App Engine app, enable the APIs necessary, grant App Engine permissions to run builds, and grant your Cloud Build service account permissions to deploy to App Engine, write config to App Engine Datastore, and schedule cron jobs:

```
gcloud -q app create --region=us-central
gcloud services enable cloudbuild.googleapis.com
gcloud services enable appengine.googleapis.com

export PROJECT=$(gcloud info --format='value(config.project)')
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format 'value(projectNumber)')
export AE_SA_EMAIL=$PROJECT@appspot.gserviceaccount.com
export CB_SA_EMAIL=$PROJECT_NUMBER@cloudbuild.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$AE_SA_EMAIL --role='roles/cloudbuild.builds.editor'
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$CB_SA_EMAIL --role='roles/datastore.owner'  
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$CB_SA_EMAIL --role='roles/appengine.appAdmin'
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$CB_SA_EMAIL --role='roles/cloudscheduler.admin'
```

Then, to install the helper:

```
gcloud builds submit --config=upload.yaml .
```

Builds will now run at the frequency you specified.  To view your job or start it manually, visit the Cloud console [Task Queues page](https://console.cloud.google.com/appengine/taskqueues/cron).  Build logs are available in the [Build History page](https://console.cloud.google.com/gcr/builds).

## Notes and Caveats

`cron-helper` currently uses the default service in App Engine standard.  If you already have an App Engine application installed in your project, you will need to adjust the configuration to install as a different service and avoid overwriting your app.

The App Engine endpoint requires Admin permissions, which prevents an attacker from maliciously triggering repeated builds.  However, if you want to trigger the endpoint using command-line tools you must authenticate first.  See [Securing URLs for Cron](https://cloud.google.com/appengine/docs/standard/go/config/cron#securing_urls_for_cron).

At present App Engine submits builds within its own project.  You could extend this code to submit builds to other projects by editing the App Engine code slightly and granting appropriate IAM privileges.
