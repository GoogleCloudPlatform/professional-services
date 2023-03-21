# Copyright 2022 Google Inc.
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

project_id              = "%%PROJECT_ID%%"
app_id                  = "dscs-%%LABEL_KEY%%-%%LABEL_VAL%%-%%PRIMARY_SIZE%%-%%SECONDARY_SIZE%%"
region                  = "%%REGION%%"
service_account_email   = "%%PROJECT_NUMBER%%-compute@developer.gserviceaccount.com"
schedule                = "%%SCHEDULE%%"
primary_size            = "%%PRIMARY_SIZE%%"
secondary_size          = "%%SECONDARY_SIZE%%"
label_key               = "%%LABEL_KEY%%"
label_val               = "%%LABEL_VAL%%"