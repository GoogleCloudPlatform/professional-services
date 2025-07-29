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


from google.genai.types import (
    EditImageConfig,
    RawReferenceImage,
)

from ..modules.utils import tensor_to_pil, load_image_for_genai
from ..modules.classes import Imagen3Editing
from ..modules.consts import (
    IMAGEN3_EDIT_MODELS,
    PERSON_GENERATION_MODES,
    SAFETY_FILTER_LEVELS
)


class MaskFreeEditNode(Imagen3Editing):
    "GenAI Mask-Free editing node"

    DESCRIPTION = "Mask-Free editing using a prompt \
        and an original image with Imagen3."

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "edit_model": (IMAGEN3_EDIT_MODELS,),
                "image": ("IMAGE",),
                "prompt": ("STRING", {
                    "multiline": True,
                    "default": "add a fireplace"
                }),
                "number_of_images": ("INT", {
                    "default": 1,
                    "min": 1,
                    "max": 4,
                    "step": 1
                }),
                "seed": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 0xffffffffffffffff
                }),
                "safety_filter_level": (SAFETY_FILTER_LEVELS, {
                    "default": "BLOCK_MEDIUM_AND_ABOVE"
                }),
                "person_generation": (PERSON_GENERATION_MODES, {
                    "default": "ALLOW_ADULT"
                }),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "execute"

    def execute(self,
                edit_model: str,
                image,
                prompt: str,
                number_of_images: int,
                seed: int,
                safety_filter_level: str,
                person_generation: str):

        input_image_pil = tensor_to_pil(image)
        if input_image_pil is None:
            raise ValueError("Failed to convert input tensor to PIL Image.")

        genai_input_image = load_image_for_genai(input_image_pil)
        if genai_input_image is None:
            raise ValueError("Failed to load PIL Image for GenAI.")

        raw_ref_image = RawReferenceImage(
            reference_image=genai_input_image,
            reference_id="0"
        )

        api_seed = seed if seed > 0 else None

        config = EditImageConfig(
            edit_mode="EDIT_MODE_DEFAULT",
            number_of_images=number_of_images,
            seed=api_seed,
            safety_filter_level=safety_filter_level,
            person_generation=person_generation,
        )

        images = self._execute_api_call(
            edit_model=edit_model,
            prompt=prompt,
            reference_images=[raw_ref_image],
            config=config,
            original_image_tensor=image
        )
        return (images,)
