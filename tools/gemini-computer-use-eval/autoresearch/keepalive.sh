#!/bin/bash

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


if [ -z "$1" ]; then
  echo "Usage: $0 <target_benchmark.yaml> [runs=2] [batch_size=1]"
  exit 1
fi

TARGET_BENCHMARK=$1
RUNS=${2:-2}
BATCH_SIZE=${3:-1}

.venv/bin/python autoresearch/evaluate_population.py \
    --population-dir autoresearch/population \
    --target-benchmark "$TARGET_BENCHMARK" \
    --runs "$RUNS" --batch-size "$BATCH_SIZE" > autoresearch/tournament.log 2>&1 &
PID=$!
while kill -0 $PID 2>/dev/null; do
    echo "Still running evaluation... (PID $PID)"
    sleep 30
done
echo "Evaluation complete! Here are the results:"
tail -n 50 autoresearch/tournament.log