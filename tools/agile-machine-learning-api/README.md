# AMLA (Agile Machine Learning API)
## Overview


Machine Learning is a vast subject and to use a basic model of linear or logistic regression can be a difficult task for non-developers. This API has been created to make it easier for
non-developers to use machine learning. At high level The API takes care of
- The basic and important aspects of machine learning so that the accuracy of the model can be improved from the baseline models.
- Deployment of the trained models and model versioning.
- Versions of the training on the same data.
- Prediction on your saved model.

In training, the API first cleans the data and then calculates all the relevant features that will be  used in the training. This training data is then saved into temporary files on the disk. These temporary files are then fed into the tensorflow dataset API which makes the input function of the tensorflow estimators which are divided into two parts, custom and canned based on the choice of model users want to run on the data. In the process of training,  all the metrics are called calculated and shown in the logs. These logs when stored as checkpoint can be used to preview the model in Tensorboard.

The trained model are saved into different versions based on the name you give to these versions. Version control is important as there will be frequent data changes or hyperparameters updates, which will then create a different model.

## Functionalities of the API

All the below functionalities can be used with a simple post request to the respective APIs with very basic background knowledge.
 - Train various ML models on GCP CMLE
 - Deploy the trained model on GCP CMLE
 - Predict results of the deployed model both on a batch or on a single datapoints using GCP CMLE
 - Visualize the predicted results using LIME functionality

## Structure of code
```
AMLA
    |__ main.py  (entry point of the API)
    |__ train.py  (train functions)
    |__ predict.py  (predict functions)
    |__ deploy.py  (deploy functions)
    |__ lime_utils.py  (utils functions for LIME functionalities)
    |__ update.sh  (bash script for updating trainer package)
    |__ config
        |__ train.yaml  (file for train configurations)
        |__ config_file.yaml  (file for API configurations)
        |__ developer.yaml  (file for developer configurations)
    |__ codes
        |__ config.yaml  (file for CloudML configurations)
        |__ setup.py
        |__ trainer  (trainer package)
            |__ __init__.py
            |__ launch_demo.py  (end-to-end script for running package)
            |__ models.py  (tensorflow estimator functions)
            |__ input_pipeline_dask.py  (handles input_pipeline)
            |__ utils
                |__ __init__.py
                |__ custom_utils_fn.py
                |__ optimizer_utils.py
                |__ metric_utils.py
```

## Instructions to run the code

### Configuring the API

- Create a config file named **_'config_file.yaml'_** like below, with your project id, bucket name and path of service account key along for main.py in the **config directory** for interacting with GCP resources.

  ```
  bucket_name: "gs://<bucket-name>"
  project: <project_name>
  project_id: <project_ID>
  service_account_json_key: <path/of/service/account/key/json/file>
  ```

