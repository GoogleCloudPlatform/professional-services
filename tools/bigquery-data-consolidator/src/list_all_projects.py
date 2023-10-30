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

# List all projects, where we have access, using a Service account!

# import libraries.
from googleapiclient.discovery import build
import google.auth
import re  
#from subprocess import call

def list_projects(creds_file, org_id):
    """
    Lists all projects in an organization.
    Requires the Organization ID as the parameter.
    """
    # call('gcloud projects list')

    # loading credentials from the SA Key file. 
    credentials, _ = google.auth.load_credentials_from_file(creds_file)

    # calling V1 API for all details of resources other than Folders
    rm_v1_client = build('cloudresourcemanager', 'v1', credentials=credentials, cache_discovery=False) 

    # calling V2 specifically to get a list of Folders. 
    rm_v2_client = build('cloudresourcemanager', 'v2', credentials=credentials, cache_discovery=False) 

    # setting the Organization ID 
    ORGANIZATION_ID = org_id

    # creating empty list for final list of projects
    final_list_of_projects = []

    # List all the projects under the organization without/outside folders
    filter='parent.type="organization" AND parent.id="{}"'.format(ORGANIZATION_ID)
    projects_under_org = rm_v1_client.projects().list(filter=filter).execute()

    # List project IDs for these projects
    all_projects = [p['projectId'] for p in projects_under_org['projects']]

    # Create list of all folders under the organization
    parent="organizations/"+ORGANIZATION_ID
    folders_under_org = rm_v2_client.folders().list(parent=parent).execute()

    # Creating regular expression matcher
    matcher = re.compile('sys-[0-9]')

    # Are there are actually folders under the org? 
    # if not we can return the list of projects now. 
    if not folders_under_org:
        # filter the projects starting with sys-<long-number>. 
        # these seems to be programmatically created hence can be ignored. 
        final_list_of_projects = [ project for project in all_projects if not matcher.match(project) ]
        return (final_list_of_projects)

    # take a list of Folder IDs
    # so that we can go through each of them,
    # check for sub folders or projects and 
    # continue recursively until all the projects are listed. 
    folder_ids = [f['name'].split('/')[1] for f in folders_under_org['folders']]

    # This is where the recursion starts 
    while folder_ids:

        # Get the last folder of the list
        # we pop() since we need to stop once all the folders are checked. 
        current_id = folder_ids.pop()
            
        # Get list of sub-folders and add them to list of folders
        subfolders = rm_v2_client.folders().list(parent="folders/"+current_id).execute()
            
        # If there are subfolders: add them to the list of folders too! 
        if subfolders:
            folder_ids.extend([f['name'].split('/')[1] for f in subfolders['folders']])
            
        # get the projects or folders under this folder
        filter='parent.type="folder" AND parent.id="{}"'.format(current_id)
        projects_under_folder = rm_v1_client.projects().list(filter=filter).execute()
            
        # add list of projects to the final list before return
        if projects_under_folder:
            all_projects.extend([p['projectId'] for p in projects_under_folder['projects']])

    # Lastly, we filter the projects starting with sys-<long-number>. 
    # these seems to be programmatically created hence can be ignored. 
    final_list_of_projects = [ project for project in all_projects if not matcher.match(project) ]
    
    # Finally, return all the projects
    return (final_list_of_projects)

# End of Program.
