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


"""Custom ComfyUI Node for Google Veo 2 via Google GenAI."""

import time
from typing import Tuple, Optional, List
import os
import base64
import io
import torch
import numpy as np
from PIL import Image as PILImage

from google import genai
from google.genai.types import GenerateVideosConfig, Image
from google.api_core import exceptions as api_exceptions
from google.cloud import storage

import folder_paths  # pylint: disable=E0401

from ..modules.utils import is_valid_gcs_uri, any_type
from ..modules.consts import (
    PROJECT_ID,
    REGION,
    VEO_MODELS,
    VEO_PERSON_GENERATION_MODES,
    VEO_ASPECT_RATIOS
)


class VeoNode:
    """
    ComfyUI node to generate videos using Google's Veo 2 model.
    It initiates a long-running operation, polls for completion, and returns
    the GCS URI of the generated video.
    """

    CATEGORY = "VertexAI"

    RETURN_TYPES = ("STRING",)  # Output type: GCS URI of the generated video
    RETURN_NAMES = ("GCS_URIs",)

    FUNCTION = "generate_video"

    def __init__(self):
        self.client = None
        project = PROJECT_ID
        location = REGION

        try:
            self.client = genai.Client(
                vertexai=True, project=project, location=location)
        except Exception as e:  # pylint: disable=W0718
            print(f"Error initializing Google GenAI client: {e}")
            self.client = None

    @classmethod
    def INPUT_TYPES(cls):  # pylint: disable=C0103
        """Defines the input types for the ComfyUI node."""

        return {
            "required": {
                "model_name": (VEO_MODELS,),
                "prompt": ("STRING", {
                    "multiline": True,
                    "default": "A golden retriever puppy playing in a \
                        field of colorful flowers."
                }),
                "output_gcs_uri": ("STRING", {
                    "multiline": False,
                    "default": "gs://your-bucket-name/output/"
                }),
                "number_of_videos": ("INT", {
                    "default": 1,
                    "min": 1,
                    "max": 4
                }),
                "duration_seconds": ("INT", {
                    "default": 8,
                    "min": 5,
                    "max": 8
                }),
                "seed": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 0xffffffffffffffff
                }),
                "person_generation":  (VEO_PERSON_GENERATION_MODES,),
                "enhance_prompt": ("BOOLEAN", {"default": False}),
                "negative_prompt": ("STRING", {
                    "multiline": True,
                    "default": None
                }),
                "aspect_ratio": (VEO_ASPECT_RATIOS,),
                "polling_interval_seconds": ("INT", {
                    "default": 15,
                    "min": 5,
                    "max": 60
                }),
            },
            "optional": {
                "image": (any_type,),  # This should be b64 format
            }
        }

    def generate_video(self,
                       prompt: str,
                       model_name: str,
                       output_gcs_uri: str,
                       number_of_videos: int,
                       duration_seconds: int,
                       seed: int,
                       person_generation: str,
                       enhance_prompt: bool,
                       negative_prompt: str,
                       aspect_ratio: str,
                       polling_interval_seconds: int,
                       image: Optional[str] = None,
                       ) -> List[str]:
        """
        Generates a video using the Veo model via Google GenAI Operation.

        Args:
            All arguments correspond to the keys defined in INPUT_TYPES.

        Returns:
            A tuple containing a single string:
            - On success: The GCS URI of the generated video.
            - On failure: An error message string.
        """
        if not self.client:
            error_message = "Google GenAI client is not initialized. \
                Ensure the GOOGLE_API_KEY environment variable is set"
            print(f"[Veo2Node] Error: {error_message}")
            raise RuntimeError(error_message)

        if not is_valid_gcs_uri(output_gcs_uri):
            error_message = f"Invalid 'output_gcs_uri': '{output_gcs_uri}'. \
                    Must start with 'gs://', specify a bucket/path, \
                    and not end with '/'. Example: gs://bucket/path/prefix"
            raise RuntimeError(error_message)

        config = GenerateVideosConfig(
            number_of_videos=number_of_videos,
            duration_seconds=duration_seconds,
            seed=seed,
            person_generation=person_generation,
            enhance_prompt=enhance_prompt,
            negative_prompt=negative_prompt,
            aspect_ratio=aspect_ratio,
            output_gcs_uri=output_gcs_uri
        )
        print(
            f"[Veo2Node] Video Generation Config prepared: \
                AspectRatio={aspect_ratio}, Output={output_gcs_uri}")

        # --- Call the Model (Start Long-Running Operation) ---
        operation = None
        try:
            print(
                f"[Veo2Node] Sending request to Veo model ({model_name}).\
                    Prompt: '{prompt[:100]}...'")

            operation = self.client.models.generate_videos(
                model=model_name,
                prompt=prompt,
                image=Image(
                    image_bytes=image,
                    mime_type="image/png"
                ) if image else None,
                config=config,
            )

            operation_name = operation.name
            print(
                f"[Veo2Node] Started video generation operation: \
                    {operation_name}")
            print(
                f"[Veo2Node] Polling status every \
                    {polling_interval_seconds} seconds...")

            # --- Poll the Long-Running Operation ---
            while not operation.done:
                time.sleep(polling_interval_seconds)
                try:
                    operation = self.client.operations.get(
                        operation=operation)

                    progress_percent = "N/A"
                    if operation.metadata:
                        progress = operation.metadata.get("progress")
                        if progress and "percentCompleted" in progress:
                            progress_percent = progress["percentCompleted"]

                    print(
                        f"[Veo2Node] Polling {operation_name}: \
                            Status={'Done' if operation.done else 'Running'}, \
                                Progress={progress_percent}%")

                except api_exceptions.NotFound:
                    error_message = f"Operation {operation_name} not found \
                        during polling. It might have expired or been deleted."
                    print(f"[Veo2Node] Error: {error_message}")
                    raise RuntimeError(error_message)
                except Exception as poll_error:  # pylint: disable=W0718
                    # Log non-critical polling errors but continue polling
                    print(
                        f"[Veo2Node] Warning: Error refreshing operation \
                            status (will retry): {poll_error}")

            print(f"[Veo2Node] Operation {operation_name} completed.")

            if operation.error:
                error_message = f"Video generation failed. \
                    Error: {operation.error}"
                print(f"[Veo2Node] Error: {error_message}")
                raise RuntimeError(error_message)

            print(operation.response)

            if (operation.response and
                hasattr(operation.response, 'generated_videos') and
                    operation.response.generated_videos):

                video_uris = []

                for generated_video in operation.response.generated_videos:
                    video_uris.append(generated_video.video.uri)

                # video_uri = operation.response.generated_videos[0].video.uri
                print(
                    f"[Veo2Node] Video generated successfully. \
                        GCS URI: {video_uris}")
                return (video_uris,)  # Return GCS URI in a tuple
            else:
                error_message = "Operation succeeded \
                    but no video URI found in the response."
                print(
                    f"[Veo2Node] Warning: {error_message}. \
                        Full response: {operation.response}")
                raise RuntimeError(error_message)

        except api_exceptions.PermissionDenied as e:
            error_message = f"Permission Denied: Check API key permissions \
                and GCS write access to '{output_gcs_uri}'. Details: {e}"
            print(f"[Veo2Node] Error: {error_message}")
            raise RuntimeError(error_message)
        except api_exceptions.InvalidArgument as e:
            error_message = f"InvalidArgument: Model name('{model_name}'), \
                parameters, prompt, or GCS path format. Details: {e}"
            print(f"[Veo2Node] Error: {error_message}")
            raise RuntimeError(error_message)
        except api_exceptions.ResourceExhausted as e:
            error_message = f"Quota Exceeded: Check Google Cloud API \
                quotas for the GenAI service. Details: {e}"
            print(f"[Veo2Node] Error: {error_message}")
            raise RuntimeError(error_message)
        except api_exceptions.NotFound as e:
            error_message = f"Not Found: Ensure the model '{model_name}' \
                is available or the specified GCS path exists. Details: {e}"
            print(f"[Veo2Node] Error: {error_message}")
            raise RuntimeError(error_message)
        except Exception as e:  # pylint: disable=W0718
            error_message = f"An unexpected error occurred: \
                {type(e).__name__} - {e}"
            if operation and hasattr(operation, 'name'):
                error_message += f" (Related Operation: {operation.name})"
            print(f"[Veo2Node] Error: {error_message}")
            raise RuntimeError(error_message)


