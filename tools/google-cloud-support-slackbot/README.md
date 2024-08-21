# ![Google Cloud Support Slackbot](google_cloud_support_slackbot_icon.svg)
# Slack Integration for Google Cloud Support

Slack app for pulling Google Cloud Support case information via the Cloud Support API and pushing it to Slack. The goal is to help reduce the overall time to resolution for cases of all priorities by putting case updates in Slack where they will be more easily noticed by their devs and engineers.

The app currently supports the following commands:

* /google-cloud-support track-case [case_number] -- case updates will be posted to this channel
* /google-cloud-support add-comment [case_number] [comment] -- adds a comment to the case
* /google-cloud-support change-priority [case_number] [priority, e.g. P2] -- changes the priority of the case
* /google-cloud-support subscribe [case number] [email 1] ... [email n] -- subscribes the given emails addresses to the case to receive updates to their inboxes. This overwrites the previous list of emails
* /google-cloud-support escalate [case number] [reason] [justification] -- escalates the support case. Reason must be either RESOLUTION_TIME, TECHNICAL_EXPERTISE, or BUSINESS_IMPACT
* /google-cloud-support close-case [case number] -- closes a case
* /google-cloud-support stop-tracking [case_number] -- case updates will no longer be posted to this channel
* /google-cloud-support list-tracked-cases -- lists all cases being tracked in this channel
* /google-cloud-support list-tracked-cases-all -- lists all cases being tracked in the workspace
* /google-cloud-support case-details [case_number] -- pull all of the case data as json
* /google-cloud-support sitrep -- report of all active cases in the org
* /google-cloud-support auto-subscribe [asset type] [asset name] [email 1] ... [email n] -- creates a subscription to a specific asset that will automatically add the provided emails as CC on any new cases under the asset. Asset type must one of the following values: organizations, folders, projects
* /google-cloud-support edit-auto-subscribe [asset type] [asset name] [email 1] ... [email n] -- edits an existing asset subscription with the provided emails. Warning: this will overwrite the existing emails in the subscription. Asset type must one of the following values: organizations, folders, projects
* /google-cloud-support stop-auto-subscribe [asset type] [asset name] -- deletes an existing asset subscription. Asset type must one of the following values: organizations, folders, projects
* /google-cloud-support list-auto-subscriptions-all -- lists all the subscriptions being in the current channel
* /google-cloud-support autotrack-create [asset type] [asset name] [P1] ... [P4] -- automatically tracks all new cases of matching priority in the specified asset in this channel. asset type must be one of the following values: organizations, folders, projects
* /google-cloud-support autotrack-edit [asset type] [asset name] [P1] ... [P4] -- edits autotracking of an asset in this channel. This overwrites the existing list of priorities. asset type must be one of the following values: organizations, folders, projects
* /google-cloud-support autotrack-stop [asset type] [asset_name] -- deletes autotracking against an asset. asset type must be one of the following values: organizations, folders, projects
* /google-cloud-support list-autotrack-all -- lists all the assets being autotracked in the current channel and the priorities they are configured for

**If you encounter any issues with this application's operations or setup, please file your issue here on GitHub or ping a member of your account team for assistance. This application is not supported by the Google Cloud Support team.**

# Setup Guide

**Before proceeding, you will need Premium Support to use the Cloud Support API and by association the slackbot**
Setting up your first Slack app can be a difficult task, which is why we are providing a step-by-step guide.

## Setup Part 1 - Slack App Phase 1

