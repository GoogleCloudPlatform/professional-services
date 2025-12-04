# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
import os
import subprocess
from typing import List, Tuple

logger = logging.getLogger(__name__)


def generate_thumbnail(video_path: str) -> str | None:
    """
    Generates a thumbnail from a video file using ffmpeg.

    Args:
        video_path: The path to the video file.

    Returns:
        The path to the generated thumbnail, or None if it fails.
    """
    if not video_path:
        return None

    thumbnail_filename = (
        "thumbnail_"
        + os.path.splitext(os.path.basename(video_path))[0]
        + ".png"
    )
    thumbnail_path = os.path.join(
        os.path.dirname(video_path), thumbnail_filename
    )

    command = [
        "ffmpeg",
        "-i",
        video_path,
        "-ss",
        "00:00:00.000",  # Capture frame at 0 milisecond
        "-vframes",
        "1",
        "-y",  # Overwrite output file if it exists
        thumbnail_path,
    ]
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        return thumbnail_path
    except FileNotFoundError:
        logger.error(
            "ffmpeg not found. Please ensure ffmpeg is installed and in your PATH."
        )
        return None
    except subprocess.CalledProcessError as e:
        logger.error(f"Error generating thumbnail: {e.stderr}")
        return None


def concatenate_videos(video_paths: List[str], output_path: str) -> str | None:
    """
    Concatenates multiple video files into a single file using ffmpeg.

    Args:
        video_paths: An ordered list of local paths to the video files to be joined.
        output_path: The local path for the final concatenated video.

    Returns:
        The path to the concatenated video, or None on failure.
    """
    if not video_paths or len(video_paths) < 2:
        logger.error("Concatenation requires at least two video files.")
        return None

    # Create a temporary file to list the input videos for ffmpeg
    list_file_path = os.path.join(
        os.path.dirname(output_path), "concat_list.txt"
    )
    with open(list_file_path, "w") as f:
        for path in video_paths:
            absolute_path = os.path.abspath(path)
            # ffmpeg requires file paths to be escaped
            f.write(f"file '{absolute_path}'\n")

    command = [
        "ffmpeg",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        list_file_path,
        "-c",
        "copy",  # Copy codecs to avoid re-encoding, which is much faster
        "-y",  # Overwrite output file if it exists
        output_path,
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        logger.info(f"Successfully concatenated videos to {output_path}")
        return output_path
    except FileNotFoundError:
        logger.error(
            "ffmpeg not found. Please ensure ffmpeg is installed and in your PATH."
        )
        return None
    except subprocess.CalledProcessError as e:
        logger.error(f"Error concatenating videos: {e.stderr}")
        return None
    finally:
        # Clean up the temporary list file
        if os.path.exists(list_file_path):
            os.remove(list_file_path)


def get_video_dimensions(video_path: str) -> Tuple[int, int]:
    """Uses ffprobe to get the width and height of a video file."""
    command = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "json",
        video_path,
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    data = json.loads(result.stdout)
    width = data["streams"][0]["width"]
    height = data["streams"][0]["height"]
    return width, height
