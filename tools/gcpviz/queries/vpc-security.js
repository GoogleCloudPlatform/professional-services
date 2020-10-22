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
