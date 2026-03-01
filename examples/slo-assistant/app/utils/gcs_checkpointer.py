# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-8.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
from typing import Any, AsyncIterator, Dict, Iterator, Optional, Sequence, Tuple

from google.cloud import storage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.base import (
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    SerializerProtocol,
)

logger = logging.getLogger(__name__)


class GCSCheckpointer(MemorySaver):
    """
    A custom LangGraph checkpointer that stores state in memory during execution but also
    syncs state as JSON blobs to Google Cloud Storage for persistent restoration.
    Path structure: gs://{bucket_name}/sessions/{thread_id}/state.json
    """

    def __init__(self, bucket_name: str):
        super().__init__()
        self.bucket_name = bucket_name
        self.client = storage.Client()
        self.bucket = self.client.bucket(self.bucket_name)

    def _get_blob_path(self, thread_id: str) -> str:
        return f"sessions/{thread_id}/state.json"

    def put(
        self,
        config: Dict[str, Any],
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: dict[str, str | float | int]
    ) -> Dict[str, Any]:
        """Saves a checkpoint to GCS after saving to memory."""
        # Call base MemorySaver first
        result = super().put(config, checkpoint, metadata, new_versions)
        
        thread_id = config["configurable"]["thread_id"]
        blob_path = self._get_blob_path(thread_id)
        
        try:
            blob = self.bucket.blob(blob_path)
            # Serialize the state. We serialize the checkpoint tuple using the built in serde
            serialized_checkpoint, _ = self.serde.dumps_typed(checkpoint)
            blob.upload_from_string(serialized_checkpoint)
            logger.info("Saved state to GCS: gs://%s/%s", self.bucket_name, blob_path)
            
            return result
        except Exception as e:
            logger.error("Failed to save state to GCS for thread %s: %s", thread_id, e)
            return result # Fail gracefully and continue with memory saver

    def get_tuple(self, config: Dict[str, Any]) -> Optional[CheckpointTuple]:
        """Retrieves a checkpoint tuple from memory, or loads from GCS if not in memory."""
        # Check memory first
        mem_tuple = super().get_tuple(config)
        if mem_tuple:
            return mem_tuple

        # Fallback to GCS
        thread_id = config["configurable"]["thread_id"]
        blob_path = self._get_blob_path(thread_id)
        
        try:
            blob = self.bucket.blob(blob_path)
            if not blob.exists():
                return None
            
            checkpoint_data = blob.download_as_bytes()
            # In LangGraph pregel, the dump type for a state checkpoint is 'json'.
            checkpoint = self.serde.loads_typed(("json", checkpoint_data))
            
            # Reconstruct CheckpointTuple
            cp_tuple = CheckpointTuple(
                config=config,
                checkpoint=checkpoint,
                metadata={},
                parent_config=None,
                pending_sends=[]
            )
            
            # Store it in memory for subsequent quick reads
            super().put(config, checkpoint, {}, {})
            return cp_tuple
            
        except Exception as e:
            logger.error("Failed to load state from GCS for thread %s: %s", thread_id, e)
            return None
