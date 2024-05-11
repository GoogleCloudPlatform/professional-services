# Android Builder

The Dockerfile and scripts here help you use Google Cloud Builder to build Android applications.  
These instructions assume that you have [Android SDK](https://developer.android.com/studio/index.html) installed and can build the subject Android application locally on your workstation.  

## Build Environment

To customize the build environment **during the build process**, for instance to add environment variables for later build steps, create a script in the working directory called `.buildenv`.  

```bash
#!/usr/bin/env bash

export BUILD_NUM=123
```

## Run Only On Specific Branch

Some build steps should only be run if the build is triggered from a specific branch, like running a deployment script when run from the master branch.  This image includes a `for_branch` script that allows you to pass a regex and, if the regex matches the current branch name, runs the rest of the argments as if they were passed directly to Bash.

In order for the script environment to get the branch name from the Cloud Build environment it must be passed to the step via the `env` parameter.

```yaml
# Builds a release apk, only for master or dev branches. 
- name: 'gcr.io/$PROJECT_ID/android:28'
  id: build_release
  args: ["for_branch", "(master|dev)", "./gradlew", ":app:assembleRelease"]
  env:
  - 'BRANCH_NAME=$BRANCH_NAME'
```

This step will build release apk only for master or dev branch. 

```yaml
# Only deploys to Play Store if we're on the master branch
- name: 'gcr.io/$PROJECT_ID/android:28'
  id: deploy_to_play
  args: ["for_branch", "master", "./gradlew", ":app:publishReleaseApk"]
  env:
  - 'BRANCH_NAME=$BRANCH_NAME'
```

This step will run `./gradlew :app:publishReleaseApk` only if the build is triggered on the master branch.

# Usage

### 1. Deploy the builders

Deploy the builders that you require to Google Cloud Registry.  Provide the api level you'd like to build for using the `_ANDROID_VERSION` substitution.  This will result in a docker image tagged with the api version.

For a normal Android SDK build using api level 28:

```bash
gcloud builds submit --config=cloudbuild.yaml --substitutions=_ANDROID_VERSION=28
# ...
# Step #2: Successfully tagged gcr.io/project-id/android:28
```

Use the `cloudbuild-ndk.yaml` file to build docker images that also include the NDK. For an Android SDK build using api level 28 and the NDK:

```bash
gcloud builds submit --config=cloudbuild-ndk.yaml --substitutions=_ANDROID_VERSION=28
# ...
# Step #2: Successfully tagged gcr.io/project-id/android:28-ndk-r25
```

### 2. Create a cloudbuild.yaml file

Create a `cloudbuild.yaml` file based on your needs and save it in the root of your project.

Check out the [complete example](examples/build-test-deploy.yaml) for some ideas of how to accomplish this.

> The sample yaml file also requires the [tar](../tar) docker image.

### 3. Encrypt your secret files (Optional)

If you have files that should be kept secret, like keystores or service account files, you can encrypt them in your source repository and decrypt them at build time.

```bash
# Create a keyring to store your keys
gcloud kms keyrings create my-app --location=global

# Create a key to store your secrets
gcloud kms keys create android-builder --location=global --keyring=my-app --purpose=encryption

# Add the service account for your gcloud project to the encrypt/decrypt role
gcloud kms keys add-iam-policy-binding android-builder --location=global --keyring=my-app --member='serviceAccount:1234567890@cloudbuild.gserviceaccount.com' --role=roles/cloudkms.cryptoKeyEncrypterDecrypter

# Encrypt all the things
gcloud kms encrypt --plaintext-file=signing/keystore.properties --ciphertext-file=signing/keystore.properties.enc --location=global --keyring=my-app --key=android-builder
gcloud kms encrypt --plaintext-file=signing/google-service-account.json --ciphertext-file=signing/google-service-account.json.enc --location=global --keyring=my-app --key=android-builder
```

Be sure to add your plain text files to your `.gitignore` file so they aren't uploaded to your repository.

### 4. Create the required cloud buckets (Optional)

If you want to store artifacts, configs, or your build cache, you'll need to create the cloud buckets to do so.

To create buckets to support the [sample config](examples/build-test-deploy.yaml), run the following commands.

```bash
gsutil mb gs://my-build-artifacts
gsutil mb gs://my-build-config
gsutil mb gs://my-build-cache
```

### 5. Start Building

There are several different ways to start builds using Google Cloud Build.

#### 5a. Run Locally

To run and debug builds locally using the [cloud-build-local](https://cloud.google.com/cloud-build/docs/build-debug-locally) command, simply use the `gcloud` command to install the `cloud-build-local` script, then submit your builds.

```bash
cloud-build-local --config=cloudbuild.yaml --substitutions=_CONFIG_BUCKET=my-app-config,_ARTIFACT_BUCKET=my-app-artifacts,_CACHE_BUCKET=my-app-cache .
```

> This will run using Docker on your local machine, so you may run into issues if your build is configured for a high memory device but you don't have the RAM to support it.

#### 5b. Submit Builds to Cloud Build

To submit builds to Cloud Build without having to push anything to Github you can use the `gcloud builds` command.

```bash
gcloud builds submit --config=cloudbuild.yaml --substitutions=_CONFIG_BUCKET=my-app-config,_ARTIFACT_BUCKET=my-app-artifacts,_CACHE_BUCKET=my-app-cache
```

#### 5c. Add a git trigger

In order for Google Cloud Build to automatically build your app when commits are pushed to Github, you'll have to create a trigger.  This can only be done via the [Cloud Build Web Interface](https://console.cloud.google.com/cloud-build/triggers).

Choose a name, specify a branch or tag, and fill in the substitution variables.

Substitution variables depend on your `cloudbuild.yaml` configuration, but the example configuration uses the following:

| Name | Value |
| --- | --- |
| `_ARTIFACT_BUCKET` | my-build-artifacts |
| `_CACHE_BUCKET` | my-build-cache |
| `_CONFIG_BUCKET` | my-build-config |


# Contact Us

Please use [issue tracker](https://github.com/GoogleCloudPlatform/android-cloud-build/issues)
on GitHub to report any bugs, comments or questions regarding SDK development.

We welcome all usage-related questions on [Stack Overflow](http://stackoverflow.com/questions/tagged/google-android-cloud-build)
tagged with `google-cloud-build`.

# More Information

* [Google Cloud Build](https://cloud.google.com/cloud-build/docs/)