class VideoPreviewNode:
    "Video Preview Node loading from GCS"

    @classmethod
    def INPUT_TYPES(cls):  # pylint: disable=C0103
        """Defines the input types for the ComfyUI node."""
        return {"required": {
            "gcs_urls": ("STRING",),
        }}

    CATEGORY = "VertexAI"
    DESCRIPTION = "Video Preview Node loading from GCS"

    RETURN_TYPES = ()
    OUTPUT_NODE = True

    FUNCTION = "load_video"

    def download_video_from_gcs_to_tempfile(self, gcs_urls):
        """Downloads a video from Google Cloud Storage to a temporary file.

        Args:
            gcs_url (str): The GCS URL of the video
            (e.g., 'gs://your-bucket/your-video.mp4').

        Returns:
            str or None: The path to the downloaded temporary file,
            or None if an error occurs.
        """
        try:
            # Parse the GCS URL
            file_paths = []
            for gcs_url in gcs_urls:
                parts = gcs_url.replace("gs://", "").split("/")
                bucket_name = parts[0]
                blob_name = "/".join(parts[1:])
                file_name = "_".join(parts[1:])

                print(f"[VideoPreviewNode] bucket_name : {bucket_name}")
                print(f"[VideoPreviewNode] blob_name : {blob_name}")
                print(f"[VideoPreviewNode] Temp File Name : {file_name}")

                file_path = f"{folder_paths.get_temp_directory()}/{file_name}"

                print(f"[VideoPreviewNode] file_path : {file_path}")

                # Initialize the GCS client
                client = storage.Client(project="kr-ais-demo")

                # Get the bucket
                bucket = client.bucket(bucket_name)

                # Get the blob (the video file)
                blob = bucket.blob(blob_name)

                # Download the blob to the temporary file
                blob.download_to_filename(file_path)
                print("[VideoPreviewNode] Blob downloaded succesfully")
                file_paths.append(file_path)

            return file_paths

        except Exception as e:  # pylint: disable=W0718
            error_message = f"Error downloading video from GCS: {e}"
            print(error_message)
            raise RuntimeError(error_message)

    def load_video(self, gcs_urls):
        "Load video from temp file"
        video_paths = self.download_video_from_gcs_to_tempfile(
            gcs_urls=gcs_urls
        )

        videos = []
        for video_path in video_paths:
            video_name = os.path.basename(video_path)
            video_path_name = os.path.basename(os.path.dirname(video_path))
            videos.append([video_name, video_path_name])

        return {"ui": {"videos": videos}}


