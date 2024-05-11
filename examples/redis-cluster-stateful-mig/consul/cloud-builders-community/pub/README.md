# AngularDart Build Tools `pub` and `webdev`


This is a tool to build AngularDart projects.
AngularDart project is built by `pub` command and `webdev` command.
This directory contains `pub` command. Also `webdev` command is included `../webdev/` directory.

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
    ```sh
    $ gcloud builds submit --config cloudbuild.yaml .
    ```

## Use the build step
```
steps:
  - name: "gcr.io/$PROJECT_ID/pub"
    args: ["get"]
```

