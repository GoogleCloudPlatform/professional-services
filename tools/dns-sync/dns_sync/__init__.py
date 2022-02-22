# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Application to sync a Cloud DNS zone with GCE resources.

Web application that receives events from a pub/sub subscription subscribed to
a topic that's the target of a Stackdriver logs export sink of compute engine
activity such as instance and forwardingRule creation. The subscription and
Cloud DNS zones can be in a different project then this application, we can
also process events from multiple projects and sync multiple Cloud DNS zones.
"""
