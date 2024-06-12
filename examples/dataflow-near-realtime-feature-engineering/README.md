# Near realtime (NRT) Feature Producer

## Hypothetical Scenario

We want to build and use near real time (NRT) features in the hypotethical scoring system. Scoring is not part of this example. There are multiple sources that produce NRT features. Features are ideally defined in the feature store system and are exposed in the online store.

### Features 
Features are stored in BigQuery and synced to Online Feature store (Vertex ai). Below you can see the definition. 

| Feature type | Feature name | Feature source | Window (assuming sliding)/Period | Method (Beam SQL) | Destination
|--------|---------------------|------------------|-----------------------|----------------------|----------------------|
| NRT   | Total_number_of_clicks_last_90sec per user_id   | Ga4 topic           | 90sec/30s  | count(*)   | BQ table  |
| NRT    | Total_number_of_logins_last_5min per user_id   | Authn topic   |   300sec/30s     | count(*)  | BQ table |
| NRT    | Total_number_of_transactions_last5min per user_id    |  Transactions topic   | 300sec/30s  |  count(*)  | BQ table |

###  Scoring pipeline (not part of the example)

Pipeline input is a transaction topic, for each message, it takes entity id and use it for enrichment - it reads total_number_of_clicks_last_90sec, total_number_of_logins_last_5min, total_number_of_transactions_last5min and many other historical features that are needed for scoring. 
Score is emitted downstream along with transaction details. 

### Near real time feature engineering pipeline
Pipeline takes events from the source topic, splits into multiple branches based on windowing strategy (duration, period) and does aggregations.

Branches are joined back (which is tricky!), and stored into the destination table. 

### Visualization
To simplify the visualization here are 2 features (f1, f2) - 90s and 60s. As there is a sliding window happening, each row has overlapping windows visualized.

Events happen within the (window start, window end boundary), but output of aggregation is triggered at the end of the window with a timestamp of end boundary minus 1ms, e.g. 29.999.  

![viz](viz.png)

Notice that windows emit by the end of first period and second period already contain aggregations for 60s and 90s windows. 

Notice also that this pipeline should also emit 0 (default for some aggregations) even if there is no window triggered due as there is no data for key.  

### Resetting feature value 
There is a need to reset total_number_of_clicks_last_90sec if there are no more events for a specific user_id. 

Solution is implementing a stateful processing step after each feature calculation that resets timer or expires value (produce default/0/null). There is additional windowing needed to make this possible. 

### Merging branches
Total_number_of_clicks_last_90sec and total_number_of_locations_last_5min are features that are calculated based on the same data product or similar period and should ideally be stored in the same destination. 
Pipeline takes events from ga4 topic, splits into two branches, does window (90s and 300s) and aggregations (count and count distinct). 
As windows are different, the result of window & aggregation can’t be instatnly co-grouped and stored as one row (entity_id, Total_number_of_clicks_last_90sec, total_number_of_locations_last_5min, timestamp). 

Solution here is that the windowing period should match (events are produced at the same rate)and branches should be re-windowed to a fixed window and co-grouped. 

## Sources

Repository is created based on [quickstart](https://cloud.google.com/dataflow/docs/quickstarts/create-pipeline-java), but most of the files are removed.

It contains NRTFeature transform and other building blocks to showcase how implement above requirements. 

## Architecture of demo pipeline

There  is demo pipeline implemented with taxi data source, producing two features and storing them to BQ backed feature store. 


```

                   ┌──────────────┐
                   │  PubSubIO    │ Topic: taxirides-realtime
                   │ (Read/Source)│
                   └──────┬───────┘
                          │  PCollection<String>
                          v
                   ┌────────────────┐
                   │  JsonToRow     │
                   └──────┬────┬────┘
                          │    │  PCollection<Row>
                          │    │
                          │    │
                          │    │
                  ┌───────┘    │
                  │            └────────┐  
                  v                     v
           ┌──────────────┐      ┌───────────────────┐
           │NRTFeature    │      │ NRT Feature (pax) │ max(passenger_count) group by ride_id
           │   (meter)    │      └──────┬────────────┘
           └──────────────┘             │  PCollection<KV<String,Row>>
                  │                     │
                  │                     │
                  │                     │
                  │                     │
                  └─ ──────┐  ┌─────────┘
                           v  v
                     ┌───────────────┐
                     │ CoGroupByKey  │
                     └──────┬────────┘
                            │  PCollection<KV<String, CoGbkResult>> 
                     ┌───────────────┐
                     │ CoGroupByKey  │
                     └──────┬────────┘          
                            │   PCollection<KV<TableRow> 
                            v
                  ┌──────────────────────┐
                  │  BigQueryIO          │ 
                  │(features)            │
                  └──────────────────────┘



```

## Run

Altough pom.xml supports multiple profiles, this was tested locally and dataflow only.

### Dataflow

```
mvn -Pdataflow-runner compile exec:java \
-Dexec.mainClass=com.google.dataflow.feature.pipeline.TaxiNRTPipeline \
-Dexec.args="--project=PROJECT_ID \
--gcpTempLocation=gs://BUCKET_NAME/temp/ \
--output=gs://BUCKET_NAME/output \
--runner=DataflowRunner \
--projectId=FEATURE_PROJECT_ID \
--datasetName=FEATURE_DATASET_NAME \
--tableName=FEATURE_TABLE_NAME \
--region=REGION"
```
