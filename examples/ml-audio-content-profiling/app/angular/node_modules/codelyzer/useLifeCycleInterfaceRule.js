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
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ClassMetadataWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        description: 'Ensure that components implement life cycle interfaces if they use them.',
        descriptionDetails: 'See more at https://angular.io/styleguide#style-09-01.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: 'Interfaces prescribe typed method signatures. Use those signatures to flag spelling and syntax mistakes.',
        ruleName: 'use-life-cycle-interface',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Implement life cycle hook interface %s for method %s in class %s (https://angular.io/styleguide#style-09-01)';
    Rule.HOOKS_PREFIX = 'ng';
    Rule.LIFE_CYCLE_HOOKS_NAMES = [
        'OnChanges',
        'OnInit',
        'DoCheck',
        'AfterContentInit',
        'AfterContentChecked',
        'AfterViewInit',
        'AfterViewChecked',
        'OnDestroy'
    ];
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var ClassMetadataWalker = (function (_super) {
    __extends(ClassMetadataWalker, _super);
    function ClassMetadataWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClassMetadataWalker.prototype.visitClassDeclaration = function (node) {
        var className = node.name.text;
        var interfaces = this.extractInterfaces(node);
        var methods = node.members.filter(ts.isMethodDeclaration);
        this.validateMethods(methods, interfaces, className);
        _super.prototype.visitClassDeclaration.call(this, node);
    };
    ClassMetadataWalker.prototype.extractInterfaces = function (node) {
        var interfaces = [];
        if (node.heritageClauses) {
            var interfacesClause = node.heritageClauses.filter(function (h) { return h.token === ts.SyntaxKind.ImplementsKeyword; });
            if (interfacesClause.length !== 0) {
                interfaces = interfacesClause[0].types.map(utils_1.getSymbolName);
            }
        }
        return interfaces;
    };
    ClassMetadataWalker.prototype.validateMethods = function (methods, interfaces, className) {
        var _this = this;
        methods.forEach(function (m) {
            var name = m.name;
            var methodName = name.getText();
            if (methodName && _this.isMethodValidHook(methodName, interfaces)) {
                var hookName = methodName.slice(2);
                _this.addFailureAtNode(name, sprintf_js_1.sprintf(Rule.FAILURE_STRING, hookName, "" + Rule.HOOKS_PREFIX + hookName, className));
            }
        });
    };
    ClassMetadataWalker.prototype.isMethodValidHook = function (methodName, interfaces) {
        var isNg = methodName.slice(0, 2) === Rule.HOOKS_PREFIX;
        var hookName = methodName.slice(2);
        var isHook = Rule.LIFE_CYCLE_HOOKS_NAMES.indexOf(hookName) !== -1;
        var isNotIn = interfaces.indexOf(hookName) === -1;
        return isNg && isHook && isNotIn;
    };
    return ClassMetadataWalker;
}(Lint.RuleWalker));
exports.ClassMetadataWalker = ClassMetadataWalker;
