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


"""Custom ComfyUI Nodes for Vertex AI Imagen3 Product Background Swap"""

from google.genai.types import (
    EditImageConfig,
    RawReferenceImage,
)

from ..modules.utils import (
    tensor_to_pil,
    load_image_for_genai,
)

from ..modules.classes import Imagen3Editing, Imagen3Mask

from ..modules.consts import (
    IMAGEN3_EDIT_MODELS,
    PERSON_GENERATION_MODES,
    SAFETY_FILTER_LEVELS
)

PRODUCT_BGSWAP_CATEGORY = "VertexAI/Imagen3/ProductBGSwap"


class ProductBGSwapMaskNode(Imagen3Editing, Imagen3Mask):
    "GenAI Background SWAP editing with manual mask"

    DESCRIPTION = "Imagen3 Background editing with manual mask."
    CATEGORY = PRODUCT_BGSWAP_CATEGORY

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "edit_model": (IMAGEN3_EDIT_MODELS,),
                "product_image": ("IMAGE",),
                "mask": ("MASK",),
                "prompt": ("STRING", {
                    "multiline": True,
                    "default": "a product on a clean background, \
                        professional product shot"
                }),
                "mask_dilation": ("FLOAT", {
                    "default": 0.0, "min": 0.0, "max": 1.0, "step": 0.01
                }),
                "number_of_images": ("INT", {
                    "default": 1, "min": 1, "max": 4
                }),
                "seed": ("INT", {
                    "default": 0, "min": 0, "max": 0xffffffffffffffff
                }),
                "safety_filter_level": (SAFETY_FILTER_LEVELS,
                                        {"default": "BLOCK_MEDIUM_AND_ABOVE"}),
                "person_generation": (PERSON_GENERATION_MODES,
                                      {"default": "ALLOW_ADULT"}),
            }
        }

    def execute(self,
                edit_model,
                product_image,
                mask,
                prompt,
                mask_dilation,
                number_of_images,
                seed,
                safety_filter_level,
                person_generation):

        input_image_pil = tensor_to_pil(product_image)
        genai_input_image = load_image_for_genai(input_image_pil)
        raw_ref = RawReferenceImage(
            reference_image=genai_input_image, reference_id=0)

        mask_ref = self.create_manual_mask_reference(
            mask_tensor=mask,
            mask_dilation=mask_dilation
        )

        config = EditImageConfig(
            edit_mode="EDIT_MODE_BGSWAP",
            number_of_images=number_of_images,
            seed=seed if seed > 0 else None,
            safety_filter_level=safety_filter_level,
            person_generation=person_generation,
        )
        images = self._execute_api_call(
            edit_model,
            prompt,
            [raw_ref, mask_ref],
            config,
            product_image
        )
        return (images,)


class ProductBGSwapAutoMaskNode(Imagen3Editing, Imagen3Mask):
    "GenAI Background SWAP editing with auto mask"

    DESCRIPTION = "Imagen3 Background SWAP editing with auto mask."
    CATEGORY = PRODUCT_BGSWAP_CATEGORY

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "edit_model": (IMAGEN3_EDIT_MODELS,),
                "product_image": ("IMAGE",),
                "prompt": ("STRING", {
                    "multiline": True,
                    "default": "a product on a clean background, \
                        professional product shot"
                }),
                "mask_dilation": ("FLOAT", {
                    "default": 0.0,
                    "min": 0.0,
                    "max": 1.0,
                    "step": 0.01
                }),
                "number_of_images": ("INT", {
                    "default": 1,
                    "min": 1,
                    "max": 4
                }),
                "seed": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 0xffffffffffffffff
                }),
                "safety_filter_level": (SAFETY_FILTER_LEVELS,
                                        {"default": "BLOCK_MEDIUM_AND_ABOVE"}),
                "person_generation": (PERSON_GENERATION_MODES,
                                      {"default": "ALLOW_ADULT"}),
            }
        }

    def execute(self,
                edit_model,
                product_image,
                prompt,
                mask_dilation,
                number_of_images,
                seed,
                safety_filter_level,
                person_generation):

        input_image_pil = tensor_to_pil(product_image)
        genai_input_image = load_image_for_genai(input_image_pil)
        raw_ref = RawReferenceImage(
            reference_image=genai_input_image, reference_id=0)

        mask_ref = self.create_auto_mask_reference(
            mask_mode="MASK_MODE_BACKGROUND",  # hardcoded for background swap
            mask_dilation=mask_dilation
        )

        config = EditImageConfig(
            edit_mode="EDIT_MODE_BGSWAP",
            number_of_images=number_of_images,
            seed=seed if seed > 0 else None,
            safety_filter_level=safety_filter_level,
            person_generation=person_generation,
        )
        images = self._execute_api_call(
            edit_model,
            prompt,
            [raw_ref, mask_ref],
            config,
            product_image
        )
        return (images,)
