# Copyright 2026 Google LLC
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




def get_params_from_msg(last_user_message):
    # e.g.: project_id=your-project-id,dataset_id=your_dataset,gcs_folder=20250807102755
    params = last_user_message.split(",")
    project_id, dataset_id, gcs_folder = None, None, None
    if len(params) != 3:
        return project_id, dataset_id, gcs_folder
    for param in params:
        if "=" not in param:
            break
        if param.split("=")[0] == "project_id":
            project_id = param.split("=")[1]
            continue
        if param.split("=")[0] == "dataset_id":
            dataset_id = param.split("=")[1]
            continue
        if param.split("=")[0] == "gcs_folder":
            gcs_folder = param.split("=")[1]
            continue
    print("project_id, dataset_id, gcs_folder", project_id, dataset_id, gcs_folder)
    return project_id, dataset_id, gcs_folder
