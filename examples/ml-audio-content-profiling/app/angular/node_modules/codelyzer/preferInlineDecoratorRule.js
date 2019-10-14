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
var utils_1 = require("./util/utils");
var Decorators;
(function (Decorators) {
    Decorators["ContentChild"] = "ContentChild";
    Decorators["ContentChildren"] = "ContentChildren";
    Decorators["HostBinding"] = "HostBinding";
    Decorators["HostListener"] = "HostListener";
    Decorators["Input"] = "Input";
    Decorators["Output"] = "Output";
    Decorators["ViewChild"] = "ViewChild";
    Decorators["ViewChildren"] = "ViewChildren";
})(Decorators || (Decorators = {}));
var enumKeys = Object.keys(Decorators);
exports.decoratorKeys = new Set(enumKeys);
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new PreferInlineDecoratorWalker(sourceFile, this.getOptions()));
    };
    Rule.prototype.isEnabled = function () {
        var _a = Rule.metadata.options, maxLength = _a.maxLength, minLength = _a.minLength;
        var length = this.ruleArguments.length;
        return _super.prototype.isEnabled.call(this) && length >= minLength && length <= maxLength;
    };
    Rule.metadata = {
        description: 'Ensures that decorators are on the same line as the property/method it decorates.',
        descriptionDetails: 'See more at https://angular.io/guide/styleguide#style-05-12.',
        hasFix: true,
        optionExamples: [true, [true, Decorators.HostListener]],
        options: {
            items: {
                enum: enumKeys,
                type: 'string'
            },
            maxLength: exports.decoratorKeys.size,
            minLength: 0,
            type: 'array'
        },
        optionsDescription: 'A list of blacklisted decorators.',
        rationale: 'Placing the decorator on the same line usually makes for shorter code and still easily identifies the property/method.',
        ruleName: 'prefer-inline-decorator',
        type: 'style',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Consider placing decorators on the same line as the property/method it decorates';
    return Rule;
}(lib_1.Rules.AbstractRule));
exports.Rule = Rule;
exports.getFailureMessage = function () {
    return Rule.FAILURE_STRING;
};
var PreferInlineDecoratorWalker = (function (_super) {
    __extends(PreferInlineDecoratorWalker, _super);
    function PreferInlineDecoratorWalker(source, options) {
        var _this = _super.call(this, source, options) || this;
        _this.blacklistedDecorators = new Set(options.ruleArguments);
        return _this;
    }
    PreferInlineDecoratorWalker.prototype.visitMethodDecorator = function (decorator) {
        this.validateDecorator(decorator, decorator.parent);
        _super.prototype.visitMethodDecorator.call(this, decorator);
    };
    PreferInlineDecoratorWalker.prototype.visitPropertyDecorator = function (decorator) {
        this.validateDecorator(decorator, decorator.parent);
        _super.prototype.visitPropertyDecorator.call(this, decorator);
    };
    PreferInlineDecoratorWalker.prototype.validateDecorator = function (decorator, property) {
        var decoratorName = utils_1.getDecoratorName(decorator);
        var isDecoratorBlacklisted = this.blacklistedDecorators.has(decoratorName);
        if (isDecoratorBlacklisted) {
            return;
        }
        var decoratorStartPos = decorator.getStart();
        var propertyStartPos = property.name.getStart();
        if (utils_1.isSameLine(this.getSourceFile(), decoratorStartPos, propertyStartPos)) {
            return;
        }
        var fix = lib_1.Replacement.deleteFromTo(decorator.getEnd(), propertyStartPos - 1);
        this.addFailureAt(decoratorStartPos, property.getWidth(), exports.getFailureMessage(), fix);
    };
    return PreferInlineDecoratorWalker;
}(ngWalker_1.NgWalker));
exports.PreferInlineDecoratorWalker = PreferInlineDecoratorWalker;
