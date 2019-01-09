Sentiment Analysis with Kubeflow Pipelines, Cloud Dataflow, and Cloud Natural Language API

Included code will build a Kubeflow Pipelines component and pipeline. The pipeline uses Cloud Dataflow to do sentiment analysis on New York Times headlines. Cloud DAtaflow uses Apache Beam (Java) to extract front page headlines from NYTimes Archive API JSON files, perform sentiment analysis on them by calling Cloud Natural Language API and then aggregates the sentiment scores and magnitudes.

# To create Sentiment Analysis docker image, open `./sentiment-analysis/build_image.sh` and set your Project ID. Then in the command line run

    cd sentiment-analysis
    bash build_image.sh

# To create Sentiment Analysis pipeline, in the command line run

    cd pipeline
    python build_sentiment_analysis.python

# Other steps that must be completed

* Enable Natural Language API
