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
var compiler_1 = require("@angular/compiler");
var lib_1 = require("tslint/lib");
var ngWalker_1 = require("./angular/ngWalker");
var recursiveAngularExpressionVisitor_1 = require("./angular/templates/recursiveAngularExpressionVisitor");
var unstrictEqualityOperator = '==';
var isAsyncBinding = function (ast) {
    return ast instanceof compiler_1.BindingPipe && ast.name === 'async';
};
var TemplateToNgTemplateVisitor = (function (_super) {
    __extends(TemplateToNgTemplateVisitor, _super);
    function TemplateToNgTemplateVisitor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TemplateToNgTemplateVisitor.prototype.visitBinary = function (ast, context) {
        this.validateBinary(ast);
        _super.prototype.visitBinary.call(this, ast, context);
    };
    TemplateToNgTemplateVisitor.prototype.visitPrefixNot = function (ast, context) {
        this.validatePrefixNot(ast);
        _super.prototype.visitPrefixNot.call(this, ast, context);
    };
    TemplateToNgTemplateVisitor.prototype.validateBinary = function (ast) {
        var left = ast.left, operation = ast.operation, right = ast.right;
        if (!isAsyncBinding(left) || !(right instanceof compiler_1.LiteralPrimitive) || right.value !== false || operation !== unstrictEqualityOperator) {
            return;
        }
        this.generateFailure(ast, Rule.FAILURE_STRING_UNSTRICT_EQUALITY);
    };
    TemplateToNgTemplateVisitor.prototype.validatePrefixNot = function (ast) {
        var expression = ast.expression;
        if (!isAsyncBinding(expression)) {
            return;
        }
        this.generateFailure(ast, Rule.FAILURE_STRING_NEGATED_PIPE);
    };
    TemplateToNgTemplateVisitor.prototype.generateFailure = function (ast, errorMessage) {
        var _a = ast.span, spanEnd = _a.end, spanStart = _a.start;
        this.addFailureFromStartToEnd(spanStart, spanEnd, errorMessage);
    };
    return TemplateToNgTemplateVisitor;
}(recursiveAngularExpressionVisitor_1.RecursiveAngularExpressionVisitor));
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ngWalker_1.NgWalker(sourceFile, this.getOptions(), {
            expressionVisitorCtrl: TemplateToNgTemplateVisitor
        }));
    };
    Rule.metadata = {
        description: 'Ensures that strict equality is used when evaluating negations on async pipe output.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: lib_1.Utils.dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      Async pipe evaluate to `null` before the observable or promise emits, which can lead to layout thrashing as\n      components load. Prefer strict `=== false` checks instead.\n    "], ["\n      Async pipe evaluate to \\`null\\` before the observable or promise emits, which can lead to layout thrashing as\n      components load. Prefer strict \\`=== false\\` checks instead.\n    "]))),
        ruleName: 'templates-no-negated-async',
        type: 'functionality',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING_NEGATED_PIPE = 'Async pipes can not be negated, use (observable | async) === false instead';
    Rule.FAILURE_STRING_UNSTRICT_EQUALITY = 'Async pipes must use strict equality `===` when comparing with `false`';
    return Rule;
}(lib_1.Rules.AbstractRule));
exports.Rule = Rule;
var templateObject_1;
