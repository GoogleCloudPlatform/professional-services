# Copyright 2025 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#    http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


"Consts used in custom nodes"

import os


PROJECT_ID = os.environ.get("PROJECT_ID")
REGION = os.environ.get("REGION", "us-central1")

FLASH_MODELS = ['gemini-2.0-flash-001']
IMAGEN_MODELS = ['imagen-3.0-generate-002']
IMAGEN3_EDIT_MODELS = ['imagen-3.0-capability-001']
IMAGEN3_GENERATION_MODELS = ['imagen-3.0-generate-002']
VEO_MODELS = ['veo-2.0-generate-001']

AUTO_MASK_MODES = ['MASK_MODE_FOREGROUND', 'MASK_MODE_BACKGROUND']
VEO_ASPECT_RATIOS = ["16:9", "9:16"]

PERSON_GENERATION_MODES = ['ALLOW_ADULT', 'ALLOW_ALL', 'DONT_ALLOW']
VEO_PERSON_GENERATION_MODES = ['allow_adult', 'disallow']

SAFETY_FILTER_LEVELS = ['BLOCK_LOW_AND_ABOVE', 'BLOCK_MEDIUM_AND_ABOVE',
                        'BLOCK_ONLY_HIGH', 'BLOCK_NONE']

INPAINT_CATEGORY = "VertexAI/Imagen3/Inpainting"
