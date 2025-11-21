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


class LiteralString(str):
    pass


def literal_representer(dumper, data):
    """
    Forces the YAML dumper to use block style ('|') for LiteralString instances.
    """
    return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")


yaml.add_representer(LiteralString, literal_representer)


def preserve_literal_style(data):
    """
    Recursively traverses a dictionary/list. If a string contains a newline,
    convert it to a LiteralString object so PyYAML dumps it as a block.
    """
    if isinstance(data, dict):
        return {k: preserve_literal_style(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [preserve_literal_style(i) for i in data]
    elif isinstance(data, str) and '\n' in data:
        return LiteralString(data)
    return data


def convert_terraform_factory(filename, doc):
    try:
        processed_doc = preserve_literal_style(doc)
        tf_yaml = {}
        tf_yaml[filename] = processed_doc
        return filename, tf_yaml

    except Exception as e:
        print(f"Error converting yaml data: {e}\n{yaml.dump(doc)}")
        return None, None


def main():
    if len(sys.argv) < 3:
        print(f"Usage: python3 {py_filename} <source_dir> <output_dir>")
        return

    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    print(
        f"[{py_filename}] processing: {input_dir}, output directory: {output_dir}"
    )
    os.makedirs(output_dir, exist_ok=True)

    for filepath in glob.iglob(f"{input_dir}/**/*.yaml", recursive=True):
        filename = Path(filepath).stem
        with open(filepath, "r") as file:
            try:
                yaml_data = yaml.safe_load(file)
                if not yaml_data:
                    continue

                root_key, tf_yaml_data = convert_terraform_factory(
                    filename, yaml_data)

                if root_key and tf_yaml_data:
                    output_file = f"{output_dir}/{filename}.yaml"
                    with open(output_file, "w") as outfile:
                        print(f"[{py_filename}] creating: {output_file}")
                        yaml.dump(tf_yaml_data, outfile, sort_keys=True)

            except yaml.YAMLError as exc:
                print(f"Error parsing YAML file {filepath}: {exc}")


py_filename = os.path.basename(__file__)

if __name__ == "__main__":
    main()