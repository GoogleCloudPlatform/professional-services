# Copyright 2022 Google LLC All Rights Reserved.
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

import requests
import json
import multiprocessing as mp
import itertools
from google.cloud import bigquery
from google.cloud import storage
from google.cloud import billing_v1
from google.api_core.exceptions import ResourceExhausted
import time

def aws_ext():
    """
    The purpose of this function is to extract 
    product data off of Amazon Web Services API
    through a request.
    """

    params = {"item.directoryId": "aws-products", "item.locale": "en_US", "sort_by":"item.additionalFields.productNameLowercase","tags.id":"!aws-products%23type%23feature","size":"500"}
    #Size params are set to 500 because as of today, products total mark 262
    #A verification can be implemented on product metadata (total hits)

    r = requests.get("https://aws.amazon.com/api/dirs/items/search", params=params)

    #Storing results as a json
    result_get = r.json()

    items = []

    #Iterating through the items according to the structure
    #only grabbing what we need.
    for item in result_get["items"]:
        aux_item = {}
        aux_item["cloud_provider"] = "AWS"
        aux_item["service_category"] = item["item"]["additionalFields"]["productCategory"]
        aux_item["service_type"] = item["item"]["additionalFields"]["productCategory"]
        aux_item["product"] = item["item"]["additionalFields"]["productName"]
        items.append(aux_item)

    return items


def get_azure_pricing(limit_tuple):

    """
    This function leverages the implementation
    to handle the requests directed at the 
    Azure prices API.
    """

    #filtered_fields = ["productId", "productName", "serviceId", "serviceName", "serviceFamily"]
    filtered_fields = ["productName", "serviceName", "serviceFamily"]
    min_limit = limit_tuple[0]
    max_limit = limit_tuple[1]
    if min_limit  == 0:
        base_url = "https://prices.azure.com:443/api/retail/prices"
    else:
        base_url = "https://prices.azure.com:443/api/retail/prices?$skip={0}".format(min_limit)
    request_result = requests.get(base_url).json()
    next_url = request_result["NextPageLink"]
    items_trimmed = list(map(lambda x: {k:v for k, v in x.items() if k in filtered_fields }, request_result["Items"]))

    items = []

    #Disclaimer: at one point we will be hitting a rate limit,
    #so although we are using multi-processing it will still take
    #a couple of minutes.

    while next_url != None and int(next_url.split("=")[1]) != max_limit:
        request_result = requests.get(next_url).json()
        next_url = request_result["NextPageLink"]
        items_trimmed = list(map(lambda x: {k:v for k, v in x.items() if k in filtered_fields }, request_result["Items"]))

        for item in items_trimmed:
            aux_item = {}
            aux_item["cloud_provider"] = "Azure"
            aux_item["service_category"] = item["serviceFamily"]
            aux_item["service_type"] = item["serviceName"]
            aux_item["product"] = item["productName"]
            items.append(aux_item)

    return items


def azure_ext():

    """ 
    The purpose of this function is to extract 
    product data off of Azure API
    through a request.
    """

    BATCH_SIZE = 10000
    MAX_REQ = 500000

    a = range(0, MAX_REQ, BATCH_SIZE)
    b = range(BATCH_SIZE, MAX_REQ, BATCH_SIZE)
    arg_list_mp = list(zip(a,b))


    #Multiprocessing (because it is about 500000 skips)
    pool = mp.Pool(processes=10)
    results = pool.map(get_azure_pricing, arg_list_mp)

    results = (list(itertools.chain.from_iterable(results)))

    results_clean = []

    for item in results:
        if not any(d.get('product', None) == item['product'] for d in results_clean):
            results_clean.append(item)
    return results_clean


def google_ext():
    """
    The purpose of this function is to extract 
    product data off of Google Cloud Platform
    using billing_v1 library.
    """

    # Create a client
    client = billing_v1.CloudCatalogClient()

    # Initialize request argument(s)
    request = billing_v1.ListServicesRequest(
    )

    # Make the request
    page_result = client.list_services(request=request)
    
    results = []

    # Handle the response
    for response in page_result:
        results += list_google_skus(response.name)

    results_clean = []

    for item in results:
        if not any(d.get('product', None) == item['product'] for d in results_clean):
            results_clean.append(item)
    
    return results_clean
    

def list_google_skus(parent_value):

    """
    The purpose of this function is to
    expand further the output of the Google product SKU
    to get the columns we need for the mapping.
    """

    # Create a client
    client = billing_v1.CloudCatalogClient()

    # Initialize request argument(s)
    request = billing_v1.ListSkusRequest(
        parent=parent_value,
    )

    # Make the request
    try:
        page_result = client.list_skus(request=request)
    except ResourceExhausted:
        time.sleep(60)

        return list_google_skus(parent_value)

    items = []

    # Handle the response
    for response in page_result:
        aux_item = {}
        aux_item["cloud_provider"] = "Google"
        aux_item["service_category"] = response.category.resource_family
        aux_item["service_type"] = response.category.resource_group
        aux_item["product"] = response.category.service_display_name
        items.append(aux_item)
    
    return items


def write_to_gcs(bucket_name):
    filename = "product_mapping.json"
    bucket = storage.Client().get_bucket(bucket_name)
    blob = bucket.blob(filename)
    blob.upload_from_filename('extract.json')
    
    print(
        f"File {filename} uploaded to {bucket_name}."
    )


def write_to_bq():
    client = bigquery.Client()
    dataset_id = 'product_mapping_test'
    table_id = 'product_mapping'

    dataset_ref = client.dataset(dataset_id)
    table_ref = dataset_ref.table(table_id)
    job_config = bigquery.LoadJobConfig()
    job_config.source_format = bigquery.SourceFormat.NEWLINE_DELIMITED_JSON
    job_config.write_disposition = "WRITE_TRUNCATE"
    job_config.autodetect = True

    with open("extract.json", "r") as read_file:
        data = json.load(read_file)
    result = [json.dumps(record) for record in data]

    #Convert the file to Newline Delimited JSON
    with open('nd-processed.json', 'w') as obj:
        for i in result:
            obj.write(i+'\n')

    with open("nd-processed.json", "rb") as source_file:
        job = client.load_table_from_file(source_file, table_ref, job_config=job_config)

    job.result()  # Waits for table load to complete.

    print("Loaded {} rows into {}:{}.".format(job.output_rows, dataset_id, table_id))


def main():
    print("------ Extracting Azure.... ------")
    azure_result = azure_ext()
    print("------ Azure extraction is done! ------")

    print("------ Extracting AWS.... ------")
    aws_result = aws_ext()
    print("------ AWS extraction is done! ------")

    print("------ Extracting GCP.... ------")
    google_result = google_ext()
    print("------ GCP extraction is done! ------")

    

    #Write to a file
    file_name = "extract.json"
    output_file = open(file_name, "w")
    output_file.write(json.dumps(azure_result + aws_result + google_result))
    output_file.close()


    bucket_name = "your_bucket"
    write_to_gcs(bucket_name)
    write_to_bq()
    
main()