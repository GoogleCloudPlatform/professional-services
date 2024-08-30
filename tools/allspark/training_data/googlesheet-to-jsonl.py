# Copyright 2024 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

# https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json

import google.auth
import gspread
import re
import argparse

SHEET_URL = "https://docs.google.com/spreadsheets/d/1bJTzFINyEByk_z0THYIJlgjuPNRxlNsBdkGG8V6cbd8/edit"

parser = argparse.ArgumentParser()
parser.add_argument("-gsheet_url", type=str, help="gcs folder path for training file", default=SHEET_URL)
args = parser.parse_args()

def get_sheets():
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets"
    ]

    creds = google.auth.default(scopes=scopes)[0]
    client = gspread.authorize(creds)
    sheet = client.open_by_url(args.gsheet_url)
    worksheet_list = sheet.worksheets()
    return worksheet_list


def get_prefix(tab_name):
    source = tab_name.split(":")[1].split(" to ")[0].strip()
    lang = tab_name.split(":")[0].strip()
    target = tab_name.split(":")[1].split(" to ")[1].strip()
    prefix = "convert following {} code from {} to {} \n".format(lang, source, target)
    return prefix


def generate_file_name(tab_name):
    # Generate Big Query Table names by removing special characters and converting to lower case
    generated_file_name = ''.join(e for e in tab_name if e.isalnum()).lower()
    return generated_file_name


def convert_row_to_json(row, input_col_index, output_col_index, prefix):
    """
  keys in the current sheet need to be renamed for training
  and values need to be concatenated to have an appropriate prompt
  """
    jsonl = {}

    if row[output_col_index] != "" and row[input_col_index] != "":
        jsonl['input_text'] = prefix + row[input_col_index]
        jsonl['output_text'] = row[output_col_index]

    return json.dumps(jsonl)


def write_jsonl_from_sheet_tab(sheet_tab):
    tab_name = str(sheet_tab).split("'")[1]

    # Ignore tabs which do not follow convention of "Language: Source to Target"
    if not re.search(".*:.*\sto\s.*", tab_name):
        return

    prefix = get_prefix(tab_name)
    file_name = generate_file_name(tab_name)
    input_col_index = 0
    output_col_index = 1

    with open(f"{file_name}.jsonl", "w") as f:
        for idx, row in enumerate(sheet_tab.get_all_values()):
            if idx == 0:
                # Identify input and output column index based on the header row
                for col_idx, column_name in enumerate(row):
                    if column_name.lower().strip() == 'input':
                        input_col_index = col_idx
                    if column_name.lower().strip() == 'output':
                        output_col_index = col_idx
            else:
                # Convert each row to JSON
                json_record = convert_row_to_json(row, input_col_index, output_col_index, prefix)
                if json_record != "{}":
                    f.write(json_record + "\n")


if __name__ == "__main__":
    sheetList = get_sheets()
    for sheet in sheetList:
        write_jsonl_from_sheet_tab(sheet)
