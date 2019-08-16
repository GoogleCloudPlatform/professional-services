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
    End-to-End API Framework for Componentised Machine Learning Applications
"""
import json
import logging
import os
import uuid
from logging.handlers import RotatingFileHandler

import tensorflow as tf
import yaml
from flask import Flask, request, Response
from flask_json_schema import JsonSchema, JsonValidationError

import deploy
import predict
import train
from lime_utils import visualization, visualization_2
from schema import TRAIN_SCHEMA, PREDICT_SCHEMA, DEPLOY_SCHEMA, LIME_SCHEMA, LIME_SCHEMA_2

APP = Flask(__name__)
SCHEMA = JsonSchema(APP)


def read_yaml():
    """
    Reads the config file to variables

    Returns:
        A dict containing configurations
    """
    with open("config/config_file.yaml", 'r') as ymlfile:
        return yaml.load(ymlfile)


def get_job_link():
    """
    Reads the config file to variables

    Returns:
        A job link string
    """
    with open('config/developer.yaml', 'r') as ymlfile:
        return yaml.load(ymlfile)['job_link']


@APP.errorhandler(JsonValidationError)
def validation(error):
    """
    Handles validation message for type casting of parameters

    Arguments :
        error: object, Error message
    Returns:
        Response of the validation error
    """
    return Response(
        json.dumps(
            {
                'Message': error.message,
                'Data': [
                    validation_error.message for validation_error in error.errors],
                'Success': False}),
        status=400,
        mimetype='application/json')


@APP.route('/train', methods=['POST'])
@SCHEMA.validate(TRAIN_SCHEMA)
def app_train():
    """
    Training API call

    Returns:
        Json Response of Training API call

    Raise:
        Validation error : If data types of input parameters is incorrect
        Access Denied to project : When the given service account key cannot interact with GCP.
    """
    return_message = json.dumps({
        "Success": False,
        "Message": "",
        "Data": {}
    })
    response_code = 400
    try:
        call_id = uuid.uuid4()
        cfg = read_yaml()
        jobid = 'C' + str(call_id).replace('-', '_')
        payload = request.get_json()
        if isinstance(payload['train_csv_path'], list):
            train_csv_path = ' '.join([os.path.join(cfg['bucket_name'], str(
                path)) for path in payload['train_csv_path']])
        else:
            train_csv_path = os.path.join(
                cfg['bucket_name'], payload['train_csv_path'])

        eval_csv_path = os.path.join(
            cfg['bucket_name'], payload['eval_csv_path'])
        export_dir = os.path.join(
            cfg['bucket_name'],
            payload['export_dir'],
            jobid)
        APP.logger.info('[{}] Config file loaded'.format(jobid))
        response = train.post(
            cfg=cfg,
            train_csv_path=train_csv_path,
            eval_csv_path=eval_csv_path,
            task_type=payload['task_type'],
            target_var=payload['target_var'],
            data_type=(
                'None' if payload.get('data_type') is None else str(
                    payload['data_type'])),
            column_name=(
                'None' if payload.get('column_name') is None else str(
                    payload['column_name'])),
            na_values=('None' if payload.get('na_values') is None else str(
                payload['na_values'])),
            condition=('None' if payload.get('condition') is None else str(
                payload['condition'])),
            n_classes=(
                '2' if payload.get('n_classes') is None else str(
                    payload['n_classes'])),
            to_drop=('None' if payload.get('to_drop') is None else str(
                payload['to_drop'])),
            name=payload['name'],
            hidden_units=(
                '64' if payload.get('hidden_units') is None else str(
                    payload['hidden_units'])),
            num_layers=(
                '2' if payload.get('num_layers') is None else str(
                    payload['num_layers'])),
            lin_opt=(
                'ftrl' if payload.get('lin_opt') is None else payload['lin_opt']),
            deep_opt=(
                'adam' if payload.get('deep_opt') is None else payload['deep_opt']),
            train_steps=(
                '50000' if payload.get('train_steps') is None else str(
                    payload['train_steps'])),
            export_dir=export_dir,
            jobid=jobid)

        APP.logger.info('[{}] '.format(jobid) + str(payload))
        APP.logger.info('[{}] Training Job submitted to CMLE'.format(jobid))
        return_message = json.dumps({
            "Success": True,
            "Message":
                "{}/{}?project={}".format(get_job_link(),
                                          jobid, cfg['project_id']),
            "Data": {
                'jobid': jobid,
                'response': response
            }
        })
        response_code = 200

    except IOError as err:
        APP.logger.error(str(err))
        return_message = json.dumps({
            "Success": False,
            "Message": "Please check the config.yaml file",
            "Data": {"error_message": str(err)}
        })
        response_code = 500

    except AssertionError as err:
        APP.logger.error(str(err))
        return_message = json.dumps(
            {"Success": False, "Message": str(err), "Data": []})
        response_code = 500

    except Exception as err:
        APP.logger.error(str(err))
        return_message = json.dumps({
            "Success": False,
            "Message": str(err),
            "Data": err
        })
        response_code = 500

    finally:
        return Response(
            return_message,
            status=response_code,
            mimetype='application/json')


@APP.route('/deploy', methods=['POST'])
@SCHEMA.validate(DEPLOY_SCHEMA)
def app_deploy():
    """
    Deployment API call

    Returns:
        JSON response of Deployment API call

    Raise:
        Validation error : If data types of input parameters is incorrect
        Access Denied to project : When the given service account key cannot interact with GCP.
    """
    return_message = json.dumps({
        "Success": False,
        "Message": "",
        "Data": {}
    })
    response_code = 400
    try:
        cfg = read_yaml()
        APP.logger.info('Config file loaded')
        payload = request.get_json()

        response = deploy.post(
            cfg=cfg,
            job_id=payload['job_id'],
            model_name=payload['model_name'],
            version_name=payload['version_name'],
            trained_model_location=payload['trained_model_location'],
            runtime_version=payload['runtime_version']
        )

        return_message = json.dumps({"Success": True,
                                     "Message": "Model is successfully deployed",
                                     "Data": response})

        APP.logger.info('route /deploy has been called')
        APP.logger.info('[{}]'.format(payload))
        APP.logger.info(return_message)
        response_code = 200

    except IOError as err:
        APP.logger.error(str(err))
        APP.logger.info('Invalid config.yaml file has been loaded')
        return_message = json.dumps({"Success": False,
                                     "Message": "Please check the config.yaml file",
                                     "Data": {"error_message": str(err)}})
        response_code = 500

    except IndexError as err:
        APP.logger.error(str(err))
        APP.logger.info('Unable to locate saved model location')
        return_message = json.dumps(
            {
                "Success": False,
                "Message": "Please provide a valid 'job_id' and 'trained_model_location'",
                "Data": []})
        response_code = 500

    except AssertionError as err:
        APP.logger.error(str(err))
        return_message = json.dumps(
            {"Success": False, "Message": str(err), "Data": []})
        response_code = 500

    except Exception as err:
        APP.logger.error(err)
        return_message = json.dumps(
            {"Success": False, "Message": str(err), "Data": None})
        response_code = 500

    finally:
        return Response(
            return_message,
            status=response_code,
            mimetype='application/json')


@APP.route('/predict', methods=['POST'])
@SCHEMA.validate(PREDICT_SCHEMA)
def app_predict():
    """
    Predict function for deployed models

    Returns:
        JSON response of Prediction API call

    Raise:
        Validation error : If data types of input parameters is incorrect
        Access Denied to project : When the given service account key cannot interact with GCP.
    """
    return_message = json.dumps({
        "Success": False,
        "Message": "",
        "Data": {}
    })
    response_code = 400
    try:
        cfg = read_yaml()
        APP.logger.info('Config file loaded')
        payload = request.get_json()
        response = predict.post(cfg=cfg,
                                model_name=payload['model_name'],
                                instances=payload['instances'],
                                version_name=payload['version_name'])

        return_message = json.dumps({
            "Success": True,
            "Message": "Predictions done",
            "Data": [["%.4f" % x for x in point['probabilities']] for point in response]})

        APP.logger.info('[{}]'.format(payload))
        APP.logger.info(return_message)
        response_code = 200

    except IOError as err:
        APP.logger.error(str(err))
        return_message = json.dumps(
            {"Success": False, "Message": "Please check the config.yaml file", "Data": []})
        response_code = 500

    except AssertionError as err:
        APP.logger.error(str(err))
        return_message = json.dumps(
            {"Success": False, "Message": str(err), "Data": []})
        response_code = 500

    except KeyError as err:
        APP.logger.error(
            'Error in fetching the response of the predict function')
        return_message = json.dumps(
            {
                "Success": False,
                "Message": {
                    "Message": "Please check prediction data-points given to the API call",
                    "Error_message": str(err)},
                "Data": None})
        response_code = 500

    except Exception as err:
        APP.logger.error(err)
        return_message = json.dumps(
            {"Success": False, "Message": str(err), "Data": None})
        response_code = 500
    finally:
        return Response(
            return_message,
            status=response_code,
            mimetype='application/json')


@SCHEMA.validate(LIME_SCHEMA)
@APP.route('/predict/lime', methods=['POST'])
def lime_prediction():
    response_code = 400
    return_message = json.dumps({
        "Success": False,
        "Message": "",
        "Data": {}
    })
    try:
        cfg = read_yaml()
        payload = request.get_json()
        result = visualization(
            cfg=cfg,
            job_id=payload['job_id'],
            model_dir=payload['export_dir'],
            predict_json=payload['predict_json'],
            batch_prediction=payload['batch_prediction'],
            d_points=payload['data_points'],
            name=payload['name']
        )
        response_code = 200
        return_message = json.dumps({
            "Success": True,
            "Message": str(result),
            "Data": {}
        })

    except IOError as err:
        APP.logger.error(str(err))
        return_message = json.dumps(
            {"Success": False, "Message": "Please check the config.yaml file", "Data": []})
        response_code = 500

    except AssertionError as err:
        APP.logger.error(str(err))
        return_message = json.dumps(
            {"Success": False, "Message": str(err), "Data": []})
        response_code = 500

    except tf.errors.InvalidArgumentError as err:
        APP.logger.error(str(err._message))
        response_code = 500
        return_message = json.dumps({
            "Success": False,
            "Message": str(err._message.split('\n')[0]),
            "Data": {}
        })

    except KeyError as err:
        response_code = 500
        APP.logger.error(
            str('Following feature[s] missing in the data provided {}'.format(err)))
        return_message = json.dumps({"Success": False, "Message": str(
            'Following feature[s] missing in the data provided {}'.format(err)), "Data": {}})
    finally:
        return Response(
            return_message,
            status=response_code,
            mimetype='application/json')


@SCHEMA.validate(LIME_SCHEMA_2)
@APP.route('/predict/lime2', methods=['POST'])
def lime_prediction_2():
    return_message = json.dumps({
        "Success": False,
        "Message": "",
        "Data": {}
    })
    response_code = 500
    try:
        cfg = read_yaml()
        payload = request.get_json()
        result = visualization_2(
            cfg=cfg,
            job_id=payload['job_id'],
            model_dir=payload['export_dir'],
            predict_json=payload['predict_json'],
            batch_prediction=payload['batch_prediction'],
            name=payload['name'])
        response_code = 200
        return_message = json.dumps(
            {"Success": True, "Message": result, "Data": []})
    except IOError as err:
        APP.logger.error(str(err))
        return_message = json.dumps(
            {"Success": False, "Message": "Please check the config.yaml file", "Data": []})
        response_code = 500

    except ValueError as err:
        APP.logger.error(str(err))
        return_message = json.dumps(
            {"Success": False, "Message": str(err), "Data": []})
        response_code = 500

    except AssertionError as err:
        APP.logger.error(str(err))
        return_message = json.dumps(
            {"Success": False, "Message": str(err), "Data": []})
        response_code = 500

    except tf.errors.InvalidArgumentError as err:
        APP.logger.error(str(err._message))
        response_code = 500
        return_message = json.dumps({
            "Success": False,
            "Message": str(err._message.split('\n')[0]),
            "Data": {}
        })

    except Exception as err:
        return_message = json.dumps(
            {"Success": False, "Message": str(err), "Data": []})
        response_code = 500

    finally:
        return Response(
            return_message,
            status=response_code,
            mimetype='application/json')


if __name__ == '__main__':
    HANDLER = RotatingFileHandler('api.log', maxBytes=10000, backupCount=1)
    FORMATTER = logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s')
    HANDLER.setFormatter(FORMATTER)
    APP.logger.addHandler(HANDLER)
    APP.logger.setLevel(logging.INFO)
    APP.run(host='127.0.0.1', port=8080, debug=False, threaded=True)
