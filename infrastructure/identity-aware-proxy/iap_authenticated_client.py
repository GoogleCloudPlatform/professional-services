# Copyright 2017 Google Inc. All Rights Reserved.
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

"""Example making GET request to IAP resource."""

import argparse
import make_iap_request as iap


def main():
  """This main function calls the make_iap_request function which is defined
     in https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/make_iap_request.py
     and then prints the output of the function. The make_iap_request function
     demonstrates how to authenticate to Identity-Aware Proxy using a service
     account.

     Returns:
      The page body, or raises an exception if the page couldn't be retrieved.

  """
  parser = argparse.ArgumentParser()
  parser.add_argument("url", help="The url of a resource "
                                  "sitting behind identity-aware proxy.")
  parser.add_argument("iapClientId", help="The Client ID of "
                                          "the IAP OAuth Client.")
  args = parser.parse_args()
  page_body = iap.make_iap_request(args.url, args.iapClientId)
  print page_body
  return page_body

if __name__ == "__main__":
  main()

