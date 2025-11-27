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


"""Custom ComfyUI Nodes for Imagen3 Image Removal (Inpainting based)"""

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
    AUTO_MASK_MODES,
    PERSON_GENERATION_MODES,
    SAFETY_FILTER_LEVELS,
    INPAINT_CATEGORY
)


class InpaintRemoveMaskNode(Imagen3Editing, Imagen3Mask):
    "GenAI Image inpainting removing with manual mask"

    DESCRIPTION = "Imagegen3 inpainting removing objects using a manual mask."
    CATEGORY = INPAINT_CATEGORY

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "edit_model": (IMAGEN3_EDIT_MODELS,),
                "image": ("IMAGE",),
                "mask": ("MASK",),
                # Prompt can be empty for pure removal
                "prompt": ("STRING", {"multiline": True, "default": ""}),
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
                image,
                mask,
                prompt,
                mask_dilation,
                number_of_images,
                seed,
                safety_filter_level,
                person_generation):

        input_image_pil = tensor_to_pil(image)
        genai_input_image = load_image_for_genai(input_image_pil)
        raw_ref = RawReferenceImage(
            reference_image=genai_input_image, reference_id=0)

        mask_ref = self.create_manual_mask_reference(
            mask_tensor=mask,
            mask_dilation=mask_dilation
        )

        config = EditImageConfig(
            edit_mode="EDIT_MODE_INPAINT_REMOVAL",
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
            image
        )
        return (images,)


class InpaintRemoveAutoMaskNode(Imagen3Editing, Imagen3Mask):
    "GenAI Image inpainting removing with auto mask"

    DESCRIPTION = "Imagen3 inpainting removing objects \
        using an auto-generated mask."
    CATEGORY = INPAINT_CATEGORY

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "edit_model": (IMAGEN3_EDIT_MODELS,),
                "image": ("IMAGE",),
                "prompt": ("STRING", {"multiline": True, "default": ""}),
                "mask_mode": (AUTO_MASK_MODES,
                              {"default": "MASK_MODE_FOREGROUND"}),
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
                image,
                prompt,
                mask_mode,
                mask_dilation,
                number_of_images,
                seed,
                safety_filter_level,
                person_generation):

        input_image_pil = tensor_to_pil(image)
        genai_input_image = load_image_for_genai(input_image_pil)
        raw_ref = RawReferenceImage(
            reference_image=genai_input_image, reference_id=0)

        mask_ref = self.create_auto_mask_reference(
            mask_mode=mask_mode,
            mask_dilation=mask_dilation
        )

        config = EditImageConfig(
            edit_mode="EDIT_MODE_INPAINT_REMOVAL",
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
            image
        )
        return (images,)


class InpaintRemoveSemanticMaskNode(Imagen3Editing, Imagen3Mask):
    "GenAI Image inpainting removing with semantic mask"

    DESCRIPTION = """Image inpainting removing objects \
        using a semantically generated mask.
- Provide comma-separated semantic class IDs to remove (e.g., '8, 15')."""
    CATEGORY = INPAINT_CATEGORY

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "edit_model": (IMAGEN3_EDIT_MODELS,),
                "image": ("IMAGE",),
                "prompt": ("STRING", {"multiline": True, "default": ""}),
                "semantic_classes_csv": ("STRING", {
                    "default": "7",
                    "multiline": False
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
                image,
                prompt,
                semantic_classes_csv,
                mask_dilation,
                number_of_images,
                seed,
                safety_filter_level,
                person_generation):

        input_image_pil = tensor_to_pil(image)
        genai_input_image = load_image_for_genai(input_image_pil)
        raw_ref = RawReferenceImage(
            reference_image=genai_input_image, reference_id=0)

        mask_ref = self.create_semantic_mask_reference(
            semantic_classes_csv=semantic_classes_csv,
            mask_dilation=mask_dilation
        )

        config = EditImageConfig(
            edit_mode="EDIT_MODE_INPAINT_REMOVAL",
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
            image
        )
        return (images,)
