from kfp.v2.dsl import (Dataset, Input, Model, Output,
                        ClassificationMetrics, Metrics)
from kfp import dsl
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score

import pandas as pd
import xgboost as xgb
import numpy as np
from hypertune import HyperTune

import logging
import argparse
import sys
import pickle

from config import CLASS_NAMES, IMAGE, PRED_CONTAINER

def load_data(dataset_path: str):
    df = pd.read_csv(dataset_path)
    labels = list(np.rint(df.pop("Class")).astype(np.int64))
    
    data = df.values.tolist()

    # we need to convert it to numpy to avoid
    # 'list' object has no attribute 'shape' errors in xgb.fit()
    return (np.asarray(data, dtype=object), labels)

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
    print(f"Type y_test {type(y_test[0])}")
    print(f"Type pred {type(classifier.predict(x_test)[0])}")

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
    

    # Write Pickle for convenience: This is what we trained and will have sklearn interface
    pickle_output_path = model_output_path + '_sklearn.pkl'
    with open(pickle_output_path, 'wb') as f:
        pickle.dump(classifier, f)

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

    parser.add_argument("--train_dataset_path", required=True)
    parser.add_argument("--test_dataset_path", required=True)
    parser.add_argument("--xgboost_param_max_depth", required=True)
    parser.add_argument("--xgboost_param_learning_rate", required=True)
    parser.add_argument("--xgboost_param_n_estimators", required=True)
    parser.add_argument("--model_output_path", required=True)

    print(f'Got args: {" ".join(sys.argv)}')
    args = parser.parse_args()

    train(train_dataset_path=args.train_dataset_path,
          test_dataset_path=args.test_dataset_path,
          xgboost_param_max_depth=int(args.xgboost_param_max_depth),
          xgboost_param_learning_rate=float(args.xgboost_param_learning_rate),
          xgboost_param_n_estimators=int(args.xgboost_param_n_estimators),
          model_output_path=args.model_output_path,
          serving_container_image_uri=PRED_CONTAINER)

@dsl.component(base_image=f'{IMAGE}')
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
    from train import train

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
