# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

""" Utility methods """
import csv
import yaml

def read_csv_as_text(input_file_path):
    try:
        f = open(input_file_path , "r")
        csvreader = csv.reader(f)
        return csvreader
    except Exception as e:
        raise ValueError("Validation failed due to: {error}}".format(error=e) )


def read_yaml(path):

    with open(path, "r") as stream:
        try:
            return yaml.safe_load(stream)
        except yaml.YAMLError as exc:
            print(exc)


