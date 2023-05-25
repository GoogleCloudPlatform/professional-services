from google.cloud import aiplatform
from google.cloud import storage

from kfp.v2.dsl import (Artifact, Dataset, Input, Model, Output,
                        OutputPath, ClassificationMetrics, Metrics, component)

from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, roc_curve
from sklearn.model_selection import train_test_split

import pandas as pd
import xgboost as xgb
import numpy as np
from hypertune import HyperTune

import pickle
import logging
from datetime import datetime
import argparse
import sys

# We would want to move this to config.py but we can't import it here due to a KFP bug
# https://github.com/kubeflow/pipelines/issues/8385
PROJECT_ID = os.getenv("PROJECT_ID", "")
PROJECT_NR = os.getenv("PROJECT_NR", "")
REGION = os.getenv("REGION", "")
IMAGE='python:3.8'
TRAIN_COMPONENT_IMAGE=f'{REGION}-docker.pkg.dev{PROJECT_ID}/creditcards-kfp/train-fraud:latest'
TRAIN_REQS=[
    'protobuf==3.20.3',
    'cloudml-hypertune',
    "xgboost==1.6.2", 
    "scikit-learn==0.24.1", 
    "pandas==1.3.5", 
    "joblib", 
    "google-cloud-aiplatform",
    "google-cloud-storage==2.7.0",
    'gcsfs',
    'kfp==1.8.19']


aiplatform.init(project=PROJECT_ID, location=REGION)


log = logging.getLogger()
log.setLevel(logging.INFO)

def train(
        dataset_path: str, 
        xgboost_param_max_depth: int,
        xgboost_param_learning_rate: float,
        xgboost_param_n_estimators: int,
        model_output_path,
        metrics: Output[Metrics] = None,
        metricsc: Output[ClassificationMetrics] = None,
        model: Output[Model] = None):

    # Log to Vertex Experiments for comparison between runs
    #aiplatform.init(experiment='coffee-bean-classification')
    #aiplatform.start_run(run=datetime.now().strftime("%Y%m%d-%H%M%S"))

    df = pd.read_csv(dataset_path)
    labels = df.pop("Class").tolist()
    data = df.values.tolist()
    x_train, x_test, y_train, y_test = train_test_split(data, labels)

    # train_test_split() returns lists, we need to convert it to numpy to avoid
    # 'list' object has no attribute 'shape' errors in xgb.fit()
    x_train = np.asarray(x_train)
    y_train = np.asarray(y_train)
    x_test = np.asarray(x_test)
    y_test = np.asarray(y_test)

    logging.info(f"Train X {type(x_train)} {len(x_train)}")
    logging.info(f"Train Y {type(y_train)} {len(y_train)}: {y_train[:5]}")

    classifier = xgb.XGBClassifier(
        max_depth=xgboost_param_max_depth, 
        learning_rate=xgboost_param_learning_rate, 
        n_estimators=xgboost_param_n_estimators)
    logging.info(f"Model {classifier}")
    classifier.fit(x_train, y_train)

    # log metrics
    score = accuracy_score(y_test, classifier.predict(x_test))
    f1 = f1_score(y_test, classifier.predict(x_test))
    logging.info("accuracy is: %s", score)
    logging.info("F1 score is: %s", f1)
    if metrics:
        metrics.log_metric("accuracy",(score * 100.0))
        metrics.log_metric("f1-score", f1)
        metrics.log_metric("framework", f"XGBoost {xgb.__version__}")
        metrics.log_metric("train_dataset_size", len(x_train))
        metrics.log_metric("test_dataset_size", len(x_test))

    if metricsc:
        # log the confusion matrix
        y_pred = classifier.predict(x_test)
        logging.info(f"Predictions: {','.join(map(str, y_pred[:10]))}")

        metricsc.log_confusion_matrix(
            ['0', '1'],
            confusion_matrix(y_test, y_pred).tolist() # to convert np array to list.
        )

    # report for hyperparameter tuning
    hyper_tune = HyperTune()
    hyper_tune.report_hyperparameter_tuning_metric(
        hyperparameter_metric_tag='f1',
        metric_value=f1)
    
    # Save using save_model method of XGB Classifier object
    # -- this is important if we want to use the prebuilt xgb container for prediction
    model_output_path = model_output_path + '.bst'
    logging.info(f"Writing model to {model_output_path}")
    classifier.save_model(model_output_path)

    if model:
        model.metadata = { "containerSpec": { "imageUri": 'europe-docker.pkg.dev/vertex-ai/prediction/xgboost-cpu.1-6:latest' } }
        model.path = model_output_path

if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    parser.add_argument("--dataset_path", required=True)
    parser.add_argument("--xgboost_param_max_depth", required=True)
    parser.add_argument("--xgboost_param_learning_rate", required=True)
    parser.add_argument("--xgboost_param_n_estimators", required=True)
    parser.add_argument("--model_output_path", required=True)

    print(f'Got args: {" ".join(sys.argv)}')
    args = parser.parse_args()

    train(dataset_path=args.dataset_path,
          xgboost_param_max_depth=int(args.xgboost_param_max_depth),
          xgboost_param_learning_rate=float(args.xgboost_param_learning_rate),
          xgboost_param_n_estimators=int(args.xgboost_param_n_estimators),
          model_output_path=args.model_output_path)

@component(
    packages_to_install=TRAIN_REQS,
    base_image=IMAGE,
    target_image=TRAIN_COMPONENT_IMAGE
)
def xgb_train(
    dataset: Input[Dataset],
    metrics: Output[Metrics],
    model: Output[Model],
    xgboost_param_max_depth: int,
    xgboost_param_learning_rate: float,
    xgboost_param_n_estimators: int,
    metricsc: Output[ClassificationMetrics],
    serving_container_image_uri: str
):
    
    train(
        dataset_path=dataset.path, 
        xgboost_param_max_depth=xgboost_param_max_depth,
        xgboost_param_learning_rate=xgboost_param_learning_rate,
        xgboost_param_n_estimators=xgboost_param_n_estimators,
        model_output_path=model.path,
        metrics=metrics,
        metricsc=metricsc,
        model=model)
