# Copyright 2025 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to
# your agreement with Google.

"Consts used in custom nodes"

import os
from ast import literal_eval

# This will be replaced by Cloud Run service.yaml
from ..modules.utils import load_config_and_set_env_vars

# Check if PROJECT_ID or REGION are set as environment variables.
# If not, load the config.yaml file.
if (
    not os.environ.get("PROJECT_ID")
    or not os.environ.get("REGION")
    or not os.environ.get("FLASH_MODELS")
):
    config_path = os.path.join(os.path.dirname(__file__), '../config.yaml')
    load_config_and_set_env_vars(config_path=config_path)

PROJECT_ID = os.environ.get("PROJECT_ID")
REGION = os.environ.get("REGION")
FLASH_MODELS = literal_eval(os.environ.get("FLASH_MODELS"))
IMAGEN3_EDIT_MODELS = literal_eval(os.environ.get("IMAGEN3_EDIT_MODELS"))
SAFETY_FILTER_LEVELS = literal_eval(os.environ.get("SAFETY_FILTER_LEVELS"))
PERSON_GENERATION_MODES = literal_eval(
    os.environ.get("PERSON_GENERATION_MODES")
)
AUTO_MASK_MODES = literal_eval(os.environ.get("AUTO_MASK_MODES"))
IMAGEN3_GENERATION_MODELS = literal_eval(
    os.environ.get("IMAGEN3_GENERATION_MODELS")
)
VEO_MODELS = literal_eval(os.environ.get("VEO_MODELS"))
VEO_PERSON_GENERATION_MODES = literal_eval(
    os.environ.get("VEO_PERSON_GENERATION_MODES")
)
VEO_ASPECT_RATIOS = literal_eval(
    os.environ.get("VEO_ASPECT_RATIOS")
)
IMAGEN_MODELS = literal_eval(
    os.environ.get("IMAGEN_MODELS")
)
INPAINT_CATEGORY = "VertexAI/Imagen3/Inpainting"
