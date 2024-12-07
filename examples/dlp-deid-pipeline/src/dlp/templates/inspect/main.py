import google.cloud.dlp

# Create DLP service client
dlp = google.cloud.dlp_v2.DlpServiceClient()


def create_inspect_template(project: str):
	"""Creates a DLP inspect template.

	This function creates an inspect template in the specified Google Cloud
	project. The template defines a set of rules for identifying sensitive
	information in data, including:

	- Built-in infoTypes:
				- EMAIL_ADDRESS
				- DATE
				- CREDIT_CARD_NUMBER
- Custom infoTypes:
				- CUSTOM_EMAIL_PREFIX (defined by regex: `(\w*)@\w*`)
				- SSN_PARTS (defined by regex: `(\d{3})-(\d{2})-(\d{4})`)
				- CUSTOMER_ID (defined by regex: `(A)(\d{6})`)
	- Exclusion rule:
				- Excludes `EMAIL_ADDRESS` if it's also identified as
							`CUSTOM_EMAIL_PREFIX`.

	The template is configured to include the surrounding quote in the results.

	Args:
			project (str): The Google Cloud project ID.
	"""
	# Construct template configuration dictionary
	inspect_template = {
			"display_name": "Schwab Inspect Template",
			"inspect_config": {
					"info_types": [
							{
									"name": "EMAIL_ADDRESS"
							},
							{
									"name": "DATE"
							},
							{
									"name": "CREDIT_CARD_NUMBER"
							}
					],
					"custom_info_types": [
							{
									"info_type": {
											"name": "CUSTOM_EMAIL_PREFIX"
									},
									"regex": {
											"group_indexes": [1],
											"pattern": "(\\w*)@\\w*"
									}
							},
							{
									"info_type": {
											"name": "SSN_PARTS"
									},
									"regex": {
											"group_indexes": [1, 2, 3],
											"pattern": "(\\d{3})-(\\d{2})-(\\d{4})"
									}
							},
							{
									"info_type": {
											"name": "CUSTOMER_ID"
									},
									"regex": {
											"group_indexes": [2],
											"pattern": "(A)(\\d{6})"
									}
							}
					],
					"rule_set": [
							{
									"info_types": [
											{
													"name": "CUSTOM_EMAIL_PREFIX"
											}
									],
									"rules": [
											{
													"exclusion_rule": {
															"matching_type": "MATCHING_TYPE_INVERSE_MATCH",
															"exclude_info_types": {
																	"info_types": [
																			{
																					"name": "EMAIL_ADDRESS"
																			}
																	]
															}
													}
											}
									]
							}
					],
					"include_quote": True
			}
	}

	# Create the template.
	response = dlp.create_inspect_template(
			request={
					"parent": f"projects/{project}",
					"inspect_template": inspect_template,
					"template_id": "inspect_template",
			}
	)

	print(f"Successfully created template {response.name}")


def main(request):
	request_json = request.get_json()
	project = request_json["project"]
	create_inspect_template(project)
	return "Inspection template function complete"
