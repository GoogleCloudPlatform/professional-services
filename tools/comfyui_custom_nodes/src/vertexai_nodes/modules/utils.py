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

"Utils used in custom nodes"

import logging
import os
import io
import yaml
import numpy as np
import torch
from PIL import Image as PIL_Image
from PIL.Image import Image as PILImageType
from google.genai.types import (
    Image as GenaiImage,
)

logger = logging.getLogger()


def is_valid_gcs_uri(uri: str) -> bool:
    """Checks if a string is a valid GCS URI."""
    is_string = isinstance(uri, str)
    starts_with_gs = uri.startswith("gs://")
    has_more_than_bucket = len(uri.split('/')) > 2
    does_not_end_with_slash = uri[-1] != '/'
    is_not_example = uri != "gs://your-bucket-name/output/"
    return (
        is_string
        and starts_with_gs
        and has_more_than_bucket
        and does_not_end_with_slash
        and is_not_example
    )


def _load_config(config_path):
    """Load config.yaml"""
    try:
        with open(config_path, 'r', encoding="utf-8") as config_file:
            config = yaml.safe_load(config_file)
        return config
    except FileNotFoundError:
        logger.error("Error: Config file '%s' not found.", config_path)
        return None
    except yaml.YAMLError as e:
        logger.error("Error loading config file '%s': %s", config_path, e)
        return None


def load_config_and_set_env_vars(config_path):
    """
    Loads configuration from a YAML file and \
        sets the values as environment variables.
    Args:
        config_file_path: The path to the YAML configuration file.
    """

    config_data = _load_config(config_path)

    # Set environment variables from the configuration
    for key, value in config_data.items():
        os.environ[key] = str(value)


# wildcard trick is taken from pythongossss's
class AnyType(str):
    "Trick to bypass validation"

    def __ne__(self, __value: object) -> bool:
        return False


any_type = AnyType("*")


def pil_to_tensor(image: PIL_Image.Image) -> torch.Tensor:
    "Convert PIL to Tenser"
    if image.mode != 'RGB':
        image = image.convert('RGB')
    image_np = np.array(image).astype(np.float32) / 255.0
    return torch.from_numpy(image_np).unsqueeze(0)


def tensor_to_pil(tensor: torch.Tensor) -> PIL_Image.Image:
    "Convert Tensor to PIL"
    if tensor.ndim == 4:
        tensor = tensor.squeeze(0)
    if tensor.shape[-1] == 3:
        image_np = tensor.numpy()
    elif tensor.shape[0] == 3:
        image_np = tensor.permute(1, 2, 0).numpy()
    elif tensor.shape[-1] == 1:
        image_np = np.repeat(tensor.numpy(), 3, axis=-1)
    elif tensor.shape[0] == 1:
        image_np = np.repeat(tensor.permute(1, 2, 0).numpy(), 3, axis=-1)
    else:
        raise ValueError(f"Unsupported tensor shape for image: {tensor.shape}")
    image_np = (image_np.clip(0, 1) * 255).astype(np.uint8)
    return PIL_Image.fromarray(image_np)


def tensor_mask_to_pil(tensor: torch.Tensor) -> PIL_Image.Image:
    "Convert Mask to PIL"
    if tensor.ndim == 4:
        channel_dim = -1 if tensor.shape[-1] == 1 else 1
        tensor = tensor.squeeze(0).squeeze(channel_dim)
    elif tensor.ndim == 3:
        tensor = tensor.squeeze(0)
    elif tensor.ndim == 2:
        pass
    else:
        raise ValueError(f"Unsupported mask tensor shape: {tensor.shape}")
    image_np = (tensor.numpy().clip(0, 1) * 255).astype(np.uint8)
    return PIL_Image.fromarray(image_np).convert('L')


def get_bytes_from_pil(image: PIL_Image.Image) -> bytes:
    "Convert Bytes from PIL"
    byte_io = io.BytesIO()
    image.save(byte_io, "PNG")
    return byte_io.getvalue()


def load_image_for_genai(image_pil: PIL_Image.Image) -> GenaiImage:
    "Convert PIL Image to GenaiImage"
    image_bytes = get_bytes_from_pil(image_pil)
    return GenaiImage(image_bytes=image_bytes)


def pil_to_tensor_mask(pil_image: PILImageType) -> torch.Tensor:
    """
    Converts a PIL Image object representing a mask to a PyTorch tensor
    """
    # Ensure the image is in 'L' mode 
    # (grayscale, 8-bit pixels, black and white)
    if pil_image.mode != 'L':
        pil_image = pil_image.convert('L')

    numpy_mask = np.array(pil_image).astype(np.float32)
    numpy_mask /= 255.0
    tensor_mask = torch.from_numpy(numpy_mask)
    tensor_mask = tensor_mask.unsqueeze(0)

    return tensor_mask
