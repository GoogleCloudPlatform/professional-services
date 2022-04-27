# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
import os


class SchemaCreator(object):
    """Contains methods for creating schemas json schemas from file parameters.

    Attributes:
        schemas_dir(str): Directory where json schemas should be written to.
        file_params(dict): Dictionary containing each file parameter and
            its possible values.
    """

    def __init__(self, schemas_dir, file_params):
        self.schemas_dir = schemas_dir
        self.file_params = file_params

    def create_schemas(self):
        """Creates schemas in json format from file parameters.

        Gathers combinations of schemas from the parameters in the numColumns
        and columnTypes parameters in the self.file_params
        dictionary. The schemas are written out in json format to the
        self.schemas_dir directory. They can then be used to create staging
        BigQuery tables.
        """

        # Gather file parameters.
        num_columns = self.file_params['numColumns']
        schema_types = self.file_params['columnTypes']

        # Begin iterating through parameters to create schemas.
        for schema_type in schema_types:
            # Create lists for the percents and types of columns, where each
            # index in the percents list corresponds to the same index in the
            # columns lists, to help with schema generation.
            # For example, if the columnTypes param is 10_STRING_90_NUMERIC,
            # percents will be [10, 90] and  types will be [STRING, NUMERIC].
            percents = [float(x) for x in schema_type.split('_')[::2]]
            types = schema_type.split('_')[1::2]
            if sum(percents) != 100:
                logging.error(('Invalid column type: {0:s}.'
                               'Percents must equal 100.'.format(schema_type)))
            # Iterate through each value in the numColumns list from
            # self.file_params dictionary.
            for n in num_columns:
                full_json = []
                # Iterate through the percents and types list to create the
                # needed number of columns for each type.
                for i in range(0, len(types)):
                    # Gather the column type and percent for the current
                    # iteration.
                    field_type = types[i]
                    percent = percents[i] / 100.
                    # Calculate the number of columns that need to be
                    # generated for that type using the percent and the total
                    # number of columns (n).
                    type_count = int(n * percent)
                    mode = 'REQUIRED'
                    # Create the needed number of fields for the type. Each
                    # field is named in increments using the field field_type'
                    # and  number. For example, if the field_type is string,
                    # and 10 string fields are needed, they will be named
                    # 'string1', 'string2', and so on until 'string10'.
                    for t in range(1, type_count + 1):
                        type_field = {
                            'name': '{0:s}{1:d}'.format(field_type.lower(), t),
                            'type': field_type,
                            'mode': mode,
                        }
                        # Append the field to the full_json list.
                        full_json.append(type_field)

                # Once all the fields have been created and added to full_json,
                # create an outer dict using full_json.
                outer_dict = {'fields': full_json}
                # If the provided self.schemas_dir doesn't exist, create it.
                if not os.path.exists('./{0:s}'.format(self.schemas_dir)):
                    os.makedirs('./{0:s}'.format(self.schemas_dir))
                # Create a file name, based on the ColumnType parameter and the
                # numColumns parameter, to hold the json schema.
                file_name = '{0:s}/{1:s}_{2:d}.json'.format(
                    self.schemas_dir,
                    schema_type,
                    n,
                )
                # Write the json schema to the file.
                with open(file_name, 'w') as outfile:
                    json.dump(outer_dict, outfile, indent=4)
                    logging.info('Adding schema in {0:s}'.format(file_name))
