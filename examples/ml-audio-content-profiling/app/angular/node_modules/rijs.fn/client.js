module.exports = function(ripple, {dir: dir = "."} = {}) {
    return log("creating"), ripple.require = (res => module => {
        if (module in res.headers.dependencies && ripple.resources[res.headers.dependencies[module]]) return ripple(res.headers.dependencies[module]);
        throw new Error(`Cannot find module: ${module} for ${res.name}`);
    }), ripple.types["application/javascript"] = {
        header: header,
        selector: res => `${res.name},[is~="${res.name}"]`,
        extract: el => (attr("is")(el) || "").split(" ").concat(lo(el.nodeName)),
        ext: "*.js",
        shortname: path => basename(path).split(".").slice(0, -1).join("."),
        check: res => is.fn(res.body),
        load: !1,
        parse: res => {
            if ("cjs" == res.headers.format) {
                const m = {
                    exports: {}
                };
                res.body(m, m.exports, ripple.require(res), {
                    env: {}
                }), res.body = m.exports;
            }
            return res;
        }
    }, ripple;
};

const bresolve = (module, parent) => resolve.sync(module, {
    filename: parent
}), log = require("utilise/log")("[ri/types/fn]"), client = require("utilise/client"), merge = require("utilise/merge"), attr = require("utilise/attr"), key = require("utilise/key"), is = require("utilise/is"), lo = require("utilise/lo"), fn = require("utilise/fn"), header = "application/javascript";

var relative, basename, resolve, file, values, keys;
