# ![Google Cloud Support Slackbot](google_cloud_support_buddy_small.png)
# Slack Integration for Google Cloud Support

Slack app for pulling Google Cloud Support case information via the Cloud Support API and pushing it to Slack. The goal is to help reduce the overall time to resolution for cases of all priorities by putting case updates in Slack where they will be more easily noticed by their devs and engineers.

The app currently supports the following commands:

* /google-cloud-support track-case [case_number] -- case updates will be posted to this channel
* /google-cloud-support add-comment [case_number] [comment] -- adds a comment to the case
* /google-cloud-support change-priority [case_number] [priority, e.g. P2] -- changes the priority of the case
* /google-cloud-support stop-tracking [case_number] -- case updates will no longer be posted to this channel
* /google-cloud-support list-tracked-cases -- lists all cases being tracked in this channel
* /google-cloud-support list-tracked-cases-all -- lists all cases being tracked in the workspace
* /google-cloud-support case-details [case_number] -- pull all of the case data as json
* /google-cloud-support sitrep -- report of all active cases in the org

# Setup Guide

**Before proceeding, you will need Premium Support to use the Cloud Support API and by association the slackbot**  
Setting up your first Slack app can be a daunting task, which is why we are providing a step-by-step guide.

## Setup Part 1 - Allow list the Support API

To get access to the API, you will need to send your Techincal Account Manager the following:

1. The **org id** where you have Premium Support enabled
2. A **project id** where the API will be allow listed
3. The name of a **service account** in the project from step 2, with the service account having the following roles at the org level:
	1. **Tech Support Editor**
	1. **Org Viewer**
4. The **email addresses** of the people that will be enabling the API in the project

Your Techincal Account Manager will file a request with the Support API team to give you access. The team typically processes these requests within 24 hours

## Setup Part 2 - Google Cloud Phase 1 

