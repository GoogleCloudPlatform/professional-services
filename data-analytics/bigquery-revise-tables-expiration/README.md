# BigQuery Revise Tables Expiration

BigQuery permits a [default table expiration time](https://cloud.google.com/bigquery/docs/datasets#table-expiration) for newly-created tables in a datset. This setting is applied to tables that are created *after* it is set but how can you change the expiration time on existing tables?

This script enumerates the tables in a dataset and applies an expiration time to every table in the dataset. The expiration time may be in the future or in the past.

This script is provided as-is and you are strongly encouraged to test this script on a test dataset in order to demonstrate to yourself that it works as you intend.


## Test the script

<span style="color:red">WARNING: Create a test project, test dataset and populate it with some test tables</span>

```
mkdir ${HOME}/tmp
git clone https://github.com/GoogleCloudPlatform/professional-services.git
cd professional-services/data-analytics/bigquery-revise-table-expiration

virtualenv venv
source venv/bin/activate
pip install --requirement requirements.txt
```

In `bigquery_revise_tables_expiration.py` replace the values of 
* Line 14: `[YOUR-PROJECT]`
* Line 15: `[YOUR-DATASET]`
* Line 18: The value of `EXPIRATION_DAYS` (this is currently set to 60 days in the future)

and then `python bigquery_revise_tables_expiration.py`

The script should report a list of table names, their creation time and their existing (!) expiration time.

If the table's expiration time is currently the new expiration time, the table is *not* patched and the output includes a "☑" (tick). If the table's expiration time is currently different from the new expiration time, the table is patched and the output includes "☒ - patched"

Using my test data, here are the results. The expiration time of the 1st five tables was already set to the new expiration time and the metadata was not patched. The 2nd five tables had the metadata for the expiration time patched.

```
c6 2018-01-05 17:17:09.291000 2018-03-08 16:00:00 -- ☑
c7 2018-01-05 17:17:09.460000 2018-03-08 16:00:00 -- ☑
c8 2018-01-05 17:17:09.617000 2018-03-08 16:00:00 -- ☑
d0 2018-01-05 17:17:09.771000 2018-03-08 16:00:00 -- ☑
d1 2018-01-05 17:17:09.947000 2018-03-08 16:00:00 -- ☑
d2 2018-01-05 17:17:10.137000 2018-02-22 08:02:33 -- ☒ - patched
d3 2018-01-05 17:17:10.301000 2018-02-22 08:02:33 -- ☒ - patched
d4 2018-01-05 17:17:10.480000 2018-02-22 08:02:33 -- ☒ - patched
d5 2018-01-05 17:17:10.645000 2018-02-22 08:02:33 -- ☒ - patched
d6 2018-01-05 17:17:10.806000 2018-02-22 08:02:33 -- ☒ - patched
```

<span style="color:red">WARNING: If you set the expiration to a time in the past, tables will immediately expire and be deleted</span>

When you are finished with the script you may deactive the virtualenv and delete the directory.

## How does the script work?

The script uses:

* [Application Default Credentials](https://developers.google.com/identity/protocols/application-default-credentials) as a powerful and convenient authentication mechanism. You will need to run the command `gcloud auth application-default login` in order to make your identity available for use by the script.

* Google's [BigQuery API Client Library for Python](https://developers.google.com/api-client-library/python/apis/bigquery/v2)

In order that you be able to resume the script if it fails as it iterates over a dataset, the time it uses is midnight (00:00 UTC) of the new expiration day. This should (it does not guarantee) ensure that all the tables receive the same expiration epoch time and, if the job is resumed, the script can skip over any tables that already have the new expiration time.

The script iterates over every table in the dataset and patches each table's metadata with the new expiration time.

The script has <span style="color:red">no error handling</span>.