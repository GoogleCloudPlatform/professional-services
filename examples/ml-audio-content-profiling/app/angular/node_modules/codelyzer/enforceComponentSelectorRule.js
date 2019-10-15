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
var sprintf_js_1 = require("sprintf-js");
var ngWalker_1 = require("./angular/ngWalker");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new EnforceComponentSelectorValidatorWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        ruleName: 'enforce-component-selector',
        type: 'style',
        description: 'Component selector must be declared.',
        rationale: 'Omit the component selector makes debugging difficult.',
        options: null,
        optionsDescription: 'Not configurable.',
        typescriptOnly: true
    };
    Rule.SELECTOR_FAILURE = 'The selector of the component "%s" is mandatory';
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var EnforceComponentSelectorValidatorWalker = (function (_super) {
    __extends(EnforceComponentSelectorValidatorWalker, _super);
    function EnforceComponentSelectorValidatorWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EnforceComponentSelectorValidatorWalker.prototype.visitNgComponent = function (metadata) {
        if (!metadata.selector) {
            this.addFailureAtNode(metadata.decorator, sprintf_js_1.sprintf(Rule.SELECTOR_FAILURE, metadata.controller.name.text));
        }
        _super.prototype.visitNgComponent.call(this, metadata);
    };
    return EnforceComponentSelectorValidatorWalker;
}(ngWalker_1.NgWalker));
exports.EnforceComponentSelectorValidatorWalker = EnforceComponentSelectorValidatorWalker;
