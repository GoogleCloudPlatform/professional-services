#!/usr/bin/env python3

# Copyright 2019 Google Inc.
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
"""Test file for nlp functionality."""

import unittest
from nlp_api_function import main
from google.cloud import language


class TestNLPAPIFunction(unittest.TestCase):
    """Tests the logic in nlp_api_function module."""

    def test_format_api_result(self):
        """Test for get_api_result"""
        response = type('', (), {})()

        entity_list = []
        entity_1 = type('entities', (), {
            'name': "episode",
            'type': language.enums.Entity.Type.WORK_OF_ART,
            'salience': 0.586153507232666,
            'mentions': {
                'text': {
                    'content': "episode",
                    'begin_offset': 108
                },
                'type': 'COMMON',
                'sentiment': {
                    'magnitude': 0.8999999761581421,
                    'score': 0.8999999761581421
                }
            }
        })
        entity_1_sentiment = type('sentiment', (), {
            'magnitude': 0.8999999761581421,
            'score': 0.8999999761581421
        })()
        entity_2 = type('entities', (), {
            'name': "data sets",
            'type': language.enums.Entity.Type.EVENT,
            'salience': 0.41384652256965637,
            'mentions': {
                'text': {
                    'content': "data sets",
                    'begin_offset': 129
                },
                'type': 'COMMON',
                'sentiment': {
                    'magnitude': 0.10000000149011612,
                    'score': 0.10000000149011612
                }
            }
        })

        entity_2_sentiment = type('sentiment', (), {
            'magnitude': 0.10000000149011612,
            'score': 0.10000000149011612
        })()
        setattr(entity_1, 'sentiment', entity_1_sentiment)
        setattr(entity_2, 'sentiment', entity_2_sentiment)
        entity_list.append(entity_1)
        entity_list.append(entity_2)
        setattr(response, 'entities', entity_list)
        setattr(response, 'language', "en")

        text = """
             I'm pretty good. It's been a long week, but you know pretty good
             very excited about a very cool episode about public data sets.
             """
        actual_result = main.format_nlp_api_results(response, text)
        expected_result = {
            'text': """
                    I'm pretty good. It's been a long week, but you know pretty good
                    very excited about a very cool episode about public data sets.
                    """,
            'nlp_response': [
                {
                    'entity_name': 'episode',
                    'score': 0.8999999761581421,
                    'entity_type': 'WORK_OF_ART',
                    'magnitude': 0.8999999761581421,
                    'salience': 0.586153507232666},
                {
                    'entity_name': 'data sets',
                    'score': 0.10000000149011612,
                    'entity_type': 'EVENT',
                    'magnitude': 0.10000000149011612,
                    'salience': 0.41384652256965637}]
        }
        self.assertEqual(expected_result['nlp_response'],
                         actual_result['nlp_response'])



if __name__ == '__main__':
    unittest.main()
