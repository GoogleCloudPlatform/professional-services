# Churn Prediction with Survival Analysis
This model uses Survival Analysis to classify customers into time-to-churn buckets. The model output can be used to calculate each user's churn score for different durations.

The same methodology can be used used to predict customers' total lifetime from their "birth" (initial signup, or t = 0) and from the current state (t > 0).

## Why is Survival Analysis Helpful for Churn Prediction?
Survival Analysis is used to predict the time-to-event, when the event in question has not necessarily occurred yet. In this case, the event is a customer churning.

If a customer is still active, or is "censored" using Survival Analysis terminology, we do not know their final lifetime or when they will churn. If we assume that the customer's lifetime ended at the time of prediction (or training), the results will be biased (underestimating lifetime). Throwing out active users will also bias results through information loss.

By using a Survival Analysis approach to churn prediction, the entire population (regardless of current tenure or status) can be included.

## Dataset
This example uses the public [Google Analytics Sample Dataset](https://support.google.com/analytics/answer/7586738?hl=en) on BigQuery and artificially generated subscription start and end dates as input.

To create a churn model with real data, omit the 'Generate Data' step in the Beam pipeline in preprocessor/preprocessor/preprocess.py. Instead of randomly generating values, the BigQuery results should include the following fields: start_date, end_date, and active. These values correspond to the user's subscription lifetime and their censorship status.

## Setup
### Set up GCP credentials
```shell
gcloud auth login
gcloud auth application-default login
```

### Set up Python environment
```shell
virtualenv venv
source ./venv/bin/activate
pip install -r requirements.txt
```


## Preprocessing
Using Dataflow, the data preprocessing script reads user data from BigQuery, generates random (fake) time-to-churn labels, creates TFRecords, and adds them to Google Cloud Storage.

Each record should have three labels before preprocessing:
1. **active**: indicator for censorship. It is 0 if user is inactive (uncensored) and 1 if the user is active (censored).
2. **start_date**: Date when user began their lifetime.
3. **end_date**: Date when user ends their lifetime. It is None if the user is still active.
`_generateFakeData` randomly generates these three fields in order to create fake sample data. In practice, these fields should be available in some form in the historical data.

During preprocessing, the aforementioned fields are combined into a single `2*n-dimensional indicator array`, where n is the number of bounded lifetime buckets (i.e. n = 2 for 0-2 months, 2-3 months, 3+ months):
  + indicator array = [survival array | failure array]
  + survival array = 1 if individual has survived interval, 0 otherwise (for each of the n intervals)
  + failure array = 1 if individual failed during interval, 0 otherwise
    + If an individual is censored (still active), their failure array contains only 0s

### Set Constants
```shell
BUCKET="gs://[GCS Bucket]"
NOW="$(date +%Y%m%d%H%M%S)"
OUTPUT_DIR="${BUCKET}/output_data/${NOW}"
PROJECT="[PROJECT ID]"
```

### Run locally with Dataflow
```shell
cd preprocessor

python -m run_preprocessing \
--output_dir "${OUTPUT_DIR}" \
--project_id "${PROJECT}"

cd ..
```

### Run on the Cloud with Dataflow
The top-level preprocessor directory should be the working directory for running the preprocessing script. The setup.py file should be located in the working directory.

```shell
cd preprocessor

python -m run_preprocessing \
--cloud \
--output_dir "${OUTPUT_DIR}" \
--project_id "${PROJECT}"

cd ..
```


## Model Training
Model training minimizes the negative of the log likelihood function for a statistical Survival Analysis model with discrete-time intervals. The loss function is based off the paper [A scalable discrete-time survival model for neural networks](https://peerj.com/articles/6257.pdf).

For each record, the conditional hazard probability is the probability of failure in an interval, given that individual has survived at least to the beginning of the interval. Therefore, the probability that a user survives the given interval, or the likelihood, is the product of (1 - hazard) for all of the earlier (and current) intervals.

So, the log likelihood is: ln(current hazard) + sum(ln(1 - earlier hazards)) summed over all time intervals. Equivalently, each individual's log likelihood is: `ln(1 - (1 if survived 0 if not)*(Prob of failure)) + ln(1 - (1 if failed 0 if not)*(Prob of survival))` summed over all time intervals.

### Set Constants
The TFRecord output of the preprocessing job should be used as input to the training job.

Make sure to navigate back to the top-level directory.

```shell
INPUT_DIR="${OUTPUT_DIR}"
MODEL_DIR="${BUCKET}/model/$(date +%Y%m%d%H%M%S)"
```

### Train locally with AI Platform
```shell
gcloud ai-platform local train \
--module-name trainer.task \
--package-path trainer/trainer \
--job-dir ${MODEL_DIR} \
-- \
--input-dir "${INPUT_DIR}"
```

### Train on the Cloud with AI Platform
```shell
JOB_NAME="train_$(date +%Y%m%d%H%M%S)"

gcloud ai-platform jobs submit training ${JOB_NAME} \
--job-dir ${MODEL_DIR} \
--config trainer/config.yaml \
--module-name trainer.task \
--package-path trainer/trainer \
--region us-east1 \
--python-version 3.5 \
--runtime-version 1.13 \
-- \
--input-dir ${INPUT_DIR}
```

### Hyperparameter Tuning with AI Platform
```shell
JOB_NAME="hptuning_$(date +%Y%m%d%H%M%S)"

gcloud ai-platform jobs submit training ${JOB_NAME} \
--job-dir ${MODEL_DIR} \
--module-name trainer.task \
--package-path trainer/trainer \
--config trainer/hptuning_config.yaml \
--python-version 3.5 \
--runtime-version 1.13 \
-- \
--input-dir ${INPUT_DIR}
```

### Launch Tensorboard
```shell
tensorboard --logdir ${MODEL_DIR}
```

## Predictions
The model predicts the conditional likelihood that a user survived an interval given that the user reached the interval. It outputs an n-dimensional vector, where each element corresponds to predicted conditional probability of surviving through end of time interval (1 - hazard).

In order to determine the predicted class, the cumulative product of the conditional probabilities must be compared to some threshold.

### Deploy model on AI Platform
The SavedModel was saved in a timestamped subdirectory of model_dir.
```shell
MODEL_NAME="survival_model"
VERSION_NAME="demo_version"
SAVED_MODEL_DIR=$(gsutil ls $MODEL_DIR/export/export | tail -1)

gcloud ai-platform models create $MODEL_NAME \
--regions us-east1

gcloud ai-platform versions create $VERSION_NAME \
  --model $MODEL_NAME \
  --origin $SAVED_MODEL_DIR \
  --runtime-version=1.13 \
  --framework TENSORFLOW \
  --python-version=3.5
```
### Running batch predictions
```shell
INPUT_PATHS=$INPUT_DIR/data/test/*
OUTPUT_PATH=<GCS directory for predictions>
JOB_NAME="predict_$(date +%Y%m%d%H%M%S)"

gcloud ai-platform jobs submit prediction $JOB_NAME \
    --model $MODEL_NAME \
    --input-paths $INPUT_PATHS \
    --output-path $OUTPUT_PATH \
    --region us-east1 \
    --data-format TF_RECORD
```
