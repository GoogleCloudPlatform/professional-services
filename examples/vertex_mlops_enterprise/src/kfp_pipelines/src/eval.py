from kfp.v2 import dsl
from kfp.v2.dsl import Artifact, Dataset, Input, Model, Output

from config import IMAGE_MODEL_CARD


@dsl.component(
    packages_to_install=['shap'],
    base_image=IMAGE_MODEL_CARD)
def evaluate_model(
    test_data: Input[Dataset],
    trained_model: Input[Model],
    reports: Output[Artifact],
    class_names: list,
    target_column: str
):

    import pickle as pkl
    import pandas as pd
    import xgboost as xgb
    import numpy as np
    import sklearn
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    from sklearn.metrics import ConfusionMatrixDisplay, PrecisionRecallDisplay, RocCurveDisplay
    from sklearn.metrics import confusion_matrix, precision_recall_curve, roc_curve, auc
    from model_card_toolkit.utils.graphics import figure_to_base64str
    import logging

    # This is a work-around for a bug in shap
    np.int = int


    def ShapDisplay(model, x, class_names):
        """
        This function returns a SHAP summary plot.
        Args:
            model (sklearn.pipeline.Pipeline): The model pipeline.
            x (numpy.ndarray): The data to explain.
            column_names (list): The names of the columns.
            class_names (list): The names of the classes.
        Returns:
            A Matplotlib figure.
        """
        import matplotlib.pyplot as plt
        import shap

        fig = plt.figure()
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(x)
        shap.summary_plot(shap_values, x, feature_names=list(x.columns),
                            class_names=class_names, plot_type='bar', show=False)
        fig.suptitle("Mean absolute SHAP Values")
        fig.axes[0].set_xlabel('average impact on model output magnitude')
        return fig
  
    # Read data
    logging.info("Reading data...")
    test = pd.read_csv(test_data.path)

    # Read model
    logging.info("Reading model...")
    model = xgb.Booster()
    model.load_model(trained_model.path)

    # Evaluate model
    logging.info("Evaluating model...")
    y = test.pop(target_column)
    X = test
    y_pred_prob = model.predict(xgb.DMatrix(X))
    y_pred = list(map(lambda x: x >= 0.5, y_pred_prob))
    accuracy = accuracy_score(y, y_pred)
    pos_label=1
    precision = precision_score(y, y_pred, pos_label=pos_label)
    recall = recall_score(y, y_pred, pos_label=pos_label)
    f1 = f1_score(y, y_pred, pos_label=pos_label)
    logging.info(f"Accuracy: {accuracy:.3g}")
    logging.info(f"Precision: {precision:.3g}")
    logging.info(f"Recall: {recall:.3g}")
    logging.info(f"F1: {f1:.3g}")

    # Save model reports
    logging.info("Saving model reports...")
    logging.info(f"sklearn {sklearn.__version__}")

    c_m = confusion_matrix(y, y_pred)
    cm = ConfusionMatrixDisplay(confusion_matrix=c_m)
    cm.plot()
    cm.figure_.suptitle('Confusion Matrix')

    precision, recall, _ = precision_recall_curve(y, y_pred)
    pr = PrecisionRecallDisplay(precision=precision, recall=recall)
    pr.plot()
    pr.figure_.suptitle('Precision Recall Curve')

    fpr, tpr, _ = roc_curve(y, y_pred)
    roc_auc = auc(fpr, tpr)
    roc = RocCurveDisplay(fpr=fpr, tpr=tpr, roc_auc=roc_auc)
    roc.plot()
    roc.figure_.suptitle('ROC')

    # Calculate SHAP summary plot
    shap_fig = ShapDisplay(model, X, class_names)
    shap_fig.suptitle
    reports_dict = {
        "confusion_matrix": figure_to_base64str(cm.figure_),
        "precision_recall": figure_to_base64str(pr.figure_),
        "roc_curve": figure_to_base64str(roc.figure_),
        "shap_plot": figure_to_base64str(shap_fig)
    }
    with open(reports.path, "wb") as f:
        pkl.dump(reports_dict, f)
