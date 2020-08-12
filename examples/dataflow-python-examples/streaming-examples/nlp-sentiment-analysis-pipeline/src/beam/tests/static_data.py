#
# Copyright 2020 Google Inc.
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
#

import json
import random


def get_static_parse_json_data():
    """Gets static test data for unit test: test_parse_json()"""
    with open('./example_data/example_tweet_parsed.json') as f:
        json_tweet = json.load(f)
        input_tweets = [json.dumps(json_tweet).encode('utf-8')]
        expected_output = [("2020-06-14", json_tweet["Text"])]
    return (input_tweets, expected_output)


def get_static_windowing_information_data():
    """Gets static test data for unit test: test_add_windowing_information()"""
    list_of_tweets = [
        ("2020-01-31", "This is an example tweet", 502),
        ("2020-02-15", "This is also an example tweet", 900),
        ("2020-03-01", "This is yet again another example tweet", 1)
    ]

    input_tweets = []
    expected_output = []
    for t in list_of_tweets:
        date, text, multiplier = t
        input_tweets.extend([(date, text)] * multiplier)
        multiplier_index = 0
        while multiplier > 0:
            output_tuple = ("{date}+0+{m_index}".format(date=t[0], m_index=multiplier_index), text)
            expected_output.extend([output_tuple] * min(multiplier, 500))
            multiplier, multiplier_index = multiplier-500, multiplier_index+1

    return (input_tweets, expected_output)


def get_static_ew_nlp_tweets():
    """Gets static test data for unit test: test_nlp_element_wise()"""
    list_of_tweets = [
        ("2020-01-31", "Yay! I love Google Cloud! This is the BEST!"),
        ("2020-01-31", "Who saw the movie that came out this weekend?"),
        ("2020-02-05", "I really HATE peanut butter and jelly sandwiches!")
    ]

    expected_output = [
        ("2020-01-31", random.uniform(-1, 1)),
        ("2020-01-31", random.uniform(-1, 1)),
        ("2020-02-05", random.uniform(-1, 1))
    ]
    random_scores = [t[1] for t in expected_output]

    return (list_of_tweets, expected_output, random_scores)


def get_static_b_nlp_tweets():
    """Gets static test data for unit test: test_nlp_batched()"""
    list_of_tweets = [
        ("2020-01-31+1580432400+0", "Yay! I really love Google Cloud! This is the BEST!"),
        ("2020-01-31+1580432400+0", "Who saw the movie that came out this weekend?"),
        ("2020-01-31+1580432400+0", "I really HATE peanut butter and jelly sandwiches!")
    ]

    expected_output = [
        ("2020-01-31", random.uniform(-1, 1)),
        ("2020-01-31", random.uniform(-1, 1)),
        ("2020-01-31", random.uniform(-1, 1))
    ]
    random_scores = [t[1] for t in expected_output]

    return (list_of_tweets, expected_output, random_scores)


class StaticNLPClient():
    """Serves as static NLP Client simulator for unit tests

    NLP Client simulator returns the random values created in
    get_static_X_nlp_tweets(). Results are formatted similarly
    to Google Cloud NLP API's formatting. 
    """
    def __init__(self, random_scores, nlp_batching=False):
        self.random_scores = random_scores
        self.nlp_batching = nlp_batching

    class DummyBatchResponse():
        def __init__(self, random_scores):
            self.sentences = [self.Sentence(v) for v in random_scores]

        class Sentence():
            def __init__(self, random_score):
                self.sentiment = self.Score(random_score)

            class Score():
                def __init__(self, random_score):
                    self.score = random_score
    
    class DummyEWResponse():
        def __init__(self, random_score):
            self.document_sentiment = self.DocumentSentiment(random_score)

        class DocumentSentiment():
            def __init__(self, random_score):
                self.score = random_score

    def analyze_sentiment(self, document, encoding_type=None):
        if self.nlp_batching:
            return self.DummyBatchResponse(self.random_scores)
        else:
            return self.DummyEWResponse(self.random_scores.pop(0))