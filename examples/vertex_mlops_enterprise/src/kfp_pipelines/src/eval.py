from kfp.v2 import dsl
from kfp.v2.dsl import Artifact, Dataset, Input, Model, Output

from train import IMAGE, TARGET_COLUMN


@dsl.component(
    packages_to_install=['shap'],
    base_image=IMAGE)
def evaluate_model(
    test_dataset: Input[Dataset],
    trained_model: Input[Model],
    reports: Output[Artifact],
    column_names: list,
    class_names: list
):

  # Libraries
  import os
  import pickle as pkl
  import pandas as pd
  import xgboost as xgb
  import numpy as np
  from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
  from sklearn.metrics import ConfusionMatrixDisplay, PrecisionRecallDisplay, RocCurveDisplay
  import shap
  from model_card_toolkit.utils.graphics import figure_to_base64str

  # This is a work-around for a bug in shap
  np.int = int

  # Variables
  test_data_filepath = test_dataset.path
  model_filepath = trained_model.path
  reports_filepath = reports.path

  # Helpers
  def ShapDisplay(encoder, model, x, column_names, class_names):
    """
    This function returns a SHAP summary plot.
    Args:
        encoder (sklearn.pipeline.Pipeline): The encoder pipeline.
        model (sklearn.pipeline.Pipeline): The model pipeline.
        x (numpy.ndarray): The data to explain.
        column_names (list): The names of the columns.
        class_names (list): The names of the classes.
    Returns:
        A Matplotlib figure.
    """
    import matplotlib.pyplot as plt
    fig = plt.figure()
    explainer = shap.TreeExplainer(model)
    if encoder:
        transformed_x = encoder.transform(x)
    else:
       transformed_x = x
    shap_values = explainer.shap_values(transformed_x)
    shap.summary_plot(shap_values, transformed_x, feature_names=column_names,
                      class_names=class_names, plot_type='bar', show=False)
    return fig
  
  # Read data
  print("Reading data...")
  #f = open(test_data_filepath, "rb")
  #test = pkl.load(f)
  test = pd.read_csv(test_data_filepath)

  # Read model
  print("Reading model...")
  #f = open(model_filepath, "rb")
  #pipe = pkl.load(f)
  model = xgb.Booster()
  model.load_model("model.bst")

  # Evaluate model
  print("Evaluating model...")
  y = test.pop(TARGET_COLUMN)
  X = test
  y_pred_prob = model.predict(X)
  y_pred = list(lambda x: x >= 0.5, y_pred_prob)
  accuracy = accuracy_score(y, y_pred)
  precision = precision_score(y, y_pred, pos_label="good")
  recall = recall_score(y, y_pred, pos_label="good")
  f1 = f1_score(y, y_pred, pos_label="good")
  print(f"Accuracy: {accuracy:.3g}")
  print(f"Precision: {precision:.3g}")
  print(f"Recall: {recall:.3g}")
  print(f"F1: {f1:.3g}")

  # Save model reports
  print("Saving model reports...")
  cm = ConfusionMatrixDisplay.from_predictions(y, y_pred, cmap="Blues")
  pr = PrecisionRecallDisplay.from_predictions(y, y_pred_prob, pos_label="good")
  roc = RocCurveDisplay.from_predictions(y, y_pred_prob, pos_label="good")

  # Calculate SHAP summary plot
  encoder = None
  shap_fig = ShapDisplay(encoder, model, X, column_names, class_names)
  reports_dict = {
      "confusion_matrix": figure_to_base64str(cm.figure_),
      "precision_recall": figure_to_base64str(pr.figure_),
      "roc_curve": figure_to_base64str(roc.figure_),
      "shap_plot": figure_to_base64str(shap_fig)
  }
  with open(reports_filepath, "wb") as f:
      pkl.dump(reports_dict, f)

  # save metadata
  reports.path = reports_filepath