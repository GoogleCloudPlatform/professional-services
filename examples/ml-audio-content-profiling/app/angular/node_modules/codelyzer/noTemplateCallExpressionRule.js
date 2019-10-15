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
var Lint = require("tslint");
var ngWalker_1 = require("./angular/ngWalker");
var basicTemplateAstVisitor_1 = require("./angular/templates/basicTemplateAstVisitor");
var recursiveAngularExpressionVisitor_1 = require("./angular/templates/recursiveAngularExpressionVisitor");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        var walkerConfig = {
            expressionVisitorCtrl: ExpressionVisitor,
            templateVisitorCtrl: TemplateVisitor
        };
        return this.applyWithWalker(new ngWalker_1.NgWalker(sourceFile, this.getOptions(), walkerConfig));
    };
    Rule.metadata = {
        description: 'Call expressions are not allowed in templates except in output handlers.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: 'The change detector will call functions used in templates very often. Use an observable instead.',
        ruleName: 'no-template-call-expression',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Call expressions are not allowed in templates except in output handlers';
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var TemplateVisitor = (function (_super) {
    __extends(TemplateVisitor, _super);
    function TemplateVisitor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TemplateVisitor.prototype.visitEvent = function () { };
    return TemplateVisitor;
}(basicTemplateAstVisitor_1.BasicTemplateAstVisitor));
var ExpressionVisitor = (function (_super) {
    __extends(ExpressionVisitor, _super);
    function ExpressionVisitor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ExpressionVisitor.prototype.visitFunctionCall = function (node, context) {
        this.addFailureFromStartToEnd(node.span.start, node.span.end, Rule.FAILURE_STRING);
        _super.prototype.visitFunctionCall.call(this, node, context);
    };
    ExpressionVisitor.prototype.visitMethodCall = function (node, context) {
        this.addFailureFromStartToEnd(node.span.start, node.span.end, Rule.FAILURE_STRING);
        _super.prototype.visitMethodCall.call(this, node, context);
    };
    return ExpressionVisitor;
}(recursiveAngularExpressionVisitor_1.RecursiveAngularExpressionVisitor));
