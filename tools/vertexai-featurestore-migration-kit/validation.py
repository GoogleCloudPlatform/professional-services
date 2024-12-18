# -*- coding: utf-8 -*-
# Copyright 2024 Google LLC
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
import argparse
import pandas as pd
from google.cloud import aiplatform_v1


def list_legacy_feature_stores(legacy_client, project_id: str, region: str):
    request = aiplatform_v1.ListFeaturestoresRequest(
        parent=f"projects/{project_id}/locations/{region}"
        )
    response = legacy_client.list_featurestores(request=request)
    legacy_feature_store_list=[]
    for feature_store in response.featurestores:
        legacy_feature_store_list.append(feature_store.name)
    while response.next_page_token:
        request.page_token = response.next_page_token
        response = legacy_client.list_featurestores(request=request)
        for feature_store in response.featurestores:
            legacy_feature_store_list.append(feature_store.name)


    return legacy_feature_store_list

def list_legacy_entities(legacy_client, legacy_feature_store_uri: str):

    request = aiplatform_v1.ListEntityTypesRequest(
        parent=legacy_feature_store_uri
    )
    legacy_entities = []
    response = legacy_client.list_entity_types(request=request)
    for entity_type in response.entity_types:
        legacy_entities.append(entity_type.name)
    while response.next_page_token:
        request.page_token = response.next_page_token
        response = legacy_client.list_entity_types(request=request)
        for entity_type in response.entity_types:
            legacy_entities.append(entity_type.name)
    return legacy_entities
        
def list_legacy_features(legacy_client, legacy_entity_uri: str):
    request = aiplatform_v1.ListFeaturesRequest(
        parent=legacy_entity_uri
    )
    legacy_features=[]
    response = legacy_client.list_features(request=request)
    for feature in response.features:
        legacy_features.append(feature.name)
    while response.next_page_token:
        request.page_token = response.next_page_token
        response = legacy_client.list_features(request=request)
        for feature in response.features:
            legacy_features.append(feature.name)
    return legacy_features




def list_feature_groups(client, project_id: str, region: str):
    request = aiplatform_v1.ListFeatureGroupsRequest(
        parent=f"projects/{project_id}/locations/{region}"
    )
    feature_group_list=[]
    response = client.list_feature_groups(request=request)
    for feature_group in response.feature_groups:
        feature_group_list.append(feature_group.name)
        
    while response.next_page_token:
        request.page_token = response.next_page_token
        response = client.list_feature_groups(request=request)
        for feature_group in response.feature_groups:
            feature_group_list.append(feature_group.name)
    return feature_group_list

def list_features(client, project_id: str, region: str, feature_group_name: str):

    request = aiplatform_v1.ListFeaturesRequest(
        parent=f"projects/{project_id}/locations/{region}/featureGroups/{feature_group_name}"
    )
    features_list=[]
    response = client.list_features(request=request)
    for feature in response.features:
        features_list.append(feature.name)
    while response.next_page_token:
        request.page_token = response.next_page_token
        response = client.list_features(request=request)
        for feature in response.features:
            features_list.append(feature.name)
    return features_list


def list_feature_online_stores(admin_client, project_id: str, region: str):

    request = aiplatform_v1.ListFeatureOnlineStoresRequest(
        parent=f"projects/{project_id}/locations/{region}"
    )
    feature_online_stores_list=[]
    response = admin_client.list_feature_online_stores(request=request)
    for online_store in response.feature_online_stores:
        feature_online_stores_list.append(online_store.name)
    while response.next_page_token:
        request.page_token = response.next_page_token
        response = admin_client.list_feature_online_stores(request=request)
        for online_store in response.feature_online_stores:
            feature_online_stores_list.append(online_store.name)
    return feature_online_stores_list
    
def list_legacy_online_stores(client,project_id: str, region: str):


    list_feature_stores_request = aiplatform_v1.ListFeaturestoresRequest(
        parent=f"projects/{project_id}/locations/{region}")

    list_feature_store_response = client.list_featurestores(list_feature_stores_request)

    legacy_online_stores=[]

    for feature_store in list_feature_store_response:
            
        try:
            if feature_store.online_serving_config.fixed_node_count > 0:
                legacy_online_stores.append(feature_store.name)
            elif feature_store.online_serving_config.scaling:
                legacy_online_stores.append(feature_store.name)
                    
        except Exception as e:
                print(e)
            
    return legacy_online_stores

def create_online_stores_sheet(legacy_client, online_store_admin_client, project_id: str, region: str, spreadsheet_file_path: str):
    
    feature_online_store_list = list_feature_online_stores(online_store_admin_client, project_id=project_id, region=region)
    legacy_online_stores = list_legacy_online_stores(legacy_client, project_id=project_id, region=region)


    # Find the longer list
    max_length = max(len(feature_online_store_list), len(legacy_online_stores))

    # Pad the shorter list with None
    feature_online_store_list += [None] * (max_length - len(feature_online_store_list))
    legacy_online_stores += [None] * (max_length - len(legacy_online_stores))

    # Create the DataFrame
    df = pd.DataFrame({'FS 2 Online Stores': feature_online_store_list, 'Legacy Online Stores': legacy_online_stores})

    try:
        with pd.ExcelWriter(spreadsheet_file_path, engine='openpyxl', mode='a') as writer:
            df.to_excel(writer, sheet_name='Online Stores Comparison', index=False)
    except FileNotFoundError:
        # Handle the FileNotFoundError exception
        print(f"Error: The specified spreadsheet file path '{spreadsheet_file_path}' does not exist.")
    except PermissionError:
        # Handle the PermissionError exception
        print(f"Error: You do not have permission to write to the specified spreadsheet file path '{spreadsheet_file_path}'.")
    except Exception as e:
        # Handle other potential exceptions
        print(f"Error: An unexpected error occurred while writing to the spreadsheet: {e}")

