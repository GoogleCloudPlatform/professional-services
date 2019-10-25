# BigQuery User Info Updater

## Background
BigQuery is often one of the preferred products for customers interested in 
building a data lake on GCP. In some cases, product limitations can impact customers 
who want to use BigQuery in their architecture. 

## Motivating Example
For example, imagine that you need 
to ingest user information data in a table, but when an update is made, only a 
partial row is ingested. In other words, only updated columns in the newly ingested 
row will contain values and all other columns will be null. If you want to query only
 the most up to date, full record, the solution could easily become complicated and inefficient.

In the case mentioned above, imagine we have a destination table called
`user_info_updates`,  which is populated by a Dataflow pipeline that gathers and
ingests data from users registering or updating their profile on a website. 
When users register for the first time, an entire row is ingested in the table:
##### user_info_updates 

 | user_id      | ingestTimestamp    | attribute1     |attribute2    |attribute3     |
| :------------- | :----------- | :----------- | :----------- |  :----------- | 
|  userA | 1   | xyz  |abc  |qwerty|
|  userB | 2   | poc  |mvp  |ytrewq|
|  userC | 3   | zyx  |pvm  |qywter|

Now imagine that userA and userB update their information. In this case the 
data source will send only a partial updated row per update: 


##### user_info_updates 

 user_id      | ingestTimestamp    | attribute1     |attribute2    |attribute3     |
| :------------- | :----------- | :----------- | :----------- |  :----------- | 
|  userA | 1   | xyz  |abc  |qwerty|
|  userB | 2   | poc  |mvp  |ytrewq|
|  userC | 3   | zyx  |pvm  |qywter|
|  userA | 4   |   |ghj  | |
|  userA | 5   |   |  |lot|
|  userB | 6   |  cor |  | |
|  userA | 7   |   | dat ||

These partial rows are not very useful since any non-updated values are missing. 
To provide analysts/data scientists/etc with the latest, full record for each user,
 a table called user_info_final can be created using a series of SQL queries: 

##### user_info_final

 user_id      | ingestTimestamp    | attribute1     |attribute2    |attribute3     |
| :------------- | :----------- | :----------- | :----------- |  :----------- | 
|  userA | 7   | xyz  |dat  |lot|
|  userB | 6   | cor  |mvp  |ytrewq|
|  userC | 3   | zyx  |pvm  |qywter|

The BigQuery User Info Updater to can be used to solve this problem with series of advanced
queries, creating a table with one up-to-date row per customer. 

## Tables 

Before the SQL queries can be written, three tables need to be created:  `user_info_updates`, 
`user_info_updates_temp`, and `user_info_final`. 

All new and updated rows will be stored in `user_info_updates`, so it will serve 
as a historical table. `user_info_updates_temp` will hold the truncated results 
of a query described below. `user_info_final` will hold one row for each customer, 
and each row will hold the most up to date data relative to the last update. 

All tables will share the same schema. While the particular schema does not matter, 
it does need to include a unique ID for each user and a timestamp marking when 
the row was ingested into BigQuery. Throughout this document, these fields will
 be called `userId` and `ingestionTimestamp`.

Note that the table names and fields listed here can be changed to anything you 
need for your use case. 

## SQL
Once the `user_info_updates`, `user_info_updates_temp`, and `user_info_final` 
tables are created, the following SQL queries can be written. 

#### Determine the Max ingestTimestamp from the Last Run
The first query will determine the max `ingestTimestamp` from the last update by 
calculating the max ingestTimestamp from the `temp_user_info_updates` : 

```
SELECT max(ingestTimestamp) as maxIngestTimestamp
FROM `<project_id>.<dataset_id>.temp_user_info_updates`
```

If this is the first update, then the `temp_user_info_updates` table will be empty. 
In this case, the timestamp `1900-01-01 00:00:00.000 UTC` will be used as an 
initial `maxIngestTimestamp`. 

#### Find Unprocessed Updates
The next query will find all unprocessed updates from the `user_info_updates table`
 (i.e. any rows with an `ingestionTimestamp` greater than the `maxIngestionTimestamp` 
 from the above query), deduplicate the updates, and combine multiple
  updates per user into one row using a window function. 
  
