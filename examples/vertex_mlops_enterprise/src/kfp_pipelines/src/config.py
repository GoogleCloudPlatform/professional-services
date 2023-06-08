from train import REGION, PROJECT_NR, PROJECT_ID

MY_STAGING_BUCKET = PROJECT_ID
PIPELINE_NAME = 'xgb-creditcards'
PIPELINE_ROOT = f'gs://{MY_STAGING_BUCKET}/pipeline_root/{PIPELINE_NAME}'

BQ_INPUT_DATA=f"{PROJECT_ID}.vertex_eu.creditcards"
PARENT_MODEL=f'projects/{PROJECT_NR}/locations/{REGION}/models/1423322200202543104'

MODEL_DISPLAY_NAME='creditcards_xgb'
MODEL_CARD_CONFIG='../model_card_config.json'

PRED_CONTAINER='europe-docker.pkg.dev/vertex-ai/prediction/xgboost-cpu.1-6:latest'
ENDPOINT_NAME='xgboost-creditcards'
