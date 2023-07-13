from train import REGION, PROJECT_NR, PROJECT_ID
import os

#MY_STAGING_BUCKET = PROJECT_ID
MY_STAGING_BUCKET = PROJECT_ID + "-eu-w4"
PIPELINE_NAME = 'xgb-creditcards'
PIPELINE_ROOT = f'gs://{MY_STAGING_BUCKET}/pipeline_root/{PIPELINE_NAME}'
SERVICE_ACCOUNT = os.getenv("SERVICE_ACCOUNT") # returns None is not defined
NETWORK = os.getenv("NETWORK") # returns None is not defined
KEY_ID = os.getenv("CMEK_KEY_ID") # e.g. projects/my-project/locations/my-region/keyRings/my-kr/cryptoKeys/my-key

#BQ_INPUT_DATA=f"{PROJECT_ID}.vertex_eu.creditcards"
BQ_INPUT_DATA=f"{PROJECT_ID}.creditcards.ulb_fraud_detection"
#PARENT_MODEL=f'projects/{PROJECT_ID}/locations/{REGION}/models/1423322200202543104'
PARENT_MODEL=f'projects/{PROJECT_ID}/locations/{REGION}/models/999192186857717760'

BQ_OUTPUT_DATASET_ID="xgb_creditcards_batch_out"

MODEL_DISPLAY_NAME='xgb_creditcards'
MODEL_CARD_CONFIG='../model_card_config.json'

PRED_CONTAINER='europe-docker.pkg.dev/vertex-ai/prediction/xgboost-cpu.1-6:latest'
ENDPOINT_NAME='xgboost-creditcards'

EMAILS=['pbalm@google.com']

# Evaluation pipeline
DATAFLOW_SA = None
DATAFLOW_NETWORK = None
DATAFLOW_PUBLIC_IPS = True
