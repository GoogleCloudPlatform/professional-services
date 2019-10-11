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
            decoratorName: ['ContentChild', 'ContentChildren', 'ViewChild', 'ViewChildren'],
            errorMessage: Rule.FAILURE_STRING,
            propertyName: 'queries'
        }, options) || this;
    }
    Rule.metadata = {
        description: 'Use @ContentChild, @ContentChildren, @ViewChild or @ViewChildren instead of the `queries` property of `@Component` or `@Directive` metadata.',
        options: null,
        optionsDescription: 'Not configurable.',
        rationale: lib_1.Utils.dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      The property associated with @ContentChild, @ContentChildren, @ViewChild or @ViewChildren\n      can be modified only in a single place: in the directive's class. If you use the queries metadata\n      property, you must modify both the property declaration inside the controller, and the metadata\n      associated with the directive.\n    "], ["\n      The property associated with @ContentChild, @ContentChildren, @ViewChild or @ViewChildren\n      can be modified only in a single place: in the directive's class. If you use the queries metadata\n      property, you must modify both the property declaration inside the controller, and the metadata\n      associated with the directive.\n    "]))),
        ruleName: 'no-queries-parameter',
        type: 'style',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Use @ContentChild, @ContentChildren, @ViewChild or @ViewChildren instead of the queries property';
    return Rule;
}(propertyDecoratorBase_1.UsePropertyDecorator));
exports.Rule = Rule;
var templateObject_1;
