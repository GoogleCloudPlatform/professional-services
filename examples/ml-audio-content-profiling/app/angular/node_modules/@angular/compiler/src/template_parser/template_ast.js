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
        define("@angular/compiler/src/template_parser/template_ast", ["require", "exports", "tslib"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var _a;
    /**
     * A segment of text within the template.
     */
    var TextAst = /** @class */ (function () {
        function TextAst(value, ngContentIndex, sourceSpan) {
            this.value = value;
            this.ngContentIndex = ngContentIndex;
            this.sourceSpan = sourceSpan;
        }
        TextAst.prototype.visit = function (visitor, context) { return visitor.visitText(this, context); };
        return TextAst;
    }());
    exports.TextAst = TextAst;
    /**
     * A bound expression within the text of a template.
     */
    var BoundTextAst = /** @class */ (function () {
        function BoundTextAst(value, ngContentIndex, sourceSpan) {
            this.value = value;
            this.ngContentIndex = ngContentIndex;
            this.sourceSpan = sourceSpan;
        }
        BoundTextAst.prototype.visit = function (visitor, context) {
            return visitor.visitBoundText(this, context);
        };
        return BoundTextAst;
    }());
    exports.BoundTextAst = BoundTextAst;
    /**
     * A plain attribute on an element.
     */
    var AttrAst = /** @class */ (function () {
        function AttrAst(name, value, sourceSpan) {
            this.name = name;
            this.value = value;
            this.sourceSpan = sourceSpan;
        }
        AttrAst.prototype.visit = function (visitor, context) { return visitor.visitAttr(this, context); };
        return AttrAst;
    }());
    exports.AttrAst = AttrAst;
    var BoundPropertyMapping = (_a = {},
        _a[4 /* Animation */] = 4 /* Animation */,
        _a[1 /* Attribute */] = 1 /* Attribute */,
        _a[2 /* Class */] = 2 /* Class */,
        _a[0 /* Property */] = 0 /* Property */,
        _a[3 /* Style */] = 3 /* Style */,
        _a);
    /**
     * A binding for an element property (e.g. `[property]="expression"`) or an animation trigger (e.g.
     * `[@trigger]="stateExp"`)
     */
    var BoundElementPropertyAst = /** @class */ (function () {
        function BoundElementPropertyAst(name, type, securityContext, value, unit, sourceSpan) {
            this.name = name;
            this.type = type;
            this.securityContext = securityContext;
            this.value = value;
            this.unit = unit;
            this.sourceSpan = sourceSpan;
            this.isAnimation = this.type === 4 /* Animation */;
        }
        BoundElementPropertyAst.fromBoundProperty = function (prop) {
            var type = BoundPropertyMapping[prop.type];
            return new BoundElementPropertyAst(prop.name, type, prop.securityContext, prop.value, prop.unit, prop.sourceSpan);
        };
        BoundElementPropertyAst.prototype.visit = function (visitor, context) {
            return visitor.visitElementProperty(this, context);
        };
        return BoundElementPropertyAst;
    }());
    exports.BoundElementPropertyAst = BoundElementPropertyAst;
    /**
     * A binding for an element event (e.g. `(event)="handler()"`) or an animation trigger event (e.g.
     * `(@trigger.phase)="callback($event)"`).
     */
    var BoundEventAst = /** @class */ (function () {
        function BoundEventAst(name, target, phase, handler, sourceSpan) {
            this.name = name;
            this.target = target;
            this.phase = phase;
            this.handler = handler;
            this.sourceSpan = sourceSpan;
            this.fullName = BoundEventAst.calcFullName(this.name, this.target, this.phase);
            this.isAnimation = !!this.phase;
        }
        BoundEventAst.calcFullName = function (name, target, phase) {
            if (target) {
                return target + ":" + name;
            }
            if (phase) {
                return "@" + name + "." + phase;
            }
            return name;
        };
        BoundEventAst.fromParsedEvent = function (event) {
            var target = event.type === 0 /* Regular */ ? event.targetOrPhase : null;
            var phase = event.type === 1 /* Animation */ ? event.targetOrPhase : null;
            return new BoundEventAst(event.name, target, phase, event.handler, event.sourceSpan);
        };
        BoundEventAst.prototype.visit = function (visitor, context) {
            return visitor.visitEvent(this, context);
        };
        return BoundEventAst;
    }());
    exports.BoundEventAst = BoundEventAst;
    /**
     * A reference declaration on an element (e.g. `let someName="expression"`).
     */
    var ReferenceAst = /** @class */ (function () {
        function ReferenceAst(name, value, originalValue, sourceSpan) {
            this.name = name;
            this.value = value;
            this.originalValue = originalValue;
            this.sourceSpan = sourceSpan;
        }
        ReferenceAst.prototype.visit = function (visitor, context) {
            return visitor.visitReference(this, context);
        };
        return ReferenceAst;
    }());
    exports.ReferenceAst = ReferenceAst;
    /**
     * A variable declaration on a <ng-template> (e.g. `var-someName="someLocalName"`).
     */
    var VariableAst = /** @class */ (function () {
        function VariableAst(name, value, sourceSpan) {
            this.name = name;
            this.value = value;
            this.sourceSpan = sourceSpan;
        }
        VariableAst.fromParsedVariable = function (v) {
            return new VariableAst(v.name, v.value, v.sourceSpan);
        };
        VariableAst.prototype.visit = function (visitor, context) {
            return visitor.visitVariable(this, context);
        };
        return VariableAst;
    }());
    exports.VariableAst = VariableAst;
    /**
     * An element declaration in a template.
     */
    var ElementAst = /** @class */ (function () {
        function ElementAst(name, attrs, inputs, outputs, references, directives, providers, hasViewContainer, queryMatches, children, ngContentIndex, sourceSpan, endSourceSpan) {
            this.name = name;
            this.attrs = attrs;
            this.inputs = inputs;
            this.outputs = outputs;
            this.references = references;
            this.directives = directives;
            this.providers = providers;
            this.hasViewContainer = hasViewContainer;
            this.queryMatches = queryMatches;
            this.children = children;
            this.ngContentIndex = ngContentIndex;
            this.sourceSpan = sourceSpan;
            this.endSourceSpan = endSourceSpan;
        }
        ElementAst.prototype.visit = function (visitor, context) {
            return visitor.visitElement(this, context);
        };
        return ElementAst;
    }());
    exports.ElementAst = ElementAst;
    /**
     * A `<ng-template>` element included in an Angular template.
     */
    var EmbeddedTemplateAst = /** @class */ (function () {
        function EmbeddedTemplateAst(attrs, outputs, references, variables, directives, providers, hasViewContainer, queryMatches, children, ngContentIndex, sourceSpan) {
            this.attrs = attrs;
            this.outputs = outputs;
            this.references = references;
            this.variables = variables;
            this.directives = directives;
            this.providers = providers;
            this.hasViewContainer = hasViewContainer;
            this.queryMatches = queryMatches;
            this.children = children;
            this.ngContentIndex = ngContentIndex;
            this.sourceSpan = sourceSpan;
        }
        EmbeddedTemplateAst.prototype.visit = function (visitor, context) {
            return visitor.visitEmbeddedTemplate(this, context);
        };
        return EmbeddedTemplateAst;
    }());
    exports.EmbeddedTemplateAst = EmbeddedTemplateAst;
    /**
     * A directive property with a bound value (e.g. `*ngIf="condition").
     */
    var BoundDirectivePropertyAst = /** @class */ (function () {
        function BoundDirectivePropertyAst(directiveName, templateName, value, sourceSpan) {
            this.directiveName = directiveName;
            this.templateName = templateName;
            this.value = value;
            this.sourceSpan = sourceSpan;
        }
        BoundDirectivePropertyAst.prototype.visit = function (visitor, context) {
            return visitor.visitDirectiveProperty(this, context);
        };
        return BoundDirectivePropertyAst;
    }());
    exports.BoundDirectivePropertyAst = BoundDirectivePropertyAst;
    /**
     * A directive declared on an element.
     */
    var DirectiveAst = /** @class */ (function () {
        function DirectiveAst(directive, inputs, hostProperties, hostEvents, contentQueryStartId, sourceSpan) {
            this.directive = directive;
            this.inputs = inputs;
            this.hostProperties = hostProperties;
            this.hostEvents = hostEvents;
            this.contentQueryStartId = contentQueryStartId;
            this.sourceSpan = sourceSpan;
        }
        DirectiveAst.prototype.visit = function (visitor, context) {
            return visitor.visitDirective(this, context);
        };
        return DirectiveAst;
    }());
    exports.DirectiveAst = DirectiveAst;
    /**
     * A provider declared on an element
     */
    var ProviderAst = /** @class */ (function () {
        function ProviderAst(token, multiProvider, eager, providers, providerType, lifecycleHooks, sourceSpan, isModule) {
            this.token = token;
            this.multiProvider = multiProvider;
            this.eager = eager;
            this.providers = providers;
            this.providerType = providerType;
            this.lifecycleHooks = lifecycleHooks;
            this.sourceSpan = sourceSpan;
            this.isModule = isModule;
        }
        ProviderAst.prototype.visit = function (visitor, context) {
            // No visit method in the visitor for now...
            return null;
        };
        return ProviderAst;
    }());
    exports.ProviderAst = ProviderAst;
    var ProviderAstType;
    (function (ProviderAstType) {
        ProviderAstType[ProviderAstType["PublicService"] = 0] = "PublicService";
        ProviderAstType[ProviderAstType["PrivateService"] = 1] = "PrivateService";
        ProviderAstType[ProviderAstType["Component"] = 2] = "Component";
        ProviderAstType[ProviderAstType["Directive"] = 3] = "Directive";
        ProviderAstType[ProviderAstType["Builtin"] = 4] = "Builtin";
    })(ProviderAstType = exports.ProviderAstType || (exports.ProviderAstType = {}));
    /**
     * Position where content is to be projected (instance of `<ng-content>` in a template).
     */
    var NgContentAst = /** @class */ (function () {
        function NgContentAst(index, ngContentIndex, sourceSpan) {
            this.index = index;
            this.ngContentIndex = ngContentIndex;
            this.sourceSpan = sourceSpan;
        }
        NgContentAst.prototype.visit = function (visitor, context) {
            return visitor.visitNgContent(this, context);
        };
        return NgContentAst;
    }());
    exports.NgContentAst = NgContentAst;
    /**
     * A visitor that accepts each node but doesn't do anything. It is intended to be used
     * as the base class for a visitor that is only interested in a subset of the node types.
     */
    var NullTemplateVisitor = /** @class */ (function () {
        function NullTemplateVisitor() {
        }
        NullTemplateVisitor.prototype.visitNgContent = function (ast, context) { };
        NullTemplateVisitor.prototype.visitEmbeddedTemplate = function (ast, context) { };
        NullTemplateVisitor.prototype.visitElement = function (ast, context) { };
        NullTemplateVisitor.prototype.visitReference = function (ast, context) { };
        NullTemplateVisitor.prototype.visitVariable = function (ast, context) { };
        NullTemplateVisitor.prototype.visitEvent = function (ast, context) { };
        NullTemplateVisitor.prototype.visitElementProperty = function (ast, context) { };
        NullTemplateVisitor.prototype.visitAttr = function (ast, context) { };
        NullTemplateVisitor.prototype.visitBoundText = function (ast, context) { };
        NullTemplateVisitor.prototype.visitText = function (ast, context) { };
        NullTemplateVisitor.prototype.visitDirective = function (ast, context) { };
        NullTemplateVisitor.prototype.visitDirectiveProperty = function (ast, context) { };
        return NullTemplateVisitor;
    }());
    exports.NullTemplateVisitor = NullTemplateVisitor;
    /**
     * Base class that can be used to build a visitor that visits each node
     * in an template ast recursively.
     */
    var RecursiveTemplateAstVisitor = /** @class */ (function (_super) {
        tslib_1.__extends(RecursiveTemplateAstVisitor, _super);
        function RecursiveTemplateAstVisitor() {
            return _super.call(this) || this;
        }
        // Nodes with children
        RecursiveTemplateAstVisitor.prototype.visitEmbeddedTemplate = function (ast, context) {
            return this.visitChildren(context, function (visit) {
                visit(ast.attrs);
                visit(ast.references);
                visit(ast.variables);
                visit(ast.directives);
                visit(ast.providers);
                visit(ast.children);
            });
        };
        RecursiveTemplateAstVisitor.prototype.visitElement = function (ast, context) {
            return this.visitChildren(context, function (visit) {
                visit(ast.attrs);
                visit(ast.inputs);
                visit(ast.outputs);
                visit(ast.references);
                visit(ast.directives);
                visit(ast.providers);
                visit(ast.children);
            });
        };
        RecursiveTemplateAstVisitor.prototype.visitDirective = function (ast, context) {
            return this.visitChildren(context, function (visit) {
                visit(ast.inputs);
                visit(ast.hostProperties);
                visit(ast.hostEvents);
            });
        };
        RecursiveTemplateAstVisitor.prototype.visitChildren = function (context, cb) {
            var results = [];
            var t = this;
            function visit(children) {
                if (children && children.length)
                    results.push(templateVisitAll(t, children, context));
            }
            cb(visit);
            return [].concat.apply([], results);
        };
        return RecursiveTemplateAstVisitor;
    }(NullTemplateVisitor));
    exports.RecursiveTemplateAstVisitor = RecursiveTemplateAstVisitor;
    /**
     * Visit every node in a list of {@link TemplateAst}s with the given {@link TemplateAstVisitor}.
     */
    function templateVisitAll(visitor, asts, context) {
        if (context === void 0) { context = null; }
        var result = [];
        var visit = visitor.visit ?
            function (ast) { return visitor.visit(ast, context) || ast.visit(visitor, context); } :
            function (ast) { return ast.visit(visitor, context); };
        asts.forEach(function (ast) {
            var astResult = visit(ast);
            if (astResult) {
                result.push(astResult);
            }
        });
        return result;
    }
    exports.templateVisitAll = templateVisitAll;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfYXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlX3BhcnNlci90ZW1wbGF0ZV9hc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQTBCSDs7T0FFRztJQUNIO1FBQ0UsaUJBQ1csS0FBYSxFQUFTLGNBQXNCLEVBQVMsVUFBMkI7WUFBaEYsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUFTLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1lBQVMsZUFBVSxHQUFWLFVBQVUsQ0FBaUI7UUFBRyxDQUFDO1FBQy9GLHVCQUFLLEdBQUwsVUFBTSxPQUEyQixFQUFFLE9BQVksSUFBUyxPQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRyxjQUFDO0lBQUQsQ0FBQyxBQUpELElBSUM7SUFKWSwwQkFBTztJQU1wQjs7T0FFRztJQUNIO1FBQ0Usc0JBQ1csS0FBVSxFQUFTLGNBQXNCLEVBQVMsVUFBMkI7WUFBN0UsVUFBSyxHQUFMLEtBQUssQ0FBSztZQUFTLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1lBQVMsZUFBVSxHQUFWLFVBQVUsQ0FBaUI7UUFBRyxDQUFDO1FBQzVGLDRCQUFLLEdBQUwsVUFBTSxPQUEyQixFQUFFLE9BQVk7WUFDN0MsT0FBTyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBQ0gsbUJBQUM7SUFBRCxDQUFDLEFBTkQsSUFNQztJQU5ZLG9DQUFZO0lBUXpCOztPQUVHO0lBQ0g7UUFDRSxpQkFBbUIsSUFBWSxFQUFTLEtBQWEsRUFBUyxVQUEyQjtZQUF0RSxTQUFJLEdBQUosSUFBSSxDQUFRO1lBQVMsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUFTLGVBQVUsR0FBVixVQUFVLENB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QUMsS0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBNUQsQ0FBNEQsQ0FBQyxDQUFDO1lBQ3BGLFVBQUMsR0FBZ0IsSUFBSyxPQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUEzQixDQUEyQixDQUFDO1FBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQSxHQUFHO1lBQ2QsSUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLElBQUksU0FBUyxFQUFFO2dCQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDeEI7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFiRCw0Q0FhQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBc3RQYXRofSBmcm9tICcuLi9hc3RfcGF0aCc7XG5pbXBvcnQge0NvbXBpbGVEaXJlY3RpdmVTdW1tYXJ5LCBDb21waWxlUHJvdmlkZXJNZXRhZGF0YSwgQ29tcGlsZVRva2VuTWV0YWRhdGF9IGZyb20gJy4uL2NvbXBpbGVfbWV0YWRhdGEnO1xuaW1wb3J0IHtTZWN1cml0eUNvbnRleHR9IGZyb20gJy4uL2NvcmUnO1xuaW1wb3J0IHtBU1QsIEJpbmRpbmdUeXBlLCBCb3VuZEVsZW1lbnRQcm9wZXJ0eSwgUGFyc2VkRXZlbnQsIFBhcnNlZEV2ZW50VHlwZSwgUGFyc2VkVmFyaWFibGV9IGZyb20gJy4uL2V4cHJlc3Npb25fcGFyc2VyL2FzdCc7XG5pbXBvcnQge0xpZmVjeWNsZUhvb2tzfSBmcm9tICcuLi9saWZlY3ljbGVfcmVmbGVjdG9yJztcbmltcG9ydCB7UGFyc2VTb3VyY2VTcGFufSBmcm9tICcuLi9wYXJzZV91dGlsJztcblxuXG5cbi8qKlxuICogQW4gQWJzdHJhY3QgU3ludGF4IFRyZWUgbm9kZSByZXByZXNlbnRpbmcgcGFydCBvZiBhIHBhcnNlZCBBbmd1bGFyIHRlbXBsYXRlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlQXN0IHtcbiAgLyoqXG4gICAqIFRoZSBzb3VyY2Ugc3BhbiBmcm9tIHdoaWNoIHRoaXMgbm9kZSB3YXMgcGFyc2VkLlxuICAgKi9cbiAgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuO1xuXG4gIC8qKlxuICAgKiBWaXNpdCB0aGlzIG5vZGUgYW5kIHBvc3NpYmx5IHRyYW5zZm9ybSBpdC5cbiAgICovXG4gIHZpc2l0KHZpc2l0b3I6IFRlbXBsYXRlQXN0VmlzaXRvciwgY29udGV4dDogYW55KTogYW55O1xufVxuXG4vKipcbiAqIEEgc2VnbWVudCBvZiB0ZXh0IHdpdGhpbiB0aGUgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXh0QXN0IGltcGxlbWVudHMgVGVtcGxhdGVBc3Qge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyB2YWx1ZTogc3RyaW5nLCBwdWJsaWMgbmdDb250ZW50SW5kZXg6IG51bWJlciwgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbikge31cbiAgdmlzaXQodmlzaXRvcjogVGVtcGxhdGVBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkpOiBhbnkgeyByZXR1cm4gdmlzaXRvci52aXNpdFRleHQodGhpcywgY29udGV4dCk7IH1cbn1cblxuLyoqXG4gKiBBIGJvdW5kIGV4cHJlc3Npb24gd2l0aGluIHRoZSB0ZXh0IG9mIGEgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBCb3VuZFRleHRBc3QgaW1wbGVtZW50cyBUZW1wbGF0ZUFzdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHZhbHVlOiBBU1QsIHB1YmxpYyBuZ0NvbnRlbnRJbmRleDogbnVtYmVyLCBwdWJsaWMgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuKSB7fVxuICB2aXNpdCh2aXNpdG9yOiBUZW1wbGF0ZUFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHZpc2l0b3IudmlzaXRCb3VuZFRleHQodGhpcywgY29udGV4dCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHBsYWluIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50LlxuICovXG5leHBvcnQgY2xhc3MgQXR0ckFzdCBpbXBsZW1lbnRzIFRlbXBsYXRlQXN0IHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIHZhbHVlOiBzdHJpbmcsIHB1YmxpYyBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHt9XG4gIHZpc2l0KHZpc2l0b3I6IFRlbXBsYXRlQXN0VmlzaXRvciwgY29udGV4dDogYW55KTogYW55IHsgcmV0dXJuIHZpc2l0b3IudmlzaXRBdHRyKHRoaXMsIGNvbnRleHQpOyB9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFByb3BlcnR5QmluZGluZ1R5cGUge1xuICAvLyBBIG5vcm1hbCBiaW5kaW5nIHRvIGEgcHJvcGVydHkgKGUuZy4gYFtwcm9wZXJ0eV09XCJleHByZXNzaW9uXCJgKS5cbiAgUHJvcGVydHksXG4gIC8vIEEgYmluZGluZyB0byBhbiBlbGVtZW50IGF0dHJpYnV0ZSAoZS5nLiBgW2F0dHIubmFtZV09XCJleHByZXNzaW9uXCJgKS5cbiAgQXR0cmlidXRlLFxuICAvLyBBIGJpbmRpbmcgdG8gYSBDU1MgY2xhc3MgKGUuZy4gYFtjbGFzcy5uYW1lXT1cImNvbmRpdGlvblwiYCkuXG4gIENsYXNzLFxuICAvLyBBIGJpbmRpbmcgdG8gYSBzdHlsZSBydWxlIChlLmcuIGBbc3R5bGUucnVsZV09XCJleHByZXNzaW9uXCJgKS5cbiAgU3R5bGUsXG4gIC8vIEEgYmluZGluZyB0byBhbiBhbmltYXRpb24gcmVmZXJlbmNlIChlLmcuIGBbYW5pbWF0ZS5rZXldPVwiZXhwcmVzc2lvblwiYCkuXG4gIEFuaW1hdGlvbixcbn1cblxuY29uc3QgQm91bmRQcm9wZXJ0eU1hcHBpbmcgPSB7XG4gIFtCaW5kaW5nVHlwZS5BbmltYXRpb25dOiBQcm9wZXJ0eUJpbmRpbmdUeXBlLkFuaW1hdGlvbixcbiAgW0JpbmRpbmdUeXBlLkF0dHJpYnV0ZV06IFByb3BlcnR5QmluZGluZ1R5cGUuQXR0cmlidXRlLFxuICBbQmluZGluZ1R5cGUuQ2xhc3NdOiBQcm9wZXJ0eUJpbmRpbmdUeXBlLkNsYXNzLFxuICBbQmluZGluZ1R5cGUuUHJvcGVydHldOiBQcm9wZXJ0eUJpbmRpbmdUeXBlLlByb3BlcnR5LFxuICBbQmluZGluZ1R5cGUuU3R5bGVdOiBQcm9wZXJ0eUJpbmRpbmdUeXBlLlN0eWxlLFxufTtcblxuLyoqXG4gKiBBIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQgcHJvcGVydHkgKGUuZy4gYFtwcm9wZXJ0eV09XCJleHByZXNzaW9uXCJgKSBvciBhbiBhbmltYXRpb24gdHJpZ2dlciAoZS5nLlxuICogYFtAdHJpZ2dlcl09XCJzdGF0ZUV4cFwiYClcbiAqL1xuZXhwb3J0IGNsYXNzIEJvdW5kRWxlbWVudFByb3BlcnR5QXN0IGltcGxlbWVudHMgVGVtcGxhdGVBc3Qge1xuICByZWFkb25seSBpc0FuaW1hdGlvbjogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyB0eXBlOiBQcm9wZXJ0eUJpbmRpbmdUeXBlLFxuICAgICAgcHVibGljIHNlY3VyaXR5Q29udGV4dDogU2VjdXJpdHlDb250ZXh0LCBwdWJsaWMgdmFsdWU6IEFTVCwgcHVibGljIHVuaXQ6IHN0cmluZ3xudWxsLFxuICAgICAgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbikge1xuICAgIHRoaXMuaXNBbmltYXRpb24gPSB0aGlzLnR5cGUgPT09IFByb3BlcnR5QmluZGluZ1R5cGUuQW5pbWF0aW9uO1xuICB9XG5cbiAgc3RhdGljIGZyb21Cb3VuZFByb3BlcnR5KHByb3A6IEJvdW5kRWxlbWVudFByb3BlcnR5KSB7XG4gICAgY29uc3QgdHlwZSA9IEJvdW5kUHJvcGVydHlNYXBwaW5nW3Byb3AudHlwZV07XG4gICAgcmV0dXJuIG5ldyBCb3VuZEVsZW1lbnRQcm9wZXJ0eUFzdChcbiAgICAgICAgcHJvcC5uYW1lLCB0eXBlLCBwcm9wLnNlY3VyaXR5Q29udGV4dCwgcHJvcC52YWx1ZSwgcHJvcC51bml0LCBwcm9wLnNvdXJjZVNwYW4pO1xuICB9XG5cbiAgdmlzaXQodmlzaXRvcjogVGVtcGxhdGVBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0RWxlbWVudFByb3BlcnR5KHRoaXMsIGNvbnRleHQpO1xuICB9XG59XG5cbi8qKlxuICogQSBiaW5kaW5nIGZvciBhbiBlbGVtZW50IGV2ZW50IChlLmcuIGAoZXZlbnQpPVwiaGFuZGxlcigpXCJgKSBvciBhbiBhbmltYXRpb24gdHJpZ2dlciBldmVudCAoZS5nLlxuICogYChAdHJpZ2dlci5waGFzZSk9XCJjYWxsYmFjaygkZXZlbnQpXCJgKS5cbiAqL1xuZXhwb3J0IGNsYXNzIEJvdW5kRXZlbnRBc3QgaW1wbGVtZW50cyBUZW1wbGF0ZUFzdCB7XG4gIHJlYWRvbmx5IGZ1bGxOYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGlzQW5pbWF0aW9uOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIHRhcmdldDogc3RyaW5nfG51bGwsIHB1YmxpYyBwaGFzZTogc3RyaW5nfG51bGwsXG4gICAgICBwdWJsaWMgaGFuZGxlcjogQVNULCBwdWJsaWMgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuKSB7XG4gICAgdGhpcy5mdWxsTmFtZSA9IEJvdW5kRXZlbnRBc3QuY2FsY0Z1bGxOYW1lKHRoaXMubmFtZSwgdGhpcy50YXJnZXQsIHRoaXMucGhhc2UpO1xuICAgIHRoaXMuaXNBbmltYXRpb24gPSAhIXRoaXMucGhhc2U7XG4gIH1cblxuICBzdGF0aWMgY2FsY0Z1bGxOYW1lKG5hbWU6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmd8bnVsbCwgcGhhc2U6IHN0cmluZ3xudWxsKTogc3RyaW5nIHtcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICByZXR1cm4gYCR7dGFyZ2V0fToke25hbWV9YDtcbiAgICB9XG4gICAgaWYgKHBoYXNlKSB7XG4gICAgICByZXR1cm4gYEAke25hbWV9LiR7cGhhc2V9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tUGFyc2VkRXZlbnQoZXZlbnQ6IFBhcnNlZEV2ZW50KSB7XG4gICAgY29uc3QgdGFyZ2V0OiBzdHJpbmd8bnVsbCA9IGV2ZW50LnR5cGUgPT09IFBhcnNlZEV2ZW50VHlwZS5SZWd1bGFyID8gZXZlbnQudGFyZ2V0T3JQaGFzZSA6IG51bGw7XG4gICAgY29uc3QgcGhhc2U6IHN0cmluZ3xudWxsID1cbiAgICAgICAgZXZlbnQudHlwZSA9PT0gUGFyc2VkRXZlbnRUeXBlLkFuaW1hdGlvbiA/IGV2ZW50LnRhcmdldE9yUGhhc2UgOiBudWxsO1xuICAgIHJldHVybiBuZXcgQm91bmRFdmVudEFzdChldmVudC5uYW1lLCB0YXJnZXQsIHBoYXNlLCBldmVudC5oYW5kbGVyLCBldmVudC5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0KHZpc2l0b3I6IFRlbXBsYXRlQXN0VmlzaXRvciwgY29udGV4dDogYW55KTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdEV2ZW50KHRoaXMsIGNvbnRleHQpO1xuICB9XG59XG5cbi8qKlxuICogQSByZWZlcmVuY2UgZGVjbGFyYXRpb24gb24gYW4gZWxlbWVudCAoZS5nLiBgbGV0IHNvbWVOYW1lPVwiZXhwcmVzc2lvblwiYCkuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZWZlcmVuY2VBc3QgaW1wbGVtZW50cyBUZW1wbGF0ZUFzdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIHZhbHVlOiBDb21waWxlVG9rZW5NZXRhZGF0YSwgcHVibGljIG9yaWdpbmFsVmFsdWU6IHN0cmluZyxcbiAgICAgIHB1YmxpYyBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHt9XG4gIHZpc2l0KHZpc2l0b3I6IFRlbXBsYXRlQXN0VmlzaXRvciwgY29udGV4dDogYW55KTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdFJlZmVyZW5jZSh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG4vKipcbiAqIEEgdmFyaWFibGUgZGVjbGFyYXRpb24gb24gYSA8bmctdGVtcGxhdGU+IChlLmcuIGB2YXItc29tZU5hbWU9XCJzb21lTG9jYWxOYW1lXCJgKS5cbiAqL1xuZXhwb3J0IGNsYXNzIFZhcmlhYmxlQXN0IGltcGxlbWVudHMgVGVtcGxhdGVBc3Qge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgdmFsdWU6IHN0cmluZywgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbikge31cblxuICBzdGF0aWMgZnJvbVBhcnNlZFZhcmlhYmxlKHY6IFBhcnNlZFZhcmlhYmxlKSB7XG4gICAgcmV0dXJuIG5ldyBWYXJpYWJsZUFzdCh2Lm5hbWUsIHYudmFsdWUsIHYuc291cmNlU3Bhbik7XG4gIH1cblxuICB2aXNpdCh2aXNpdG9yOiBUZW1wbGF0ZUFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHZpc2l0b3IudmlzaXRWYXJpYWJsZSh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG4vKipcbiAqIEFuIGVsZW1lbnQgZGVjbGFyYXRpb24gaW4gYSB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEVsZW1lbnRBc3QgaW1wbGVtZW50cyBUZW1wbGF0ZUFzdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGF0dHJzOiBBdHRyQXN0W10sIHB1YmxpYyBpbnB1dHM6IEJvdW5kRWxlbWVudFByb3BlcnR5QXN0W10sXG4gICAgICBwdWJsaWMgb3V0cHV0czogQm91bmRFdmVudEFzdFtdLCBwdWJsaWMgcmVmZXJlbmNlczogUmVmZXJlbmNlQXN0W10sXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlczogRGlyZWN0aXZlQXN0W10sIHB1YmxpYyBwcm92aWRlcnM6IFByb3ZpZGVyQXN0W10sXG4gICAgICBwdWJsaWMgaGFzVmlld0NvbnRhaW5lcjogYm9vbGVhbiwgcHVibGljIHF1ZXJ5TWF0Y2hlczogUXVlcnlNYXRjaFtdLFxuICAgICAgcHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZUFzdFtdLCBwdWJsaWMgbmdDb250ZW50SW5kZXg6IG51bWJlcnxudWxsLFxuICAgICAgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbiwgcHVibGljIGVuZFNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbnxudWxsKSB7fVxuXG4gIHZpc2l0KHZpc2l0b3I6IFRlbXBsYXRlQXN0VmlzaXRvciwgY29udGV4dDogYW55KTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdEVsZW1lbnQodGhpcywgY29udGV4dCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGA8bmctdGVtcGxhdGU+YCBlbGVtZW50IGluY2x1ZGVkIGluIGFuIEFuZ3VsYXIgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBFbWJlZGRlZFRlbXBsYXRlQXN0IGltcGxlbWVudHMgVGVtcGxhdGVBc3Qge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBhdHRyczogQXR0ckFzdFtdLCBwdWJsaWMgb3V0cHV0czogQm91bmRFdmVudEFzdFtdLCBwdWJsaWMgcmVmZXJlbmNlczogUmVmZXJlbmNlQXN0W10sXG4gICAgICBwdWJsaWMgdmFyaWFibGVzOiBWYXJpYWJsZUFzdFtdLCBwdWJsaWMgZGlyZWN0aXZlczogRGlyZWN0aXZlQXN0W10sXG4gICAgICBwdWJsaWMgcHJvdmlkZXJzOiBQcm92aWRlckFzdFtdLCBwdWJsaWMgaGFzVmlld0NvbnRhaW5lcjogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBxdWVyeU1hdGNoZXM6IFF1ZXJ5TWF0Y2hbXSwgcHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZUFzdFtdLFxuICAgICAgcHVibGljIG5nQ29udGVudEluZGV4OiBudW1iZXIsIHB1YmxpYyBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHt9XG5cbiAgdmlzaXQodmlzaXRvcjogVGVtcGxhdGVBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0RW1iZWRkZWRUZW1wbGF0ZSh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHByb3BlcnR5IHdpdGggYSBib3VuZCB2YWx1ZSAoZS5nLiBgKm5nSWY9XCJjb25kaXRpb25cIikuXG4gKi9cbmV4cG9ydCBjbGFzcyBCb3VuZERpcmVjdGl2ZVByb3BlcnR5QXN0IGltcGxlbWVudHMgVGVtcGxhdGVBc3Qge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVOYW1lOiBzdHJpbmcsIHB1YmxpYyB0ZW1wbGF0ZU5hbWU6IHN0cmluZywgcHVibGljIHZhbHVlOiBBU1QsXG4gICAgICBwdWJsaWMgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuKSB7fVxuICB2aXNpdCh2aXNpdG9yOiBUZW1wbGF0ZUFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHZpc2l0b3IudmlzaXREaXJlY3RpdmVQcm9wZXJ0eSh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG4vKipcbiAqIEEgZGlyZWN0aXZlIGRlY2xhcmVkIG9uIGFuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBEaXJlY3RpdmVBc3QgaW1wbGVtZW50cyBUZW1wbGF0ZUFzdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGRpcmVjdGl2ZTogQ29tcGlsZURpcmVjdGl2ZVN1bW1hcnksIHB1YmxpYyBpbnB1dHM6IEJvdW5kRGlyZWN0aXZlUHJvcGVydHlBc3RbXSxcbiAgICAgIHB1YmxpYyBob3N0UHJvcGVydGllczogQm91bmRFbGVtZW50UHJvcGVydHlBc3RbXSwgcHVibGljIGhvc3RFdmVudHM6IEJvdW5kRXZlbnRBc3RbXSxcbiAgICAgIHB1YmxpYyBjb250ZW50UXVlcnlTdGFydElkOiBudW1iZXIsIHB1YmxpYyBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHt9XG4gIHZpc2l0KHZpc2l0b3I6IFRlbXBsYXRlQXN0VmlzaXRvciwgY29udGV4dDogYW55KTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdERpcmVjdGl2ZSh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG4vKipcbiAqIEEgcHJvdmlkZXIgZGVjbGFyZWQgb24gYW4gZWxlbWVudFxuICovXG5leHBvcnQgY2xhc3MgUHJvdmlkZXJBc3QgaW1wbGVtZW50cyBUZW1wbGF0ZUFzdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHRva2VuOiBDb21waWxlVG9rZW5NZXRhZGF0YSwgcHVibGljIG11bHRpUHJvdmlkZXI6IGJvb2xlYW4sIHB1YmxpYyBlYWdlcjogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBwcm92aWRlcnM6IENvbXBpbGVQcm92aWRlck1ldGFkYXRhW10sIHB1YmxpYyBwcm92aWRlclR5cGU6IFByb3ZpZGVyQXN0VHlwZSxcbiAgICAgIHB1YmxpYyBsaWZlY3ljbGVIb29rczogTGlmZWN5Y2xlSG9va3NbXSwgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbixcbiAgICAgIHJlYWRvbmx5IGlzTW9kdWxlOiBib29sZWFuKSB7fVxuXG4gIHZpc2l0KHZpc2l0b3I6IFRlbXBsYXRlQXN0VmlzaXRvciwgY29udGV4dDogYW55KTogYW55IHtcbiAgICAvLyBObyB2aXNpdCBtZXRob2QgaW4gdGhlIHZpc2l0b3IgZm9yIG5vdy4uLlxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBlbnVtIFByb3ZpZGVyQXN0VHlwZSB7XG4gIFB1YmxpY1NlcnZpY2UsXG4gIFByaXZhdGVTZXJ2aWNlLFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgQnVpbHRpblxufVxuXG4vKipcbiAqIFBvc2l0aW9uIHdoZXJlIGNvbnRlbnQgaXMgdG8gYmUgcHJvamVjdGVkIChpbnN0YW5jZSBvZiBgPG5nLWNvbnRlbnQ+YCBpbiBhIHRlbXBsYXRlKS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5nQ29udGVudEFzdCBpbXBsZW1lbnRzIFRlbXBsYXRlQXN0IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgaW5kZXg6IG51bWJlciwgcHVibGljIG5nQ29udGVudEluZGV4OiBudW1iZXIsIHB1YmxpYyBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHt9XG4gIHZpc2l0KHZpc2l0b3I6IFRlbXBsYXRlQXN0VmlzaXRvciwgY29udGV4dDogYW55KTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdE5nQ29udGVudCh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5TWF0Y2gge1xuICBxdWVyeUlkOiBudW1iZXI7XG4gIHZhbHVlOiBDb21waWxlVG9rZW5NZXRhZGF0YTtcbn1cblxuLyoqXG4gKiBBIHZpc2l0b3IgZm9yIHtAbGluayBUZW1wbGF0ZUFzdH0gdHJlZXMgdGhhdCB3aWxsIHByb2Nlc3MgZWFjaCBub2RlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlQXN0VmlzaXRvciB7XG4gIC8vIFJldHVybmluZyBhIHRydXRoeSB2YWx1ZSBmcm9tIGB2aXNpdCgpYCB3aWxsIHByZXZlbnQgYHRlbXBsYXRlVmlzaXRBbGwoKWAgZnJvbSB0aGUgY2FsbCB0b1xuICAvLyB0aGUgdHlwZWQgbWV0aG9kIGFuZCByZXN1bHQgcmV0dXJuZWQgd2lsbCBiZWNvbWUgdGhlIHJlc3VsdCBpbmNsdWRlZCBpbiBgdmlzaXRBbGwoKWBzXG4gIC8vIHJlc3VsdCBhcnJheS5cbiAgdmlzaXQ/KGFzdDogVGVtcGxhdGVBc3QsIGNvbnRleHQ6IGFueSk6IGFueTtcblxuICB2aXNpdE5nQ29udGVudChhc3Q6IE5nQ29udGVudEFzdCwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdEVtYmVkZGVkVGVtcGxhdGUoYXN0OiBFbWJlZGRlZFRlbXBsYXRlQXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0RWxlbWVudChhc3Q6IEVsZW1lbnRBc3QsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRSZWZlcmVuY2UoYXN0OiBSZWZlcmVuY2VBc3QsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRWYXJpYWJsZShhc3Q6IFZhcmlhYmxlQXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0RXZlbnQoYXN0OiBCb3VuZEV2ZW50QXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0RWxlbWVudFByb3BlcnR5KGFzdDogQm91bmRFbGVtZW50UHJvcGVydHlBc3QsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRBdHRyKGFzdDogQXR0ckFzdCwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdEJvdW5kVGV4dChhc3Q6IEJvdW5kVGV4dEFzdCwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdFRleHQoYXN0OiBUZXh0QXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0RGlyZWN0aXZlKGFzdDogRGlyZWN0aXZlQXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0RGlyZWN0aXZlUHJvcGVydHkoYXN0OiBCb3VuZERpcmVjdGl2ZVByb3BlcnR5QXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG59XG5cbi8qKlxuICogQSB2aXNpdG9yIHRoYXQgYWNjZXB0cyBlYWNoIG5vZGUgYnV0IGRvZXNuJ3QgZG8gYW55dGhpbmcuIEl0IGlzIGludGVuZGVkIHRvIGJlIHVzZWRcbiAqIGFzIHRoZSBiYXNlIGNsYXNzIGZvciBhIHZpc2l0b3IgdGhhdCBpcyBvbmx5IGludGVyZXN0ZWQgaW4gYSBzdWJzZXQgb2YgdGhlIG5vZGUgdHlwZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBOdWxsVGVtcGxhdGVWaXNpdG9yIGltcGxlbWVudHMgVGVtcGxhdGVBc3RWaXNpdG9yIHtcbiAgdmlzaXROZ0NvbnRlbnQoYXN0OiBOZ0NvbnRlbnRBc3QsIGNvbnRleHQ6IGFueSk6IHZvaWQge31cbiAgdmlzaXRFbWJlZGRlZFRlbXBsYXRlKGFzdDogRW1iZWRkZWRUZW1wbGF0ZUFzdCwgY29udGV4dDogYW55KTogdm9pZCB7fVxuICB2aXNpdEVsZW1lbnQoYXN0OiBFbGVtZW50QXN0LCBjb250ZXh0OiBhbnkpOiB2b2lkIHt9XG4gIHZpc2l0UmVmZXJlbmNlKGFzdDogUmVmZXJlbmNlQXN0LCBjb250ZXh0OiBhbnkpOiB2b2lkIHt9XG4gIHZpc2l0VmFyaWFibGUoYXN0OiBWYXJpYWJsZUFzdCwgY29udGV4dDogYW55KTogdm9pZCB7fVxuICB2aXNpdEV2ZW50KGFzdDogQm91bmRFdmVudEFzdCwgY29udGV4dDogYW55KTogdm9pZCB7fVxuICB2aXNpdEVsZW1lbnRQcm9wZXJ0eShhc3Q6IEJvdW5kRWxlbWVudFByb3BlcnR5QXN0LCBjb250ZXh0OiBhbnkpOiB2b2lkIHt9XG4gIHZpc2l0QXR0cihhc3Q6IEF0dHJBc3QsIGNvbnRleHQ6IGFueSk6IHZvaWQge31cbiAgdmlzaXRCb3VuZFRleHQoYXN0OiBCb3VuZFRleHRBc3QsIGNvbnRleHQ6IGFueSk6IHZvaWQge31cbiAgdmlzaXRUZXh0KGFzdDogVGV4dEFzdCwgY29udGV4dDogYW55KTogdm9pZCB7fVxuICB2aXNpdERpcmVjdGl2ZShhc3Q6IERpcmVjdGl2ZUFzdCwgY29udGV4dDogYW55KTogdm9pZCB7fVxuICB2aXNpdERpcmVjdGl2ZVByb3BlcnR5KGFzdDogQm91bmREaXJlY3RpdmVQcm9wZXJ0eUFzdCwgY29udGV4dDogYW55KTogdm9pZCB7fVxufVxuXG4vKipcbiAqIEJhc2UgY2xhc3MgdGhhdCBjYW4gYmUgdXNlZCB0byBidWlsZCBhIHZpc2l0b3IgdGhhdCB2aXNpdHMgZWFjaCBub2RlXG4gKiBpbiBhbiB0ZW1wbGF0ZSBhc3QgcmVjdXJzaXZlbHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZWN1cnNpdmVUZW1wbGF0ZUFzdFZpc2l0b3IgZXh0ZW5kcyBOdWxsVGVtcGxhdGVWaXNpdG9yIGltcGxlbWVudHMgVGVtcGxhdGVBc3RWaXNpdG9yIHtcbiAgY29uc3RydWN0b3IoKSB7IHN1cGVyKCk7IH1cblxuICAvLyBOb2RlcyB3aXRoIGNoaWxkcmVuXG4gIHZpc2l0RW1iZWRkZWRUZW1wbGF0ZShhc3Q6IEVtYmVkZGVkVGVtcGxhdGVBc3QsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMudmlzaXRDaGlsZHJlbihjb250ZXh0LCB2aXNpdCA9PiB7XG4gICAgICB2aXNpdChhc3QuYXR0cnMpO1xuICAgICAgdmlzaXQoYXN0LnJlZmVyZW5jZXMpO1xuICAgICAgdmlzaXQoYXN0LnZhcmlhYmxlcyk7XG4gICAgICB2aXNpdChhc3QuZGlyZWN0aXZlcyk7XG4gICAgICB2aXNpdChhc3QucHJvdmlkZXJzKTtcbiAgICAgIHZpc2l0KGFzdC5jaGlsZHJlbik7XG4gICAgfSk7XG4gIH1cblxuICB2aXNpdEVsZW1lbnQoYXN0OiBFbGVtZW50QXN0LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnZpc2l0Q2hpbGRyZW4oY29udGV4dCwgdmlzaXQgPT4ge1xuICAgICAgdmlzaXQoYXN0LmF0dHJzKTtcbiAgICAgIHZpc2l0KGFzdC5pbnB1dHMpO1xuICAgICAgdmlzaXQoYXN0Lm91dHB1dHMpO1xuICAgICAgdmlzaXQoYXN0LnJlZmVyZW5jZXMpO1xuICAgICAgdmlzaXQoYXN0LmRpcmVjdGl2ZXMpO1xuICAgICAgdmlzaXQoYXN0LnByb3ZpZGVycyk7XG4gICAgICB2aXNpdChhc3QuY2hpbGRyZW4pO1xuICAgIH0pO1xuICB9XG5cbiAgdmlzaXREaXJlY3RpdmUoYXN0OiBEaXJlY3RpdmVBc3QsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMudmlzaXRDaGlsZHJlbihjb250ZXh0LCB2aXNpdCA9PiB7XG4gICAgICB2aXNpdChhc3QuaW5wdXRzKTtcbiAgICAgIHZpc2l0KGFzdC5ob3N0UHJvcGVydGllcyk7XG4gICAgICB2aXNpdChhc3QuaG9zdEV2ZW50cyk7XG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgdmlzaXRDaGlsZHJlbjxUIGV4dGVuZHMgVGVtcGxhdGVBc3Q+KFxuICAgICAgY29udGV4dDogYW55LFxuICAgICAgY2I6ICh2aXNpdDogKDxWIGV4dGVuZHMgVGVtcGxhdGVBc3Q+KGNoaWxkcmVuOiBWW118dW5kZWZpbmVkKSA9PiB2b2lkKSkgPT4gdm9pZCkge1xuICAgIGxldCByZXN1bHRzOiBhbnlbXVtdID0gW107XG4gICAgbGV0IHQgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIHZpc2l0PFQgZXh0ZW5kcyBUZW1wbGF0ZUFzdD4oY2hpbGRyZW46IFRbXSB8IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkgcmVzdWx0cy5wdXNoKHRlbXBsYXRlVmlzaXRBbGwodCwgY2hpbGRyZW4sIGNvbnRleHQpKTtcbiAgICB9XG4gICAgY2IodmlzaXQpO1xuICAgIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3VsdHMpO1xuICB9XG59XG5cbi8qKlxuICogVmlzaXQgZXZlcnkgbm9kZSBpbiBhIGxpc3Qgb2Yge0BsaW5rIFRlbXBsYXRlQXN0fXMgd2l0aCB0aGUgZ2l2ZW4ge0BsaW5rIFRlbXBsYXRlQXN0VmlzaXRvcn0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZVZpc2l0QWxsKFxuICAgIHZpc2l0b3I6IFRlbXBsYXRlQXN0VmlzaXRvciwgYXN0czogVGVtcGxhdGVBc3RbXSwgY29udGV4dDogYW55ID0gbnVsbCk6IGFueVtdIHtcbiAgY29uc3QgcmVzdWx0OiBhbnlbXSA9IFtdO1xuICBjb25zdCB2aXNpdCA9IHZpc2l0b3IudmlzaXQgP1xuICAgICAgKGFzdDogVGVtcGxhdGVBc3QpID0+IHZpc2l0b3IudmlzaXQgIShhc3QsIGNvbnRleHQpIHx8IGFzdC52aXNpdCh2aXNpdG9yLCBjb250ZXh0KSA6XG4gICAgICAoYXN0OiBUZW1wbGF0ZUFzdCkgPT4gYXN0LnZpc2l0KHZpc2l0b3IsIGNvbnRleHQpO1xuICBhc3RzLmZvckVhY2goYXN0ID0+IHtcbiAgICBjb25zdCBhc3RSZXN1bHQgPSB2aXNpdChhc3QpO1xuICAgIGlmIChhc3RSZXN1bHQpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGFzdFJlc3VsdCk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IHR5cGUgVGVtcGxhdGVBc3RQYXRoID0gQXN0UGF0aDxUZW1wbGF0ZUFzdD47XG4iXX0=