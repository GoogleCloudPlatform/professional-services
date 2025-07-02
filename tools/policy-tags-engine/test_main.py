import unittest
from unittest.mock import patch
import os

# Assuming the classes and functions are in a file named 'main.py'
from main import Config, get_json_field_detail, get_new_policy_tag_string


# Mock BigQuery SchemaField as it's used in one of the functions
class SchemaField:

    def __init__(self, name, field_type="STRING", fields=()):
        self.name = name
        self.field_type = field_type
        self.fields = fields


class TestNonGCPFunctions(unittest.TestCase):

    @patch.dict(
        os.environ, {
            "POLICY_TAG_TAXONOMY":
                '''{"personalInformation": {"highlyConfidential": "tag1"}}''',
            "BUCKET_NAME":
                "test-bucket",
            "FILE_PREFIX":
                "test-prefix",
            "SUCCESS_PATH":
                "success",
            "FAILURE_PATH":
                "failure",
            "DATE_LIMIT_ENABLED":
                "true",
            "DATE_LIMIT_DAYS":
                "30"
        })
    def test_config_from_env_success(self):
        """Tests successful config creation from environment variables."""
        config = Config.from_env()
        self.assertEqual(config.bucket_name, "test-bucket")
        self.assertEqual(config.file_prefix, "test-prefix")
        self.assertEqual(config.success_path, "success")
        self.assertEqual(config.failure_path, "failure")
        self.assertTrue(config.date_limit_enabled)
        self.assertEqual(config.date_limit_days, 30)
        self.assertIn("personalInformation", config.policy_tag_taxonomy)

    @patch.dict(os.environ, {}, clear=True)
    def test_config_from_env_missing_vars(self):
        """Tests that Config.from_env raises KeyError for missing environment variables."""
        with self.assertRaises(KeyError):
            Config.from_env()

    def test_get_json_field_detail(self):
        """Tests the logic for finding column details from a JSON config."""
        json_columns = [{
            "columnName": "user_id",
            "PII": True
        }, {
            "columnName": "transaction.amount",
            "PII": False
        }, {
            "columnName": "address.city",
            "PII": True
        }]

        # Test direct match
        field_user_id = SchemaField("user_id")
        details = get_json_field_detail(json_columns, field_user_id)
        self.assertIsNotNone(details)
        self.assertEqual(details["columnName"], "user_id")

        # Test nested match
        field_city = SchemaField("city")
        details = get_json_field_detail(json_columns, field_city)
        self.assertIsNotNone(details)
        self.assertEqual(details["columnName"], "address.city")

        # Test case-insensitivity
        field_amount = SchemaField("AMOUNT")  # Schema field is uppercase
        details = get_json_field_detail(json_columns, field_amount)
        self.assertIsNotNone(details)
        self.assertEqual(details["columnName"], "transaction.amount")

        # Test no match
        field_not_found = SchemaField("non_existent_field")
        details = get_json_field_detail(json_columns, field_not_found)
        self.assertIsNone(details)

    def test_get_new_policy_tag_string(self):
        """Tests the logic for determining the correct policy tag string."""
        policy_map = {
            "personalInformation": {
                "highlyConfidential":
                    "projects/p/l/t/taxonomies/1/policyTags/1",
                "confidential":
                    "projects/p/l/t/taxonomies/1/policyTags/2"
            },
            "nonPersonalInformation": {
                "highlyConfidential":
                    "projects/p/l/t/taxonomies/1/policyTags/3",
                "confidential":
                    "projects/p/l/t/taxonomies/1/policyTags/4"
            }
        }

        # Test PII, Highly Confidential
        col_details_1 = {
            "PII": True,
            "securityClassification": "Highly Confidential"
        }
        tag = get_new_policy_tag_string(col_details_1, policy_map)
        self.assertEqual(tag, "projects/p/l/t/taxonomies/1/policyTags/1")

        # Test non-PII, Confidential
        col_details_2 = {"PII": False, "securityClassification": "Confidential"}
        tag = get_new_policy_tag_string(col_details_2, policy_map)
        self.assertEqual(tag, "projects/p/l/t/taxonomies/1/policyTags/4")

        # Test missing classification
        col_details_3 = {"PII": True}
        tag = get_new_policy_tag_string(col_details_3, policy_map)
        self.assertIsNone(tag)

        # Test invalid classification mapping
        col_details_4 = {"PII": True, "securityClassification": "Public"}
        tag = get_new_policy_tag_string(col_details_4, policy_map)
        self.assertEqual(tag, "projects/p/l/t/taxonomies/1/policyTags/2"
                        )  # Falls back to confidential

        # Test missing PII key (defaults to non-PII)
        col_details_5 = {"securityClassification": "Highly Confidential"}
        tag = get_new_policy_tag_string(col_details_5, policy_map)
        self.assertEqual(tag, "projects/p/l/t/taxonomies/1/policyTags/3")


if __name__ == '__main__':
    unittest.main()
