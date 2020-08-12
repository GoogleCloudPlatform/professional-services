# A Streaming Sentiment Analysis Pipeline Running on GCP

This repo contains an [Apache Beam](https://beam.apache.org/) pipeline that performs sentiment analysis on streaming data using Google Cloud's [Natural Language API](https://cloud.google.com/natural-language). 

For this example, we'll be analyzing the sentiment of relevant, live tweets using [Twitter's Streaming API](https://developer.twitter.com/en/docs/tutorials/consuming-streaming-data). 

## About

This solution uses the following billable Google Cloud products:
1. [Google Cloud BigQuery](https://cloud.google.com/bigquery)
2. [Google Cloud Compute Engine](https://cloud.google.com/compute)
3. [Google Cloud Dataflow](https://cloud.google.com/dataflow)
4. [Google Cloud Natural Language API](https://cloud.google.com/natural-language)
5. [Google Cloud Pub/Sub](https://cloud.google.com/pubsub)
6. [Google Cloud Storage](https://cloud.google.com/storage)

![Diagram](./diagram.png?raw=true "Optional Title")

## Streaming Live Tweets to Pub/Sub

The [Tweepy](http://docs.tweepy.org/en/latest/streaming_how_to.html) library is used to stream live tweets to Google Cloud Pub/Sub. A standard Google Cloud Compute Engine VM would be an ideal place to run this script.

### Requirements

Use the package manager [pip](https://pip.pypa.io/en/stable/) to install necessary packages.

```bash
sudo apt update
sudo apt install python3-pip
sudo pip3 install -r requirements.txt
```

In order to use the Twitter API, a ```creds_file.json``` must be provided in the ```src/client/``` directory. See an example below.

```json
{
  "CONSUMER_KEY": "<consumer_key>", 
  "CONSUMER_SECRET": "<consumer_secret>",
  "ACCESS_TOKEN_KEY": "<access_token_key>",
  "ACCESS_TOKEN_SECRET": "<access_token_secret"
}

```

All API credentials can be created or found on [Twitter's Developer page](https://developer.twitter.com/en). Your Google Cloud Compute Engine VM may need proper access scopes and access to HTTP/HTTPS traffic upon creation. 

### Running the Script

Set local environment variables:

```bash
PROJECT_ID=<project_id>
TOPIC_ID=<topic_id>
```

And run:

```bash
python3 twitter_to_pubsub.py \
--project_id $PROJECT_ID \
--topic_id $TOPIC_ID \
--filter_level <filter_level> [optional] \
--phrases <list_of_phrases> 
```

The ***project_id*** flag represents the Google Cloud [Project ID](https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects) that this script is operating in.

Before streaming, you should create your own Google Cloud Pub/Sub ***topic_id***. If the topic name does not exist, the script will return a 404 NotFound error.

The ***filter_level*** flag controls which tweets are streamed to Tweepy's [StreamListener](http://docs.tweepy.org/en/latest/streaming_how_to.html#step-1-creating-a-streamlistener) class. Possible values are: _none_, _low_, and _medium_. _medium_ only returns tweets that would be considered "Top Tweets" and _none_ returns all tweets. This flag is optional. If no flag is provided, the filter_level will default to _low_.

***phrases*** controls what tweets are considered "relevant" to the [Stream](http://docs.tweepy.org/en/latest/streaming_how_to.html#step-2-creating-a-stream). Phrases can be hashtags, keywords, mentions, etc. A phrase can be multiple words and will match a tweet if that tweet contains all words in the phrase. For example, the phrase ```--phrases 'google cloud'``` will track all tweets with both words, ```'google'``` and ```'cloud'```. 

Multiple phrases can be used at once by separating them with a space. For example, the phrase ```--phrases 'google' 'twitter'``` will match all tweets that mention either ```'google'``` or ```'twitter'```. If you want to track a hashtag or a mention, change the phrase to ```#hashtag``` or ```@mention```, respectively.

To see more information about the Twitter API stream parameters, see [here](https://developer.twitter.com/en/docs/tweets/filter-realtime/guides/basic-stream-parameters).


## Starting the Pipeline (local/Dataflow) and Outputting Results

The Apache Beam pipeline reads all tweets from Google Cloud Pub/Sub and analyzes each tweet's sentiment using the Cloud Natural Language API. After analysis is done, results are written to BigQuery for further analysis.

### Requirements

Use the package manager [pip](https://pip.pypa.io/en/stable/) to install necessary packages.

```bash
sudo apt update
sudo apt install python3-pip
sudo pip3 install -r requirements.txt
```

### Running the Pipeline

The pipeline can be run using either a local runner or a Dataflow runner. Your Google Cloud Compute Engine VMs may need proper access scopes and access to HTTP/HTTPS traffic upon creation.

When running locally, there is a minimum Compute Engine machine type requirement of [n1-standard-2](https://cloud.google.com/compute/docs/machine-types). To run **locally**, set local variables:

```bash
PROJECT_ID=<project_id>
SUBSCRIPTION_ID=<subscription_id>
BQ_DATASET=<bq_dataset>
BQ_TABLE=<bq_table>
FIXED_WINDOW_SIZE=<fixed_window_size>
```

and run:

```bash
python3 pipeline.py \
--project_id $PROJECT_ID \
--runner DirectRunner \
--susbcription_id $SUBSCRIPTION_ID \
--bq_dataset $BQ_DATASET \
--bq_table $BQ_TABLE \
--fixed_window_size $FIXED_WINDOW_SIZE \
--nlp_batching [optional]
```

To run using **Dataflow**, set local variables:

```bash
PROJECT_ID=<project_id>
SUBSCRIPTION_ID=<subscription_id>
BQ_DATASET=<bq_dataset>
BQ_TABLE=<bq_table>
FIXED_WINDOW_SIZE=<fixed_window_size>
BUCKET=<bucket>
REGION=<region>
```

and run:

```bash
python3 pipeline.py \
--project_id $PROJECT_ID \
--runner DataflowRunner \
--subscription_id $SUBSCRIPTION_ID \
--bq_dataset $BQ_DATASET \
--bq_table $BQ_TABLE \
--fixed_window_size $FIXED_WINDOW_SIZE \
--nlp_batching [optional] \
--temp_location gs://$BUCKET/temp/ \
--region $REGION
```

***subscription_id*** is the subscription ID that is associated to the above topic_id. The subscription should be created prior to execution.

***bq_dataset***, and ***bq_table*** represent the BigQuery table that will be used as a sink for pipeline results. If you already have a BigQuery table created that follows the pipeline's desired schema, then the pipeline will be able to append results to the existing table. If no table exists that follows the desired schema, the pipeline will create the table as long as the dataset and project exist.

***fixed_window_size*** is the size of windows measured in minutes. This pipeline utilizes fixed windows based on processing time. A value of 5 creates 5 minute windows.

***nlp_batching*** controls how the pipeline will call the Natural Language API. If this flag is set, the pipeline will batch all tweets per window per date into a document. After the document is created and the window is closed, the entire document will be sent to the NLP API, resulting in only 1 API call. This is done to drastically reduce network costs. However, in order to document batch, each tweet must be only one sentence, so punctuation ('.', '!', '?') that ends a sentence will be erased. This may alter the true sentiment value of a tweet. If this flag is not present, the pipeline will default to element-wise calls, or calling the API once per tweet. A ```--nlp_batching``` value of 'False' correlates to element-wise calls, or calling the API once per key.

***temp_location*** is the Cloud Storage bucket where Dataflow's temporary files will be located. This may have to be created manually as the pipeline does not create a bucket if the inputted bucket does not exist.

Other pipeline arguments can be found [here](https://cloud.google.com/dataflow/docs/guides/specifying-exec-params#setting-other-cloud-dataflow-pipeline-options) and can be included after --region.

Pub/Sub and Dataflow handle duplicates on a best-effort basis. When publishing, Pub/Sub assigns each message (or tweet) a hidden "messageId". This tweet may be sent multiple times to a topic as Pub/Sub guarantees at-least-once delivery. When the pipeline is run locally, the pipeline uses the "messageId" field to avoid processing duplicate messages. When the pipeline is run using Dataflow, the pipeline can use the tweet's actual ID (from Twitter) instead of the implicit "messageId".
