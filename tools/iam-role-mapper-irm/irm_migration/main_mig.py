import os
import csv
import boto3, botocore
from botocore.exceptions import ClientError
from collections import defaultdict
import pandas as pd
import re
import itertools
import googleapiclient.discovery 
import google.auth.transport.requests




class MigrationUtility:
   def __init__(self):
           
       #Master sheet mapping
       self.master_role_mapping = defaultdict(list)
      
       #Retrieves existing AWS Roles and Policies
       self.aws_roles_policies_with_actions = defaultdict(list)

       #Store mappings from aws (roles relevant to this user) to gcp
       self.aws_roles_mapped_to_gcp = defaultdict(list)


       #Store unmapped roles and policies
       self.unmapped_aws_roles_and_policies = defaultdict(list)


       #This holds all permissions required to make the custom role in GCP
       self.custom_roles = defaultdict(list)
      
   '''
   Returns policies and the permissions under each policy for every AWS Role
   '''
   def get_aws_roles_and_policies_with_actions(self):
   # Initialize a new session using AWS IAM credentials from AWS CLI configuration
       session = boto3.Session()


       # Create a client for AWS IAM
       iam_client = session.client("iam")


       aws_roles_policies = {}  # Dictionary to store role names and their policies


       try:
           # List IAM roles
           roles = iam_client.list_roles()


           # Iterate through IAM roles
           for role in roles["Roles"]:
               role_name = role["RoleName"]
               attached_policies = iam_client.list_attached_role_policies(
                   RoleName=role_name
               )
               # Initialize a dictionary to store policies with actions for this role
               policies_with_actions = {}


               # Get a list of attached policy names
               policy_names = [
                   policy["PolicyName"]
                   for policy in attached_policies.get("AttachedPolicies", [])
               ]


               #  Iterate through attached policies to retrieve their actions
               for policy_name in policy_names:
                   try:
                       policy_document = iam_client.get_policy_version(
                           PolicyArn=f"arn:aws:iam::aws:policy/{policy_name}",
                           VersionId="v1",  # Use "v1" to get the latest version
                       )["PolicyVersion"]["Document"]


                       # Extract actions from the policy document
                       actions = set()
                       for statement in policy_document.get("Statement", []):
                           if statement["Effect"] == "Allow":
                               if "Action" in statement:
                                   if isinstance(statement["Action"], str):
                                       actions.add(
                                           statement["Action"]
                                       )  # If 'a' is a string, add it to the set
                                   elif isinstance(statement["Action"], list):
                                       actions.update(
                                           statement["Action"]
                                       )  # If 'a' is a list of strings, add each string to the set
                                   # actions.add(statement["Action"])


                       # Store policy actions in the dictionary
                       policies_with_actions[policy_name] = list(actions)


                       # Store role name and associated policies with actions in the dictionary
                       self.aws_roles_policies_with_actions[role_name] = policies_with_actions
                  
                   except botocore.exceptions.ClientError as e:
                       if e.response["Error"]["Code"] == "NoSuchEntity":
                           # Handle the case where the policy version does not exist
                           pass
                           print( f"Warning: Policy {policy_name} for role {role_name} does not have version 'v1'")
                       else:
                           # Handle other IAM-related exceptions
                           print(f"Error: {e}")


       except Exception as e:
           print(f"Error: {e}")
           return aws_roles_policies
       return self.aws_roles_policies_with_actions
      
  
   def read_csv_to_map(self,filename):
       with open(filename, "r") as csvfile:
           reader = csv.reader(csvfile)
           next(reader)  # Skip the header row
           for row in reader:
               aws_action = row[0]
               gcp_permission = row[1]
               self.master_role_mapping[aws_action] = gcp_permission


   '''
   Generates the GCP roles mapped to AWS policies
   Policies that do not have equivalent mappings are stored separately


   aws_map that is returned is a nested dictionary representing AWS roles, policies, and corresponding GCP permissions.
   It follows the format:
   {
       'AWS_Role1': {
           'AWS_Policy1': {
               'AWS_Action1': ['GCP_Permission1', 'GCP_Permission2', ...],
               'AWS_Action2': ['GCP_Permission3', 'GCP_Permission4', ...],
               ...
           },
           'AWS_Policy2': {
               'AWS_Action3': ['GCP_Permission5', 'GCP_Permission6', ...],
               ...
           },
           ...
       },
       'AWS_Role2': {
           ...
       },
       ...
   }


   '''
   def generate_maps(self, aws_map):
       for aws_role, aws_policies in aws_map.items():
           for aws_policy, aws_actions in aws_policies.items():
              
               aws_action_to_gcp_permission_map = {}
               policy_permissions = {}
               for aws_action in aws_actions:
                   if aws_action.endswith('*'):
                       gcp_permissions = []
                       # If aws_action ends with '*', perform regex check
                       aws_action_pattern = re.escape(aws_action[:-1])  # Escape special characters
                       for aws_permission_pattern, gcp_permission in self.master_role_mapping.items():
                           if re.match(aws_action_pattern, aws_permission_pattern):
                               gcp_permissions.append(gcp_permission)
                       aws_action_to_gcp_permission_map[aws_action] = gcp_permissions
                   else:
                       # If aws_action does not end with '*', search for an exact match
                       if aws_action in self.master_role_mapping:
                           aws_action_to_gcp_permission_map[aws_action] = [self.master_role_mapping[aws_action]]


               #Creates a single list with all the GCP permissions for a given policy
               permissions_for_policy = list(itertools.chain.from_iterable(aws_action_to_gcp_permission_map.values()))
              
               #Stores all these GCP Permissions in a hashmap with AWS Policy as the key
               policy_permissions[aws_policy] = permissions_for_policy
               self.custom_roles[aws_role].append(policy_permissions[aws_policy])
          
           #Creates a single list with all GCP permissions from all the policies part of a given AWS Role
           flattened_list = list(itertools.chain.from_iterable(self.custom_roles[aws_role]))


           #This hashmap holds all the GCP Permissions to make the GCP Custom Role
           self.custom_roles[aws_role] = list(set(flattened_list))
      
      
       return self.custom_roles


