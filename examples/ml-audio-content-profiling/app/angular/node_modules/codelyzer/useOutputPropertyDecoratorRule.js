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
var lib_1 = require("tslint/lib");
var propertyDecoratorBase_1 = require("./propertyDecoratorBase");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule(options) {
        return _super.call(this, {
            decoratorName: 'Output',
            errorMessage: Rule.FAILURE_STRING,
            propertyName: 'outputs'
        }, options) || this;
    }
    Rule.metadata = {
        description: 'Use `@Output` decorator rather than the `outputs` property of `@Component` and `@Directive` metadata.',
        descriptionDetails: 'See more at https://angular.io/styleguide#style-05-12.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: lib_1.Utils.dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      * It is easier and more readable to identify which properties in a class are events.\n      * If you ever need to rename the event name associated with @Output, you can modify it in a single place.\n      * The metadata declaration attached to the directive is shorter and thus more readable.\n      * Placing the decorator on the same line usually makes for shorter code and still easily identifies the property as an output.\n    "], ["\n      * It is easier and more readable to identify which properties in a class are events.\n      * If you ever need to rename the event name associated with @Output, you can modify it in a single place.\n      * The metadata declaration attached to the directive is shorter and thus more readable.\n      * Placing the decorator on the same line usually makes for shorter code and still easily identifies the property as an output.\n    "]))),
        ruleName: 'use-output-property-decorator',
        type: 'style',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Use the @Output property decorator instead of the outputs property (https://angular.io/styleguide#style-05-12)';
    return Rule;
}(propertyDecoratorBase_1.UsePropertyDecorator));
exports.Rule = Rule;
var templateObject_1;
