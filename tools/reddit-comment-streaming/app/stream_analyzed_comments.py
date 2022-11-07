# encoding: utf-8

#    Copyright 2022 Google LLC
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
"""
Script that uses reddit api to mine realtime comments.  Uses TextBlob for
comment analysis. Pushes comments to a Google Cloud Platform Pubsub Topic.
"""

import re
import sys
import json
from time import sleep
from datetime import datetime, timezone

import praw
import textstat as ts
from textblob import TextBlob
from better_profanity import profanity

from google.cloud import pubsub_v1


def push_payload(pubsub_client, topic_path, payload):
    """
    Push data to a Google Cloud Pubsub Topic
    """
    data = json.dumps(payload).encode("utf-8")
    pubsub_client.publish(topic_path, data=data)
    print("Pushed message to topic.")


def utc_to_local(utc_dt):
    """
    convert a utc datetime to local datetime
    """
    return utc_dt.replace(tzinfo=timezone.utc).astimezone(tz=None)


def remove_emoji(comment):
    """
    Remove emojis from a comment
    """
    emoji_pattern = re.compile(
        "["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002702-\U00002f7B0"
        u"\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE)

    emoji_removed_comment = emoji_pattern.sub(r"", comment)

    return emoji_removed_comment


def get_comment_sentiment(comment):
    """
    Return comment sentiment via TextBlob
    """
    pattern_analysis = TextBlob(comment)
    return pattern_analysis.sentiment


def stream(subreddits):
    """
    Start the comment stream and analyze incoming comments.
    """
    project_id = "<insert-project-id-here>"
    pubsub_topic = "<insert-topic-id-here>"

    # Configure the batch to publish as soon as there are 10 messages
    # or 1 KiB of data, or 1 second has passed.

    batch_settings = pubsub_v1.types.BatchSettings(
        max_messages=10,  # default 100
        max_bytes=1024,  # default 1 MiB
        max_latency=1,  # default 10 ms
    )
    pubsub_client = pubsub_v1.PublisherClient(batch_settings)
    topic_path = pubsub_client.topic_path(project_id, pubsub_topic)

    # prevent collect bot comments
    bot_list = [
        "AutoModerator", "keepthetips", "MAGIC_EYE_BOT", "Funny_Sentinel",
        "Funny-Mod", "Showerthoughts_Mod", "autotldr", "art_moderator_bot",
        "ApiContraption", "WSBVoteBot", "FittitBot", "Photoshopbattlesbot",
        "dataisbeautiful-bot", "timestamp_bot", "remindditbot", "converter-bot",
        "lntipbot"
    ]

    while True:

        try:
            praw_client = praw.Reddit("bot1")
            num_cmts_collected = 0
            cmts_processed = 0

            cmt_stream = praw_client.subreddit(subreddits)

            for cmt in cmt_stream.stream.comments():

                # throttle to avoid 429 error
                sleep(0.5)

                # empty check
                if cmt:
                    cmtbody = cmt.body
                    author = cmt.author

                    if author not in bot_list:

                        if len(cmtbody) > 0 and len(cmtbody) < 5000:

                            #censor check
                            if profanity.contains_profanity(str(cmtbody)):
                                is_censored = 1
                            else:
                                is_censored = 0

                            # remove emojis
                            cleaned_cmt = remove_emoji(str(cmtbody))

                            date_fmt = "%Y-%m-%d %H:%M:%S"
                            # comment date
                            cmt_date = str(
                                datetime.utcfromtimestamp(
                                    cmt.created_utc).strftime(date_fmt))

                            # compartmentalize and localize date for
                            # easier searching
                            local_dt = utc_to_local(
                                datetime.strptime(cmt_date, date_fmt))
                            cmt_timestamp = local_dt.strftime(date_fmt)

                            # comment sentiment and subjectivity
                            sentiment = get_comment_sentiment(cleaned_cmt)
                            pattern_polarity = round(sentiment.polarity, 4)
                            pattern_subjectivity = round(
                                sentiment.subjectivity, 4)

                            is_positive = 0
                            is_neutral = 0
                            is_negative = 0

                            if pattern_polarity > 0.3:
                                is_positive = 1
                            elif 0.3 >= pattern_polarity >= -0.3:
                                is_neutral = 1
                            else:
                                is_negative = 1

                            is_subjective = 0
                            if pattern_subjectivity > 0.7:
                                is_subjective = 1

                            # Readability statistics
                            cmt_read_score = ts.flesch_reading_ease(cleaned_cmt)
                            cmt_read_ease = ""
                            if cmt_read_score >= 80:
                                cmt_read_ease = "easy"
                            elif 80 > cmt_read_score > 50:
                                cmt_read_ease = "standard"
                            else:
                                cmt_read_ease = "difficult"

                            cmt_reading_grade_level = ts.text_standard(
                                cleaned_cmt, float_output=False)

                            # censor and lower
                            censored_cmt = profanity.censor(cleaned_cmt).lower()

                            cmtjson = {
                                "comment_id": str(cmt),
                                "subreddit": str(cmt.subreddit),
                                "author": str(cmt.author),
                                "comment_text": censored_cmt,
                                "distinguished": cmt.distinguished,
                                "submitter": cmt.is_submitter,
                                "total_words": len(cleaned_cmt.split()),
                                "reading_ease_score": cmt_read_score,
                                "reading_ease": cmt_read_ease,
                                "reading_grade_level": cmt_reading_grade_level,
                                "sentiment_score": pattern_polarity,
                                "censored": is_censored,
                                "positive": is_positive,
                                "neutral": is_neutral,
                                "negative": is_negative,
                                "subjectivity_score": pattern_subjectivity,
                                "subjective": is_subjective,
                                "url": "https://reddit.com" + cmt.permalink,
                                "comment_date": cmt_date,
                                "comment_timestamp": cmt_timestamp,
                                "comment_hour": local_dt.hour,
                                "comment_year": local_dt.year,
                                "comment_month": local_dt.month,
                                "comment_day": local_dt.day
                            }

                            cmts_processed = cmts_processed + 1
                            num_cmts_collected = num_cmts_collected + 1
                            print(num_cmts_collected)
                            push_payload(pubsub_client, topic_path, cmtjson)

        except Exception as err:
            error_msg = " An error has occured in the comment stream:" + str(
                err)
            print(error_msg)

            # If too many requests error, we need to wait longer for throttle
            # to end. otherwise start back up right away.
            error_code = "".join(filter(str.isdigit, str(err)))
            http_response = int(error_code)
            if http_response == 429:
                error_msg = error_msg + " - Too many requests. Waiting 2 hrs."
                sleep(7200)
            else:
                error_msg = error_msg + " - Restarting stream now."


if len(sys.argv) >= 2:
    # build list of subreddits
    subreddit_list = sys.argv[1]
    for subreddit in sys.argv[2:]:
        subreddit_list = subreddit_list + "+" + subreddit
    # start stream
    stream(subreddit_list)
else:
    print("please enter subreddit.")
