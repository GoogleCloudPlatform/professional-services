#!/bin/bash
# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Shell script to run the demo end to end.


#########################
#####  USER INPUTS  #####
#########################

INPUT_FOLDER="gs://munn-sandbox/patents_demo/sample"
BQ_DATASET="demo_sample"
USE_OBJECT_DETECTION=false # true or false
CONFIG_FILE='../config.yaml'

#########################
#### END OF INPUTS #####
#########################


set -e # Stops on first error.

# Extract project id and bucket_id
PROJECT_ID_RAW=$(grep 'project_id' $CONFIG_FILE | awk '{print $2}')
PROJECT_ID_MAIN=${PROJECT_ID_RAW//\'/}
BUCKET_NAME=gs://${PROJECT_ID_MAIN}/patents_demo

PNG_OUTPUT_FOLDER=${BUCKET_NAME}/${BQ_DATASET}/png
OCR_OUTPUT_FOLDER=${BUCKET_NAME}/${BQ_DATASET}/json
OCR_CLEAN_FOLDER=${BUCKET_NAME}/${BQ_DATASET}/json_clean
VALID_PDF_FOLDER=${BUCKET_NAME}/${BQ_DATASET}/valid_pdf
CROPPED_OBJ_FOLDER=${BUCKET_NAME}/${BQ_DATASET}/cropped_objects

export PYTHONPATH=$PYTHONPATH:`pwd`/document-extraction-demo/

DEBUG=false

if ${DEBUG}; then
# Check to see if $BQ_DATASET exists. If it already exits, ask user if they want to delete it and its tables.
# if Y, then the dataset is deleted and created new. If n, then exits.
# If $BQ_DATASET does not exist, it is automatically created
array=( $(bq ls -d --project_id ${PROJECT_ID_MAIN}) )

if [[ ! " ${array[@]} " =~ " ${BQ_DATASET} " ]]; then
    # create dataset if it does not exist
    bq --location=US mk --dataset $PROJECT_ID_MAIN:$BQ_DATASET
fi

if [[ " ${array[@]} " =~ " ${BQ_DATASET} " ]]; then
    # confirm that the user wants to delete this dataset to start fresh 
    read -p "The dataset $PROJECT_ID_MAIN:$BQ_DATASET already exists. 
Do you want to delete the $PROJECT_ID_MAIN:$BQ_DATASET dataset and all of its tables? (Y/n) " yn
      case $yn in
          [Yy]* ) 
        bq rm -r -f -d $PROJECT_ID_MAIN:$BQ_DATASET;
        bq --location=US mk --dataset $PROJECT_ID_MAIN:$BQ_DATASET;;
          [Nn]* ) exit;;
          * ) echo "Please answer yes or no.";
          exit;;
      esac   
fi

# Check to see if bucket gs://${PROJECT_ID_MAIN}/$BQ_DATASET exists. 
# If it already exits, ask user if they want to delete it and its contents.
array=( $(gsutil ls gs://${PROJECT_ID_MAIN}) )

if [[ " ${array[@]} " =~ " gs://${PROJECT_ID_MAIN}/${BQ_DATASET}/ " ]]; then
    # confirm that the user wants to delete this bucket to start fresh
    read -p "The bucket gs://${PROJECT_ID_MAIN}/${BQ_DATASET} already exists. 
Do you want to delete it and all of its contents? (Y/n) " yn
      case $yn in
          [Yy]* ) 
        gsutil -m rm -r gs://${PROJECT_ID_MAIN}/${BQ_DATASET};;
          [Nn]* ) exit;;
          * ) echo "Please answer yes or no.";
          exit;;
      esac   
fi

fi

if ${DEBUG}; then
python document-extraction-demo/pdf2png.py \
  --input_folder=$INPUT_FOLDER \
  --output_folder=$PNG_OUTPUT_FOLDER \
  --config_file=$CONFIG_FILE

if ${DEBUG}; then
python document-extraction-demo/classify_png.py \
  --input_folder_png $PNG_OUTPUT_FOLDER \
  --input_folder_pdf $INPUT_FOLDER \
  --selected_pdf_folder $VALID_PDF_FOLDER \
  --bq_dataset $BQ_DATASET \
  --config_file $CONFIG_FILE
fi

python document-extraction-demo/pdf_to_vision/run_ocr.py \
  --gcs-source-uri $VALID_PDF_FOLDER \
  --gcs-destination-uri $OCR_OUTPUT_FOLDER \
  --config_file $CONFIG_FILE

if ${DEBUG}; then

python document-extraction-demo/postprocess_ocr.py \
  --gcs_folder_ocr_raw $OCR_OUTPUT_FOLDER \
  --gcs_folder_ocr_clean $OCR_CLEAN_FOLDER \
  --config_file $CONFIG_FILE


python document-extraction-demo/predict_automl_text.py \
  --gcs_folder $OCR_CLEAN_FOLDER \
  --bq_dataset $BQ_DATASET \
  --config_file $CONFIG_FILE


python document-extraction-demo/automl_ner/predict_automl_ner.py \
  --gcs_json_path $OCR_CLEAN_FOLDER \
  --dataset_bq $BQ_DATASET \
  --config_file $CONFIG_FILE

if $USE_OBJECT_DETECTION
  then
  python document-extraction-demo/predict_automl_objdetect.py \
    --input_image_folder=$PNG_OUTPUT_FOLDER \
    --output_cropped_images_folder=$CROPPED_OBJ_FOLDER \
    --bq_dataset_output=$BQ_DATASET \
    --config_file=$CONFIG_FILE
fi

python document-extraction-demo/create_final_view.py \
  --bq_dataset $BQ_DATASET \
  --use_object_detection $USE_OBJECT_DETECTION \
  --config_file $CONFIG_FILE

python document-extraction-demo/evaluate/evaluate.py \
  --bq_dataset $BQ_DATASET \
  --config_file $CONFIG_FILE
fi