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
var ngWalker_1 = require("./angular/ngWalker");
var basicTemplateAstVisitor_1 = require("./angular/templates/basicTemplateAstVisitor");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ngWalker_1.NgWalker(sourceFile, this.getOptions(), { templateVisitorCtrl: TrackByTemplateVisitor }));
    };
    Rule.metadata = {
        description: 'Ensures a trackBy function is used.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: "The use of 'trackBy' is considered a good practice.",
        ruleName: 'trackBy-function',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Missing trackBy function in ngFor directive';
    return Rule;
}(lib_1.Rules.AbstractRule));
exports.Rule = Rule;
exports.getFailureMessage = function () {
    return Rule.FAILURE_STRING;
};
var TrackByFunctionTemplateVisitor = (function (_super) {
    __extends(TrackByFunctionTemplateVisitor, _super);
    function TrackByFunctionTemplateVisitor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TrackByFunctionTemplateVisitor.prototype.visitDirectiveProperty = function (prop, context) {
        this.validateDirective(prop, context);
        _super.prototype.visitDirectiveProperty.call(this, prop, context);
    };
    TrackByFunctionTemplateVisitor.prototype.validateDirective = function (prop, context) {
        var templateName = prop.templateName;
        if (templateName !== 'ngForOf') {
            return;
        }
        var pattern = /trackBy\s*:|\[ngForTrackBy\]\s*=\s*['"].*['"]/;
        if (pattern.test(context.codeWithMap.source)) {
            return;
        }
        var _a = prop.sourceSpan, endOffset = _a.end.offset, startOffset = _a.start.offset;
        context.addFailureFromStartToEnd(startOffset, endOffset, exports.getFailureMessage());
    };
    return TrackByFunctionTemplateVisitor;
}(basicTemplateAstVisitor_1.BasicTemplateAstVisitor));
var TrackByTemplateVisitor = (function (_super) {
    __extends(TrackByTemplateVisitor, _super);
    function TrackByTemplateVisitor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.visitors = new Set([
            new TrackByFunctionTemplateVisitor(_this.getSourceFile(), _this.getOptions(), _this.context, _this.templateStart)
        ]);
        return _this;
    }
    TrackByTemplateVisitor.prototype.visitDirectiveProperty = function (prop, context) {
        var _this = this;
        this.visitors.forEach(function (visitor) { return visitor.visitDirectiveProperty(prop, _this); });
        _super.prototype.visitDirectiveProperty.call(this, prop, context);
    };
    return TrackByTemplateVisitor;
}(basicTemplateAstVisitor_1.BasicTemplateAstVisitor));
