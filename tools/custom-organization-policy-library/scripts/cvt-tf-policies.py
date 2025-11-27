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


def convert_terraform_factory(doc):
    if "dryRunSpec" in doc:
        print(
            f"[{py_filename}] WARNING: Dryrun mode for Terraform policies factory is not supported yet. Skipping.."
        )
        exit(0)

    try:
        tf_yaml = {}
        _, _, root_key = doc.get("name").rpartition("/")
        del doc["name"]
        tf_yaml[root_key] = doc["spec"]

        return root_key, tf_yaml

    except:
        print(f"Error converting yaml data:\n{yaml.dump(doc)}")


def main():
    if len(sys.argv) < 2:
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
                root_key, tf_yaml_data = convert_terraform_factory(yaml_data)
                output_file = f"{output_dir}/{root_key}.yaml"
                with open(output_file, "w") as outfile:
                    print(f"[{py_filename}] creating: {output_file}")
                    yaml.dump(tf_yaml_data, outfile)

            except yaml.YAMLError as exc:
                print(f"Error parsing YAML file {filepath}: {exc}")


py_filename = os.path.basename(__file__)

if __name__ == "__main__":
    main()
