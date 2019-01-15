import argparse
import datetime
import random
import string


def main():
    # Generates random data with various data types
    parser = argparse.ArgumentParser(
        description="Generates tab delimited data with various datatypes such "
                    "as INT,FLOAT,DOUBLE,DECIMAL,STRING,VARCHAR,TIMESTAMP,"
                    "BOOLEAN,ARRAY,MAP,STRUCT,DATE")
    parser.add_argument('--size-in-gb', required=False, default=10, type=int,
                        choices=range(1, 101),
                        help='an integer for the data to be generated')
    args = parser.parse_args()
    size = args.size_in_gb
    print "Generating %d GB of data..." % size

    # 6000000 rows ~ 1gb
    years = ['2018-10-10', '2018-10-11', '2018-10-12', '2018-10-13',
             '2018-10-14', '2018-10-15', '2018-10-16', '2018-10-17',
             '2018-10-18']
    seasons = ['summer', 'winter', 'autumn', 'spring']
    filename = "/tmp/generated_data.txt"
    with open(filename, "wb") as file_content:
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

            file_content.write('\t'.join(row[0:]) + '\n')


if __name__ == "__main__":
    main()
