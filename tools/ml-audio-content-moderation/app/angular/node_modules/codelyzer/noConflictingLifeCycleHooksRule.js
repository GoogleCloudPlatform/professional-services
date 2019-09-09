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
var utils_1 = require("./util/utils");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ClassMetadataWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        description: 'Ensure that directives not implement conflicting life cycle hooks.',
        descriptionDetails: 'See more at https://angular.io/api/core/DoCheck#description.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: Lint.Utils.dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      A directive typically should not use both DoCheck and OnChanges to respond\n      to changes on the same input, as ngOnChanges will continue to be called when the\n      default change detector detects changes.\n    "], ["\n      A directive typically should not use both DoCheck and OnChanges to respond\n      to changes on the same input, as ngOnChanges will continue to be called when the\n      default change detector detects changes.\n    "]))),
        ruleName: 'no-conflicting-life-cycle-hooks',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Implement DoCheck and OnChanges hooks in class %s is not recommended';
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var hooksPrefix = 'ng';
var lifecycleHooksMethods = ['DoCheck', 'OnChanges'];
var ClassMetadataWalker = (function (_super) {
    __extends(ClassMetadataWalker, _super);
    function ClassMetadataWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClassMetadataWalker.prototype.visitClassDeclaration = function (node) {
        this.validateInterfaces(node);
        this.validateMethods(node);
        _super.prototype.visitClassDeclaration.call(this, node);
    };
    ClassMetadataWalker.prototype.validateInterfaces = function (node) {
        var heritageClauses = node.heritageClauses;
        if (!heritageClauses) {
            return;
        }
        var interfacesClauses = heritageClauses.find(function (h) { return h.token === ts.SyntaxKind.ImplementsKeyword; });
        if (!interfacesClauses) {
            return;
        }
        var interfaces = interfacesClauses.types.map(utils_1.getSymbolName);
        var matchesAllHooks = lifecycleHooksMethods.every(function (l) { return interfaces.indexOf(l) !== -1; });
        if (matchesAllHooks) {
            this.addFailureAtNode(node, sprintf_js_1.sprintf(Rule.FAILURE_STRING, node.name.text));
        }
    };
    ClassMetadataWalker.prototype.validateMethods = function (node) {
        var methodNames = node.members.filter(ts.isMethodDeclaration).map(function (m) { return m.name.getText(); });
        var matchesAllHooks = lifecycleHooksMethods.every(function (l) { return methodNames.indexOf("" + hooksPrefix + l) !== -1; });
        if (matchesAllHooks) {
            this.addFailureAtNode(node, sprintf_js_1.sprintf(Rule.FAILURE_STRING, node.name.text));
        }
    };
    return ClassMetadataWalker;
}(Lint.RuleWalker));
exports.ClassMetadataWalker = ClassMetadataWalker;
var templateObject_1;
