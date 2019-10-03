/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import * as cdAst from '../expression_parser/ast';
import { Identifiers } from '../identifiers';
import * as o from '../output/output_ast';
var EventHandlerVars = /** @class */ (function () {
    function EventHandlerVars() {
    }
    EventHandlerVars.event = o.variable('$event');
    return EventHandlerVars;
}());
export { EventHandlerVars };
var ConvertActionBindingResult = /** @class */ (function () {
    function ConvertActionBindingResult(
    /**
     * Render2 compatible statements,
     */
    stmts, 
    /**
     * Variable name used with render2 compatible statements.
     */
    allowDefault) {
        this.stmts = stmts;
        this.allowDefault = allowDefault;
        /**
         * This is bit of a hack. It converts statements which render2 expects to statements which are
         * expected by render3.
         *
         * Example: `<div click="doSomething($event)">` will generate:
         *
         * Render3:
         * ```
         * const pd_b:any = ((<any>ctx.doSomething($event)) !== false);
         * return pd_b;
         * ```
         *
         * but render2 expects:
         * ```
         * return ctx.doSomething($event);
         * ```
         */
        // TODO(misko): remove this hack once we no longer support ViewEngine.
        this.render3Stmts = stmts.map(function (statement) {
            if (statement instanceof o.DeclareVarStmt && statement.name == allowDefault.name &&
                statement.value instanceof o.BinaryOperatorExpr) {
                var lhs = statement.value.lhs;
                return new o.ReturnStatement(lhs.value);
            }
            return statement;
        });
    }
    return ConvertActionBindingResult;
}());
export { ConvertActionBindingResult };
/**
 * Converts the given expression AST into an executable output AST, assuming the expression is
 * used in an action binding (e.g. an event handler).
 */
export function convertActionBinding(localResolver, implicitReceiver, action, bindingId, interpolationFunction) {
    if (!localResolver) {
        localResolver = new DefaultLocalResolver();
    }
    var actionWithoutBuiltins = convertPropertyBindingBuiltins({
        createLiteralArrayConverter: function (argCount) {
            // Note: no caching for literal arrays in actions.
            return function (args) { return o.literalArr(args); };
        },
        createLiteralMapConverter: function (keys) {
            // Note: no caching for literal maps in actions.
            return function (values) {
                var entries = keys.map(function (k, i) { return ({
                    key: k.key,
                    value: values[i],
                    quoted: k.quoted,
                }); });
                return o.literalMap(entries);
            };
        },
        createPipeConverter: function (name) {
            throw new Error("Illegal State: Actions are not allowed to contain pipes. Pipe: " + name);
        }
    }, action);
    var visitor = new _AstToIrVisitor(localResolver, implicitReceiver, bindingId, interpolationFunction);
    var actionStmts = [];
    flattenStatements(actionWithoutBuiltins.visit(visitor, _Mode.Statement), actionStmts);
    prependTemporaryDecls(visitor.temporaryCount, bindingId, actionStmts);
    var lastIndex = actionStmts.length - 1;
    var preventDefaultVar = null;
    if (lastIndex >= 0) {
        var lastStatement = actionStmts[lastIndex];
        var returnExpr = convertStmtIntoExpression(lastStatement);
        if (returnExpr) {
            // Note: We need to cast the result of the method call to dynamic,
            // as it might be a void method!
            preventDefaultVar = createPreventDefaultVar(bindingId);
            actionStmts[lastIndex] =
                preventDefaultVar.set(returnExpr.cast(o.DYNAMIC_TYPE).notIdentical(o.literal(false)))
                    .toDeclStmt(null, [o.StmtModifier.Final]);
        }
    }
    return new ConvertActionBindingResult(actionStmts, preventDefaultVar);
}
export function convertPropertyBindingBuiltins(converterFactory, ast) {
    return convertBuiltins(converterFactory, ast);
}
var ConvertPropertyBindingResult = /** @class */ (function () {
    function ConvertPropertyBindingResult(stmts, currValExpr) {
        this.stmts = stmts;
        this.currValExpr = currValExpr;
    }
    return ConvertPropertyBindingResult;
}());
export { ConvertPropertyBindingResult };
export var BindingForm;
(function (BindingForm) {
    // The general form of binding expression, supports all expressions.
    BindingForm[BindingForm["General"] = 0] = "General";
    // Try to generate a simple binding (no temporaries or statements)
    // otherwise generate a general binding
    BindingForm[BindingForm["TrySimple"] = 1] = "TrySimple";
})(BindingForm || (BindingForm = {}));
/**
 * Converts the given expression AST into an executable output AST, assuming the expression
 * is used in property binding. The expression has to be preprocessed via
 * `convertPropertyBindingBuiltins`.
 */
