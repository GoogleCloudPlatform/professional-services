# GSuite Report Sync

This package handles exporting data from the GSuite Admin APIs to a destination.

The following GSuite Admin APIs are currently supported:

- [Reports API](https://developers.google.com/admin-sdk/reports/v1/get-start/getting-started)
  - Activity reports
    - [Admin activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-admin.html)
    - [Google Drive activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-drive.html)
    - [Login activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-login.html)
    - [Mobile activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-mobile.html)
    - [Authorization Token activity reports](https://developers.google.com/admin-sdk/reports/v1/guides/manage-audit-tokens.html)

The following destinations are currently supported:
- [Stackdriver Logging](https://cloud.google.com/logging/docs/)

## Installation
```sh
pip install gsuite-exporter
```

## Usage

The **GSuite Exporter** can be used either using the command-line interface or as a Python library.

### Using the CLI
An example sync from the Admin Reports API to Stackdriver Logging looks like:
```sh
gsuite-exporter
  --credentials_path='/path/to/service/account/credentials.json'
  --api='reports'
  --application='login'
  --gsuite_admin='<your_gsuite_admin>@<your_domain>'
  --exporter='stackdriver_exporter.StackdriverExporter'
```

### Using as a library

An example sync from the Admin Reports API to Stackdriver Logging looks like:

```python
from gsuite_exporter.cli import sync_all

sync_all(
    credentials_path=/path/to/service/account/credentials.json,
    gsuite_admin="<user>@<domain>",
    app="login",
    project_id="<project-id>",
    exporter_class="stackdriver_exporter.StackdriverExporter"
)
```

More examples are available using the library functions under the [examples/](./examples/) directory.

## Requirements
* A GSuite Admin account
* A service account with:
  * [GSuite domain-wide delegation](https://developers.google.com/admin-sdk/reports/v1/guides/delegation) enabled.
  * `roles/iam.tokenCreator` set on the organization.

## Setup

### Collectors

#### Reports API
To collect data from the Reports API, you need to grant extra permissions to your service account:
* Go to `admin.google.com` and login with your GSuite administrator account
* Navigate to `Security > Advanced Settings > Manage API client access`
* Grant the following scopes to your service account's `client_id`:
  - https://www.googleapis.com/auth/admin.reports.audit.readonly

### Exporters

#### Stackdriver
* Grant the following roles to your service account (in the destination project):
  - `roles/logging.viewer`
  - `roles/logging.logWriter`
