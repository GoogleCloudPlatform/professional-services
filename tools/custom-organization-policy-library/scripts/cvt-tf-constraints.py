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

import glob
import os
import sys
import yaml


class LiteralString(str):
    pass


def literal_representer(dumper, data):
    """
    This function tells the YAML dumper to use the literal block style ('|')
    for any string that is an instance of the LiteralString class.
    The '-' for chomping is handled automatically by ensuring the string
    has no trailing newline before dumping.
    """
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')


yaml.add_representer(LiteralString, literal_representer)


def convert_terraform_factory(doc):
    try:
        if "resourceTypes" in doc:
            doc["resource_types"] = doc.pop("resourceTypes")

        if "actionType" in doc:
            doc["action_type"] = doc.pop("actionType")

        if "displayName" in doc:
            doc["display_name"] = doc.pop("displayName")

        if "methodTypes" in doc:
            doc["method_types"] = doc.pop("methodTypes")

        if "condition" in doc:
            condition_value = doc["condition"].strip()
            doc["condition"] = LiteralString(condition_value)

        if "description" in doc:
            # Replace newlines with spaces and normalize whitespace
            description_value = " ".join(doc["description"].split())
            doc["description"] = description_value

        tf_yaml = {}
        _, _, root_key = doc.get("name").rpartition("/")
        root_prefix_key = root_key  # root_key.replace("custom.", "custom.${prefix}")
        del doc["name"]
        tf_yaml[root_prefix_key] = doc
        return root_key, tf_yaml

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
        with open(filepath, "r") as file:
            try:
                yaml_data = yaml.safe_load(file)
                if not yaml_data:
                    continue

                root_key, tf_yaml_data = convert_terraform_factory(yaml_data)

                if root_key and tf_yaml_data:
                    output_file = f"{output_dir}/{root_key}.yaml"
                    with open(output_file, "w") as outfile:
                        print(f"[{py_filename}] creating: {output_file}")
                        yaml.dump(tf_yaml_data, outfile, sort_keys=True)

            except yaml.YAMLError as exc:
                print(f"Error parsing YAML file {filepath}: {exc}")


py_filename = os.path.basename(__file__)

if __name__ == "__main__":
    main()
