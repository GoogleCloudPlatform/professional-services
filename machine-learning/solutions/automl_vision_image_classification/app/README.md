# Cloud AutoML Custom Vision Sport Classification

keywords: Cloud AutoML, AutoML Vision, Image classification, Custom Vision API, Google Cloud Platform, GCP,
Demo Guide available at https://www.cloudconnect.goog/docs/DOC-23460

<table>
	<tr>
		<td>Demo description</td>
		<td>Building a state of the art image classification app for developers <b>with no ML expertise</b>.</td>
	</tr>
	<tr>
		<td>Intended audience</td>
		<td>Companies that use a high volume of docs and files like images, receipts, drawings, maps, blueprints, etc. and need to categorize them, like: media and entertainment, autonomous cars, automatic retail checkout, predictive maintenance, automatic industrial applications.</td>
	</tr>
	<tr>
		<td>Products used</td>
		<td>Cloud AutoML, App Engine, Cloud Storage, Cloud Datastore</td>
	</tr>
</table>


## Introduction

In this demo you will learn how to build an AutoML Vision model for sport classification and deploy a Python Flask web application to the App Engine Flexible environment. The AutoML Vision model is built by uploading 100 photos for each sport category from a public image dataset (Open Images dataset) and training it with a few clicks. The example application allows a user to upload a photo of one of ten popular sports (track and field, baseball, basketball, cricket, golf, gymnastics, Soccer, swimming, tennis and volleyball) and learn what sport it is. The application uses Google Cloud APIs for AutoML Vision, Storage, and Datastore.

## Instructions

Allow from two to four hours the first time you set up the demo. Later, the setup time should drop to about 45 minutes.

### Setup and requirements

- Create a project on Google Cloud Platform. If you don't already have a Google Account (Gmail or Google Apps), you must create one. Sign-in to Google Cloud Platform console (console.cloud.google.com) and create a new project. Remember the project ID, <PROJECT_ID>, a unique name across all Google Cloud projects. It will be referred to later in this document as <PROJECT_ID>.

- Enable billing in the Cloud Console in order to use Google Cloud resources.

- Install Google Cloud SDK by following the instructions. If you have already installed Google Cloud SDK, update all of your installed components to the latest version:

    gcloud components update

- Initialize Cloud SDK:

	- In the Cloud Shell run the following command:

	gcloud init

	- When prompted, create a new configuration and give it a meaningful name.

	- Select the user account to associate this new configuration with.

	- Follow the instructions and when prompted enter the <PROJECT_ID> for the project you created.

- Go to Google Cloud Platform console.

- From the menu select ‘APIs and Services’ -> Library and enable the required APIs:

	- Google Compute Engine API

	- Google App Engine Flexible Environment

	- Google Cloud Datastore API

	- Google Cloud Storage.

### Build the AutoML model

- Download the training data to your local computer. The training data consists of 10 folders each named with a specific sport. Each folder contains 100 images for that sport.

- Go to AutoML Vision API.

- Click on ‘GET STARTED’.

- Enter your Google Cloud project ID, <PROJECT_ID>, as instructed and click ‘CONTINUE’.

- Click on ‘SETUP NOW’ to enable billing, the required APIs, service accounts and a bucket for image on GCS.

- Click on ‘SETUP’ in the window that appears.

- Choose an account.

- Click on ‘ALLOW’. The ‘SETTING UP’ may take a few minutes. Wait for it to finish.

- Enter a dataset name, <DATASET_NAME>, in the space provided. This will also be your the name of your AutoML model, <MODEL_NAME>.

- Leave 'Allow more than one label per image' and 'Respect file order' unchecked. Click on ‘+ ADD NEW DATASET’.

- Select ‘Upload training images from your computer' and click the ‘UPLOAD’ button under the it.

- In the window that appears select the training data archive file that you downloaded and click ‘Open’.

- Wait for the uploading to end and then click on ‘IMPORT’ at the bottom of the page. Wait for the dataset processing to finish (this may take a while).

- From the top menu click on the ‘TRAIN’ tab.

- Choose ‘Base model (free) about 1 hour train time’. You may alternatively select ‘Advanced model ($550) up to 24 hours train time’ but it will not be free.

- Click on the ‘TRAIN’ button at the bottom of the page. This will train your model. It may take about an hour to finish (24 hours if you selected the Advanced model).

- After the training is finished select your dataset from the table by clicking on the <DATASET_NAME>.

- Write down the value in ‘Metrics for model’. That is your <MODEL_VERSION>.

### Get the sample code and configure the settings

- Clone the app source code by clicking on the 'Clone or download' button and following the instructions.

- Switch to your new local Git repository:

    cd app

- Open app.yaml using an editor and replace the actual values for <PROJECT_ID>, <CLOUD_STORAGE_BUCKET>, <MODEL_NAME> and <MODEL_VERSION>:

    env_variables:
      PROJECT_ID: <PROJECT_ID>
      CLOUD_STORAGE_BUCKET: <CLOUD_STORAGE_BUCKET>
      MODEL_NAME: <MODEL_NAME>
      MODEL_VERSION: <MODEL_VERSION>

Save and close the file.

### Deploy the app to App Engine:

- Deploy the application to App Engine by running:

    gcloud app deploy

- Choose the region where you want your App Engine application located

- When asked ‘Do you want to continue’, enter Y and press enter.

### Test your application

- After the app is deployed you can run it by going to its URL (replace the actual value for your <PROJECT_ID>):

    https://<PROJECT_ID>.appspot.com

- Click on ‘Choose File’ and select an image from your computer showing one of the 10 sports in this demo.

- Click on ‘Submit’.

The app will display the photo on its page and also the image classification returned from AutoML Vision API.
