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

"""Example use make_iap_request.py sample."""

import argparse
import make_iap_request as iap


def main():
  """main function that calls make_iap_requst function.

     Args:
       url: The url of a resource sitting behind
            identity-aware proxy
       iapClientId: The client id of the IAP service account
     Returns:
           The page body, or raises an exception if the
           page couldn't be retrieved.
  """
  parser = argparse.ArgumentParser()
  parser.add_argument("url", help="the url of a resource "
                                  "sitting behind identity-aware proxy")
  parser.add_argument("iapClientId", help="the client id of "
                                          "the IAP service account")
  args = parser.parse_args()
  print iap.make_iap_request(args.url, args.iapClientId)

if __name__ == "__main__":
  main()