'''
Creates a pandas dataframe, a tabular representation
of the mapping between AWS policies and GCP roles
'''
'''
def create_pandas_dataframes(aws_map,mappedToGCP,unmapped):
   awsDF = pd.DataFrame([(role,policy) for role,policy_list in aws_map.items() for policy in policy_list], \
   columns = ['AWS Role', 'AWS Policy'])


   awsToGCP = pd.DataFrame([(role,predefined_role) for role,predefined_role_list in mappedToGCP.items() \
   for predefined_role in predefined_role_list], columns = ['AWS Policy', 'GCP Predefined Role'])
  
   mappings = pd.merge(awsDF,awsToGCP, on="AWS Policy")
   noMappings = pd.DataFrame([(role,policy) for role,policy_list in unmapped.items() for policy in policy_list], columns = ['AWS Role', 'AWS Policy'])


   df = pd.concat([mappings, noMappings])
   df = df.sort_values(by=['AWS Role'])
   df = df.fillna('Not Found')
   return df
'''
'''
Exports the tabular data into word doc
'''
'''
def export_table_to_doc(df, filename):


   #Create a new document
   doc = Document()


   #Converts a filename to the format ./{filename}.docx
   filename =  os.path.join('./', filename + '.docx')
   doc.save(filename)


   doc.add_heading('IAM Role Mapper Results', 0)
   doc.add_heading('Summary',1)
   data = (
       (
           ('totalAWSRoles', df['AWS Role'].nunique()),
           ('totalAWSPolicies',df['AWS Policy'].nunique()),
           ('notFound',df['GCP Predefined Role'].value_counts()['Not Found'])
       )
   )
   summary_table = doc.add_table(rows=1, cols=2,style='Table Grid')


   headingRow = summary_table.rows[0].cells
   headingRow[0].text = 'Entity'
   headingRow[1].text = 'Count'
  
   summary_table.rows[0].style = "borderColor:black;background-color:gray,font:bold"


   # Populating summary data into table
   for Entity, Count in data:   
       row = summary_table.add_row().cells
       row[0].text = Entity
       row[1].text = str(Count)
  
   doc.add_heading('Equivalent Mappings',1)
   mapping_table = doc.add_table(df.shape[0]+1, df.shape[1],style='Table Grid')


   for j in range(df.shape[-1]):
       mapping_table.cell(0,j).text = df.columns[j]
  
   headingRow = mapping_table.rows[0].cells
   headingRow[0].text = 'AWS Role'
   headingRow[1].text = 'AWS Policy'
   headingRow[2].text = 'GCP Predefined Role'
  
   # Populating equivalent mappings
   for i in range(df.shape[0]):
       for j in range(df.shape[-1]):
           mapping_table.cell(i+1,j).text = str(df.values[i,j])


   doc.save(filename)
'''




'''
Create a GCP Custom Role with extracted permissions from generate_maps function
'''
credentials, _ = google.auth.default(
scopes=['https://www.googleapis.com/auth/cloud-platform'])
access_token = credentials.token
service = googleapiclient.discovery.build("iam", "v1", credentials=access_token)


def create_role(
   name: str, project: str, title: str, description: str, permissions: str
) -> dict:


   role = (
       service.projects()
       .roles()
       .create(
           parent="projects/" + project,
           body={
               "roleId": name,
               "role": {
                   "title": title,
                   "description": description,
                   "includedPermissions": permissions,
               },
           },
       )
       .execute()
   )
   print("Updated role: " + role["name"])
   return role




def run_migration(execute, project_id, rules_file, generate_report, output_folder, suffix):
   
   migration_utility = MigrationUtility()
  
   # Read the CSV and create a map
   migration_utility.read_csv_to_map(rules_file)


   aws_map = migration_utility.get_aws_roles_and_policies_with_actions()
   custom_roles = migration_utility.generate_maps(aws_map)


   for aws_role, gcp_permissions in custom_roles.items():
      
       gcp_permissions = [permission for permission in gcp_permissions if permission!= ""]
      
       create_role(aws_role + suffix, project_id, aws_role, "from AWS", gcp_permissions)


       '''
       #Report Generation will be handled in next phase


       df = create_pandas_dataframes(aws_map,mappedToGCP,unmapped) # This function has to be updated as the generate_maps no longer returns mappedToGCP and unmapped
       filename = input("Please enter a filename to save the report: \n")
       export_table_to_doc(df, filename)
       '''

