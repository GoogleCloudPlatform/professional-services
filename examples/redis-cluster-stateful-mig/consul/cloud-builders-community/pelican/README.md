# Pelican, Static Site Generator, for Google Cloud Build

Builder for the [Pelican Static Site Generator](https://blog.getpelican.com/)

Arguments passed to this builder will be passed to `pelican` directly.

## Quick Start

1. Build this image and add it to your gcr repo

```
$ git clone git@github.com:GoogleCloudPlatform/cloud-builders-community
$ cd cloud-builders/pelican
$ gcloud builds submit .
```

2. Add the steps to your project's `cloudbuild.yaml`

```
$ cd my-project
$ cat >> cloudbuild.yaml
- name: gcr.io/$PROJECT_ID/pelican
  args: ['content', '-o', 'output', '-s', 'publishconf-firebase.py']
CTRL-D
```

3. Submit a manual build of your project to Cloud Build
```
$ cd my-project
$ gcloud builds submit .
```

At this point you can automate the build using triggers via GCP Repos or Github


## Complete Example With Deployment to Firebase Hosting
see [firebase builder](../firebase/Readme.md) for Firebase configuration instructions

1. Sync images from Storage to build environment
2. Pelican Build
3. Deploy via Firebase
```
steps:
- name: gcr.io/cloud-builders/gsutil
  args: ['-m', 'cp', '-r', 'gs://tonym.us/images', 'content']
- name: gcr.io/$PROJECT_ID/pelican
  args: ['content', '-o', 'output', '-s', 'publishconf-firebase.py']
- name: gcr.io/$PROJECT_ID/firebase
  args: ['deploy']
```