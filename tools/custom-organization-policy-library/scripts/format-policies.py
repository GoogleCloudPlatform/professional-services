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

import yaml, os, sys


def main():
    if len(sys.argv) < 2:
        print(f"Usage: python3 {py_filename} <source_yaml> <output_dir>")
        return

    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    print(
        f"[{py_filename}] processing: {input_file}, output directory: {output_dir}"
    )

    with open(input_file, "r") as infile:
        for i, doc in enumerate(yaml.safe_load_all(infile)):
            filename = doc.get("filename", "file_not_found")
            directory = doc.get("service", "dir_not_found")
            del doc["filename"]
            del doc["service"]

            os.makedirs(f"{output_dir}/{directory}", exist_ok=True)

            output_file = f"{output_dir}/{directory}/{filename}"
            with open(output_file, "w") as outfile:
                print(f"[{py_filename}] creating: {output_file}")
                yaml.dump(doc, outfile)


py_filename = os.path.basename(__file__)

if __name__ == "__main__":
    main()
