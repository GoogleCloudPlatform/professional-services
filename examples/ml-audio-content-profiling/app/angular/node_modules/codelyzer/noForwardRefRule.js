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
var typescript_1 = require("typescript/lib/typescript");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ExpressionCallMetadataWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        description: 'Disallows usage of forward references for DI.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: 'The flow of DI is disrupted by using `forwardRef` and might make code more difficult to understand.',
        ruleName: 'no-forward-ref',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING_CLASS = 'Avoid using forwardRef in class "%s"';
    Rule.FAILURE_STRING_VARIABLE = 'Avoid using forwardRef in variable "%s"';
    return Rule;
}(lib_1.Rules.AbstractRule));
exports.Rule = Rule;
var ExpressionCallMetadataWalker = (function (_super) {
    __extends(ExpressionCallMetadataWalker, _super);
    function ExpressionCallMetadataWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ExpressionCallMetadataWalker.prototype.visitCallExpression = function (node) {
        this.validateCallExpression(node);
        _super.prototype.visitCallExpression.call(this, node);
    };
    ExpressionCallMetadataWalker.prototype.validateCallExpression = function (callExpression) {
        if (callExpression.expression.text === 'forwardRef') {
            var currentNode = callExpression;
            while (currentNode.parent.parent) {
                currentNode = currentNode.parent;
            }
            var failure = currentNode.kind === typescript_1.SyntaxKind.VariableStatement
                ? sprintf_js_1.sprintf(Rule.FAILURE_STRING_VARIABLE, currentNode.declarationList.declarations[0].name.text)
                : sprintf_js_1.sprintf(Rule.FAILURE_STRING_CLASS, currentNode.name.text);
            this.addFailureAtNode(callExpression, failure);
        }
    };
    return ExpressionCallMetadataWalker;
}(lib_1.RuleWalker));
exports.ExpressionCallMetadataWalker = ExpressionCallMetadataWalker;
