Sentiment Analysis with Kubeflow Pipelines, Cloud Dataflow, and Cloud Natural Language API

Included code will build a Kubeflow Pipelines component and pipeline. The pipeline uses Cloud Dataflow to do sentiment analysis on New York Times headlines. Cloud DAtaflow uses Apache Beam (Java) to extract front page headlines from NYTimes Archive API JSON files, perform sentiment analysis on them by calling Cloud Natural Language API and then aggregates the sentiment scores and magnitudes.

# To create Sentiment Analysis docker image, go to `./sentiment-analysis` folder and run the following command replacing `PROJECT_ID` with your actual Project ID.

    bash build_image.sh PROJECT_ID

# To create Sentiment Analysis pipeline, go to `./pipeline` folder and run the following command.

    python build_sentiment_analysis.py

# Other steps that must be completed

* Enable Natural Language API
