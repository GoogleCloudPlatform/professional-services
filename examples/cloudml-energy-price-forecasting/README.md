# Energy Price Forecasting Example

This repository contains example code to forecast energy prices. Specifically, given a historical time series of hourly spot prices and weather, it predicts future hourly spot prices multiple days into the future. 

The code takes in raw data from BigQuery, transforms and prepares the data, uses Google Cloud Machine Learning Engine to train a TensorFlow DNN regression model on historical spot prices, and then makes predictions of future spot prices using the model. 

# Data preparation instructions

1. Raw data for this problem is publicly available in BigQuery in the following tables:  

* `energy-forecasting.Energy.MarketPricePT` - Historical hourly energy prices.  
* `energy-forecasting.Energy.historical_weather` - Historical hourly weather forecasts.

   Disclaimer: The data for both tables was downloaded from http://complatt.smartwatt.net/. This website hosts a closed competition meant to solve the energy price forecasting problem. The data was not collected or vetted by Google LLC and hence, we can't guarantee the veracity or qualitty of it.

2. Run: ```python -m data_preparation.data_prep``` to generate training/validation/testing data as well as to generate constants needed for normalization. The produced data has the following columns:
* price - FLOAT - Energy price.
* date_utc - TIMESTAMP - Date and hour for specified price.
* day - INTEGER - Day of week.
* hour - INTEGER - Hour of day.
* distribution0 to distribution4 - FLOAT - Distribution of hourly prices during the previous week (min, 25th, 50th, 75th, max).
* weather0 to weather179 - FLOAT - Weather features. Contains 10 distinct weather metrics (temperature, wind_speed_100m, wind_direction_100m, air_density, precipitation, wind_gust, radiation, wind_speed, wind_direction, pressure) from 18 distinct parts of the country (180 total features).

3. Export training/validation/testing tables as CSVs using UI (into GCS bucket gs://energyforecast/data/csv).

# Train, tune hyper-parameters, publish model, and predict.

## Default values
```
JOB_NAME = ml_job$(date +%Y%m%d%H%M%S)
JOB_FOLDER = MLEngine/${JOB_NAME}
BUCKET_NAME = energyforecast
MODEL_PATH = $(gsutil ls gs://${BUCKET_NAME}/${JOB_FOLDER}/export/estimator/ | tail -1)
MODEL_NAME = forecaster_model
MODEL_VERSION = version_1
TEST_DATA = data/csv/DataTest.csv
PREDICTIONS_FOLDER = ${JOB_FOLDER}/test_predictions
```

## Train model
```
gcloud ai-platform jobs submit training $JOB_NAME \
        --job-dir=gs://${BUCKET_NAME}/${JOB_FOLDER} \
        --runtime-version=1.10 \
        --region=us-central1 \
        --scale-tier=BASIC \
        --module-name=trainer.task \
        --package-path=trainer
```

## Hyper-parameter tuning
```
gcloud ai-platform jobs submit training ${JOB_NAME} \
        --job-dir=gs://${BUCKET_NAME}/${JOB_FOLDER} \
        --runtime-version=1.10 \
        --region=us-central1 \
        --module-name=trainer.task \
        --package-path=trainer \
        --config=config.yaml
```

## Create model
```
gcloud ai-platform models create ${MODEL_NAME} --regions=us-central1
```

## Create model version
```
gcloud ai-platform versions create ${MODEL_VERSION} \
        --model=${MODEL_NAME} \
        --origin=${MODEL_PATH} \
        --runtime-version=1.10
```

## Predict on test data
```
gcloud ai-platform jobs submit prediction ${JOB_NAME} \
    --model=${MODEL_NAME} \
    --input-paths=gs://${BUCKET_NAME}/${TEST_DATA} \
    --output-path=gs://${BUCKET_NAME}/${PREDICTIONS_FOLDER} \
    --region=us-central1 \
    --data-format=TEXT \
    --signature-name=predict \
    --version=${MODEL_VERSION}
```
