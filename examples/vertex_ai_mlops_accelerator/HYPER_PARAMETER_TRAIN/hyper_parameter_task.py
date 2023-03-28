#  Copyright 2023 Google LLC

#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at

#      http://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import argparse
import hypertune
import logging
import os

from interpret.glassbox import ExplainableBoostingClassifier

SEED=100

def get_args():
  '''Parses args. Must include all hyperparameters you want to tune.'''

  parser = argparse.ArgumentParser()
  parser.add_argument('--min_samples_leaf',required=True,type=int,help='Min Samples Leaf')
  parser.add_argument('--max_leaves',required=True,type=int,help='Max Leaves')
  
  args = parser.parse_args()
  return args

def download_data():
    import pandas
    # Load data from Dataset

    logging.info("2 : Downloading Training Data")
    
    # Download training data from Vertex AI DataSet
    training_dataset_url=os.environ["TRAINING_DATASET"]
    training_dataset_df=pandas.read_csv(training_dataset_url)
    
    logging.info("3 : Downloaded Training Data")

    # Data Pre-Processing
    training_dataset_df=training_dataset_df.drop(['location_source','location_destination','entity_type_graph','timestamp'], axis=1)

    # Spilt dataset 
    from sklearn.model_selection import train_test_split
    datasplit_percentage=float(os.environ["DATASET_SPLIT_PERCENTAGE"])
    train, test = train_test_split(training_dataset_df, test_size=datasplit_percentage)

    # Trinaing Data
    labels = train.pop("link_predict").tolist()
    data = train.values.tolist()

    # Test Data
    test_labels = test.pop("link_predict").tolist()
    test_data = test.values.tolist()
    return data,test_data,labels,test_labels

def train_model(data,test_data,labels,test_labels,min_samples_leaf,max_leaves):
    from sklearn.metrics import f1_score
    ebm = ExplainableBoostingClassifier(random_state=SEED,min_samples_leaf=min_samples_leaf,max_leaves=max_leaves)
    ebm.fit(data, labels)

    test_predict = ebm.predict(test_data)
    f1_score_value = f1_score(test_labels, test_predict)
    return f1_score_value
    
    

def main():
    args = get_args()
    data,test_data,labels,test_labels=download_data()
    
    f1_score=train_model(data,test_data,labels,test_labels,args.min_samples_leaf,args.max_leaves)
    
    hpt = hypertune.HyperTune()
    
    hpt.report_hyperparameter_tuning_metric(
      hyperparameter_metric_tag='accuracy',
      metric_value=f1_score)
  
if __name__ == "__main__":
    main()