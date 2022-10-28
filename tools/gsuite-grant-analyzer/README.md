# G Suite Grant Analyzer

G Suite Grant Analyzer is a tool to export to BigQuery data about all the OAuth scopes granted by users to third party applications in G Suite.

## Installation

### Manual install

Install the Python Google API Client and BigQuery Client libraries:

- https://developers.google.com/api-client-library/python/start/installation
- https://cloud.google.com/bigquery/docs/reference/libraries#client-libraries-install-python

Install the Retrying library:

- https://github.com/rholder/retrying

Install the oauth2 library:

- https://github.com/joestump/python-oauth2

## Prerequisites

Create a GCP project and a service account with domain wide delegation:

- https://developers.google.com/identity/protocols/OAuth2ServiceAccount

Whitelist the client ID in the G Suite admin console, adding the scopes
required by the script (see the SCOPES variable in the script itself):

- https://support.google.com/a/answer/162106?hl=en

Be aware of the API limits and adjust them as needed:

- https://developers.google.com/admin-sdk/directory/v1/limits


## Overview and data analysis examples

This script gathers information about which applications have been granted
access by users using OAuth and which scopes have been requested by each
application. Data is then loaded to BigQuery for analysis.

Data has the following structure in G Suite:

```
User1 --- App1
  |    |    |-- Scope1
  |    |    \-- Scope2
  |    |
  |    \-- App2
  |          |-- Scope2
  |          \-- Scope3
  |
User2 --- App2
       |    |-- Scope2
       |    \-- Scope3
       |
       \-- App3
             \-- Scope4
```

That is, each user is connected to the list of apps it has granted access to,
and each app is connected to the list of scopes it requires.

The same app will be repeated for each user, and the same scopes will be
repeated for each app. The same scope can be requested by more than one app.

However, this structure does not allow for easy queries on data.

The script extracts this data and loads it into BigQuery in a denormalized
form. The schema of the table is the following:

```
| user@example.com | clientId | scope | displayText |
```

Note that the app is identified by its Client ID. The display text can be the
same for different applications with the same name, or if a given application,
say an AppMaker app, has been copied between different users (a new instance
is created for each user).

It is recommended to use it only as a human readable information, but queries
should be performed using the clientId.

The example above would then create the following rows (displayText is omitted
for simplicity):

```
| User1@example.com | ClientId1 | Scope1 |
| User1@example.com | ClientId1 | Scope2 |
| User1@example.com | ClientId2 | Scope2 |
| User1@example.com | ClientId2 | Scope3 |
| User2@example.com | ClientId2 | Scope2 |
| User2@example.com | ClientId2 | Scope3 |
| User2@example.com | ClientId3 | Scope4 |
```

Below are some samples of possible queries on this schema. By customizing the
queries, it is possible to perform the desired analysis on users, apps and
scopes.

- All apps granted by a given user:

```
SELECT DISTINCT clientId, displayText
FROM `my-project.app_scopes.app_scopes_20190606_111451_976536`
WHERE user = "user@example.com"
```

- All scopes granted by a given user:

```
SELECT DISTINCT scope
FROM `my-project.app_scopes.app_scopes_20190606_111451_976536`
WHERE user = "user@example.com"
```

- All scopes requested by a given app:

```
SELECT DISTINCT scope
FROM `my-project.app_scopes.app_scopes_20190606_111451_976536`
WHERE clientId = "123-abc.apps.googleusercontent.com"
```

- All users using a given app:

```
SELECT DISTINCT user
FROM `my-project.app_scopes.app_scopes_20190606_111451_976536`
WHERE clientId = "123-abc.apps.googleusercontent.com"
```

- All apps using a given set of scopes:

```
SELECT DISTINCT clientId, displayText
FROM `my-project.app_scopes.app_scopes_20190606_111451_976536`
WHERE scope = 'https://www.googleapis.com/auth/drive'
OR scope = 'https://www.googleapis.com/auth/drive.readonly'
```

Note how we can use SELECT DISTINCT on both the clientId and displayText, as a
given clientId will always have the same displayText. However, keep in mind that
the opposite is usually not true.

- All users using a given set of scopes:

