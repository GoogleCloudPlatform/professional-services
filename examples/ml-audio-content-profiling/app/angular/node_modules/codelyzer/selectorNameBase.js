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
var compiler = require("@angular/compiler");
var sprintf_js_1 = require("sprintf-js");
var Lint = require("tslint");
var ts = require("typescript");
var selectorValidator_1 = require("./util/selectorValidator");
var utils_1 = require("./util/utils");
var SelectorRule = (function (_super) {
    __extends(SelectorRule, _super);
    function SelectorRule(options) {
        var _this = _super.call(this, options) || this;
        var args = _this.getOptions().ruleArguments;
        var type = args[0] || ['element', 'attribute'];
        if (!(type instanceof Array)) {
            type = [type];
        }
        var internal = [];
        if (type.indexOf('element') >= 0) {
            internal.push('element');
        }
        if (type.indexOf('attribute') >= 0) {
            internal.push('attrs');
        }
        _this.types = internal;
        var prefix = args[1] || [];
        if (!(prefix instanceof Array)) {
            prefix = [prefix];
        }
        _this.prefixes = prefix;
        var style = args[2];
        if (!(style instanceof Array)) {
            style = [style];
        }
        _this.style = style;
        return _this;
    }
    SelectorRule.prototype.validateType = function (selectors) {
        return this.getValidSelectors(selectors).length > 0;
    };
    SelectorRule.prototype.validateStyle = function (selectors) {
        var _this = this;
        return this.getValidSelectors(selectors).some(function (selector) {
            return _this.style.some(function (style) {
                var validator = selectorValidator_1.SelectorValidator.camelCase;
                if (style === 'kebab-case') {
                    validator = selectorValidator_1.SelectorValidator.kebabCase;
                }
                return validator(selector);
            });
        });
    };
    SelectorRule.prototype.validatePrefix = function (selectors) {
        var _this = this;
        return this.getValidSelectors(selectors).some(function (selector) { return !_this.prefixes.length || _this.prefixes.some(function (p) { return _this.style.some(function (s) { return selectorValidator_1.SelectorValidator.prefix(p, s)(selector); }); }); });
    };
    SelectorRule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new SelectorValidatorWalker(sourceFile, this));
    };
    SelectorRule.prototype.getValidSelectors = function (selectors) {
        var _this = this;
        return [].concat.apply([], selectors.map(function (selector) {
            return [].concat.apply([], _this.types
                .map(function (t) {
                var prop = selector[t];
                if (prop && !(prop instanceof Array)) {
                    prop = [prop];
                }
                return prop;
            })
                .filter(Boolean));
        }));
    };
    return SelectorRule;
}(Lint.Rules.AbstractRule));
exports.SelectorRule = SelectorRule;
var SelectorValidatorWalker = (function (_super) {
    __extends(SelectorValidatorWalker, _super);
    function SelectorValidatorWalker(sourceFile, rule) {
        var _this = _super.call(this, sourceFile, rule.getOptions()) || this;
        _this.rule = rule;
        return _this;
    }
    SelectorValidatorWalker.prototype.visitClassDeclaration = function (node) {
        ts.createNodeArray(node.decorators).forEach(this.validateDecorator.bind(this, node.name.text));
        _super.prototype.visitClassDeclaration.call(this, node);
    };
    SelectorValidatorWalker.prototype.validateDecorator = function (className, decorator) {
        var argument = utils_1.getDecoratorArgument(decorator);
        var name = utils_1.getDecoratorName(decorator);
        if (this.rule.handleType === name) {
            this.validateSelector(className, argument);
        }
    };
    SelectorValidatorWalker.prototype.validateSelector = function (className, arg) {
        var _this = this;
        if (!ts.isObjectLiteralExpression(arg)) {
            return;
        }
        arg.properties
            .filter(function (prop) { return ts.isPropertyAssignment(prop) && _this.validateProperty(prop); })
            .map(function (prop) { return (ts.isPropertyAssignment(prop) ? prop.initializer : undefined); })
            .filter(Boolean)
            .forEach(function (i) {
            var selectors = _this.extractMainSelector(i);
            var error;
            if (!_this.rule.validateType(selectors)) {
                error = sprintf_js_1.sprintf(_this.rule.getTypeFailure(), className, _this.rule.getOptions().ruleArguments[0]);
            }
            else if (!_this.rule.validateStyle(selectors)) {
                var name_1 = _this.rule.getOptions().ruleArguments[2];
                if (name_1 === 'kebab-case') {
                    name_1 += ' and include dash';
                }
                error = sprintf_js_1.sprintf(_this.rule.getStyleFailure(), className, name_1);
            }
            else if (!_this.rule.validatePrefix(selectors)) {
                error = sprintf_js_1.sprintf(_this.rule.getPrefixFailure(_this.rule.prefixes), className, _this.rule.prefixes.join(', '));
            }
            if (error) {
                _this.addFailureAtNode(i, error);
            }
        });
    };
    SelectorValidatorWalker.prototype.validateProperty = function (p) {
        return utils_1.isStringLiteralLike(p.initializer) && ts.isIdentifier(p.name) && p.name.text === 'selector';
    };
    SelectorValidatorWalker.prototype.extractMainSelector = function (expression) {
        return compiler.CssSelector.parse(expression.text);
    };
    return SelectorValidatorWalker;
}(Lint.RuleWalker));
exports.SelectorValidatorWalker = SelectorValidatorWalker;