class ImageToBase64Node:
    "Node to encode image into base64"
    @classmethod
    def INPUT_TYPES(cls):  # pylint: disable=C0103
        """Defines the input types for the ComfyUI node."""
        return {"required": {
            "image": ("IMAGE",)
        }}

    CATEGORY = "VertexAI"
    DESCRIPTION = "Base64 Encoding Node"

    RETURN_TYPES = ("STRING",)  # Output type: GCS URI of the generated video
    RETURN_NAMES = ("base64_string",)

    FUNCTION = "encode_image_to_base64"

    def encode_image_to_base64(self, image: torch.Tensor) -> Tuple[str]:
        """
        Encodes the input image tensor to a base64 string.

        Args:
            image (torch.Tensor): The input image tensor from ComfyUI
            (Batch, H, W, C).
            format (str): The image format to use for encoding
            ('PNG' or 'JPEG').

        Returns:
            Tuple[str]: A tuple containing the base64 encoded string
            or an error message.
        """
        if not isinstance(image, torch.Tensor):
            error_message = "Error: Input 'image' must be a torch.Tensor."
            raise RuntimeError(error_message)

        if image.dim() == 4 and image.shape[0] > 0:
            # Select the first image from the batch
            img_tensor = image[0]
        elif image.dim() == 3:
            # Assume it's a single image without batch dimension
            img_tensor = image
        else:
            error_message = f"Error: Input image tensor has unexpected \
                dimensions: {image.shape}"
            raise RuntimeError(error_message)

        try:
            # Convert tensor values from [0.0, 1.0] to [0, 255]
            # and change type to uint8
            img_np = (img_tensor.cpu().numpy() * 255).astype(np.uint8)

            # Convert numpy array to PIL Image (assuming RGB format)
            pil_image = PILImage.fromarray(img_np, 'RGB')

            # Save image to an in-memory buffer
            buffered = io.BytesIO()

            pil_image.save(buffered, format="PNG")
            buffered.seek(0)  # Reset buffer position to the beginning

            # Get bytes from buffer
            img_bytes = buffered.getvalue()

            # Encode bytes to base64 string
            base64_string = base64.b64encode(img_bytes).decode('utf-8')

            return (base64_string,)

        except Exception as e:  # pylint: disable=W0718
            error_message = f"Error encoding image to base64: {e}"
            print(f"[ImageToBase64Node] {error_message}")
            raise RuntimeError(error_message)
