# Predict Company Responses to Consumer Complaints

# TODO: Readme should have very clear instructions on running the entire pipeline, including getting started and the repo and pretty much anything else a dev running the code would need.

# TODO: Once project is ready to go, change the log level from DEBUG to INFO.

## Contributors
Michael Sherman (michaelsherman@google.com)  
Michael Sparkman (michaelsparkman1996@gmail.com)  
Karan Palsani (karanpalsani@utexas.edu)  
Sahana Subramanian (sahana.subramanian@utexas.edu)  
TODO: Shane Kok ()

# Overview

This project shows how to use ML models to predict a company's response to consumer complaints using the public [CFPB Consumer Complaint Database](https://console.cloud.google.com/marketplace/details/cfpb/complaint-database?filter=solution-type:dataset&id=5a1b3026-d189-4a35-8620-099f7b5a600b) on BigQuery. It provides an implementation of [AutoML Tables](https://cloud.google.com/automl-tables) for model training and batch prediction.

The project also shows how to deploy a production-ready data processing pipeline for prediction of a company response based on consumer complaints on Google Cloud Platform, using BigQuery and AutoML Tables.

## Repository Structure
TODO: Update this once project is wrapping.

```
.
├── scripts         # Python and Bash scripts for running the data and modeling pipeline.
├── queries         # SQL queries for data manipulation, cleaning, transformation, and metrics calculation.
├── notebooks       # Jupyter notebooks for data exploration. Not part of the pipeline codebase, not reviewed, not tested in the pipeline environment, and dependent on 3rd party Python packages not required by the pipeline. Provided for reference only.
└── config          # Project configuration and table ingestion schemas. The configuration for the pipeline is all in `pipeline.yaml`.
```

## Configuration Overview

The configuration provided with the code is `config/pipeline.yaml`. This configuration information is used by pipeline scripts and for substitution into SQL queries stored in the `queries` folder.

Basic configuration changes necessary when running the pipeline are discussed with the pipeline running instructions below.

TODO: Make sure all config changes are detailed in the running steps, and make sure this section is correct.

We recommend making a separate copy of the configuration when you have to change configuration parameters. All pipeline steps are run with the config file as a command line option, and using separate copies makes tracking different pipeline runs more manageable. 