In the first phase of our Google Cloud setup, we will verify that our network is setup properly, create a lightweight VM to house our bot, and enable our Cloud Support API and create ourselves an API key. Go to [Google Cloud](https://cloud.google.com/console). **These steps need to be carried out in the project you specified in Part 1 of this setup guide.**

### Networking

From **VPC network > Firewall rules**, verify rules exist to **allow SSH and HTTP**.

1. **If your project doesn't have a VPC, you will need to create one from VPC networks**. Select **Automatic** for your Subnet creation mode, and **allow-ssh** from **Firewall rules**
2. If it doesn't exist, create the following firewall rule:
	1. Name: `default-allow-http`
	1. Priority: `1000`
	1. Direction: `Ingress`
	1. Action on match: `Allow`
	1. Targets: `Specified target tags`
	1. Target tags: `http-server`
	1. Source filter: `IP ranges`
	1. Source IP ranges: `0.0.0.0/0`
	1. Protocols and Ports: `Specified protocols and ports`
	1. tcp: `80`
3. If an SSH firewall rule doesn't exist, create the following firewall rule:
	1. Name: `default-allow-ssh`
	1. Priority: `65534`
	1. Direction: `Ingress`
	1. Action on match: `Allow`
	1. Targets: `All instances in the network`
	1. Source filter: `IP ranges`
	1. Source IP ranges: `0.0.0.0/0`
	1. Protocols and Ports: `Specified protocols and ports`
	1. tcp: `22`

*Note that if you had to create the SSH firewall rule in Step 3, you will want to disable it after you complete the entire setup*

### VM

Go to **Compute Engine > VM instances** and perform the following:

1. Click **+ Create Instance**
	1. Under **Machine Configuration**, set the **Machine type** field to **e2-micro**. This should suffice for most implementations. If your team makes heavy use of the Cloud Support and the bot, you may need to upgrade the machine type
	1. Under **Identity and API access > Service Account**, select your **service account** that was allow listed for the Cloud Support API
	1. Under **Firewall**, select **Allow HTTP traffic**. If this option isn't available and you create the firewall rule in the Networking steps, then you will want to contact your Networking team about policies that may be preventing HTTP traffic
	1. Click to expand **Management, security, disks, networking, sole tenancy**
		1. Select the **Networking** tab
		1. Under **Network interfaces**, click the network interface box
			1. Set **Network** to the VPC where you have your firewall rules
			1. Under **External IP**, select **Create IP address**. Choose whichever name and network service tier you prefer
	1. Click **Create**

### API Enablement and the API Key

From **APIs & Services > Library** ...

1. Search for and enable the **Cloud Logging API**
2. Search for and enable the **Cloud Support API**

From **APIs & Services > Credentials**

1. Click **+Create** and select **API key**
2. Copy your key and choose to **Restrict Key**
	1. Under **Application restrictions**, you may select **IP addresses** to restrict usage the VM you created
	1. Under **API restrictions**, select **Restrict Key** and from the **Select APIs** dropdown, click **Google Cloud Support API**

## Setup Part 3 - Slack App

Go to [Slack Apps](http://api.slack.com/apps) to do the following:

1. Click **Create New App** and select **From scratch**. Name your app `Google Cloud Support Bot` and select your workspace
2. Under **Settings > Basic Information**, scroll down to **Display Information** and upload the [google_cloud_support_buddy_big.png](google_cloud_support_buddy_big.png) or an icon of your choosing.
3. Go to **Features > Slash Commands** and create the following command:
	1. Command: `/google-cloud-support `
	1. Request URL: `http://<your_vm_external_ip>/google-cloud-support`
	1. Short description: `Track and manage your Google Cloud support cases in Slack. Use /google-cloud-support help for the list of commands`
	1. Usage Hint: `[command] [parameter 1] [parameter 2] [parameter 3]`
4. Go to **Features > OAuth & Permissions**. Scroll down to **Scopes** and add the **chat:write** scope. Add the **commands** scope if it isn't listed already listed
5. At the top of the **Features > OAuth & Permissions** page, under **OAuth Tokens for Your Workspace**, click **Install to Workspace**. Copy the token. You may need Slack admin approval to install the app.

## Setup Part 4 - Google Cloud Phase 2

Return to [Google Cloud](https://cloud.google.com/console) and from **Compute Engine > VM instances**, perform the following:

1. SSH into the VM that you created in part 2 of this setup guide
2. Run the following commands:
	1. `sudo apt-get update`
	1. `sudo apt-get -y install subversion`
	1. `sudo apt-get -y install python3-pip`
	1. `sudo apt-get -y install nginx`
	1. `cd /`
	1. `sudo svn export https://github.com/GoogleCloudPlatform/professional-services/trunk/tools/google-cloud-support-slackbot`
	1. `cd /google-cloud-support-slackbot`
	1. Use sudo to open the `default` file with your editor of choice, and replace <STATIC_IP> with the external ip address of your VM. Then save and close the file
	1. `sudo mv default /etc/nginx/sites-available/`
	1. Use sudo to open the `.env` file with your editor of choice. Enter your API Key, Slack Token, and numeric org id in their respective locations. Then save and close the file
	1. `sudo chmod +x google-cloud-support-slackbot.py`
3. Close the SSH session
4. From Compute Engine > VM instances, click your VM name to go to your VM instance details
5. Stop the VM
6. Once the VM is stopped, click the 'EDIT' button
7. Scroll down to the Custom metadata section and add the following key-value pair:
	1. key: `startup-script`
	1. value:  
	`cd /google-cloud-support-slackbot`  
	`pip3 install -r requirements.txt`   
	`/google-cloud-support-slackbot/google_cloud_support_slackbot.py`
8. Scroll to the bottom of the page and click 'Save'
9. Start your VM

## Closing

With that you should be all setup! And as a reminder, if you had to create the SSH firewall rule, it is recommended that you go back and disable it. If you ever need to SSH into the machine you can always enable the rule again as needed.

As the Cloud Support API continues to expand and we collect more feedback for requested features, we will release newer versions of the bot and move the previous version into the archive folder. To replace your current bot with the latest version you will only need to do the following:

1. SSH into your VM instance
2. Run the following commands:
	1. `cd /google-cloud-support-slackbot`
	1. `sudo svn export https://github.com/GoogleCloudPlatform/professional-services/trunk/tools/google-cloud-support-slackbot/google-cloud-support-slackbot.py`
3. Close your SSH session
4. Stop and Start your VM
