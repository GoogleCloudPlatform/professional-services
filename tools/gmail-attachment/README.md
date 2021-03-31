# Overview

You would need to install [gmail-dataflow](../gmail-dataflow) asset before using the gmail-attachment. The gmail-dataflow asset will pull gmail messages into a pub-sub topic. This asset can be leveraged on top of that to pull any attachment from any gmail messages and store them into a specified Google Cloud Storage bucket.

# How to use
Run a dataflow job to read from the pub-sub topic that the gmail-dataflow asset will publish to and download any attachment to specified Google Cloud Storage bucket.

First you need to download the service account JSON file as described in [gmail-dataflow](../gmail-dataflow). You could reuse the same service account as mentioned for this as well.

From the service account json file copy the value of _**"private_key"**_ and update the value in _**gmail-attachment.py**_ in variable _**SA_JSON**_ and then you can run the dataflow job.

To run the dataflow job use the following command:

```shell
export GOOGLE_APPLICATION_CREDENTIALS=<YOUR_GOOGLE_APPLICATION_CREDENTIALS>

gcloud auth activate-service-account \
--key-file=<YOUR_GOOGLE_APPLICATION_CREDENTIALS>

export PROJECT=<YOUR_PROJECT>
export BUCKET=<YOUR_BUCKET>
export REGION=<YOUR_REGION>

python3 -m gmailattachment \
--region $REGION \
--runner DataflowRunner \
--project $PROJECT \
--temp_location gs://$BUCKET/temp \
--input_topic="projects/$PROJECT/topics/<YOUR_INPUT_TOPIC>" \
--output_path=gs://$BUCKET/<ATTCHMENT_DIR>/


```