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
        define("@angular/compiler/src/constant_pool", ["require", "exports", "tslib", "@angular/compiler/src/output/output_ast", "@angular/compiler/src/render3/view/i18n", "@angular/compiler/src/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var o = require("@angular/compiler/src/output/output_ast");
    var i18n_1 = require("@angular/compiler/src/render3/view/i18n");
    var util_1 = require("@angular/compiler/src/util");
    var CONSTANT_PREFIX = '_c';
    // Closure variables holding messages must be named `MSG_[A-Z0-9]+`
    var TRANSLATION_PREFIX = 'MSG_';
    /**
     * Closure uses `goog.getMsg(message)` to lookup translations
     */
    var GOOG_GET_MSG = 'goog.getMsg';
    /**
     * Context to use when producing a key.
     *
     * This ensures we see the constant not the reference variable when producing
     * a key.
     */
    var KEY_CONTEXT = {};
    /**
     * A node that is a place-holder that allows the node to be replaced when the actual
     * node is known.
     *
     * This allows the constant pool to change an expression from a direct reference to
     * a constant to a shared constant. It returns a fix-up node that is later allowed to
     * change the referenced expression.
     */
    var FixupExpression = /** @class */ (function (_super) {
        tslib_1.__extends(FixupExpression, _super);
        function FixupExpression(resolved) {
            var _this = _super.call(this, resolved.type) || this;
            _this.resolved = resolved;
            _this.original = resolved;
            return _this;
        }
        FixupExpression.prototype.visitExpression = function (visitor, context) {
            if (context === KEY_CONTEXT) {
                // When producing a key we want to traverse the constant not the
                // variable used to refer to it.
                return this.original.visitExpression(visitor, context);
            }
            else {
                return this.resolved.visitExpression(visitor, context);
            }
        };
        FixupExpression.prototype.isEquivalent = function (e) {
            return e instanceof FixupExpression && this.resolved.isEquivalent(e.resolved);
        };
        FixupExpression.prototype.isConstant = function () { return true; };
        FixupExpression.prototype.fixup = function (expression) {
            this.resolved = expression;
            this.shared = true;
        };
        return FixupExpression;
    }(o.Expression));
    /**
     * A constant pool allows a code emitter to share constant in an output context.
     *
     * The constant pool also supports sharing access to ivy definitions references.
     */
    var ConstantPool = /** @class */ (function () {
        function ConstantPool() {
            this.statements = [];
            this.translations = new Map();
            this.deferredTranslations = new Map();
            this.literals = new Map();
            this.literalFactories = new Map();
            this.injectorDefinitions = new Map();
            this.directiveDefinitions = new Map();
            this.componentDefinitions = new Map();
            this.pipeDefinitions = new Map();
            this.nextNameIndex = 0;
        }
        ConstantPool.prototype.getConstLiteral = function (literal, forceShared) {
            if (literal instanceof o.LiteralExpr || literal instanceof FixupExpression) {
                // Do no put simple literals into the constant pool or try to produce a constant for a
                // reference to a constant.
                return literal;
            }
            var key = this.keyOf(literal);
            var fixup = this.literals.get(key);
            var newValue = false;
            if (!fixup) {
                fixup = new FixupExpression(literal);
                this.literals.set(key, fixup);
                newValue = true;
            }
            if ((!newValue && !fixup.shared) || (newValue && forceShared)) {
                // Replace the expression with a variable
                var name_1 = this.freshName();
                this.statements.push(o.variable(name_1).set(literal).toDeclStmt(o.INFERRED_TYPE, [o.StmtModifier.Final]));
                fixup.fixup(o.variable(name_1));
            }
            return fixup;
        };
        ConstantPool.prototype.getDeferredTranslationConst = function (suffix) {
            var index = this.statements.push(new o.ExpressionStatement(o.NULL_EXPR)) - 1;
            var variable = o.variable(this.freshTranslationName(suffix));
            this.deferredTranslations.set(variable, index);
            return variable;
        };
        ConstantPool.prototype.setDeferredTranslationConst = function (variable, message) {
            var index = this.deferredTranslations.get(variable);
            this.statements[index] = this.getTranslationDeclStmt(variable, message);
        };
        ConstantPool.prototype.getTranslationDeclStmt = function (variable, message) {
            var fnCall = o.variable(GOOG_GET_MSG).callFn([o.literal(message)]);
            return variable.set(fnCall).toDeclStmt(o.INFERRED_TYPE, [o.StmtModifier.Final]);
        };
        ConstantPool.prototype.appendTranslationMeta = function (meta) {
            var parsedMeta = typeof meta === 'string' ? i18n_1.parseI18nMeta(meta) : meta;
            var docStmt = i18nMetaToDocStmt(parsedMeta);
            if (docStmt) {
                this.statements.push(docStmt);
            }
        };
        // Generates closure specific code for translation.
        //
        // ```
        // /**
        //  * @desc description?
        //  * @meaning meaning?
        //  */
        // const MSG_XYZ = goog.getMsg('message');
        // ```
        ConstantPool.prototype.getTranslation = function (message, meta, suffix) {
            var parsedMeta = i18n_1.parseI18nMeta(meta);
            // The identity of an i18n message depends on the message and its meaning
            var key = parsedMeta.meaning ? message + "\0\0" + parsedMeta.meaning : message;
            var exp = this.translations.get(key);
            if (exp) {
                return exp;
            }
            var variable = o.variable(this.freshTranslationName(suffix));
            this.appendTranslationMeta(parsedMeta);
            this.statements.push(this.getTranslationDeclStmt(variable, message));
            this.translations.set(key, variable);
            return variable;
        };
        ConstantPool.prototype.getDefinition = function (type, kind, ctx, forceShared) {
            if (forceShared === void 0) { forceShared = false; }
            var definitions = this.definitionsOf(kind);
            var fixup = definitions.get(type);
            var newValue = false;
            if (!fixup) {
                var property = this.propertyNameOf(kind);
                fixup = new FixupExpression(ctx.importExpr(type).prop(property));
                definitions.set(type, fixup);
                newValue = true;
            }
            if ((!newValue && !fixup.shared) || (newValue && forceShared)) {
                var name_2 = this.freshName();
                this.statements.push(o.variable(name_2).set(fixup.resolved).toDeclStmt(o.INFERRED_TYPE, [o.StmtModifier.Final]));
                fixup.fixup(o.variable(name_2));
            }
            return fixup;
        };
        ConstantPool.prototype.getLiteralFactory = function (literal) {
            // Create a pure function that builds an array of a mix of constant  and variable expressions
            if (literal instanceof o.LiteralArrayExpr) {
                var argumentsForKey = literal.entries.map(function (e) { return e.isConstant() ? e : o.literal(null); });
                var key = this.keyOf(o.literalArr(argumentsForKey));
                return this._getLiteralFactory(key, literal.entries, function (entries) { return o.literalArr(entries); });
            }
            else {
                var expressionForKey = o.literalMap(literal.entries.map(function (e) { return ({
                    key: e.key,
                    value: e.value.isConstant() ? e.value : o.literal(null),
                    quoted: e.quoted
                }); }));
                var key = this.keyOf(expressionForKey);
                return this._getLiteralFactory(key, literal.entries.map(function (e) { return e.value; }), function (entries) { return o.literalMap(entries.map(function (value, index) { return ({
                    key: literal.entries[index].key,
                    value: value,
                    quoted: literal.entries[index].quoted
                }); })); });
            }
        };
        ConstantPool.prototype._getLiteralFactory = function (key, values, resultMap) {
            var _this = this;
            var literalFactory = this.literalFactories.get(key);
            var literalFactoryArguments = values.filter((function (e) { return !e.isConstant(); }));
            if (!literalFactory) {
                var resultExpressions = values.map(function (e, index) { return e.isConstant() ? _this.getConstLiteral(e, true) : o.variable("a" + index); });
                var parameters = resultExpressions.filter(isVariable).map(function (e) { return new o.FnParam(e.name, o.DYNAMIC_TYPE); });
                var pureFunctionDeclaration = o.fn(parameters, [new o.ReturnStatement(resultMap(resultExpressions))], o.INFERRED_TYPE);
                var name_3 = this.freshName();
                this.statements.push(o.variable(name_3).set(pureFunctionDeclaration).toDeclStmt(o.INFERRED_TYPE, [
                    o.StmtModifier.Final
                ]));
                literalFactory = o.variable(name_3);
                this.literalFactories.set(key, literalFactory);
            }
            return { literalFactory: literalFactory, literalFactoryArguments: literalFactoryArguments };
        };
        /**
         * Produce a unique name.
         *
         * The name might be unique among different prefixes if any of the prefixes end in
         * a digit so the prefix should be a constant string (not based on user input) and
         * must not end in a digit.
         */
        ConstantPool.prototype.uniqueName = function (prefix) { return "" + prefix + this.nextNameIndex++; };
        ConstantPool.prototype.definitionsOf = function (kind) {
            switch (kind) {
                case 2 /* Component */:
                    return this.componentDefinitions;
                case 1 /* Directive */:
                    return this.directiveDefinitions;
                case 0 /* Injector */:
                    return this.injectorDefinitions;
                case 3 /* Pipe */:
                    return this.pipeDefinitions;
            }
            util_1.error("Unknown definition kind " + kind);
            return this.componentDefinitions;
        };
        ConstantPool.prototype.propertyNameOf = function (kind) {
            switch (kind) {
                case 2 /* Component */:
                    return 'ngComponentDef';
                case 1 /* Directive */:
                    return 'ngDirectiveDef';
                case 0 /* Injector */:
                    return 'ngInjectorDef';
                case 3 /* Pipe */:
                    return 'ngPipeDef';
            }
            util_1.error("Unknown definition kind " + kind);
            return '<unknown>';
        };
        ConstantPool.prototype.freshName = function () { return this.uniqueName(CONSTANT_PREFIX); };
        ConstantPool.prototype.freshTranslationName = function (suffix) {
            return this.uniqueName(TRANSLATION_PREFIX + suffix).toUpperCase();
        };
        ConstantPool.prototype.keyOf = function (expression) {
            return expression.visitExpression(new KeyVisitor(), KEY_CONTEXT);
        };
        return ConstantPool;
    }());
    exports.ConstantPool = ConstantPool;
    /**
     * Visitor used to determine if 2 expressions are equivalent and can be shared in the
     * `ConstantPool`.
     *
     * When the id (string) generated by the visitor is equal, expressions are considered equivalent.
     */
    var KeyVisitor = /** @class */ (function () {
        function KeyVisitor() {
            this.visitWrappedNodeExpr = invalid;
            this.visitWriteVarExpr = invalid;
            this.visitWriteKeyExpr = invalid;
            this.visitWritePropExpr = invalid;
            this.visitInvokeMethodExpr = invalid;
            this.visitInvokeFunctionExpr = invalid;
            this.visitInstantiateExpr = invalid;
            this.visitConditionalExpr = invalid;
            this.visitNotExpr = invalid;
            this.visitAssertNotNullExpr = invalid;
            this.visitCastExpr = invalid;
            this.visitFunctionExpr = invalid;
            this.visitBinaryOperatorExpr = invalid;
            this.visitReadPropExpr = invalid;
            this.visitReadKeyExpr = invalid;
            this.visitCommaExpr = invalid;
        }
        KeyVisitor.prototype.visitLiteralExpr = function (ast) {
            return "" + (typeof ast.value === 'string' ? '"' + ast.value + '"' : ast.value);
        };
        KeyVisitor.prototype.visitLiteralArrayExpr = function (ast, context) {
            var _this = this;
            return "[" + ast.entries.map(function (entry) { return entry.visitExpression(_this, context); }).join(',') + "]";
        };
        KeyVisitor.prototype.visitLiteralMapExpr = function (ast, context) {
            var _this = this;
            var mapKey = function (entry) {
                var quote = entry.quoted ? '"' : '';
                return "" + quote + entry.key + quote;
            };
            var mapEntry = function (entry) {
                return mapKey(entry) + ":" + entry.value.visitExpression(_this, context);
            };
            return "{" + ast.entries.map(mapEntry).join(',');
        };
        KeyVisitor.prototype.visitExternalExpr = function (ast) {
            return ast.value.moduleName ? "EX:" + ast.value.moduleName + ":" + ast.value.name :
                "EX:" + ast.value.runtime.name;
        };
        KeyVisitor.prototype.visitReadVarExpr = function (node) { return "VAR:" + node.name; };
        KeyVisitor.prototype.visitTypeofExpr = function (node, context) {
            return "TYPEOF:" + node.expr.visitExpression(this, context);
        };
        return KeyVisitor;
    }());
    function invalid(arg) {
        throw new Error("Invalid state: Visitor " + this.constructor.name + " doesn't handle " + arg.constructor.name);
    }
    function isVariable(e) {
        return e instanceof o.ReadVarExpr;
    }
    // Converts i18n meta informations for a message (id, description, meaning)
    // to a JsDoc statement formatted as expected by the Closure compiler.
    function i18nMetaToDocStmt(meta) {
        var tags = [];
        if (meta.id || meta.description) {
            var text = meta.id ? "[BACKUP_MESSAGE_ID:" + meta.id + "] " + meta.description : meta.description;
            tags.push({ tagName: "desc" /* Desc */, text: text.trim() });
        }
        if (meta.meaning) {
            tags.push({ tagName: "meaning" /* Meaning */, text: meta.meaning });
        }
        return tags.length == 0 ? null : new o.JSDocCommentStmt(tags);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRfcG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9jb25zdGFudF9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILDJEQUF5QztJQUN6QyxnRUFBNEQ7SUFDNUQsbURBQTRDO0lBRTVDLElBQU0sZUFBZSxHQUFHLElBQUksQ0FBQztJQUU3QixtRUFBbUU7SUFDbkUsSUFBTSxrQkFBa0IsR0FBRyxNQUFNLENBQUM7SUFJbEM7O09BRUc7SUFDSCxJQUFNLFlBQVksR0FBRyxhQUFhLENBQUM7SUFFbkM7Ozs7O09BS0c7SUFDSCxJQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7SUFFdkI7Ozs7Ozs7T0FPRztJQUNIO1FBQThCLDJDQUFZO1FBTXhDLHlCQUFtQixRQUFzQjtZQUF6QyxZQUNFLGtCQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FFckI7WUFIa0IsY0FBUSxHQUFSLFFBQVEsQ0FBYztZQUV2QyxLQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQzs7UUFDM0IsQ0FBQztRQUVELHlDQUFlLEdBQWYsVUFBZ0IsT0FBNEIsRUFBRSxPQUFZO1lBQ3hELElBQUksT0FBTyxLQUFLLFdBQVcsRUFBRTtnQkFDM0IsZ0VBQWdFO2dCQUNoRSxnQ0FBZ0M7Z0JBQ2hDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ3hEO2lCQUFNO2dCQUNMLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ3hEO1FBQ0gsQ0FBQztRQUVELHNDQUFZLEdBQVosVUFBYSxDQUFlO1lBQzFCLE9BQU8sQ0FBQyxZQUFZLGVBQWUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENB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QUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQy9CLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLHdCQUFzQixJQUFJLENBQUMsRUFBRSxVQUFLLElBQUksQ0FBQyxXQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDL0YsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sbUJBQXFCLEVBQUUsSUFBSSxFQUFFLElBQU0sQ0FBQyxJQUFJLEVBQUUsRUFBQyxDQUFDLENBQUM7U0FDaEU7UUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8seUJBQXdCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsT0FBTyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtJMThuTWV0YSwgcGFyc2VJMThuTWV0YX0gZnJvbSAnLi9yZW5kZXIzL3ZpZXcvaTE4bic7XG5pbXBvcnQge091dHB1dENvbnRleHQsIGVycm9yfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBDT05TVEFOVF9QUkVGSVggPSAnX2MnO1xuXG4vLyBDbG9zdXJlIHZhcmlhYmxlcyBob2xkaW5nIG1lc3NhZ2VzIG11c3QgYmUgbmFtZWQgYE1TR19bQS1aMC05XStgXG5jb25zdCBUUkFOU0xBVElPTl9QUkVGSVggPSAnTVNHXyc7XG5cbmV4cG9ydCBjb25zdCBlbnVtIERlZmluaXRpb25LaW5kIHtJbmplY3RvciwgRGlyZWN0aXZlLCBDb21wb25lbnQsIFBpcGV9XG5cbi8qKlxuICogQ2xvc3VyZSB1c2VzIGBnb29nLmdldE1zZyhtZXNzYWdlKWAgdG8gbG9va3VwIHRyYW5zbGF0aW9uc1xuICovXG5jb25zdCBHT09HX0dFVF9NU0cgPSAnZ29vZy5nZXRNc2cnO1xuXG4vKipcbiAqIENvbnRleHQgdG8gdXNlIHdoZW4gcHJvZHVjaW5nIGEga2V5LlxuICpcbiAqIFRoaXMgZW5zdXJlcyB3ZSBzZWUgdGhlIGNvbnN0YW50IG5vdCB0aGUgcmVmZXJlbmNlIHZhcmlhYmxlIHdoZW4gcHJvZHVjaW5nXG4gKiBhIGtleS5cbiAqL1xuY29uc3QgS0VZX0NPTlRFWFQgPSB7fTtcblxuLyoqXG4gKiBBIG5vZGUgdGhhdCBpcyBhIHBsYWNlLWhvbGRlciB0aGF0IGFsbG93cyB0aGUgbm9kZSB0byBiZSByZXBsYWNlZCB3aGVuIHRoZSBhY3R1YWxcbiAqIG5vZGUgaXMga25vd24uXG4gKlxuICogVGhpcyBhbGxvd3MgdGhlIGNvbnN0YW50IHBvb2wgdG8gY2hhbmdlIGFuIGV4cHJlc3Npb24gZnJvbSBhIGRpcmVjdCByZWZlcmVuY2UgdG9cbiAqIGEgY29uc3RhbnQgdG8gYSBzaGFyZWQgY29uc3RhbnQuIEl0IHJldHVybnMgYSBmaXgtdXAgbm9kZSB0aGF0IGlzIGxhdGVyIGFsbG93ZWQgdG9cbiAqIGNoYW5nZSB0aGUgcmVmZXJlbmNlZCBleHByZXNzaW9uLlxuICovXG5jbGFzcyBGaXh1cEV4cHJlc3Npb24gZXh0ZW5kcyBvLkV4cHJlc3Npb24ge1xuICBwcml2YXRlIG9yaWdpbmFsOiBvLkV4cHJlc3Npb247XG5cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHNoYXJlZCAhOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZXNvbHZlZDogby5FeHByZXNzaW9uKSB7XG4gICAgc3VwZXIocmVzb2x2ZWQudHlwZSk7XG4gICAgdGhpcy5vcmlnaW5hbCA9IHJlc29sdmVkO1xuICB9XG5cbiAgdmlzaXRFeHByZXNzaW9uKHZpc2l0b3I6IG8uRXhwcmVzc2lvblZpc2l0b3IsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgaWYgKGNvbnRleHQgPT09IEtFWV9DT05URVhUKSB7XG4gICAgICAvLyBXaGVuIHByb2R1Y2luZyBhIGtleSB3ZSB3YW50IHRvIHRyYXZlcnNlIHRoZSBjb25zdGFudCBub3QgdGhlXG4gICAgICAvLyB2YXJpYWJsZSB1c2VkIHRvIHJlZmVyIHRvIGl0LlxuICAgICAgcmV0dXJuIHRoaXMub3JpZ2luYWwudmlzaXRFeHByZXNzaW9uKHZpc2l0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXNvbHZlZC52aXNpdEV4cHJlc3Npb24odmlzaXRvciwgY29udGV4dCk7XG4gICAgfVxuICB9XG5cbiAgaXNFcXVpdmFsZW50KGU6IG8uRXhwcmVzc2lvbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBlIGluc3RhbmNlb2YgRml4dXBFeHByZXNzaW9uICYmIHRoaXMucmVzb2x2ZWQuaXNFcXVpdmFsZW50KGUucmVzb2x2ZWQpO1xuICB9XG5cbiAgaXNDb25zdGFudCgpIHsgcmV0dXJuIHRydWU7IH1cblxuICBmaXh1cChleHByZXNzaW9uOiBvLkV4cHJlc3Npb24pIHtcbiAgICB0aGlzLnJlc29sdmVkID0gZXhwcmVzc2lvbjtcbiAgICB0aGlzLnNoYXJlZCA9IHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNvbnN0YW50IHBvb2wgYWxsb3dzIGEgY29kZSBlbWl0dGVyIHRvIHNoYXJlIGNvbnN0YW50IGluIGFuIG91dHB1dCBjb250ZXh0LlxuICpcbiAqIFRoZSBjb25zdGFudCBwb29sIGFsc28gc3VwcG9ydHMgc2hhcmluZyBhY2Nlc3MgdG8gaXZ5IGRlZmluaXRpb25zIHJlZmVyZW5jZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb25zdGFudFBvb2wge1xuICBzdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdID0gW107XG4gIHByaXZhdGUgdHJhbnNsYXRpb25zID0gbmV3IE1hcDxzdHJpbmcsIG8uRXhwcmVzc2lvbj4oKTtcbiAgcHJpdmF0ZSBkZWZlcnJlZFRyYW5zbGF0aW9ucyA9IG5ldyBNYXA8by5SZWFkVmFyRXhwciwgbnVtYmVyPigpO1xuICBwcml2YXRlIGxpdGVyYWxzID0gbmV3IE1hcDxzdHJpbmcsIEZpeHVwRXhwcmVzc2lvbj4oKTtcbiAgcHJpdmF0ZSBsaXRlcmFsRmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsIG8uRXhwcmVzc2lvbj4oKTtcbiAgcHJpdmF0ZSBpbmplY3RvckRlZmluaXRpb25zID0gbmV3IE1hcDxhbnksIEZpeHVwRXhwcmVzc2lvbj4oKTtcbiAgcHJpdmF0ZSBkaXJlY3RpdmVEZWZpbml0aW9ucyA9IG5ldyBNYXA8YW55LCBGaXh1cEV4cHJlc3Npb24+KCk7XG4gIHByaXZhdGUgY29tcG9uZW50RGVmaW5pdGlvbnMgPSBuZXcgTWFwPGFueSwgRml4dXBFeHByZXNzaW9uPigpO1xuICBwcml2YXRlIHBpcGVEZWZpbml0aW9ucyA9IG5ldyBNYXA8YW55LCBGaXh1cEV4cHJlc3Npb24+KCk7XG5cbiAgcHJpdmF0ZSBuZXh0TmFtZUluZGV4ID0gMDtcblxuICBnZXRDb25zdExpdGVyYWwobGl0ZXJhbDogby5FeHByZXNzaW9uLCBmb3JjZVNoYXJlZD86IGJvb2xlYW4pOiBvLkV4cHJlc3Npb24ge1xuICAgIGlmIChsaXRlcmFsIGluc3RhbmNlb2Ygby5MaXRlcmFsRXhwciB8fCBsaXRlcmFsIGluc3RhbmNlb2YgRml4dXBFeHByZXNzaW9uKSB7XG4gICAgICAvLyBEbyBubyBwdXQgc2ltcGxlIGxpdGVyYWxzIGludG8gdGhlIGNvbnN0YW50IHBvb2wgb3IgdHJ5IHRvIHByb2R1Y2UgYSBjb25zdGFudCBmb3IgYVxuICAgICAgLy8gcmVmZXJlbmNlIHRvIGEgY29uc3RhbnQuXG4gICAgICByZXR1cm4gbGl0ZXJhbDtcbiAgICB9XG4gICAgY29uc3Qga2V5ID0gdGhpcy5rZXlPZihsaXRlcmFsKTtcbiAgICBsZXQgZml4dXAgPSB0aGlzLmxpdGVyYWxzLmdldChrZXkpO1xuICAgIGxldCBuZXdWYWx1ZSA9IGZhbHNlO1xuICAgIGlmICghZml4dXApIHtcbiAgICAgIGZpeHVwID0gbmV3IEZpeHVwRXhwcmVzc2lvbihsaXRlcmFsKTtcbiAgICAgIHRoaXMubGl0ZXJhbHMuc2V0KGtleSwgZml4dXApO1xuICAgICAgbmV3VmFsdWUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICgoIW5ld1ZhbHVlICYmICFmaXh1cC5zaGFyZWQpIHx8IChuZXdWYWx1ZSAmJiBmb3JjZVNoYXJlZCkpIHtcbiAgICAgIC8vIFJlcGxhY2UgdGhlIGV4cHJlc3Npb24gd2l0aCBhIHZhcmlhYmxlXG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5mcmVzaE5hbWUoKTtcbiAgICAgIHRoaXMuc3RhdGVtZW50cy5wdXNoKFxuICAgICAgICAgIG8udmFyaWFibGUobmFtZSkuc2V0KGxpdGVyYWwpLnRvRGVjbFN0bXQoby5JTkZFUlJFRF9UWVBFLCBbby5TdG10TW9kaWZpZXIuRmluYWxdKSk7XG4gICAgICBmaXh1cC5maXh1cChvLnZhcmlhYmxlKG5hbWUpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZml4dXA7XG4gIH1cblxuICBnZXREZWZlcnJlZFRyYW5zbGF0aW9uQ29uc3Qoc3VmZml4OiBzdHJpbmcpOiBvLlJlYWRWYXJFeHByIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuc3RhdGVtZW50cy5wdXNoKG5ldyBvLkV4cHJlc3Npb25TdGF0ZW1lbnQoby5OVUxMX0VYUFIpKSAtIDE7XG4gICAgY29uc3QgdmFyaWFibGUgPSBvLnZhcmlhYmxlKHRoaXMuZnJlc2hUcmFuc2xhdGlvbk5hbWUoc3VmZml4KSk7XG4gICAgdGhpcy5kZWZlcnJlZFRyYW5zbGF0aW9ucy5zZXQodmFyaWFibGUsIGluZGV4KTtcbiAgICByZXR1cm4gdmFyaWFibGU7XG4gIH1cblxuICBzZXREZWZlcnJlZFRyYW5zbGF0aW9uQ29uc3QodmFyaWFibGU6IG8uUmVhZFZhckV4cHIsIG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5kZWZlcnJlZFRyYW5zbGF0aW9ucy5nZXQodmFyaWFibGUpICE7XG4gICAgdGhpcy5zdGF0ZW1lbnRzW2luZGV4XSA9IHRoaXMuZ2V0VHJhbnNsYXRpb25EZWNsU3RtdCh2YXJpYWJsZSwgbWVzc2FnZSk7XG4gIH1cblxuICBnZXRUcmFuc2xhdGlvbkRlY2xTdG10KHZhcmlhYmxlOiBvLlJlYWRWYXJFeHByLCBtZXNzYWdlOiBzdHJpbmcpOiBvLkRlY2xhcmVWYXJTdG10IHtcbiAgICBjb25zdCBmbkNhbGwgPSBvLnZhcmlhYmxlKEdPT0dfR0VUX01TRykuY2FsbEZuKFtvLmxpdGVyYWwobWVzc2FnZSldKTtcbiAgICByZXR1cm4gdmFyaWFibGUuc2V0KGZuQ2FsbCkudG9EZWNsU3RtdChvLklORkVSUkVEX1RZUEUsIFtvLlN0bXRNb2RpZmllci5GaW5hbF0pO1xuICB9XG5cbiAgYXBwZW5kVHJhbnNsYXRpb25NZXRhKG1ldGE6IHN0cmluZ3xJMThuTWV0YSkge1xuICAgIGNvbnN0IHBhcnNlZE1ldGEgPSB0eXBlb2YgbWV0YSA9PT0gJ3N0cmluZycgPyBwYXJzZUkxOG5NZXRhKG1ldGEpIDogbWV0YTtcbiAgICBjb25zdCBkb2NTdG10ID0gaTE4bk1ldGFUb0RvY1N0bXQocGFyc2VkTWV0YSk7XG4gICAgaWYgKGRvY1N0bXQpIHtcbiAgICAgIHRoaXMuc3RhdGVtZW50cy5wdXNoKGRvY1N0bXQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEdlbmVyYXRlcyBjbG9zdXJlIHNwZWNpZmljIGNvZGUgZm9yIHRyYW5zbGF0aW9uLlxuICAvL1xuICAvLyBgYGBcbiAgLy8gLyoqXG4gIC8vICAqIEBkZXNjIGRlc2NyaXB0aW9uP1xuICAvLyAgKiBAbWVhbmluZyBtZWFuaW5nP1xuICAvLyAgKi9cbiAgLy8gY29uc3QgTVNHX1hZWiA9IGdvb2cuZ2V0TXNnKCdtZXNzYWdlJyk7XG4gIC8vIGBgYFxuICBnZXRUcmFuc2xhdGlvbihtZXNzYWdlOiBzdHJpbmcsIG1ldGE6IHN0cmluZywgc3VmZml4OiBzdHJpbmcpOiBvLkV4cHJlc3Npb24ge1xuICAgIGNvbnN0IHBhcnNlZE1ldGEgPSBwYXJzZUkxOG5NZXRhKG1ldGEpO1xuXG4gICAgLy8gVGhlIGlkZW50aXR5IG9mIGFuIGkxOG4gbWVzc2FnZSBkZXBlbmRzIG9uIHRoZSBtZXNzYWdlIGFuZCBpdHMgbWVhbmluZ1xuICAgIGNvbnN0IGtleSA9IHBhcnNlZE1ldGEubWVhbmluZyA/IGAke21lc3NhZ2V9XFx1MDAwMFxcdTAwMDAke3BhcnNlZE1ldGEubWVhbmluZ31gIDogbWVzc2FnZTtcblxuICAgIGNvbnN0IGV4cCA9IHRoaXMudHJhbnNsYXRpb25zLmdldChrZXkpO1xuXG4gICAgaWYgKGV4cCkge1xuICAgICAgcmV0dXJuIGV4cDtcbiAgICB9XG5cbiAgICBjb25zdCB2YXJpYWJsZSA9IG8udmFyaWFibGUodGhpcy5mcmVzaFRyYW5zbGF0aW9uTmFtZShzdWZmaXgpKTtcbiAgICB0aGlzLmFwcGVuZFRyYW5zbGF0aW9uTWV0YShwYXJzZWRNZXRhKTtcbiAgICB0aGlzLnN0YXRlbWVudHMucHVzaCh0aGlzLmdldFRyYW5zbGF0aW9uRGVjbFN0bXQodmFyaWFibGUsIG1lc3NhZ2UpKTtcblxuICAgIHRoaXMudHJhbnNsYXRpb25zLnNldChrZXksIHZhcmlhYmxlKTtcbiAgICByZXR1cm4gdmFyaWFibGU7XG4gIH1cblxuICBnZXREZWZpbml0aW9uKHR5cGU6IGFueSwga2luZDogRGVmaW5pdGlvbktpbmQsIGN0eDogT3V0cHV0Q29udGV4dCwgZm9yY2VTaGFyZWQ6IGJvb2xlYW4gPSBmYWxzZSk6XG4gICAgICBvLkV4cHJlc3Npb24ge1xuICAgIGNvbnN0IGRlZmluaXRpb25zID0gdGhpcy5kZWZpbml0aW9uc09mKGtpbmQpO1xuICAgIGxldCBmaXh1cCA9IGRlZmluaXRpb25zLmdldCh0eXBlKTtcbiAgICBsZXQgbmV3VmFsdWUgPSBmYWxzZTtcbiAgICBpZiAoIWZpeHVwKSB7XG4gICAgICBjb25zdCBwcm9wZXJ0eSA9IHRoaXMucHJvcGVydHlOYW1lT2Yoa2luZCk7XG4gICAgICBmaXh1cCA9IG5ldyBGaXh1cEV4cHJlc3Npb24oY3R4LmltcG9ydEV4cHIodHlwZSkucHJvcChwcm9wZXJ0eSkpO1xuICAgICAgZGVmaW5pdGlvbnMuc2V0KHR5cGUsIGZpeHVwKTtcbiAgICAgIG5ld1ZhbHVlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoKCFuZXdWYWx1ZSAmJiAhZml4dXAuc2hhcmVkKSB8fCAobmV3VmFsdWUgJiYgZm9yY2VTaGFyZWQpKSB7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5mcmVzaE5hbWUoKTtcbiAgICAgIHRoaXMuc3RhdGVtZW50cy5wdXNoKFxuICAgICAgICAgIG8udmFyaWFibGUobmFtZSkuc2V0KGZpeHVwLnJlc29sdmVkKS50b0RlY2xTdG10KG8uSU5GRVJSRURfVFlQRSwgW28uU3RtdE1vZGlmaWVyLkZpbmFsXSkpO1xuICAgICAgZml4dXAuZml4dXAoby52YXJpYWJsZShuYW1lKSk7XG4gICAgfVxuICAgIHJldHVybiBmaXh1cDtcbiAgfVxuXG4gIGdldExpdGVyYWxGYWN0b3J5KGxpdGVyYWw6IG8uTGl0ZXJhbEFycmF5RXhwcnxvLkxpdGVyYWxNYXBFeHByKTpcbiAgICAgIHtsaXRlcmFsRmFjdG9yeTogby5FeHByZXNzaW9uLCBsaXRlcmFsRmFjdG9yeUFyZ3VtZW50czogby5FeHByZXNzaW9uW119IHtcbiAgICAvLyBDcmVhdGUgYSBwdXJlIGZ1bmN0aW9uIHRoYXQgYnVpbGRzIGFuIGFycmF5IG9mIGEgbWl4IG9mIGNvbnN0YW50ICBhbmQgdmFyaWFibGUgZXhwcmVzc2lvbnNcbiAgICBpZiAobGl0ZXJhbCBpbnN0YW5jZW9mIG8uTGl0ZXJhbEFycmF5RXhwcikge1xuICAgICAgY29uc3QgYXJndW1lbnRzRm9yS2V5ID0gbGl0ZXJhbC5lbnRyaWVzLm1hcChlID0+IGUuaXNDb25zdGFudCgpID8gZSA6IG8ubGl0ZXJhbChudWxsKSk7XG4gICAgICBjb25zdCBrZXkgPSB0aGlzLmtleU9mKG8ubGl0ZXJhbEFycihhcmd1bWVudHNGb3JLZXkpKTtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRMaXRlcmFsRmFjdG9yeShrZXksIGxpdGVyYWwuZW50cmllcywgZW50cmllcyA9PiBvLmxpdGVyYWxBcnIoZW50cmllcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleHByZXNzaW9uRm9yS2V5ID0gby5saXRlcmFsTWFwKFxuICAgICAgICAgIGxpdGVyYWwuZW50cmllcy5tYXAoZSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGUua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZS52YWx1ZS5pc0NvbnN0YW50KCkgPyBlLnZhbHVlIDogby5saXRlcmFsKG51bGwpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdW90ZWQ6IGUucXVvdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSkpO1xuICAgICAgY29uc3Qga2V5ID0gdGhpcy5rZXlPZihleHByZXNzaW9uRm9yS2V5KTtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRMaXRlcmFsRmFjdG9yeShcbiAgICAgICAgICBrZXksIGxpdGVyYWwuZW50cmllcy5tYXAoZSA9PiBlLnZhbHVlKSxcbiAgICAgICAgICBlbnRyaWVzID0+IG8ubGl0ZXJhbE1hcChlbnRyaWVzLm1hcCgodmFsdWUsIGluZGV4KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBsaXRlcmFsLmVudHJpZXNbaW5kZXhdLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVvdGVkOiBsaXRlcmFsLmVudHJpZXNbaW5kZXhdLnF1b3RlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKSkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldExpdGVyYWxGYWN0b3J5KFxuICAgICAga2V5OiBzdHJpbmcsIHZhbHVlczogby5FeHByZXNzaW9uW10sIHJlc3VsdE1hcDogKHBhcmFtZXRlcnM6IG8uRXhwcmVzc2lvbltdKSA9PiBvLkV4cHJlc3Npb24pOlxuICAgICAge2xpdGVyYWxGYWN0b3J5OiBvLkV4cHJlc3Npb24sIGxpdGVyYWxGYWN0b3J5QXJndW1lbnRzOiBvLkV4cHJlc3Npb25bXX0ge1xuICAgIGxldCBsaXRlcmFsRmFjdG9yeSA9IHRoaXMubGl0ZXJhbEZhY3Rvcmllcy5nZXQoa2V5KTtcbiAgICBjb25zdCBsaXRlcmFsRmFjdG9yeUFyZ3VtZW50cyA9IHZhbHVlcy5maWx0ZXIoKGUgPT4gIWUuaXNDb25zdGFudCgpKSk7XG4gICAgaWYgKCFsaXRlcmFsRmFjdG9yeSkge1xuICAgICAgY29uc3QgcmVzdWx0RXhwcmVzc2lvbnMgPSB2YWx1ZXMubWFwKFxuICAgICAgICAgIChlLCBpbmRleCkgPT4gZS5pc0NvbnN0YW50KCkgPyB0aGlzLmdldENvbnN0TGl0ZXJhbChlLCB0cnVlKSA6IG8udmFyaWFibGUoYGEke2luZGV4fWApKTtcbiAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPVxuICAgICAgICAgIHJlc3VsdEV4cHJlc3Npb25zLmZpbHRlcihpc1ZhcmlhYmxlKS5tYXAoZSA9PiBuZXcgby5GblBhcmFtKGUubmFtZSAhLCBvLkRZTkFNSUNfVFlQRSkpO1xuICAgICAgY29uc3QgcHVyZUZ1bmN0aW9uRGVjbGFyYXRpb24gPVxuICAgICAgICAgIG8uZm4ocGFyYW1ldGVycywgW25ldyBvLlJldHVyblN0YXRlbWVudChyZXN1bHRNYXAocmVzdWx0RXhwcmVzc2lvbnMpKV0sIG8uSU5GRVJSRURfVFlQRSk7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5mcmVzaE5hbWUoKTtcbiAgICAgIHRoaXMuc3RhdGVtZW50cy5wdXNoKFxuICAgICAgICAgIG8udmFyaWFibGUobmFtZSkuc2V0KHB1cmVGdW5jdGlvbkRlY2xhcmF0aW9uKS50b0RlY2xTdG10KG8uSU5GRVJSRURfVFlQRSwgW1xuICAgICAgICAgICAgby5TdG10TW9kaWZpZXIuRmluYWxcbiAgICAgICAgICBdKSk7XG4gICAgICBsaXRlcmFsRmFjdG9yeSA9IG8udmFyaWFibGUobmFtZSk7XG4gICAgICB0aGlzLmxpdGVyYWxGYWN0b3JpZXMuc2V0KGtleSwgbGl0ZXJhbEZhY3RvcnkpO1xuICAgIH1cbiAgICByZXR1cm4ge2xpdGVyYWxGYWN0b3J5LCBsaXRlcmFsRmFjdG9yeUFyZ3VtZW50c307XG4gIH1cblxuICAvKipcbiAgICogUHJvZHVjZSBhIHVuaXF1ZSBuYW1lLlxuICAgKlxuICAgKiBUaGUgbmFtZSBtaWdodCBiZSB1bmlxdWUgYW1vbmcgZGlmZmVyZW50IHByZWZpeGVzIGlmIGFueSBvZiB0aGUgcHJlZml4ZXMgZW5kIGluXG4gICAqIGEgZGlnaXQgc28gdGhlIHByZWZpeCBzaG91bGQgYmUgYSBjb25zdGFudCBzdHJpbmcgKG5vdCBiYXNlZCBvbiB1c2VyIGlucHV0KSBhbmRcbiAgICogbXVzdCBub3QgZW5kIGluIGEgZGlnaXQuXG4gICAqL1xuICB1bmlxdWVOYW1lKHByZWZpeDogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIGAke3ByZWZpeH0ke3RoaXMubmV4dE5hbWVJbmRleCsrfWA7IH1cblxuICBwcml2YXRlIGRlZmluaXRpb25zT2Yoa2luZDogRGVmaW5pdGlvbktpbmQpOiBNYXA8YW55LCBGaXh1cEV4cHJlc3Npb24+IHtcbiAgICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAgIGNhc2UgRGVmaW5pdGlvbktpbmQuQ29tcG9uZW50OlxuICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnREZWZpbml0aW9ucztcbiAgICAgIGNhc2UgRGVmaW5pdGlvbktpbmQuRGlyZWN0aXZlOlxuICAgICAgICByZXR1cm4gdGhpcy5kaXJlY3RpdmVEZWZpbml0aW9ucztcbiAgICAgIGNhc2UgRGVmaW5pdGlvbktpbmQuSW5qZWN0b3I6XG4gICAgICAgIHJldHVybiB0aGlzLmluamVjdG9yRGVmaW5pdGlvbnM7XG4gICAgICBjYXNlIERlZmluaXRpb25LaW5kLlBpcGU6XG4gICAgICAgIHJldHVybiB0aGlzLnBpcGVEZWZpbml0aW9ucztcbiAgICB9XG4gICAgZXJyb3IoYFVua25vd24gZGVmaW5pdGlvbiBraW5kICR7a2luZH1gKTtcbiAgICByZXR1cm4gdGhpcy5jb21wb25lbnREZWZpbml0aW9ucztcbiAgfVxuXG4gIHB1YmxpYyBwcm9wZXJ0eU5hbWVPZihraW5kOiBEZWZpbml0aW9uS2luZCk6IHN0cmluZyB7XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICBjYXNlIERlZmluaXRpb25LaW5kLkNvbXBvbmVudDpcbiAgICAgICAgcmV0dXJuICduZ0NvbXBvbmVudERlZic7XG4gICAgICBjYXNlIERlZmluaXRpb25LaW5kLkRpcmVjdGl2ZTpcbiAgICAgICAgcmV0dXJuICduZ0RpcmVjdGl2ZURlZic7XG4gICAgICBjYXNlIERlZmluaXRpb25LaW5kLkluamVjdG9yOlxuICAgICAgICByZXR1cm4gJ25nSW5qZWN0b3JEZWYnO1xuICAgICAgY2FzZSBEZWZpbml0aW9uS2luZC5QaXBlOlxuICAgICAgICByZXR1cm4gJ25nUGlwZURlZic7XG4gICAgfVxuICAgIGVycm9yKGBVbmtub3duIGRlZmluaXRpb24ga2luZCAke2tpbmR9YCk7XG4gICAgcmV0dXJuICc8dW5rbm93bj4nO1xuICB9XG5cbiAgcHJpdmF0ZSBmcmVzaE5hbWUoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMudW5pcXVlTmFtZShDT05TVEFOVF9QUkVGSVgpOyB9XG5cbiAgcHJpdmF0ZSBmcmVzaFRyYW5zbGF0aW9uTmFtZShzdWZmaXg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudW5pcXVlTmFtZShUUkFOU0xBVElPTl9QUkVGSVggKyBzdWZmaXgpLnRvVXBwZXJDYXNlKCk7XG4gIH1cblxuICBwcml2YXRlIGtleU9mKGV4cHJlc3Npb246IG8uRXhwcmVzc2lvbikge1xuICAgIHJldHVybiBleHByZXNzaW9uLnZpc2l0RXhwcmVzc2lvbihuZXcgS2V5VmlzaXRvcigpLCBLRVlfQ09OVEVYVCk7XG4gIH1cbn1cblxuLyoqXG4gKiBWaXNpdG9yIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIDIgZXhwcmVzc2lvbnMgYXJlIGVxdWl2YWxlbnQgYW5kIGNhbiBiZSBzaGFyZWQgaW4gdGhlXG4gKiBgQ29uc3RhbnRQb29sYC5cbiAqXG4gKiBXaGVuIHRoZSBpZCAoc3RyaW5nKSBnZW5lcmF0ZWQgYnkgdGhlIHZpc2l0b3IgaXMgZXF1YWwsIGV4cHJlc3Npb25zIGFyZSBjb25zaWRlcmVkIGVxdWl2YWxlbnQuXG4gKi9cbmNsYXNzIEtleVZpc2l0b3IgaW1wbGVtZW50cyBvLkV4cHJlc3Npb25WaXNpdG9yIHtcbiAgdmlzaXRMaXRlcmFsRXhwcihhc3Q6IG8uTGl0ZXJhbEV4cHIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0eXBlb2YgYXN0LnZhbHVlID09PSAnc3RyaW5nJyA/ICdcIicgKyBhc3QudmFsdWUgKyAnXCInIDogYXN0LnZhbHVlfWA7XG4gIH1cblxuICB2aXNpdExpdGVyYWxBcnJheUV4cHIoYXN0OiBvLkxpdGVyYWxBcnJheUV4cHIsIGNvbnRleHQ6IG9iamVjdCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBbJHthc3QuZW50cmllcy5tYXAoZW50cnkgPT4gZW50cnkudmlzaXRFeHByZXNzaW9uKHRoaXMsIGNvbnRleHQpKS5qb2luKCcsJyl9XWA7XG4gIH1cblxuICB2aXNpdExpdGVyYWxNYXBFeHByKGFzdDogby5MaXRlcmFsTWFwRXhwciwgY29udGV4dDogb2JqZWN0KTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXBLZXkgPSAoZW50cnk6IG8uTGl0ZXJhbE1hcEVudHJ5KSA9PiB7XG4gICAgICBjb25zdCBxdW90ZSA9IGVudHJ5LnF1b3RlZCA/ICdcIicgOiAnJztcbiAgICAgIHJldHVybiBgJHtxdW90ZX0ke2VudHJ5LmtleX0ke3F1b3RlfWA7XG4gICAgfTtcbiAgICBjb25zdCBtYXBFbnRyeSA9IChlbnRyeTogby5MaXRlcmFsTWFwRW50cnkpID0+XG4gICAgICAgIGAke21hcEtleShlbnRyeSl9OiR7ZW50cnkudmFsdWUudmlzaXRFeHByZXNzaW9uKHRoaXMsIGNvbnRleHQpfWA7XG4gICAgcmV0dXJuIGB7JHthc3QuZW50cmllcy5tYXAobWFwRW50cnkpLmpvaW4oJywnKX1gO1xuICB9XG5cbiAgdmlzaXRFeHRlcm5hbEV4cHIoYXN0OiBvLkV4dGVybmFsRXhwcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGFzdC52YWx1ZS5tb2R1bGVOYW1lID8gYEVYOiR7YXN0LnZhbHVlLm1vZHVsZU5hbWV9OiR7YXN0LnZhbHVlLm5hbWV9YCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYEVYOiR7YXN0LnZhbHVlLnJ1bnRpbWUubmFtZX1gO1xuICB9XG5cbiAgdmlzaXRSZWFkVmFyRXhwcihub2RlOiBvLlJlYWRWYXJFeHByKSB7IHJldHVybiBgVkFSOiR7bm9kZS5uYW1lfWA7IH1cblxuICB2aXNpdFR5cGVvZkV4cHIobm9kZTogby5UeXBlb2ZFeHByLCBjb250ZXh0OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBgVFlQRU9GOiR7bm9kZS5leHByLnZpc2l0RXhwcmVzc2lvbih0aGlzLCBjb250ZXh0KX1gO1xuICB9XG5cbiAgdmlzaXRXcmFwcGVkTm9kZUV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdFdyaXRlVmFyRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0V3JpdGVLZXlFeHByID0gaW52YWxpZDtcbiAgdmlzaXRXcml0ZVByb3BFeHByID0gaW52YWxpZDtcbiAgdmlzaXRJbnZva2VNZXRob2RFeHByID0gaW52YWxpZDtcbiAgdmlzaXRJbnZva2VGdW5jdGlvbkV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdEluc3RhbnRpYXRlRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0Q29uZGl0aW9uYWxFeHByID0gaW52YWxpZDtcbiAgdmlzaXROb3RFeHByID0gaW52YWxpZDtcbiAgdmlzaXRBc3NlcnROb3ROdWxsRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0Q2FzdEV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdEZ1bmN0aW9uRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0QmluYXJ5T3BlcmF0b3JFeHByID0gaW52YWxpZDtcbiAgdmlzaXRSZWFkUHJvcEV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdFJlYWRLZXlFeHByID0gaW52YWxpZDtcbiAgdmlzaXRDb21tYUV4cHIgPSBpbnZhbGlkO1xufVxuXG5mdW5jdGlvbiBpbnZhbGlkPFQ+KGFyZzogby5FeHByZXNzaW9uIHwgby5TdGF0ZW1lbnQpOiBuZXZlciB7XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBJbnZhbGlkIHN0YXRlOiBWaXNpdG9yICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhbmRsZSAke2FyZy5jb25zdHJ1Y3Rvci5uYW1lfWApO1xufVxuXG5mdW5jdGlvbiBpc1ZhcmlhYmxlKGU6IG8uRXhwcmVzc2lvbik6IGUgaXMgby5SZWFkVmFyRXhwciB7XG4gIHJldHVybiBlIGluc3RhbmNlb2Ygby5SZWFkVmFyRXhwcjtcbn1cblxuLy8gQ29udmVydHMgaTE4biBtZXRhIGluZm9ybWF0aW9ucyBmb3IgYSBtZXNzYWdlIChpZCwgZGVzY3JpcHRpb24sIG1lYW5pbmcpXG4vLyB0byBhIEpzRG9jIHN0YXRlbWVudCBmb3JtYXR0ZWQgYXMgZXhwZWN0ZWQgYnkgdGhlIENsb3N1cmUgY29tcGlsZXIuXG5mdW5jdGlvbiBpMThuTWV0YVRvRG9jU3RtdChtZXRhOiBJMThuTWV0YSk6IG8uSlNEb2NDb21tZW50U3RtdHxudWxsIHtcbiAgY29uc3QgdGFnczogby5KU0RvY1RhZ1tdID0gW107XG5cbiAgaWYgKG1ldGEuaWQgfHwgbWV0YS5kZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IHRleHQgPSBtZXRhLmlkID8gYFtCQUNLVVBfTUVTU0FHRV9JRDoke21ldGEuaWR9XSAke21ldGEuZGVzY3JpcHRpb259YCA6IG1ldGEuZGVzY3JpcHRpb247XG4gICAgdGFncy5wdXNoKHt0YWdOYW1lOiBvLkpTRG9jVGFnTmFtZS5EZXNjLCB0ZXh0OiB0ZXh0ICEudHJpbSgpfSk7XG4gIH1cblxuICBpZiAobWV0YS5tZWFuaW5nKSB7XG4gICAgdGFncy5wdXNoKHt0YWdOYW1lOiBvLkpTRG9jVGFnTmFtZS5NZWFuaW5nLCB0ZXh0OiBtZXRhLm1lYW5pbmd9KTtcbiAgfVxuXG4gIHJldHVybiB0YWdzLmxlbmd0aCA9PSAwID8gbnVsbCA6IG5ldyBvLkpTRG9jQ29tbWVudFN0bXQodGFncyk7XG59XG4iXX0=