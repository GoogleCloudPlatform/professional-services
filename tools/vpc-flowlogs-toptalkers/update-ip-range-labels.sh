#!/usr/bin/env bash

set -e

DIR=$(dirname "$0")
VIRTUALENV=$(command -v virtualenv)
PYTHON3=$(command -v python3)

if [[ "" = "${VIRTUALENV}" ]]; then
  echo "virtualenv is required to install ip-range-labels." >&2
  return 1
fi

if [[ "" = "${PYTHON3}" ]]; then
  echo "python3 is required to install ip-range-labels." >&2
  return 1
fi

if [[ ! -d "${DIR}/ip-range-labels/venv" ]]; then
  virtualenv -p "${PYTHON3}" "${DIR}/ip-range-labels/venv"
fi

# shellcheck source=./ip-range-labels/venv/bin/activate disable=SC1091
source "${DIR}/ip-range-labels/venv/bin/activate"
pip install -r "${DIR}/ip-range-labels/requirements.txt"
python "${DIR}/ip-range-labels/main.py" "${DIR}/labels.yaml" > "${DIR}/ip-range-labels.yaml"
