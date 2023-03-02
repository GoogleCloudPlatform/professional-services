# java_working_app_example

This code is created by Eugene Enclona, If you have any questions about this code reach out to eenclona@google.com

## Overview

The purpose of this code is to show how one can build a sample Java app to take advantage of the Cloud Support API. One functionality in this app is to modify the email address field of each support case. This can be done through the updateAllEmails() method. 

This use case solves the common problem faced by orgs with many support cases needing an update of the email addresses attached to their cases. For example, if an org creates a new email address to track all support cases and it wishes to add this email to all open support cases. This can be done easily in a programmatic way. Additionally, I also showed how to use the other methods exposed by the API in the code, like listing cases, getting a case, etc. 

Please note that this sample app is not code complete - there may be some edge cases that were not accounted for. So please verify the completeness of this code before using this in production environment.

## How to get started

1. Make sure you have a support enabled GCP account.
2. Create a service account that has the Organization Viewer and Tech Support Viewer role.
3. Download the service account key
4. Run the following command in the terminal: export GOOGLE_APPLICATION_CREDENTIALS=".../[path to service account key/.json"
5. Update the variable PROJECT_NUMBER in App.java with your project number.
6. Run the main method of my code and this should list all support cases :)
7. Uncomment part 5 of the code in main() to run updateAllEmailsWith()