```
SELECT 
    userId,
    ingestTimestamp,
    attribute1,
    attribute2,
    attribute3
FROM (
    SELECT
        userId,
        ingestTimestamp,
        FIRST_VALUE(
            attribute1 IGNORE NULLS
        ) OVER(win) attribute1,
        FIRST_VALUE(
            attribute2 IGNORE NULLS
        ) OVER(win) attribute2,
        FIRST_VALUE(
            attribute3 IGNORE NULLS
        ) OVER(win) attribute3,
        FIRST_VALUE(
            ingestTimestamp
        ) OVER(WIN) maxTimestampInWindow
    FROM (
        SELECT * FROM `<project_id>.<dataset_id>.test_user_info_updates`
        WHERE ingestTimestamp  > timestamp(maxIngestTimestamp)
    )
    window win as (
        partition by userId ORDER BY ingestTimestamp DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    )
)
WHERE ingestTimestamp = maxTimestampInWindow
```

The results of this query will be saved to the `temp_user_update_info` table. 

#### Merge New Updates into user_info_final Table

Now that the most recent updates are in `temp_user_update_info`, we need to merge them into `user_info_final`. 

```buildoutcfg
MERGE `<project_id>.<dataset_id>.user_info_final` m
USING `<project_id>.<dataset_id>.temp_user_info_updates` u
ON m.userId = u.userId
WHEN MATCHED THEN 
	UPDATE SET
		ingestTimestamp = u.ingestTimestamp,
		attribute1 =
		(CASE
			WHEN u.attribute1 IS NOT NULL
				THEN u.attribute1
			ELSE m.attribute1 END
		),
		attribute2 =
		(CASE
			WHEN u.attribute2 IS NOT NULL
				THEN u.attribute2
			ELSE m.attribute2 END
		),
		attribute3 =
		(CASE
			WHEN u.attribute3 IS NOT NULL
				THEN u.attribute3
			ELSE m.attribute3 END
		)
WHEN NOT MATCHED THEN
	INSERT ROW

```
This query works by updating in bulk any rows in `user_info_final` with userId’s 
that match those in `temp_user_info_updates`. Each field in the matching rows 
will only be updated if the corresponding row in `temp_user_info_updates` is not 
null (remember that updates ingested into BigQuery only contain non-NULL values
 for fields that have been updated). 

If there are rows in `temp_user_info_updates` that do not have matching rows in 
`user_info_final`, then these are new rows that will be inserted into 
`user_info_final` in bulk. 


## Usage

#### Environment Initialization 
In order to use this tool, all three user tables first need to be created. A script called [initialize_bigquery_resources.py](biguqery_user_info_updater/initialize_bigquery_resources.py)
has been included to create the tables. To run it, follow these steps: 
* Obtain the schema that you would like to use for the user tables. Primitive types and `RECORD` types can be included
in the schema. Make sure it is in JSON format following 
    this pattern:
```    
{
    "fields": [
        {
            "name": "userId",
            "type": "STRING",
            "mode": "REQUIRED"
        },
        {
            "name": "ingestTimestamp",
            "type": "TIMESTAMP",
            "mode": "REQUIRED"
        },
        {
            "name": "attribute1",
            "type": "STRING",
            "mode": "NULLABLE"
        },
        {
            "name": "attribute2",
            "type": "STRING",
            "mode": "NULLABLE"
        },
        {
            "name": "attribute3",
            "type": "STRING",
            "mode": "NULLABLE"
        }
    ]
}

```

* Run the following command to create a dataset and the three tables described above: 
```
python biguqery_user_info_updater/initialize_bigquery_resources.py \
--project_id=<ID of your project> \
--schema_path=<Path to the JSON user schema described in the first step> \
--dataset_id=<ID of the dataset that will hold the user tables> \
--final_table_id=<ID of the final golden record table (i.e. user_info_final)> \
--updates_table_id=<ID of the table that will hold updates (i.e. user_info_updates)> \
--temp_updates_table_id=<ID of the intermediary table (i.e. temp_user_info_updates)>
```
 
* Configure your Dataflow pipeline to start writing updates to the `user_info_updates` table. 

#### Updating User Info

