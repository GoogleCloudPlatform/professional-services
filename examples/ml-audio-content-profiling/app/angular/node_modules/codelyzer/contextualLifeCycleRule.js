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
        description: 'Ensure that classes use allowed life cycle method in its body.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: 'Some life cycle methods can only be used in certain class types.For example, ngOnInit() hook method should not be used in an @Injectable class.',
        ruleName: 'contextual-life-cycle',
        type: 'functionality',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'In the class "%s" which have the "%s" decorator, the "%s" hook method is not allowed. Please, drop it.';
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var ClassMetadataWalker = (function (_super) {
    __extends(ClassMetadataWalker, _super);
    function ClassMetadataWalker() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isInjectable = false;
        _this.isComponent = false;
        _this.isDirective = false;
        _this.isPipe = false;
        return _this;
    }
    ClassMetadataWalker.prototype.visitMethodDeclaration = function (method) {
        var methodName = method.name.getText();
        if (methodName === 'ngOnInit') {
            if (this.isInjectable) {
                this.generateFailure(method, this.className, '@Injectable', 'ngOnInit()');
            }
            else if (this.isPipe) {
                this.generateFailure(method, this.className, '@Pipe', 'ngOnInit()');
            }
        }
        if (methodName === 'ngOnChanges') {
            if (this.isInjectable) {
                this.generateFailure(method, this.className, '@Injectable', 'ngOnChanges()');
            }
            else if (this.isPipe) {
                this.generateFailure(method, this.className, '@Pipe', 'ngOnChanges()');
            }
        }
        if (methodName === 'ngDoCheck') {
            if (this.isInjectable) {
                this.generateFailure(method, this.className, '@Injectable', 'ngDoCheck()');
            }
            else if (this.isPipe) {
                this.generateFailure(method, this.className, '@Pipe', 'ngDoCheck()');
            }
        }
        if (methodName === 'ngAfterContentInit') {
            if (this.isInjectable) {
                this.generateFailure(method, this.className, '@Injectable', 'ngAfterContentInit()');
            }
            else if (this.isPipe) {
                this.generateFailure(method, this.className, '@Pipe', 'ngAfterContentInit()');
            }
        }
        if (methodName === 'ngAfterContentChecked') {
            if (this.isInjectable) {
                this.generateFailure(method, this.className, '@Injectable', 'ngAfterContentChecked()');
            }
            else if (this.isPipe) {
                this.generateFailure(method, this.className, '@Pipe', 'ngAfterContentChecked()');
            }
        }
        if (methodName === 'ngAfterViewInit') {
            if (this.isInjectable) {
                this.generateFailure(method, this.className, '@Injectable', 'ngAfterViewInit()');
            }
            else if (this.isPipe) {
                this.generateFailure(method, this.className, '@Pipe', 'ngAfterViewInit()');
            }
        }
        if (methodName === 'ngAfterViewChecked') {
            if (this.isInjectable) {
                this.generateFailure(method, this.className, '@Injectable', 'ngAfterViewChecked()');
            }
            else if (this.isPipe) {
                this.generateFailure(method, this.className, '@Pipe', 'ngAfterViewChecked()');
            }
        }
        _super.prototype.visitMethodDeclaration.call(this, method);
    };
    ClassMetadataWalker.prototype.visitNgInjectable = function (controller, decorator) {
        this.className = controller.name.text;
        this.isInjectable = true;
        this.isComponent = false;
        this.isDirective = false;
        this.isPipe = false;
        _super.prototype.visitNgInjectable.call(this, controller, decorator);
    };
    ClassMetadataWalker.prototype.visitNgComponent = function (metadata) {
        this.className = metadata.controller.name.text;
        this.isComponent = true;
        this.isInjectable = false;
        this.isDirective = false;
        this.isPipe = false;
        _super.prototype.visitNgComponent.call(this, metadata);
    };
    ClassMetadataWalker.prototype.visitNgDirective = function (metadata) {
        this.className = metadata.controller.name.text;
        this.isDirective = true;
        this.isInjectable = false;
        this.isComponent = false;
        this.isPipe = false;
        _super.prototype.visitNgDirective.call(this, metadata);
    };
    ClassMetadataWalker.prototype.visitNgPipe = function (controller, decorator) {
        this.className = controller.name.text;
        this.isPipe = true;
        this.isInjectable = false;
        this.isComponent = false;
        this.isDirective = false;
        _super.prototype.visitNgPipe.call(this, controller, decorator);
    };
    ClassMetadataWalker.prototype.generateFailure = function (method) {
        var failureConfig = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            failureConfig[_i - 1] = arguments[_i];
        }
        this.addFailureAtNode(method, sprintf_js_1.vsprintf(Rule.FAILURE_STRING, failureConfig));
    };
    return ClassMetadataWalker;
}(ngWalker_1.NgWalker));
exports.ClassMetadataWalker = ClassMetadataWalker;
