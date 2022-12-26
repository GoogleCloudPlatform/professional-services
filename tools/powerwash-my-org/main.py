# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from utils import helpers, api, tui

if __name__ == '__main__':
    tui.print_section_title("Setup")
    helpers.load_variables()
    helpers.get_org_policies()
    helpers.reset_org_policies()
    helpers.create_bootstrap_project()
    helpers.create_service_account()

    tui.print_section_title("Resources")
    helpers.delete_projects_and_folders()

    tui.print_section_title("Organization policies")
    helpers.set_new_org_policies()

    tui.print_section_title("IAM Policies")
    iam_policies = api.get_iam_policies()
    updated_iam_policies = helpers.update_iam_bindings(iam_policies)
    api.update_iam_policies(updated_iam_policies)

    tui.print_section_title("Cleanup")
    helpers.cleanup_bootstrap_project()
