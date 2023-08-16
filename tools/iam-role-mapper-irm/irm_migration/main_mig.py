## Code for the implementation
import csv
import boto3


class MigrationUtility:
    def __init__(self, gcloud_invoke, rules_file, gcloud_output, output_folder):
        self.gcloud_invoke = gcloud_invoke
        self.rules_file = rules_file
        self.gcloud_output = gcloud_output
        self.output_folder = output_folder

    def get_aws_users_and_policies(self):
        # Initialize a new session using AWS IAM credentials from AWS CLI configuration
        session = boto3.Session()

        # Create a client for AWS Organizations
        organizations_client = session.client("organizations")

        # Fetch AWS Organization information
        try:
            accounts = []
            response = organizations_client.list_accounts()

            while True:
                accounts += response["Accounts"]
                if "NextToken" not in response:
                    break
                response = organizations_client.list_accounts(
                    NextToken=response["NextToken"]
                )

            # Iterate through AWS accounts
            for account in accounts:
                account_id = account["Id"]
                account_name = account["Name"]
                email = organizations_client.describe_account(AccountId=account_id)[
                    "Account"
                ]["Email"]

                # Create a client for IAM using the session (no need to specify region)
                iam_client = session.client("iam", region_name=None)

                # Fetch IAM users for the current account
                users = iam_client.list_users()

                print(
                    f"Account Name: {account_name}, Account ID: {account_id}, Email: {email}"
                )

                # Iterate through IAM users
                if "Users" in users:
                    for user in users["Users"]:
                        user_name = user["UserName"]
                        print(f"  IAM User: {user_name}")

                        # Fetch attached IAM policies for the current user
                        attached_policies = iam_client.list_attached_user_policies(
                            UserName=user_name
                        )

                        # Print attached policies
                        if "AttachedPolicies" in attached_policies:
                            for policy in attached_policies["AttachedPolicies"]:
                                policy_name = policy["PolicyName"]
                                print(f"    Attached Policy: {policy_name}")

        finally:
            pass

    def load_rules(self):
        with open(self.rules_file, "r") as rules:
            reader = csv.reader(rules)

    # Read the mastersheet which has the role mappings between AWS and GCP, and creates a map in Python
    def read_csv_to_map(self, filename):
        self.role_map = {}
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
    # If there are AWS policies that do not map with GCP roles, then add them to unmatched_roles_map.
    def generate_maps(self, aws_map):
        self.gcp_map = {}
        self.unmatched_roles_map = {}

        for email, aws_roles in aws_map.items():
            for aws_role in aws_roles:
                if aws_role in self.role_map:
                    if email not in self.gcp_map:
                        self.gcp_map[email] = []
                    self.gcp_map[email].append(self.role_map[aws_role])
                else:
                    if email not in self.unmatched_roles_map:
                        self.unmatched_roles_map[email] = []
                    self.unmatched_roles_map[email].append(aws_role)

    def migrate_roles(self):
        pass


def run_migration(gcloud_invoke, rules_file, gcloud_output, output_folder):
    migration_utility = MigrationUtility(
        gcloud_invoke=gcloud_invoke,
        rules_file=rules_file,
        gcloud_output=gcloud_output,
        output_folder=output_folder,
    )
    migration_utility.load_rules()
    migration_utility.migrate_roles()
