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
        description: 'Ensure that pipes implement PipeTransform interface.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: 'Interfaces prescribe typed method signatures. Use those signatures to flag spelling and syntax mistakes.',
        ruleName: 'use-pipe-transform-interface',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'The %s class has the Pipe decorator, so it should implement the PipeTransform interface';
    Rule.PIPE_INTERFACE_NAME = 'PipeTransform';
    return Rule;
}(lib_1.Rules.AbstractRule));
exports.Rule = Rule;
var hasPipe = function (node) {
    return !!(node.decorators && node.decorators.map(utils_1.getDecoratorName).some(function (t) { return t === 'Pipe'; }));
};
var hasPipeTransform = function (node) {
    var heritageClauses = node.heritageClauses;
    if (!heritageClauses) {
        return false;
    }
    var interfacesClauses = heritageClauses.filter(function (h) { return h.token === typescript_1.SyntaxKind.ImplementsKeyword; });
    return interfacesClauses.length > 0 && interfacesClauses[0].types.map(utils_1.getSymbolName).indexOf(Rule.PIPE_INTERFACE_NAME) !== -1;
};
var ClassMetadataWalker = (function (_super) {
    __extends(ClassMetadataWalker, _super);
    function ClassMetadataWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClassMetadataWalker.prototype.visitClassDeclaration = function (node) {
        this.validateClassDeclaration(node);
        _super.prototype.visitClassDeclaration.call(this, node);
    };
    ClassMetadataWalker.prototype.validateClassDeclaration = function (node) {
        if (!hasPipe(node) || hasPipeTransform(node)) {
            return;
        }
        this.addFailureAtNode(node, sprintf_js_1.sprintf(Rule.FAILURE_STRING, node.name.text));
    };
    return ClassMetadataWalker;
}(lib_1.RuleWalker));
exports.ClassMetadataWalker = ClassMetadataWalker;
