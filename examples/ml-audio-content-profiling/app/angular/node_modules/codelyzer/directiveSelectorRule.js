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
var lib_1 = require("tslint/lib");
var selectorNameBase_1 = require("./selectorNameBase");
var OPTION_ATTRIBUTE = 'attribute';
var OPTION_ELEMENT = 'element';
var OPTION_CAMEL_CASE = 'camelCase';
var OPTION_KEBAB_CASE = 'kebab-case';
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.handleType = 'Directive';
        return _this;
    }
    Rule.prototype.getPrefixFailure = function (prefixes) {
        if (prefixes.length === 1) {
            return 'The selector of the directive "%s" should have prefix "%s" (https://angular.io/styleguide#style-02-08)';
        }
        else {
            return 'The selector of the directive "%s" should have one of the prefixes "%s" (https://angular.io/styleguide#style-02-08)';
        }
    };
    Rule.prototype.getStyleFailure = function () {
        return 'The selector of the directive "%s" should be named %s (https://angular.io/styleguide#style-02-06)';
    };
    Rule.prototype.getTypeFailure = function () {
        return 'The selector of the directive "%s" should be used as %s (https://angular.io/styleguide#style-02-06)';
    };
    Rule.prototype.isEnabled = function () {
        var _a = Rule.metadata.options, maxLength = _a.maxLength, minLength = _a.minLength;
        var length = this.ruleArguments.length;
        return _super.prototype.isEnabled.call(this) && length >= minLength && length <= maxLength;
    };
    Rule.metadata = {
        description: 'Directive selectors should follow given naming rules.',
        descriptionDetails: 'See more at https://angular.io/styleguide#style-02-06 and https://angular.io/styleguide#style-02-08.',
        optionExamples: [
            [true, OPTION_ELEMENT, 'my-prefix', OPTION_KEBAB_CASE],
            [true, OPTION_ELEMENT, ['ng', 'ngx'], OPTION_KEBAB_CASE],
            [true, OPTION_ATTRIBUTE, 'myPrefix', OPTION_CAMEL_CASE]
        ],
        options: {
            items: [
                {
                    enum: [OPTION_ATTRIBUTE, OPTION_ELEMENT]
                },
                {
                    oneOf: [
                        {
                            items: {
                                type: 'string'
                            },
                            type: 'array'
                        },
                        {
                            type: 'string'
                        }
                    ]
                },
                {
                    enum: [OPTION_CAMEL_CASE, OPTION_KEBAB_CASE]
                }
            ],
            maxLength: 3,
            minLength: 3,
            type: 'array'
        },
        optionsDescription: lib_1.Utils.dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      Options accept three obligatory items as an array:\n      1. `", "` or `", "` forces directives either to be elements or attributes.\n      2. A single prefix (string) or array of prefixes (strings) which have to be used in directive selectors.\n      3. `", "` or `", "` allows you to pick a case.\n    "], ["\n      Options accept three obligatory items as an array:\n      1. \\`", "\\` or \\`", "\\` forces directives either to be elements or attributes.\n      2. A single prefix (string) or array of prefixes (strings) which have to be used in directive selectors.\n      3. \\`", "\\` or \\`", "\\` allows you to pick a case.\n    "])), OPTION_ELEMENT, OPTION_ATTRIBUTE, OPTION_KEBAB_CASE, OPTION_CAMEL_CASE),
        rationale: lib_1.Utils.dedent(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      * Consistent conventions make it easy to quickly identify and reference assets of different types.\n      * Makes it easier to promote and share the directive in other apps.\n      * Directives are easy to identify in the DOM.\n      * It is easier to recognize that a symbol is a directive by looking at the template's HTML.\n    "], ["\n      * Consistent conventions make it easy to quickly identify and reference assets of different types.\n      * Makes it easier to promote and share the directive in other apps.\n      * Directives are easy to identify in the DOM.\n      * It is easier to recognize that a symbol is a directive by looking at the template's HTML.\n    "]))),
        ruleName: 'directive-selector',
        type: 'style',
        typescriptOnly: true
    };
    return Rule;
}(selectorNameBase_1.SelectorRule));
exports.Rule = Rule;
var templateObject_1, templateObject_2;
