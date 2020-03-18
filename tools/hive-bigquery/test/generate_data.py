# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import csv
import datetime
import random
import string


def main():
    # Generates random data with various data types
    parser = argparse.ArgumentParser(
        description="Generates tab delimited data with various datatypes such "
                    "as INT,FLOAT,DOUBLE,DECIMAL,STRING,VARCHAR,TIMESTAMP,"
                    "BOOLEAN,ARRAY,MAP,STRUCT,DATE")
    parser.add_argument('--size-in-gb', required=False, default=1, type=int,
                        choices=range(1, 101),
                        help="an integer for the data to be generated in GB's")
    args = parser.parse_args()
    size = args.size_in_gb
    filename = "/tmp/generated_data.txt"
    print("Generating {} GB of data at location {} ...".format(size,filename))

    # 6000000 rows ~ 1gb
    years = ['2018-10-10', '2018-10-11', '2018-10-12', '2018-10-13',
             '2018-10-14', '2018-10-15', '2018-10-16', '2018-10-17',
             '2018-10-18']
    seasons = ['summer', 'winter', 'autumn', 'spring']
    with open(filename, "w") as file_content:
        writer = csv.writer(file_content, delimiter='\t')
        n_years = len(years)
        n_seasons = len(seasons)
        for i in range(6000000 * size):
            if i % 100000 == 0:
                print("Generated {} of data.".format(
                    str(round(float(100 * i) / (6000000 * size), 2)) + ' %'))
            int_value = str(i)
            float_value = str(float(i)/3)
            string_value = ''.join(
                random.choice(string.ascii_uppercase + string.digits) for _ in
                range(10))
            string_categorical_value = seasons[i % n_seasons]
            date_value = years[i % n_years]
            timestamp_value = str(datetime.datetime.now())
            boolean_value = str(bool(random.randint(0, 1)))
            array_value = ','.join(str(j) for j in range(i, i+5))
            map_value = string_categorical_value+':'+str(int_value)
            struct_value = str(int_value)+','+string_categorical_value

            row = [
                int_value,
                float_value,
                float_value,
                float_value,
                string_value,
                string_value,
                timestamp_value,
                boolean_value,
                array_value,
                map_value,
                struct_value,
                date_value,
                string_categorical_value
            ]

            writer.writerow(row)


if __name__ == "__main__":
    main()
