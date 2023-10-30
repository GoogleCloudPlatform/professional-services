# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Python utility to list all datasets in a given project.

# import libraries.
# from google.cloud import bigquery

# function definition
def dataset_list(client):
    """
    Accepts the BigQuery Client object as the input,
    returns the list of datasets in the project. 
    """

    # create final list variable - this will be returned from the function.
    final_dataset_list = set()

    # Make an API request.
    datasets = set(client.list_datasets(timeout=10, max_results=1000))

    # check for datasets in the given project
    # when found, print and append in the output list which we will return
    if datasets:

        # optional print - ideally hidden
        # print("Datasets in project {}:".format(project))
        for dataset in datasets:

            # optional print - ideally hidden
            # print("\t{}".format(dataset.dataset_id))
            final_dataset_list.add(dataset.dataset_id)

    # optional "else" - ideally commented.
    """
    else:
        print("{} project does not contain any datasets.".format(project_id))
    """
    
    # finally, return the list of datasets.
    return (final_dataset_list)

# End of program.
