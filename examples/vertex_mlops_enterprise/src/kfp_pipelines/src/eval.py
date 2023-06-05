from kfp.v2 import dsl
from kfp.v2.dsl import Artifact, Dataset, Input, Model, Output

from train import IMAGE


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
  import sklearn
  from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
  from sklearn.metrics import ConfusionMatrixDisplay, PrecisionRecallDisplay, RocCurveDisplay
  from sklearn.metrics import confusion_matrix, precision_recall_curve, roc_curve, auc
  import shap
  from model_card_toolkit.utils.graphics import figure_to_base64str

  # TODO
  #from train import TARGET_COLUMN
  TARGET_COLUMN='Class'

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
  test = pd.read_csv(test_data_filepath)

  # Read model
  print("Reading model...")
  model = xgb.Booster()
  model.load_model(trained_model.path)

  # Evaluate model
  print("Evaluating model...")
  y = test.pop(TARGET_COLUMN)
  X = test
  y_pred_prob = model.predict(xgb.DMatrix(X))
  y_pred = list(map(lambda x: x >= 0.5, y_pred_prob))
  accuracy = accuracy_score(y, y_pred)
  pos_label=1
  precision = precision_score(y, y_pred, pos_label=pos_label)
  recall = recall_score(y, y_pred, pos_label=pos_label)
  f1 = f1_score(y, y_pred, pos_label=pos_label)
  print(f"Accuracy: {accuracy:.3g}")
  print(f"Precision: {precision:.3g}")
  print(f"Recall: {recall:.3g}")
  print(f"F1: {f1:.3g}")

  # Save model reports
  print("Saving model reports...")
  print(f"sklearn {sklearn.__version__}")
  
  c_m = confusion_matrix(y, y_pred)
  cm = ConfusionMatrixDisplay(confusion_matrix=c_m)
  cm.plot()
  
  precision, recall, _ = precision_recall_curve(y, y_pred)
  pr = PrecisionRecallDisplay(precision=precision, recall=recall)
  pr.plot()

  fpr, tpr, _ = roc_curve(y, y_pred)
  roc_auc = auc(fpr, tpr)
  roc = RocCurveDisplay(fpr=fpr, tpr=tpr, roc_auc=roc_auc)
  roc.plot()

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