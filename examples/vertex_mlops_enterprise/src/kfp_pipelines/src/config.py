import os

PROJECT_ID = os.getenv("PROJECT_ID", "")
REGION = os.getenv("REGION", "")
IMAGE=f'{REGION}-docker.pkg.dev/{PROJECT_ID}/creditcards-kfp/base:latest'
TRAIN_COMPONENT_IMAGE=f'{REGION}-docker.pkg.dev/{PROJECT_ID}/creditcards-kfp/train-fraud:latest'

CLASS_NAMES = ['OK', 'Fraud']
TARGET_COLUMN = 'Class'

MY_STAGING_BUCKET = PROJECT_ID
PIPELINE_NAME = 'xgb-creditcards'
PIPELINE_ROOT = f'gs://{MY_STAGING_BUCKET}/pipeline_root/{PIPELINE_NAME}'
SERVICE_ACCOUNT = os.getenv("SERVICE_ACCOUNT") # returns None is not defined
NETWORK = os.getenv("NETWORK") # returns None is not defined
KEY_ID = os.getenv("CMEK_KEY_ID") # e.g. projects/my-project/locations/my-region/keyRings/my-kr/cryptoKeys/my-key

BQ_INPUT_DATA=f"{PROJECT_ID}.vertex_eu.creditcards"
PARENT_MODEL=f'projects/{PROJECT_ID}/locations/{REGION}/models/1423322200202543104'

BQ_OUTPUT_DATASET_ID="creditcards_batch_out"

MODEL_DISPLAY_NAME='xgb_creditcards'
MODEL_CARD_CONFIG='../model_card_config.json'

PRED_CONTAINER='europe-docker.pkg.dev/vertex-ai/prediction/xgboost-cpu.1-6:latest'
ENDPOINT_NAME=PIPELINE_NAME

EMAILS=['abcdef@google.com']

# Evaluation pipeline
DATAFLOW_SA = None
DATAFLOW_NETWORK = None
DATAFLOW_PUBLIC_IPS = True
