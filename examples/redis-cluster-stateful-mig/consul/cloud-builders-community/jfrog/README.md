## Google Cloud Build integration with JFrog Artifactory

Here are few use cases of this integration -
* Containerize an existing application that’s stored in a private repository?
* Containerize an application that relies on both private and public dependencies?
* Improve build and deployment time by caching dependencies?
* Ensure that the third-party libraries come from trusted sources to make the pipeline more robust.

This readme walks through the steps required to configure Cloud Build to work with JFrog Artifactory.

### Pre-req: Create a cloud builder image that includes JFrog CLI

The top level folder includes cloudbuild.yaml file that can be used to build a JFrog cloud-build image. JFrog CLI is package agnostic that means that the same version of CLI can be used to build maven, gradle, npm, Go, Conan, docker projects. We do recommend to build an image for each package type.

**Steps to build JFrog builder image**

`gcloud builds submit --config=cloudbuild.yaml .`

The base image is configurable in the current version of cloudbuild.yaml. In this example, one is being built to support mvn packages -

```steps:
- name: 'gcr.io/cloud-builders/docker'
  args:
  - 'build'
  - '--build-arg=BASE_IMAGE=gcr.io/cloud-builders/mvn:3.3.9-jdk-8'
  - '--tag=gcr.io/$PROJECT_ID/java/jfrog:1.17.0'
  - '.'
  wait_for: ['-']
  
```

The steps to containerize a Java application using Google Cloud Build with JFrog Artifactory as a source of truth is as follows:


#### Step 1: Security

Since credentials are involved to authenticate with Artifactory, it is extremely important to ensure that credentials are passed in a secure manner in the `cloudbuild.yaml` file.

It is recommended to encrypt Artifactory API keys to make sure that encrypted credentials are used in Google Cloud Build.
For background understanding, see [Using Encrypted Resources in Cloud Build](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials)

In order to do so, first create a Cloud KMS KeyRing and CryptoKey 


**How-to create KeyRing**

`gcloud kms keyrings create [KEYRING-NAME] --location=global
`


**How-to create CryptoKey**

`gcloud kms keys create [KEY-NAME] --location=global --keyring=[KEYRING-NAME] --purpose=encryption
`

Once the keyring and cryptokey are created, it can be used to encrypt strings and even a file that includes sensitive information.

**How-to encrypt API key**

`echo $RT_API_KEY | gcloud kms encrypt --plaintext-file=- --ciphertext-file=- --location=global --keyring=[KEYRING-NAME] --key=[KEY-NAME] | base64
`
This command will output an encrypted version of API KEY that will be referred as [ENCRYPTED_API_KEY] in the readme and sample scripts.


#### Step 2: Build a project with JFrog Artifactory as a source of truth for all types of binaries

`cd examples && gcloud builds submit --config=cloudbuild.yaml .`

NOTE: Make sure that the builder image exists before running the above step.


##### Three key steps that are part of the sample cloudbuild.yaml file:


* ###### Configure JFrog CLI to point to Jfrog Artifactory

```
- name: 'gcr.io/$PROJECT_ID/java/jfrog'
  entrypoint: 'bash'
  args: ['-c', 'jfrog rt c rt-mvn-repo --url=https://[ARTIFACTORY-URL]/artifactory --user=[ARTIFACTORY-USER] --password=$$APIKEY']
  secretEnv: ['APIKEY']
  dir: 'maven-example'
```

**Note:** There is an added step in order to use the encrypted version of APIKEY
```
secrets:
- kmsKeyName: projects/[PROJECT]/locations/global/keyRings/[KEYRING-NAME]/cryptoKeys/[KEY-NAME]
  secretEnv:
    APIKEY: [ENCRYPTED_API_KEY]

```
* ###### Build a maven project
```
- name: 'gcr.io/$PROJECT_ID/java/jfrog'
  args: ['rt', 'mvn', "clean install", 'config.yaml', '--build-name=mybuild', '--build-number=$BUILD_ID']
  dir: 'maven-example'
```
The step above refers to [config.yaml](./examples/maven-example/config.yaml) that specifies the maven repositories to use in JFrog Artifactory to pulland push snapshot and release maven artifacts. Additional information can be found [here](https://www.jfrog.com/confluence/display/CLI/CLI+for+JFrog+Artifactory#CLIforJFrogArtifactory-CreatingtheBuildConfigurationFile.1) 

**Note:** For other languages, it is recommended to use the corresponding BASE_IMAGE and follow this doc to build via JFrog CLI.


* ###### Containerize the app
```
- name: 'gcr.io/cloud-builders/docker'
  args:
  - 'build'
  - '--tag=gcr.io/$PROJECT_ID/java-app:${BUILD_ID}'
  - '.'
  dir: 'maven-example'
  
```

Once the app is containerized, it can be deployed on GKE or any other compute target.
