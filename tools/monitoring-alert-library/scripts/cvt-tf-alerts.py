#  Copyright 2024 Google LLC
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

from pathlib import Path
import glob
import os
import sys
import yaml
import re

class LiteralString(str):
    pass

def format_existing_data(data):
    """
    Recursively traverses the data structure. 
    If a string contains a newline, convert it to LiteralString 
    so it dumps as a block style (|).
    Keys are left unchanged.
    """
    if isinstance(data, dict):
        return {k: format_existing_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [format_existing_data(i) for i in data]
    elif isinstance(data, str) and '\n' in data:
        # Clean whitespace and wrap in LiteralString
        clean_lines = [line.rstrip() for line in data.split('\n')]
        return LiteralString('\n'.join(clean_lines))
    else:
        return data

def literal_representer(dumper, data):
    """
    This function tells the YAML dumper to use the literal block style ('|')
    for any string that is an instance of the LiteralString class.
    The '-' for chomping is handled automatically by ensuring the string
    has no trailing newline before dumping.
    """
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')

yaml.add_representer(LiteralString, literal_representer)

def to_snake_case(name):
    """
    Converts a camelCase string to snake_case.
    For example: "displayName" becomes "display_name".
    """
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def convert_keys_to_snake_case(item):
    """
    Recursively converts all dictionary keys in a data structure
    from camelCase to snake_case.
    """
    if isinstance(item, dict):
        return {to_snake_case(k): convert_keys_to_snake_case(v) for k, v in item.items()}
    elif isinstance(item, list):
        return [convert_keys_to_snake_case(i) for i in item]
    elif isinstance(item, str) and '\n' in item:
        return LiteralString(item)
    else:
        return item


def convert_terraform_factory(doc):
    try:
        return convert_keys_to_snake_case(doc)

    except Exception as e:
        print(f"Error converting yaml data: {e}\n{yaml.dump(doc)}")
        return  None


def main():
    if len(sys.argv) < 3:
        print(f"Usage: python3 {py_filename} <source_dir> <output_dir> <root_key> ")
        return

    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    root_key  = sys.argv[3]
    print(f"[{py_filename}] processing: {input_dir}, output directory: {output_dir}")
    os.makedirs(output_dir, exist_ok=True)


    for filepath in glob.iglob(f"{input_dir}/**/*.yaml", recursive=True):
        filename = Path(filepath).stem
        with open(filepath, "r") as file:
            try:
                yaml_data = yaml.safe_load(file)
                if not yaml_data:
                    continue
                    
                tf_yaml_all_data = {
                    root_key: { filename: {}  }
                }

                tf_yaml_data = convert_terraform_factory(yaml_data)
                if  not tf_yaml_data:
                    continue

                existing_data = {}
                output_file = f"{output_dir}/{filename}.yaml"

                if os.path.exists(output_file):
                    print(f"[{py_filename}] existing file found: {output_file}")
                    with open(output_file, "r") as infile:
                        try:
                            loaded_content = yaml.safe_load(infile)
                            if not loaded_content:
                                existing_data = {}
                            else:
                                existing_data = format_existing_data(loaded_content)

                        except yaml.YAMLError as exc:
                            print(f"[{py_filename}] Error loading YAML from {output_file}: {exc}")
                            continue

                tf_yaml_all_data[root_key][filename] = tf_yaml_data
                existing_data.update(tf_yaml_all_data)
                with open(output_file, "w") as outfile:
                    print(f"[{py_filename}] creating: {output_file}")
                    yaml.dump(existing_data, outfile, sort_keys=True)

            except yaml.YAMLError as exc:
                print(f"Error parsing YAML file {filepath}: {exc}")


py_filename = os.path.basename(__file__)

if __name__ == "__main__":
    main()