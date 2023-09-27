# iap-idp-connect

## Introduction

This service programmatically connects IAP (Identity Aware Proxy) to IdP (Identity Platform) in Google Cloud Platform.
By This program, you connect Identity providers (including multi-tenants) with IAP (Identity Aware Proxy) backend services
For example, you connect SAML integrations defined under identity platform for tenant A with backend-service-1 in IAP.
Additionally:
* You can also configure the sign-in page created automatically or custom developed by developers by providing the sign_in_url.
* You can also provide the api key attached to the sign-in page


## Pre-requisite and setting up dependencies

* Install python 3, pip 3 (Make sure Python version is 3.10)
* Setup application dependencies ():

  * Use your user account
    - Run `gcloud auth application-default login`
  * Use service account (preferred)
    - set environment variable `export GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service_accont_key_file.json`.
    - You can follow [this](https://developers.google.com/workspace/guides/create-credentials#create_credentials_for_a_service_account) to get the key file. 
  * Run the following commands
    * `gcloud init`
    * `sh ./setup_dependencies.sh <PROJECT_ID> <MEMBER>`
       
        - PROJECT_ID:  is your project id
        - MEMBER: is serviceAccount:<service account email> or user:<your user id>
    * Run `pip3 install -r requirements.txt` to install all the python dependencies
    
  
## Running the application

Now since you have everything setup you run the program by the following command

`python3 connect.py --project <project_id> --sign_in_url <sign_in_url>`


You can add additional parameters


* `--project` (required) 'Provide the project id'
* `--sign_in_url` (required) 'Provide the sign in url for the custom login url page or the one created by GCP'
* `--tenant_ids` (optional) 'Provide the tenant ids you want the backend services to'
* `--backend_services` (optional) 'Provide the backend service names for which you want the IAP resource to be updated'
* `--api_key` (optional) 'Provide the api key for the sign_in url'





