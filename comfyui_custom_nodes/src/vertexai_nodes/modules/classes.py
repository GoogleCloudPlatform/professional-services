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


"""Classes"""

import io
import torch
from PIL import Image as PIL_Image

from google import genai
from google.genai.types import MaskReferenceConfig, MaskReferenceImage

from .utils import (
    pil_to_tensor,
    tensor_mask_to_pil,
    load_image_for_genai
)
from .consts import (
    PROJECT_ID,
    REGION
)


class Imagen3Editing:
    "Base Class for Imagen3 Image editing custom nodes"

    CATEGORY = "VertexAI/Imagen3"
    RETURN_TYPES = ("IMAGE",)  # [N, H, W, C]
    RETURN_NAMES = ("images",)
    FUNCTION = "execute"

    def __init__(self):
        self.client = genai.Client(
            vertexai=True, project=PROJECT_ID, location=REGION)

    def _execute_api_call(self,
                          edit_model,
                          prompt,
                          reference_images,
                          config,
                          original_image_tensor):
        if not self.client:
            raise RuntimeError(
                "GenAI Client for Vertex AI could not be initialized.")
        try:
            print(f"Calling Imagen3 Edit API with {edit_model}, {prompt}")
            response = self.client.models.edit_image(
                model=edit_model,
                prompt=prompt,
                reference_images=reference_images,
                config=config
            )

            # response.generated_images is a list of
            # genai.GeneratedImage objects.
            # Each genai.GeneratedImage object has an
            # 'image' attribute (type genai.Image),
            # and genai.Image has 'image_bytes'.
            if response.generated_images:
                print(
                    f"Image editing successful. API returned \
                        {len(response.generated_images)} image(s). \
                            Processing...")

                processed_image_tensors = []
                for generated_image_obj in response.generated_images:
                    # generated_image_obj is of type genai.GeneratedImage
                    # generated_image_obj.image is of type genai.Image
                    image_data = generated_image_obj.image
                    image_bytes = image_data.image_bytes

                    pil_img = PIL_Image.open(io.BytesIO(image_bytes))

                    tensor_img = pil_to_tensor(pil_img)

                    processed_image_tensors.append(tensor_img)

                # Concatenate all [1, H, W, C] tensors
                # into a single [N, H, W, C] batch tensor
                final_batch_tensor = torch.cat(
                    processed_image_tensors, dim=0)
                print(
                    f"Successfully processed and batched \
                        {final_batch_tensor.shape[0]} image(s).")
                return final_batch_tensor

            else:
                print(
                    "Warning: API did not return any edited images. \
                        Returning original image.")
                return original_image_tensor
        except Exception as e:
            print(f"Error during GenAI Edit API call: {e}")
            print("Returning original image due to error.")
            return original_image_tensor


class Imagen3Mask:
    """
    A class containing methods to generate different types of mask references
    for VertexAI Imagen3 API.
    """

    def create_manual_mask_reference(
        self,
        mask_tensor,
        mask_dilation: float,
        reference_id: int = 1
    ) -> MaskReferenceImage:
        """
        Creates a MaskReferenceImage from a user-provided mask tensor.

        Args:
            mask_tensor: The input mask tensor from ComfyUI.
            mask_dilation: The dilation factor for the mask.
            reference_id: The reference ID for this mask image.

        Returns:
            A MaskReferenceImage object.
        """
        input_mask_pil = tensor_mask_to_pil(mask_tensor)
        genai_mask_image = load_image_for_genai(input_mask_pil)
        return MaskReferenceImage(
            reference_id=reference_id,
            reference_image=genai_mask_image,
            config=MaskReferenceConfig(
                mask_mode="MASK_MODE_USER_PROVIDED",
                mask_dilation=mask_dilation,
            )
        )

    def create_auto_mask_reference(
        self,
        mask_mode: str,
        mask_dilation: float,
        reference_id: int = 1
    ) -> MaskReferenceImage:
        """
        Creates a MaskReferenceImage for auto-masking modes.

        Args:
            mask_mode: The automatic mask mode (e.g., "MASK_MODE_FOREGROUND").
            mask_dilation: The dilation factor for the mask.
            reference_id: The reference ID for this mask configuration.

        Returns:
            A MaskReferenceImage object.
        """
        mask_config = MaskReferenceConfig(
            mask_mode=mask_mode,
            mask_dilation=mask_dilation
        )
        return MaskReferenceImage(
            reference_id=reference_id,
            reference_image=None,
            config=mask_config
        )

    def create_semantic_mask_reference(
        self,
        semantic_classes_csv: str,
        mask_dilation: float,
        reference_id: int = 1
    ) -> MaskReferenceImage:
        """
        Creates a MaskReferenceImage for semantic segmentation masks.

        Args:
            semantic_classes_csv: A comma-separated string of
            semantic class IDs.
            mask_dilation: The dilation factor for the mask.
            reference_id: The reference ID for this mask configuration.

        Returns:
            A MaskReferenceImage object.

        Raises:
            ValueError: If semantic_classes_csv is invalid \
                or results in an empty list.
        """
        try:
            segmentation_classes = []
            segments = semantic_classes_csv.split(',')
            for s in segments:
                stripped_s = s.strip()
                if stripped_s:
                    segment_int = int(stripped_s)
                    segmentation_classes.append(segment_int)
            if not segmentation_classes:
                raise ValueError(
                    "Segmentation classes string \
                        resulted in \an empty list after parsing.")
            print(
                f"Using semantic segmentation classes: {segmentation_classes}")
        except ValueError as e:
            error_message = (
                f"Invalid semantic_classes_csv: '{semantic_classes_csv}'. "
                f"Must be a comma-separated list of integers.\nError: {e}"
            )
            raise ValueError(error_message) from e

        mask_config = MaskReferenceConfig(
            mask_mode="MASK_MODE_SEMANTIC",
            segmentation_classes=segmentation_classes,
            mask_dilation=mask_dilation
        )
        return MaskReferenceImage(
            reference_id=reference_id,
            reference_image=None,
            config=mask_config
        )
