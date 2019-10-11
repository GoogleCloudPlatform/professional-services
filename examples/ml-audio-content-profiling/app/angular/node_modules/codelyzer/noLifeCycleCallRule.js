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
var ts = require("typescript");
var ngWalker_1 = require("./angular/ngWalker");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ExpressionCallMetadataWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        description: 'Disallows explicit calls to life cycle hooks.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: 'Explicit calls to life cycle hooks could be confusing. Invoke life cycle hooks is the responsability of Angular.',
        ruleName: 'no-life-cycle-call',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Avoid explicit calls to life cycle hooks.';
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
exports.lifecycleHooksMethods = new Set([
    'ngAfterContentChecked',
    'ngAfterContentInit',
    'ngAfterViewChecked',
    'ngAfterViewInit',
    'ngDoCheck',
    'ngOnChanges',
    'ngOnDestroy',
    'ngOnInit'
]);
var ExpressionCallMetadataWalker = (function (_super) {
    __extends(ExpressionCallMetadataWalker, _super);
    function ExpressionCallMetadataWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ExpressionCallMetadataWalker.prototype.visitCallExpression = function (node) {
        this.validateCallExpression(node);
        _super.prototype.visitCallExpression.call(this, node);
    };
    ExpressionCallMetadataWalker.prototype.validateCallExpression = function (node) {
        var name = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : undefined;
        var expression = ts.isPropertyAccessExpression(node.expression) ? node.expression.expression : undefined;
        var isSuperCall = expression && expression.kind === ts.SyntaxKind.SuperKeyword;
        var isLifecycleCall = name && ts.isIdentifier(name) && exports.lifecycleHooksMethods.has(name.text);
        if (isLifecycleCall && !isSuperCall) {
            this.addFailureAtNode(node, Rule.FAILURE_STRING);
        }
    };
    return ExpressionCallMetadataWalker;
}(ngWalker_1.NgWalker));
exports.ExpressionCallMetadataWalker = ExpressionCallMetadataWalker;