- Create a config file named **_'train.yaml'_** like below along for train.py in the **config directory** to specify train configurations. Refer to [*CMLE machine types*](https://cloud.google.com/ml-engine/docs/tensorflow/machine-types) for specifying type virtual machines you want the model to be trained. The trainer package will be created and updated in GCS bucket by running bash script update.sh.

    ```
    scaleTier: "CUSTOM"
    masterType: "complex_model_m"
    workerType: "complex_model_m"
    parameterServerType: "large_model"
    workerCount: 3
    parameterServerCount: 1
    packageUris: ['<path/of/trainer/package/in/GCS>'] # bucket_name+'/trainer-0.0.tar.gz'
    region: "us-central1"
    jobDir: <path/of/the/job_dir>
    runtimeVersion: <tensorflow version>
    pythonVersion: <python version> ##python2.7
    ```
- Create a config file named **_'config.yaml'_** like below in **codes** folder, with the type of virtual machines you want the model to be trained on. Currently if the training job is submitted through Train API the machine configurations are directly loaded from train.yaml. However to this has been added to provide an option to launch training jobs using [*command line*](https://cloud.google.com/sdk/gcloud/reference/ml-engine/jobs/submit/training)
Example of  **_'config.yaml'_** looks like
  ```
  trainingInput:
    scaleTier: CUSTOM
    masterType: complex_model_l
    workerType: complex_model_l
    parameterServerType: large_model
    workerCount: 3
    parameterServerCount: 1
  ```

- Check that your Storage and Machine Learning Engine API is enabled.

  ```bash
  $ gcloud services enable ml.googleapis.com
  ```

- Create a service account key which should have following IAM roles:

  > Machine Learning Engine > ML Engine Admin

  > Storage > Storage Object Admin

- Add the path of the Service account key to an environmental variable "GOOGLE_APPLICATION_CREDENTIALS"

  ```bash
  $ export GOOGLE_APPLICATION_CREDENTIALS=<path/of/service/account/key/json/file>
  ```

### Executing API

- Upload/Update the trainer folder on the google cloud storage bucket using the following command. This command creates tar.gz file of the trainer directory and uploads it to the cloud storage bucket. **Please ensure that "python" executable version used here is aligned with the python version used in CMLE for training and serving.**
    To update the trainer in GCS run
    ```bash
  $ bash update.sh
    ```

- Run main.py python file to start the API

  ```bash
  $ python main.py
  ```

- Now your API has started on
  ```
  localhost:8080
  ```

**Training:**

  Go to **localhost:8080/train** and make a post request with following parameters in json format.
  ```
   "train_csv_path": [Required] List of Paths/Path of the Training data
   "eval_csv_path": [Required] Path of the eval data
   "task_type": [Required] Type of the model to be trained
   "target_var": [Required] Target variable on which later predictions is to be done
   "export_dir": [Required] Path of the directory where the trained model will be exported
   "column_name": [Optional] List of name of columns if not mentioned in csv. If not given will be infered from the data
   "data_type": [Optional] Dict containing feature names as key and values as the types of the feature
   "na_values": [Optional] How are NA values shown in data, for eg '?' as NA values in adult.csv are given by "?" instead of NA. If not given, null will be considered
   "condition": [Optional] Condition of the target variable. If not given, it is assumed that target_var values are integers
   "name": [Required] Name of the model to be run. Choose from ['linearclassifier', 'linearregressor', 'dnnclassifier', 'dnnregresssor','combinedclassifier', 'combinedregressor']
   "n_classes": [Optional] Number of classes in case of classification problem. If not given, default value is set to 2
   "hidden_units": [Optional] Number of hidden units in dnn. If not given, default value is set to 64
   "num_layers": [Optional] Number of layers, if not given, default value is set to 2
   "lin_opt": [Optional] Optimizer to be used for linear problem, if not given, default value is set to ftrl
   "deep_opt": [Optional] Optimizer to be used for deep learning problem, if not given, default value is set to adam
   "train_steps": [Optional] Number of training steps, if not given, default value is set to 50000
   "to_drop": [Optional] List of columns that are not to be considered during training, if not given, default value is set to None
  ```

  Prefix 'gs://' should not be specified to any of the paths in the train request as it fetches the bucket_name from the config_file.yaml file. A sample body of Train API would look like :

  ```json
  {
    "train_csv_path": "<path/of/traincsv> or ['<path_1>','<path_2>']",
    "eval_csv_path": "<path/of/eval csv>",
    "task_type": "classification",
    "target_var": "income_bracket",
    "export_dir": "<path/of/export/directory>",
    "column_name": "None",
    "na_values": "None",
    "condition": "None",
    "data_type": "None",
    "name": "linearclassifier",
    "n_classes": "2",
    "hidden_units": "64",
    "num_layers": "2",
    "lin_opt": "ftrl",
    "deep_opt": "adam",
    "train_steps": "10000",
    "to_drop": ["drop_col1","drop_col2","drop_col3"]
   }
  ```
Response of the API would look like
```
{
  "Message": "<link of the job>",
  "Data": {
      "response": {
          "trainingOutput": {},
          "trainingInput": "train configurations given",
          "jobId": "<job_id assigned to the training Job>",
          "state": "<status of the job>"
      },
      "jobid": "<job_id assigned to the training Job>"
  },
  "Success": <True/False>
}
```
**Deployment:**

  For deploying your model on Machine learning engine go to **localhost:8080/deploy** and make a post request with following parameters in JSON format

  ```
   "job_id": Job ID of the training job
   "model_name": Required name of the deployed model
   "version_name": Required version of the deployed model
   "runtime_version": Tensorflow version of the deployed model
   "trained_model_location": Export dir of the model
  ```

  A sample body of Deploy API would look like :

  ```json
  {
   "job_id": "<Job id of the model>",
   "model_name": "<name of the model>",
   "version_name": "<version of the model>",
   "runtime_version": "<Tensorflow version model trained on>",
   "trained_model_location": "<path/of/export/directory>"
  }
  ```
  Response of the deployment call would look like
 ```
 {
    "Message": "Model is successfully deployed",
    "Data": {
        "name": "<name of the request>",
        "metadata": {
            "version": {
                "machineType": "machine type on which its deployed",
                "name": "<name of the deployed model with version>,
                "runtimeVersion": "1.12",
                "pythonVersion": "2.7",
                "framework": "TENSORFLOW"
            },
            "modelName": "<deployed model name>"
        }
    },
    "Success": <true/false>
 }
 ```

**Prediction:**

  To generate predictions based on the your trained job, go to **localhost:8080/predict** and make a post request with following parameters in JSON format

  ```
  "model_name": Name of the deployed model
  "instances": Data in JSON format on which prediction is to be made
  "version_name": Version of the deployed model on which predictions to be made
  ```

  A sample body of Predict API would look like :

  ```json
  {
   "model_name": "census",
   "instances": [{"capital_gain": 0, "race": "White", "hours_per_week": 40}],
   "version_name": "v1_1"
  }
  ```
  Response of the prediction call would look like
 ```
  {
    "Message": "Predictions done",
    "Data": [
        ["0.5997","0.4003"]
    ],
    "Success": true
  }
 ```
 **Prediction with visualization:**
    This is to create visualization for predicted results using lime. Please find an example [sample_lime.html](sample_lime.html)

  ##### VERSION 1

  To generate prediction based on your trained job and to produce the lime visualization on them based on the prediction, go to **localhost:8080/predict/lime** and make a POST request with following parameters in JSON format
  ```
    "job_id": Job Id of the training job
    "export_dir": Export directory specified while training of the model
    "predict_json": Json file of datapoints on which prediction has to be made
    "batch_prediction": Boolean value stating prediction on batch or a single data-point
    "data_points": Datapoints on which visualization is needed. Can specify ['ALL'] for visualization on all data-points
    "name": Required name of the output files of visualization
  ```
  A sample body of Predict using LIME v1 API would look like :

  ```json
  {
    "job_id": "<job id of training job>",
    "batch_prediction": "<boolean>",
    "export_dir": "<export directory given while training>",
    "predict_json": "<path of the predict json file>",
    "data_points": ["D_id_1","D_id_2"],
    "name": "<required name of the output files>"
  }
  ```
  Here specifying
  where predict_json look like
  ```json
{
    "D_id_1": {"capital_gain": 0, "relationship": "Unmarried", "sex": "Male"},
    "D_id_2": {"capital_gain": 0, "relationship": "Unmarried", "sex": "Female"}
}
  ```
  ##### VERSION 2
  To generate prediction based on your trained job and to produce the lime visualization on them based on the prediction, got to **localhost:8080/predict/lime2** and make a POST request with following parameters in JSON format
  ```
     "job_id": Job Id of the training job
    "export_dir": Export directory specified while training of the model
    "predict_json": Json file of datapoints on which prediction has to be made
    "batch_prediction": Boolean value stating prediction on batch or a single data-point
    "name": Required name of the output files of visualization
  ```
  A sample body of Predict using LIME v2 API would look like :

  ```json
  {
    "job_id": "<job id of the training job>",
    "batch_prediction": "<boolean>",
    "export_dir": "<export directory given while training>",
    "predict_json": "<path of the predict json file>",
    "name": "<required name of the output files>"
  }
  ```
  where predict_json look like this.
  ```json
[{"capital_gain": 0, "relationship": "Unmarried", "sex": "Female", "report": 1}, {"capital.gain": 0, "relationship": "Own-child", "sex": "Female", "report": 0}]
  ```
  In this json, 'report' key in each data point consists of 1 or 0 corresponding to whether report needs to be generated for that particular data-point.

In case of any error in calling the any request in API, Response of the API would look like
```
{
    "Message": "<error message>",
    "Data": [],
    "Success": false
}
```
### Contributors:

##### Developers:

- Revanth Godugunuri
- Ansuj Joshi

We would like to take this opportunity to thank the following reviewers for their constant support and suggestions for improving this tool:
- Yiliang Zhao
- Shixin Luo
- Yujin Tang
