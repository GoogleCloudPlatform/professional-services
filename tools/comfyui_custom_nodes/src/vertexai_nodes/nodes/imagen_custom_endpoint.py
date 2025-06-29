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


"""Custom Endpoint Image Generation Node for ComfyUI"""

import torch
import numpy as np
import PIL.Image as PIL_Image
from typing import Tuple
import base64
import io

from google.cloud import aiplatform
import vertexai

from ..modules.consts import PROJECT_ID, REGION


class ImagenCustomEndpointNode:
    """
    ComfyUI node that generates images using a custom Vertex AI Endpoint.
    """

    CATEGORY = "VertexAI"
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "generate_image"

    def __init__(self):

        try:
            vertexai.init(project=PROJECT_ID, location=REGION)
            aiplatform.init(project=PROJECT_ID, location=REGION)
        except Exception as e:
            print(
                f"CustomEndpointImageNode: Warning - Could not initialize Vertex AI SDK: {e}")
            print("Please ensure your GCP project and region are configured or provided.")

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "endpoint_resource_name": ("STRING", {
                    "multiline": False,
                    "default": "projects/your-project-id/locations/your-region/endpoints/your-endpoint-id"
                }),
                "prompt": ("STRING", {"multiline": True, "default": "A picture of a dog"}),
                "negative_prompt": ("STRING", {"multiline": True, "default": ""}),
                "height": ("INT", {"default": 1024, "min": 64, "max": 4096, "step": 64}),
                "width": ("INT", {"default": 1024, "min": 64, "max": 4096, "step": 64}),
                "samples": ("INT", {"default": 1, "min": 1, "max": 16}),
                "num_inference_steps": ("INT", {"default": 25, "min": 1, "max": 100}),
                "guidance_scale": ("FLOAT", {"default": 7.5, "min": 0.0, "max": 20.0, "step": 0.5}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
            },
        }

    def generate_image(self,
                       endpoint_resource_name: str,
                       prompt: str,
                       negative_prompt: str,
                       height: int,
                       width: int,
                       samples: int,
                       num_inference_steps: int,
                       guidance_scale: float,
                       seed: int) -> Tuple[torch.Tensor]:
        try:
            endpoint = aiplatform.Endpoint(
                endpoint_name=endpoint_resource_name)

            instances = [{"text": prompt} for _ in range(samples)]
            parameters_dict = {
                "negative_prompt": negative_prompt,
                "height": height,
                "width": width,
                "num_inference_steps": num_inference_steps,
                "guidance_scale": guidance_scale,
                "seed": seed,
            }

            response = endpoint.predict(
                instances=instances, parameters=parameters_dict)

            if not response.predictions:
                raise ValueError("Endpoint returned no predictions.")

            images = [PIL_Image.open(io.BytesIO(base64.b64decode(
                prediction.get("output")))) for prediction in response.predictions]

            image_tensors = []

            for image in images:
                pil_image_rgb = image.convert("RGB")
                image_np = np.array(pil_image_rgb).astype(np.float32) / 255.0
                image_torch = torch.from_numpy(image_np)
                image_tensors.append(image_torch)

            if not image_tensors:
                raise ValueError(
                    "No images were processed from endpoint predictions.")

            return (torch.stack(image_tensors),)

        except Exception as e:
            print(f"Error generating image via custom endpoint: {e}")
            dummy_tensor = torch.zeros((1, 64, 64, 3), dtype=torch.float32)
            return (dummy_tensor,)
