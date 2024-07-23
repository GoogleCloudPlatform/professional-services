# All Spark Chrome Extension
![](./docs/chrm-ext-demo.gif)

# Pre-requisites
1. You should have access a GCP Project and have permissions to configure the OAuth consent screen and to create OAuth clients.
2. Install and configure the _gcloud_ tool following this [instructions](https://cloud.google.com/sdk/docs/install)
 
# Configuration
1. Execute the [oauthConfig](./installers/oauthConfig.sh) script. The script can be executed in linux and mac OS environments. There is a version for windows [here](./installers/oauthConfig.bat).
   1. Go to the _installers_ folder
   2. Grant executable permissions to the script
   3. Execute the script
```sh
cd installers
sh oauthConfig.sh
```
If you want to use a project and account different to the ones configured in the gcloud tool, you can pass them to the script with the arguments: `--project` and `--account`.

2. Create [OAuth 2 Credential](https://console.cloud.google.com/apis/credentials) for chrome extension.
   1. Go to the Google Cloud console and navigate to the API & Services menu. Select the _Credentials_ option
   2. Create Credentials --> Create OAuth client ID
   3. Application Type = Chrome Extension
   4. Name = All Spark
   5. Item Id = gagijnhhjophliicmengpcmiecknfnkh
   6. Copy the client-id generated for next step
3. Execute the [clientIdUpdater](./installers/clientUpdater.sh) script. The script can be executed in linux and mac OS environments. There is a version for windows [here](./installers/clientUpdater.bat).
   1. Go to the _installers_ folder
   2. Grant executable permissions to the script
   3. Pass the oauth client-id obtained in the previous step as argument to the script and execute it
```sh
cd installers
sh clientIdUpdater.sh 111111111111-aaaaa11a111aaa111aaaaaaaaaa1a11a.apps.googleusercontent.com
```

# Extension Installation
1. Open chrome://extensions in chrome browser.
2. Enable developer mode (top right toggle)
3. Load Unpacked browse to local folder where extension code is download.

# Usage
1. Open the webpage code.
2. Select the code you want to convert.
3. Right click and select "Convert Code with All Spark"
4. This will open a new tab with copied code.
5. Select drop down values (metadata about code) and click submit.
6. Allow access to your oauth (first time only)
7. Converted code shows up.
*Note: You will need to give clipboard and gcp project permissions when using first time* 
