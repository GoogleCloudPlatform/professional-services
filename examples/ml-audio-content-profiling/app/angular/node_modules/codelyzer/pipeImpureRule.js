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
var ts = require("typescript");
var sprintf_js_1 = require("sprintf-js");
var ngWalker_1 = require("./angular/ngWalker");
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
        ruleName: 'pipe-impure',
        type: 'functionality',
        description: 'Pipes cannot be declared as impure.',
        rationale: 'Impure pipes do not perform well because they run on every change detection cycle.',
        options: null,
        optionsDescription: 'Not configurable.',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Warning: impure pipe declared in class %s';
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var ClassMetadataWalker = (function (_super) {
    __extends(ClassMetadataWalker, _super);
    function ClassMetadataWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClassMetadataWalker.prototype.visitNgPipe = function (controller, decorator) {
        this.validatePipe(controller.name.text, decorator);
        _super.prototype.visitNgPipe.call(this, controller, decorator);
    };
    ClassMetadataWalker.prototype.validatePipe = function (className, decorator) {
        var argument = utils_1.getDecoratorArgument(decorator);
        var property = argument.properties.find(function (p) { return p.name.getText() === 'pure'; });
        if (!property) {
            return;
        }
        var propValue = ts.isPropertyAssignment(property) ? property.initializer.getText() : undefined;
        if (!propValue || propValue !== 'false') {
            return;
        }
        this.addFailureAtNode(property, sprintf_js_1.sprintf(Rule.FAILURE_STRING, className));
    };
    return ClassMetadataWalker;
}(ngWalker_1.NgWalker));
exports.ClassMetadataWalker = ClassMetadataWalker;
