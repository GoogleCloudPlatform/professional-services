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
var ngWalker_1 = require("./angular/ngWalker");
var utils_1 = require("./util/utils");
var ValidatorSuffix = 'Validator';
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.validate = function (className, suffixes) {
        return suffixes.some(function (s) { return className.endsWith(s); });
    };
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ClassMetadataWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        description: 'Classes decorated with @Directive must have suffix "Directive" (or custom) in their name.',
        descriptionDetails: 'See more at https://angular.io/styleguide#style-02-03.',
        optionExamples: [true, [true, 'Directive', 'MySuffix']],
        options: {
            items: {
                type: 'string'
            },
            minLength: 0,
            type: 'array'
        },
        optionsDescription: 'Supply a list of allowed component suffixes. Defaults to "Directive".',
        rationale: 'Consistent conventions make it easy to quickly identify and reference assets of different types.',
        ruleName: 'directive-class-suffix',
        type: 'style',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'The name of the class %s should end with the suffix %s (https://angular.io/styleguide#style-02-03)';
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var ClassMetadataWalker = (function (_super) {
    __extends(ClassMetadataWalker, _super);
    function ClassMetadataWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClassMetadataWalker.prototype.visitNgDirective = function (metadata) {
        var name = metadata.controller.name;
        var className = name.text;
        var options = this.getOptions();
        var suffixes = options.length ? options : ['Directive'];
        var heritageClauses = metadata.controller.heritageClauses;
        if (heritageClauses) {
            var i = heritageClauses.filter(function (h) { return h.token === ts.SyntaxKind.ImplementsKeyword; });
            if (i.length !== 0 &&
                i[0].types
                    .map(utils_1.getSymbolName)
                    .filter(Boolean)
                    .some(function (x) { return x.endsWith(ValidatorSuffix); })) {
                suffixes.push(ValidatorSuffix);
            }
        }
        if (!Rule.validate(className, suffixes)) {
            this.addFailureAtNode(name, sprintf_js_1.sprintf(Rule.FAILURE_STRING, className, suffixes.join(', ')));
        }
        _super.prototype.visitNgDirective.call(this, metadata);
    };
    return ClassMetadataWalker;
}(ngWalker_1.NgWalker));
exports.ClassMetadataWalker = ClassMetadataWalker;
