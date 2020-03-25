# README

## Requirements

- Grant these IAM roles to your service account:
  - `roles/iam.tokenCreator`
  - `roles/logging.viewer`
  - `roles/logging.logWriter`

- Enables these APIs in the project
  - IAM API
  - Admin Reports API


- Grant these API scopes to your service account's client_id under Admin Console > Security > Advanced Settings > Manage API client access
  - https://www.googleapis.com/auth/admin.reports.audit.readonly
  - https://www.googleapis.com/auth/iam



