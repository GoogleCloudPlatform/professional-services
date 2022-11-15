# reddit-comment-streaming

----

## Table Of Contents

1. [Use Case](#Use-case)
2. [Setup](#Setup)
3. [Usage](#Usage)
4. [Sample](#Sample)

----

## Use-case

Use PRAW, TextBlob, and Google Python API to collect and analyze reddit comments.

----

## Setup


#### 1. Install requirements.txt

#### 2. Update praw.ini

```
cd app/ || exit

python3 -m pip install -r requirements.txt

chmod 777 stream_analyzed_comments.py
chmod 777 praw.ini

echo "Please enter reddit client id:"
read -r REDDIT_CLIENT_ID
echo "Please enter reddit client secret:"
read -s -r REDDIT_CLIENT_SECRET
echo "Please enter reddit user:"
read -r REDDIT_USER
echo "Please enter reddit password:"
read -s -r REDDIT_PASSWORD

sed -i "s/<insert-client-id-here>/$REDDIT_CLIENT_ID/g" praw.ini
sed -i "s/<insert-client-secret-here>/$REDDIT_CLIENT_SECRET/g" praw.ini
sed -i "s/<insert-username-here>/$REDDIT_USER/g" praw.ini
sed -i "s/<insert-password-here>/$REDDIT_PASSWORD/g" praw.ini
```

#### 3. Update stream_analyzed_comments.py

```
echo "Please enter Google Cloud Project:"
read -r PROJECT_ID
echo "Please enter Google Cloud Pub/Sub Topic:"
read -r PUBSUB_TOPIC

sed -i -r "s/<insert-project-id-here>/$PROJECT_ID/g" stream_analyzed_comments.py
sed -i -r "s/<insert-topic-id-here>/$PUBSUB_TOPIC/g" stream_analyzed_comments.py
```

## Usage

Provide a space-delimited list of subreddits to stream and analyze.

example:

```
python3 stream_analyzed_comments.py funny askreddit todayilearned science worldnews pics iama gaming videos movies aww blog music news explainlikeimfive askscience books television mildlyinteresting lifeprotips space showerthoughts diy jokes sports gadgets nottheonion internetisbeautiful photoshopbattles food history futurology documentaries dataisbeautiful listentothis upliftingnews personalfinance getmotivated oldschool cool philosophy art writingprompts fitness technology bestof adviceanimals politics atheism europe &>> logs.txt
```

----

## Sample

### Example of a Collected+Analyzed reddit Comment:

```json
{
    "comment_id": "fx3wgci",
    "subreddit": "Fitness",
    "author": "silverbird666",
    "comment_text": "well, i dont exactly count my calories, but i run on a competitive base and do kickboxing, that stuff burns quite much calories. i just stick to my established diet, and supplement with protein bars and shakes whenever i fail to hit my daily intake of protein. works for me.",
    "distinguished": null,
    "submitter": false,
    "total_words": 50,
    "reading_ease_score": 71.44,
    "reading_ease": "standard",
    "reading_grade_level": "7th and 8th grade",
    "sentiment_score": -0.17,
    "censored": 0,
    "positive": 0,
    "neutral": 1,
    "negative": 0,
    "subjectivity_score": 0.35,
    "subjective": 0,
    "url": "https://reddit.com/r/Fitness/comments/hlk84h/victory_sunday/fx3wgci/",
    "comment_date": "2020-07-06 15:41:15",
    "comment_timestamp": "2020/07/06 15:41:15",
    "comment_hour": 15,
    "comment_year": 2020,
    "comment_month": 7,
    "comment_day": 6
}
```