def create_new_fs_resources_sheet(client, project_id: str, region: str, spreadsheet_file_path: str):
    feature_group_list = list_feature_groups(client, project_id=project_id, region=region)
    fs_resources_dict = {}
    for feature_group in feature_group_list:
        features_list = list_features(client, project_id=project_id, region=region, feature_group_name=feature_group.split('/')[-1])
        fs_resources_dict[feature_group] = features_list
    

    # Create a list of tuples from the dictionary
    rows = [(feature_group, feature) for feature_group, features in fs_resources_dict.items() for feature in features]

    # Create the DataFrame
    df = pd.DataFrame(rows, columns=['Feature Groups', 'Features'])
    try:
        with pd.ExcelWriter(spreadsheet_file_path, engine='openpyxl', mode='a') as writer:
            df.to_excel(writer, sheet_name='Feature Groups', index=False)
    except FileNotFoundError:
        # Handle the FileNotFoundError exception
        print(f"Error: The specified spreadsheet file path '{spreadsheet_file_path}' does not exist.")
    except PermissionError:
        # Handle the PermissionError exception
        print(f"Error: You do not have permission to write to the specified spreadsheet file path '{spreadsheet_file_path}'.")
    except Exception as e:
        # Handle other potential exceptions
        print(f"Error: An unexpected error occurred while writing to the spreadsheet: {e}")



def create_legacy_resources_sheet(legacy_client,project_id: str, region: str, spreadsheet_file_path: str):

    
    legacy_resources = []
    legacy_fs_list = list_legacy_feature_stores(legacy_client, project_id=project_id, region=region)
    for fs_uri in legacy_fs_list:

        legacy_feature_store_details = {}
        legacy_feature_store_details['feature_store_uri'] = fs_uri
        legacy_entities_response = list_legacy_entities(legacy_client, legacy_feature_store_uri=fs_uri)
        legacy_feature_store_details['entities'] = []
        
        for entity_uri in legacy_entities_response:
            legacy_entity_details = {}
            legacy_entity_details['entity_uri'] = entity_uri
            legacy_entity_details['features'] = list_legacy_features(legacy_client=legacy_client, legacy_entity_uri=entity_uri)
            legacy_feature_store_details['entities'].append(legacy_entity_details.copy())
        
        legacy_resources.append(legacy_feature_store_details)



    # Flatten the list of dictionaries
    flattened_data = []
    for item in legacy_resources:
        for entity in item['entities']:
            for feature in entity['features']:
                flattened_data.append({
                    'feature_store_uri': item['feature_store_uri'],
                    'entity_uri': entity['entity_uri'],
                    'feature_uri': feature
                })
    
    # Create the DataFrame
    df = pd.DataFrame(flattened_data)

    # Write DataFrame to the same Excel file with different tabs
    try:
        with pd.ExcelWriter(spreadsheet_file_path, engine='openpyxl', mode='w') as writer:
            df.to_excel(writer, sheet_name='Legacy Feature Store', index=False)
    except FileNotFoundError:
        # Handle the FileNotFoundError exception
        print(f"Error: The specified spreadsheet file path '{spreadsheet_file_path}' does not exist.")
    except PermissionError:
        # Handle the PermissionError exception
        print(f"Error: You do not have permission to write to the specified spreadsheet file path '{spreadsheet_file_path}'.")
    except Exception as e:
        # Handle other potential exceptions
        print(f"Error: An unexpected error occurred while writing to the spreadsheet: {e}")


def main():


    parser = argparse.ArgumentParser(description='Generate a spreadsheet with legacy and new Featurestore resources.')
    parser.add_argument('--project_id', required=True, help='Your Google Cloud Project ID')
    parser.add_argument('--region', required=True, help='Your Google Cloud Region')
    parser.add_argument('--spreadsheet_file_path', required=True, help='Path to the output spreadsheet file')
    args = parser.parse_args()

    project_id = args.project_id
    region = args.region
    spreadsheet_file_path = args.spreadsheet_file_path


    legacy_client = aiplatform_v1.FeaturestoreServiceClient(
    client_options={"api_endpoint": f"{region}-aiplatform.googleapis.com"}
    )

    registry_service_client = aiplatform_v1.FeatureRegistryServiceClient(
                client_options={"api_endpoint": f"{region}-aiplatform.googleapis.com"}
            )
    online_store_admin_client  = aiplatform_v1.FeatureOnlineStoreAdminServiceClient(
        client_options={"api_endpoint": f"{region}-aiplatform.googleapis.com"}
    )
    create_legacy_resources_sheet(legacy_client=legacy_client, project_id=project_id, region=region, spreadsheet_file_path=spreadsheet_file_path)
    create_new_fs_resources_sheet(registry_service_client,project_id,region,spreadsheet_file_path)
    create_online_stores_sheet(legacy_client, online_store_admin_client,project_id,region,spreadsheet_file_path)


if __name__ == "__main__":
    main()



