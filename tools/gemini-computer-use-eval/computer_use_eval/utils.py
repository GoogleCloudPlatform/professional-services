# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import typing
import logging
import importlib.util
import sys
from jinja2 import Template
from computer_use_eval.config import settings

logger = logging.getLogger(__name__)


def template_value(value: typing.Any) -> typing.Any:
    """
    Recursively templates string values using Jinja2 with access to os.environ as 'env'.
    Supports dictionaries, lists, and strings.
    """
    if isinstance(value, str):
        try:
            # Skip if no template markers to save time
            if "{{" not in value:
                return value

            template = Template(value)
            # Pass os.environ as 'env' namespace and preserve {{DEFAULT}} tag
            render_kwargs = {
                **os.environ, "env": os.environ,
                "DEFAULT": "{{DEFAULT}}"
            }
            return template.render(**render_kwargs)
        except Exception as e:
            logger.warning(f"Failed to template string '{value}': {e}")
            return value
    elif isinstance(value, dict):
        return {k: template_value(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [template_value(item) for item in value]
    return value


def parse_resolutions(resolutions_str: str | None) -> list[tuple[int, int]]:
    """
    Parses a comma-separated list of resolutions (e.g., "1920x1080,1280x720")
    into a list of tuples. Defaults to config settings if None.
    """
    warning_msg = (
        "The recommended screen size for use with the Computer Use model is (1440, 900). "
        "The model will work with any resolution, though the quality of the results may be impacted."
    )

    if not resolutions_str:
        logger.info(
            f"No resolution provided. Defaulting to {settings.SCREEN_WIDTH}x{settings.SCREEN_HEIGHT}. {warning_msg}"
        )
        return [(settings.SCREEN_WIDTH, settings.SCREEN_HEIGHT)]

    resolutions = []
    for res in resolutions_str.split(","):
        try:
            width, height = map(int, res.lower().split("x"))
            resolutions.append((width, height))
        except ValueError:
            logger.warning(f"Invalid resolution format: {res}. Skipping.")

    if not resolutions:
        logger.warning(
            f"No valid resolutions found. Reverting to default {settings.SCREEN_WIDTH}x{settings.SCREEN_HEIGHT}. {warning_msg}"
        )
        return [(settings.SCREEN_WIDTH, settings.SCREEN_HEIGHT)]

    return resolutions


def load_custom_function(import_string: str):
    """
    Loads a python function dynamically from a string.
    Format: 'path/to/script.py:function_name' or 'module.path:function_name'
    """
    if ":" not in import_string:
        raise ValueError(
            f"Invalid import string format '{import_string}'. Expected 'module_or_path:function_name'"
        )

    module_path, func_name = import_string.split(":", 1)

    if module_path.endswith(".py"):
        # Load from file path
        if not os.path.exists(module_path):
            raise FileNotFoundError(f"Script file not found: {module_path}")

        module_name = os.path.splitext(os.path.basename(module_path))[0]
        if module_name in sys.modules:
            module = sys.modules[module_name]
        else:
            spec = importlib.util.spec_from_file_location(
                module_name, module_path)
            if spec is None or spec.loader is None:
                raise ImportError(f"Could not load script: {module_path}")

            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)
    else:
        # Load from module path
        module = importlib.import_module(module_path)

    if not hasattr(module, func_name):
        raise AttributeError(
            f"Function '{func_name}' not found in {module_path}")

    return getattr(module, func_name)


def load_file_content(base_path: str, file_path: str) -> str:
    """
    Reads content from a file relative to the base_path.
    """
    base_dir = os.path.abspath(base_path)
    # Resolve the requested path securely
    full_path = os.path.abspath(os.path.join(base_dir, file_path))

    # Ensure the final path is strictly inside the base directory
    if not full_path.startswith(base_dir):
        raise PermissionError("Path traversal attempt detected!")

    if not os.path.exists(full_path):
        raise FileNotFoundError(
            f"Config referenced file not found: {full_path}")

    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()


def resolve_config_files(config: typing.Any, base_path: str) -> typing.Any:
    """
    Recursively scans the config dict for keys ending in '_file'.
    If found (e.g. 'system_prompt_file'), it loads the content
    and populates the target key (e.g. 'system_prompt').

    Args:
        config: The loaded YAML configuration dict.
        base_path: The directory containing the YAML file.
    """
    if isinstance(config, list):
        for item in config:
            resolve_config_files(item, base_path)
    elif isinstance(config, dict):
        # We use list(config.items()) to allow deleting keys during iteration
        for key, value in list(config.items()):
            if isinstance(value, (dict, list)):
                resolve_config_files(value, base_path)

            if key.endswith("_file") and isinstance(value, str):
                target_key = key[:-5]  # Strip '_file' suffix

                # Load the file content
                try:
                    content = load_file_content(base_path, value)
                    config[target_key] = content
                    # Remove the suffix key to keep the config clean
                    del config[key]
                except Exception as e:
                    # Propagate error with context
                    raise ValueError(f"Failed to resolve {key}: {e}")

    return config


class CoordinateScaler:
    """
    Utility class for scaling coordinates between the 0-1000 normalized model scale
    and the absolute pixel viewport (e.g., 1440x900).

    The 0-1000 scale is the specific coordinate space expected by the Gemini
    Computer Use model. This class ensures all agent interactions are correctly
    grounded in the actual browser viewport dimensions.
    """

    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height

    def denormalize(self, x: int, y: int) -> tuple[int, int]:
        """
        Converts 0-1000 normalized coordinates from the model into absolute pixels.
        Includes clamping to the 0-1000 range.
        """
        # Clamp inputs to valid 0-1000 range
        x = max(0, min(1000, x))
        y = max(0, min(1000, y))

        abs_x = int(round((x / 1000.0) * self.width))
        abs_y = int(round((y / 1000.0) * self.height))

        return abs_x, abs_y

    def normalize(self, abs_x: int, abs_y: int) -> tuple[int, int]:
        """
        Converts absolute pixels back into 0-1000 normalized coordinates for the model.
        Includes clamping to the pixel dimensions of the viewport.
        """
        # Clamp inputs to valid pixel range
        abs_x = max(0, min(self.width, abs_x))
        abs_y = max(0, min(self.height, abs_y))

        x = int((abs_x / float(self.width)) * 1000.0)
        y = int((abs_y / float(self.height)) * 1000.0)

        return x, y

    def scale_magnitude(self, magnitude: int, dimension: str = "height") -> int:
        """
        Scales a 0-1000 normalized magnitude to absolute pixels based on a viewport dimension.
        """
        # Clamp magnitude
        magnitude = max(0, min(1000, magnitude))
        size = self.height if dimension == "height" else self.width
        return int(round((magnitude / 1000.0) * size))


async def await_if_needed(obj):
    """Safely awaits an object if it is a coroutine or awaitable."""
    import inspect

    if inspect.iscoroutine(obj) or inspect.isawaitable(obj):
        return await obj
    return obj


def resize_image(image_bytes: bytes,
                 max_width: int,
                 max_height: int,
                 grayscale: bool = False) -> bytes:
    """Resizes an image and optionally converts it to grayscale to save tokens."""
    try:
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(image_bytes))

        # Convert to grayscale if requested
        if grayscale:
            img = img.convert("L")

        img = img.resize((max_width, max_height), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception as e:
        import logging

        logging.error(f"Failed to resize image: {e}")
        return image_bytes
