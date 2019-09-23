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
var lib_1 = require("tslint/lib");
var ngWalker_1 = require("./angular/ngWalker");
var basicTemplateAstVisitor_1 = require("./angular/templates/basicTemplateAstVisitor");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ngWalker_1.NgWalker(sourceFile, this.getOptions(), {
            templateVisitorCtrl: TemplateConditionalComplexityVisitor
        }));
    };
    Rule.prototype.isEnabled = function () {
        var _a = Rule.metadata.options, maxLength = _a.maxLength, minLength = _a.minLength;
        var _b = this.ruleArguments, length = _b.length, maxComplexity = _b[0];
        return _super.prototype.isEnabled.call(this) && length >= minLength && length <= maxLength && (maxComplexity === undefined || maxComplexity > 0);
    };
    Rule.metadata = {
        description: "Checks cyclomatic complexity against a specified limit. It is a quantitative measure of the number of linearly independent paths through a program's source code",
        optionExamples: [true, [true, 6]],
        options: {
            items: {
                type: 'string'
            },
            maxLength: 1,
            minLength: 0,
            type: 'array'
        },
        optionsDescription: 'Determine the maximum number of the cyclomatic complexity.',
        rationale: 'Cyclomatic complexity over some threshold indicates that the logic should be moved outside the template.',
        ruleName: 'template-cyclomatic-complexity',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = "The cyclomatic complexity exceeded the defined limit (cost '%s'). Your template should be refactored.";
    Rule.DEFAULT_MAX_COMPLEXITY = 5;
    return Rule;
}(lib_1.Rules.AbstractRule));
exports.Rule = Rule;
exports.getFailureMessage = function (maxComplexity) {
    if (maxComplexity === void 0) { maxComplexity = Rule.DEFAULT_MAX_COMPLEXITY; }
    return sprintf_js_1.sprintf(Rule.FAILURE_STRING, maxComplexity);
};
var TemplateConditionalComplexityVisitor = (function (_super) {
    __extends(TemplateConditionalComplexityVisitor, _super);
    function TemplateConditionalComplexityVisitor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.totalComplexity = 0;
        return _this;
    }
    TemplateConditionalComplexityVisitor.prototype.visitDirectiveProperty = function (prop, context) {
        this.validateDirective(prop);
        _super.prototype.visitDirectiveProperty.call(this, prop, context);
    };
    TemplateConditionalComplexityVisitor.prototype.validateDirective = function (prop) {
        var pattern = /^ng(ForOf|If|Switch(Case|Default))$/;
        var templateName = prop.templateName;
        if (pattern.test(templateName)) {
            this.totalComplexity++;
        }
        var maxComplexity = this.getOptions()[0] || Rule.DEFAULT_MAX_COMPLEXITY;
        if (this.totalComplexity <= maxComplexity) {
            return;
        }
        var _a = prop.sourceSpan, endOffset = _a.end.offset, startOffset = _a.start.offset;
        this.addFailureFromStartToEnd(startOffset, endOffset, exports.getFailureMessage(maxComplexity));
    };
    return TemplateConditionalComplexityVisitor;
}(basicTemplateAstVisitor_1.BasicTemplateAstVisitor));
