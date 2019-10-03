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
var ast = require("@angular/compiler");
var Lint = require("tslint");
var ngWalker_1 = require("./angular/ngWalker");
var basicTemplateAstVisitor_1 = require("./angular/templates/basicTemplateAstVisitor");
var OPTION_CHECK_ID = 'check-id';
var OPTION_CHECK_TEXT = 'check-text';
var I18NAttrVisitor = (function (_super) {
    __extends(I18NAttrVisitor, _super);
    function I18NAttrVisitor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    I18NAttrVisitor.prototype.visitAttr = function (attr, context) {
        if (attr.name === 'i18n') {
            var parts = (attr.value || '').split('@@');
            if (parts.length <= 1 || parts[1].length === 0) {
                var _a = attr.sourceSpan, endOffset = _a.end.offset, startOffset = _a.start.offset;
                context.addFailureFromStartToEnd(startOffset, endOffset, 'Missing custom message identifier. For more information visit https://angular.io/guide/i18n');
            }
        }
        _super.prototype.visitAttr.call(this, attr, context);
    };
    I18NAttrVisitor.prototype.getCheckOption = function () {
        return 'check-id';
    };
    return I18NAttrVisitor;
}(basicTemplateAstVisitor_1.BasicTemplateAstVisitor));
var I18NTextVisitor = (function (_super) {
    __extends(I18NTextVisitor, _super);
    function I18NTextVisitor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.hasI18n = false;
        _this.nestedElements = [];
        _this.visited = new Set();
        return _this;
    }
    I18NTextVisitor.prototype.visitText = function (text, context) {
        if (!this.visited.has(text)) {
            this.visited.add(text);
            var textNonEmpty = text.value.trim().length > 0;
            if ((!this.hasI18n && textNonEmpty && this.nestedElements.length) || (textNonEmpty && !this.nestedElements.length)) {
                var _a = text.sourceSpan, endOffset = _a.end.offset, startOffset = _a.start.offset;
                context.addFailureFromStartToEnd(startOffset, endOffset, I18NTextVisitor.Error);
            }
        }
        _super.prototype.visitText.call(this, text, context);
    };
    I18NTextVisitor.prototype.visitBoundText = function (text, context) {
        if (!this.visited.has(text)) {
            this.visited.add(text);
            var val = text.value;
            if (val instanceof ast.ASTWithSource && val.ast instanceof ast.Interpolation && !this.hasI18n) {
                var textNonEmpty = val.ast.strings.some(function (s) { return /\w+/.test(s); });
                if (textNonEmpty) {
                    var _a = text.sourceSpan, endOffset = _a.end.offset, startOffset = _a.start.offset;
                    context.addFailureFromStartToEnd(startOffset, endOffset, I18NTextVisitor.Error);
                }
            }
        }
        _super.prototype.visitBoundText.call(this, text, context);
    };
    I18NTextVisitor.prototype.visitElement = function (element, context) {
        var originalI18n = this.hasI18n;
        this.hasI18n = originalI18n || element.attrs.some(function (e) { return e.name === 'i18n'; });
        this.nestedElements.push(element.name);
        _super.prototype.visitElement.call(this, element, context);
        this.nestedElements.pop();
        this.hasI18n = originalI18n;
        _super.prototype.visitElement.call(this, element, context);
    };
    I18NTextVisitor.prototype.getCheckOption = function () {
        return 'check-text';
    };
    I18NTextVisitor.Error = 'Each element containing text node should have an i18n attribute';
    return I18NTextVisitor;
}(basicTemplateAstVisitor_1.BasicTemplateAstVisitor));
var I18NTemplateVisitor = (function (_super) {
    __extends(I18NTemplateVisitor, _super);
    function I18NTemplateVisitor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.visitors = [
            new I18NAttrVisitor(_this.getSourceFile(), _this.getOptions(), _this.context, _this.templateStart),
            new I18NTextVisitor(_this.getSourceFile(), _this.getOptions(), _this.context, _this.templateStart)
        ];
        return _this;
    }
    I18NTemplateVisitor.prototype.visit = function (node, context) {
        _super.prototype.visit.call(this, node, context);
    };
    I18NTemplateVisitor.prototype.visitAttr = function (attr, context) {
        var _this = this;
        var options = this.getOptions();
        this.visitors
            .filter(function (v) { return options.indexOf(v.getCheckOption()) >= 0; })
            .map(function (v) { return v.visitAttr(attr, _this); })
            .filter(Boolean)
            .forEach(function (f) {
            return _this.addFailureFromStartToEnd(f.getStartPosition().getPosition(), f.getEndPosition().getPosition(), f.getFailure(), f.getFix());
        });
        _super.prototype.visitAttr.call(this, attr, context);
    };
    I18NTemplateVisitor.prototype.visitElement = function (element, context) {
        var _this = this;
        var options = this.getOptions();
        this.visitors
            .filter(function (v) { return options.indexOf(v.getCheckOption()) >= 0; })
            .map(function (v) { return v.visitElement(element, _this); })
            .filter(Boolean)
            .forEach(function (f) {
            return _this.addFailureFromStartToEnd(f.getStartPosition().getPosition(), f.getEndPosition().getPosition(), f.getFailure(), f.getFix());
        });
        _super.prototype.visitElement.call(this, element, context);
    };
    I18NTemplateVisitor.prototype.visitText = function (text, context) {
        var _this = this;
        var options = this.getOptions();
        this.visitors
            .filter(function (v) { return options.indexOf(v.getCheckOption()) >= 0; })
            .map(function (v) { return v.visitText(text, _this); })
            .filter(Boolean)
            .forEach(function (f) {
            return _this.addFailureFromStartToEnd(f.getStartPosition().getPosition(), f.getEndPosition().getPosition(), f.getFailure(), f.getFix());
        });
        _super.prototype.visitText.call(this, text, context);
    };
    I18NTemplateVisitor.prototype.visitBoundText = function (text, context) {
        var _this = this;
        var options = this.getOptions();
        this.visitors
            .filter(function (v) { return options.indexOf(v.getCheckOption()) >= 0; })
            .map(function (v) { return v.visitBoundText(text, _this); })
            .filter(Boolean)
            .forEach(function (f) {
            return _this.addFailureFromStartToEnd(f.getStartPosition().getPosition(), f.getEndPosition().getPosition(), f.getFailure(), f.getFix());
        });
        _super.prototype.visitBoundText.call(this, text, context);
    };
    return I18NTemplateVisitor;
}(basicTemplateAstVisitor_1.BasicTemplateAstVisitor));
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ngWalker_1.NgWalker(sourceFile, this.getOptions(), {
            templateVisitorCtrl: I18NTemplateVisitor
        }));
    };
    Rule.prototype.isEnabled = function () {
        var _a = Rule.metadata.options, maxLength = _a.maxLength, minLength = _a.minLength;
        var length = this.ruleArguments.length;
        return _super.prototype.isEnabled.call(this) && length >= minLength && length <= maxLength;
    };
    Rule.metadata = {
        description: 'Ensures following best practices for i18n.',
        optionExamples: [[true, OPTION_CHECK_ID], [true, OPTION_CHECK_TEXT], [true, OPTION_CHECK_ID, OPTION_CHECK_TEXT]],
        options: {
            items: {
                enum: [OPTION_CHECK_ID, OPTION_CHECK_TEXT],
                type: 'string'
            },
            maxLength: 2,
            minLength: 1,
            type: 'array'
        },
        optionsDescription: Lint.Utils.dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      One (or both) of the following arguments must be provided:\n      * `", "` Makes sure i18n attributes have ID specified\n      * `", "` Makes sure there are no elements with text content but no i18n attribute\n    "], ["\n      One (or both) of the following arguments must be provided:\n      * \\`", "\\` Makes sure i18n attributes have ID specified\n      * \\`", "\\` Makes sure there are no elements with text content but no i18n attribute\n    "])), OPTION_CHECK_ID, OPTION_CHECK_TEXT),
        rationale: 'Makes the code more maintainable in i18n sense.',
        ruleName: 'i18n',
        type: 'maintainability',
        typescriptOnly: true
    };
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var templateObject_1;
