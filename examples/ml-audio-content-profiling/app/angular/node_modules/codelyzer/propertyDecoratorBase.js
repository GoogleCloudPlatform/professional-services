"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var sprintf_js_1 = require("sprintf-js");
var Lint = require("tslint");
var ts = require("typescript");
var utils_1 = require("./util/utils");
var UsePropertyDecorator = (function (_super) {
    __extends(UsePropertyDecorator, _super);
    function UsePropertyDecorator(config, options) {
        var _this = _super.call(this, options) || this;
        _this.config = config;
        return _this;
    }
    UsePropertyDecorator.formatFailureString = function (config, decoratorStr, className) {
        var decoratorName = config.decoratorName, errorMessage = config.errorMessage, propertyName = config.propertyName;
        var decorators;
        if (decoratorName instanceof Array) {
            decorators = decoratorName.map(function (d) { return "\"@" + d + "\""; }).join(', ');
        }
        else {
            decorators = "\"@" + decoratorName + "\"";
        }
        return sprintf_js_1.sprintf(errorMessage, decoratorStr, className, propertyName, decorators);
    };
    UsePropertyDecorator.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new DirectiveMetadataWalker(sourceFile, this.getOptions(), this.config));
    };
    return UsePropertyDecorator;
}(Lint.Rules.AbstractRule));
exports.UsePropertyDecorator = UsePropertyDecorator;
var DirectiveMetadataWalker = (function (_super) {
    __extends(DirectiveMetadataWalker, _super);
    function DirectiveMetadataWalker(sourceFile, options, config) {
        var _this = _super.call(this, sourceFile, options) || this;
        _this.config = config;
        return _this;
    }
    DirectiveMetadataWalker.prototype.visitClassDeclaration = function (node) {
        ts.createNodeArray(node.decorators).forEach(this.validateDecorator.bind(this, node.name.text));
        _super.prototype.visitClassDeclaration.call(this, node);
    };
    DirectiveMetadataWalker.prototype.validateDecorator = function (className, decorator) {
        var argument = utils_1.getDecoratorArgument(decorator);
        var name = utils_1.getDecoratorName(decorator);
        if (name && argument && /^(Component|Directive)$/.test(name)) {
            this.validateProperty(className, name, argument);
        }
    };
    DirectiveMetadataWalker.prototype.validateProperty = function (className, decoratorName, arg) {
        var _this = this;
        if (!ts.isObjectLiteralExpression(arg)) {
            return;
        }
        arg.properties.filter(function (prop) { return prop.name.getText() === _this.config.propertyName; }).forEach(function (prop) {
            _this.addFailureAtNode(prop, UsePropertyDecorator.formatFailureString(_this.config, decoratorName, className));
        });
    };
    return DirectiveMetadataWalker;
}(Lint.RuleWalker));
