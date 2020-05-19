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
"""Unit test file for perspective_api_function.main.py."""

import unittest
from perspective_api_function import main


class TestPerspectiveAPIFunction(unittest.TestCase):
    """Tests the logic in perspective_api_function module."""

    def test_format_api_result(self):
        """Test for get_api_result"""
        response = {
            'attributeScores': {
                'TOXICITY': {
                    'spanScores': [
                        {
                            'begin': 0,
                            'end': 1003,
                            'score': {
                                'value': 0.049772695,
                                'type': 'PROBABILITY'}}
                    ],
                    'summaryScore': {
                        'value': 0.049772695,
                        'type': 'PROBABILITY'}}},
            'languages': ['en'],
            'detectedLanguages': ['en']}
        text = {'transcript': """
                              Hi and welcome to episode number 83 of the weekly
                              Google Cloud platform podcast. I am princess Campo
                              and I'm here with my colleague Mark Mendel. Hey,
                              Mark, how are you doing? I'm doing very very very
                              well. How you doing Friends Ask? I'm pretty good. It's
                              been a long week, but you know pretty good very
                              excited about a very cool episode about public data
                              sets. Yeah, it's super cool where we talk about how
                              we host all these really large data sets for all
                              these people to play with and do fun things with
                              yeah. I've used some of them before my favorite one
                              is we have a lot of good from GitHub. You can do
                              cool things with it, but it's not the only one. So
                              we're going to be talking about a bunch of different
                              ones that you can just go and use and have fun with
                              them. And after that we have a question of the week
                              that is actually a question of the week whose answer
                              comes from someone. We interviewed in the future. So
                              at some point we'll have him on the podcast. But for
                              now, we have something that he
                              """,
                'start_time': '00:00:04',
                'end_time': '00:01:00'}

        actual_result = main.format_api_results(response, text)
        expected_result = {'text': """
                                   Hi and welcome to episode number 83 of the
                                   weekly Google Cloud platform podcast. I am
                                   princess Campo and I'm here with my colleague
                                   Mark Mendel. Hey, Mark, how are you doing? I'm
                                   doing very very very well. How you doing Friends
                                   Ask? I'm pretty good. It's been a long week, but
                                   you know pretty good very excited about a very
                                   cool episode about public data sets. Yeah, it's
                                   super cool where we talk about how we host all
                                   these really large data sets for all these
                                   people to play with and do fun things with yeah.
                                   I've used some of them before my favorite one is
                                   we have a lot of good from GitHub. You can do
                                   cool things with it, but it's not the only one.
                                   So we're going to be talking about a bunch of
                                   different ones that you can just go and use and
                                   have fun with them. And after that we have a
                                   question of the week that is actually a question
                                   of the week whose answer comes from someone. We
                                   interviewed in the future. So at some point
                                   we'll have him on the podcast. But for now, we
                                   have something that he
                                   """,
                           'start_time': '00:00:04',
                           'end_time': '00:01:00',
                           'toxicity': 0.05}
        self.assertEqual(expected_result['toxicity'], actual_result['toxicity'])
        self.assertEqual(expected_result['start_time'], actual_result['start_time'])
        self.assertEqual(expected_result['end_time'], actual_result['end_time'])


if __name__ == '__main__':
    unittest.main()
