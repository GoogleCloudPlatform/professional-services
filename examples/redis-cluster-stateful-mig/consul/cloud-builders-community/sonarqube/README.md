# Sonarqube Scanning
This builder allows you to run static code analysis using Sonarqube on your code.

## Building this builder
Run the command below to build this builder

```
gcloud builds submit . --config=cloudbuild.yaml
```

## Testing the example
Before you can run the example. Perform following steps
* Login to https://sonarcloud.io with your github account
* Create a token by navigating to Account page then click on security tab
* Next we need to use "Analyze New Project" option to set up project in sonarcloud. Note: Use setup manually option
* Note down the token you created, project key and the organization name
* Specify those values in the cloudbuild.yaml in examples

## Running the analysis
To perform the static code analysis on the example go project, run the command below

```
gcloud builds submit . --config=cloudbuild.yaml
```

This builder should work with other Sonarqube servers. If you decide to use this with a different sonar server rather than the sonarcloud, just specify sonar.host.URL arg along with login and password to authenticate with the sonar server if you are not using token based auth. 