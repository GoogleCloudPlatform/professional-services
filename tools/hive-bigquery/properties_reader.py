import json


class PropertiesReader:
    """Properties reader to write the user arguments to a file and read from it"""

    properties = ''

    def __init__(self, filename):

        with open(filename, 'r') as f:
            PropertiesReader.properties = json.load(f)

    @staticmethod
    def get(key):

        if key in PropertiesReader.properties:
            return PropertiesReader.properties[key]
        else:
            raise KeyError("Key %s is not present in Properties Reader" % key)
