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
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var sprintf_js_1 = require("sprintf-js");
var Lint = require("tslint");
var ts = require("typescript");
var ngWalker_1 = require("./angular/ngWalker");
var selectorValidator_1 = require("./util/selectorValidator");
var utils_1 = require("./util/utils");
var OPTION_ATTRIBUTE = 'attribute';
var OPTION_CAMEL_CASE = 'camelCase';
var OPTION_KEBAB_CASE = 'kebab-case';
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule(options) {
        var _this = _super.call(this, options) || this;
        var args = options.ruleArguments;
        if (!(args instanceof Array)) {
            args = [args];
        }
        if (args[0] === OPTION_CAMEL_CASE) {
            _this.validator = selectorValidator_1.SelectorValidator.camelCase;
        }
        if (args.length > 1) {
            _this.hasPrefix = true;
            var prefixExpression = (args.slice(1) || []).join('|');
            _this.prefix = (args.slice(1) || []).join(',');
            _this.prefixChecker = selectorValidator_1.SelectorValidator.prefix(prefixExpression, OPTION_CAMEL_CASE);
        }
        return _this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ClassMetadataWalker(sourceFile, this));
    };
    Rule.prototype.isEnabled = function () {
        var minLength = Rule.metadata.options.minLength;
        var length = this.ruleArguments.length;
        return _super.prototype.isEnabled.call(this) && length >= minLength;
    };
    Rule.prototype.validateName = function (name) {
        return this.validator(name);
    };
    Rule.prototype.validatePrefix = function (prefix) {
        return this.prefixChecker(prefix);
    };
    Rule.metadata = {
        deprecationMessage: "You can name your pipes only " + OPTION_CAMEL_CASE + ". If you try to use snake-case then your application will not compile. For prefix validation use pipe-prefix rule.",
        description: 'Enforce consistent case and prefix for pipes.',
        optionExamples: [
            [true, OPTION_CAMEL_CASE, 'myPrefix'],
            [true, OPTION_CAMEL_CASE, 'myPrefix', 'myOtherPrefix'],
            [true, OPTION_KEBAB_CASE, 'my-prefix']
        ],
        options: {
            items: [
                {
                    enum: [OPTION_KEBAB_CASE, OPTION_ATTRIBUTE]
                },
                {
                    type: 'string'
                }
            ],
            minLength: 1,
            type: 'array'
        },
        optionsDescription: Lint.Utils.dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      * The first item in the array is `", "` or `", "`, which allows you to pick a case.\n      * The rest of the arguments are supported prefixes (given as strings). They are optional.\n    "], ["\n      * The first item in the array is \\`", "\\` or \\`", "\\`, which allows you to pick a case.\n      * The rest of the arguments are supported prefixes (given as strings). They are optional.\n    "])), OPTION_CAMEL_CASE, OPTION_KEBAB_CASE),
        rationale: 'Consistent conventions make it easy to quickly identify and reference assets of different types.',
        ruleName: 'pipe-naming',
        type: 'style',
        typescriptOnly: true
    };
    Rule.FAILURE_WITHOUT_PREFIX = "The name of the Pipe decorator of class %s should be named " + OPTION_CAMEL_CASE + ", however its value is \"%s\"";
    Rule.FAILURE_WITH_PREFIX = "The name of the Pipe decorator of class %s should be named " + OPTION_CAMEL_CASE + " with prefix %s, however its value is \"%s\"";
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var ClassMetadataWalker = (function (_super) {
    __extends(ClassMetadataWalker, _super);
    function ClassMetadataWalker(sourceFile, rule) {
        var _this = _super.call(this, sourceFile, rule.getOptions()) || this;
        _this.rule = rule;
        return _this;
    }
    ClassMetadataWalker.prototype.visitNgPipe = function (controller, decorator) {
        var className = controller.name.text;
        this.validateProperties(className, decorator);
        _super.prototype.visitNgPipe.call(this, controller, decorator);
    };
    ClassMetadataWalker.prototype.validateProperties = function (className, pipe) {
        var argument = utils_1.getDecoratorArgument(pipe);
        argument.properties
            .filter(function (p) { return p.name && ts.isIdentifier(p.name) && p.name.text === 'name'; })
            .forEach(this.validateProperty.bind(this, className));
    };
    ClassMetadataWalker.prototype.validateProperty = function (className, property) {
        var initializer = ts.isPropertyAssignment(property) ? property.initializer : undefined;
        if (initializer && ts.isStringLiteral(initializer)) {
            var propName = initializer.text;
            var isValidName = this.rule.validateName(propName);
            var isValidPrefix = this.rule.hasPrefix ? this.rule.validatePrefix(propName) : true;
            if (!isValidName || !isValidPrefix) {
                this.addFailureAtNode(property, this.getFailureMessage(className, propName));
            }
        }
    };
    ClassMetadataWalker.prototype.getFailureMessage = function (className, pipeName) {
        if (this.rule.hasPrefix) {
            return sprintf_js_1.sprintf(Rule.FAILURE_WITH_PREFIX, className, this.rule.prefix, pipeName);
        }
        return sprintf_js_1.sprintf(Rule.FAILURE_WITHOUT_PREFIX, className, pipeName);
    };
    return ClassMetadataWalker;
}(ngWalker_1.NgWalker));
exports.ClassMetadataWalker = ClassMetadataWalker;
var templateObject_1;
