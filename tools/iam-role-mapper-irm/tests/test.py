import boto3
import csv

def get_aws_roles_and_policies():
    # Initialize a new session using AWS IAM credentials from AWS CLI configuration
    session = boto3.Session()

    # Create a client for AWS IAM
    iam_client = session.client('iam')

    aws_roles_policies = {}  # Dictionary to store role names and their policies

    try:
        # List IAM roles
        roles = iam_client.list_roles()

        # Iterate through IAM roles
        for role in roles['Roles']:
            role_name = role['RoleName']
            attached_policies = iam_client.list_attached_role_policies(RoleName=role_name)

            # Get a list of attached policy names
            policy_names = [policy['PolicyName'] for policy in attached_policies.get('AttachedPolicies', [])]

            # Store role name and associated policies in the dictionary
            aws_roles_policies[role_name] = policy_names

    except Exception as e:
        print(f"Error: {e}")
        return aws_roles_policies

    return aws_roles_policies

def convert_to_csv(aws_roles_policies, output_file):
    try:
        with open(output_file, 'w', newline='') as csvfile:
            csv_writer = csv.writer(csvfile)
            csv_writer.writerow(['Role', 'Policies'])

            # Iterate through the dictionary and write data to CSV
            for role, policies in aws_roles_policies.items():
                # Combine policies with line breaks
                policies_str = '\n'.join(policies)
                csv_writer.writerow([role, policies_str])

    except Exception as e:
        print(f"Error: {e}")

def main():
    # Call the first function to retrieve AWS IAM roles and their attached policies
    roles_and_policies = get_aws_roles_and_policies()

    # Call the second function to convert the data to a CSV file
    output_csv_file = 'aws_roles_and_policies.csv'
    convert_to_csv(roles_and_policies, output_csv_file)

if __name__ == "__main__":
    main()
