# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
LIME Functionality for CMLA Classification Models
"""
import json
import os

import dill
import numpy as np
import tensorflow as tf
from bs4 import BeautifulSoup as Soup
from google.cloud import storage


def get_model_path(cfg, job_id, trained_model_location):
    """
    Gets the trained model path from the job_dir and job_id

    Arguments:
                                    cfg: dict, Configurations from yaml file
                                    job_id: string, Job ID of the training job
                                    trained_model_location: string, Path of the trained model
                                        i.e. export directory of training job
    Returns:
                                    model_path: string, path of the trained model"""
    storage_client = storage.Client.from_service_account_json(
        cfg['service_account_json_key'])
    bucket = storage_client.get_bucket(cfg['bucket_name'].replace('gs://', ''))
    job_dir = trained_model_location.replace(cfg['bucket_name'] + '/', '')
    prefix_path = os.path.join(job_dir, job_id)
    blobs = bucket.list_blobs(prefix=prefix_path)
    model_path = [b.name.replace(prefix_path, '')
                  for b in blobs][1].replace('/', '')
    return model_path


def download_file_from_gcp(bucket_name, source_blob_name):
    """Downloads the given file from GCS bucket
    Arguments:
        bucket_name: str, name of the GCS bucket
        source_blob_name: str, path of the blob to be downloaded
    Returns:
        output_file_name: str, name of the downloaded file"""
    try:
        storage_client = storage.Client()
        bucket = storage_client.get_bucket(bucket_name)
        blob_name = bucket.blob(source_blob_name)
        output_file_name = source_blob_name.split('/')[-1]
        blob_name.download_to_filename(output_file_name)
        return output_file_name
    except IOError:
        raise AssertionError(
            "ERROR: Please Provide a valid GCP path and make sure the file exists in bucket")
    except Exception:
        raise AssertionError(
            "ERROR: Kindly verify the access to GCP bucket")


def download_folder_from_gcp(bucket_name, folder_name):
    """Downloads the given folder from GCS bucket
    Arguments:
        bucket_name: str, name of the GCS bucket
        folder_name: str, path of the folder to be downloaded"""
    try:
        storage_client = storage.Client()
        bucket = storage_client.get_bucket(bucket_name)
        blobs = bucket.list_blobs(prefix=folder_name)
        for blob in blobs:
            directory = '/'.join((blob.name).split('/')[:-1]) + '/'
            if not os.path.exists(directory):
                os.makedirs(directory)
            blob.download_to_filename(blob.name)
    except IOError:
        raise AssertionError(
            "ERROR: Please Provide a valid GCP path and make sure the folder exists in bucket")
    except Exception:
        raise AssertionError(
            "ERROR: Kindly verify the access to GCP bucket")


def upload_to_gcp(bucket_name, source_file_name):
    """Uploads the file back to Cloud Storage
    Arguments:
            bucket_name: str, name of the GCS bucket
            source_file_name: str, path of the source blob"""
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob('lime/' + source_file_name)
    blob.upload_from_filename(source_file_name)
    os.remove(source_file_name)


def getting_signature(export_dir):
    """Generates the Signature def of the imported saved model
    Arguments:
            export_dir: str, path of the export directory
    Returns:
            signature: tf.saved_model.signature_def object"""
    predictor = tf.contrib.predictor.from_saved_model(export_dir=export_dir)
    graph = predictor.graph
    col_list = [a.name for a in graph.as_graph_def().node if a.op ==
                'Placeholder']
    inputs = dict()
    for t in col_list:
        inputs[t] = tf.saved_model.build_tensor_info(
            graph.get_tensor_by_name(str(t) + ':0'))
    output_name = [
        n.name for n in graph.as_graph_def().node if n.op == 'Softmax'][0]
    output = tf.saved_model.build_tensor_info(
        graph.get_tensor_by_name(str(output_name) + ':0'))
    signature = tf.saved_model.build_signature_def(
        inputs=inputs, outputs={
            'output': output}, method_name='Classification')
    return signature


def get_explainer(export_dir):
    """
    Creates LIME explainer based on input data
    Arguments:
        export_dir: str, path of the directory of saved model
    Returns:
        explainer: lime object, A Lime explainer created while training
        dict_mapping: dict, mapping dictionary of categorical columns
        feature_names: list, A list of names of features
    """
    with open(os.path.join(export_dir, 'assets.extra', 'lime_explainer'), 'rb') as f:
        explainer = dill.load(f)
        dict_mapping = dill.load(f)
        feature_names = dill.load(f)
    return explainer, dict_mapping, feature_names


def lime_predictor(explainer, dict_mapping, feature_names, data_point, predictor):
    """
    Creates an Explanation on given datapoint
    Arguments:
        explainer: lime object, A Lime explainer created while training
        dict_mapping: dict, mapping dictionary of categorical columns
        feature_names: list, A list of names of features
        data_point: dict, A dictionary containing features on which prediction is made
        predictor: tf.contrib.predictor object, A predictor function of the saved model
    """
    for key, value in data_point.items():
        if key in dict_mapping.keys():
            data_point[key] = dict_mapping[key].keys()[
                dict_mapping[key].values().index(str(value))]
    feat_list = list()

    def predict_function(X):
        """
        Creates a Probability predicting function from the saved model
        """
        input_dict = dict()
        for index, feature_name in enumerate(feature_names):
            if feature_name in dict_mapping.keys():
                feat_list = list()
                for cat_value in X[:, index]:
                    feat_list.append(
                        dict_mapping[feature_name][int(cat_value)])
                input_dict[feature_name] = np.array(feat_list)
            else:
                input_dict[feature_name] = X[:, index]
        return predictor(input_dict)['output']

    for name in feature_names:
        feat_list.append(data_point[name])
    exp = explainer.explain_instance(
        np.array(feat_list),
        predict_function,
        num_features=5)
    return exp


def prediction_without_report(data_point, predictor):
    """
    Creates prediction of the Datapoint without LIME report
    Arguments:
        data_point: dict, A dictionary containing features on which prediction is made
        predictor: tf.contrib.predictor object, A predictor function of the saved model
    Returns;
        return_dict: dict, A dictionary containing the predictions
    """
    new_dict = dict()
    for key, value in data_point.items():
        new_dict[key] = (value,)
    return_dict = dict()
    for index, result in enumerate(predictor(new_dict)['output'][0]):
        return_dict['class_' + str(index)] = float("{0:.4f}".format(result))
    return return_dict


def adding_text_to_html(html_file, explanation, dict_mapping):
    """Adding Text Explanation to HTML file
    Arguments:
        html_file: str, html file generated from explainer
        explanation: lime object, lime explanation generated from lime explainer
        dict_mapping: dict, mapping dictionary of categorical columns
    Returns: str, html file with text explanations"""
    text_exp = str()
    for (feature, importance) in explanation.as_list():
        if feature.split('=')[0] in dict_mapping.keys():
            text_exp += 'Categorical feature "{}" being "{}" is contributing to the prediction with importance of \
                {} <br>'.format(feature.split('=')[0], feature.split('=')[1], "{0:.3f}".format(importance))
            text_exp += ' \n'
        else:
            text_exp += 'Continous Feature "{}" has been contributing to the prediction with importance of \
                {} <br>'.format(feature, "{0:.3f}".format(importance))
            text_exp += ' \n'

    cleaned_html = Soup(html_file, features="lxml")
    string = '''<div style="text-align:right;"><a href="#" onclick="document.getElementById('text-explanation').classList.toggle('is-hidden')">info</a></div>
            <style>
                .is-hidden{display:none;}
            </style>
            <div id="text-explanation" style="text-align:right;" class="is-hidden">''' + str(text_exp) + ''' </div>'''
    cleaned_html.body.append(Soup(string, 'html.parser'))
    return str(cleaned_html)


def save(gcp_bucket_name, html_file, path):
    """Writing a HTML object to html file
    Arguments:
            gcp_bucket_name : str, name of the bucket in which file is to be saved
            html_file: str, generated html file as string,
            path: str, local path where the file is to stored"""
    with open(path, 'w') as file:
        file.write(str(html_file))
    if gcp_bucket_name:
        try:
            upload_to_gcp(gcp_bucket_name, path)
        except ValueError:
            raise AssertionError(
                "ERROR: Kindly verify the access to GCP bucket")


def visualization(cfg, job_id, model_dir, predict_json, batch_prediction, d_points, name):
    """End-to-End Script which generates visualization of the predictions using LIME
    Arguments:
        cfg: dict, Dictionary containing the configurations of the API
        job_id: str, Job ID assigned while training
        model_dir: str, model directory to be used for prediction and visualization
        predict_json: str, path of the Json data on which predictions are to be visualized
        batch_prediction: bool, Boolean value indicating whether the provided data is a batch or single file
        d_points: list, list of ids of the data where visualization is required or can specify all like ['All']
        name: str, name of the output_files required
    Returns:
        result: dict, A output dictionary containing the predicted results"""
    gcp_bucket_name = cfg.get('bucket_name', None)
    result = dict()
    if gcp_bucket_name:
        export_dir = get_model_path(cfg, job_id, model_dir)
        download_folder_from_gcp(gcp_bucket_name, export_dir)
        download_file_from_gcp(gcp_bucket_name, predict_json)
    else:
        export_dir = model_dir

    explainer, dict_mapping, feature_names = get_explainer(export_dir)
    predictor = tf.contrib.predictor.from_saved_model(
        export_dir=export_dir, signature_def=getting_signature(export_dir))

    with open(predict_json, 'rb') as f:
        predict_point = json.load(f)

    if batch_prediction is False:
        explanation = lime_predictor(explainer=explainer, dict_mapping=dict_mapping,
                                     feature_names=feature_names, data_point=predict_point, predictor=predictor)
        html_file = explanation.as_html()
        save(gcp_bucket_name, adding_text_to_html(
            html_file, explanation, dict_mapping), str(name) + '.html')
        predict_point_copy = predict_point.copy()
        result['prediction'] = {'saved_report': str(name) + '.html'}
        result['prediction'].update(
            {'output': (prediction_without_report(predict_point_copy, predictor))})
    else:
        result = dict()
        for key, value in predict_point.items():
            for extra_key in [a for a in value.keys() if a not in feature_names]:
                del value[extra_key]
            value_copy = value.copy()
            if key in d_points or d_points == ['ALL']:
                explanation = lime_predictor(
                    explainer=explainer, dict_mapping=dict_mapping, feature_names=feature_names, data_point=value,
                    predictor=predictor)
                output_path_name = '{}_{}.html'.format(name, key)
                html_file = explanation.as_html()
                save(gcp_bucket_name, adding_text_to_html(
                    html_file, explanation, dict_mapping), output_path_name)
                result[key] = {'saved_report': output_path_name}
                result[key].update(
                    {'output': (prediction_without_report(value_copy, predictor))})
            else:
                result[key] = {
                    'output': (prediction_without_report(value_copy, predictor))}
    try:
        os.remove(export_dir)
        os.remove(predict_json)
    except OSError:
        print("Couldn't clear downloaded files")
    return result


def visualization_2(cfg, job_id, model_dir, predict_json, batch_prediction, name):
    """End-to-End Script which generates results from given data-points

    Arguments:
        cfg: dict, Dictionary containing the configurations of the API
        job_id: str, Job ID assigned while training
        model_dir: str, path of the export_dir of the trained model
        predict_json: str, path of the Json data on which predictions are to be visualized
        batch_prediction: bool, Boolean value indicating whether the provided data is a batch or single file
        name: str, name of the output_files required
    Returns:
        result: list, A list containing the result of the model"""
    gcp_bucket_name = cfg.get('bucket_name', None)
    result = list()
    if gcp_bucket_name:
        export_dir = get_model_path(cfg, job_id, model_dir)
        download_folder_from_gcp(gcp_bucket_name, export_dir)
        download_file_from_gcp(gcp_bucket_name, predict_json)
    else:
        export_dir = model_dir

    explainer, dict_mapping, feature_names = get_explainer(export_dir)
    predictor = tf.contrib.predictor.from_saved_model(
        export_dir=export_dir, signature_def=getting_signature(export_dir))

    with open(predict_json, 'r') as f:
        predict_point = json.load(f)

    if batch_prediction is False:
        explanation = lime_predictor(explainer=explainer, dict_mapping=dict_mapping,
                                     feature_names=feature_names, data_point=predict_point, predictor=predictor)
        html_file = explanation.as_html()
        data_point_copy = predict_point.copy()
        save(gcp_bucket_name, adding_text_to_html(
            html_file, explanation, dict_mapping), str(name) + '.html')
        result.append(prediction_without_report(data_point_copy, predictor))
    else:
        result = list()
        for index, prediction_point in enumerate(predict_point):
            prediction_point_copy = prediction_point.copy()
            for extra_key in [a for a in prediction_point.keys() if a not in feature_names]:
                del prediction_point_copy[extra_key]
            result.append(prediction_without_report(
                prediction_point_copy, predictor))
            if prediction_point['report'] == 1:
                for extra_key in [a for a in prediction_point.keys() if a not in feature_names]:
                    del prediction_point[extra_key]
                explanation = lime_predictor(explainer=explainer, dict_mapping=dict_mapping,
                                             feature_names=feature_names, data_point=prediction_point,
                                             predictor=predictor)
                html_file = explanation.as_html()
                output_path_name = '{}_{}.html'.format(name, index)
                save(gcp_bucket_name, adding_text_to_html(
                    html_file, explanation, dict_mapping), output_path_name)
    try:
        os.remove(export_dir)
        os.remove(predict_json)
    except OSError:
        print("Couldn't clear downloaded files")
    return result
