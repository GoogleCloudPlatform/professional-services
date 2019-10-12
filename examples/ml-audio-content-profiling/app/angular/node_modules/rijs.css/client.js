module.exports = function(ripple) {
    return log("creating"), ripple.types["text/css"] = {
        header: "text/css",
        ext: "*.css",
        selector: res => `[css~="${res.name}"]`,
        extract: el => (attr("css")(el) || "").split(" "),
        check: res => includes(".css")(res.name),
        shortname: path => basename(path),
        load: !1,
        parse: res => (res.headers.hash = res.headers.hash || hash(res.body), res)
    }, ripple;
};

const log = require("utilise/log")("[ri/types/css]"), includes = require("utilise/includes"), client = require("utilise/client"), attr = require("utilise/attr"), hash = require("djbx");

var basename, file;
