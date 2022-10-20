#!/usr/bin/env python3
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
Takes a large social media data file from pushshift.io, analyzes/enhances the data
and outputs into a specified number of files.  Good for creating sample social
media files.
"""

from datetime import datetime, timezone
import json
import os
import sys
import re
import zstandard as zstd
import textstat
from textblob import TextBlob
from better_profanity import profanity
from google.cloud import storage

source_compressed_file = sys.argv[1]
destination_bucket = sys.argv[2]
file_size_bytes = sys.argv[3]

bot_list = [
    'AutoModerator', 'keepthetips', 'MAGIC_EYE_BOT', 'Funny_Sentinel',
    'Funny-Mod', 'Showerthoughts_Mod', 'autotldr', 'art_moderator_bot',
    'ApiContraption', 'WSBVoteBot', 'FittitBot', 'Photoshopbattlesbot',
    'dataisbeautiful-bot', 'timestamp_bot', 'remindditbot', 'converter-bot',
    'lntipbot'
]


def upload_blob(bucket_name, source_file_name, destination_blob_name):
    """
    Uploads a file to the bucket.
    """
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_name)

    print(f"File {source_file_name} uploaded to {destination_blob_name}.")


def remove_emoji(comment):
    """
    Remove any emojis from a comment
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

    clean_com = emoji_pattern.sub(r'', comment)

    return clean_com


def get_comment_sentiment(comment):
    """
    return sentiment of a comment
    """
    pattern_analysis = TextBlob(comment)
    return pattern_analysis.sentiment


def utc_to_local(utc_dt):
    """
    return datetime object with local timezone instead of utc
    """
    return utc_dt.replace(tzinfo=timezone.utc).astimezone(tz=None)


def modify(comment_obj):
    """
    return a formatted, analyzed, and modified comment json object
    """
    commentbody = comment_obj['body']
    author = comment_obj['author']
    if author not in bot_list:
        if len(commentbody) > 0 and len(commentbody) < 500:
            if profanity.contains_profanity(str(commentbody)):
                is_censored = 1
            else:
                is_censored = 0
            clean_com = remove_emoji(str(commentbody))
            created_utc_dt = datetime.utcfromtimestamp(
                comment_obj['created_utc'])
            com_date = str(created_utc_dt.strftime('%Y-%m-%d %H:%M:%S'))

            #compartmentalize and localize date for easier searching
            com_dt = utc_to_local(
                datetime.strptime(com_date, '%Y-%m-%d %H:%M:%S'))
            com_timestamp = com_dt.strftime('%Y/%m/%d %H:%M:%S')

            # comment sentiment and subjectivity
            sentiment = get_comment_sentiment(clean_com)
            pattern_polarity = round(sentiment.polarity, 4)
            pattern_subjectivity = round(sentiment.subjectivity, 4)

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
            com_reading_ease_score = textstat.flesch_reading_ease(clean_com)
            com_reading_ease = ''
            if com_reading_ease_score >= 80:
                com_reading_ease = 'easy'
            elif 80 > com_reading_ease_score > 50:
                com_reading_ease = 'standard'
            else:
                com_reading_ease = 'difficult'

            com_reading_grade_level = textstat.text_standard(clean_com,
                                                             float_output=False)

            # censor and lower
            censored_comment = profanity.censor(clean_com).lower()

            commentjson = {
                'comment_id': str(comment_obj['id']),
                'subreddit': str(comment_obj['subreddit']),
                'author': str(comment_obj['author']),
                'comment_text': censored_comment,
                'total_words': len(clean_com.split()),
                'reading_ease_score': com_reading_ease_score,
                'reading_ease': com_reading_ease,
                'reading_grade_level': com_reading_grade_level,
                'sentiment_score': pattern_polarity,
                'censored': is_censored,
                'positive': is_positive,
                'neutral': is_neutral,
                'negative': is_negative,
                'subjectivity_score': pattern_subjectivity,
                'subjective': is_subjective,
                'url': "https://reddit.com" + comment_obj['permalink'],
                'comment_date': com_date,
                'comment_timestamp': com_timestamp,
                'comment_hour': com_dt.hour,
                'comment_year': com_dt.year,
                'comment_month': com_dt.month,
                'comment_day': com_dt.day
            }
            return commentjson
    return None


def execute():
    """
    python code entry point

    take a source file and iterate through all the lines. read
    comments from source file, modify them, and upload as new
    files.
    """
    with open(source_compressed_file, 'rb') as source_file:
        dctx = zstd.ZstdDecompressor(max_window_size=2147483648)
        with dctx.stream_reader(source_file) as reader:
            previous_line = ""
            file_count = 0
            com_modified_count = 0
            while True:
                fname = source_compressed_file + "_" + str(file_count) + ".json"
                opened_file = open("/files" + fname, "a")
                chunk_count = 0
                while chunk_count < 1:  # chunk_count * chunk = file_size
                    chunk = reader.read(int(file_size_bytes) * 2)
                    if not chunk:
                        break
                    try:
                        string_data = chunk.decode('utf-8')
                        lines = string_data.split("\n")
                        for i, line in enumerate(lines[:-1]):
                            if i == 0:
                                line = previous_line + line
                            com_obj = json.loads(line)
                            # modify object here to fit other schema
                            formatted_com_obj = modify(com_obj)
                            com_modified_count += 1
                            if com_modified_count % 1000 == 0:
                                print("comments modified = " +
                                      str(com_modified_count))
                            final_data = json.dumps(formatted_com_obj)
                            if final_data != 'null':
                                opened_file.write(
                                    json.dumps(formatted_com_obj) + "\n")
                        previous_line = lines[-1]
                        chunk_count += 1
                    except Exception as err:
                        print(str(err))
                        print("couldn't read data. moving on...")
                        break
                opened_file.close()
                upload_blob(destination_bucket, "/files" + fname,
                            "comments" + fname)
                os.remove("/files" + fname)
                file_count += 1


# entry point
execute()
