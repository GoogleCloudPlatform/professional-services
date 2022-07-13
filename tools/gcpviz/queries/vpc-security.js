/*
#   Copyright 2022 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
*/
var resourceTypes = [
    "cloudresourcemanager.googleapis.com/Project"
    "compute.googleapis.com/Network",
    "compute.googleapis.com/Firewall",
    "iam.googleapis.com/ServiceAccount",
];

var nodes = [];
var follow = function (n, depth) {
    var out = n.tag("parent").labelContext(resourceTypes, "type").out("child");
    if (out.count() == 0) {
        return;
    }
    nodes = nodes.concat(out.tagArray());
    follow(out, depth + 1);
};

var root = g.V("{{ .project }}");
follow(root, 1);
root.tagArray().concat(nodes).forEach(function (node) {
    g.emit(node);
});
