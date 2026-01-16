<h1>Overview</h1>
This code implements a fraud detection model for credit-cards transactions using the Google Cloud platform. It includes code to process data, train a tensorflow model with hyperparameter tuning, run predictions on new data and assess model performances.

* **Data description**

The data used as input to this code is preprocessed, anonymous credit card transactions data. The data consists in 23 components from a PCA as well as the amount of transactions.
It can found on the [Kaggle website](https://www.kaggle.com/mlg-ulb/creditcardfraud/data).

* **Acknowledgements**

The dataset has been collected and analysed during a research collaboration of Worldline and the Machine Learning Group (http://mlg.ulb.ac.be) of ULB (Université Libre de Bruxelles) on big data mining and fraud detection. More details on current and past projects on related topics are available on http://mlg.ulb.ac.be/BruFence and http://mlg.ulb.ac.be/ARTML.
Dataset provided thanks to: Andrea Dal Pozzolo, Olivier Caelen, Reid A. Johnson and Gianluca Bontempi. Calibrating Probability with Undersampling for Unbalanced Classification. In Symposium on Computational Intelligence and Data Mining (CIDM), IEEE, 2015.

* **Overview of current solution:**

  - oversampling of positive class in training data
  - feed-forward neural network classifier, to predict whether a transaction is fraudulent or not
  - uses TF Datasets to read input data


* **Potential next steps:**

  - auto-encoder model then detect outliers
  - feature engineering

* **Environment set-up:**

You can set-up the right python environment as follows:
```
virtualenv -p python2.7 env
source env/bin/activate
pip install -U pip
python -m pip install -r requirements.txt
```

The following notebook contains commands to run the code as well as more detailed explanations: [link to notebook](https://drive.google.com/file/d/1tWgsTyKLUBT9QfVbTPdZKOXQu_qEdktH/view?usp=sharing).
You can also use the 'fraud_detection.ipynb' notebook file in this directory.

<h1>Data processing</h1>
The data preprocessing is performed using the Apache-Beam and Tensorflow-Transform libraries.

This step includes the following:
- reads data from BigQuery
- adds hash key value to each row
- scales data
- shuffles and splits data in train / validation / test sets
- over-samples train data
- stores data as TFRecord
- splits and stores test data into separate labels and features files

* **Run locally:**
```
DATAFLOW_OUTPUT_DIR=data_flow_output_dir-$(date +"%Y%m%d_%H%M%S")/
python preprocess.py \
--bq_table raw_data_sample \
--output_dir ${DATAFLOW_OUTPUT_DIR}
```

* **GCloud configuration:**
```
PROJECT_ID=<your gcp project id>
BUCKET_ID=<your gcp bucket id>
```

* **Run in Google Cloud DataFlow:**
```
DATAFLOW_OUTPUT_DIR=data_flow_output_dir-$(date +"%Y%m%d_%H%M%S")/
python preprocess.py \
--cloud \
--bq_table raw_data \
--output_dir ${DATAFLOW_OUTPUT_DIR} \
--project_id $PROJECT_ID \
--bucket_id $BUCKET_ID
```

<h1>Training</h1>

* **Run locally:**
```
TRAINING_OUTPUT_DIR=./training_output_dir-$(date +"%Y%m%d_%H%M%S")
gcloud ml-engine local train \
--module-name trainer.task \
--package-path ./trainer \
-- \
--input_dir ./${DATAFLOW_OUTPUT_DIR} \
--output_dir ${TRAINING_OUTPUT_DIR}
```

* **Run in Google Cloud ML Engine:**
The ML-engine command can take in input a '.yaml' file that contains the configuration to use for hyperparameter tuning.
```
TRAINING_JOB_NAME=fraud_detection_training_job_$(date +%Y%m%d%H%M%S)
TRAINING_OUTPUT_DIR=gs://${BUCKET_ID}/training_output_dir-$(date +"%Y%m%d_%H%M%S")
gcloud ml-engine jobs submit training $TRAINING_JOB_NAME \
--module-name trainer.task \
--staging-bucket gs://${BUCKET_ID} \
--package-path ./trainer \
--region=us-central1 \
--runtime-version 1.5 \
--config=hyperparams.yaml \
-- \
--input_dir gs://${BUCKET_ID}/${DATAFLOW_OUTPUT_DIR} \
--output_dir ${TRAINING_OUTPUT_DIR}
```

* **Monitor with Tensorboard:**
```
tensorboard --logdir=${TRAINING_OUTPUT_DIR}
```

<h1>Inference</h1>
Once the model is trained and stored it can be used for batch inference on new data.

* **Run locally:**
```
PREDICTION_INPUT=./${DATAFLOW_OUTPUT_DIR}split_data_features.txt
PREDICTION_OUTPUT=./${DATAFLOW_OUTPUT_DIR}split_data_predictions.txt
TRIAL_NUMBER=1
MODEL_SAVED_NAME=$(ls ${TRAINING_OUTPUT_DIR}/trials/${TRIAL_NUMBER}/export/exporter/ | tail -1)
cat ./${DATAFLOW_OUTPUT_DIR}split_data/split_data_TEST_features.txt* > $PREDICTION_INPUT
gcloud ml-engine local predict \
--model-dir=$TRAINING_OUTPUT_DIR/trials/${TRIAL_NUMBER}/export/exporter/${MODEL_SAVED_NAME} \
--json-instances=$PREDICTION_INPUT > $PREDICTION_OUTPUT
```

* **Run in Google Cloud ML Engine:**
Different versions of a same model can be stored in the ML-engine. The ML-engine takes in input a name for the model and a unique name for the current version.

* Save model
```
MODEL_NAME=fraud_detection
MODEL_VERSION=v_$(date +"%Y%m%d_%H%M%S")
TRIAL_NUMBER=1
MODEL_SAVED_NAME=$(gcloud storage ls ${TRAINING_OUTPUT_DIR}/trials/${TRIAL_NUMBER}/export/exporter/ | tail -1)
gcloud ml-engine models create $MODEL_NAME \
--regions us-central1
gcloud ml-engine versions create $MODEL_VERSION \
--model $MODEL_NAME \
--origin $MODEL_SAVED_NAME \
--runtime-version 1.5
```

* Run predictions
```
JOB_NAME=${MODEL_NAME}_$(date +"%Y%m%d_%H%M%S")
FEATURES_INPUT_PATH=gs://${BUCKET_ID}/${DATAFLOW_OUTPUT_DIR}split_data/split_data_TEST_features.txt*
PREDICTIONS_OUTPUT_PATH=gs://${BUCKET_ID}/predictions/$JOB_NAME
gcloud ml-engine jobs submit prediction $JOB_NAME \
--model $MODEL_NAME \
--input-paths $FEATURES_INPUT_PATH \
--output-path $PREDICTIONS_OUTPUT_PATH \
--region us-central1 \
--data-format TEXT \
--version $MODEL_VERSION
```

* **Check model performances on out-of-sample data**

Assess model's performances on out-of-sample data. Compute precision-recall curve and its AUC.
* Pull labels and predictions data from Google Cloud Storage

```
ANALYSIS_OUTPUT_PATH=.
mkdir ${ANALYSIS_OUTPUT_PATH}/labels
gcloud storage cp gs://${BUCKET_ID}/${DATAFLOW_OUTPUT_DIR}split_data/split_data_TEST_labels.txt* labels/
cat ${ANALYSIS_OUTPUT_PATH}/labels/* > ${ANALYSIS_OUTPUT_PATH}/labels.txt

mkdir ${ANALYSIS_OUTPUT_PATH}/predictions
gcloud storage cp ${PREDICTIONS_OUTPUT_PATH}/prediction.results* ./predictions/
cat ${ANALYSIS_OUTPUT_PATH}/predictions/* > ${ANALYSIS_OUTPUT_PATH}/predictions.txt
```

* Run precision-recall computation
```
python out_of_sample_analysis.py \
--output_path ${ANALYSIS_OUTPUT_PATH} \
--labels labels.txt \
--predictions predictions.txt
```
