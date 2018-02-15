# removePublicGCS - Sample 5-min solution to prevent public objects in GCS


## Steps

Begin by opening a Cloud Shell within your Cloud Console.



    # Make a new directory as a staging area to deploy the cloud function, and CD into it
    $ mkdir removePublicAccessGCF
    $ cd removePublicAccessGCF

    # Grab a copy of the files from github
    $ wget https://raw.githubusercontent.com/reechar-goog/professional-services/feature/removePublicGCS_CF/infrastructure/removePublicGCS/index.js
    $ wget https://raw.githubusercontent.com/reechar-goog/professional-services/feature/removePublicGCS_CF/infrastructure/removePublicGCS/package.json

    # Use NPM to install a copy of the dependencies 
    $ npm install --save @google-cloud/storage


    # Deploy the Cloud Function to trigger off your target bucket
    $ gcloud beta functions deploy removePublicAccess \
    --trigger-event google.storage.object.metadataUpdate \
    --trigger-resource gs://<YOUR_BUCKET>
