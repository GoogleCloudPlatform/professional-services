"""Properties Reader module"""

import json


class PropertiesReader(object):
    """Properties reader to read properties from a file"""

    properties = ''

    def __init__(self, filename):

        with open(filename, 'r') as file_content:
            PropertiesReader.properties = json.load(file_content)

    @staticmethod
    def get(key):
        """Retrieve a value from the dictionary

        Args:
            key (str): key name of the property

        Returns:
            str: value of the property
        """

        if key in PropertiesReader.properties:
            return PropertiesReader.properties[key]
        else:
            raise KeyError("Key %s is not present in Properties Reader" % key)
