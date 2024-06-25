# AngularDart Build Tools `pub` and `webdev`
This is a tool to build AngularDart projects.
AngularDart project is built by `pub` command and `webdev` command.
This directory contains `webdev` command. Also `pub` command is included `../pub/` directory.

## Build the build step
1. Clone the cloud-builders-community repo:
    ```sh
    $ git clone https://github.com/GoogleCloudPlatform/cloud-builders-community
    ```
1. Go to the directory of pub:
    ```sh
    $ cd cloud-builders-community/pub
    ```
1. Build the Docker image of pub:
    ```sh
    $ gcloud builds submit --config cloudbuild.yaml .
    ```
1. Go to the directory of webdev:
    ```sh
    $ cd cloud-builders-community/webdev
    ```
1. Build the Docker image of webdev:
    ```sh
    $ gcloud builds submit --config cloudbuild.yaml .
    ```
## Use the build step
```
steps:
  - name: "gcr.io/$PROJECT_ID/pub"
    args: ["get"]
  - name: "gcr.io/$PROJECT_ID/webdev"
    args: ["build"]
```

