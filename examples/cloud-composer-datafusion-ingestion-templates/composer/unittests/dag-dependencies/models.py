#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright 2021 Google LLC All Rights Reserved.
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
""" 
Mocked class for testing
"""
import json
import logging
import os
import sys
from pathlib import Path
import importlib

# sys.path.append('/Users/nehajo/projects/datalake-templates')
print("current working directory (models.py):"+ os.getcwd())
class Variable:
    """ 
    Dummy class for testing
    """
    def __init__():
        print("init Varaible class")

    def __init__(self,
                 google_cloud_storage_conn_id='google_cloud_default',
                 delegate_to=None):
        # super(GoogleCloudStorageHook, self).__init__(google_cloud_storage_conn_id,
        #                                              delegate_to)
        print("initializing class GoogleCloudStorageHook")        
    
    def get(var_name):
        return 'dag-parameters/env_param.json'
