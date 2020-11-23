/* WARNING! You might end up with a HUGE graph. */
var nodes = [];
var follow = function (n, depth) {
    var out = n.tag("parent").out("child");
    if (out.count() == 0) {
        return;
    }
    nodes = nodes.concat(out.tagArray());
    follow(out, depth + 1);
};


var root = g.V("{{ index .Organizations 0 }}");
follow(root, 1);
root.tagArray().concat(nodes).forEach(function (node) {
    g.emit(node);
});
