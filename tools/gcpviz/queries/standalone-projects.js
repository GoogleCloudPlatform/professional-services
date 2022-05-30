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
 * This is an example for rendering "standalone" projects. It requires -resource-data flag
 * when creating the graph database.
 */

var resourceTypes = [
    "cloudresourcemanager.googleapis.com/Organization",
    "cloudresourcemanager.googleapis.com/Folder",
    "cloudresourcemanager.googleapis.com/Project",
    "compute.googleapis.com/Network",
];
var onlyStandaloneProjects = true;
var projectIdRegexp = new RegExp('/projects/([^/]+)/');
var nodes = [];


var getData = function (n) {
    var dataStr = g.V(n.id).out("data").tagValue();
    return JSON.parse(dataStr.id);
};

var follow = function (n, depth) {
    var out = n.tag("parent").labelContext(resourceTypes, "type").out("child");
    if (out.count() == 0) {
        return;
    }
    if (onlyStandaloneProjects) {
        var filteredNodes = [];
        out.forEach(function (node) {
            var nodeObj = g.V(node.id);
            if (node.type == "cloudresourcemanager.googleapis.com/Project") {
                var standaloneProject = true;
                var projectId = getData(node).resource.data.projectId;

                // Look up any IP addresses owned by the project, if any of them
                // belong to a different host, it's using a Shared VPC from another project
                var ipAddresses = nodeObj.labelContext(["compute.googleapis.com/Address"], "type").out("child").tagArray();
                if (ipAddresses.length > 0) {
                    for (var i = 0; i < ipAddresses.length; i++) {
                        var ipAddressData = getData(ipAddresses[i]);
                        if (ipAddressData.resource.data.subnetwork) {
                            var ipAddressProjectId = projectIdRegexp.exec(ipAddressData.resource.data.subnetwork)[1];
                            if (projectId != ipAddressProjectId) {
                                standaloneProject = false;
                                break;
                            }
                        }
                    }
                }

                // Check if the project is a Shared VPC host project
                var computeProject = nodeObj.labelContext(["compute.googleapis.com/Project"], "type").out("child").tagValue();
                var computeProjectData = getData(computeProject);
                if (computeProjectData.resource.data.xpnProjectStatus == "HOST") {
                    standaloneProject = false;
                }

                // Check if the networks in the project have any peerings
                var computeNetworks = nodeObj.labelContext(["compute.googleapis.com/Network"], "type").out("child").tagArray();
                computeNetworks.forEach(function (network) {
                    var networkData = getData(network);
                    if (networkData.resource.data.peerings && networkData.resource.data.peerings.length > 0) {
                        standaloneProject = false;
                    }
                });

                if (standaloneProject) {
                    filteredNodes.push(node);
                }
            } else {
                filteredNodes.push(node);
            }
        });
        nodes = nodes.concat(filteredNodes);
    } else {
        nodes = nodes.concat(out.tagArray());
    }
    follow(out, depth + 1);
};

var root = g.V("{{ index .Organizations 0 }}").tag("parent");
follow(root, 1);
root.tagArray().concat(nodes).forEach(function (node) {
    g.emit(node);
});
