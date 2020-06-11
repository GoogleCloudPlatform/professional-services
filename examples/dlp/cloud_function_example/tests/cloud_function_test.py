import unittest

from cloud_function import main


class TestMainMethods(unittest.TestCase):

  def test_build_deidentify_config(self):
    info_type_list = ['CREDIT_CARD_NUMBER', 'DATE_OF_BIRTH', 'EMAIL_ADDRESS']
    expected_config = {
      'info_type_transformations': {
        'transformations': [
          {
            'info_types': [{'name': 'CREDIT_CARD_NUMBER'}],
            'primitive_transformation': {
              'replace_config': {
                'new_value': {
                  'string_value': '[CREDIT_CARD_NUMBER]'
                }
              }
            }
          }, {
            'info_types': [{'name': 'DATE_OF_BIRTH'}],
            'primitive_transformation': {
              'replace_config': {
                'new_value': {
                  'string_value': '[DATE_OF_BIRTH]'
                }
              }
            }
          }, {
            'info_types': [{'name': 'EMAIL_ADDRESS'}],
            'primitive_transformation': {
              'replace_config': {
                'new_value': {
                  'string_value': '[EMAIL_ADDRESS]'
                }
              }
            }
          }
        ]
      }
    }
    generated_config = main._build_deidentify_config(info_type_list)
    self.assertDictEqual(expected_config, generated_config)


if __name__ == '__main__':
    unittest.main()