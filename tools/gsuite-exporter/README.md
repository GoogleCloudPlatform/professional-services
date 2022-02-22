# GSuite Exporter

This package handles exporting data from the GSuite Admin APIs to a destination.

The following GSuite Admin APIs are currently supported:

- `reports_v1` - [Reports API](https://developers.google.com/admin-sdk/reports/v1/get-start/getting-started)
    - `admin` - [Admin activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-admin.html)
    - `drive` - [Google Drive activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-drive.html)
    - `login` - [Login activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-login.html)
    - `mobile` - [Mobile activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-mobile.html)
    - `token` - [Authorization Token activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-tokens.html)

The following destinations are currently supported:
- [Stackdriver Logging](https://cloud.google.com/logging/docs/)

## Requirements
* A GSuite Admin account
* A service account with:
  * [GSuite domain-wide delegation](https://developers.google.com/admin-sdk/reports/v1/guides/delegation) enabled.
  * The IAM role `roles/iam.tokenCreator` granted to the service account on the project it was created in.
* On the service account's project:
  * Enable the `Identity and Access Management (IAM) API`.
* On the destination project:
  * Enable the `Admin Reports API`.

### Collectors
To collect data from the Admin SDK APIs, you need to grant extra permissions to your service account:
* Go to your [Admin Console](https://admin.google.com) and login with your GSuite administrator account
* Navigate to `Security > Advanced Settings > Manage API client access`
* Grant the following scopes (comma-separated) to your service account's `client_id`:
  - https://www.googleapis.com/auth/admin.reports.audit.readonly
  - https://www.googleapis.com/auth/iam

### Exporters

#### Stackdriver Logging
To use the Stackdriver Logging exporter, you need to grant extra IAM roles to your service account:
* `roles/logging.viewer` on the destination project
* `roles/logging.logWriter` on the destination project

## Installation
```sh
pip install gsuite-exporter
```

## Usage

The **GSuite Exporter** can be used either using the command-line interface or as a Python library.

### Using the CLI
An example sync from the Admin Reports API to Stackdriver Logging for the 'login' application looks like:
```sh
gsuite-exporter
  --credentials-path='/path/to/service/account/credentials.json'
  --admin-user='<your_gsuite_admin>@<your_domain>'
  --api='report_v1'
  --applications='login drive token'
  --project-id='<logging_project>'
  --exporter='stackdriver_exporter.StackdriverExporter'
```

The `credentials_path` variable is optional and you can use [Application Default Credentials](https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application) instead.

### Using as a library

An example sync from the Admin Reports API to Stackdriver Logging looks like:

```python
from gsuite_exporter.cli import sync_all

sync_all(
    credentials_path=/path/to/service/account/credentials.json,
    admin_user='<user>@<domain>',
    api='reports_v1',
    applications=['login', 'drive', 'token'],
    project_id='<project-id>',
    exporter_class='stackdriver_exporter.StackdriverExporter'
)
```

More examples are available using the library functions under the [examples/](./examples/) directory.
