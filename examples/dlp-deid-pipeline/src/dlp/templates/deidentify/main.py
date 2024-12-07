import google.cloud.dlp

from google.cloud import secretmanager

# Create service client
dlp = google.cloud.dlp_v2.DlpServiceClient()


def create_deidentify_template(project: str, kms_key_name: str, key: str):
	"""Creates a DLP de-identify template.

	This function creates a de-identify template in the specified Google Cloud
	project. The template uses format-preserving encryption (FPE) with a
	customer-managed encryption key (CMEK) to de-identify sensitive data
	like email addresses, SSNs, credit card numbers, and customer IDs.
	It also applies date shifting to date values.

	The template is configured to:
		- Use the provided `kms_key_name` and `key` for FPE encryption.
		- De-identify the following infoTypes:
				- CUSTOM_EMAIL_PREFIX
				- SSN_PARTS
				- CREDIT_CARD_NUMBER
				- CUSTOMER_ID
				- DATE
		- Shift dates by a random number of days between -100 and 100.

	Args:
			project (str): The Google Cloud project ID.
			kms_key_name (str): The name of the KMS key used for encryption.
			key (str): The wrapped encryption key.
	"""
	# Construct wrapped key configuration
	crypto_key = {
		"kms_wrapped": {
			"crypto_key_name": kms_key_name,
			"wrapped_key": key
		}
	}

	# Construct deidentify config dictionary
	deidentify_template = {
		"display_name": "Schwab De-identify Template",
		"deidentify_config": {
			"info_type_transformations": {
				"transformations": [
					{
						"primitive_transformation": {
							"crypto_replace_ffx_fpe_config": {
								"common_alphabet": "ALPHA_NUMERIC",
								"crypto_key": crypto_key
							}
						},
						"info_types": [
							{
								"name": "CUSTOM_EMAIL_PREFIX"
							}
						]
					},
					{
						"primitive_transformation": {
							"crypto_replace_ffx_fpe_config": {
								"crypto_key": crypto_key,
								"common_alphabet": "NUMERIC"
							}
						},
						"info_types": [
							{
								"name": "SSN_PARTS"
							}
						]
					},
					{
						"primitive_transformation": {
							"crypto_replace_ffx_fpe_config": {
								"common_alphabet": "NUMERIC",
								"crypto_key": crypto_key
							}
						},
						"info_types": [
							{
								"name": "CREDIT_CARD_NUMBER"
							}
						]
					},
					{
						"primitive_transformation": {
							"crypto_replace_ffx_fpe_config": {
								"crypto_key": crypto_key,
								"common_alphabet": "NUMERIC"
							}
						},
						"info_types": [
							{
								"name": "CUSTOMER_ID"
							}
						]
					},
					{
						"primitive_transformation": {
							"date_shift_config": {
								"upper_bound_days": 100,
								"lower_bound_days": -100
							}
						},
						"info_types": [
							{
								"name": "DATE"
							}
						]
					}
				]
			}
		}
	}

	# Create the template.
	response = dlp.create_deidentify_template(
		request={
			"parent": f"projects/{project}",
			"deidentify_template": deidentify_template,
			"template_id": "deidentify_template",
		}
	)

	print(f"Successfully created template {response.name}")


def main(request):
	request_json = request.get_json()
	project = request_json["project"]
	kms_key_name = request_json["kms_key_name"]

	# Get wrapped key from Secret Manager
	secret_client = secretmanager.SecretManagerServiceClient()
	secret_name = request_json["secret_name"] + "/versions/latest"
	wrapped_key = secret_client.access_secret_version(
			request={"name": secret_name}
		).payload.data.decode("UTF-8")
	
	create_deidentify_template(project, kms_key_name, wrapped_key)

	return "De-identify Template Function Complete"
