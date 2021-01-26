#!/usr/bin/env python
# Copyright 2021 Google Inc.
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
This file is used to maintain mapping of different node groups.
"""

FIND = {
    # 'n1-standard-1': 'n1-standard-4',
    'custom-10-98304-ext': 'n1-highmem-16',
    'custom-12-102400-ext': 'n1-highmem-16',
    'custom-12-98304-ext': 'n1-highmem-16',
    'custom-14-102400-ext': 'n1-highmem-16',
    'custom-14-104448-ext': 'n1-highmem-16',
    'custom-14-105472-ext': 'n1-highmem-16',
    'custom-14-317440-ext': 'm1-megamem-48',
    'custom-16-193536-ext': 'n1-highmem-32',
    'custom-16-196608-ext': 'n1-highmem-32',
    'custom-2-22528-ext': 'n1-highmem-4',
    'custom-2-24576-ext': 'n1-highmem-4',
    'custom-2-26624-ext': 'n1-highmem-4',
    'custom-2-39936-ext': 'n1-highmem-8',
    'custom-2-48128-ext': 'n1-highmem-8',
    'custom-2-49152-ext': 'n1-highmem-8',
    'custom-2-51200-ext': 'n1-highmem-8',
    'custom-20-303104-ext': 'm1-megamem-48',
    'custom-20-409600-ext': 'm1-megamem-48',
    'custom-20-524288-ext': 'm1-megamem-48',
    'custom-24-194560-ext': 'n1-highmem-32',
    'custom-24-481280-ext': 'm1-megamem-48',
    'custom-26-202752-ext': 'n1-highmem-32',
    'custom-26-206848-ext': 'n1-highmem-32',
    'custom-26-211968-ext': 'n1-highmem-32',
    'custom-30-327680-ext': 'm1-megamem-48',
    'custom-30-634880-ext': 'm1-megamem-48',
    'custom-32-409600-ext': 'm1-megamem-48',
    'custom-32-425984-ext': 'm1-megamem-48',
    'custom-32-471040-ext': 'm1-megamem-48',
    'custom-32-491520-ext': 'm1-megamem-48',
    'custom-36-384000-ext': 'm1-megamem-48',
    'custom-36-516096-ext': 'm1-megamem-48',
    'custom-36-524288-ext': 'm1-megamem-48',
    'custom-4-105472-ext': 'n1-highmem-16',
    'custom-4-44032-ext': 'n1-highmem-8',
    'custom-4-45056-ext': 'n1-highmem-8',
    'custom-4-47104-ext': 'n1-highmem-8',
    'custom-4-48128-ext': 'n1-highmem-8',
    'custom-4-49152-ext': 'n1-highmem-8',
    'custom-4-50176-ext': 'n1-highmem-8',
    'custom-4-51200-ext': 'n1-highmem-8',
    'custom-4-52224-ext': 'n1-highmem-8',
    'custom-4-53248-ext': 'n1-highmem-8',
    'custom-4-87040-ext': 'n1-highmem-16',
    'custom-40-350208-ext': 'm1-megamem-48',
    'custom-40-358400-ext': 'm1-megamem-48',
    'custom-40-401408-ext': 'm1-megamem-48',
    'custom-40-409600-ext': 'm1-megamem-48',
    'custom-40-417792-ext': 'm1-megamem-48',
    'custom-40-465920-ext': 'm1-megamem-48',
    'custom-40-471040-ext': 'm1-megamem-48',
    'custom-40-524288-ext': 'm1-megamem-48',
    'custom-40-638976-ext': 'm1-megamem-48',
    'custom-48-491520-ext': 'm1-megamem-48',
    'custom-48-516096-ext': 'm1-megamem-48',
    'custom-48-614400-ext': 'm1-megamem-48',
    'custom-48-638976-ext': 'm1-megamem-48',
    'custom-6-153600-ext': 'n1-highmem-32',
    'custom-6-49152-ext': 'n1-highmem-8',
    'custom-6-98304-ext': 'n1-highmem-16',
    'custom-60-638976-ext': 'n1-highmem-96',
    'custom-78-628736-ext': 'n1-highmem-96',
    'custom-78-630784-ext': 'n1-highmem-96',
    'custom-8-102400-ext': 'n1-highmem-16',
    'custom-8-90112-ext': 'n1-highmem-16',
    'custom-8-98304-ext': 'n1-highmem-16',
    'custom-80-638976-ext': 'n1-highmem-96',
    'custom-84-634880-ext': 'n1-highmem-96'
}
