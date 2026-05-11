#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
# build_wheel.sh — Build the agent-eval wheel package
# ──────────────────────────────────────────────────────────────────────
#
# This script builds a distributable .whl file for agent-eval.
# The wheel can be installed in downstream projects without needing
# the full agent-eval source tree.
#
# Prerequisites:
#   - uv (https://docs.astral.sh/uv/) must be installed
#
# Usage:
#   ./build_wheel.sh
#
# Output:
#   dist/agent_eval-<version>-py3-none-any.whl
#
# Installing the wheel in another project:
#   1. Copy the .whl file into your project (e.g., vendor/ folder)
#   2. Install it separately (do NOT add to pyproject.toml):
#        uv pip install ./vendor/agent_eval-<version>-py3-none-any.whl
#
# NOTE: Adding the .whl path to pyproject.toml does not work with uv.
#       Always install the wheel as a separate pip install step.
#
# What you need to distribute:
#   - build_wheel.sh       (this script)
#   - pyproject.toml        (package metadata + dependencies)
#   - src/agent_eval/       (the package source code)
#   - uv.lock               (locked dependencies, optional but recommended)
#
# IMPORTANT: Never leave .whl files at the repo root alongside source
#            code — uv may pick up the stale wheel instead of live code.
#
# ──────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Clean previous builds
rm -rf dist/ build/ src/*.egg-info

echo "Building agent-eval wheel..."
uv build --wheel

echo ""
echo "Wheel built successfully:"
ls -lh dist/*.whl
echo ""
# shellcheck SC2011: prefer `find` over `ls | xargs` to handle filenames
# with spaces / special chars (wheel names never have either, but the
# upstream PSO CI runs shellcheck and rejects SC2011).
WHEEL_NAME=$(find dist -maxdepth 1 -name '*.whl' -exec basename {} \;)
echo "To install in another project:"
echo "  1. Copy dist/$WHEEL_NAME to your project (e.g., vendor/ folder)"
echo "  2. Install:  uv pip install ./vendor/$WHEEL_NAME"