Go to [Slack Apps](http://api.slack.com/apps) to do the following:

1. Click **Create New App** and select **From an app manifest**
2. Select the workspace where you want to add the app and then click **Next**
3. Copy and paste in the following YAML and then click **Next**:
```
display_information:
  name: Google Cloud Support Bot
features:
  bot_user:
    display_name: Google Cloud Support Bot
    always_online: false
  slash_commands:
    - command: /google-cloud-support
      url: https://CLOUDRUN_SERVICE_URL
      description: Track and manage your Google Cloud support cases in Slack. Use /google-cloud-support help for the list of commands
      usage_hint: "[command] [parameter 1] [parameter 2]"
      should_escape: false
oauth_config:
  scopes:
    bot:
      - chat:write
      - channels:history
      - commands
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```
4. Click **Create**
5. Under **Settings > Basic Information**, scroll down to **Display Information** and upload the [google_cloud_support_slackbot_icon_big.png](google_cloud_support_slackbot_icon_big.png)
6. Go to **Settings > Basic Information** and under **Building Apps for Slack > Install your app**, click **Install to Workspace**. On the next screen click **Allow**. You may need Slack admin approval to install the app
7. Go to **Settings > Basic Information** and under **App Credentials** copy the `Signing Secret`. You will need this for **Setup Part 2**
8. Go to  the **Features > OAuth & Permissions** page, under **OAuth Tokens for Your Workspace**. Copy the `Bot User OAuth Token`. You will need this for **Setup Part 2**

## Setup Part 2 - Google Cloud

Go to [Google Cloud](https://console.cloud.google.com/) to do the following:

1. Go to the project dropdown at the top of the page and select it. From the list, select the project where you want to host the app, or create a new project for it. **After completing the rest of the steps, the app will have support ticket access for all projects in your org**. We recommend either hosting this app in a new project, or in a project that hosts other apps for Slack 
2. Click the **Activate Cloud Shell** button to open the Cloud Shell Terminal. Confirm the Cloud Shell is set to the project where you want to host the app. If it isn't, set it using the `gcloud config set project PROJECT_ID` command. Authorize the command if prompted.
3. **WARNING**: Running step 4 will delete some of the default firewall rules as they aren't needed by our app. If you dont want to do this, delete lines 8-12 in the step 5's code block 
4. **NOTICE**: Google Cloud Support Bot uses **Cloud Firestore** in **Native mode** to keep track of cases, channels, subscriber lists, etc. If you attempt to deploy the application in a project that is actively using Cloud Firestore in Datastore mode, the application will fail to deploy. If this happens, we recommend deploying the Google Cloud Support Bot to a new project 
5. Update the following code block with your `SIGNING_SECRET` and `SLACK_TOKEN` from **Setup Part 1**, and then run it in your **Cloud Shell**:
```
SIGNING_SECRET=SIGNING_SECRET
SLACK_TOKEN=SLACK_TOKEN
TAG=2.2
alias gcurl='curl -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json"';
ORG_ID=$(gcurl -X POST https://cloudresourcemanager.googleapis.com/v1/projects/$DEVSHELL_PROJECT_ID:getAncestry | jq '.ancestor[] | select(.resourceId.type == "organization")' | jq '.resourceId.id' | sed 's/"//g');
PROJECT_NUMBER=`gcloud projects list --filter="${DEVSHELL_PROJECT_ID}" --format="value(PROJECT_NUMBER)"`;
gcloud services enable firestore.googleapis.com cloudsupport.googleapis.com logging.googleapis.com compute.googleapis.com iam.googleapis.com artifactregistry.googleapis.com run.googleapis.com serviceusage.googleapis.com appengine.googleapis.com;
yes | gcloud compute firewall-rules delete default-allow-icmp;
yes | gcloud compute firewall-rules delete default-allow-internal;
yes | gcloud compute firewall-rules delete default-allow-rdp;
yes | gcloud compute firewall-rules delete default-allow-ssh;
yes | gcloud compute networks delete default;
gcloud iam service-accounts create support-slackbot \
    --description="Used by the Google Cloud Support Slackbot" \
    --display-name="Support Slackbot";
gcloud organizations add-iam-policy-binding $ORG_ID \
    --member="serviceAccount:support-slackbot@$DEVSHELL_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsupport.techSupportEditor";
gcloud organizations add-iam-policy-binding $ORG_ID \
    --member="serviceAccount:support-slackbot@$DEVSHELL_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.owner";
gcloud organizations add-iam-policy-binding $ORG_ID \
    --member="serviceAccount:support-slackbot@$DEVSHELL_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/resourcemanager.organizationViewer";
gcloud organizations add-iam-policy-binding $ORG_ID \
    --member="serviceAccount:support-slackbot@$DEVSHELL_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/resourcemanager.folderEditor";
gcloud organizations add-iam-policy-binding $ORG_ID \
    --member="serviceAccount:support-slackbot@$DEVSHELL_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/logging.logWriter";
gcloud auth configure-docker us-central1-docker.pkg.dev
gcloud artifacts repositories create google-cloud-support-slackbot \
    --repository-format=Docker \
    --location=us-central1 \
    --description="Docker images for the Google Cloud Support Slackbot";
gcloud firestore databases create --location=nam5;
gcloud app create --region=us-central;
gcloud alpha firestore databases update --type=firestore-native
docker pull thelancelord/google-cloud-support-slackbot:$TAG;
docker tag thelancelord/google-cloud-support-slackbot:$TAG us-central1-docker.pkg.dev/$DEVSHELL_PROJECT_ID/google-cloud-support-slackbot/google-cloud-support-slackbot:$TAG;
docker push us-central1-docker.pkg.dev/$DEVSHELL_PROJECT_ID/google-cloud-support-slackbot/google-cloud-support-slackbot:$TAG;
gcurl https://apikeys.googleapis.com/v2/projects/$PROJECT_NUMBER/locations/global/keys \
  --request POST \
  --data '{
    "displayName": "Support Slackbot",
    "restrictions": {
      "api_targets": [
        {
          "service": "cloudsupport.googleapis.com",
          "methods": [
            "Get*"
          ]
        },
        {
          "service" : "firestore.googleapis.com",
          "methods": [
            "Get*"
          ]
        }
      ]
    },
  }';
gcloud run deploy google-cloud-support-slackbot \
--image=us-central1-docker.pkg.dev/$DEVSHELL_PROJECT_ID/google-cloud-support-slackbot/google-cloud-support-slackbot:$TAG \
--allow-unauthenticated \
--service-account=support-slackbot@$DEVSHELL_PROJECT_ID.iam.gserviceaccount.com \
--min-instances=1 \
--max-instances=3 \
--set-env-vars=TEST_CHANNEL_ID=$TEST_CHANNEL_ID,TEST_CHANNEL_NAME=$TEST_CHANNEL_NAME,TEST_USER_ID=$TEST_USER_ID,TEST_USER_NAME=$TEST_USER_NAME,ORG_ID=$ORG_ID,SLACK_TOKEN=$SLACK_TOKEN,SIGNING_SECRET=$SIGNING_SECRET,PROJECT_ID=$DEVSHELL_PROJECT_ID,TEST_PROJECT_NUMBER=$PROJECT_NUMBER,TEST_ASSET=$TEST_ASSET,TEST_ASSET_ID=$TEST_ASSET_ID \
--no-use-http2 \
--no-cpu-throttling \
--platform=managed \
--region=us-central1 \
--port=5000 \
--project=$DEVSHELL_PROJECT_ID;
```
This will output a URL. Copy this URL to use in **Setup Part 3**. If you need to find this URL again, you can find it under **Cloud Run** by clicking on the **google-cloud-support-slackbot** service. You will find the URL near the top of the Service details page   

## Setup Part 3 - Slack App

Return to [Slack Apps](http://api.slack.com/apps) to do the following:

1. Go to **Features > Slash Commands** and click the **pencil icon**:
	1. Update the `Request URL` with your `CLOUDRUN_SERVICE_URL` generated in **Setup Part 2** and then click **Save**
 
## Testing

To verify that everything was setup correctly, do the following:
1. Go to your Slack workspace
2. Under **Channels** right-click the channel where you want to add the bot and select **Open channel details**
3. Select the **Integrations** tab
4. In the **Apps** section, click **Add apps** and then add the bot
5. Open the channel where you added the bot and run the `/google-cloud-support help` command. If it returns a list of available help commands then everything was setup correctly. If it returns an error that the dispatch failed, then you will need to debug. The most likely culprits are an issue with an org security policy, or a missed step somewhere

## Closing

With that you should be all setup! And as a reminder, if you had to create the SSH firewall rule, it is recommended that you go back and disable it. If you ever need to SSH into the machine you can always enable the rule again as needed.

As the Cloud Support API continues to expand and we collect more feedback for requested features, we will release newer versions of the bot and move the previous version into the archive folder.
