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
var typescript_1 = require("typescript/lib/typescript");
var ngWalker_1 = require("./angular/ngWalker");
var utils_1 = require("./util/utils");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ViewEncapsulationWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        description: 'Disallows using of ViewEncapsulation.None.',
        options: null,
        optionsDescription: 'Not configurable.',
        ruleName: 'use-view-encapsulation',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Using "ViewEncapsulation.None" will make your styles global which may have unintended effect';
    return Rule;
}(lib_1.Rules.AbstractRule));
exports.Rule = Rule;
var ViewEncapsulationWalker = (function (_super) {
    __extends(ViewEncapsulationWalker, _super);
    function ViewEncapsulationWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ViewEncapsulationWalker.prototype.visitNgComponent = function (metadata) {
        this.validateComponent(metadata);
        _super.prototype.visitNgComponent.call(this, metadata);
    };
    ViewEncapsulationWalker.prototype.validateComponent = function (metadata) {
        var encapsulation = utils_1.getDecoratorPropertyInitializer(metadata.decorator, 'encapsulation');
        if (!encapsulation || (typescript_1.isPropertyAccessExpression(encapsulation) && encapsulation.name.text !== 'None')) {
            return;
        }
        this.addFailureAtNode(encapsulation, Rule.FAILURE_STRING);
    };
    return ViewEncapsulationWalker;
}(ngWalker_1.NgWalker));
