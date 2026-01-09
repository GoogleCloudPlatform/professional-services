# Sentiment analysis using TensorFlow RNNEstimator on Google Cloud Platform.

### Overview.

This code aims at providing a simple example of how to train a RNN model using
TensorFlow
[RNNEstimator](https://www.tensorflow.org/api_docs/python/tf/contrib/estimator/RNNEstimator)
on Google Cloud Platform. The model is designed to handle raw text files in
input without preprocessing needed. A more detailed guide can be found
[here](https://docs.google.com/document/d/1CKYdv_LyTcpQw07UH_4iCsxL6IGs6hmsFWwUMv5bwug/edit#).

### Problem and data.

The problem is a text classification example where we categorize the movie
reviews into positive or negative sentiment. We base this example on the IMDb
dataset provided from this website:
http://ai.stanford.edu/~amaas/data/sentiment/

### Set-up environment.

```sh
PROJECT_NAME=sentiment_analysis
git clone https://github.com/GoogleCloudPlatform/professional-services.git
cd professional-services/examples/cloudml-sentiment-analysis
python -m virtualenv env
source env/bin/activate
python -m pip install -U pip
python -m pip install -r requirements.txt
```

### Download data.

```sh
DATA_PATH=data
INPUT_DATA=${DATA_PATH}/aclImdb/train
TRAINING_INPUT_DATA=${DATA_PATH}/training_data
wget http://ai.stanford.edu/~amaas/data/sentiment/aclImdb_v1.tar.gz -P $DATA_PATH
tar -xzf ${DATA_PATH}/aclImdb_v1.tar.gz -C $DATA_PATH
```

### Configure GCP.

```sh
PROJECT_ID=<...>
BUCKET_PATH=<...>
gcloud config set project $PROJECT_ID
```

### Move data to GCP.

```sh
gcloud storage cp --recursive $DATA_PATH/aclImdb $BUCKET_PATH
GCP_INPUT_DATA=$BUCKET_PATH/aclImdb/train
```

### Preprocess data.

```sh
JOB_NAME=training-$(date +"%Y%m%d-%H%M%S")
PROCESSED_DATA=$BUCKET_PATH/processed_data/$JOB_NAME
python run_preprocessing.py \
  --input_dir=$GCP_INPUT_DATA \
  --output_dir=$PROCESSED_DATA \
  --gcp=True \
  --project_id=$PROJECT_ID \
  --job_name=$JOB_NAME \
  --num_workers=8 \
  --worker_machine_type=n1-highcpu-4 \
  --region=us-central1
```

### Train model locally.

```sh
MODEL_NAME=${PROJECT_NAME}_$(date +"%Y%m%d_%H%M%S")
TRAINING_OUTPUT_DIR=models/$MODEL_NAME
python -m trainer.task \
  --input_dir=$PROCESSED_DATA \
  --model_dir=$TRAINING_OUTPUT_DIR
```

### Train model on GCP.

```sh
MODEL_NAME=${PROJECT_NAME}_$(date +"%Y%m%d_%H%M%S")
TRAINING_OUTPUT_DIR=${BUCKET_PATH}/$MODEL_NAME
gcloud ml-engine jobs submit training $MODEL_NAME \
  --module-name trainer.task \
  --staging-bucket $BUCKET_PATH \
  --package-path $PWD/trainer \
  --region=us-central1 \
  --runtime-version 1.12 \
  --config=config_hp_tuning.yaml \
  --stream-logs \
  -- \
  --input_dir $PROCESSED_DATA \
  --model_dir $TRAINING_OUTPUT_DIR
```

### Train model locally with gcloud.

```sh
MODEL_NAME=${PROJECT_NAME}_$(date +"%Y%m%d_%H%M%S")
TRAINING_OUTPUT_DIR=models/$MODEL_NAME
gcloud ml-engine local train \
  --module-name=trainer.task \
  --package-path=$PWD/trainer \
  -- \
  --input_dir=$PROCESSED_DATA \
  --model_dir=$TRAINING_OUTPUT_DIR
```

### Monitor with tensorboard.

```sh
tensorboard --logdir=$TRAINING_OUTPUT_DIR
```

### Save model in GCP.

**With HP tuning:**
```sh
TRIAL_NUMBER=''
MODEL_SAVED_NAME=$(gcloud storage ls ${TRAINING_OUTPUT_DIR}/${TRIAL_NUMBER}/export/exporter/ | tail -1)
```

**Without HP tuning:**
```sh
MODEL_SAVED_NAME=$(gcloud storage ls ${TRAINING_OUTPUT_DIR}/export/exporter/ | tail -1)
```

```sh
gcloud ml-engine models create $PROJECT_NAME \
  --regions us-central1
gcloud ml-engine versions create $MODEL_NAME \
  --model $PROJECT_NAME \
  --origin $MODEL_SAVED_NAME \
  --runtime-version 1.12
```

### Make local online predictions.

```sh
gcloud ml-engine local predict \
  --model-dir=${TRAINING_OUTPUT_DIR}/export/exporter/$(ls ${TRAINING_OUTPUT_DIR}/export/exporter/ | tail -1) \
  --text-instances=${DATA_PATH}/aclImdb/test/*/*.txt
```

### Make online predictions with GCP.

```sh
gcloud ml-engine predict \
  --model=$PROJECT_NAME \
  --version=$MODEL_NAME \
  --text-instances=$DATA_PATH/aclImdb/test/neg/0_2.txt
```

### Move out of sample data to GCS.

```sh
PREDICTION_DATA_PATH=${BUCKET_PATH}/prediction_data
gcloud storage cp --recursive ${DATA_PATH}/aclImdb/test/ $PREDICTION_DATA_PATH
```

### Make batch predictions with GCP.

```sh
JOB_NAME=${PROJECT_NAME}_predict_$(date +"%Y%m%d_%H%M%S")
PREDICTIONS_OUTPUT_PATH=${BUCKET_PATH}/predictions/$JOB_NAME
gcloud ml-engine jobs submit prediction $JOB_NAME \
  --model $PROJECT_NAME \
  --input-paths $PREDICTION_DATA_PATH/neg/* \
  --output-path $PREDICTIONS_OUTPUT_PATH \
  --region us-central1 \
  --data-format TEXT \
  --version $MODEL_NAME
```

### Scoring.

```sh
python scoring.py \
  --project_name=$PROJECT_ID \
  --model_name=$PROJECT_NAME \
  --input_path=$DATA_PATH/aclImdb/test \
  --size=1000 \
  --batch_size=20
```
