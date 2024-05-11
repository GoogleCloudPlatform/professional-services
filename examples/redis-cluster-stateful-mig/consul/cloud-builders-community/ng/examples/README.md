# ng cloud builders example

This `cloudbuild.yaml` invokes all available versions of the Angular CLI builders. To try the example, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml

You should be able to see the output of each version of the Angular CLI.