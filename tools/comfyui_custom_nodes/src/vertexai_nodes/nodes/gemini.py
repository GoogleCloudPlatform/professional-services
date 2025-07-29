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


"""Custom ComfyUI Node for Google Gemini Flash via Vertex AI"""

from typing import Tuple, Dict, Any, Optional, List

from vertexai.generative_models import (
    GenerativeModel,
    GenerationConfig,
    Part,
)
import vertexai
import torch
from ..modules.consts import (
    PROJECT_ID,
    REGION,
    FLASH_MODELS
)
from ..modules.utils import (
    tensor_to_pil,
    get_bytes_from_pil
)


class GeminiNode:
    """
    A ComfyUI node to interact with Gemini Flash, Pro model via Vertex AI.
    Takes a text, image, video prompt and generation parameters,
    returns the generated text.
    """

    CATEGORY = "VertexAI"

    RETURN_NAMES = ("generated_text",)
    RETURN_TYPES = ("STRING",)
    OUTPUT_IS_LIST = (False,)
    OUTPUT_NODE = False

    FUNCTION = "execute_generation"

    def __init__(self):
        """Initializes the Vertex AI client and Gemini model."""

        self.project_id = PROJECT_ID
        self.location = REGION

        try:
            vertexai.init(project=self.project_id, location=self.location)

        except Exception as e:  # pylint: disable=W0718
            print(f"FATAL Error initializing Vertex AI or Gemini Model: {e}")

    @classmethod
    def INPUT_TYPES(cls):  # pylint: disable=C0103
        """Defines the input types for the ComfyUI node."""
        return {
            "required": {
                "model_name": (FLASH_MODELS,),
                "prompt": ("STRING", {
                    "multiline": True,
                    "default": "Explain quantum physics in simple terms."
                    }),
            },
            "optional": {
                "image": ("IMAGE",),
                "video_urls": ("STRING", {"multiline": True}),
                "temperature": ("FLOAT", {
                    "default": 0.9,
                    "min": 0.0,
                    "max": 2.0,
                    "step": 0.05
                }),
                "top_p": ("FLOAT", {
                    "default": 1.0,
                    "min": 0.0,
                    "max": 1.0,
                    "step": 0.05
                }),
                "top_k": ("INT", {
                    "default": 1,
                    "min": 1,
                    "max": 40,
                    "step": 1
                }),
                "max_output_tokens": ("INT", {
                    "default": 2048,
                    "min": 1,
                    "max": 8192,
                    "step": 64
                }),
                # Comma-separated list
                "stop_sequences": ("STRING", {
                    "multiline": False,
                    "default": ""
                }),
            }
        }

    @classmethod
    # pylint: disable=C0103, W0613
    def VALIDATE_INPUTS(cls,
                        prompt,
                        temperature,
                        top_p,
                        top_k,
                        max_output_tokens,
                        stop_sequences):
        """Basic validation for inputs."""
        if not prompt:
            return "Prompt cannot be empty."
        return True

    def execute_generation(self,
                           model_name: str,
                           prompt: str,
                           temperature: float,
                           top_p: float,
                           top_k: int,
                           max_output_tokens: int,
                           stop_sequences: str,
                           image: Optional[torch.Tensor] = None,
                           video_urls: Optional[List[str]] = None
                           ) -> Tuple[str]:
        """
        Generates text using the configured Gemini Flash model via Vertex AI.

        Args:
            prompt (str): The input text prompt.
            temperature (float): Controls randomness (higher = more random).
            top_p (float): Nucleus sampling threshold.
            top_k (int): Top-k sampling parameter.
            max_output_tokens (int): Maximum number of tokens to generate.
            stop_sequences (str): Comma-separated list of sequences to stop.

        Returns:
            tuple: A tuple containing the generated text string.
        """

        model = GenerativeModel(f"{model_name}")

        if not model:
            error_message = "Gemini Model not initialized. \
                Check errors during ComfyUI startup/console logs."
            print(f"Error in execute_generation: {error_message}")
            raise RuntimeError(error_message)

        gen_config_dict: Dict[str, Any] = {
            "temperature": temperature,
            "top_p": top_p,
            "top_k": top_k,
            "max_output_tokens": max_output_tokens,
        }

        # Add stop sequences if provided
        if stop_sequences:
            sequences = [seq.strip()
                         for seq in stop_sequences.split(',') if seq.strip()]
            if sequences:
                gen_config_dict["stop_sequences"] = sequences

        generation_config = GenerationConfig(**gen_config_dict)

        try:
            print(
                f"Sending prompt to Gemini Flash \
                    ({model_name}): '{prompt[:150]}...'"
            )
            print(f"Generation Config: {gen_config_dict}")

            contents = [Part.from_text(prompt)]

            if image is not None:
                pil_image = tensor_to_pil(image)
                image_bytes = get_bytes_from_pil(pil_image)
                part_data = Part.from_data(
                    data=image_bytes,
                    mime_type="image/png"
                )
                contents.append(part_data)

            if (video_urls is not None) and (video_urls != ""):
                video_part_data = []

                for url in video_urls:
                    video_part_data.append(
                        Part.from_uri(
                            uri=url,
                            mime_type="video/mp4"
                        )
                    )

                contents.extend(video_part_data)

            response = model.generate_content(
                contents=contents,
                generation_config=generation_config,
                # safety_settings={
                #     'HARM_CATEGORY_DANGEROUS_CONTENT':'BLOCK_ONLY_HIGH'
                # }
            )

            generated_text = ""
            try:
                generated_text = response.text
                print(
                    f"Received response from Gemini Flash: \
                        '{generated_text[:150]}...'"
                )
            except ValueError as ve:
                # Handle cases where accessing .text fails
                # (e.g., blocked content)

                if (hasattr(response, 'prompt_feedback') and
                        response.prompt_feedback.block_reason):
                    error_info = f"Content generation failed or was blocked. \
                        Reason: {response.prompt_feedback.block_reason}"
                else:
                    error_info = f"ValueError accessing response text: {ve}."

                if (response.candidates and
                        response.candidates[0].finish_reason != 'STOP'):
                    error_info += f"Finish Reason: \
                        {response.candidates[0].finish_reason}."

                print(
                    f"Warning: Could not extract text directly. {error_info}.\
                        Full Response: {response}")
                error_message = f"Error: {error_info}"
                raise RuntimeError(error_message)
            except Exception as e:  # pylint: disable=W0718
                # Catch other unexpected errors during text extraction
                print(
                    f"Error processing response: {e}. \
                        Full Response: {response}")
                error_message = f"Error: Failed to process response - {e}"
                raise RuntimeError(error_message)

            return (generated_text,)

        except Exception as e:  # pylint: disable=W0718
            error_message = f"Error during Gemini API call: {e}"
            print(error_message)
            if ("permission denied" in str(e).lower() or
                    "authentication" in str(e).lower()):
                error_message += " - Check Vertex AI/Google Cloud \
                    authentication (Application Default Credentials validity \
                        and permissions)."
            elif "quota" in str(e).lower():
                error_message += " - Check API quotas for your project \
                    and region in Google Cloud Console."
            elif "invalid argument" in str(e).lower():
                error_message += f" - Check model name ('{self.model_name}') \
                    and generation parameters (temperature, top_k, etc.) \
                        for validity."
            elif "resource exhausted" in str(e).lower():
                error_message += " - The model may be temporarily overloaded \
                    or you've hit a rate limit. Try again later."

            print(f"Critical Error: {error_message}")
            raise RuntimeError(error_message)
