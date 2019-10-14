"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var utils_1 = require("../../util/utils");
var AbstractResolver = (function () {
    function AbstractResolver() {
    }
    AbstractResolver.prototype.getTemplateUrl = function (decorator) {
        var arg = utils_1.getDecoratorArgument(decorator);
        if (!arg) {
            return undefined;
        }
        var prop = arg.properties.find(function (p) { return p.name.text === 'templateUrl' && utils_1.isStringLiteralLike(p.initializer); });
        return prop ? prop.initializer.text : undefined;
    };
    AbstractResolver.prototype.getStyleUrls = function (decorator) {
        var arg = utils_1.getDecoratorArgument(decorator);
        if (!arg) {
            return [];
        }
        var prop = arg.properties.find(function (p) { return p.name.text === 'styleUrls' && ts.isPropertyAssignment(p) && ts.isArrayLiteralExpression(p.initializer); });
        if (prop) {
            return prop.initializer.elements
                .filter(utils_1.isStringLiteralLike)
                .map(function (e) { return e.text; });
        }
        return [];
    };
    return AbstractResolver;
}());
exports.AbstractResolver = AbstractResolver;
