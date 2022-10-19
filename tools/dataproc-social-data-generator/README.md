# gcp-dataproc-social-data-generator
----

## Table Of Contents

1. [About](#about)
2. [Use Case](#use-case)
3. [Guide](#guide)
4. [Sample Output](#sample-output)


----

## about

Use [Dataproc Custom Images](https://cloud.google.com/dataproc/docs/guides/dataproc-images) to pre-install software and python libraries to be utilized by [Cloud Dataproc](https://cloud.google.com/dataproc). When used in conjunction with [Dataproc Workflow Templates](https://cloud.google.com/dataproc/docs/concepts/workflows/overview), you can automate the entire process of Dataproc ephemeral cluster creation and pyspark job submit.

This repository contains code that allows you to create a custom image and instantiate a dataproc workflow based on that image, all in one script.  With Custom Images and Initialization Actions, you can properly build your dataproc cluster machines to fit your workload's needs. With Dataproc Workflow Templates, you can automate the creation of an ephemeral cluster that spins up, executes a job, and deletes.  This provides cost-savings vs. a static long-running cluster. 

----

## use-case

Create social data files of a specified size and upload to Google Cloud Storage.  

**The use-case of this repository is purely for learning purposes.** 

The newly created Dataproc Custom Image will contain software required for a python script to execute successfully. The Dataproc Workflow Template creates an ephemeral cluster that has initialization actions script that will download a large file containing an archive of reddit comments. Finally, once the large archive file is downloaded, the pyspark job is submitted to the cluster and processes the large file, uploading files to a specified [Google Cloud Storage](https://cloud.google.com/storage) location.

Things you'll learn about:

- Dataproc Ephemeral Clusters
- Dataproc Custom Images
- Dataproc Initialization Actions
- Dataproc Workflow Templates
- Submitting Python Scripts to a Dataproc cluster (as pyspark job)

----

## guide


To get started, run setup.sh with environment variables.

```bash
./scripts/setup.sh <project-id> <project-number> <region>
```


----

## sample-output

The processed files in Google Cloud Storage will contain analyzed/processed comments such as this:

```json
{
    "comment_id": "iaq4php", 
    "subreddit": "FreeKarma4U", 
    "author": "Sankalish", 
    "comment_text": "thanks realistic_ebb8558, i returned the vote.", 
    "total_words": 6, 
    "reading_ease_score": 48.47, 
    "reading_ease": "difficult", 
    "reading_grade_level": "7th and 8th grade", 
    "sentiment_score": 0.2, 
    "censored": 0, 
    "positive": 0, 
    "neutral": 1, 
    "negative": 0, 
    "subjectivity_score": 0.2, 
    "subjective": 0, 
    "url": "https://reddit.com/r/FreeKarma4U/comments/v22vpv/please_upvote_my_comment_below/iaq4php/", 
    "comment_date": "2022-06-01 00:00:03",
    "comment_timestamp": "2022/06/01 00:00:03", 
    "comment_hour": 0, 
    "comment_year": 2022, 
    "comment_month": 6, 
    "comment_day": 1
}
```
