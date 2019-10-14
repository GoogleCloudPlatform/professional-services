/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler/src/render3/r3_template_transform", ["require", "exports", "tslib", "@angular/compiler/src/ml_parser/ast", "@angular/compiler/src/ml_parser/html_whitespaces", "@angular/compiler/src/ml_parser/tags", "@angular/compiler/src/parse_util", "@angular/compiler/src/style_url_resolver", "@angular/compiler/src/template_parser/template_preparser", "@angular/compiler/src/util", "@angular/compiler/src/render3/r3_ast"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var html = require("@angular/compiler/src/ml_parser/ast");
    var html_whitespaces_1 = require("@angular/compiler/src/ml_parser/html_whitespaces");
    var tags_1 = require("@angular/compiler/src/ml_parser/tags");
    var parse_util_1 = require("@angular/compiler/src/parse_util");
    var style_url_resolver_1 = require("@angular/compiler/src/style_url_resolver");
    var template_preparser_1 = require("@angular/compiler/src/template_parser/template_preparser");
    var util_1 = require("@angular/compiler/src/util");
    var t = require("@angular/compiler/src/render3/r3_ast");
    var BIND_NAME_REGEXP = /^(?:(?:(?:(bind-)|(let-)|(ref-|#)|(on-)|(bindon-)|(@))(.+))|\[\(([^\)]+)\)\]|\[([^\]]+)\]|\(([^\)]+)\))$/;
    // Group 1 = "bind-"
    var KW_BIND_IDX = 1;
    // Group 2 = "let-"
    var KW_LET_IDX = 2;
    // Group 3 = "ref-/#"
    var KW_REF_IDX = 3;
    // Group 4 = "on-"
    var KW_ON_IDX = 4;
    // Group 5 = "bindon-"
    var KW_BINDON_IDX = 5;
    // Group 6 = "@"
    var KW_AT_IDX = 6;
    // Group 7 = the identifier after "bind-", "let-", "ref-/#", "on-", "bindon-" or "@"
    var IDENT_KW_IDX = 7;
    // Group 8 = identifier inside [()]
    var IDENT_BANANA_BOX_IDX = 8;
    // Group 9 = identifier inside []
    var IDENT_PROPERTY_IDX = 9;
    // Group 10 = identifier inside ()
    var IDENT_EVENT_IDX = 10;
    var TEMPLATE_ATTR_PREFIX = '*';
    // Default selector used by `<ng-content>` if none specified
    var DEFAULT_CONTENT_SELECTOR = '*';
    function htmlAstToRender3Ast(htmlNodes, bindingParser) {
        var transformer = new HtmlAstToIvyAst(bindingParser);
        var ivyNodes = html.visitAll(transformer, htmlNodes);
        // Errors might originate in either the binding parser or the html to ivy transformer
        var allErrors = bindingParser.errors.concat(transformer.errors);
        var errors = allErrors.filter(function (e) { return e.level === parse_util_1.ParseErrorLevel.ERROR; });
        if (errors.length > 0) {
            var errorString = errors.join('\n');
            throw util_1.syntaxError("Template parse errors:\n" + errorString, errors);
        }
        return {
            nodes: ivyNodes,
            errors: allErrors,
            ngContentSelectors: transformer.ngContentSelectors,
            hasNgContent: transformer.hasNgContent,
        };
    }
    exports.htmlAstToRender3Ast = htmlAstToRender3Ast;
    var HtmlAstToIvyAst = /** @class */ (function () {
        function HtmlAstToIvyAst(bindingParser) {
            this.bindingParser = bindingParser;
            this.errors = [];
            // Selectors for the `ng-content` tags. Only non `*` selectors are recorded here
            this.ngContentSelectors = [];
            // Any `<ng-content>` in the template ?
            this.hasNgContent = false;
        }
        // HTML visitor
        HtmlAstToIvyAst.prototype.visitElement = function (element) {
            var _this = this;
            var e_1, _a;
            var preparsedElement = template_preparser_1.preparseElement(element);
            if (preparsedElement.type === template_preparser_1.PreparsedElementType.SCRIPT ||
                preparsedElement.type === template_preparser_1.PreparsedElementType.STYLE) {
                // Skipping <script> for security reasons
                // Skipping <style> as we already processed them
                // in the StyleCompiler
                return null;
            }
            if (preparsedElement.type === template_preparser_1.PreparsedElementType.STYLESHEET &&
                style_url_resolver_1.isStyleUrlResolvable(preparsedElement.hrefAttr)) {
                // Skipping stylesheets with either relative urls or package scheme as we already processed
                // them in the StyleCompiler
                return null;
            }
            // Whether the element is a `<ng-template>`
            var isTemplateElement = tags_1.isNgTemplate(element.name);
            var parsedProperties = [];
            var boundEvents = [];
            var variables = [];
            var references = [];
            var attributes = [];
            var templateParsedProperties = [];
            var templateVariables = [];
            // Whether the element has any *-attribute
            var elementHasInlineTemplate = false;
            try {
                for (var _b = tslib_1.__values(element.attrs), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var attribute = _c.value;
                    var hasBinding = false;
                    var normalizedName = normalizeAttributeName(attribute.name);
                    // `*attr` defines template bindings
                    var isTemplateBinding = false;
                    if (normalizedName.startsWith(TEMPLATE_ATTR_PREFIX)) {
                        // *-attributes
                        if (elementHasInlineTemplate) {
                            this.reportError("Can't have multiple template bindings on one element. Use only one attribute prefixed with *", attribute.sourceSpan);
                        }
                        isTemplateBinding = true;
                        elementHasInlineTemplate = true;
                        var templateValue = attribute.value;
                        var templateKey = normalizedName.substring(TEMPLATE_ATTR_PREFIX.length);
                        var parsedVariables = [];
                        this.bindingParser.parseInlineTemplateBinding(templateKey, templateValue, attribute.sourceSpan, [], templateParsedProperties, parsedVariables);
                        templateVariables.push.apply(templateVariables, tslib_1.__spread(parsedVariables.map(function (v) { return new t.Variable(v.name, v.value, v.sourceSpan); })));
                    }
                    else {
                        // Check for variables, events, property bindings, interpolation
                        hasBinding = this.parseAttribute(isTemplateElement, attribute, [], parsedProperties, boundEvents, variables, references);
                    }
                    if (!hasBinding && !isTemplateBinding) {
                        // don't include the bindings as attributes as well in the AST
                        attributes.push(this.visitAttribute(attribute));
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var children = html.visitAll(preparsedElement.nonBindable ? NON_BINDABLE_VISITOR : this, element.children);
            var parsedElement;
            if (preparsedElement.type === template_preparser_1.PreparsedElementType.NG_CONTENT) {
                // `<ng-content>`
                this.hasNgContent = true;
                if (element.children && !element.children.every(isEmptyTextNode)) {
                    this.reportError("<ng-content> element cannot have content.", element.sourceSpan);
                }
                var selector = preparsedElement.selectAttr;
                var attributes_1 = element.attrs.map(function (attribute) { return _this.visitAttribute(attribute); });
                var selectorIndex = selector === DEFAULT_CONTENT_SELECTOR ? 0 : this.ngContentSelectors.push(selector);
                parsedElement = new t.Content(selectorIndex, attributes_1, element.sourceSpan);
            }
            else if (isTemplateElement) {
                // `<ng-template>`
                var attrs = this.extractAttributes(element.name, parsedProperties);
                parsedElement = new t.Template(attributes, attrs.bound, boundEvents, children, references, variables, element.sourceSpan, element.startSourceSpan, element.endSourceSpan);
            }
            else {
                var attrs = this.extractAttributes(element.name, parsedProperties);
                parsedElement = new t.Element(element.name, attributes, attrs.bound, boundEvents, children, references, element.sourceSpan, element.startSourceSpan, element.endSourceSpan);
            }
            if (elementHasInlineTemplate) {
                var attrs = this.extractAttributes('ng-template', templateParsedProperties);
                // TODO(pk): test for this case
                parsedElement = new t.Template(attrs.literal, attrs.bound, [], [parsedElement], [], templateVariables, element.sourceSpan, element.startSourceSpan, element.endSourceSpan);
            }
            return parsedElement;
        };
        HtmlAstToIvyAst.prototype.visitAttribute = function (attribute) {
            return new t.TextAttribute(attribute.name, attribute.value, attribute.sourceSpan, attribute.valueSpan);
        };
        HtmlAstToIvyAst.prototype.visitText = function (text) {
            var valueNoNgsp = html_whitespaces_1.replaceNgsp(text.value);
            var expr = this.bindingParser.parseInterpolation(valueNoNgsp, text.sourceSpan);
            return expr ? new t.BoundText(expr, text.sourceSpan) : new t.Text(valueNoNgsp, text.sourceSpan);
        };
        HtmlAstToIvyAst.prototype.visitComment = function (comment) { return null; };
        HtmlAstToIvyAst.prototype.visitExpansion = function (expansion) { return null; };
        HtmlAstToIvyAst.prototype.visitExpansionCase = function (expansionCase) { return null; };
        // convert view engine `ParsedProperty` to a format suitable for IVY
        HtmlAstToIvyAst.prototype.extractAttributes = function (elementName, properties) {
            var _this = this;
            var bound = [];
            var literal = [];
            properties.forEach(function (prop) {
                if (prop.isLiteral) {
                    literal.push(new t.TextAttribute(prop.name, prop.expression.source || '', prop.sourceSpan));
                }
                else {
                    var bep = _this.bindingParser.createBoundElementProperty(elementName, prop);
                    bound.push(t.BoundAttribute.fromBoundElementProperty(bep));
                }
            });
            return { bound: bound, literal: literal };
        };
        HtmlAstToIvyAst.prototype.parseAttribute = function (isTemplateElement, attribute, matchableAttributes, parsedProperties, boundEvents, variables, references) {
            var name = normalizeAttributeName(attribute.name);
            var value = attribute.value;
            var srcSpan = attribute.sourceSpan;
            var bindParts = name.match(BIND_NAME_REGEXP);
            var hasBinding = false;
            if (bindParts) {
                hasBinding = true;
                if (bindParts[KW_BIND_IDX] != null) {
                    this.bindingParser.parsePropertyBinding(bindParts[IDENT_KW_IDX], value, false, srcSpan, matchableAttributes, parsedProperties);
                }
                else if (bindParts[KW_LET_IDX]) {
                    if (isTemplateElement) {
                        var identifier = bindParts[IDENT_KW_IDX];
                        this.parseVariable(identifier, value, srcSpan, variables);
                    }
                    else {
                        this.reportError("\"let-\" is only supported on ng-template elements.", srcSpan);
                    }
                }
                else if (bindParts[KW_REF_IDX]) {
                    var identifier = bindParts[IDENT_KW_IDX];
                    this.parseReference(identifier, value, srcSpan, references);
                }
                else if (bindParts[KW_ON_IDX]) {
                    var events = [];
                    this.bindingParser.parseEvent(bindParts[IDENT_KW_IDX], value, srcSpan, matchableAttributes, events);
                    addEvents(events, boundEvents);
                }
                else if (bindParts[KW_BINDON_IDX]) {
                    this.bindingParser.parsePropertyBinding(bindParts[IDENT_KW_IDX], value, false, srcSpan, matchableAttributes, parsedProperties);
                    this.parseAssignmentEvent(bindParts[IDENT_KW_IDX], value, srcSpan, matchableAttributes, boundEvents);
                }
                else if (bindParts[KW_AT_IDX]) {
                    this.bindingParser.parseLiteralAttr(name, value, srcSpan, matchableAttributes, parsedProperties);
                }
                else if (bindParts[IDENT_BANANA_BOX_IDX]) {
                    this.bindingParser.parsePropertyBinding(bindParts[IDENT_BANANA_BOX_IDX], value, false, srcSpan, matchableAttributes, parsedProperties);
                    this.parseAssignmentEvent(bindParts[IDENT_BANANA_BOX_IDX], value, srcSpan, matchableAttributes, boundEvents);
                }
                else if (bindParts[IDENT_PROPERTY_IDX]) {
                    this.bindingParser.parsePropertyBinding(bindParts[IDENT_PROPERTY_IDX], value, false, srcSpan, matchableAttributes, parsedProperties);
                }
                else if (bindParts[IDENT_EVENT_IDX]) {
                    var events = [];
                    this.bindingParser.parseEvent(bindParts[IDENT_EVENT_IDX], value, srcSpan, matchableAttributes, events);
                    addEvents(events, boundEvents);
                }
            }
            else {
                hasBinding = this.bindingParser.parsePropertyInterpolation(name, value, srcSpan, matchableAttributes, parsedProperties);
            }
            return hasBinding;
        };
        HtmlAstToIvyAst.prototype.parseVariable = function (identifier, value, sourceSpan, variables) {
            if (identifier.indexOf('-') > -1) {
                this.reportError("\"-\" is not allowed in variable names", sourceSpan);
            }
            variables.push(new t.Variable(identifier, value, sourceSpan));
        };
        HtmlAstToIvyAst.prototype.parseReference = function (identifier, value, sourceSpan, references) {
            if (identifier.indexOf('-') > -1) {
                this.reportError("\"-\" is not allowed in reference names", sourceSpan);
            }
            references.push(new t.Reference(identifier, value, sourceSpan));
        };
        HtmlAstToIvyAst.prototype.parseAssignmentEvent = function (name, expression, sourceSpan, targetMatchableAttrs, boundEvents) {
            var events = [];
            this.bindingParser.parseEvent(name + "Change", expression + "=$event", sourceSpan, targetMatchableAttrs, events);
            addEvents(events, boundEvents);
        };
        HtmlAstToIvyAst.prototype.reportError = function (message, sourceSpan, level) {
            if (level === void 0) { level = parse_util_1.ParseErrorLevel.ERROR; }
            this.errors.push(new parse_util_1.ParseError(sourceSpan, message, level));
        };
        return HtmlAstToIvyAst;
    }());
    var NonBindableVisitor = /** @class */ (function () {
        function NonBindableVisitor() {
        }
        NonBindableVisitor.prototype.visitElement = function (ast) {
            var preparsedElement = template_preparser_1.preparseElement(ast);
            if (preparsedElement.type === template_preparser_1.PreparsedElementType.SCRIPT ||
                preparsedElement.type === template_preparser_1.PreparsedElementType.STYLE ||
                preparsedElement.type === template_preparser_1.PreparsedElementType.STYLESHEET) {
                // Skipping <script> for security reasons
                // Skipping <style> and stylesheets as we already processed them
                // in the StyleCompiler
                return null;
            }
            var children = html.visitAll(this, ast.children, null);
            return new t.Element(ast.name, html.visitAll(this, ast.attrs), 
            /* inputs */ [], /* outputs */ [], children, /* references */ [], ast.sourceSpan, ast.startSourceSpan, ast.endSourceSpan);
        };
        NonBindableVisitor.prototype.visitComment = function (comment) { return null; };
        NonBindableVisitor.prototype.visitAttribute = function (attribute) {
            return new t.TextAttribute(attribute.name, attribute.value, attribute.sourceSpan);
        };
        NonBindableVisitor.prototype.visitText = function (text) { return new t.Text(text.value, text.sourceSpan); };
        NonBindableVisitor.prototype.visitExpansion = function (expansion) { return null; };
        NonBindableVisitor.prototype.visitExpansionCase = function (expansionCase) { return null; };
        return NonBindableVisitor;
    }());
    var NON_BINDABLE_VISITOR = new NonBindableVisitor();
    function normalizeAttributeName(attrName) {
        return /^data-/i.test(attrName) ? attrName.substring(5) : attrName;
    }
    function addEvents(events, boundEvents) {
        boundEvents.push.apply(boundEvents, tslib_1.__spread(events.map(function (e) { return t.BoundEvent.fromParsedEvent(e); })));
    }
    function isEmptyTextNode(node) {
        return node instanceof html.Text && node.value.trim().length == 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVtcGxhdGVfdHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3JlbmRlcjMvcjNfdGVtcGxhdGVfdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUdILDBEQUF5QztJQUN6QyxxRkFBMEQ7SUFDMUQsNkRBQStDO0lBQy9DLCtEQUEyRTtJQUMzRSwrRUFBMkQ7SUFFM0QsK0ZBQTRGO0lBQzVGLG1EQUFvQztJQUVwQyx3REFBOEI7SUFHOUIsSUFBTSxnQkFBZ0IsR0FDbEIsMEdBQTBHLENBQUM7SUFFL0csb0JBQW9CO0lBQ3BCLElBQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztJQUN0QixtQkFBbUI7SUFDbkIsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLHFCQUFxQjtJQUNyQixJQUFNLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDckIsa0JBQWtCO0lBQ2xCLElBQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztJQUNwQixzQkFBc0I7SUFDdEIsSUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLGdCQUFnQjtJQUNoQixJQUFNLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDcEIsb0ZBQW9GO0lBQ3BGLElBQU0sWUFBWSxHQUFHLENBQUMsQ0FBQztJQUN2QixtQ0FBbUM7SUFDbkMsSUFBTSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7SUFDL0IsaUNBQWlDO0lBQ2pDLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0lBQzdCLGtDQUFrQztJQUNsQyxJQUFNLGVBQWUsR0FBRyxFQUFFLENBQUM7SUFFM0IsSUFBTSxvQkFBb0IsR0FBRyxHQUFHLENBQUM7SUFDakMsNERBQTREO0lBQzVELElBQU0sd0JBQXdCLEdBQUcsR0FBRyxDQUFDO0lBV3JDLFNBQWdCLG1CQUFtQixDQUMvQixTQUFzQixFQUFF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SUFBSSxZQUFZLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO0lBQ3BFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGFyc2VkRXZlbnQsIFBhcnNlZFByb3BlcnR5LCBQYXJzZWRWYXJpYWJsZX0gZnJvbSAnLi4vZXhwcmVzc2lvbl9wYXJzZXIvYXN0JztcbmltcG9ydCAqIGFzIGh0bWwgZnJvbSAnLi4vbWxfcGFyc2VyL2FzdCc7XG5pbXBvcnQge3JlcGxhY2VOZ3NwfSBmcm9tICcuLi9tbF9wYXJzZXIvaHRtbF93aGl0ZXNwYWNlcyc7XG5pbXBvcnQge2lzTmdUZW1wbGF0ZX0gZnJvbSAnLi4vbWxfcGFyc2VyL3RhZ3MnO1xuaW1wb3J0IHtQYXJzZUVycm9yLCBQYXJzZUVycm9yTGV2ZWwsIFBhcnNlU291cmNlU3Bhbn0gZnJvbSAnLi4vcGFyc2VfdXRpbCc7XG5pbXBvcnQge2lzU3R5bGVVcmxSZXNvbHZhYmxlfSBmcm9tICcuLi9zdHlsZV91cmxfcmVzb2x2ZXInO1xuaW1wb3J0IHtCaW5kaW5nUGFyc2VyfSBmcm9tICcuLi90ZW1wbGF0ZV9wYXJzZXIvYmluZGluZ19wYXJzZXInO1xuaW1wb3J0IHtQcmVwYXJzZWRFbGVtZW50VHlwZSwgcHJlcGFyc2VFbGVtZW50fSBmcm9tICcuLi90ZW1wbGF0ZV9wYXJzZXIvdGVtcGxhdGVfcHJlcGFyc2VyJztcbmltcG9ydCB7c3ludGF4RXJyb3J9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQgKiBhcyB0IGZyb20gJy4vcjNfYXN0JztcblxuXG5jb25zdCBCSU5EX05BTUVfUkVHRVhQID1cbiAgICAvXig/Oig/Oig/OihiaW5kLSl8KGxldC0pfChyZWYtfCMpfChvbi0pfChiaW5kb24tKXwoQCkpKC4rKSl8XFxbXFwoKFteXFwpXSspXFwpXFxdfFxcWyhbXlxcXV0rKVxcXXxcXCgoW15cXCldKylcXCkpJC87XG5cbi8vIEdyb3VwIDEgPSBcImJpbmQtXCJcbmNvbnN0IEtXX0JJTkRfSURYID0gMTtcbi8vIEdyb3VwIDIgPSBcImxldC1cIlxuY29uc3QgS1dfTEVUX0lEWCA9IDI7XG4vLyBHcm91cCAzID0gXCJyZWYtLyNcIlxuY29uc3QgS1dfUkVGX0lEWCA9IDM7XG4vLyBHcm91cCA0ID0gXCJvbi1cIlxuY29uc3QgS1dfT05fSURYID0gNDtcbi8vIEdyb3VwIDUgPSBcImJpbmRvbi1cIlxuY29uc3QgS1dfQklORE9OX0lEWCA9IDU7XG4vLyBHcm91cCA2ID0gXCJAXCJcbmNvbnN0IEtXX0FUX0lEWCA9IDY7XG4vLyBHcm91cCA3ID0gdGhlIGlkZW50aWZpZXIgYWZ0ZXIgXCJiaW5kLVwiLCBcImxldC1cIiwgXCJyZWYtLyNcIiwgXCJvbi1cIiwgXCJiaW5kb24tXCIgb3IgXCJAXCJcbmNvbnN0IElERU5UX0tXX0lEWCA9IDc7XG4vLyBHcm91cCA4ID0gaWRlbnRpZmllciBpbnNpZGUgWygpXVxuY29uc3QgSURFTlRfQkFOQU5BX0JPWF9JRFggPSA4O1xuLy8gR3JvdXAgOSA9IGlkZW50aWZpZXIgaW5zaWRlIFtdXG5jb25zdCBJREVOVF9QUk9QRVJUWV9JRFggPSA5O1xuLy8gR3JvdXAgMTAgPSBpZGVudGlmaWVyIGluc2lkZSAoKVxuY29uc3QgSURFTlRfRVZFTlRfSURYID0gMTA7XG5cbmNvbnN0IFRFTVBMQVRFX0FUVFJfUFJFRklYID0gJyonO1xuLy8gRGVmYXVsdCBzZWxlY3RvciB1c2VkIGJ5IGA8bmctY29udGVudD5gIGlmIG5vbmUgc3BlY2lmaWVkXG5jb25zdCBERUZBVUxUX0NPTlRFTlRfU0VMRUNUT1IgPSAnKic7XG5cbi8vIFJlc3VsdCBvZiB0aGUgaHRtbCBBU1QgdG8gSXZ5IEFTVCB0cmFuc2Zvcm1hdGlvblxuZXhwb3J0IHR5cGUgUmVuZGVyM1BhcnNlUmVzdWx0ID0ge1xuICBub2RlczogdC5Ob2RlW107IGVycm9yczogUGFyc2VFcnJvcltdO1xuICAvLyBBbnkgbm9uIGRlZmF1bHQgKGVtcHR5IG9yICcqJykgc2VsZWN0b3IgZm91bmQgaW4gdGhlIHRlbXBsYXRlXG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG4gIC8vIFdldGhlciB0aGUgdGVtcGxhdGUgY29udGFpbnMgYW55IGA8bmctY29udGVudD5gXG4gIGhhc05nQ29udGVudDogYm9vbGVhbjtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBodG1sQXN0VG9SZW5kZXIzQXN0KFxuICAgIGh0bWxOb2RlczogaHRtbC5Ob2RlW10sIGJpbmRpbmdQYXJzZXI6IEJpbmRpbmdQYXJzZXIpOiBSZW5kZXIzUGFyc2VSZXN1bHQge1xuICBjb25zdCB0cmFuc2Zvcm1lciA9IG5ldyBIdG1sQXN0VG9JdnlBc3QoYmluZGluZ1BhcnNlcik7XG4gIGNvbnN0IGl2eU5vZGVzID0gaHRtbC52aXNpdEFsbCh0cmFuc2Zvcm1lciwgaHRtbE5vZGVzKTtcblxuICAvLyBFcnJvcnMgbWlnaHQgb3JpZ2luYXRlIGluIGVpdGhlciB0aGUgYmluZGluZyBwYXJzZXIgb3IgdGhlIGh0bWwgdG8gaXZ5IHRyYW5zZm9ybWVyXG4gIGNvbnN0IGFsbEVycm9ycyA9IGJpbmRpbmdQYXJzZXIuZXJyb3JzLmNvbmNhdCh0cmFuc2Zvcm1lci5lcnJvcnMpO1xuICBjb25zdCBlcnJvcnM6IFBhcnNlRXJyb3JbXSA9IGFsbEVycm9ycy5maWx0ZXIoZSA9PiBlLmxldmVsID09PSBQYXJzZUVycm9yTGV2ZWwuRVJST1IpO1xuXG4gIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGVycm9yU3RyaW5nID0gZXJyb3JzLmpvaW4oJ1xcbicpO1xuICAgIHRocm93IHN5bnRheEVycm9yKGBUZW1wbGF0ZSBwYXJzZSBlcnJvcnM6XFxuJHtlcnJvclN0cmluZ31gLCBlcnJvcnMpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBub2RlczogaXZ5Tm9kZXMsXG4gICAgZXJyb3JzOiBhbGxFcnJvcnMsXG4gICAgbmdDb250ZW50U2VsZWN0b3JzOiB0cmFuc2Zvcm1lci5uZ0NvbnRlbnRTZWxlY3RvcnMsXG4gICAgaGFzTmdDb250ZW50OiB0cmFuc2Zvcm1lci5oYXNOZ0NvbnRlbnQsXG4gIH07XG59XG5cbmNsYXNzIEh0bWxBc3RUb0l2eUFzdCBpbXBsZW1lbnRzIGh0bWwuVmlzaXRvciB7XG4gIGVycm9yczogUGFyc2VFcnJvcltdID0gW107XG4gIC8vIFNlbGVjdG9ycyBmb3IgdGhlIGBuZy1jb250ZW50YCB0YWdzLiBPbmx5IG5vbiBgKmAgc2VsZWN0b3JzIGFyZSByZWNvcmRlZCBoZXJlXG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW10gPSBbXTtcbiAgLy8gQW55IGA8bmctY29udGVudD5gIGluIHRoZSB0ZW1wbGF0ZSA/XG4gIGhhc05nQ29udGVudCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYmluZGluZ1BhcnNlcjogQmluZGluZ1BhcnNlcikge31cblxuICAvLyBIVE1MIHZpc2l0b3JcbiAgdmlzaXRFbGVtZW50KGVsZW1lbnQ6IGh0bWwuRWxlbWVudCk6IHQuTm9kZXxudWxsIHtcbiAgICBjb25zdCBwcmVwYXJzZWRFbGVtZW50ID0gcHJlcGFyc2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGlmIChwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNDUklQVCB8fFxuICAgICAgICBwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNUWUxFKSB7XG4gICAgICAvLyBTa2lwcGluZyA8c2NyaXB0PiBmb3Igc2VjdXJpdHkgcmVhc29uc1xuICAgICAgLy8gU2tpcHBpbmcgPHN0eWxlPiBhcyB3ZSBhbHJlYWR5IHByb2Nlc3NlZCB0aGVtXG4gICAgICAvLyBpbiB0aGUgU3R5bGVDb21waWxlclxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmIChwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNUWUxFU0hFRVQgJiZcbiAgICAgICAgaXNTdHlsZVVybFJlc29sdmFibGUocHJlcGFyc2VkRWxlbWVudC5ocmVmQXR0cikpIHtcbiAgICAgIC8vIFNraXBwaW5nIHN0eWxlc2hlZXRzIHdpdGggZWl0aGVyIHJlbGF0aXZlIHVybHMgb3IgcGFja2FnZSBzY2hlbWUgYXMgd2UgYWxyZWFkeSBwcm9jZXNzZWRcbiAgICAgIC8vIHRoZW0gaW4gdGhlIFN0eWxlQ29tcGlsZXJcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgYSBgPG5nLXRlbXBsYXRlPmBcbiAgICBjb25zdCBpc1RlbXBsYXRlRWxlbWVudCA9IGlzTmdUZW1wbGF0ZShlbGVtZW50Lm5hbWUpO1xuXG4gICAgY29uc3QgcGFyc2VkUHJvcGVydGllczogUGFyc2VkUHJvcGVydHlbXSA9IFtdO1xuICAgIGNvbnN0IGJvdW5kRXZlbnRzOiB0LkJvdW5kRXZlbnRbXSA9IFtdO1xuICAgIGNvbnN0IHZhcmlhYmxlczogdC5WYXJpYWJsZVtdID0gW107XG4gICAgY29uc3QgcmVmZXJlbmNlczogdC5SZWZlcmVuY2VbXSA9IFtdO1xuICAgIGNvbnN0IGF0dHJpYnV0ZXM6IHQuVGV4dEF0dHJpYnV0ZVtdID0gW107XG5cbiAgICBjb25zdCB0ZW1wbGF0ZVBhcnNlZFByb3BlcnRpZXM6IFBhcnNlZFByb3BlcnR5W10gPSBbXTtcbiAgICBjb25zdCB0ZW1wbGF0ZVZhcmlhYmxlczogdC5WYXJpYWJsZVtdID0gW107XG5cbiAgICAvLyBXaGV0aGVyIHRoZSBlbGVtZW50IGhhcyBhbnkgKi1hdHRyaWJ1dGVcbiAgICBsZXQgZWxlbWVudEhhc0lubGluZVRlbXBsYXRlID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBlbGVtZW50LmF0dHJzKSB7XG4gICAgICBsZXQgaGFzQmluZGluZyA9IGZhbHNlO1xuICAgICAgY29uc3Qgbm9ybWFsaXplZE5hbWUgPSBub3JtYWxpemVBdHRyaWJ1dGVOYW1lKGF0dHJpYnV0ZS5uYW1lKTtcblxuICAgICAgLy8gYCphdHRyYCBkZWZpbmVzIHRlbXBsYXRlIGJpbmRpbmdzXG4gICAgICBsZXQgaXNUZW1wbGF0ZUJpbmRpbmcgPSBmYWxzZTtcblxuICAgICAgaWYgKG5vcm1hbGl6ZWROYW1lLnN0YXJ0c1dpdGgoVEVNUExBVEVfQVRUUl9QUkVGSVgpKSB7XG4gICAgICAgIC8vICotYXR0cmlidXRlc1xuICAgICAgICBpZiAoZWxlbWVudEhhc0lubGluZVRlbXBsYXRlKSB7XG4gICAgICAgICAgdGhpcy5yZXBvcnRFcnJvcihcbiAgICAgICAgICAgICAgYENhbid0IGhhdmUgbXVsdGlwbGUgdGVtcGxhdGUgYmluZGluZ3Mgb24gb25lIGVsZW1lbnQuIFVzZSBvbmx5IG9uZSBhdHRyaWJ1dGUgcHJlZml4ZWQgd2l0aCAqYCxcbiAgICAgICAgICAgICAgYXR0cmlidXRlLnNvdXJjZVNwYW4pO1xuICAgICAgICB9XG4gICAgICAgIGlzVGVtcGxhdGVCaW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgZWxlbWVudEhhc0lubGluZVRlbXBsYXRlID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVWYWx1ZSA9IGF0dHJpYnV0ZS52YWx1ZTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVLZXkgPSBub3JtYWxpemVkTmFtZS5zdWJzdHJpbmcoVEVNUExBVEVfQVRUUl9QUkVGSVgubGVuZ3RoKTtcblxuICAgICAgICBjb25zdCBwYXJzZWRWYXJpYWJsZXM6IFBhcnNlZFZhcmlhYmxlW10gPSBbXTtcbiAgICAgICAgdGhpcy5iaW5kaW5nUGFyc2VyLnBhcnNlSW5saW5lVGVtcGxhdGVCaW5kaW5nKFxuICAgICAgICAgICAgdGVtcGxhdGVLZXksIHRlbXBsYXRlVmFsdWUsIGF0dHJpYnV0ZS5zb3VyY2VTcGFuLCBbXSwgdGVtcGxhdGVQYXJzZWRQcm9wZXJ0aWVzLFxuICAgICAgICAgICAgcGFyc2VkVmFyaWFibGVzKTtcbiAgICAgICAgdGVtcGxhdGVWYXJpYWJsZXMucHVzaChcbiAgICAgICAgICAgIC4uLnBhcnNlZFZhcmlhYmxlcy5tYXAodiA9PiBuZXcgdC5WYXJpYWJsZSh2Lm5hbWUsIHYudmFsdWUsIHYuc291cmNlU3BhbikpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENoZWNrIGZvciB2YXJpYWJsZXMsIGV2ZW50cywgcHJvcGVydHkgYmluZGluZ3MsIGludGVycG9sYXRpb25cbiAgICAgICAgaGFzQmluZGluZyA9IHRoaXMucGFyc2VBdHRyaWJ1dGUoXG4gICAgICAgICAgICBpc1RlbXBsYXRlRWxlbWVudCwgYXR0cmlidXRlLCBbXSwgcGFyc2VkUHJvcGVydGllcywgYm91bmRFdmVudHMsIHZhcmlhYmxlcywgcmVmZXJlbmNlcyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghaGFzQmluZGluZyAmJiAhaXNUZW1wbGF0ZUJpbmRpbmcpIHtcbiAgICAgICAgLy8gZG9uJ3QgaW5jbHVkZSB0aGUgYmluZGluZ3MgYXMgYXR0cmlidXRlcyBhcyB3ZWxsIGluIHRoZSBBU1RcbiAgICAgICAgYXR0cmlidXRlcy5wdXNoKHRoaXMudmlzaXRBdHRyaWJ1dGUoYXR0cmlidXRlKSBhcyB0LlRleHRBdHRyaWJ1dGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNoaWxkcmVuOiB0Lk5vZGVbXSA9XG4gICAgICAgIGh0bWwudmlzaXRBbGwocHJlcGFyc2VkRWxlbWVudC5ub25CaW5kYWJsZSA/IE5PTl9CSU5EQUJMRV9WSVNJVE9SIDogdGhpcywgZWxlbWVudC5jaGlsZHJlbik7XG5cbiAgICBsZXQgcGFyc2VkRWxlbWVudDogdC5Ob2RlfHVuZGVmaW5lZDtcbiAgICBpZiAocHJlcGFyc2VkRWxlbWVudC50eXBlID09PSBQcmVwYXJzZWRFbGVtZW50VHlwZS5OR19DT05URU5UKSB7XG4gICAgICAvLyBgPG5nLWNvbnRlbnQ+YFxuICAgICAgdGhpcy5oYXNOZ0NvbnRlbnQgPSB0cnVlO1xuXG4gICAgICBpZiAoZWxlbWVudC5jaGlsZHJlbiAmJiAhZWxlbWVudC5jaGlsZHJlbi5ldmVyeShpc0VtcHR5VGV4dE5vZGUpKSB7XG4gICAgICAgIHRoaXMucmVwb3J0RXJyb3IoYDxuZy1jb250ZW50PiBlbGVtZW50IGNhbm5vdCBoYXZlIGNvbnRlbnQuYCwgZWxlbWVudC5zb3VyY2VTcGFuKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2VsZWN0b3IgPSBwcmVwYXJzZWRFbGVtZW50LnNlbGVjdEF0dHI7XG5cbiAgICAgIGxldCBhdHRyaWJ1dGVzOiB0LlRleHRBdHRyaWJ1dGVbXSA9XG4gICAgICAgICAgZWxlbWVudC5hdHRycy5tYXAoYXR0cmlidXRlID0+IHRoaXMudmlzaXRBdHRyaWJ1dGUoYXR0cmlidXRlKSk7XG5cbiAgICAgIGNvbnN0IHNlbGVjdG9ySW5kZXggPVxuICAgICAgICAgIHNlbGVjdG9yID09PSBERUZBVUxUX0NPTlRFTlRfU0VMRUNUT1IgPyAwIDogdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMucHVzaChzZWxlY3Rvcik7XG4gICAgICBwYXJzZWRFbGVtZW50ID0gbmV3IHQuQ29udGVudChzZWxlY3RvckluZGV4LCBhdHRyaWJ1dGVzLCBlbGVtZW50LnNvdXJjZVNwYW4pO1xuICAgIH0gZWxzZSBpZiAoaXNUZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICAgIC8vIGA8bmctdGVtcGxhdGU+YFxuICAgICAgY29uc3QgYXR0cnMgPSB0aGlzLmV4dHJhY3RBdHRyaWJ1dGVzKGVsZW1lbnQubmFtZSwgcGFyc2VkUHJvcGVydGllcyk7XG5cbiAgICAgIHBhcnNlZEVsZW1lbnQgPSBuZXcgdC5UZW1wbGF0ZShcbiAgICAgICAgICBhdHRyaWJ1dGVzLCBhdHRycy5ib3VuZCwgYm91bmRFdmVudHMsIGNoaWxkcmVuLCByZWZlcmVuY2VzLCB2YXJpYWJsZXMsIGVsZW1lbnQuc291cmNlU3BhbixcbiAgICAgICAgICBlbGVtZW50LnN0YXJ0U291cmNlU3BhbiwgZWxlbWVudC5lbmRTb3VyY2VTcGFuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYXR0cnMgPSB0aGlzLmV4dHJhY3RBdHRyaWJ1dGVzKGVsZW1lbnQubmFtZSwgcGFyc2VkUHJvcGVydGllcyk7XG5cbiAgICAgIHBhcnNlZEVsZW1lbnQgPSBuZXcgdC5FbGVtZW50KFxuICAgICAgICAgIGVsZW1lbnQubmFtZSwgYXR0cmlidXRlcywgYXR0cnMuYm91bmQsIGJvdW5kRXZlbnRzLCBjaGlsZHJlbiwgcmVmZXJlbmNlcyxcbiAgICAgICAgICBlbGVtZW50LnNvdXJjZVNwYW4sIGVsZW1lbnQuc3RhcnRTb3VyY2VTcGFuLCBlbGVtZW50LmVuZFNvdXJjZVNwYW4pO1xuICAgIH1cblxuICAgIGlmIChlbGVtZW50SGFzSW5saW5lVGVtcGxhdGUpIHtcbiAgICAgIGNvbnN0IGF0dHJzID0gdGhpcy5leHRyYWN0QXR0cmlidXRlcygnbmctdGVtcGxhdGUnLCB0ZW1wbGF0ZVBhcnNlZFByb3BlcnRpZXMpO1xuICAgICAgLy8gVE9ETyhwayk6IHRlc3QgZm9yIHRoaXMgY2FzZVxuICAgICAgcGFyc2VkRWxlbWVudCA9IG5ldyB0LlRlbXBsYXRlKFxuICAgICAgICAgIGF0dHJzLmxpdGVyYWwsIGF0dHJzLmJvdW5kLCBbXSwgW3BhcnNlZEVsZW1lbnRdLCBbXSwgdGVtcGxhdGVWYXJpYWJsZXMsXG4gICAgICAgICAgZWxlbWVudC5zb3VyY2VTcGFuLCBlbGVtZW50LnN0YXJ0U291cmNlU3BhbiwgZWxlbWVudC5lbmRTb3VyY2VTcGFuKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcnNlZEVsZW1lbnQ7XG4gIH1cblxuICB2aXNpdEF0dHJpYnV0ZShhdHRyaWJ1dGU6IGh0bWwuQXR0cmlidXRlKTogdC5UZXh0QXR0cmlidXRlIHtcbiAgICByZXR1cm4gbmV3IHQuVGV4dEF0dHJpYnV0ZShcbiAgICAgICAgYXR0cmlidXRlLm5hbWUsIGF0dHJpYnV0ZS52YWx1ZSwgYXR0cmlidXRlLnNvdXJjZVNwYW4sIGF0dHJpYnV0ZS52YWx1ZVNwYW4pO1xuICB9XG5cbiAgdmlzaXRUZXh0KHRleHQ6IGh0bWwuVGV4dCk6IHQuTm9kZSB7XG4gICAgY29uc3QgdmFsdWVOb05nc3AgPSByZXBsYWNlTmdzcCh0ZXh0LnZhbHVlKTtcbiAgICBjb25zdCBleHByID0gdGhpcy5iaW5kaW5nUGFyc2VyLnBhcnNlSW50ZXJwb2xhdGlvbih2YWx1ZU5vTmdzcCwgdGV4dC5zb3VyY2VTcGFuKTtcbiAgICByZXR1cm4gZXhwciA/IG5ldyB0LkJvdW5kVGV4dChleHByLCB0ZXh0LnNvdXJjZVNwYW4pIDogbmV3IHQuVGV4dCh2YWx1ZU5vTmdzcCwgdGV4dC5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0Q29tbWVudChjb21tZW50OiBodG1sLkNvbW1lbnQpOiBudWxsIHsgcmV0dXJuIG51bGw7IH1cblxuICB2aXNpdEV4cGFuc2lvbihleHBhbnNpb246IGh0bWwuRXhwYW5zaW9uKTogbnVsbCB7IHJldHVybiBudWxsOyB9XG5cbiAgdmlzaXRFeHBhbnNpb25DYXNlKGV4cGFuc2lvbkNhc2U6IGh0bWwuRXhwYW5zaW9uQ2FzZSk6IG51bGwgeyByZXR1cm4gbnVsbDsgfVxuXG4gIC8vIGNvbnZlcnQgdmlldyBlbmdpbmUgYFBhcnNlZFByb3BlcnR5YCB0byBhIGZvcm1hdCBzdWl0YWJsZSBmb3IgSVZZXG4gIHByaXZhdGUgZXh0cmFjdEF0dHJpYnV0ZXMoZWxlbWVudE5hbWU6IHN0cmluZywgcHJvcGVydGllczogUGFyc2VkUHJvcGVydHlbXSk6XG4gICAgICB7Ym91bmQ6IHQuQm91bmRBdHRyaWJ1dGVbXSwgbGl0ZXJhbDogdC5UZXh0QXR0cmlidXRlW119IHtcbiAgICBjb25zdCBib3VuZDogdC5Cb3VuZEF0dHJpYnV0ZVtdID0gW107XG4gICAgY29uc3QgbGl0ZXJhbDogdC5UZXh0QXR0cmlidXRlW10gPSBbXTtcblxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIGlmIChwcm9wLmlzTGl0ZXJhbCkge1xuICAgICAgICBsaXRlcmFsLnB1c2gobmV3IHQuVGV4dEF0dHJpYnV0ZShwcm9wLm5hbWUsIHByb3AuZXhwcmVzc2lvbi5zb3VyY2UgfHwgJycsIHByb3Auc291cmNlU3BhbikpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgYmVwID0gdGhpcy5iaW5kaW5nUGFyc2VyLmNyZWF0ZUJvdW5kRWxlbWVudFByb3BlcnR5KGVsZW1lbnROYW1lLCBwcm9wKTtcbiAgICAgICAgYm91bmQucHVzaCh0LkJvdW5kQXR0cmlidXRlLmZyb21Cb3VuZEVsZW1lbnRQcm9wZXJ0eShiZXApKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB7Ym91bmQsIGxpdGVyYWx9O1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUF0dHJpYnV0ZShcbiAgICAgIGlzVGVtcGxhdGVFbGVtZW50OiBib29sZWFuLCBhdHRyaWJ1dGU6IGh0bWwuQXR0cmlidXRlLCBtYXRjaGFibGVBdHRyaWJ1dGVzOiBzdHJpbmdbXVtdLFxuICAgICAgcGFyc2VkUHJvcGVydGllczogUGFyc2VkUHJvcGVydHlbXSwgYm91bmRFdmVudHM6IHQuQm91bmRFdmVudFtdLCB2YXJpYWJsZXM6IHQuVmFyaWFibGVbXSxcbiAgICAgIHJlZmVyZW5jZXM6IHQuUmVmZXJlbmNlW10pIHtcbiAgICBjb25zdCBuYW1lID0gbm9ybWFsaXplQXR0cmlidXRlTmFtZShhdHRyaWJ1dGUubmFtZSk7XG4gICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgY29uc3Qgc3JjU3BhbiA9IGF0dHJpYnV0ZS5zb3VyY2VTcGFuO1xuXG4gICAgY29uc3QgYmluZFBhcnRzID0gbmFtZS5tYXRjaChCSU5EX05BTUVfUkVHRVhQKTtcbiAgICBsZXQgaGFzQmluZGluZyA9IGZhbHNlO1xuXG4gICAgaWYgKGJpbmRQYXJ0cykge1xuICAgICAgaGFzQmluZGluZyA9IHRydWU7XG4gICAgICBpZiAoYmluZFBhcnRzW0tXX0JJTkRfSURYXSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZVByb3BlcnR5QmluZGluZyhcbiAgICAgICAgICAgIGJpbmRQYXJ0c1tJREVOVF9LV19JRFhdLCB2YWx1ZSwgZmFsc2UsIHNyY1NwYW4sIG1hdGNoYWJsZUF0dHJpYnV0ZXMsIHBhcnNlZFByb3BlcnRpZXMpO1xuXG4gICAgICB9IGVsc2UgaWYgKGJpbmRQYXJ0c1tLV19MRVRfSURYXSkge1xuICAgICAgICBpZiAoaXNUZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICAgICAgICBjb25zdCBpZGVudGlmaWVyID0gYmluZFBhcnRzW0lERU5UX0tXX0lEWF07XG4gICAgICAgICAgdGhpcy5wYXJzZVZhcmlhYmxlKGlkZW50aWZpZXIsIHZhbHVlLCBzcmNTcGFuLCB2YXJpYWJsZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMucmVwb3J0RXJyb3IoYFwibGV0LVwiIGlzIG9ubHkgc3VwcG9ydGVkIG9uIG5nLXRlbXBsYXRlIGVsZW1lbnRzLmAsIHNyY1NwYW4pO1xuICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSBpZiAoYmluZFBhcnRzW0tXX1JFRl9JRFhdKSB7XG4gICAgICAgIGNvbnN0IGlkZW50aWZpZXIgPSBiaW5kUGFydHNbSURFTlRfS1dfSURYXTtcbiAgICAgICAgdGhpcy5wYXJzZVJlZmVyZW5jZShpZGVudGlmaWVyLCB2YWx1ZSwgc3JjU3BhbiwgcmVmZXJlbmNlcyk7XG5cbiAgICAgIH0gZWxzZSBpZiAoYmluZFBhcnRzW0tXX09OX0lEWF0pIHtcbiAgICAgICAgY29uc3QgZXZlbnRzOiBQYXJzZWRFdmVudFtdID0gW107XG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZUV2ZW50KFxuICAgICAgICAgICAgYmluZFBhcnRzW0lERU5UX0tXX0lEWF0sIHZhbHVlLCBzcmNTcGFuLCBtYXRjaGFibGVBdHRyaWJ1dGVzLCBldmVudHMpO1xuICAgICAgICBhZGRFdmVudHMoZXZlbnRzLCBib3VuZEV2ZW50cyk7XG4gICAgICB9IGVsc2UgaWYgKGJpbmRQYXJ0c1tLV19CSU5ET05fSURYXSkge1xuICAgICAgICB0aGlzLmJpbmRpbmdQYXJzZXIucGFyc2VQcm9wZXJ0eUJpbmRpbmcoXG4gICAgICAgICAgICBiaW5kUGFydHNbSURFTlRfS1dfSURYXSwgdmFsdWUsIGZhbHNlLCBzcmNTcGFuLCBtYXRjaGFibGVBdHRyaWJ1dGVzLCBwYXJzZWRQcm9wZXJ0aWVzKTtcbiAgICAgICAgdGhpcy5wYXJzZUFzc2lnbm1lbnRFdmVudChcbiAgICAgICAgICAgIGJpbmRQYXJ0c1tJREVOVF9LV19JRFhdLCB2YWx1ZSwgc3JjU3BhbiwgbWF0Y2hhYmxlQXR0cmlidXRlcywgYm91bmRFdmVudHMpO1xuICAgICAgfSBlbHNlIGlmIChiaW5kUGFydHNbS1dfQVRfSURYXSkge1xuICAgICAgICB0aGlzLmJpbmRpbmdQYXJzZXIucGFyc2VMaXRlcmFsQXR0cihcbiAgICAgICAgICAgIG5hbWUsIHZhbHVlLCBzcmNTcGFuLCBtYXRjaGFibGVBdHRyaWJ1dGVzLCBwYXJzZWRQcm9wZXJ0aWVzKTtcblxuICAgICAgfSBlbHNlIGlmIChiaW5kUGFydHNbSURFTlRfQkFOQU5BX0JPWF9JRFhdKSB7XG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZVByb3BlcnR5QmluZGluZyhcbiAgICAgICAgICAgIGJpbmRQYXJ0c1tJREVOVF9CQU5BTkFfQk9YX0lEWF0sIHZhbHVlLCBmYWxzZSwgc3JjU3BhbiwgbWF0Y2hhYmxlQXR0cmlidXRlcyxcbiAgICAgICAgICAgIHBhcnNlZFByb3BlcnRpZXMpO1xuICAgICAgICB0aGlzLnBhcnNlQXNzaWdubWVudEV2ZW50KFxuICAgICAgICAgICAgYmluZFBhcnRzW0lERU5UX0JBTkFOQV9CT1hfSURYXSwgdmFsdWUsIHNyY1NwYW4sIG1hdGNoYWJsZUF0dHJpYnV0ZXMsIGJvdW5kRXZlbnRzKTtcblxuICAgICAgfSBlbHNlIGlmIChiaW5kUGFydHNbSURFTlRfUFJPUEVSVFlfSURYXSkge1xuICAgICAgICB0aGlzLmJpbmRpbmdQYXJzZXIucGFyc2VQcm9wZXJ0eUJpbmRpbmcoXG4gICAgICAgICAgICBiaW5kUGFydHNbSURFTlRfUFJPUEVSVFlfSURYXSwgdmFsdWUsIGZhbHNlLCBzcmNTcGFuLCBtYXRjaGFibGVBdHRyaWJ1dGVzLFxuICAgICAgICAgICAgcGFyc2VkUHJvcGVydGllcyk7XG5cbiAgICAgIH0gZWxzZSBpZiAoYmluZFBhcnRzW0lERU5UX0VWRU5UX0lEWF0pIHtcbiAgICAgICAgY29uc3QgZXZlbnRzOiBQYXJzZWRFdmVudFtdID0gW107XG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZUV2ZW50KFxuICAgICAgICAgICAgYmluZFBhcnRzW0lERU5UX0VWRU5UX0lEWF0sIHZhbHVlLCBzcmNTcGFuLCBtYXRjaGFibGVBdHRyaWJ1dGVzLCBldmVudHMpO1xuICAgICAgICBhZGRFdmVudHMoZXZlbnRzLCBib3VuZEV2ZW50cyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGhhc0JpbmRpbmcgPSB0aGlzLmJpbmRpbmdQYXJzZXIucGFyc2VQcm9wZXJ0eUludGVycG9sYXRpb24oXG4gICAgICAgICAgbmFtZSwgdmFsdWUsIHNyY1NwYW4sIG1hdGNoYWJsZUF0dHJpYnV0ZXMsIHBhcnNlZFByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIHJldHVybiBoYXNCaW5kaW5nO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZVZhcmlhYmxlKFxuICAgICAgaWRlbnRpZmllcjogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4sIHZhcmlhYmxlczogdC5WYXJpYWJsZVtdKSB7XG4gICAgaWYgKGlkZW50aWZpZXIuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgIHRoaXMucmVwb3J0RXJyb3IoYFwiLVwiIGlzIG5vdCBhbGxvd2VkIGluIHZhcmlhYmxlIG5hbWVzYCwgc291cmNlU3Bhbik7XG4gICAgfVxuICAgIHZhcmlhYmxlcy5wdXNoKG5ldyB0LlZhcmlhYmxlKGlkZW50aWZpZXIsIHZhbHVlLCBzb3VyY2VTcGFuKSk7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlUmVmZXJlbmNlKFxuICAgICAgaWRlbnRpZmllcjogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4sIHJlZmVyZW5jZXM6IHQuUmVmZXJlbmNlW10pIHtcbiAgICBpZiAoaWRlbnRpZmllci5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgdGhpcy5yZXBvcnRFcnJvcihgXCItXCIgaXMgbm90IGFsbG93ZWQgaW4gcmVmZXJlbmNlIG5hbWVzYCwgc291cmNlU3Bhbik7XG4gICAgfVxuXG4gICAgcmVmZXJlbmNlcy5wdXNoKG5ldyB0LlJlZmVyZW5jZShpZGVudGlmaWVyLCB2YWx1ZSwgc291cmNlU3BhbikpO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUFzc2lnbm1lbnRFdmVudChcbiAgICAgIG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogc3RyaW5nLCBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4sXG4gICAgICB0YXJnZXRNYXRjaGFibGVBdHRyczogc3RyaW5nW11bXSwgYm91bmRFdmVudHM6IHQuQm91bmRFdmVudFtdKSB7XG4gICAgY29uc3QgZXZlbnRzOiBQYXJzZWRFdmVudFtdID0gW107XG4gICAgdGhpcy5iaW5kaW5nUGFyc2VyLnBhcnNlRXZlbnQoXG4gICAgICAgIGAke25hbWV9Q2hhbmdlYCwgYCR7ZXhwcmVzc2lvbn09JGV2ZW50YCwgc291cmNlU3BhbiwgdGFyZ2V0TWF0Y2hhYmxlQXR0cnMsIGV2ZW50cyk7XG4gICAgYWRkRXZlbnRzKGV2ZW50cywgYm91bmRFdmVudHMpO1xuICB9XG5cbiAgcHJpdmF0ZSByZXBvcnRFcnJvcihcbiAgICAgIG1lc3NhZ2U6IHN0cmluZywgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLFxuICAgICAgbGV2ZWw6IFBhcnNlRXJyb3JMZXZlbCA9IFBhcnNlRXJyb3JMZXZlbC5FUlJPUikge1xuICAgIHRoaXMuZXJyb3JzLnB1c2gobmV3IFBhcnNlRXJyb3Ioc291cmNlU3BhbiwgbWVzc2FnZSwgbGV2ZWwpKTtcbiAgfVxufVxuXG5jbGFzcyBOb25CaW5kYWJsZVZpc2l0b3IgaW1wbGVtZW50cyBodG1sLlZpc2l0b3Ige1xuICB2aXNpdEVsZW1lbnQoYXN0OiBodG1sLkVsZW1lbnQpOiB0LkVsZW1lbnR8bnVsbCB7XG4gICAgY29uc3QgcHJlcGFyc2VkRWxlbWVudCA9IHByZXBhcnNlRWxlbWVudChhc3QpO1xuICAgIGlmIChwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNDUklQVCB8fFxuICAgICAgICBwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNUWUxFIHx8XG4gICAgICAgIHByZXBhcnNlZEVsZW1lbnQudHlwZSA9PT0gUHJlcGFyc2VkRWxlbWVudFR5cGUuU1RZTEVTSEVFVCkge1xuICAgICAgLy8gU2tpcHBpbmcgPHNjcmlwdD4gZm9yIHNlY3VyaXR5IHJlYXNvbnNcbiAgICAgIC8vIFNraXBwaW5nIDxzdHlsZT4gYW5kIHN0eWxlc2hlZXRzIGFzIHdlIGFscmVhZHkgcHJvY2Vzc2VkIHRoZW1cbiAgICAgIC8vIGluIHRoZSBTdHlsZUNvbXBpbGVyXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBjaGlsZHJlbjogdC5Ob2RlW10gPSBodG1sLnZpc2l0QWxsKHRoaXMsIGFzdC5jaGlsZHJlbiwgbnVsbCk7XG4gICAgcmV0dXJuIG5ldyB0LkVsZW1lbnQoXG4gICAgICAgIGFzdC5uYW1lLCBodG1sLnZpc2l0QWxsKHRoaXMsIGFzdC5hdHRycykgYXMgdC5UZXh0QXR0cmlidXRlW10sXG4gICAgICAgIC8qIGlucHV0cyAqL1tdLCAvKiBvdXRwdXRzICovW10sIGNoaWxkcmVuLMKgIC8qIHJlZmVyZW5jZXMgKi9bXSwgYXN0LnNvdXJjZVNwYW4sXG4gICAgICAgIGFzdC5zdGFydFNvdXJjZVNwYW4sIGFzdC5lbmRTb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0Q29tbWVudChjb21tZW50OiBodG1sLkNvbW1lbnQpOiBhbnkgeyByZXR1cm4gbnVsbDsgfVxuXG4gIHZpc2l0QXR0cmlidXRlKGF0dHJpYnV0ZTogaHRtbC5BdHRyaWJ1dGUpOiB0LlRleHRBdHRyaWJ1dGUge1xuICAgIHJldHVybiBuZXcgdC5UZXh0QXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lLCBhdHRyaWJ1dGUudmFsdWUsIGF0dHJpYnV0ZS5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0VGV4dCh0ZXh0OiBodG1sLlRleHQpOiB0LlRleHQgeyByZXR1cm4gbmV3IHQuVGV4dCh0ZXh0LnZhbHVlLCB0ZXh0LnNvdXJjZVNwYW4pOyB9XG5cbiAgdmlzaXRFeHBhbnNpb24oZXhwYW5zaW9uOiBodG1sLkV4cGFuc2lvbik6IGFueSB7IHJldHVybiBudWxsOyB9XG5cbiAgdmlzaXRFeHBhbnNpb25DYXNlKGV4cGFuc2lvbkNhc2U6IGh0bWwuRXhwYW5zaW9uQ2FzZSk6IGFueSB7IHJldHVybiBudWxsOyB9XG59XG5cbmNvbnN0IE5PTl9CSU5EQUJMRV9WSVNJVE9SID0gbmV3IE5vbkJpbmRhYmxlVmlzaXRvcigpO1xuXG5mdW5jdGlvbiBub3JtYWxpemVBdHRyaWJ1dGVOYW1lKGF0dHJOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gL15kYXRhLS9pLnRlc3QoYXR0ck5hbWUpID8gYXR0ck5hbWUuc3Vic3RyaW5nKDUpIDogYXR0ck5hbWU7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50cyhldmVudHM6IFBhcnNlZEV2ZW50W10sIGJvdW5kRXZlbnRzOiB0LkJvdW5kRXZlbnRbXSkge1xuICBib3VuZEV2ZW50cy5wdXNoKC4uLmV2ZW50cy5tYXAoZSA9PiB0LkJvdW5kRXZlbnQuZnJvbVBhcnNlZEV2ZW50KGUpKSk7XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHlUZXh0Tm9kZShub2RlOiBodG1sLk5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBodG1sLlRleHQgJiYgbm9kZS52YWx1ZS50cmltKCkubGVuZ3RoID09IDA7XG59XG4iXX0=