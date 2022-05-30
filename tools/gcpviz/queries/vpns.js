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

var containerResourceTypes = [
    "cloudresourcemanager.googleapis.com/Organization",
    "cloudresourcemanager.googleapis.com/Folder",
    "cloudresourcemanager.googleapis.com/Project",
];
var wantedResourceTypes = [
    "compute.googleapis.com/Network",
    "compute.googleapis.com/Router",
    "compute.googleapis.com/VpnTunnel",
    "compute.googleapis.com/VpnGateway",
    "compute.googleapis.com/TargetVpnGateway",
];
var resourceTypes = containerResourceTypes.concat(wantedResourceTypes);

var nodes = [];
var follow = function (n, depth) {
    var out = n.tag("parent").labelContext(resourceTypes, "type").out("child");
    if (out.count() == 0) {
        return;
    }
    nodes = nodes.concat(out.tagArray());
    follow(out, depth + 1);
};

// Filters disconnected vertexes from results
var filterEmptyNodes = function (nodes) {
    var filteredNodes = [];
    var m = g.Morphism().labelContext(resourceTypes, "type").in(["child", "uses"]);
    nodes.forEach(function (node) {
        if (wantedResourceTypes.indexOf(node.type) > -1) {
            if (g.V(node.id).follow(m).count() > 0) {
                filteredNodes.push(node);
            }
        } else {
            filteredNodes.push(node);
        }
    });
    return filteredNodes;
}

// Filters empty projects from results
var filterEmptyProjects = function (nodes) {
    var filteredNodes = [];
    var projectM = g.Morphism().labelContext(resourceTypes, "type").in(["child", "uses"]);
    nodes.forEach(function (node) {
        if (node.type == "cloudresourcemanager.googleapis.com/Project") {
            if (g.V(node.id).follow(projectM).count() > 1) {
                filteredNodes.push(node);
            }
        } else {
            filteredNodes.push(node);
        }
    });
    return filteredNodes;
}

var filterEmptyNodes = function (nodeType, nodes) {
    var filteredNodes = [];
    nodes.forEach(function (node) {
        if (node.type == nodeType) {
            var subNodes = g.V(node.id).labelContext(resourceTypes, "type").in(["uses"])
            if (subNodes.count() > 0) {
                filteredNodes.push(node);
            }
        } else {
            filteredNodes.push(node);
        }
    });
    return filteredNodes;
}

// Filters empty folders from results
var filterEmptyFolders = function (nodes) {
    var folderMap = {};
    var folderItemCount = {};
    var filteredNodes = [];

    nodes.forEach(function (node) {
        if (containerResourceTypes.indexOf(node.type) > -1) {
            folderMap[node.id] = node;
            if (node.type == "cloudresourcemanager.googleapis.com/Folder") {
                folderItemCount[node.id] = 0;
            }
        }
    });

    nodes.forEach(function (node) {
        if (node.type == "cloudresourcemanager.googleapis.com/Project") {
            var iNode = node;
            while (iNode && iNode.parent in folderMap) {
                folderItemCount[iNode.parent] += 1;
                iNode = folderMap[iNode.parent];
            }
        }
    });

    nodes.forEach(function (node) {
        if (node.type == "cloudresourcemanager.googleapis.com/Folder") {
            if (folderItemCount[node.id] > 0) {
                filteredNodes.push(node);
            }
        } else {
            filteredNodes.push(node);
        }
    });
    return filteredNodes;
}

var followSharedVpc = function (n, depth) {
    var out = n.tag("parent").labelContext(resourceTypes, "type").out("child");
    if (out.count() == 0) {
        return;
    }
    nodes = nodes.concat(out.tagArray());
    follow(out, depth + 1);
};

var root = g.V("{{ index .Organizations 0 }}");
follow(root, 1);
filterEmptyFolders(filterEmptyProjects(filterEmptyNodes("compute.googleapis.com/Network", root.tagArray().concat(nodes)))).forEach(function (node) {
    g.emit(node);
});