In order to update user info, run the [update_user_info.py](bigquery_user_info_updater/update_user_info.py) script using the 
following command:  
```
python biguqery_user_info_updater/update_user_info.py \
--project_id=<ID of your project> \
--schema_path=<Path to the JSON user schema described in the first step> \
--dataset_id=<ID of the dataset that will hold the user tables> \
--final_table_id=<ID of the final golden record table (i.e. user_info_final)> \
--updates_table_id=<ID of the table that will hold updates (i.e. user_info_updates)> \
--temp_updates_table_id=<ID of the intermediary table (i.e. temp_user_info_updates)> \
--user_id_field_name=<Name of the field that identifies unique users (i.e. userId) \
--ingest_timestamp_field_name=<Name of the timestamp field that marks the ingestion of user rows (i.e. ingestTimestamp)> 

```

#### Scheduling Updates with CronJobs on GKE
Once the script and queries have been setup and tested, the next step (if desired) is to schedule the job to run so that user info can be periodically updated.  There are few options for scheduling using different technologies (ie GKE, Cloud Composer,..) 
For the purpose of this article we decided to leverage [GKE Cronjobs](https://cloud.google.com/kubernetes-engine/docs/how-to/cronjobs) (currently in Beta). 

##### Prepare Files
In order to schedule the script via a CronJob in GKE, several files will need to be prepared and created. 

1. First make sure to `cd` into the [`cron`](cron) directory of the this repo. Once there, copy the `bigquery_user_info_updater` directory into the cron directory so that the cron files will have access to the script: 
```cp -r ../../bigquery_user_info_updater/ bigquery_user_info_updater```

2. Uncomment the commented lines in [`cron/bigquery_user_updater.sh`](cron/bigquery_user_updater.sh) with your own values.

3. Uncomment the commented lines in [`cron/Dockerfile`](cron/Dockerfile) with your own values. While you can set the schedule and most name parameters to whatever you 
would like, the important thing is that you absolutely set the `concurrencyPolicy` to `Forbid`. If a job kicks off while another is running, the data in the final table
will be at risk for inaccuracies and duplicates. Also, it is important that you keep `env.name` set to `GOOGLE_APPLICATION_CREDENTIALS`. This will allow your container to export your google 
cloud credentials into a `GOOGLE_APPLICATION_CREDENTIALS` environmental variable using a secret key that we will create later. Without this environmental variable, the code run in the container 
will not be able to access your project resources. 

##### Create Kubernetes Resources
Once all your files are prepared, then it’s time to create an image, secret, and namespace for our GKE CronJob. Also, we will need to create the CronJob itself. 

1. To create your image, run:  ```gcloud builds submit --tag gcr.io/<your project ID>/<the name you would like to give your image> .```
2. To create a namespace, run: ```kubectl create namespace bigquery-user-updater-namespace```
3. To create your secret, run: ```kubectl create secret generic <name you would like to give your secret> --from-file=key.json=<path to your service account json key> --namespace <name you gave your namespace>``` 
Make sure that the name you give your secret is the same as the name you entered under `volumes.secret.secretName` in the `deployment yaml`. This is what will allow your container to access your GCP resources. 
4. To create the CronJob itself, run: ```kubectl apply -f deployment.yaml --namespace <name you gave your namespace>```

##### Monitor and Manage Kubernetes Resources
In order to monitor each run of the CronJob, you will have to monitor its individual pods: 
```kubectl --namespace <name of namespace> describe pods```

This will return a list of pods such as: 
```NAME                                    READY STATUS      RESTARTS   AGE
<CronJob name>-1566342060-cbfk5         0/1   Completed   0         5m47s
<CronJob name>-1566342120-pkz2w         0/1   Completed   0          47s  
```

To check logs for each run, check the logs for the associated pod:
```kubectl --namespace <name of namespace>  logs <name of pod> ```
These logs will capture any output from successful runs, as well as errors from runs that have crashed. 

If the pods are stuck in a status such as `ContainerCreating` for an extended period of time, the logs command may not work. In this case, use 
```kubectl --namespace <name of namespace> describe pods```
to understand why the container is unable to start. 

In order to delete any resources created in this section, run the following commands: 

```kubectl --namespace <name of namespace>  delete pod <name of pod>
kubectl --namespace <name of namespace>  delete cronjob <name of CronJob>
kubectl --namespace <name of namespace>  delete secret <name of secret> 
kubectl delete namespace <name of  namespace>
```

## Testing

Tests can be run by running the following command in the bigquery_user_info_updater
directory:

```
python -m pytest bigquery_user_info_updater/ --project_id=<ID of project that will hold test resources>

```

Note that the tests will create and destroy resources in the project denoted
by `--project_id`. 
