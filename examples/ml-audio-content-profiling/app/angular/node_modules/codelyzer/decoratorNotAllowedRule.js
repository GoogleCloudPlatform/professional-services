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
var ngWalker_1 = require("./angular/ngWalker");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new ClassMetadataWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        description: 'Ensure that classes use allowed decorator in its body.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: 'Some decorators can only be used in certain class types. For example, an @Input should not be used in an @Injectable class.',
        ruleName: 'decorator-not-allowed',
        type: 'functionality',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'In the class "%s" which have the "%s" decorator, the "%s" decorator is not allowed. Please, drop it.';
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var ClassMetadataWalker = (function (_super) {
    __extends(ClassMetadataWalker, _super);
    function ClassMetadataWalker() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isInjectable = false;
        return _this;
    }
    ClassMetadataWalker.prototype.visitNgInjectable = function (classDeclaration, decorator) {
        this.className = classDeclaration.name.text;
        this.isInjectable = true;
        _super.prototype.visitNgInjectable.call(this, classDeclaration, decorator);
    };
    ClassMetadataWalker.prototype.visitNgDirective = function (metadata) {
        this.isInjectable = false;
        _super.prototype.visitNgDirective.call(this, metadata);
    };
    ClassMetadataWalker.prototype.visitNgPipe = function (controller, decorator) {
        this.isInjectable = false;
        _super.prototype.visitNgPipe.call(this, controller, decorator);
    };
    ClassMetadataWalker.prototype.visitNgComponent = function (metadata) {
        this.isInjectable = false;
        _super.prototype.visitNgComponent.call(this, metadata);
    };
    ClassMetadataWalker.prototype.visitNgInput = function (property, input, args) {
        if (this.isInjectable) {
            this.generateFailure(property, this.className, '@Injectable', '@Input');
        }
        _super.prototype.visitNgInput.call(this, property, input, args);
    };
    ClassMetadataWalker.prototype.visitNgOutput = function (property, input, args) {
        if (this.isInjectable) {
            this.generateFailure(property, this.className, '@Injectable', '@Output');
        }
        _super.prototype.visitNgInput.call(this, property, input, args);
    };
    ClassMetadataWalker.prototype.visitNgHostBinding = function (property, decorator, args) {
        if (this.isInjectable) {
            this.generateFailure(property, this.className, '@Injectable', '@HostBinding');
        }
        _super.prototype.visitNgHostBinding.call(this, property, decorator, args);
    };
    ClassMetadataWalker.prototype.visitNgHostListener = function (method, decorator, args) {
        if (this.isInjectable) {
            this.generateFailure(method, this.className, '@Injectable', '@HostListener');
        }
        _super.prototype.visitNgHostListener.call(this, method, decorator, args);
    };
    ClassMetadataWalker.prototype.visitNgContentChild = function (property, input, args) {
        if (this.isInjectable) {
            this.generateFailure(property, this.className, '@Injectable', '@ContentChild');
        }
        _super.prototype.visitNgContentChild.call(this, property, input, args);
    };
    ClassMetadataWalker.prototype.visitNgContentChildren = function (property, input, args) {
        if (this.isInjectable) {
            this.generateFailure(property, this.className, '@Injectable', '@ContentChildren');
        }
        _super.prototype.visitNgContentChildren.call(this, property, input, args);
    };
    ClassMetadataWalker.prototype.visitNgViewChild = function (property, input, args) {
        if (this.isInjectable) {
            this.generateFailure(property, this.className, '@Injectable', '@ViewChild');
        }
        _super.prototype.visitNgViewChild.call(this, property, input, args);
    };
    ClassMetadataWalker.prototype.visitNgViewChildren = function (property, input, args) {
        if (this.isInjectable) {
            this.generateFailure(property, this.className, '@Injectable', '@ViewChildren');
        }
        _super.prototype.visitNgViewChildren.call(this, property, input, args);
    };
    ClassMetadataWalker.prototype.generateFailure = function (property) {
        var failureConfig = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            failureConfig[_i - 1] = arguments[_i];
        }
        this.addFailureAtNode(property, sprintf_js_1.vsprintf(Rule.FAILURE_STRING, failureConfig));
    };
    return ClassMetadataWalker;
}(ngWalker_1.NgWalker));
exports.ClassMetadataWalker = ClassMetadataWalker;
