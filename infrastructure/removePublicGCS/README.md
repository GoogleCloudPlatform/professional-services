# removePublicGCS - Sample 5-minute Solution to prevent public objects in GCS via Cloud Functions

This is a sample of deploying a Cloud Function that triggers off a target GCS bucket whenever an object's metadata or ACLs are updated. For each object that is updated, this function will explicitly remove the 'allAuthenticatedUsers' and 'allUsers' special ACL groups from the owners, readers, and writers groups. This function effectively reacts and removes public access if it is ever accidentally granted by a user or code. The object getting the public ACLs removed are not modified in any other way, the object data, metadata, and other ACLs will remain the same after the function triggers.

## Steps

Begin by activating a Cloud Shell within your [Cloud Console](https://console.cloud.google.com/).

    ## Make a new directory as a staging area to deploy the cloud function
    $ mkdir removePublicAccessGCF
    $ cd removePublicAccessGCF


    ## Grab a copy of the sample Cloud Function code
    $ wget https://raw.githubusercontent.com/reechar-goog/professional-services/feature/removePublicGCS_CF/infrastructure/removePublicGCS/index.js
    $ wget https://raw.githubusercontent.com/reechar-goog/professional-services/feature/removePublicGCS_CF/infrastructure/removePublicGCS/package.json


    ## Use NPM to install a copy of the dependencies 
    $ npm install --save @google-cloud/storage


    # Deploy the Cloud Function to trigger off a target bucket
    $ gcloud beta functions deploy removePublicAccess \
    --trigger-event google.storage.object.metadataUpdate \
    --trigger-resource gs://<YOUR_BUCKET>

## Verify

In the Cloud Console, navigate to the [GCS Storage Browser](https://console.cloud.google.com/storage/browser/). Navigate to the bucket which was set to be the trigger resource. Check the "Share publicly" checkbox on a sample object, alternatively click "Edit permissions" and add "allUsers" or "allAuthenticatedUsers" to a group Owner/Writer/Reader. There may be a slight few second delay the first time a Cloud Function is called after being deployed. Hit refresh, and the object should have the public access ACLs removed.

## Troubleshoot

In the Cloud Csonole, navigate to [Cloud Logging](https://console.cloud.google.com/logs/viewer). Change the dropdown filter to look at Cloud Functions. You can additionally add a text filter for "removePublicAccess" which will narrow down the results to be more relevant.