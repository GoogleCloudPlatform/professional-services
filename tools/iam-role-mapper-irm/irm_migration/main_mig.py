import csv
import boto3


def get_aws_roles_and_policies():
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

            # Get a list of attached policy names
            policy_names = [
                policy["PolicyName"]
                for policy in attached_policies.get("AttachedPolicies", [])
            ]

            # Store role name and associated policies in the dictionary
            aws_roles_policies[role_name] = policy_names

    except Exception as e:
        print(f"Error: {e}")
        return aws_roles_policies

    print(aws_roles_policies)
    return aws_roles_policies


class MigrationUtility:
    def __init__(self, gcloud_invoke, rules_file, gcloud_output, output_folder):
        self.aws_roles_mapped_to_gcp = None
        self.aws_roles_unmapped = None
        self.unmatched_roles_map = None
        self.gcloud_invoke = gcloud_invoke
        self.rules_file = rules_file
        self.gcloud_output = gcloud_output
        self.output_folder = output_folder

    # Read the master-sheet which has the role mappings between AWS and GCP, and creates a map in Python
    def read_csv_to_map(self, filename):
        with open(filename, "r") as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip the header row
            for row in reader:
                aws_role = row[0]
                gcp_role = row[1]
                self.role_map[aws_role] = gcp_role

    # Read the CSV and create a map
    csv_file = "./master-sheet/aws-to-gcp.csv"
    read_csv_to_map(csv_file)

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
        role_permissions_map = get_aws_roles_and_policies()
        pass


def run_migration(execute, rules_file, generate_report, output_folder):
    migration_utility = MigrationUtility(
        gcloud_invoke=execute,
        rules_file=rules_file,
        gcloud_output=generate_report,
        output_folder=output_folder,
    )
    migration_utility.migrate_roles()
