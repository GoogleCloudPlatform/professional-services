import csv
import boto3
import botocore.exceptions


def get_aws_roles_and_policies_with_actions():
    # Initialize a new session using AWS IAM credentials from AWS CLI configuration
    session = boto3.Session()

    # Create a client for AWS IAM
    iam_client = session.client("iam")

    aws_roles_policies_with_actions = (
        {}
    )  # Dictionary to store role names and policies with actions

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

            # Iterate through attached policies to retrieve their actions
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

                except botocore.exceptions.ClientError as e:
                    if e.response["Error"]["Code"] == "NoSuchEntity":
                        # Handle the case where the policy version does not exist
                        print(
                            f"Warning: Policy {policy_name} for role {role_name} does not have version 'v1'"
                        )
                    else:
                        # Handle other IAM-related exceptions
                        print(f"Error: {e}")

            # Store role name and associated policies with actions in the dictionary
            aws_roles_policies_with_actions[role_name] = policies_with_actions

    except Exception as e:
        print(f"Error: {e}")
        return aws_roles_policies_with_actions

    return aws_roles_policies_with_actions


class MigrationUtility:
    def __init__(
        self,
        gcloud_invoke,
        rules_file,
        gcloud_output,
        output_folder,
        mastersheet_file_path,
    ):
        self.aws_roles_mapped_to_gcp = None
        self.aws_roles_unmapped = None
        self.unmatched_roles_map = None
        self.gcloud_invoke = gcloud_invoke
        self.rules_file = rules_file
        self.gcloud_output = gcloud_output
        self.output_folder = output_folder
        self.mastersheet_file_path = mastersheet_file_path
        self.read_csv_to_map(mastersheet_file_path)

    # Read the master-sheet which has the role mappings between AWS and GCP, and creates a map in Python
    def read_csv_to_map(self, filename):
        with open(filename, "r") as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip the header row
            for row in reader:
                aws_role = row[0]
                gcp_role = row[1]
                self.role_map[aws_role] = gcp_role

    # Generate the GCP role mapping for the AWS policies that can be mapped to GCP roles.
    # If there are AWS policies that do not map with GCP roles, then add them to aws_roles_unmapped.
    def generate_maps(self, aws_map):
        for aws_role, aws_policies in aws_map.items():
            for aws_policy in aws_policies:
                if aws_policy in self.role_map:
                    if aws_role not in self.aws_roles_mapped_to_gcp:
                        self.aws_roles_mapped_to_gcp[aws_role] = []
                    self.aws_roles_mapped_to_gcp[aws_role].append(
                        self.role_map[aws_policy]
                    )
                else:
                    if aws_role not in self.aws_roles_unmapped:
                        self.aws_roles_unmapped[aws_role] = []
                    self.aws_roles_unmapped[aws_role].append(aws_policy)

    def migrate_roles(self):
        role_permissions_map = get_aws_roles_and_policies_with_actions()
        print(role_permissions_map)
        pass


def run_migration(execute, rules_file, generate_report, output_folder):
    migration_utility = MigrationUtility(
        gcloud_invoke=execute,
        rules_file=rules_file,
        gcloud_output=generate_report,
        output_folder=output_folder,
        mastersheet_file_path="./master-sheet/aws-to-gcp.csv",
    )
    migration_utility.migrate_roles()