```
SELECT DISTINCT user
FROM `my-project.app_scopes.app_scopes_20190606_111451_976536`
WHERE scope = 'https://www.googleapis.com/auth/drive'
OR scope = 'https://www.googleapis.com/auth/drive.readonly'
```

- All apps requiring any Google Drive scope (both critical and non critical):

```
SELECT DISTINCT clientId, displayText
FROM `my-project.app_scopes.app_scopes_20190606_111451_976536`
WHERE (scope LIKE '%/drive%' OR scope LIKE '%/sheets%'
  OR scope LIKE '%/presentations%' OR scope LIKE '%/documents%')
```

The query uses LIKE to capture both read/write and readonly scopes, but it can
be easily customized to query for r/w scopes only (by entering the exact URLs).
Also, consider that other G Suite apps, like Sheets or Slides,
have their own scopes, and these allow to access that specific kind of
document as well. That's why they are included. See
https://developers.google.com/identity/protocols/googlescopes
for a comprehensive list of scopes.

- All apps or users requiring only non-high-risk scopes in Drive:

```
SELECT DISTINCT clientId, displayText
FROM `my-project.app_scopes.app_scopes_20190606_111451_976536`
WHERE (scope LIKE '%/drive%' OR scope LIKE '%/sheets%'
  OR scope LIKE '%/presentations%' OR scope LIKE '%/documents%')
AND clientId NOT IN (
  SELECT DISTINCT clientId
  FROM `my-project.app_scopes.app_scopes_20190606_111451_976536`
  WHERE (
    (scope LIKE '%/drive%' OR scope LIKE '%/sheets%'
      OR scope LIKE '%/presentations%' OR scope LIKE '%/documents%')
    AND scope != 'https://www.googleapis.com/auth/drive.appfolder'
    AND scope != 'https://www.googleapis.com/auth/drive.file'
    AND scope != 'https://www.googleapis.com/auth/drive.install'
  )
)
```

Let's explain this query. The inner SELECT retrieves apps that are asking for
any drive scope, except non-high-risk scopes. That is, these apps use ONLY high
risk scopes.
The outer query then selects the apps that ask for any drive scope, but are not
in the inner query. That is, apps that only ask for non-high-risk scopes.

To select users, substitute "clientId, displayText" with "user" in the outer
query and "clientId" with "user" in the inner query.

NOTE: high risk access scopes are defined here:
- https://support.google.com/a/answer/7281227?hl=en

More in detail, scopes for Gmail and Drive are defined here:
- https://developers.google.com/gmail/api/auth/scopes
- https://developers.google.com/drive/api/v3/about-auth


## Configuration

The script will create a different table each time it runs, with the name:

app_scopes_YYYYMMDD_HHMMSS_microsecs

The script will create a new dataset in the specified project. The dataset name
and location can be configured by adjusting the following variables in the
script:

```
DATASET_NAME = 'app_scopes'
DATASET_LOCATION = 'EU' # Choose between EU and US
```

If the dataset already exists, the table will be created in the existing
dataset.


## Script parameters

```
  --domain DOMAIN    Domain of your organization
  --ou OU            (Optional) Organizational Unit path, default is /
  --sa SA            Path to Service Account credentials file
  --admin ADMIN      Administrator email account
  --project PROJECT  Project where BigQuery dataset will be created
  --dry-run          (Optional) Do not load data into BigQuery
  --processes        (Optional) Number of concurrent processes to use (default: 4)
```

The number of processes determines how many concurrent processes are spawn to process users.
Each process gets a subset of the users and works independently. For each user, an API call to get its scopes is made. Thus, using multiple processes, allows to place a higher number of API calls per second and process a higher number of users per second. However, after a given threshold, the APIs will respond with throttling and the tool will have to retry the call. For this reason, there is a hard limit of 8 concurrent processes, though you can tweak this limit in the script (by changing the value of MAX_PROCESSES) and experiment with a higher number of processes, if you wish. Keep an eye on the logs to check how frequently the calls are throttled.

Example:

```
python -m gsuite_grant_analyzer.analyze --sa credentials/my-project-1234abcd.json --domain example.com --admin "admin@example.com" --project my-project --ou "/My OU/My Sub OU"
```

It is recommended to perform a test using the --dry-run option first, to check
that the parameters are correct without polluting the dataset with tables.
