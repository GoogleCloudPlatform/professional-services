/*
 * This is an example for rendering one project and its shared VPC project. Pass the projects as a query parameters
 * from the command line: -query-parameter \ 
 *   "project=//cloudresourcemanager.googleapis.com/projects/12345678901234,sharedvpcproject=//cloudres..."
 */

var resourceTypes = [
    "cloudresourcemanager.googleapis.com/Project",
    "compute.googleapis.com/Network",
    "iam.googleapis.com/ServiceAccount",
];

var sharedVpcResourceTypes = [
    "cloudresourcemanager.googleapis.com/Project",
    "compute.googleapis.com/Network",
    "compute.googleapis.com/Firewall",
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
var followSharedVpc = function (n, depth) {
    var out = n.tag("parent").labelContext(sharedVpcResourceTypes, "type").out("child");
    if (out.count() == 0) {
        return;
    }
    nodes = nodes.concat(out.tagArray());
    follow(out, depth + 1);
};

if ("{{ .sharedvpcproject }}" != "") {
    var svpcRoot = g.V("{{ .sharedvpcproject }}").tag("parent");
    nodes = svpcRoot.tagArray();
    followSharedVpc(svpcRoot, 1);
}

var root = g.V("{{ .project }}").tag("parent");
follow(root, 1);
root.tagArray().concat(nodes).forEach(function (node) {
    g.emit(node);
});
