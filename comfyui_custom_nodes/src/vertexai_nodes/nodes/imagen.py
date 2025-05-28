# Copyright 2025 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to
# your agreement with Google.

"""Imagen Nodes"""

from typing import Tuple, cast
import torch
import numpy as np
import PIL.Image as PIL_Image

import vertexai
from vertexai.preview.vision_models import ImageGenerationModel

from ..modules.consts import (
    PROJECT_ID,
    REGION,
    IMAGEN_MODELS,
)


class Imagen3Node:
    "ComfyUI node that generates images using Vertex AI Imagen 3"

    CATEGORY = "VertexAI/Imagen3"
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "generate_image"

    def __init__(self):
        self.project_id = PROJECT_ID
        self.location = REGION

        vertexai.init(project=self.project_id, location=self.location)

    @classmethod
    def INPUT_TYPES(cls):  # pylint: disable=C0103
        """Defines the input types for the ComfyUI node."""
        return {
            "required": {
                "model_name": (IMAGEN_MODELS,),
                "prompt": ("STRING", {"multiline": True}),
                "negative_prompt": ("STRING", {"multiline": True,
                                               "default": ""}),
                "aspect_ratio": (["1:1", "16:9", "4:3"],),
                "samples": ("INT", {"default": 1, "min": 1, "max": 4}),
                "guidance_scale": ("FLOAT", {
                    "default": 7.5,
                    "min": 1.0,
                    "max": 20.0,
                    "step": 0.5
                }),
                "seed": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 0xffffffffffffffff
                }),
            },
        }

    def generate_image(self,
                       model_name,
                       prompt: str,
                       negative_prompt: str,
                       aspect_ratio: str,
                       samples: int,
                       guidance_scale: float,
                       seed: int) -> Tuple[torch.Tensor]:
        "Image Generation method"
        try:

            generation_model = ImageGenerationModel.from_pretrained(model_name)

            images = generation_model.generate_images(
                prompt=prompt,
                number_of_images=samples,
                aspect_ratio=aspect_ratio,
                negative_prompt=negative_prompt,
                person_generation="allow_adult",
                safety_filter_level="block_few",
                add_watermark=False,
                seed=seed,
            )

            image_tensors = []
            for image in images:
                # pylint: disable=W0212
                pil_image = cast(PIL_Image.Image, image._pil_image)
                # Ensure the image is in RGB mode before converting to NumPy
                pil_image_rgb = pil_image.convert("RGB")
                image_np = np.array(pil_image_rgb).astype(np.float32) / 255.0
                image_torch = torch.from_numpy(image_np)
                image_tensors.append(image_torch)

            return (torch.stack(image_tensors),)

        except Exception as e:  # pylint: disable=W0718
            print(f"Error generating image: {e}")
            return (torch.empty(1, 512, 512, 3),)
