# GSuite Report Sync

This script will sync GSuite report logs to Stackdriver, from which downstream
syncs can be configured to GCS, BigQuery, and/or Pubsub.

## Example Usage
```sh
# The GSuite-Admin-email granting permission, this may also be set in code
export ADMIN_EMAIL=''
```
```python
import sync.reports as reports

gcp_project = 'projects/your_project'
log_name = 'custom.log.yourdomain.com%2flogins'
reports.sync_admin_logs('login', gcp_project, log_name)
```

## GSuite Permissions Setup

[Edit the desired service-account](https://developers.google.com/identity/protocols/OAuth2ServiceAccount#creatinganaccount) to add GSuite delegation:
```
Google Cloud Console -> IAM -> Service accounts -> edit XXXXXX<PROJECT-ID>@XXXXXXXX.gserviceaccount.com

Enable GSuite domain-wide delegation:   (checked)
Product name (OAuth consent screen)     ${PRODUCT_NAME}

Take Note of the 'clientID', used in GSuite setup
```

Then, setup GSuite [delegating authority](https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority) for the service-accounts's `clientID` from the  Admin (GSuite) console:
```
Admin Console -> Security -> Advanced Settings ->  Manage API client access
Client Name:  ${OAUTH2CLIENTID} (also referenced as 'cliendID')
API Scopes:   `https://www.googleapis.com/auth/admin.reports.audit.readonly`
```
