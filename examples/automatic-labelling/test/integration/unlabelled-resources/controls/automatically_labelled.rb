# frozen_string_literal: true

# Copyright 2018 Google Inc.
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

require "json"

control "automatically labelled" do
  describe google_compute_instance(
    project: ENV.fetch("GOOGLE_PROJECT"),
    zone: ENV.fetch("GOOGLE_ZONE"),
    name: "unlabelled",
  ) do
    let :principal_email do
      JSON.parse(File.read(ENV.fetch("GOOGLE_APPLICATION_CREDENTIALS"))).fetch("client_email").split("@").first
    end

    it "should be labelled automatically by the Cloud Functions function" do
      expect(subject.label_value_by_key("principal-email")).to eq principal_email
    end
  end
end
