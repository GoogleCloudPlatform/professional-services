# Bee Health Detection Example

This repository contains example code detect if a bee is healthy. Specifically, given a picture and structured attributes about a bee, it predicts if the bee is healthy.

The code leverages pre-trained TF Hub image modules and uses Google Cloud Machine Learning Engine to train a TensorFlow DNN classification model.

## Default values
```
JOB_NAME = ml_job$(date +%Y%m%d%H%M%S)
JOB_FOLDER = MLEngine/${JOB_NAME}
BUCKET_NAME = bee-health
MODEL_PATH = $(gsutil ls gs://${BUCKET_NAME}/${JOB_FOLDER}/export/estimator/ | tail -1)
MODEL_NAME = prediction_model
MODEL_VERSION = version_1
TEST_DATA = data/test.csv
PREDICTIONS_FOLDER = ${JOB_FOLDER}/test_predictions
```

## Train model
```
gcloud ml-engine jobs submit training $JOB_NAME \
        --job-dir=gs://${BUCKET_NAME}/${JOB_FOLDER} \
        --runtime-version=1.10 \
        --region=us-central1 \
        --scale-tier=PREMIUM_1 \
        --module-name=trainer.task \
        --package-path=trainer
```

## Hyper-parameter tuning
```
gcloud ml-engine jobs submit training ${JOB_NAME} \
        --job-dir=gs://${BUCKET_NAME}/${JOB_FOLDER} \
        --runtime-version=1.10 \
        --region=us-central1 \
        --module-name=trainer.task \
        --package-path=trainer \
        --config=config.yaml
```

## Create model
```
gcloud ml-engine models create ${MODEL_NAME} --regions=us-central1
```

## Create model version
```
gcloud ml-engine versions create ${MODEL_VERSION} \
        --model=${MODEL_NAME} \
        --origin=${MODEL_PATH} \
        --runtime-version=1.10
```

## Predict on test data
```
gcloud ml-engine jobs submit prediction ${JOB_NAME} \
    --model=${MODEL_NAME} \
    --input-paths=gs://${BUCKET_NAME}/${TEST_DATA} \
    --output-path=gs://${BUCKET_NAME}/${PREDICTIONS_FOLDER} \
    --region=us-central1 \
    --data-format=TEXT \
    --signature-name=predict \
    --version=${MODEL_VERSION}
```