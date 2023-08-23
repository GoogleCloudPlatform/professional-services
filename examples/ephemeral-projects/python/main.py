# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import secrets
from google.cloud import resourcemanager_v3
from google.auth import compute_engine
from google.iam.v1 import iam_policy_pb2, policy_pb2
from google.cloud import service_usage_v1
from google.protobuf.json_format import MessageToDict


class EphemeralInstance:
    '''
    The EphemeralInstance class creates ephemeral gcp project instances. The class offers
    various attributes describing a gcp project as well as methods for creating and deleting projects,
    setting IAM roles on projects, and enabling default project services. 

    The class takes the following mandatory paramaters:

    organization_id - The id of the GCP organization in the format organizations/12345.
    owner_username - An arbitrary username that is used to create a random project id. The username should not contain spaces.
    owner_email - The email address of the user who will be granted administration privledges over the project. 
    credentials_object - A google cloud python credentials object used to authenticate reqeuests.

    Optional arguments:

    name - The project name (also called project number) of the gcp project to run operations against. In the format projects/12345. Needed for any operation that is not project creation.
    add_iam_bindings_json - A dict of bindings to add to the project. See the bindings.json file for example structure.
    remove_iam_bindings_json - A dict of bindings to remove from the project. See the bindings.json file for example structure.
    project_id - An override option for new project creation. Overrides the randomly generated project id in favor of a user provided id.
    service_ids - A list of google apis to enable on the project.

    '''

    # This class requires at least an organization_id, an owner_username, an owner_email and a credentials object to function.
    def __init__(self, organization_id: str, owner_username: str, owner_email: str, credentials_object: object, **kwargs: dict) -> None:
        # Init the necassary attributes for the class to function.
        self.organization_id = organization_id
        self.owner_username = owner_username
        self.owner_email = owner_email
        self.credentials_object = credentials_object
        self.kwargs = kwargs

        # Init derived attributes.
        self.owner_member = "user:" + self.owner_email
        self.policy_template = {
            "bindings": [
                {
                    "role": None,
                    "members": [
                        None,
                    ]
                },
            ],
        }

        # Create a project client.
        self.project_client = resourcemanager_v3.ProjectsClient(
            credentials=self.credentials_object)

        # Create a services client.
        self.service_client = service_usage_v1.ServiceUsageClient(
            credentials=self.credentials_object)

        # Check if a project name was provided and get information on the project. If not generate a project_id to be used during project creation.
        if self.kwargs.get('name', False):

            # Form a get project API request.
            self.get_project_request = resourcemanager_v3.GetProjectRequest(
                name=self.kwargs.get('name'),
            )

            # Make a get project API request.
            self.get_project_operation = self.project_client.get_project(request=self.get_project_request)

            # Store the project object response.
            self.project = self.get_project_operation

            # Set exists flag to true.
            self.project_exists = True

        else:

            # Set exists flag to false.
            self.project_exists = False

            # Check if the user passed in a custom project_id.
            if self.kwargs.get('project_id', False):
                self.project_id = self.kwargs.get('project_id')
            else:
                self.project_id = self.owner_username + "-" + secrets.token_hex(3) + "-" + "sandbox"

            # Create a project with the generated or user passed project_id.
            self.project = resourcemanager_v3.Project(project_id=self.project_id, display_name=self.project_id, parent=self.organization_id)

        # Dump IAM bindings information json.
        if self.kwargs.get('add_iam_bindings_json', False):
            self.add_iam_bindings_json = self.kwargs.get('add_iam_bindings_json')

        if self.kwargs.get('remove_iam_bindings_json', False):
            self.remove_iam_bindings_json = self.kwargs.get('remove_iam_bindings_json')


    #### Define user methods ####
    def get_name(self) -> str:
        if self.project_exists:
            return self.project.name
        else:
            raise Exception('Project must exist before a project name can be returned.')


    def get_project_id(self) -> str:
        return self.project.project_id


    def get_organization_name(self) -> str:
        return self.organization_id


    def get_owner_username(self) -> str:
        return self.owner_username


    def get_owner_email(self) -> str:
        return self.owner_email

    
    def get_create_time(self) -> str:
        return str(self.project.create_time)


    def deploy_project(self) -> None:
        if self.project_exists:
            raise Exception('A GCP project name/number was passed in as an argument. This method is only used for creating a new project.')
        else:
            # Form the project creation request.
            create_project_request = resourcemanager_v3.CreateProjectRequest(
                project=self.project)

            # Make the create project API call.
            create_project_operation = self.project_client.create_project(
                request=create_project_request)
            # print("Project deployment operation failed.")

            # Update the project object with the new project information.
            self.project = create_project_operation.result()

            # Update the project exists flag to true.
            self.project_exists = True

            # Handle the response.
            print(create_project_operation.result())


    def destroy_project(self) -> None:
        # Form the project deletion request.
        # TODO: add lien removal
        delete_project_request = resourcemanager_v3.DeleteProjectRequest(
            name=self.project.name)

        # Make the project deletion API call.
        delete_project_operation = self.project_client.delete_project(
                request=delete_project_request)

        self.project = delete_project_operation.result()

        print(delete_project_operation.result())

    def set_owner(self) -> None:
        # Copy the binding template and replace values with user passed values.
        policy = self.policy_template.copy()
        policy['bindings'][0]['role'] = self.kwargs['owner_role']
        policy['bindings'][0]['members'][0] = self.owner_member
        print(policy)

        # Form the iam policy set owner request.
        set_owner_request = iam_policy_pb2.SetIamPolicyRequest(
            resource=self.project.name, policy=policy)

        # Make the iam policy set owner API call.
        set_owner_operation = self.project_client.set_iam_policy(
            request=set_owner_request)
        # print("unable to add or change owner. Operation failed.")

        print(set_owner_operation)

    def get_iam(self) -> None:
        get_iam_request = iam_policy_pb2.GetIamPolicyRequest(
            resource=self.project.name
        )

        get_iam_operation = self.project_client.get_iam_policy(
            request=get_iam_request
        )

        return(MessageToDict(get_iam_operation))


    def add_iam(self) -> None:
        # get any bindings that exist already
        current_iam = self.get_iam()

        # append the new bindings to the previous bindings

        if current_iam.get('bindings'):
            for x in current_iam['bindings']:
                self.add_iam_bindings_json['bindings'].append(x)
        
        # form the iam request
        add_iam_request = iam_policy_pb2.SetIamPolicyRequest(
             resource=self.project.name, policy=self.add_iam_bindings_json)

        # make the iam policy API call
        add_iam_operation = self.project_client.set_iam_policy(
            request=add_iam_request)

        print(add_iam_operation)


    def remove_iam(self) -> None:
        # get any bindings that exist already
        current_iam = self.get_iam()
        current_iam.pop('version')
        current_iam.pop('etag')

        for item in self.remove_iam_bindings_json['bindings']:
            if item in current_iam['bindings']:
                current_iam['bindings'].remove(item)

        # form the iam request
        remove_iam_request = iam_policy_pb2.SetIamPolicyRequest(
            resource=self.project.name, policy=current_iam)

        # make the iam policy API call
        remove_iam_operation = self.project_client.set_iam_policy(
            request=remove_iam_request)

        print(remove_iam_operation)


    def enable_services(self) -> None:
        # form the batch services request
        if self.kwargs.get('service_ids', False):
            batch_enable_services_request = service_usage_v1.BatchEnableServicesRequest(parent=self.project.name,service_ids=self.kwargs.get('service_ids'))

            # Make the batch services enable API call
            batch_enable_services_operation = self.service_client.batch_enable_services(
                request=batch_enable_services_request)

            print(batch_enable_services_operation.result())

    # TODO: select credential based on API call type
    def __credential_switcher(self):
        pass