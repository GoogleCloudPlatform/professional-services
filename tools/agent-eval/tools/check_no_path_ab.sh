#!/usr/bin/env bash
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
# CI guard: forbid "Path A" / "Path B" in user-facing strings.
#
# Background: prior assistants kept reintroducing the "Path A vs Path B"
# vocabulary (and a chooser prompt to go with it) into init flows + docs +
# CLI output. The vocabulary leaks made the customer-facing UX feel like a
# false binary choice — it's not, the two surfaces compose. After the
# 2026-04-23 customer demo we ripped them out (rescue plan B2). This guard
# keeps them out.
#
# Internal usage of the legacy ``chosen_paths = {"A", "B"}`` keys is fine
# (those are program-internal identifiers); user-facing strings in source,
# docs, and assistant memory files are not. Allow-list a small set of
# files that legitimately *talk about* the rule itself.

set -euo pipefail

ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"

# Paths to scan
SCAN_DIRS=(src docs README.md CLAUDE.md GEMINI.md)

# Files / patterns where mentioning the strings is OK because the file
# documents the rule itself or is a frozen historical draft.
ALLOWLIST_PATTERNS=(
  # CLAUDE.md / GEMINI.md hold the "never reintroduce Path A vs Path B" rule
  "CLAUDE.md:.*[Nn]ever reintroduce"
  "GEMINI.md:.*[Nn]ever reintroduce"
  "CLAUDE.md:.*[Pp]hantom choice"
  "GEMINI.md:.*[Pp]hantom choice"
  # Frozen historical drafts kept under docs/tmp/ for reference only
  "docs/tmp/"
  # Internal type annotation explaining the legacy enum
  "INTERNAL-ONLY identifiers"
  "enum values for now"
  # Self-reference in this guard script's own help output
  "tools/check_no_path_ab.sh"
)

# Build a `grep -v` pipeline from the allowlist
filter_args=()
for pat in "${ALLOWLIST_PATTERNS[@]}"; do
  filter_args+=(-e "$pat")
done

cd "$ROOT"

# Run the search across the allowed scan paths that exist
existing=()
for p in "${SCAN_DIRS[@]}"; do
  [ -e "$p" ] && existing+=("$p")
done

if [ ${#existing[@]} -eq 0 ]; then
  echo "check_no_path_ab.sh: nothing to scan (run from repo root)"
  exit 0
fi

# Capture matches, strip allow-listed lines.
hits=$(grep -rn 'Path A\|Path B' "${existing[@]}" 2>/dev/null | grep -v "${filter_args[@]}" || true)

if [ -n "$hits" ]; then
  echo "check_no_path_ab.sh: forbidden 'Path A' / 'Path B' strings found in user-facing code:"
  echo
  echo "$hits"
  echo
  echo "Either rename the user-facing string (preferred — describe what the"
  echo "surface IS, not which letter we labelled it) or, if the mention is"
  echo "load-bearing context (e.g. documenting the rule itself), add the"
  echo "specific phrase to ALLOWLIST_PATTERNS in this script."
  exit 1
fi

echo "check_no_path_ab.sh: clean (no forbidden 'Path A' / 'Path B' in user-facing code)."
exit 0