export function convertPropertyBinding(localResolver, implicitReceiver, expressionWithoutBuiltins, bindingId, form, interpolationFunction) {
    if (!localResolver) {
        localResolver = new DefaultLocalResolver();
    }
    var currValExpr = createCurrValueExpr(bindingId);
    var stmts = [];
    var visitor = new _AstToIrVisitor(localResolver, implicitReceiver, bindingId, interpolationFunction);
    var outputExpr = expressionWithoutBuiltins.visit(visitor, _Mode.Expression);
    if (visitor.temporaryCount) {
        for (var i = 0; i < visitor.temporaryCount; i++) {
            stmts.push(temporaryDeclaration(bindingId, i));
        }
    }
    else if (form == BindingForm.TrySimple) {
        return new ConvertPropertyBindingResult([], outputExpr);
    }
    stmts.push(currValExpr.set(outputExpr).toDeclStmt(o.DYNAMIC_TYPE, [o.StmtModifier.Final]));
    return new ConvertPropertyBindingResult(stmts, currValExpr);
}
function convertBuiltins(converterFactory, ast) {
    var visitor = new _BuiltinAstConverter(converterFactory);
    return ast.visit(visitor);
}
function temporaryName(bindingId, temporaryNumber) {
    return "tmp_" + bindingId + "_" + temporaryNumber;
}
export function temporaryDeclaration(bindingId, temporaryNumber) {
    return new o.DeclareVarStmt(temporaryName(bindingId, temporaryNumber), o.NULL_EXPR);
}
function prependTemporaryDecls(temporaryCount, bindingId, statements) {
    for (var i = temporaryCount - 1; i >= 0; i--) {
        statements.unshift(temporaryDeclaration(bindingId, i));
    }
}
var _Mode;
(function (_Mode) {
    _Mode[_Mode["Statement"] = 0] = "Statement";
    _Mode[_Mode["Expression"] = 1] = "Expression";
})(_Mode || (_Mode = {}));
function ensureStatementMode(mode, ast) {
    if (mode !== _Mode.Statement) {
        throw new Error("Expected a statement, but saw " + ast);
    }
}
function ensureExpressionMode(mode, ast) {
    if (mode !== _Mode.Expression) {
        throw new Error("Expected an expression, but saw " + ast);
    }
}
function convertToStatementIfNeeded(mode, expr) {
    if (mode === _Mode.Statement) {
        return expr.toStmt();
    }
    else {
        return expr;
    }
}
var _BuiltinAstConverter = /** @class */ (function (_super) {
    tslib_1.__extends(_BuiltinAstConverter, _super);
    function _BuiltinAstConverter(_converterFactory) {
        var _this = _super.call(this) || this;
        _this._converterFactory = _converterFactory;
        return _this;
    }
    _BuiltinAstConverter.prototype.visitPipe = function (ast, context) {
        var _this = this;
        var args = tslib_1.__spread([ast.exp], ast.args).map(function (ast) { return ast.visit(_this, context); });
        return new BuiltinFunctionCall(ast.span, args, this._converterFactory.createPipeConverter(ast.name, args.length));
    };
    _BuiltinAstConverter.prototype.visitLiteralArray = function (ast, context) {
        var _this = this;
        var args = ast.expressions.map(function (ast) { return ast.visit(_this, context); });
        return new BuiltinFunctionCall(ast.span, args, this._converterFactory.createLiteralArrayConverter(ast.expressions.length));
    };
    _BuiltinAstConverter.prototype.visitLiteralMap = function (ast, context) {
        var _this = this;
        var args = ast.values.map(function (ast) { return ast.visit(_this, context); });
        return new BuiltinFunctionCall(ast.span, args, this._converterFactory.createLiteralMapConverter(ast.keys));
    };
    return _BuiltinAstConverter;
}(cdAst.AstTransformer));
var _AstToIrVisitor = /** @class */ (function () {
    function _AstToIrVisitor(_localResolver, _implicitReceiver, bindingId, interpolationFunction) {
        this._localResolver = _localResolver;
        this._implicitReceiver = _implicitReceiver;
        this.bindingId = bindingId;
        this.interpolationFunction = interpolationFunction;
        this._nodeMap = new Map();
        this._resultMap = new Map();
        this._currentTemporary = 0;
        this.temporaryCount = 0;
    }
    _AstToIrVisitor.prototype.visitBinary = function (ast, mode) {
        var op;
        switch (ast.operation) {
            case '+':
                op = o.BinaryOperator.Plus;
                break;
            case '-':
                op = o.BinaryOperator.Minus;
                break;
            case '*':
                op = o.BinaryOperator.Multiply;
                break;
            case '/':
                op = o.BinaryOperator.Divide;
                break;
            case '%':
                op = o.BinaryOperator.Modulo;
                break;
            case '&&':
                op = o.BinaryOperator.And;
                break;
            case '||':
                op = o.BinaryOperator.Or;
                break;
            case '==':
                op = o.BinaryOperator.Equals;
                break;
            case '!=':
                op = o.BinaryOperator.NotEquals;
                break;
            case '===':
                op = o.BinaryOperator.Identical;
                break;
            case '!==':
                op = o.BinaryOperator.NotIdentical;
                break;
            case '<':
                op = o.BinaryOperator.Lower;
                break;
            case '>':
                op = o.BinaryOperator.Bigger;
                break;
            case '<=':
                op = o.BinaryOperator.LowerEquals;
                break;
            case '>=':
                op = o.BinaryOperator.BiggerEquals;
                break;
            default:
                throw new Error("Unsupported operation " + ast.operation);
        }
        return convertToStatementIfNeeded(mode, new o.BinaryOperatorExpr(op, this._visit(ast.left, _Mode.Expression), this._visit(ast.right, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitChain = function (ast, mode) {
        ensureStatementMode(mode, ast);
        return this.visitAll(ast.expressions, mode);
    };
    _AstToIrVisitor.prototype.visitConditional = function (ast, mode) {
        var value = this._visit(ast.condition, _Mode.Expression);
        return convertToStatementIfNeeded(mode, value.conditional(this._visit(ast.trueExp, _Mode.Expression), this._visit(ast.falseExp, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitPipe = function (ast, mode) {
        throw new Error("Illegal state: Pipes should have been converted into functions. Pipe: " + ast.name);
    };
    _AstToIrVisitor.prototype.visitFunctionCall = function (ast, mode) {
        var convertedArgs = this.visitAll(ast.args, _Mode.Expression);
        var fnResult;
        if (ast instanceof BuiltinFunctionCall) {
            fnResult = ast.converter(convertedArgs);
        }
        else {
            fnResult = this._visit(ast.target, _Mode.Expression).callFn(convertedArgs);
        }
        return convertToStatementIfNeeded(mode, fnResult);
    };
    _AstToIrVisitor.prototype.visitImplicitReceiver = function (ast, mode) {
        ensureExpressionMode(mode, ast);
        return this._implicitReceiver;
    };
    _AstToIrVisitor.prototype.visitInterpolation = function (ast, mode) {
        ensureExpressionMode(mode, ast);
        var args = [o.literal(ast.expressions.length)];
        for (var i = 0; i < ast.strings.length - 1; i++) {
            args.push(o.literal(ast.strings[i]));
            args.push(this._visit(ast.expressions[i], _Mode.Expression));
        }
        args.push(o.literal(ast.strings[ast.strings.length - 1]));
        if (this.interpolationFunction) {
            return this.interpolationFunction(args);
        }
        return ast.expressions.length <= 9 ?
            o.importExpr(Identifiers.inlineInterpolate).callFn(args) :
            o.importExpr(Identifiers.interpolate).callFn([args[0], o.literalArr(args.slice(1))]);
    };
    _AstToIrVisitor.prototype.visitKeyedRead = function (ast, mode) {
        var leftMostSafe = this.leftMostSafeNode(ast);
        if (leftMostSafe) {
            return this.convertSafeAccess(ast, leftMostSafe, mode);
        }
        else {
            return convertToStatementIfNeeded(mode, this._visit(ast.obj, _Mode.Expression).key(this._visit(ast.key, _Mode.Expression)));
        }
    };
    _AstToIrVisitor.prototype.visitKeyedWrite = function (ast, mode) {
        var obj = this._visit(ast.obj, _Mode.Expression);
        var key = this._visit(ast.key, _Mode.Expression);
        var value = this._visit(ast.value, _Mode.Expression);
        return convertToStatementIfNeeded(mode, obj.key(key).set(value));
    };
    _AstToIrVisitor.prototype.visitLiteralArray = function (ast, mode) {
        throw new Error("Illegal State: literal arrays should have been converted into functions");
    };
    _AstToIrVisitor.prototype.visitLiteralMap = function (ast, mode) {
        throw new Error("Illegal State: literal maps should have been converted into functions");
    };
    _AstToIrVisitor.prototype.visitLiteralPrimitive = function (ast, mode) {
        // For literal values of null, undefined, true, or false allow type interference
        // to infer the type.
        var type = ast.value === null || ast.value === undefined || ast.value === true || ast.value === true ?
            o.INFERRED_TYPE :
            undefined;
        return convertToStatementIfNeeded(mode, o.literal(ast.value, type));
    };
    _AstToIrVisitor.prototype._getLocal = function (name) { return this._localResolver.getLocal(name); };
    _AstToIrVisitor.prototype.visitMethodCall = function (ast, mode) {
        if (ast.receiver instanceof cdAst.ImplicitReceiver && ast.name == '$any') {
            var args = this.visitAll(ast.args, _Mode.Expression);
            if (args.length != 1) {
                throw new Error("Invalid call to $any, expected 1 argument but received " + (args.length || 'none'));
            }
            return args[0].cast(o.DYNAMIC_TYPE);
        }
        var leftMostSafe = this.leftMostSafeNode(ast);
        if (leftMostSafe) {
            return this.convertSafeAccess(ast, leftMostSafe, mode);
        }
        else {
            var args = this.visitAll(ast.args, _Mode.Expression);
            var result = null;
            var receiver = this._visit(ast.receiver, _Mode.Expression);
            if (receiver === this._implicitReceiver) {
                var varExpr = this._getLocal(ast.name);
                if (varExpr) {
                    result = varExpr.callFn(args);
                }
            }
            if (result == null) {
                result = receiver.callMethod(ast.name, args);
            }
            return convertToStatementIfNeeded(mode, result);
        }
    };
    _AstToIrVisitor.prototype.visitPrefixNot = function (ast, mode) {
        return convertToStatementIfNeeded(mode, o.not(this._visit(ast.expression, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitNonNullAssert = function (ast, mode) {
        return convertToStatementIfNeeded(mode, o.assertNotNull(this._visit(ast.expression, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitPropertyRead = function (ast, mode) {
        var leftMostSafe = this.leftMostSafeNode(ast);
        if (leftMostSafe) {
            return this.convertSafeAccess(ast, leftMostSafe, mode);
        }
        else {
            var result = null;
            var receiver = this._visit(ast.receiver, _Mode.Expression);
            if (receiver === this._implicitReceiver) {
                result = this._getLocal(ast.name);
            }
            if (result == null) {
                result = receiver.prop(ast.name);
            }
            return convertToStatementIfNeeded(mode, result);
        }
    };
    _AstToIrVisitor.prototype.visitPropertyWrite = function (ast, mode) {
        var receiver = this._visit(ast.receiver, _Mode.Expression);
        var varExpr = null;
        if (receiver === this._implicitReceiver) {
            var localExpr = this._getLocal(ast.name);
            if (localExpr) {
                if (localExpr instanceof o.ReadPropExpr) {
                    // If the local variable is a property read expression, it's a reference
                    // to a 'context.property' value and will be used as the target of the
                    // write expression.
                    varExpr = localExpr;
                }
                else {
                    // Otherwise it's an error.
                    throw new Error('Cannot assign to a reference or variable!');
                }
            }
        }
        // If no local expression could be produced, use the original receiver's
        // property as the target.
        if (varExpr === null) {
            varExpr = receiver.prop(ast.name);
        }
        return convertToStatementIfNeeded(mode, varExpr.set(this._visit(ast.value, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitSafePropertyRead = function (ast, mode) {
        return this.convertSafeAccess(ast, this.leftMostSafeNode(ast), mode);
    };
    _AstToIrVisitor.prototype.visitSafeMethodCall = function (ast, mode) {
        return this.convertSafeAccess(ast, this.leftMostSafeNode(ast), mode);
    };
    _AstToIrVisitor.prototype.visitAll = function (asts, mode) {
        var _this = this;
        return asts.map(function (ast) { return _this._visit(ast, mode); });
    };
    _AstToIrVisitor.prototype.visitQuote = function (ast, mode) {
        throw new Error("Quotes are not supported for evaluation!\n        Statement: " + ast.uninterpretedExpression + " located at " + ast.location);
    };
    _AstToIrVisitor.prototype._visit = function (ast, mode) {
        var result = this._resultMap.get(ast);
        if (result)
            return result;
        return (this._nodeMap.get(ast) || ast).visit(this, mode);
    };
    _AstToIrVisitor.prototype.convertSafeAccess = function (ast, leftMostSafe, mode) {
        // If the expression contains a safe access node on the left it needs to be converted to
        // an expression that guards the access to the member by checking the receiver for blank. As
        // execution proceeds from left to right, the left most part of the expression must be guarded
        // first but, because member access is left associative, the right side of the expression is at
        // the top of the AST. The desired result requires lifting a copy of the the left part of the
        // expression up to test it for blank before generating the unguarded version.
        // Consider, for example the following expression: a?.b.c?.d.e
        // This results in the ast:
        //         .
        //        / \
        //       ?.   e
        //      /  \
        //     .    d
        //    / \
        //   ?.  c
        //  /  \
        // a    b
        // The following tree should be generated:
        //
        //        /---- ? ----\
        //       /      |      \
        //     a   /--- ? ---\  null
        //        /     |     \
        //       .      .     null
        //      / \    / \
        //     .  c   .   e
        //    / \    / \
        //   a   b  ,   d
        //         / \
        //        .   c
        //       / \
        //      a   b
        //
        // Notice that the first guard condition is the left hand of the left most safe access node
        // which comes in as leftMostSafe to this routine.
        var guardedExpression = this._visit(leftMostSafe.receiver, _Mode.Expression);
        var temporary = undefined;
        if (this.needsTemporary(leftMostSafe.receiver)) {
            // If the expression has method calls or pipes then we need to save the result into a
            // temporary variable to avoid calling stateful or impure code more than once.
            temporary = this.allocateTemporary();
            // Preserve the result in the temporary variable
            guardedExpression = temporary.set(guardedExpression);
            // Ensure all further references to the guarded expression refer to the temporary instead.
            this._resultMap.set(leftMostSafe.receiver, temporary);
        }
        var condition = guardedExpression.isBlank();
        // Convert the ast to an unguarded access to the receiver's member. The map will substitute
        // leftMostNode with its unguarded version in the call to `this.visit()`.
        if (leftMostSafe instanceof cdAst.SafeMethodCall) {
            this._nodeMap.set(leftMostSafe, new cdAst.MethodCall(leftMostSafe.span, leftMostSafe.receiver, leftMostSafe.name, leftMostSafe.args));
        }
        else {
            this._nodeMap.set(leftMostSafe, new cdAst.PropertyRead(leftMostSafe.span, leftMostSafe.receiver, leftMostSafe.name));
        }
        // Recursively convert the node now without the guarded member access.
        var access = this._visit(ast, _Mode.Expression);
        // Remove the mapping. This is not strictly required as the converter only traverses each node
        // once but is safer if the conversion is changed to traverse the nodes more than once.
        this._nodeMap.delete(leftMostSafe);
        // If we allocated a temporary, release it.
        if (temporary) {
            this.releaseTemporary(temporary);
        }
        // Produce the conditional
        return convertToStatementIfNeeded(mode, condition.conditional(o.literal(null), access));
    };
    // Given a expression of the form a?.b.c?.d.e the the left most safe node is
    // the (a?.b). The . and ?. are left associative thus can be rewritten as:
    // ((((a?.c).b).c)?.d).e. This returns the most deeply nested safe read or
    // safe method call as this needs be transform initially to:
    //   a == null ? null : a.c.b.c?.d.e
    // then to:
    //   a == null ? null : a.b.c == null ? null : a.b.c.d.e
    _AstToIrVisitor.prototype.leftMostSafeNode = function (ast) {
        var _this = this;
        var visit = function (visitor, ast) {
            return (_this._nodeMap.get(ast) || ast).visit(visitor);
        };
        return ast.visit({
            visitBinary: function (ast) { return null; },
            visitChain: function (ast) { return null; },
            visitConditional: function (ast) { return null; },
            visitFunctionCall: function (ast) { return null; },
            visitImplicitReceiver: function (ast) { return null; },
            visitInterpolation: function (ast) { return null; },
            visitKeyedRead: function (ast) { return visit(this, ast.obj); },
            visitKeyedWrite: function (ast) { return null; },
            visitLiteralArray: function (ast) { return null; },
            visitLiteralMap: function (ast) { return null; },
            visitLiteralPrimitive: function (ast) { return null; },
            visitMethodCall: function (ast) { return visit(this, ast.receiver); },
            visitPipe: function (ast) { return null; },
            visitPrefixNot: function (ast) { return null; },
            visitNonNullAssert: function (ast) { return null; },
            visitPropertyRead: function (ast) { return visit(this, ast.receiver); },
            visitPropertyWrite: function (ast) { return null; },
            visitQuote: function (ast) { return null; },
            visitSafeMethodCall: function (ast) { return visit(this, ast.receiver) || ast; },
            visitSafePropertyRead: function (ast) {
                return visit(this, ast.receiver) || ast;
            }
        });
    };
    // Returns true of the AST includes a method or a pipe indicating that, if the
    // expression is used as the target of a safe property or method access then
    // the expression should be stored into a temporary variable.
    _AstToIrVisitor.prototype.needsTemporary = function (ast) {
        var _this = this;
        var visit = function (visitor, ast) {
            return ast && (_this._nodeMap.get(ast) || ast).visit(visitor);
        };
        var visitSome = function (visitor, ast) {
            return ast.some(function (ast) { return visit(visitor, ast); });
        };
        return ast.visit({
            visitBinary: function (ast) { return visit(this, ast.left) || visit(this, ast.right); },
            visitChain: function (ast) { return false; },
            visitConditional: function (ast) {
                return visit(this, ast.condition) || visit(this, ast.trueExp) ||
                    visit(this, ast.falseExp);
            },
            visitFunctionCall: function (ast) { return true; },
            visitImplicitReceiver: function (ast) { return false; },
            visitInterpolation: function (ast) { return visitSome(this, ast.expressions); },
            visitKeyedRead: function (ast) { return false; },
            visitKeyedWrite: function (ast) { return false; },
            visitLiteralArray: function (ast) { return true; },
            visitLiteralMap: function (ast) { return true; },
            visitLiteralPrimitive: function (ast) { return false; },
            visitMethodCall: function (ast) { return true; },
            visitPipe: function (ast) { return true; },
            visitPrefixNot: function (ast) { return visit(this, ast.expression); },
            visitNonNullAssert: function (ast) { return visit(this, ast.expression); },
            visitPropertyRead: function (ast) { return false; },
            visitPropertyWrite: function (ast) { return false; },
            visitQuote: function (ast) { return false; },
            visitSafeMethodCall: function (ast) { return true; },
            visitSafePropertyRead: function (ast) { return false; }
        });
    };
    _AstToIrVisitor.prototype.allocateTemporary = function () {
        var tempNumber = this._currentTemporary++;
        this.temporaryCount = Math.max(this._currentTemporary, this.temporaryCount);
        return new o.ReadVarExpr(temporaryName(this.bindingId, tempNumber));
    };
    _AstToIrVisitor.prototype.releaseTemporary = function (temporary) {
        this._currentTemporary--;
        if (temporary.name != temporaryName(this.bindingId, this._currentTemporary)) {
            throw new Error("Temporary " + temporary.name + " released out of order");
        }
    };
    return _AstToIrVisitor;
}());
function flattenStatements(arg, output) {
    if (Array.isArray(arg)) {
        arg.forEach(function (entry) { return flattenStatements(entry, output); });
    }
    else {
        output.push(arg);
    }
}
var DefaultLocalResolver = /** @class */ (function () {
    function DefaultLocalResolver() {
    }
    DefaultLocalResolver.prototype.getLocal = function (name) {
        if (name === EventHandlerVars.event.name) {
            return EventHandlerVars.event;
        }
        return null;
    };
    return DefaultLocalResolver;
}());
function createCurrValueExpr(bindingId) {
    return o.variable("currVal_" + bindingId); // fix syntax highlighting: `
}
function createPreventDefaultVar(bindingId) {
    return o.variable("pd_" + bindingId);
}
function convertStmtIntoExpression(stmt) {
    if (stmt instanceof o.ExpressionStatement) {
        return stmt.expr;
    }
    else if (stmt instanceof o.ReturnStatement) {
        return stmt.value;
    }
    return null;
}
var BuiltinFunctionCall = /** @class */ (function (_super) {
    tslib_1.__extends(BuiltinFunctionCall, _super);
    function BuiltinFunctionCall(span, args, converter) {
        var _this = _super.call(this, span, null, args) || this;
        _this.args = args;
        _this.converter = converter;
        return _this;
    }
    return BuiltinFunctionCall;
}(cdAst.FunctionCall));
export { BuiltinFunctionCall };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbl9jb252ZXJ0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvY29tcGlsZXJfdXRpbC9leHByZXNzaW9uX2NvbnZlcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxLQUFLLEtBQUssTUFBTSwwQkFBMEIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDM0MsT0FBTyxLQUFLLENBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUUxQztJQUFBO0lBQXFFLENBQUM7SUFBL0Isc0JBQUssR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQUMsdUJBQUM7Q0FBQSxBQUF0RSxJQUFzRTtTQUF6RCxnQkFBZ0I7QUFJN0I7SUFLRTtJQUNJOztPQUVHO0lBQ0ksS0FBb0I7SUFDM0I7O09BRUc7SUFDSSxZQUEyQjtRQUozQixVQUFLLEdBQUwsS0FBSyxDQUFlO1FBSXBCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1FBQ3BDOzs7Ozs7Ozs7Ozs7Ozs7O1dBZ0JHO1FBQ0gsc0VBQXNFO1FBQ3RFLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFDLFNBQXNCO1lBQ25ELElBQUksU0FBUyxZQUFZLENBQUMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxZQUFZLENBQUMsSUFBSTtnQkFDNUUsU0FBUyxDQUFDLEtBQUssWUFBWSxDQUFDLENBQUMsa0JBQWtCLEVBQUU7Z0JBQ25ELElBQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBaUIsQ0FBQztnQkFDOUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3pDO1lBQ0QsT0FBTyxT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WUFBWSxDQUFDLENBQUMsbUJBQW1CLEVBQUU7UUFDekMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0tBQ2xCO1NBQU0sSUFBSSxJQUFJLFlBQVksQ0FBQyxDQUFDLGVBQWUsRUFBRTtRQUM1QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7S0FDbkI7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDtJQUF5QywrQ0FBa0I7SUFDekQsNkJBQVksSUFBcUIsRUFBUyxJQUFpQixFQUFTLFNBQTJCO1FBQS9GLFlBQ0Usa0JBQU0sSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FDeEI7UUFGeUMsVUFBSSxHQUFKLElBQUksQ0FBYTtRQUFTLGVBQVMsR0FBVCxTQUFTLENBQWtCOztJQUUvRixDQUFDO0lBQ0gsMEJBQUM7QUFBRCxDQUFDLEFBSkQsQ0FBeUMsS0FBSyxDQUFDLFlBQVksR0FJMUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGNkQXN0IGZyb20gJy4uL2V4cHJlc3Npb25fcGFyc2VyL2FzdCc7XG5pbXBvcnQge0lkZW50aWZpZXJzfSBmcm9tICcuLi9pZGVudGlmaWVycyc7XG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uL291dHB1dC9vdXRwdXRfYXN0JztcblxuZXhwb3J0IGNsYXNzIEV2ZW50SGFuZGxlclZhcnMgeyBzdGF0aWMgZXZlbnQgPSBvLnZhcmlhYmxlKCckZXZlbnQnKTsgfVxuXG5leHBvcnQgaW50ZXJmYWNlIExvY2FsUmVzb2x2ZXIgeyBnZXRMb2NhbChuYW1lOiBzdHJpbmcpOiBvLkV4cHJlc3Npb258bnVsbDsgfVxuXG5leHBvcnQgY2xhc3MgQ29udmVydEFjdGlvbkJpbmRpbmdSZXN1bHQge1xuICAvKipcbiAgICogU3RvcmUgc3RhdGVtZW50cyB3aGljaCBhcmUgcmVuZGVyMyBjb21wYXRpYmxlLlxuICAgKi9cbiAgcmVuZGVyM1N0bXRzOiBvLlN0YXRlbWVudFtdO1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKlxuICAgICAgICogUmVuZGVyMiBjb21wYXRpYmxlIHN0YXRlbWVudHMsXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBzdG10czogby5TdGF0ZW1lbnRbXSxcbiAgICAgIC8qKlxuICAgICAgICogVmFyaWFibGUgbmFtZSB1c2VkIHdpdGggcmVuZGVyMiBjb21wYXRpYmxlIHN0YXRlbWVudHMuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBhbGxvd0RlZmF1bHQ6IG8uUmVhZFZhckV4cHIpIHtcbiAgICAvKipcbiAgICAgKiBUaGlzIGlzIGJpdCBvZiBhIGhhY2suIEl0IGNvbnZlcnRzIHN0YXRlbWVudHMgd2hpY2ggcmVuZGVyMiBleHBlY3RzIHRvIHN0YXRlbWVudHMgd2hpY2ggYXJlXG4gICAgICogZXhwZWN0ZWQgYnkgcmVuZGVyMy5cbiAgICAgKlxuICAgICAqIEV4YW1wbGU6IGA8ZGl2IGNsaWNrPVwiZG9Tb21ldGhpbmcoJGV2ZW50KVwiPmAgd2lsbCBnZW5lcmF0ZTpcbiAgICAgKlxuICAgICAqIFJlbmRlcjM6XG4gICAgICogYGBgXG4gICAgICogY29uc3QgcGRfYjphbnkgPSAoKDxhbnk+Y3R4LmRvU29tZXRoaW5nKCRldmVudCkpICE9PSBmYWxzZSk7XG4gICAgICogcmV0dXJuIHBkX2I7XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBidXQgcmVuZGVyMiBleHBlY3RzOlxuICAgICAqIGBgYFxuICAgICAqIHJldHVybiBjdHguZG9Tb21ldGhpbmcoJGV2ZW50KTtcbiAgICAgKiBgYGBcbiAgICAgKi9cbiAgICAvLyBUT0RPKG1pc2tvKTogcmVtb3ZlIHRoaXMgaGFjayBvbmNlIHdlIG5vIGxvbmdlciBzdXBwb3J0IFZpZXdFbmdpbmUuXG4gICAgdGhpcy5yZW5kZXIzU3RtdHMgPSBzdG10cy5tYXAoKHN0YXRlbWVudDogby5TdGF0ZW1lbnQpID0+IHtcbiAgICAgIGlmIChzdGF0ZW1lbnQgaW5zdGFuY2VvZiBvLkRlY2xhcmVWYXJTdG10ICYmIHN0YXRlbWVudC5uYW1lID09IGFsbG93RGVmYXVsdC5uYW1lICYmXG4gICAgICAgICAgc3RhdGVtZW50LnZhbHVlIGluc3RhbmNlb2Ygby5CaW5hcnlPcGVyYXRvckV4cHIpIHtcbiAgICAgICAgY29uc3QgbGhzID0gc3RhdGVtZW50LnZhbHVlLmxocyBhcyBvLkNhc3RFeHByO1xuICAgICAgICByZXR1cm4gbmV3IG8uUmV0dXJuU3RhdGVtZW50KGxocy52YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RhdGVtZW50O1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIEludGVycG9sYXRpb25GdW5jdGlvbiA9IChhcmdzOiBvLkV4cHJlc3Npb25bXSkgPT4gby5FeHByZXNzaW9uO1xuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBnaXZlbiBleHByZXNzaW9uIEFTVCBpbnRvIGFuIGV4ZWN1dGFibGUgb3V0cHV0IEFTVCwgYXNzdW1pbmcgdGhlIGV4cHJlc3Npb24gaXNcbiAqIHVzZWQgaW4gYW4gYWN0aW9uIGJpbmRpbmcgKGUuZy4gYW4gZXZlbnQgaGFuZGxlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0QWN0aW9uQmluZGluZyhcbiAgICBsb2NhbFJlc29sdmVyOiBMb2NhbFJlc29sdmVyIHwgbnVsbCwgaW1wbGljaXRSZWNlaXZlcjogby5FeHByZXNzaW9uLCBhY3Rpb246IGNkQXN0LkFTVCxcbiAgICBiaW5kaW5nSWQ6IHN0cmluZywgaW50ZXJwb2xhdGlvbkZ1bmN0aW9uPzogSW50ZXJwb2xhdGlvbkZ1bmN0aW9uKTogQ29udmVydEFjdGlvbkJpbmRpbmdSZXN1bHQge1xuICBpZiAoIWxvY2FsUmVzb2x2ZXIpIHtcbiAgICBsb2NhbFJlc29sdmVyID0gbmV3IERlZmF1bHRMb2NhbFJlc29sdmVyKCk7XG4gIH1cbiAgY29uc3QgYWN0aW9uV2l0aG91dEJ1aWx0aW5zID0gY29udmVydFByb3BlcnR5QmluZGluZ0J1aWx0aW5zKFxuICAgICAge1xuICAgICAgICBjcmVhdGVMaXRlcmFsQXJyYXlDb252ZXJ0ZXI6IChhcmdDb3VudDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgLy8gTm90ZTogbm8gY2FjaGluZyBmb3IgbGl0ZXJhbCBhcnJheXMgaW4gYWN0aW9ucy5cbiAgICAgICAgICByZXR1cm4gKGFyZ3M6IG8uRXhwcmVzc2lvbltdKSA9PiBvLmxpdGVyYWxBcnIoYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZUxpdGVyYWxNYXBDb252ZXJ0ZXI6IChrZXlzOiB7a2V5OiBzdHJpbmcsIHF1b3RlZDogYm9vbGVhbn1bXSkgPT4ge1xuICAgICAgICAgIC8vIE5vdGU6IG5vIGNhY2hpbmcgZm9yIGxpdGVyYWwgbWFwcyBpbiBhY3Rpb25zLlxuICAgICAgICAgIHJldHVybiAodmFsdWVzOiBvLkV4cHJlc3Npb25bXSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW50cmllcyA9IGtleXMubWFwKChrLCBpKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBrLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdW90ZWQ6IGsucXVvdGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHJldHVybiBvLmxpdGVyYWxNYXAoZW50cmllcyk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlUGlwZUNvbnZlcnRlcjogKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSWxsZWdhbCBTdGF0ZTogQWN0aW9ucyBhcmUgbm90IGFsbG93ZWQgdG8gY29udGFpbiBwaXBlcy4gUGlwZTogJHtuYW1lfWApO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYWN0aW9uKTtcblxuICBjb25zdCB2aXNpdG9yID1cbiAgICAgIG5ldyBfQXN0VG9JclZpc2l0b3IobG9jYWxSZXNvbHZlciwgaW1wbGljaXRSZWNlaXZlciwgYmluZGluZ0lkLCBpbnRlcnBvbGF0aW9uRnVuY3Rpb24pO1xuICBjb25zdCBhY3Rpb25TdG10czogby5TdGF0ZW1lbnRbXSA9IFtdO1xuICBmbGF0dGVuU3RhdGVtZW50cyhhY3Rpb25XaXRob3V0QnVpbHRpbnMudmlzaXQodmlzaXRvciwgX01vZGUuU3RhdGVtZW50KSwgYWN0aW9uU3RtdHMpO1xuICBwcmVwZW5kVGVtcG9yYXJ5RGVjbHModmlzaXRvci50ZW1wb3JhcnlDb3VudCwgYmluZGluZ0lkLCBhY3Rpb25TdG10cyk7XG4gIGNvbnN0IGxhc3RJbmRleCA9IGFjdGlvblN0bXRzLmxlbmd0aCAtIDE7XG4gIGxldCBwcmV2ZW50RGVmYXVsdFZhcjogby5SZWFkVmFyRXhwciA9IG51bGwgITtcbiAgaWYgKGxhc3RJbmRleCA+PSAwKSB7XG4gICAgY29uc3QgbGFzdFN0YXRlbWVudCA9IGFjdGlvblN0bXRzW2xhc3RJbmRleF07XG4gICAgY29uc3QgcmV0dXJuRXhwciA9IGNvbnZlcnRTdG10SW50b0V4cHJlc3Npb24obGFzdFN0YXRlbWVudCk7XG4gICAgaWYgKHJldHVybkV4cHIpIHtcbiAgICAgIC8vIE5vdGU6IFdlIG5lZWQgdG8gY2FzdCB0aGUgcmVzdWx0IG9mIHRoZSBtZXRob2QgY2FsbCB0byBkeW5hbWljLFxuICAgICAgLy8gYXMgaXQgbWlnaHQgYmUgYSB2b2lkIG1ldGhvZCFcbiAgICAgIHByZXZlbnREZWZhdWx0VmFyID0gY3JlYXRlUHJldmVudERlZmF1bHRWYXIoYmluZGluZ0lkKTtcbiAgICAgIGFjdGlvblN0bXRzW2xhc3RJbmRleF0gPVxuICAgICAgICAgIHByZXZlbnREZWZhdWx0VmFyLnNldChyZXR1cm5FeHByLmNhc3Qoby5EWU5BTUlDX1RZUEUpLm5vdElkZW50aWNhbChvLmxpdGVyYWwoZmFsc2UpKSlcbiAgICAgICAgICAgICAgLnRvRGVjbFN0bXQobnVsbCwgW28uU3RtdE1vZGlmaWVyLkZpbmFsXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBuZXcgQ29udmVydEFjdGlvbkJpbmRpbmdSZXN1bHQoYWN0aW9uU3RtdHMsIHByZXZlbnREZWZhdWx0VmFyKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCdWlsdGluQ29udmVydGVyIHsgKGFyZ3M6IG8uRXhwcmVzc2lvbltdKTogby5FeHByZXNzaW9uOyB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnVpbHRpbkNvbnZlcnRlckZhY3Rvcnkge1xuICBjcmVhdGVMaXRlcmFsQXJyYXlDb252ZXJ0ZXIoYXJnQ291bnQ6IG51bWJlcik6IEJ1aWx0aW5Db252ZXJ0ZXI7XG4gIGNyZWF0ZUxpdGVyYWxNYXBDb252ZXJ0ZXIoa2V5czoge2tleTogc3RyaW5nLCBxdW90ZWQ6IGJvb2xlYW59W10pOiBCdWlsdGluQ29udmVydGVyO1xuICBjcmVhdGVQaXBlQ29udmVydGVyKG5hbWU6IHN0cmluZywgYXJnQ291bnQ6IG51bWJlcik6IEJ1aWx0aW5Db252ZXJ0ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0UHJvcGVydHlCaW5kaW5nQnVpbHRpbnMoXG4gICAgY29udmVydGVyRmFjdG9yeTogQnVpbHRpbkNvbnZlcnRlckZhY3RvcnksIGFzdDogY2RBc3QuQVNUKTogY2RBc3QuQVNUIHtcbiAgcmV0dXJuIGNvbnZlcnRCdWlsdGlucyhjb252ZXJ0ZXJGYWN0b3J5LCBhc3QpO1xufVxuXG5leHBvcnQgY2xhc3MgQ29udmVydFByb3BlcnR5QmluZGluZ1Jlc3VsdCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBzdG10czogby5TdGF0ZW1lbnRbXSwgcHVibGljIGN1cnJWYWxFeHByOiBvLkV4cHJlc3Npb24pIHt9XG59XG5cbmV4cG9ydCBlbnVtIEJpbmRpbmdGb3JtIHtcbiAgLy8gVGhlIGdlbmVyYWwgZm9ybSBvZiBiaW5kaW5nIGV4cHJlc3Npb24sIHN1cHBvcnRzIGFsbCBleHByZXNzaW9ucy5cbiAgR2VuZXJhbCxcblxuICAvLyBUcnkgdG8gZ2VuZXJhdGUgYSBzaW1wbGUgYmluZGluZyAobm8gdGVtcG9yYXJpZXMgb3Igc3RhdGVtZW50cylcbiAgLy8gb3RoZXJ3aXNlIGdlbmVyYXRlIGEgZ2VuZXJhbCBiaW5kaW5nXG4gIFRyeVNpbXBsZSxcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiBBU1QgaW50byBhbiBleGVjdXRhYmxlIG91dHB1dCBBU1QsIGFzc3VtaW5nIHRoZSBleHByZXNzaW9uXG4gKiBpcyB1c2VkIGluIHByb3BlcnR5IGJpbmRpbmcuIFRoZSBleHByZXNzaW9uIGhhcyB0byBiZSBwcmVwcm9jZXNzZWQgdmlhXG4gKiBgY29udmVydFByb3BlcnR5QmluZGluZ0J1aWx0aW5zYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRQcm9wZXJ0eUJpbmRpbmcoXG4gICAgbG9jYWxSZXNvbHZlcjogTG9jYWxSZXNvbHZlciB8IG51bGwsIGltcGxpY2l0UmVjZWl2ZXI6IG8uRXhwcmVzc2lvbixcbiAgICBleHByZXNzaW9uV2l0aG91dEJ1aWx0aW5zOiBjZEFzdC5BU1QsIGJpbmRpbmdJZDogc3RyaW5nLCBmb3JtOiBCaW5kaW5nRm9ybSxcbiAgICBpbnRlcnBvbGF0aW9uRnVuY3Rpb24/OiBJbnRlcnBvbGF0aW9uRnVuY3Rpb24pOiBDb252ZXJ0UHJvcGVydHlCaW5kaW5nUmVzdWx0IHtcbiAgaWYgKCFsb2NhbFJlc29sdmVyKSB7XG4gICAgbG9jYWxSZXNvbHZlciA9IG5ldyBEZWZhdWx0TG9jYWxSZXNvbHZlcigpO1xuICB9XG4gIGNvbnN0IGN1cnJWYWxFeHByID0gY3JlYXRlQ3VyclZhbHVlRXhwcihiaW5kaW5nSWQpO1xuICBjb25zdCBzdG10czogby5TdGF0ZW1lbnRbXSA9IFtdO1xuICBjb25zdCB2aXNpdG9yID1cbiAgICAgIG5ldyBfQXN0VG9JclZpc2l0b3IobG9jYWxSZXNvbHZlciwgaW1wbGljaXRSZWNlaXZlciwgYmluZGluZ0lkLCBpbnRlcnBvbGF0aW9uRnVuY3Rpb24pO1xuICBjb25zdCBvdXRwdXRFeHByOiBvLkV4cHJlc3Npb24gPSBleHByZXNzaW9uV2l0aG91dEJ1aWx0aW5zLnZpc2l0KHZpc2l0b3IsIF9Nb2RlLkV4cHJlc3Npb24pO1xuXG4gIGlmICh2aXNpdG9yLnRlbXBvcmFyeUNvdW50KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aXNpdG9yLnRlbXBvcmFyeUNvdW50OyBpKyspIHtcbiAgICAgIHN0bXRzLnB1c2godGVtcG9yYXJ5RGVjbGFyYXRpb24oYmluZGluZ0lkLCBpKSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGZvcm0gPT0gQmluZGluZ0Zvcm0uVHJ5U2ltcGxlKSB7XG4gICAgcmV0dXJuIG5ldyBDb252ZXJ0UHJvcGVydHlCaW5kaW5nUmVzdWx0KFtdLCBvdXRwdXRFeHByKTtcbiAgfVxuXG4gIHN0bXRzLnB1c2goY3VyclZhbEV4cHIuc2V0KG91dHB1dEV4cHIpLnRvRGVjbFN0bXQoby5EWU5BTUlDX1RZUEUsIFtvLlN0bXRNb2RpZmllci5GaW5hbF0pKTtcbiAgcmV0dXJuIG5ldyBDb252ZXJ0UHJvcGVydHlCaW5kaW5nUmVzdWx0KHN0bXRzLCBjdXJyVmFsRXhwcik7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCdWlsdGlucyhjb252ZXJ0ZXJGYWN0b3J5OiBCdWlsdGluQ29udmVydGVyRmFjdG9yeSwgYXN0OiBjZEFzdC5BU1QpOiBjZEFzdC5BU1Qge1xuICBjb25zdCB2aXNpdG9yID0gbmV3IF9CdWlsdGluQXN0Q29udmVydGVyKGNvbnZlcnRlckZhY3RvcnkpO1xuICByZXR1cm4gYXN0LnZpc2l0KHZpc2l0b3IpO1xufVxuXG5mdW5jdGlvbiB0ZW1wb3JhcnlOYW1lKGJpbmRpbmdJZDogc3RyaW5nLCB0ZW1wb3JhcnlOdW1iZXI6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBgdG1wXyR7YmluZGluZ0lkfV8ke3RlbXBvcmFyeU51bWJlcn1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVtcG9yYXJ5RGVjbGFyYXRpb24oYmluZGluZ0lkOiBzdHJpbmcsIHRlbXBvcmFyeU51bWJlcjogbnVtYmVyKTogby5TdGF0ZW1lbnQge1xuICByZXR1cm4gbmV3IG8uRGVjbGFyZVZhclN0bXQodGVtcG9yYXJ5TmFtZShiaW5kaW5nSWQsIHRlbXBvcmFyeU51bWJlciksIG8uTlVMTF9FWFBSKTtcbn1cblxuZnVuY3Rpb24gcHJlcGVuZFRlbXBvcmFyeURlY2xzKFxuICAgIHRlbXBvcmFyeUNvdW50OiBudW1iZXIsIGJpbmRpbmdJZDogc3RyaW5nLCBzdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdKSB7XG4gIGZvciAobGV0IGkgPSB0ZW1wb3JhcnlDb3VudCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgc3RhdGVtZW50cy51bnNoaWZ0KHRlbXBvcmFyeURlY2xhcmF0aW9uKGJpbmRpbmdJZCwgaSkpO1xuICB9XG59XG5cbmVudW0gX01vZGUge1xuICBTdGF0ZW1lbnQsXG4gIEV4cHJlc3Npb25cbn1cblxuZnVuY3Rpb24gZW5zdXJlU3RhdGVtZW50TW9kZShtb2RlOiBfTW9kZSwgYXN0OiBjZEFzdC5BU1QpIHtcbiAgaWYgKG1vZGUgIT09IF9Nb2RlLlN0YXRlbWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYSBzdGF0ZW1lbnQsIGJ1dCBzYXcgJHthc3R9YCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZW5zdXJlRXhwcmVzc2lvbk1vZGUobW9kZTogX01vZGUsIGFzdDogY2RBc3QuQVNUKSB7XG4gIGlmIChtb2RlICE9PSBfTW9kZS5FeHByZXNzaW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhbiBleHByZXNzaW9uLCBidXQgc2F3ICR7YXN0fWApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKG1vZGU6IF9Nb2RlLCBleHByOiBvLkV4cHJlc3Npb24pOiBvLkV4cHJlc3Npb258by5TdGF0ZW1lbnQge1xuICBpZiAobW9kZSA9PT0gX01vZGUuU3RhdGVtZW50KSB7XG4gICAgcmV0dXJuIGV4cHIudG9TdG10KCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cbn1cblxuY2xhc3MgX0J1aWx0aW5Bc3RDb252ZXJ0ZXIgZXh0ZW5kcyBjZEFzdC5Bc3RUcmFuc2Zvcm1lciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2NvbnZlcnRlckZhY3Rvcnk6IEJ1aWx0aW5Db252ZXJ0ZXJGYWN0b3J5KSB7IHN1cGVyKCk7IH1cbiAgdmlzaXRQaXBlKGFzdDogY2RBc3QuQmluZGluZ1BpcGUsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgY29uc3QgYXJncyA9IFthc3QuZXhwLCAuLi5hc3QuYXJnc10ubWFwKGFzdCA9PiBhc3QudmlzaXQodGhpcywgY29udGV4dCkpO1xuICAgIHJldHVybiBuZXcgQnVpbHRpbkZ1bmN0aW9uQ2FsbChcbiAgICAgICAgYXN0LnNwYW4sIGFyZ3MsIHRoaXMuX2NvbnZlcnRlckZhY3RvcnkuY3JlYXRlUGlwZUNvbnZlcnRlcihhc3QubmFtZSwgYXJncy5sZW5ndGgpKTtcbiAgfVxuICB2aXNpdExpdGVyYWxBcnJheShhc3Q6IGNkQXN0LkxpdGVyYWxBcnJheSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICBjb25zdCBhcmdzID0gYXN0LmV4cHJlc3Npb25zLm1hcChhc3QgPT4gYXN0LnZpc2l0KHRoaXMsIGNvbnRleHQpKTtcbiAgICByZXR1cm4gbmV3IEJ1aWx0aW5GdW5jdGlvbkNhbGwoXG4gICAgICAgIGFzdC5zcGFuLCBhcmdzLCB0aGlzLl9jb252ZXJ0ZXJGYWN0b3J5LmNyZWF0ZUxpdGVyYWxBcnJheUNvbnZlcnRlcihhc3QuZXhwcmVzc2lvbnMubGVuZ3RoKSk7XG4gIH1cbiAgdmlzaXRMaXRlcmFsTWFwKGFzdDogY2RBc3QuTGl0ZXJhbE1hcCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICBjb25zdCBhcmdzID0gYXN0LnZhbHVlcy5tYXAoYXN0ID0+IGFzdC52aXNpdCh0aGlzLCBjb250ZXh0KSk7XG5cbiAgICByZXR1cm4gbmV3IEJ1aWx0aW5GdW5jdGlvbkNhbGwoXG4gICAgICAgIGFzdC5zcGFuLCBhcmdzLCB0aGlzLl9jb252ZXJ0ZXJGYWN0b3J5LmNyZWF0ZUxpdGVyYWxNYXBDb252ZXJ0ZXIoYXN0LmtleXMpKTtcbiAgfVxufVxuXG5jbGFzcyBfQXN0VG9JclZpc2l0b3IgaW1wbGVtZW50cyBjZEFzdC5Bc3RWaXNpdG9yIHtcbiAgcHJpdmF0ZSBfbm9kZU1hcCA9IG5ldyBNYXA8Y2RBc3QuQVNULCBjZEFzdC5BU1Q+KCk7XG4gIHByaXZhdGUgX3Jlc3VsdE1hcCA9IG5ldyBNYXA8Y2RBc3QuQVNULCBvLkV4cHJlc3Npb24+KCk7XG4gIHByaXZhdGUgX2N1cnJlbnRUZW1wb3Jhcnk6IG51bWJlciA9IDA7XG4gIHB1YmxpYyB0ZW1wb3JhcnlDb3VudDogbnVtYmVyID0gMDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2xvY2FsUmVzb2x2ZXI6IExvY2FsUmVzb2x2ZXIsIHByaXZhdGUgX2ltcGxpY2l0UmVjZWl2ZXI6IG8uRXhwcmVzc2lvbixcbiAgICAgIHByaXZhdGUgYmluZGluZ0lkOiBzdHJpbmcsIHByaXZhdGUgaW50ZXJwb2xhdGlvbkZ1bmN0aW9uOiBJbnRlcnBvbGF0aW9uRnVuY3Rpb258dW5kZWZpbmVkKSB7fVxuXG4gIHZpc2l0QmluYXJ5KGFzdDogY2RBc3QuQmluYXJ5LCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgbGV0IG9wOiBvLkJpbmFyeU9wZXJhdG9yO1xuICAgIHN3aXRjaCAoYXN0Lm9wZXJhdGlvbikge1xuICAgICAgY2FzZSAnKyc6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5QbHVzO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJy0nOlxuICAgICAgICBvcCA9IG8uQmluYXJ5T3BlcmF0b3IuTWludXM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnKic6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5NdWx0aXBseTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICcvJzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLkRpdmlkZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICclJzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLk1vZHVsbztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICcmJic6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5BbmQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnfHwnOlxuICAgICAgICBvcCA9IG8uQmluYXJ5T3BlcmF0b3IuT3I7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnPT0nOlxuICAgICAgICBvcCA9IG8uQmluYXJ5T3BlcmF0b3IuRXF1YWxzO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJyE9JzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLk5vdEVxdWFscztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICc9PT0nOlxuICAgICAgICBvcCA9IG8uQmluYXJ5T3BlcmF0b3IuSWRlbnRpY2FsO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJyE9PSc6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5Ob3RJZGVudGljYWw7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnPCc6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5Mb3dlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICc+JzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLkJpZ2dlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICc8PSc6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5Mb3dlckVxdWFscztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICc+PSc6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5CaWdnZXJFcXVhbHM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBvcGVyYXRpb24gJHthc3Qub3BlcmF0aW9ufWApO1xuICAgIH1cblxuICAgIHJldHVybiBjb252ZXJ0VG9TdGF0ZW1lbnRJZk5lZWRlZChcbiAgICAgICAgbW9kZSxcbiAgICAgICAgbmV3IG8uQmluYXJ5T3BlcmF0b3JFeHByKFxuICAgICAgICAgICAgb3AsIHRoaXMuX3Zpc2l0KGFzdC5sZWZ0LCBfTW9kZS5FeHByZXNzaW9uKSwgdGhpcy5fdmlzaXQoYXN0LnJpZ2h0LCBfTW9kZS5FeHByZXNzaW9uKSkpO1xuICB9XG5cbiAgdmlzaXRDaGFpbihhc3Q6IGNkQXN0LkNoYWluLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgZW5zdXJlU3RhdGVtZW50TW9kZShtb2RlLCBhc3QpO1xuICAgIHJldHVybiB0aGlzLnZpc2l0QWxsKGFzdC5leHByZXNzaW9ucywgbW9kZSk7XG4gIH1cblxuICB2aXNpdENvbmRpdGlvbmFsKGFzdDogY2RBc3QuQ29uZGl0aW9uYWwsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICBjb25zdCB2YWx1ZTogby5FeHByZXNzaW9uID0gdGhpcy5fdmlzaXQoYXN0LmNvbmRpdGlvbiwgX01vZGUuRXhwcmVzc2lvbik7XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKFxuICAgICAgICBtb2RlLCB2YWx1ZS5jb25kaXRpb25hbChcbiAgICAgICAgICAgICAgICAgIHRoaXMuX3Zpc2l0KGFzdC50cnVlRXhwLCBfTW9kZS5FeHByZXNzaW9uKSxcbiAgICAgICAgICAgICAgICAgIHRoaXMuX3Zpc2l0KGFzdC5mYWxzZUV4cCwgX01vZGUuRXhwcmVzc2lvbikpKTtcbiAgfVxuXG4gIHZpc2l0UGlwZShhc3Q6IGNkQXN0LkJpbmRpbmdQaXBlLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgSWxsZWdhbCBzdGF0ZTogUGlwZXMgc2hvdWxkIGhhdmUgYmVlbiBjb252ZXJ0ZWQgaW50byBmdW5jdGlvbnMuIFBpcGU6ICR7YXN0Lm5hbWV9YCk7XG4gIH1cblxuICB2aXNpdEZ1bmN0aW9uQ2FsbChhc3Q6IGNkQXN0LkZ1bmN0aW9uQ2FsbCwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIGNvbnN0IGNvbnZlcnRlZEFyZ3MgPSB0aGlzLnZpc2l0QWxsKGFzdC5hcmdzLCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICBsZXQgZm5SZXN1bHQ6IG8uRXhwcmVzc2lvbjtcbiAgICBpZiAoYXN0IGluc3RhbmNlb2YgQnVpbHRpbkZ1bmN0aW9uQ2FsbCkge1xuICAgICAgZm5SZXN1bHQgPSBhc3QuY29udmVydGVyKGNvbnZlcnRlZEFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmblJlc3VsdCA9IHRoaXMuX3Zpc2l0KGFzdC50YXJnZXQgISwgX01vZGUuRXhwcmVzc2lvbikuY2FsbEZuKGNvbnZlcnRlZEFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQobW9kZSwgZm5SZXN1bHQpO1xuICB9XG5cbiAgdmlzaXRJbXBsaWNpdFJlY2VpdmVyKGFzdDogY2RBc3QuSW1wbGljaXRSZWNlaXZlciwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIGVuc3VyZUV4cHJlc3Npb25Nb2RlKG1vZGUsIGFzdCk7XG4gICAgcmV0dXJuIHRoaXMuX2ltcGxpY2l0UmVjZWl2ZXI7XG4gIH1cblxuICB2aXNpdEludGVycG9sYXRpb24oYXN0OiBjZEFzdC5JbnRlcnBvbGF0aW9uLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgZW5zdXJlRXhwcmVzc2lvbk1vZGUobW9kZSwgYXN0KTtcbiAgICBjb25zdCBhcmdzID0gW28ubGl0ZXJhbChhc3QuZXhwcmVzc2lvbnMubGVuZ3RoKV07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhc3Quc3RyaW5ncy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGFyZ3MucHVzaChvLmxpdGVyYWwoYXN0LnN0cmluZ3NbaV0pKTtcbiAgICAgIGFyZ3MucHVzaCh0aGlzLl92aXNpdChhc3QuZXhwcmVzc2lvbnNbaV0sIF9Nb2RlLkV4cHJlc3Npb24pKTtcbiAgICB9XG4gICAgYXJncy5wdXNoKG8ubGl0ZXJhbChhc3Quc3RyaW5nc1thc3Quc3RyaW5ncy5sZW5ndGggLSAxXSkpO1xuXG4gICAgaWYgKHRoaXMuaW50ZXJwb2xhdGlvbkZ1bmN0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnRlcnBvbGF0aW9uRnVuY3Rpb24oYXJncyk7XG4gICAgfVxuICAgIHJldHVybiBhc3QuZXhwcmVzc2lvbnMubGVuZ3RoIDw9IDkgP1xuICAgICAgICBvLmltcG9ydEV4cHIoSWRlbnRpZmllcnMuaW5saW5lSW50ZXJwb2xhdGUpLmNhbGxGbihhcmdzKSA6XG4gICAgICAgIG8uaW1wb3J0RXhwcihJZGVudGlmaWVycy5pbnRlcnBvbGF0ZSkuY2FsbEZuKFthcmdzWzBdLCBvLmxpdGVyYWxBcnIoYXJncy5zbGljZSgxKSldKTtcbiAgfVxuXG4gIHZpc2l0S2V5ZWRSZWFkKGFzdDogY2RBc3QuS2V5ZWRSZWFkLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgY29uc3QgbGVmdE1vc3RTYWZlID0gdGhpcy5sZWZ0TW9zdFNhZmVOb2RlKGFzdCk7XG4gICAgaWYgKGxlZnRNb3N0U2FmZSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udmVydFNhZmVBY2Nlc3MoYXN0LCBsZWZ0TW9zdFNhZmUsIG1vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQoXG4gICAgICAgICAgbW9kZSwgdGhpcy5fdmlzaXQoYXN0Lm9iaiwgX01vZGUuRXhwcmVzc2lvbikua2V5KHRoaXMuX3Zpc2l0KGFzdC5rZXksIF9Nb2RlLkV4cHJlc3Npb24pKSk7XG4gICAgfVxuICB9XG5cbiAgdmlzaXRLZXllZFdyaXRlKGFzdDogY2RBc3QuS2V5ZWRXcml0ZSwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIGNvbnN0IG9iajogby5FeHByZXNzaW9uID0gdGhpcy5fdmlzaXQoYXN0Lm9iaiwgX01vZGUuRXhwcmVzc2lvbik7XG4gICAgY29uc3Qga2V5OiBvLkV4cHJlc3Npb24gPSB0aGlzLl92aXNpdChhc3Qua2V5LCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICBjb25zdCB2YWx1ZTogby5FeHByZXNzaW9uID0gdGhpcy5fdmlzaXQoYXN0LnZhbHVlLCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQobW9kZSwgb2JqLmtleShrZXkpLnNldCh2YWx1ZSkpO1xuICB9XG5cbiAgdmlzaXRMaXRlcmFsQXJyYXkoYXN0OiBjZEFzdC5MaXRlcmFsQXJyYXksIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYElsbGVnYWwgU3RhdGU6IGxpdGVyYWwgYXJyYXlzIHNob3VsZCBoYXZlIGJlZW4gY29udmVydGVkIGludG8gZnVuY3Rpb25zYCk7XG4gIH1cblxuICB2aXNpdExpdGVyYWxNYXAoYXN0OiBjZEFzdC5MaXRlcmFsTWFwLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbGxlZ2FsIFN0YXRlOiBsaXRlcmFsIG1hcHMgc2hvdWxkIGhhdmUgYmVlbiBjb252ZXJ0ZWQgaW50byBmdW5jdGlvbnNgKTtcbiAgfVxuXG4gIHZpc2l0TGl0ZXJhbFByaW1pdGl2ZShhc3Q6IGNkQXN0LkxpdGVyYWxQcmltaXRpdmUsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICAvLyBGb3IgbGl0ZXJhbCB2YWx1ZXMgb2YgbnVsbCwgdW5kZWZpbmVkLCB0cnVlLCBvciBmYWxzZSBhbGxvdyB0eXBlIGludGVyZmVyZW5jZVxuICAgIC8vIHRvIGluZmVyIHRoZSB0eXBlLlxuICAgIGNvbnN0IHR5cGUgPVxuICAgICAgICBhc3QudmFsdWUgPT09IG51bGwgfHwgYXN0LnZhbHVlID09PSB1bmRlZmluZWQgfHwgYXN0LnZhbHVlID09PSB0cnVlIHx8IGFzdC52YWx1ZSA9PT0gdHJ1ZSA/XG4gICAgICAgIG8uSU5GRVJSRURfVFlQRSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQobW9kZSwgby5saXRlcmFsKGFzdC52YWx1ZSwgdHlwZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0TG9jYWwobmFtZTogc3RyaW5nKTogby5FeHByZXNzaW9ufG51bGwgeyByZXR1cm4gdGhpcy5fbG9jYWxSZXNvbHZlci5nZXRMb2NhbChuYW1lKTsgfVxuXG4gIHZpc2l0TWV0aG9kQ2FsbChhc3Q6IGNkQXN0Lk1ldGhvZENhbGwsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICBpZiAoYXN0LnJlY2VpdmVyIGluc3RhbmNlb2YgY2RBc3QuSW1wbGljaXRSZWNlaXZlciAmJiBhc3QubmFtZSA9PSAnJGFueScpIHtcbiAgICAgIGNvbnN0IGFyZ3MgPSB0aGlzLnZpc2l0QWxsKGFzdC5hcmdzLCBfTW9kZS5FeHByZXNzaW9uKSBhcyBhbnlbXTtcbiAgICAgIGlmIChhcmdzLmxlbmd0aCAhPSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBJbnZhbGlkIGNhbGwgdG8gJGFueSwgZXhwZWN0ZWQgMSBhcmd1bWVudCBidXQgcmVjZWl2ZWQgJHthcmdzLmxlbmd0aCB8fCAnbm9uZSd9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gKGFyZ3NbMF0gYXMgby5FeHByZXNzaW9uKS5jYXN0KG8uRFlOQU1JQ19UWVBFKTtcbiAgICB9XG5cbiAgICBjb25zdCBsZWZ0TW9zdFNhZmUgPSB0aGlzLmxlZnRNb3N0U2FmZU5vZGUoYXN0KTtcbiAgICBpZiAobGVmdE1vc3RTYWZlKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb252ZXJ0U2FmZUFjY2Vzcyhhc3QsIGxlZnRNb3N0U2FmZSwgbW9kZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGFyZ3MgPSB0aGlzLnZpc2l0QWxsKGFzdC5hcmdzLCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICAgIGxldCByZXN1bHQ6IGFueSA9IG51bGw7XG4gICAgICBjb25zdCByZWNlaXZlciA9IHRoaXMuX3Zpc2l0KGFzdC5yZWNlaXZlciwgX01vZGUuRXhwcmVzc2lvbik7XG4gICAgICBpZiAocmVjZWl2ZXIgPT09IHRoaXMuX2ltcGxpY2l0UmVjZWl2ZXIpIHtcbiAgICAgICAgY29uc3QgdmFyRXhwciA9IHRoaXMuX2dldExvY2FsKGFzdC5uYW1lKTtcbiAgICAgICAgaWYgKHZhckV4cHIpIHtcbiAgICAgICAgICByZXN1bHQgPSB2YXJFeHByLmNhbGxGbihhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHJlc3VsdCA9PSBudWxsKSB7XG4gICAgICAgIHJlc3VsdCA9IHJlY2VpdmVyLmNhbGxNZXRob2QoYXN0Lm5hbWUsIGFyZ3MpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKG1vZGUsIHJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgdmlzaXRQcmVmaXhOb3QoYXN0OiBjZEFzdC5QcmVmaXhOb3QsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQobW9kZSwgby5ub3QodGhpcy5fdmlzaXQoYXN0LmV4cHJlc3Npb24sIF9Nb2RlLkV4cHJlc3Npb24pKSk7XG4gIH1cblxuICB2aXNpdE5vbk51bGxBc3NlcnQoYXN0OiBjZEFzdC5Ob25OdWxsQXNzZXJ0LCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKFxuICAgICAgICBtb2RlLCBvLmFzc2VydE5vdE51bGwodGhpcy5fdmlzaXQoYXN0LmV4cHJlc3Npb24sIF9Nb2RlLkV4cHJlc3Npb24pKSk7XG4gIH1cblxuICB2aXNpdFByb3BlcnR5UmVhZChhc3Q6IGNkQXN0LlByb3BlcnR5UmVhZCwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIGNvbnN0IGxlZnRNb3N0U2FmZSA9IHRoaXMubGVmdE1vc3RTYWZlTm9kZShhc3QpO1xuICAgIGlmIChsZWZ0TW9zdFNhZmUpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRTYWZlQWNjZXNzKGFzdCwgbGVmdE1vc3RTYWZlLCBtb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHJlc3VsdDogYW55ID0gbnVsbDtcbiAgICAgIGNvbnN0IHJlY2VpdmVyID0gdGhpcy5fdmlzaXQoYXN0LnJlY2VpdmVyLCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICAgIGlmIChyZWNlaXZlciA9PT0gdGhpcy5faW1wbGljaXRSZWNlaXZlcikge1xuICAgICAgICByZXN1bHQgPSB0aGlzLl9nZXRMb2NhbChhc3QubmFtZSk7XG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0ID09IG51bGwpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVjZWl2ZXIucHJvcChhc3QubmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQobW9kZSwgcmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICB2aXNpdFByb3BlcnR5V3JpdGUoYXN0OiBjZEFzdC5Qcm9wZXJ0eVdyaXRlLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgY29uc3QgcmVjZWl2ZXI6IG8uRXhwcmVzc2lvbiA9IHRoaXMuX3Zpc2l0KGFzdC5yZWNlaXZlciwgX01vZGUuRXhwcmVzc2lvbik7XG5cbiAgICBsZXQgdmFyRXhwcjogby5SZWFkUHJvcEV4cHJ8bnVsbCA9IG51bGw7XG4gICAgaWYgKHJlY2VpdmVyID09PSB0aGlzLl9pbXBsaWNpdFJlY2VpdmVyKSB7XG4gICAgICBjb25zdCBsb2NhbEV4cHIgPSB0aGlzLl9nZXRMb2NhbChhc3QubmFtZSk7XG4gICAgICBpZiAobG9jYWxFeHByKSB7XG4gICAgICAgIGlmIChsb2NhbEV4cHIgaW5zdGFuY2VvZiBvLlJlYWRQcm9wRXhwcikge1xuICAgICAgICAgIC8vIElmIHRoZSBsb2NhbCB2YXJpYWJsZSBpcyBhIHByb3BlcnR5IHJlYWQgZXhwcmVzc2lvbiwgaXQncyBhIHJlZmVyZW5jZVxuICAgICAgICAgIC8vIHRvIGEgJ2NvbnRleHQucHJvcGVydHknIHZhbHVlIGFuZCB3aWxsIGJlIHVzZWQgYXMgdGhlIHRhcmdldCBvZiB0aGVcbiAgICAgICAgICAvLyB3cml0ZSBleHByZXNzaW9uLlxuICAgICAgICAgIHZhckV4cHIgPSBsb2NhbEV4cHI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gT3RoZXJ3aXNlIGl0J3MgYW4gZXJyb3IuXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgYXNzaWduIHRvIGEgcmVmZXJlbmNlIG9yIHZhcmlhYmxlIScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIElmIG5vIGxvY2FsIGV4cHJlc3Npb24gY291bGQgYmUgcHJvZHVjZWQsIHVzZSB0aGUgb3JpZ2luYWwgcmVjZWl2ZXInc1xuICAgIC8vIHByb3BlcnR5IGFzIHRoZSB0YXJnZXQuXG4gICAgaWYgKHZhckV4cHIgPT09IG51bGwpIHtcbiAgICAgIHZhckV4cHIgPSByZWNlaXZlci5wcm9wKGFzdC5uYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKG1vZGUsIHZhckV4cHIuc2V0KHRoaXMuX3Zpc2l0KGFzdC52YWx1ZSwgX01vZGUuRXhwcmVzc2lvbikpKTtcbiAgfVxuXG4gIHZpc2l0U2FmZVByb3BlcnR5UmVhZChhc3Q6IGNkQXN0LlNhZmVQcm9wZXJ0eVJlYWQsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5jb252ZXJ0U2FmZUFjY2Vzcyhhc3QsIHRoaXMubGVmdE1vc3RTYWZlTm9kZShhc3QpLCBtb2RlKTtcbiAgfVxuXG4gIHZpc2l0U2FmZU1ldGhvZENhbGwoYXN0OiBjZEFzdC5TYWZlTWV0aG9kQ2FsbCwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmNvbnZlcnRTYWZlQWNjZXNzKGFzdCwgdGhpcy5sZWZ0TW9zdFNhZmVOb2RlKGFzdCksIG1vZGUpO1xuICB9XG5cbiAgdmlzaXRBbGwoYXN0czogY2RBc3QuQVNUW10sIG1vZGU6IF9Nb2RlKTogYW55IHsgcmV0dXJuIGFzdHMubWFwKGFzdCA9PiB0aGlzLl92aXNpdChhc3QsIG1vZGUpKTsgfVxuXG4gIHZpc2l0UXVvdGUoYXN0OiBjZEFzdC5RdW90ZSwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIHRocm93IG5ldyBFcnJvcihgUXVvdGVzIGFyZSBub3Qgc3VwcG9ydGVkIGZvciBldmFsdWF0aW9uIVxuICAgICAgICBTdGF0ZW1lbnQ6ICR7YXN0LnVuaW50ZXJwcmV0ZWRFeHByZXNzaW9ufSBsb2NhdGVkIGF0ICR7YXN0LmxvY2F0aW9ufWApO1xuICB9XG5cbiAgcHJpdmF0ZSBfdmlzaXQoYXN0OiBjZEFzdC5BU1QsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9yZXN1bHRNYXAuZ2V0KGFzdCk7XG4gICAgaWYgKHJlc3VsdCkgcmV0dXJuIHJlc3VsdDtcbiAgICByZXR1cm4gKHRoaXMuX25vZGVNYXAuZ2V0KGFzdCkgfHwgYXN0KS52aXNpdCh0aGlzLCBtb2RlKTtcbiAgfVxuXG4gIHByaXZhdGUgY29udmVydFNhZmVBY2Nlc3MoXG4gICAgICBhc3Q6IGNkQXN0LkFTVCwgbGVmdE1vc3RTYWZlOiBjZEFzdC5TYWZlTWV0aG9kQ2FsbHxjZEFzdC5TYWZlUHJvcGVydHlSZWFkLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgLy8gSWYgdGhlIGV4cHJlc3Npb24gY29udGFpbnMgYSBzYWZlIGFjY2VzcyBub2RlIG9uIHRoZSBsZWZ0IGl0IG5lZWRzIHRvIGJlIGNvbnZlcnRlZCB0b1xuICAgIC8vIGFuIGV4cHJlc3Npb24gdGhhdCBndWFyZHMgdGhlIGFjY2VzcyB0byB0aGUgbWVtYmVyIGJ5IGNoZWNraW5nIHRoZSByZWNlaXZlciBmb3IgYmxhbmsuIEFzXG4gICAgLy8gZXhlY3V0aW9uIHByb2NlZWRzIGZyb20gbGVmdCB0byByaWdodCwgdGhlIGxlZnQgbW9zdCBwYXJ0IG9mIHRoZSBleHByZXNzaW9uIG11c3QgYmUgZ3VhcmRlZFxuICAgIC8vIGZpcnN0IGJ1dCwgYmVjYXVzZSBtZW1iZXIgYWNjZXNzIGlzIGxlZnQgYXNzb2NpYXRpdmUsIHRoZSByaWdodCBzaWRlIG9mIHRoZSBleHByZXNzaW9uIGlzIGF0XG4gICAgLy8gdGhlIHRvcCBvZiB0aGUgQVNULiBUaGUgZGVzaXJlZCByZXN1bHQgcmVxdWlyZXMgbGlmdGluZyBhIGNvcHkgb2YgdGhlIHRoZSBsZWZ0IHBhcnQgb2YgdGhlXG4gICAgLy8gZXhwcmVzc2lvbiB1cCB0byB0ZXN0IGl0IGZvciBibGFuayBiZWZvcmUgZ2VuZXJhdGluZyB0aGUgdW5ndWFyZGVkIHZlcnNpb24uXG5cbiAgICAvLyBDb25zaWRlciwgZm9yIGV4YW1wbGUgdGhlIGZvbGxvd2luZyBleHByZXNzaW9uOiBhPy5iLmM/LmQuZVxuXG4gICAgLy8gVGhpcyByZXN1bHRzIGluIHRoZSBhc3Q6XG4gICAgLy8gICAgICAgICAuXG4gICAgLy8gICAgICAgIC8gXFxcbiAgICAvLyAgICAgICA/LiAgIGVcbiAgICAvLyAgICAgIC8gIFxcXG4gICAgLy8gICAgIC4gICAgZFxuICAgIC8vICAgIC8gXFxcbiAgICAvLyAgID8uICBjXG4gICAgLy8gIC8gIFxcXG4gICAgLy8gYSAgICBiXG5cbiAgICAvLyBUaGUgZm9sbG93aW5nIHRyZWUgc2hvdWxkIGJlIGdlbmVyYXRlZDpcbiAgICAvL1xuICAgIC8vICAgICAgICAvLS0tLSA/IC0tLS1cXFxuICAgIC8vICAgICAgIC8gICAgICB8ICAgICAgXFxcbiAgICAvLyAgICAgYSAgIC8tLS0gPyAtLS1cXCAgbnVsbFxuICAgIC8vICAgICAgICAvICAgICB8ICAgICBcXFxuICAgIC8vICAgICAgIC4gICAgICAuICAgICBudWxsXG4gICAgLy8gICAgICAvIFxcICAgIC8gXFxcbiAgICAvLyAgICAgLiAgYyAgIC4gICBlXG4gICAgLy8gICAgLyBcXCAgICAvIFxcXG4gICAgLy8gICBhICAgYiAgLCAgIGRcbiAgICAvLyAgICAgICAgIC8gXFxcbiAgICAvLyAgICAgICAgLiAgIGNcbiAgICAvLyAgICAgICAvIFxcXG4gICAgLy8gICAgICBhICAgYlxuICAgIC8vXG4gICAgLy8gTm90aWNlIHRoYXQgdGhlIGZpcnN0IGd1YXJkIGNvbmRpdGlvbiBpcyB0aGUgbGVmdCBoYW5kIG9mIHRoZSBsZWZ0IG1vc3Qgc2FmZSBhY2Nlc3Mgbm9kZVxuICAgIC8vIHdoaWNoIGNvbWVzIGluIGFzIGxlZnRNb3N0U2FmZSB0byB0aGlzIHJvdXRpbmUuXG5cbiAgICBsZXQgZ3VhcmRlZEV4cHJlc3Npb24gPSB0aGlzLl92aXNpdChsZWZ0TW9zdFNhZmUucmVjZWl2ZXIsIF9Nb2RlLkV4cHJlc3Npb24pO1xuICAgIGxldCB0ZW1wb3Jhcnk6IG8uUmVhZFZhckV4cHIgPSB1bmRlZmluZWQgITtcbiAgICBpZiAodGhpcy5uZWVkc1RlbXBvcmFyeShsZWZ0TW9zdFNhZmUucmVjZWl2ZXIpKSB7XG4gICAgICAvLyBJZiB0aGUgZXhwcmVzc2lvbiBoYXMgbWV0aG9kIGNhbGxzIG9yIHBpcGVzIHRoZW4gd2UgbmVlZCB0byBzYXZlIHRoZSByZXN1bHQgaW50byBhXG4gICAgICAvLyB0ZW1wb3JhcnkgdmFyaWFibGUgdG8gYXZvaWQgY2FsbGluZyBzdGF0ZWZ1bCBvciBpbXB1cmUgY29kZSBtb3JlIHRoYW4gb25jZS5cbiAgICAgIHRlbXBvcmFyeSA9IHRoaXMuYWxsb2NhdGVUZW1wb3JhcnkoKTtcblxuICAgICAgLy8gUHJlc2VydmUgdGhlIHJlc3VsdCBpbiB0aGUgdGVtcG9yYXJ5IHZhcmlhYmxlXG4gICAgICBndWFyZGVkRXhwcmVzc2lvbiA9IHRlbXBvcmFyeS5zZXQoZ3VhcmRlZEV4cHJlc3Npb24pO1xuXG4gICAgICAvLyBFbnN1cmUgYWxsIGZ1cnRoZXIgcmVmZXJlbmNlcyB0byB0aGUgZ3VhcmRlZCBleHByZXNzaW9uIHJlZmVyIHRvIHRoZSB0ZW1wb3JhcnkgaW5zdGVhZC5cbiAgICAgIHRoaXMuX3Jlc3VsdE1hcC5zZXQobGVmdE1vc3RTYWZlLnJlY2VpdmVyLCB0ZW1wb3JhcnkpO1xuICAgIH1cbiAgICBjb25zdCBjb25kaXRpb24gPSBndWFyZGVkRXhwcmVzc2lvbi5pc0JsYW5rKCk7XG5cbiAgICAvLyBDb252ZXJ0IHRoZSBhc3QgdG8gYW4gdW5ndWFyZGVkIGFjY2VzcyB0byB0aGUgcmVjZWl2ZXIncyBtZW1iZXIuIFRoZSBtYXAgd2lsbCBzdWJzdGl0dXRlXG4gICAgLy8gbGVmdE1vc3ROb2RlIHdpdGggaXRzIHVuZ3VhcmRlZCB2ZXJzaW9uIGluIHRoZSBjYWxsIHRvIGB0aGlzLnZpc2l0KClgLlxuICAgIGlmIChsZWZ0TW9zdFNhZmUgaW5zdGFuY2VvZiBjZEFzdC5TYWZlTWV0aG9kQ2FsbCkge1xuICAgICAgdGhpcy5fbm9kZU1hcC5zZXQoXG4gICAgICAgICAgbGVmdE1vc3RTYWZlLFxuICAgICAgICAgIG5ldyBjZEFzdC5NZXRob2RDYWxsKFxuICAgICAgICAgICAgICBsZWZ0TW9zdFNhZmUuc3BhbiwgbGVmdE1vc3RTYWZlLnJlY2VpdmVyLCBsZWZ0TW9zdFNhZmUubmFtZSwgbGVmdE1vc3RTYWZlLmFyZ3MpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbm9kZU1hcC5zZXQoXG4gICAgICAgICAgbGVmdE1vc3RTYWZlLFxuICAgICAgICAgIG5ldyBjZEFzdC5Qcm9wZXJ0eVJlYWQobGVmdE1vc3RTYWZlLnNwYW4sIGxlZnRNb3N0U2FmZS5yZWNlaXZlciwgbGVmdE1vc3RTYWZlLm5hbWUpKTtcbiAgICB9XG5cbiAgICAvLyBSZWN1cnNpdmVseSBjb252ZXJ0IHRoZSBub2RlIG5vdyB3aXRob3V0IHRoZSBndWFyZGVkIG1lbWJlciBhY2Nlc3MuXG4gICAgY29uc3QgYWNjZXNzID0gdGhpcy5fdmlzaXQoYXN0LCBfTW9kZS5FeHByZXNzaW9uKTtcblxuICAgIC8vIFJlbW92ZSB0aGUgbWFwcGluZy4gVGhpcyBpcyBub3Qgc3RyaWN0bHkgcmVxdWlyZWQgYXMgdGhlIGNvbnZlcnRlciBvbmx5IHRyYXZlcnNlcyBlYWNoIG5vZGVcbiAgICAvLyBvbmNlIGJ1dCBpcyBzYWZlciBpZiB0aGUgY29udmVyc2lvbiBpcyBjaGFuZ2VkIHRvIHRyYXZlcnNlIHRoZSBub2RlcyBtb3JlIHRoYW4gb25jZS5cbiAgICB0aGlzLl9ub2RlTWFwLmRlbGV0ZShsZWZ0TW9zdFNhZmUpO1xuXG4gICAgLy8gSWYgd2UgYWxsb2NhdGVkIGEgdGVtcG9yYXJ5LCByZWxlYXNlIGl0LlxuICAgIGlmICh0ZW1wb3JhcnkpIHtcbiAgICAgIHRoaXMucmVsZWFzZVRlbXBvcmFyeSh0ZW1wb3JhcnkpO1xuICAgIH1cblxuICAgIC8vIFByb2R1Y2UgdGhlIGNvbmRpdGlvbmFsXG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKG1vZGUsIGNvbmRpdGlvbi5jb25kaXRpb25hbChvLmxpdGVyYWwobnVsbCksIGFjY2VzcykpO1xuICB9XG5cbiAgLy8gR2l2ZW4gYSBleHByZXNzaW9uIG9mIHRoZSBmb3JtIGE/LmIuYz8uZC5lIHRoZSB0aGUgbGVmdCBtb3N0IHNhZmUgbm9kZSBpc1xuICAvLyB0aGUgKGE/LmIpLiBUaGUgLiBhbmQgPy4gYXJlIGxlZnQgYXNzb2NpYXRpdmUgdGh1cyBjYW4gYmUgcmV3cml0dGVuIGFzOlxuICAvLyAoKCgoYT8uYykuYikuYyk/LmQpLmUuIFRoaXMgcmV0dXJucyB0aGUgbW9zdCBkZWVwbHkgbmVzdGVkIHNhZmUgcmVhZCBvclxuICAvLyBzYWZlIG1ldGhvZCBjYWxsIGFzIHRoaXMgbmVlZHMgYmUgdHJhbnNmb3JtIGluaXRpYWxseSB0bzpcbiAgLy8gICBhID09IG51bGwgPyBudWxsIDogYS5jLmIuYz8uZC5lXG4gIC8vIHRoZW4gdG86XG4gIC8vICAgYSA9PSBudWxsID8gbnVsbCA6IGEuYi5jID09IG51bGwgPyBudWxsIDogYS5iLmMuZC5lXG4gIHByaXZhdGUgbGVmdE1vc3RTYWZlTm9kZShhc3Q6IGNkQXN0LkFTVCk6IGNkQXN0LlNhZmVQcm9wZXJ0eVJlYWR8Y2RBc3QuU2FmZU1ldGhvZENhbGwge1xuICAgIGNvbnN0IHZpc2l0ID0gKHZpc2l0b3I6IGNkQXN0LkFzdFZpc2l0b3IsIGFzdDogY2RBc3QuQVNUKTogYW55ID0+IHtcbiAgICAgIHJldHVybiAodGhpcy5fbm9kZU1hcC5nZXQoYXN0KSB8fCBhc3QpLnZpc2l0KHZpc2l0b3IpO1xuICAgIH07XG4gICAgcmV0dXJuIGFzdC52aXNpdCh7XG4gICAgICB2aXNpdEJpbmFyeShhc3Q6IGNkQXN0LkJpbmFyeSkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHZpc2l0Q2hhaW4oYXN0OiBjZEFzdC5DaGFpbikgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHZpc2l0Q29uZGl0aW9uYWwoYXN0OiBjZEFzdC5Db25kaXRpb25hbCkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHZpc2l0RnVuY3Rpb25DYWxsKGFzdDogY2RBc3QuRnVuY3Rpb25DYWxsKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgdmlzaXRJbXBsaWNpdFJlY2VpdmVyKGFzdDogY2RBc3QuSW1wbGljaXRSZWNlaXZlcikgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHZpc2l0SW50ZXJwb2xhdGlvbihhc3Q6IGNkQXN0LkludGVycG9sYXRpb24pIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICB2aXNpdEtleWVkUmVhZChhc3Q6IGNkQXN0LktleWVkUmVhZCkgeyByZXR1cm4gdmlzaXQodGhpcywgYXN0Lm9iaik7IH0sXG4gICAgICB2aXNpdEtleWVkV3JpdGUoYXN0OiBjZEFzdC5LZXllZFdyaXRlKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgdmlzaXRMaXRlcmFsQXJyYXkoYXN0OiBjZEFzdC5MaXRlcmFsQXJyYXkpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICB2aXNpdExpdGVyYWxNYXAoYXN0OiBjZEFzdC5MaXRlcmFsTWFwKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgdmlzaXRMaXRlcmFsUHJpbWl0aXZlKGFzdDogY2RBc3QuTGl0ZXJhbFByaW1pdGl2ZSkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHZpc2l0TWV0aG9kQ2FsbChhc3Q6IGNkQXN0Lk1ldGhvZENhbGwpIHsgcmV0dXJuIHZpc2l0KHRoaXMsIGFzdC5yZWNlaXZlcik7IH0sXG4gICAgICB2aXNpdFBpcGUoYXN0OiBjZEFzdC5CaW5kaW5nUGlwZSkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHZpc2l0UHJlZml4Tm90KGFzdDogY2RBc3QuUHJlZml4Tm90KSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgdmlzaXROb25OdWxsQXNzZXJ0KGFzdDogY2RBc3QuTm9uTnVsbEFzc2VydCkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHZpc2l0UHJvcGVydHlSZWFkKGFzdDogY2RBc3QuUHJvcGVydHlSZWFkKSB7IHJldHVybiB2aXNpdCh0aGlzLCBhc3QucmVjZWl2ZXIpOyB9LFxuICAgICAgdmlzaXRQcm9wZXJ0eVdyaXRlKGFzdDogY2RBc3QuUHJvcGVydHlXcml0ZSkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHZpc2l0UXVvdGUoYXN0OiBjZEFzdC5RdW90ZSkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHZpc2l0U2FmZU1ldGhvZENhbGwoYXN0OiBjZEFzdC5TYWZlTWV0aG9kQ2FsbCkgeyByZXR1cm4gdmlzaXQodGhpcywgYXN0LnJlY2VpdmVyKSB8fCBhc3Q7IH0sXG4gICAgICB2aXNpdFNhZmVQcm9wZXJ0eVJlYWQoYXN0OiBjZEFzdC5TYWZlUHJvcGVydHlSZWFkKSB7XG4gICAgICAgIHJldHVybiB2aXNpdCh0aGlzLCBhc3QucmVjZWl2ZXIpIHx8IGFzdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdHJ1ZSBvZiB0aGUgQVNUIGluY2x1ZGVzIGEgbWV0aG9kIG9yIGEgcGlwZSBpbmRpY2F0aW5nIHRoYXQsIGlmIHRoZVxuICAvLyBleHByZXNzaW9uIGlzIHVzZWQgYXMgdGhlIHRhcmdldCBvZiBhIHNhZmUgcHJvcGVydHkgb3IgbWV0aG9kIGFjY2VzcyB0aGVuXG4gIC8vIHRoZSBleHByZXNzaW9uIHNob3VsZCBiZSBzdG9yZWQgaW50byBhIHRlbXBvcmFyeSB2YXJpYWJsZS5cbiAgcHJpdmF0ZSBuZWVkc1RlbXBvcmFyeShhc3Q6IGNkQXN0LkFTVCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHZpc2l0ID0gKHZpc2l0b3I6IGNkQXN0LkFzdFZpc2l0b3IsIGFzdDogY2RBc3QuQVNUKTogYm9vbGVhbiA9PiB7XG4gICAgICByZXR1cm4gYXN0ICYmICh0aGlzLl9ub2RlTWFwLmdldChhc3QpIHx8IGFzdCkudmlzaXQodmlzaXRvcik7XG4gICAgfTtcbiAgICBjb25zdCB2aXNpdFNvbWUgPSAodmlzaXRvcjogY2RBc3QuQXN0VmlzaXRvciwgYXN0OiBjZEFzdC5BU1RbXSk6IGJvb2xlYW4gPT4ge1xuICAgICAgcmV0dXJuIGFzdC5zb21lKGFzdCA9PiB2aXNpdCh2aXNpdG9yLCBhc3QpKTtcbiAgICB9O1xuICAgIHJldHVybiBhc3QudmlzaXQoe1xuICAgICAgdmlzaXRCaW5hcnkoYXN0OiBjZEFzdC5CaW5hcnkpOlxuICAgICAgICAgIGJvb2xlYW57cmV0dXJuIHZpc2l0KHRoaXMsIGFzdC5sZWZ0KSB8fCB2aXNpdCh0aGlzLCBhc3QucmlnaHQpO30sXG4gICAgICB2aXNpdENoYWluKGFzdDogY2RBc3QuQ2hhaW4pIHsgcmV0dXJuIGZhbHNlOyB9LFxuICAgICAgdmlzaXRDb25kaXRpb25hbChhc3Q6IGNkQXN0LkNvbmRpdGlvbmFsKTpcbiAgICAgICAgICBib29sZWFue3JldHVybiB2aXNpdCh0aGlzLCBhc3QuY29uZGl0aW9uKSB8fCB2aXNpdCh0aGlzLCBhc3QudHJ1ZUV4cCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICB2aXNpdCh0aGlzLCBhc3QuZmFsc2VFeHApO30sXG4gICAgICB2aXNpdEZ1bmN0aW9uQ2FsbChhc3Q6IGNkQXN0LkZ1bmN0aW9uQ2FsbCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgIHZpc2l0SW1wbGljaXRSZWNlaXZlcihhc3Q6IGNkQXN0LkltcGxpY2l0UmVjZWl2ZXIpIHsgcmV0dXJuIGZhbHNlOyB9LFxuICAgICAgdmlzaXRJbnRlcnBvbGF0aW9uKGFzdDogY2RBc3QuSW50ZXJwb2xhdGlvbikgeyByZXR1cm4gdmlzaXRTb21lKHRoaXMsIGFzdC5leHByZXNzaW9ucyk7IH0sXG4gICAgICB2aXNpdEtleWVkUmVhZChhc3Q6IGNkQXN0LktleWVkUmVhZCkgeyByZXR1cm4gZmFsc2U7IH0sXG4gICAgICB2aXNpdEtleWVkV3JpdGUoYXN0OiBjZEFzdC5LZXllZFdyaXRlKSB7IHJldHVybiBmYWxzZTsgfSxcbiAgICAgIHZpc2l0TGl0ZXJhbEFycmF5KGFzdDogY2RBc3QuTGl0ZXJhbEFycmF5KSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgdmlzaXRMaXRlcmFsTWFwKGFzdDogY2RBc3QuTGl0ZXJhbE1hcCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgIHZpc2l0TGl0ZXJhbFByaW1pdGl2ZShhc3Q6IGNkQXN0LkxpdGVyYWxQcmltaXRpdmUpIHsgcmV0dXJuIGZhbHNlOyB9LFxuICAgICAgdmlzaXRNZXRob2RDYWxsKGFzdDogY2RBc3QuTWV0aG9kQ2FsbCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgIHZpc2l0UGlwZShhc3Q6IGNkQXN0LkJpbmRpbmdQaXBlKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgdmlzaXRQcmVmaXhOb3QoYXN0OiBjZEFzdC5QcmVmaXhOb3QpIHsgcmV0dXJuIHZpc2l0KHRoaXMsIGFzdC5leHByZXNzaW9uKTsgfSxcbiAgICAgIHZpc2l0Tm9uTnVsbEFzc2VydChhc3Q6IGNkQXN0LlByZWZpeE5vdCkgeyByZXR1cm4gdmlzaXQodGhpcywgYXN0LmV4cHJlc3Npb24pOyB9LFxuICAgICAgdmlzaXRQcm9wZXJ0eVJlYWQoYXN0OiBjZEFzdC5Qcm9wZXJ0eVJlYWQpIHsgcmV0dXJuIGZhbHNlOyB9LFxuICAgICAgdmlzaXRQcm9wZXJ0eVdyaXRlKGFzdDogY2RBc3QuUHJvcGVydHlXcml0ZSkgeyByZXR1cm4gZmFsc2U7IH0sXG4gICAgICB2aXNpdFF1b3RlKGFzdDogY2RBc3QuUXVvdGUpIHsgcmV0dXJuIGZhbHNlOyB9LFxuICAgICAgdmlzaXRTYWZlTWV0aG9kQ2FsbChhc3Q6IGNkQXN0LlNhZmVNZXRob2RDYWxsKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgdmlzaXRTYWZlUHJvcGVydHlSZWFkKGFzdDogY2RBc3QuU2FmZVByb3BlcnR5UmVhZCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYWxsb2NhdGVUZW1wb3JhcnkoKTogby5SZWFkVmFyRXhwciB7XG4gICAgY29uc3QgdGVtcE51bWJlciA9IHRoaXMuX2N1cnJlbnRUZW1wb3JhcnkrKztcbiAgICB0aGlzLnRlbXBvcmFyeUNvdW50ID0gTWF0aC5tYXgodGhpcy5fY3VycmVudFRlbXBvcmFyeSwgdGhpcy50ZW1wb3JhcnlDb3VudCk7XG4gICAgcmV0dXJuIG5ldyBvLlJlYWRWYXJFeHByKHRlbXBvcmFyeU5hbWUodGhpcy5iaW5kaW5nSWQsIHRlbXBOdW1iZXIpKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVsZWFzZVRlbXBvcmFyeSh0ZW1wb3Jhcnk6IG8uUmVhZFZhckV4cHIpIHtcbiAgICB0aGlzLl9jdXJyZW50VGVtcG9yYXJ5LS07XG4gICAgaWYgKHRlbXBvcmFyeS5uYW1lICE9IHRlbXBvcmFyeU5hbWUodGhpcy5iaW5kaW5nSWQsIHRoaXMuX2N1cnJlbnRUZW1wb3JhcnkpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFRlbXBvcmFyeSAke3RlbXBvcmFyeS5uYW1lfSByZWxlYXNlZCBvdXQgb2Ygb3JkZXJgKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZmxhdHRlblN0YXRlbWVudHMoYXJnOiBhbnksIG91dHB1dDogby5TdGF0ZW1lbnRbXSkge1xuICBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG4gICAgKDxhbnlbXT5hcmcpLmZvckVhY2goKGVudHJ5KSA9PiBmbGF0dGVuU3RhdGVtZW50cyhlbnRyeSwgb3V0cHV0KSk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0LnB1c2goYXJnKTtcbiAgfVxufVxuXG5jbGFzcyBEZWZhdWx0TG9jYWxSZXNvbHZlciBpbXBsZW1lbnRzIExvY2FsUmVzb2x2ZXIge1xuICBnZXRMb2NhbChuYW1lOiBzdHJpbmcpOiBvLkV4cHJlc3Npb258bnVsbCB7XG4gICAgaWYgKG5hbWUgPT09IEV2ZW50SGFuZGxlclZhcnMuZXZlbnQubmFtZSkge1xuICAgICAgcmV0dXJuIEV2ZW50SGFuZGxlclZhcnMuZXZlbnQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUN1cnJWYWx1ZUV4cHIoYmluZGluZ0lkOiBzdHJpbmcpOiBvLlJlYWRWYXJFeHByIHtcbiAgcmV0dXJuIG8udmFyaWFibGUoYGN1cnJWYWxfJHtiaW5kaW5nSWR9YCk7ICAvLyBmaXggc3ludGF4IGhpZ2hsaWdodGluZzogYFxufVxuXG5mdW5jdGlvbiBjcmVhdGVQcmV2ZW50RGVmYXVsdFZhcihiaW5kaW5nSWQ6IHN0cmluZyk6IG8uUmVhZFZhckV4cHIge1xuICByZXR1cm4gby52YXJpYWJsZShgcGRfJHtiaW5kaW5nSWR9YCk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTdG10SW50b0V4cHJlc3Npb24oc3RtdDogby5TdGF0ZW1lbnQpOiBvLkV4cHJlc3Npb258bnVsbCB7XG4gIGlmIChzdG10IGluc3RhbmNlb2Ygby5FeHByZXNzaW9uU3RhdGVtZW50KSB7XG4gICAgcmV0dXJuIHN0bXQuZXhwcjtcbiAgfSBlbHNlIGlmIChzdG10IGluc3RhbmNlb2Ygby5SZXR1cm5TdGF0ZW1lbnQpIHtcbiAgICByZXR1cm4gc3RtdC52YWx1ZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIEJ1aWx0aW5GdW5jdGlvbkNhbGwgZXh0ZW5kcyBjZEFzdC5GdW5jdGlvbkNhbGwge1xuICBjb25zdHJ1Y3RvcihzcGFuOiBjZEFzdC5QYXJzZVNwYW4sIHB1YmxpYyBhcmdzOiBjZEFzdC5BU1RbXSwgcHVibGljIGNvbnZlcnRlcjogQnVpbHRpbkNvbnZlcnRlcikge1xuICAgIHN1cGVyKHNwYW4sIG51bGwsIGFyZ3MpO1xuICB9XG59XG4iXX0=