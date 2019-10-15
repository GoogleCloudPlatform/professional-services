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
var _a, _b;
var sprintf_js_1 = require("sprintf-js");
var lib_1 = require("tslint/lib");
var ngWalker_1 = require("./angular/ngWalker");
var DEFAULT_ANIMATIONS_LIMIT = 15;
var DEFAULT_STYLES_LIMIT = 3;
var DEFAULT_TEMPLATE_LIMIT = 3;
var OPTION_ANIMATIONS = 'animations';
var OPTION_STYLES = 'styles';
var OPTION_TEMPLATE = 'template';
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new MaxInlineDeclarationsWalker(sourceFile, this.getOptions()));
    };
    Rule.prototype.isEnabled = function () {
        var _a = Rule.metadata.options, maxLength = _a.maxLength, minLength = _a.minLength;
        var length = this.ruleArguments.length;
        return _super.prototype.isEnabled.call(this) && length >= minLength && length <= maxLength;
    };
    Rule.metadata = {
        description: 'Disallows having too many lines in inline template and styles. Forces separate template or styles file creation.',
        descriptionDetails: 'See more at https://angular.io/guide/styleguide#style-05-04.',
        optionExamples: [true, [true, (_a = {}, _a[OPTION_ANIMATIONS] = 20, _a[OPTION_STYLES] = 8, _a[OPTION_TEMPLATE] = 5, _a)]],
        options: {
            items: {
                properties: (_b = {},
                    _b[OPTION_ANIMATIONS] = {
                        type: 'number'
                    },
                    _b[OPTION_STYLES] = {
                        type: 'number'
                    },
                    _b[OPTION_TEMPLATE] = {
                        type: 'number'
                    },
                    _b),
                type: 'object'
            },
            maxLength: 1,
            minLength: 0,
            type: 'array'
        },
        optionsDescription: lib_1.Utils.dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      It can take an optional object with the properties '", "', '", "' and '", "':\n      * `", "` - number > 0 defining the maximum allowed inline lines for animations. Defaults to ", ".\n      * `", "` - number > 0 defining the maximum allowed inline lines for styles. Defaults to ", ".\n      * `", "` - number > 0 defining the maximum allowed inline lines for template. Defaults to ", ".\n    "], ["\n      It can take an optional object with the properties '", "', '", "' and '", "':\n      * \\`", "\\` - number > 0 defining the maximum allowed inline lines for animations. Defaults to ", ".\n      * \\`", "\\` - number > 0 defining the maximum allowed inline lines for styles. Defaults to ", ".\n      * \\`", "\\` - number > 0 defining the maximum allowed inline lines for template. Defaults to ", ".\n    "])), OPTION_ANIMATIONS, OPTION_STYLES, OPTION_TEMPLATE, OPTION_ANIMATIONS, DEFAULT_ANIMATIONS_LIMIT, OPTION_STYLES, DEFAULT_STYLES_LIMIT, OPTION_TEMPLATE, DEFAULT_TEMPLATE_LIMIT),
        rationale: "Large, inline templates and styles obscure the component's purpose and implementation, reducing readability and maintainability.",
        ruleName: 'max-inline-declarations',
        type: 'maintainability',
        typescriptOnly: true
    };
    Rule.FAILURE_STRING = 'Exceeds the maximum allowed inline lines for %s. Defined limit: %s / total lines: %s (https://angular.io/guide/styleguide#style-05-04)';
    return Rule;
}(lib_1.Rules.AbstractRule));
exports.Rule = Rule;
var generateFailure = function (type, limit, value) {
    return sprintf_js_1.sprintf(Rule.FAILURE_STRING, type, limit, value);
};
exports.getAnimationsFailure = function (value, limit) {
    if (limit === void 0) { limit = DEFAULT_ANIMATIONS_LIMIT; }
    return generateFailure(OPTION_ANIMATIONS, limit, value);
};
exports.getStylesFailure = function (value, limit) {
    if (limit === void 0) { limit = DEFAULT_STYLES_LIMIT; }
    return generateFailure(OPTION_STYLES, limit, value);
};
exports.getTemplateFailure = function (value, limit) {
    if (limit === void 0) { limit = DEFAULT_TEMPLATE_LIMIT; }
    return generateFailure(OPTION_TEMPLATE, limit, value);
};
var MaxInlineDeclarationsWalker = (function (_super) {
    __extends(MaxInlineDeclarationsWalker, _super);
    function MaxInlineDeclarationsWalker(sourceFile, options) {
        var _this = _super.call(this, sourceFile, options) || this;
        _this.animationsLinesLimit = DEFAULT_ANIMATIONS_LIMIT;
        _this.stylesLinesLimit = DEFAULT_STYLES_LIMIT;
        _this.templateLinesLimit = DEFAULT_TEMPLATE_LIMIT;
        _this.newLineRegExp = /\r\n|\r|\n/;
        var _a = (options.ruleArguments[0] || []), _b = _a.animations, animations = _b === void 0 ? -1 : _b, _c = _a.styles, styles = _c === void 0 ? -1 : _c, _d = _a.template, template = _d === void 0 ? -1 : _d;
        _this.animationsLinesLimit = animations > -1 ? animations : _this.animationsLinesLimit;
        _this.stylesLinesLimit = styles > -1 ? styles : _this.stylesLinesLimit;
        _this.templateLinesLimit = template > -1 ? template : _this.templateLinesLimit;
        return _this;
    }
    MaxInlineDeclarationsWalker.prototype.visitNgComponent = function (metadata) {
        this.validateInlineAnimations(metadata);
        this.validateInlineStyles(metadata);
        this.validateInlineTemplate(metadata);
        _super.prototype.visitNgComponent.call(this, metadata);
    };
    MaxInlineDeclarationsWalker.prototype.getLinesCount = function (source) {
        return source.trim().split(this.newLineRegExp).length;
    };
    MaxInlineDeclarationsWalker.prototype.getInlineAnimationsLinesCount = function (metadata) {
        var _this = this;
        return (metadata.animations || []).reduce(function (previousValue, currentValue) {
            if (currentValue && currentValue.animation) {
                previousValue += _this.getLinesCount(currentValue.animation.source);
            }
            return previousValue;
        }, 0);
    };
    MaxInlineDeclarationsWalker.prototype.validateInlineAnimations = function (metadata) {
        var linesCount = this.getInlineAnimationsLinesCount(metadata);
        if (linesCount <= this.animationsLinesLimit) {
            return;
        }
        var failureMessage = exports.getAnimationsFailure(linesCount, this.animationsLinesLimit);
        for (var _i = 0, _a = metadata.animations; _i < _a.length; _i++) {
            var animation = _a[_i];
            this.addFailureAtNode(animation.node, failureMessage);
        }
    };
    MaxInlineDeclarationsWalker.prototype.getInlineStylesLinesCount = function (metadata) {
        var _this = this;
        return (metadata.styles || []).reduce(function (previousValue, currentValue) {
            if (currentValue && !currentValue.url) {
                previousValue += _this.getLinesCount(currentValue.style.source);
            }
            return previousValue;
        }, 0);
    };
    MaxInlineDeclarationsWalker.prototype.validateInlineStyles = function (metadata) {
        var linesCount = this.getInlineStylesLinesCount(metadata);
        if (linesCount <= this.stylesLinesLimit) {
            return;
        }
        var failureMessage = exports.getStylesFailure(linesCount, this.stylesLinesLimit);
        for (var _i = 0, _a = metadata.styles; _i < _a.length; _i++) {
            var style = _a[_i];
            this.addFailureAtNode(style.node, failureMessage);
        }
    };
    MaxInlineDeclarationsWalker.prototype.getTemplateLinesCount = function (metadata) {
        return this.hasInlineTemplate(metadata) ? this.getLinesCount(metadata.template.template.source) : 0;
    };
    MaxInlineDeclarationsWalker.prototype.hasInlineTemplate = function (metadata) {
        return !!(metadata.template && !metadata.template.url && metadata.template.template && metadata.template.template.source);
    };
    MaxInlineDeclarationsWalker.prototype.validateInlineTemplate = function (metadata) {
        var linesCount = this.getTemplateLinesCount(metadata);
        if (linesCount <= this.templateLinesLimit) {
            return;
        }
        var failureMessage = exports.getTemplateFailure(linesCount, this.templateLinesLimit);
        this.addFailureAtNode(metadata.template.node, failureMessage);
    };
    return MaxInlineDeclarationsWalker;
}(ngWalker_1.NgWalker));
exports.MaxInlineDeclarationsWalker = MaxInlineDeclarationsWalker;
var templateObject_1;
