# All Spark Chrome Extension
![](./docs/chrm-ext-demo.gif)

# Pre-requisites
1. You should have access to GCP Project
2. Enable [Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)
3. Configure [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)  
   1. User Type = Internal  
   2. App Name = All Spark  
   3. Support Email = <your email id>
   4. Developer contact information = <your email id>
   5. Save it (no other fields are required)
4. Create [OAuth 2 Credential](https://console.cloud.google.com/apis/credentials) for chrome extension
   1. Create Credentials --> Create OAuth client ID
   2. Application Aype = Chrome Extension
   3. Name = All Spark
   4. Item Id = oeogcnfkkmlkdcadnnlodjhfhlablpdg
   5. Copy the client-id generated for next step.
5. Open [manifest.json](./manifest.json) and update Oauth 2 Client Id from above step
6. Update GCP Project Id in [gcpApiCalls.js](./scripts/gcpApiCall.js)

# Extension Installation

1. Open chrome://extensions in chrome browser.
2. Enable developer mode (top right toggle)
3. Load Unpacked browse to local folder where extension code is download.
4. Ensure that "ID" of installation is same what is provided in Pre-requisites 4.4 (otherwise update the credentials)

# Usage
1. Open the webpage code.
2. Select the code you want to convert.
3. Right click and select "Convert Code with All Spark"
4. This will open a new tab with copied code.
5. Select drop down values (metadata about code) and click submit.
6. Allow access to your oauth (first time only)
7. Converted code shows up.
*Note: You will need to give clipboard and gcp project permissions when using first time* 
