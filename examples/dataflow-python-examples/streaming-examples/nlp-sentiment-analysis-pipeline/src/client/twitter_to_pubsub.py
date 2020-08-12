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

import argparse
import json
import logging

import tweepy as tw

from tweepy.api import API

from google.cloud import pubsub


def get_oauth(creds_file='./creds_file.json'):
    """Gets OAuth handler when given creds file.

    Store your consumer key, consumer secret, access
    token key, and access token secret in a JSON file
    named, "creds_file.json". Example creds_file.json
    can be found in README.md.

    Args:
      creds_file: Required creds file for Twitter API

    Returns:
      auth: OAuth handler to establish Stream instance
    """
    with open(creds_file, 'r+') as creds_file_handler:
        creds = json.load(creds_file_handler)

        CONSUMER_KEY = creds['CONSUMER_KEY']
        CONSUMER_SECRET = creds['CONSUMER_SECRET']
        ACCESS_TOKEN_KEY = creds['ACCESS_TOKEN_KEY']
        ACCESS_TOKEN_SECRET = creds['ACCESS_TOKEN_SECRET']

        auth = tw.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
        auth.set_access_token(ACCESS_TOKEN_KEY, ACCESS_TOKEN_SECRET)
        return auth


def parse_tweet(json_tweet):
    """Parses tweet for relevant information.

    Dataflow pipeline only requries ID, Timestamp, and Tweet.
    Tweet text without tweet_mode set to 'extended' returns
    abbreviated tweets. Since it is enabled, we are retrieving
    full tweets. Tweets that contain double quotes (") will be
    replaced with single quotes (') to ensure JSON safety.

    Args:
      json_tweet: Full JSON response from Stream

    Returns:
      Cleaned string sent to Pub/Sub
    """
    stripped_tweet = {
        'ID': json_tweet['id'],
        'Timestamp': json_tweet['timestamp_ms']
    }

    if "extended_tweet" in json_tweet:
        raw_tweet = json_tweet['extended_tweet']['full_text']
    else:
        raw_tweet = json_tweet['text']
    cleaned_tweet = raw_tweet.replace('"', "'")
    stripped_tweet['Text'] = cleaned_tweet

    return json.dumps(stripped_tweet).encode('utf-8')


class PubSubClient:
    """PubSub client to publish tweets/messages.

    The PubSub topic should be created prior to running
    the script. If the topic does not exist, an error
    may be thrown.

    Attributes:
      publisher: PubSub client from google.cloud.pubsub
      topic: PubSub topic for messages to be sent to
    """
    def __init__(self, publisher_client, topic_id):
        self.publisher = publisher_client
        self.topic = "projects/{project_id}/topics/{topic_id}".format(project_id=args.project_id, topic_id=topic_id)

        self.publisher.get_topic(self.topic)
        logging.debug("Topic '{topic_id}' is valid".format(topic_id=topic_id))

    def publish_message(self, json_tweet):
        logging.info("Sending tweet '{tweet_id}'".format(tweet_id=json_tweet['id']))
        self.publisher.publish(self.topic, parse_tweet(json_tweet))


class TweetListener(tw.StreamListener):
    """StreamListener instance to handle Stream messages.

    Tweepy's StreamLiner instance is used to create a
    Stream object. The Stream object then establishes a
    streaming session and routes tweets to the StreamListener
    instance. For mroe information, visit:
      https://docs.tweepy.org/en/latest/streaming_how_to.html

    For more information on possible error codes, visit:
      https://developer.twitter.com/en/docs/basics/response-codes

    Attributes:
      api: API instance for Twitter Stream
      pubsub: PubSub client to publish messages
    """
    def __init__(self, pub_sub_client, api=None):
        self.api = api or API()
        self.pubsub = pub_sub_client

    def on_status(self, data):
        if not hasattr(data, 'retweeted_status') and data._json['lang'] in ["en"]:
            self.pubsub.publish_message(data._json)
        else:
            logging.debug("Undesirable tweet")
            pass

    def on_error(self, status_code):
        common_error_codes = {
            401: "Authorization error.",
            420: "Rate limit exceeded.",
            500: "Twitter server down.",
            502: "Twitter bad gateway.",
            503: "Twitter server overloaded.",
        }

        if status_code in common_error_codes:
            logging.warning(common_error_codes[status_code])
        else:
            logging.warning("Error Code: {status_code}".format(status_code=status_code))

        return False


if __name__ == "__main__":
    logging.basicConfig(format="%(levelname)s: %(message)s", level=logging.INFO)

    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--project_id',
        dest='project_id',
        required=True,
        help='Google Cloud project ID'
    )

    parser.add_argument(
        '--topic_id',
        dest='topic_id',
        required=True,
        help='PubSub topic'
    )

    parser.add_argument(
        '--filter_level',
        dest='filter_level',
        default='low',
        required=False,
        help='Filtering relevant tweets'
    )

    parser.add_argument(
        '--phrases',
        dest='list_of_phrases',
        nargs='+',
        required=True,
        help='Phrases to track'
    )

    args = parser.parse_args()
    logging.info("Tracking {list_of_phrases}".format(list_of_phrases=args.list_of_phrases))

    auth = get_oauth()
    stream_listener = TweetListener(PubSubClient(pubsub.PublisherClient(), args.topic_id))
    stream = tw.Stream(auth, stream_listener, tweet_mode='extended')
    stream.filter(stall_warnings=True, filter_level=args.filter_level, track=args.list_of_phrases)
