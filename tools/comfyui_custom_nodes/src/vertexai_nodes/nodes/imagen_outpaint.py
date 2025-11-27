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



from PIL import Image as PIL_Image, ImageDraw as PIL_ImageDraw

from google.genai.types import (
    EditImageConfig,
    MaskReferenceConfig,
    MaskReferenceImage,
    RawReferenceImage,
)

from ..modules.utils import (
    tensor_to_pil,
    load_image_for_genai,
    pil_to_tensor_mask
)

from ..modules.classes import Imagen3Editing
from ..modules.consts import (
    IMAGEN3_EDIT_MODELS,
    PERSON_GENERATION_MODES,
    SAFETY_FILTER_LEVELS
)

HORIZONTAL_PLACEMENT_MODES = ["left", "center", "right"]
VERTICAL_PLACEMENT_MODES = ["top", "center", "bottom"]


class OutpaintingNode(Imagen3Editing):
    "GenAI Outpainting editing node using Imagen3"

    DESCRIPTION = "Outpaints an image using a prompt, target dimensions, \
and placement control."

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "edit_model": (IMAGEN3_EDIT_MODELS,),
                "image": ("IMAGE",),
                "prompt": ("STRING", {
                    "multiline": True,
                    "default": "A beautiful, expansive view continuing from \
                        the original image."
                }),
                "target_width": ("INT", {
                    "default": 1024,
                    "min": 64,
                    "max": 4096,
                    "step": 8
                }),
                "target_height": ("INT", {
                    "default": 1024,
                    "min": 64,
                    "max": 4096,
                    "step": 8
                }),
                "horizontal_placement": (HORIZONTAL_PLACEMENT_MODES, {
                    "default": "center"
                }),
                "vertical_placement": (VERTICAL_PLACEMENT_MODES, {
                    "default": "center"
                }),
                "mask_dilation": ("FLOAT", {
                    "default": 0.03, "min": 0.0, "max": 1.0, "step": 0.001
                }),
                "number_of_images": ("INT", {
                    "default": 1, "min": 1, "max": 4, "step": 1
                }),
                "seed": ("INT", {
                    "default": 0, "min": 0, "max": 0xffffffffffffffff
                }),
                "safety_filter_level": (SAFETY_FILTER_LEVELS, {
                    "default": "BLOCK_MEDIUM_AND_ABOVE"
                }),
                "person_generation": (PERSON_GENERATION_MODES, {
                    "default": "ALLOW_ADULT"
                }),
            }
        }

    RETURN_TYPES = ("IMAGE", "MASK", )
    FUNCTION = "execute"

    def _calculate_offsets(
            self,
            initial_w,
            initial_h,
            target_w,
            target_h,
            h_place,
            v_place):
        """Calculates the top-left offsets for placing
        the initial image on the target canvas."""
        if h_place == "left":
            x_offset = 0
        elif h_place == "center":
            x_offset = (target_w - initial_w) // 2
        elif h_place == "right":
            x_offset = target_w - initial_w
        else:
            raise ValueError(f"Invalid horizontal placement: {h_place}")

        if v_place == "top":
            y_offset = 0
        elif v_place == "center":
            y_offset = (target_h - initial_h) // 2
        elif v_place == "bottom":
            y_offset = target_h - initial_h
        else:
            raise ValueError(f"Invalid vertical placement: {v_place}")
        return x_offset, y_offset

    def _create_padded_image_and_outpaint_mask(
            self,
            input_pil_image: PIL_Image.Image,
            target_width: int,
            target_height: int,
            h_placement: str,
            v_placement: str):
        """
        Creates a new canvas of target dimensions,
        places the initial image according to placement rules,
        and generates an outpainting mask.
        The mask is white (255) where new content should be generated and
        black (0) where the original image content should be preserved.
        """
        initial_w, initial_h = input_pil_image.size

        if not (target_width >= initial_w and target_height >= initial_h):
            raise ValueError(
                f"Target dimensions ({target_width}x{target_height}) \
                    must be greater than"
                f"or equal to initial image dimensions \
                    ({initial_w}x{initial_h})."
            )

        x_offset, y_offset = self._calculate_offsets(
            initial_w,
            initial_h,
            target_width,
            target_height,
            h_placement,
            v_placement
        )

        input_pil_image_rgb = input_pil_image.convert("RGB")
        padded_image = PIL_Image.new(
            "RGB", (target_width, target_height), (0, 0, 0))
        padded_image.paste(input_pil_image_rgb, (x_offset, y_offset))

        outpaint_mask = PIL_Image.new(
            "L", (target_width, target_height), 255)
        mask_draw = PIL_ImageDraw.Draw(outpaint_mask)

        mask_draw.rectangle(
            [x_offset, y_offset, x_offset + initial_w, y_offset + initial_h],
            fill=0
        )

        return padded_image, outpaint_mask

    def execute(self,
                edit_model: str,
                image,
                prompt: str,
                target_width: int,
                target_height: int,
                horizontal_placement: str,
                vertical_placement: str,
                mask_dilation: float,
                number_of_images: int,
                seed: int,
                safety_filter_level: str,
                person_generation: str):

        input_pil_image = tensor_to_pil(image)
        if input_pil_image is None:
            raise ValueError("Failed to convert input tensor to PIL Image.")

        padded_pil_image, outpaint_mask_pil = (
            self._create_padded_image_and_outpaint_mask(
                input_pil_image,
                target_width,
                target_height,
                horizontal_placement,
                vertical_placement)
        )

        genai_padded_image = load_image_for_genai(padded_pil_image)
        genai_outpaint_mask = load_image_for_genai(outpaint_mask_pil)

        if genai_padded_image is None or genai_outpaint_mask is None:
            raise ValueError(
                "Failed to prepare images for GenAI API \
                    (padded image or mask is None).")

        raw_ref_image = RawReferenceImage(
            reference_image=genai_padded_image, reference_id="0"
        )
        mask_ref_image = MaskReferenceImage(
            reference_id="1",
            reference_image=genai_outpaint_mask,
            config=MaskReferenceConfig(
                mask_mode="MASK_MODE_USER_PROVIDED",
                mask_dilation=mask_dilation,
            ),
        )

        api_seed = seed if seed > 0 else None
        config = EditImageConfig(
            edit_mode="EDIT_MODE_OUTPAINT",
            number_of_images=number_of_images,
            seed=api_seed,
            safety_filter_level=safety_filter_level,
            person_generation=person_generation,
        )

        outpainted_images_tensor = self._execute_api_call(
            edit_model=edit_model,
            prompt=prompt,
            reference_images=[raw_ref_image, mask_ref_image],
            config=config,
            original_image_tensor=image
        )

        outpaint_mask_tensor = pil_to_tensor_mask(outpaint_mask_pil)
        if outpaint_mask_tensor is None and outpaint_mask_pil is not None:
            print(
                "Warning: pil_to_tensor_mask failed to convert \
the outpainting mask. Outputting None for mask.")

        return (outpainted_images_tensor, outpaint_mask_tensor)
