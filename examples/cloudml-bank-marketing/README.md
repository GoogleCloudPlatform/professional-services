# CloudML Marketing (Classification) Model for Banking

The goal of this notebook is to create a classification model using CloudML as an alternative to on-premise methods. Along the way you will learn how to store data into BigQuery, fetch and explore that data, understand how to properly partition your dataset, perform feature selection, evaluate multiple models at the same time and how to explain these models using [lime](https://github.com/marcotcr/lime).

The use case for this notebook is the [UCI Bank Marketing Dataset](https://archive.ics.uci.edu/ml/datasets/bank+marketing). The data is related with direct marketing campaigns of a Portuguese banking institution an The classification goal is to predict if the client will subscribe (yes/no) a term deposit. The data is related to a direct marketing campaigns of a Portuguese banking institution and the classification goal is to predict if the client will subscribe (yes/no) to a term deposit.

## Setup

It is recommended that you run this notebook on [colaboratory](https://colab.research.google.com/). If you want to use your [jupyter notebook](https://jupyter.org/), please  install [pandas](https://pandas.pydata.org/pandas-docs/stable/install.html), [scikit-learn](https://scikit-learn.org/stable/install.html) and [Google Cloud's SDK](https://cloud.google.com/sdk/install) before using the notebook.
