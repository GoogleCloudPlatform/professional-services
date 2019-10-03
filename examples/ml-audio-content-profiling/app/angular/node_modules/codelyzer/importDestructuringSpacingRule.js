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
var lib_1 = require("tslint/lib");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ImportDestructuringSpacingWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        description: 'Ensure consistent and tidy imports.',
        hasFix: true,
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: "Imports are easier for the reader to look at when they're tidy.",
        ruleName: 'import-destructuring-spacing',
        type: 'style',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = "Import statement's curly braces must be spaced exactly by a space to the right and a space to the left";
    return Rule;
}(lib_1.Rules.AbstractRule));
exports.Rule = Rule;
exports.getFailureMessage = function () {
    return Rule.FAILURE_STRING;
};
var isBlankOrMultilineImport = function (value) {
    return value.indexOf('\n') !== -1 || /^\{\s*\}$/.test(value);
};
var ImportDestructuringSpacingWalker = (function (_super) {
    __extends(ImportDestructuringSpacingWalker, _super);
    function ImportDestructuringSpacingWalker(sourceFile, options) {
        return _super.call(this, sourceFile, options) || this;
    }
    ImportDestructuringSpacingWalker.prototype.visitNamedImports = function (node) {
        this.validateNamedImports(node);
        _super.prototype.visitNamedImports.call(this, node);
    };
    ImportDestructuringSpacingWalker.prototype.getFix = function (node, totalLeadingSpaces, totalTrailingSpaces) {
        var nodeStartPos = node.getStart();
        var nodeEndPos = node.getEnd();
        var fix = [];
        if (totalLeadingSpaces === 0) {
            fix.push(lib_1.Replacement.appendText(nodeStartPos + 1, ' '));
        }
        else if (totalLeadingSpaces > 1) {
            fix.push(lib_1.Replacement.deleteText(nodeStartPos + 1, totalLeadingSpaces - 1));
        }
        if (totalTrailingSpaces === 0) {
            fix.push(lib_1.Replacement.appendText(nodeEndPos - 1, ' '));
        }
        else if (totalTrailingSpaces > 1) {
            fix.push(lib_1.Replacement.deleteText(nodeEndPos - totalTrailingSpaces, totalTrailingSpaces - 1));
        }
        return fix;
    };
    ImportDestructuringSpacingWalker.prototype.validateNamedImports = function (node) {
        var nodeText = node.getText();
        if (isBlankOrMultilineImport(nodeText)) {
            return;
        }
        var totalLeadingSpaces = nodeText.match(/^\{(\s*)/)[1].length;
        var totalTrailingSpaces = nodeText.match(/(\s*)}$/)[1].length;
        if (totalLeadingSpaces === 1 && totalTrailingSpaces === 1) {
            return;
        }
        var fix = this.getFix(node, totalLeadingSpaces, totalTrailingSpaces);
        this.addFailureAtNode(node, exports.getFailureMessage(), fix);
    };
    return ImportDestructuringSpacingWalker;
}(lib_1.RuleWalker));
