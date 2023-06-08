from kfp.v2.dsl import (Dataset, Input, Model, Output,
                        ClassificationMetrics, Metrics)
from kfp import dsl
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, roc_curve

import pandas as pd
import xgboost as xgb
import numpy as np
from hypertune import HyperTune

import logging
import argparse
import sys
import os

PROJECT_ID = os.getenv("PROJECT_ID", "")
PROJECT_NR = os.getenv("PROJECT_NR", "")
REGION = os.getenv("REGION", "")
IMAGE=f'{REGION}-docker.pkg.dev/{PROJECT_ID}/creditcards-kfp/base:latest'
TRAIN_COMPONENT_IMAGE=f'{REGION}-docker.pkg.dev/{PROJECT_ID}/creditcards-kfp/train-fraud:latest'

CLASS_NAMES = ['OK', 'Fraud']
#COLUMN_NAMES = ["V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19", "V20", "V21", "V22", "V23", "V24", "V25", "V26", "V27", "V28", "Amount"]
TARGET_COLUMN = 'Class'

log = logging.getLogger()
log.setLevel(logging.INFO)

def load_data(dataset_path: str):
    df = pd.read_csv(dataset_path)
    labels = df.pop("Class").tolist()
    data = df.values.tolist()

    # we need to convert it to numpy to avoid
    # 'list' object has no attribute 'shape' errors in xgb.fit()
    return (np.asarray(data), np.asarray(labels))

def train(
        train_dataset_path: str, 
        test_dataset_path: str, 
        xgboost_param_max_depth: int,
        xgboost_param_learning_rate: float,
        xgboost_param_n_estimators: int,
        model_output_path,
        serving_container_image_uri,
        metrics: Output[Metrics] = None,
        metricsc: Output[ClassificationMetrics] = None,
        model: Output[Model] = None,):

    # Log to Vertex Experiments for comparison between runs
    #aiplatform.init(experiment='coffee-bean-classification')
    #aiplatform.start_run(run=datetime.now().strftime("%Y%m%d-%H%M%S"))

    x_train, y_train = load_data(train_dataset_path)
    x_test, y_test = load_data(test_dataset_path)

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
            CLASS_NAMES,
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
        model.metadata = { "containerSpec": { "imageUri": serving_container_image_uri } }
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

@dsl.component(
    base_image=IMAGE,
    target_image=TRAIN_COMPONENT_IMAGE
)
def xgb_train(
    train_data: Input[Dataset],
    test_data: Input[Dataset],
    metrics: Output[Metrics],
    model: Output[Model],
    xgboost_param_max_depth: int,
    xgboost_param_learning_rate: float,
    xgboost_param_n_estimators: int,
    metricsc: Output[ClassificationMetrics],
    serving_container_image_uri: str
):
    
    train(
        train_dataset_path=train_data.path, 
        test_dataset_path=test_data.path, 
        xgboost_param_max_depth=xgboost_param_max_depth,
        xgboost_param_learning_rate=xgboost_param_learning_rate,
        xgboost_param_n_estimators=xgboost_param_n_estimators,
        model_output_path=model.path,
        metrics=metrics,
        metricsc=metricsc,
        model=model,
        serving_container_image_uri=serving_container_image_uri)
