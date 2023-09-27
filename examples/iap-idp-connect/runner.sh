#!/bin/sh
pip3 install -r requirements.txt
pytest
python3 connect.py