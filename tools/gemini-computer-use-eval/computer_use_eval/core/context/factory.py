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

import logging
from computer_use_eval.core.context.base import ContextPipeline
from computer_use_eval.core.context.strategies import (
    SmartTrimStrategy,
    ImageContextStrategy,
    CompactionStrategy,
    SummarizationStrategy,
)
from computer_use_eval.config import settings, ContextConfig

logger = logging.getLogger(__name__)


class ContextPipelineFactory:
    """Factory for building a ContextPipeline from configuration."""

    @staticmethod
    def build(ctx_conf: ContextConfig, client,
              max_history_turns: int) -> ContextPipeline:
        preset = ctx_conf.preset.upper()

        # --- Strengthened Preset Logic ---
        if preset == "ACCURATE":
            default_max_images = -1
            default_compaction = False  # Users want raw, unfiltered history here
            default_summarization = False
        elif preset == "EFFICIENT":
            default_max_images = (
                3  # Matches Google reference implementation for long tasks
            )
            default_compaction = True
            default_summarization = True
        elif preset == "AGGRESSIVE":
            default_max_images = (
                1  # Only keep the absolute most recent image (and Goal)
            )
            default_compaction = True
            default_summarization = True
        else:  # BALANCED (Default)
            default_max_images = 5  # Generous sliding window
            default_compaction = True
            default_summarization = False

        # Apply Overrides (if any)
        max_images = (ctx_conf.max_images_in_history
                      if ctx_conf.max_images_in_history is not None else
                      default_max_images)

        enable_compaction = (ctx_conf.enable_compaction
                             if ctx_conf.enable_compaction is not None else
                             default_compaction)
        enable_summarization = (ctx_conf.enable_summarization
                                if ctx_conf.enable_summarization is not None
                                else default_summarization)

        summarization_model = (ctx_conf.summarization_model or
                               settings.SUMMARIZATION_MODEL)
        summarization_token_threshold = (ctx_conf.summarization_token_threshold
                                         or
                                         settings.SUMMARIZATION_TOKEN_THRESHOLD)

        retention_strategy = (ctx_conf.image_retention_strategy or
                              settings.IMAGE_RETENTION_STRATEGY)

        strategies = []

        # 1. Image Retention Strategy
        strategies.append(
            ImageContextStrategy(max_images=max_images,
                                 retention_strategy=retention_strategy))

        # 2. Compaction Strategy
        if enable_compaction:
            strategies.append(CompactionStrategy())

        # 3. Summarization Strategy
        if enable_summarization:
            strategies.append(
                SummarizationStrategy(
                    client=client,
                    model_name=summarization_model,
                    token_threshold=summarization_token_threshold,
                    keep_tail=10,
                    protected_head=settings.PROTECTED_HEAD_TURNS,
                ))

        # 4. SmartTrim (Final Safety Layer)
        strategies.append(
            SmartTrimStrategy(
                max_turns=max_history_turns,
                protected_head=settings.PROTECTED_HEAD_TURNS,
            ))

        pipeline = ContextPipeline(strategies)
        logger.info(
            f"Context Pipeline built: Preset={preset}, Images={max_images}, Compact={enable_compaction}, Summary={enable_summarization}"
        )
        return pipeline
