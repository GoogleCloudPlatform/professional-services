import os

PROJECT_ID = os.getenv("PROJECT_ID", "")
REGION = os.getenv("REGION", "")
IMAGE=os.getenv("CICD_IMAGE_URI", f'{REGION}-docker.pkg.dev/{PROJECT_ID}/creditcards-kfp/base:latest')
TRAIN_COMPONENT_IMAGE=f'{REGION}-docker.pkg.dev/{PROJECT_ID}/creditcards-kfp/train-fraud:latest'
IMAGE_MODEL_CARD=os.getenv("CICD_IMAGE_MODEL_CARD", f'{REGION}-docker.pkg.dev/{PROJECT_ID}/creditcards-kfp/model-card:latest')

CLASS_NAMES = ['OK', 'Fraud']
TARGET_COLUMN = 'Class'

PIPELINE_NAME = os.getenv("PIPELINE_NAME", 'xgb-creditcards')
PIPELINE_ROOT = os.getenv("PIPELINES_STORE", f'gs://{PROJECT_ID}/pipeline_root/{PIPELINE_NAME}')
SERVICE_ACCOUNT = os.getenv("SERVICE_ACCOUNT") # returns None is not defined
NETWORK = os.getenv("NETWORK") # returns None is not defined
KEY_ID = os.getenv("CMEK_KEY_ID") # e.g. projects/my-project/locations/my-region/keyRings/my-kr/cryptoKeys/my-key

BQ_INPUT_DATA=f"{PROJECT_ID}.{os.getenv('BQ_DATASET_NAME')}.{os.getenv('ML_TABLE')}"
PARENT_MODEL='' # f'projects/{PROJECT_ID}/locations/{REGION}/models/YOUR_NUMERIC_MODEL_ID_HERE'

BQ_OUTPUT_DATASET_ID="creditcards_batch_out"

MODEL_DISPLAY_NAME = os.getenv("MODEL_DISPLAY_NAME", 'creditcards-kfp')
MODEL_CARD_CONFIG='../model_card_config.json'

PRED_CONTAINER='europe-docker.pkg.dev/vertex-ai/prediction/xgboost-cpu.1-6:latest'
ENDPOINT_NAME=PIPELINE_NAME

EMAILS=['abcdef@google.com']

# Evaluation pipeline
DATAFLOW_SA = os.getenv("DATAFLOW_SA")
DATAFLOW_NETWORK = os.getenv("DATAFLOW_NETWORK")
DATAFLOW_PUBLIC_IPS = False