The main sections of the configuration are:
* `file_paths`: Absolute locations of files read by the pipeline. The default values will work if the repo is cloned into the default home directory of a [Cloud AI Platform Notebook](https://cloud.google.com/ai-platform/notebooks/docs/), but may have to be changed in a different environment. The paths are subfolders of the repo, other than the location of a service account key (more on this key below in the subsection on local environment setup).
* `global`: Core configuration information used by multiple steps of the pipeline. It contains the names of the BigQuery dataset and tables, the ID of the Google Cloud Platform project, AutoML Tables model/data identification parameters, etc.
* `query_files`: Filenames of SQL queries used by the pipeline.
* `query_params`: Parameters for substitution into individual SQL queries.
* `model`: Configuration information for the AutoML Tables Model. Includes parameters on training/optimizing the model, identification of key columns in the training data (e.g., the target), training data columns to exclude from model building, and type configuration for each feature used by the model.

## Instructions for Running the WHATEVER_ITS_CALLED example.

All instructions were tested on a [Cloud AI Platform Notebook](https://cloud.google.com/ai-platform/notebooks/docs/) instance, created through the [UI](https://console.cloud.google.com/ai-platform/notebooks/instances). If you are running in another environment, you'll have to setup the [`gcloud` SDK](https://cloud.google.com/sdk/install), install Python 3 and virtualenv, and possibly manage other dependencies. We have not tested these instructions in other environments.

**All commands, unless otherwise stated, should be run from the cloned repo root.** 

## Enable Required APIs in your Project

These instructions have been tested in a fresh Google Cloud project without any organization constraints. You should be able to run the code in an existing project, but make sure the following APIs are enabled, and make sure these products can communicate with one another--if you're running in a VPC or have organization-imposed firewall rule or product restrictions you may have some difficulty.

1. Required APIs to enable:
  1. [Compute Engine API](https://console.cloud.google.com/apis/api/compute.googleapis.com/)
  1. [BigQuery API](https://console.cloud.google.com/apis/api/bigquery.googleapis.com/)
  1. [Cloud AutoML API](https://console.cloud.google.com/apis/api/automl.googleapis.com/)
  1. [Cloud Storage API](https://console.cloud.google.com/apis/api/storage-component.googleapis.com/)

### Setup for a New Local Environment

These steps should be followed before you run the pipeline for the first time from a new development environment. 

TODO: Update closer to project completion

As stated previously, these instructions have been tested in a [Google Cloud AI Platforms Notebook](https://console.cloud.google.com/ai-platform/notebooks/instances).

1. Run `gcloud init`, choose to use a new account, authenticate, and [set your project ID](https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects) as the project. Choose a region in the US if prompted to set a default region.
1. Run `bq init`. You may get a prompt telling you the command isn't necessary, hit 'y'. When asked to select a project, just hit enter. It's okay to overwrite the .bigqueryrc file if bq prompts you that one already exists.
1. Clone the project from us-central1.
1. Navigate to the repo root directory: `cd WHATEVER_WE_CALL_IT` .
1. Create a Python 3 virtual environment (`?????'' in this example):
  1. Run `virtualenv --python=python3 $HOME/env/?????` .
  1. Active the environment. Run: `source ~/env/?????/bin/activate` .
  1. Install the required Python packages: `pip install -r requirements.txt` . You may get an error about apache-beam and pyyaml version incompatibilities, this will have no effect.
1. [Create a service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts#creating_a_service_account) for AutoML Tables using the [Service accounts console in IAM](https://console.cloud.google.com/iam-admin/serviceaccounts).
  1. Select your project (or another project you are running in).
  1. Click the "Create Service Account" button.
  1. Enter a name and a description for the service account and click "Continue".
  1. Assign the following roles to the service account:
    * AutoML Editor: For training and predicting AutoML models.
    * BigQuery Data Owner: For automatically cleaning up BigQuery artifacts created when making predictions.
    * BigQuery Job User: For executing BigQuery jobs.
  1. Click "Continue" and on the next page click "Create Key" and create a JSON key. It will download through the web browser.
1. Get the downloaded JSON key into your environment. If you're using AI Platform Notebooks, [this video](https://www.youtube.com/watch?v=1bd2QHqQSH4) shows how to upload a file.
1. Move the service account key file to `$HOME/.oauth_keys/automl_service_account_key.json`. This location is referenced in the config file (`file_paths.automl_service_account_key`), update accordingly if a different location is used. You may need to create the .oauth_keys directory.

I THINK THIS NEXT SET OF INSTRUCTIONS IS NO LONGER REQUIRED, CORRECT?
1. Download and install the AutoML Client (with Python SDK).
  1. Copy the client from storage with `gsutil cp gs://gap-automl-client/automl_prod.tar.gz $HOME/automl_client/automl_prod.tar.gz` .
  1. Untar/uncompress the client with `tar -xzvf $HOME/automl_client/automl_prod.tar.gz -C $HOME/automl_client` .
  1. Install with `pip install $HOME/automl_client/automl_prod/python/automl-v1beta1` .

### Required Configuration Changes

Configuration is read from a file specified when running the pipeline from the command line. We recommend working with different copies of the configuration for different experiments, environments, and other needs.

The default values in `config/pipeline.yaml` provided with the code should be changed before running the pipeline. Running the pipeline with a config previously used to run a pipeline will result in errors from collisions of dataset and model names.

1. Make a copy of the configuration file: `cp config/pipeline.yaml config/my_config.yaml` .
1. Edit `config/my_config.yaml` and make the following changes then save:
THIS IS WRONG RIGHT NOW, NEEDS TO BE UPDATED BASED ON PIPELINE
  1. `global.clean_dataset` is the dataset where ingested data is stored in BigQuery. Change this to a new value. Note the table names don't need to change, since they will be written to the new dataset.
  1. `global.forecasting_dataset` is the dataset where features, predictions, and metrics are written in BigQuery. Change this to a new value, and similarly table names don't need to change.
  1. `global.dataset_display_name` and `global.model_display_name` are the name of the AutoML Tables Forecasting dataset and model created by the pipeline. Change these to new values (they can be the same).
  TODO: Make sure project and queries path config changes are mentioned. 


TODO CLEAN ALL THIS UP

You should create a new config file and change these parameters for every full pipeline run. For failed pipeline runs, you'll want to delete the resources specified in these config values since the pipeline will not delete existing resources automatically (except for `global.clean_dataset`).

Note that on subsequent pipeline runs if you aren't rerunning ingestion you don't need to change `global.clean_dataset`, if you aren't rerunning the feature pipeline you don't need to change `global.forecasting_dataset`, and if you aren't rerunning the model build you don't need to change `global.dataset_display_name` and `global.model_display_name`.

If you need to change the default paths (because you are running somewhere besides an AI Platform Notebook, because your repo is in a different path, or because your AutoML service account key is in a different location) change the values in `file_paths`.

### Running the Pipeline

These steps have only been tested for users with the "Owner" IAM role. They should work for the "Editor" role as well, but we have not tested it.

TODO UPDATE THIS TO BE CORRECT

All commands should be run from the repository root.
TODO: there's no orchestraction script here. The steps need to be run individually. 
TODO: Give some indication of how long each step will take to run.

1. Active the Python environment if it is not already activated. Run: `source ~/env/????/bin/activate`
1. Run the model pipeline: `nohup bash run_pipeline.sh config/my_config.yaml ftpe > pipeline.out & disown` . This command will run the pipeline in the background, save logs to `pipeline.out`, and will not terminate if the terminal is closed. It will run all steps of the pipeline in sequence, or a subset of the steps as determined by the second positional arg (MODE). Ex. `fp` instead of `ftpe` would create features and then generate predictions using the model specified in the config.
  * Create features (f): This creates the dataset of features (config value `global.forecasting_dataset`) and feature tables.
  * Train (t): This creates the training dataset in AutoML Tables Forecasting (config value `global.dataset_display_name`) and trains the model (config value `global.model_display_name`). Note that in the AutoML Tables UI the dataset will appear as soon as it is created but the model will not appear until it is completely trained.
  * Predict (p): This makes predictions with the model, and copies the unformatted results to a predictions table (config value `global.predictions_table`). AutoML generates its own dataset in BQ, which will contain errors if predictions for any rows fail. This spurious dataset (named prediction_<model_name>_<timestamp>) will be deleted if there are no errors.
  * Backtest (e): This formats predictions and joins with historical data for visualization and analysis of results (config value `global.eval_table`), then generates evaluation metrics and saves to the metrics table(config value `global.eval_metrics_table`).
  
This command pipes its output to a log file (`pipeline.out`). To follow this log file, run `tail -n 5 -f pipeline.out` to monitor the command while it runs.

**Note:** If the pipeline is run and the destination datasets and tables have already been created, the run will fail. Use the BQ UI, client, or command line interface to delete the tables, or select new destinations in the config. AutoML also does not enforce that display names are unique, if multiple datasets or models are created with the same name, the run will fail. Use the AutoML UI or client to delete them, or select new display names in the config.

### Common Configuration Changes
    
    TODO THIS IS WRONG

* To change the time periods for prediction, change `global.test_start_date`, `predict_start_date`, and `global.horizon_periods`. 
* To change the products in scope for the model, change `global.brand`, `global.divison`, and `global.departments`.
* Change `model.train_budget_hours` to control how long the model trains for. We recommend the default setting of 3 hours; note that this time does not include an initial hour or so of training setup.
    

