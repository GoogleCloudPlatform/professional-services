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
var basicTemplateAstVisitor_1 = require("./angular/templates/basicTemplateAstVisitor");
var ngWalker_1 = require("./angular/ngWalker");
var InvalidSyntaxBoxOpen = '([';
var InvalidSyntaxBoxClose = '])';
var ValidSyntaxOpen = '[(';
var ValidSyntaxClose = ')]';
var InvalidSyntaxBoxRe = /\[(.*?)\]/;
var getReplacements = function (text, absolutePosition) {
    var expr = text.sourceSpan.toString();
    var internalStart = expr.indexOf(InvalidSyntaxBoxOpen);
    var internalEnd = expr.lastIndexOf(InvalidSyntaxBoxClose);
    var len = internalEnd - internalStart - InvalidSyntaxBoxClose.length;
    var trimmed = expr.substr(internalStart + InvalidSyntaxBoxOpen.length, len).trim();
    return [
        new Lint.Replacement(absolutePosition, internalEnd - internalStart + ValidSyntaxClose.length, "" + ValidSyntaxOpen + trimmed + ValidSyntaxClose)
    ];
};
var BananaInBoxTemplateVisitor = (function (_super) {
    __extends(BananaInBoxTemplateVisitor, _super);
    function BananaInBoxTemplateVisitor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BananaInBoxTemplateVisitor.prototype.visitEvent = function (prop, context) {
        if (prop.name) {
            var error = null;
            if (InvalidSyntaxBoxRe.test(prop.name)) {
                error = 'Invalid binding syntax. Use [(expr)] instead';
            }
            if (error) {
                var expr = prop.sourceSpan.toString();
                var internalStart = expr.indexOf(InvalidSyntaxBoxOpen) + 1;
                var start = prop.sourceSpan.start.offset + internalStart;
                var absolutePosition = this.getSourcePosition(start - 1);
                this.addFailureAt(start, expr.trim().length, error, getReplacements(prop, absolutePosition));
            }
        }
        _super.prototype.visitEvent.call(this, prop, context);
    };
    return BananaInBoxTemplateVisitor;
}(basicTemplateAstVisitor_1.BasicTemplateAstVisitor));
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ngWalker_1.NgWalker(sourceFile, this.getOptions(), {
            templateVisitorCtrl: BananaInBoxTemplateVisitor
        }));
    };
    Rule.metadata = {
        ruleName: 'banana-in-box',
        type: 'functionality',
        description: 'Ensure that the two-way data binding syntax is correct.',
        rationale: 'The parens "()" should have been inside the brackets "[]".',
        options: null,
        optionsDescription: 'Not configurable.',
        typescriptOnly: true,
        hasFix: true
    };
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
