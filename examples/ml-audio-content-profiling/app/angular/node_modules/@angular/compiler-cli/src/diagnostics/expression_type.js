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
        define("@angular/compiler-cli/src/diagnostics/expression_type", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler-cli/src/diagnostics/symbols"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var symbols_1 = require("@angular/compiler-cli/src/diagnostics/symbols");
    var DiagnosticKind;
    (function (DiagnosticKind) {
        DiagnosticKind[DiagnosticKind["Error"] = 0] = "Error";
        DiagnosticKind[DiagnosticKind["Warning"] = 1] = "Warning";
    })(DiagnosticKind = exports.DiagnosticKind || (exports.DiagnosticKind = {}));
    var TypeDiagnostic = /** @class */ (function () {
        function TypeDiagnostic(kind, message, ast) {
            this.kind = kind;
            this.message = message;
            this.ast = ast;
        }
        return TypeDiagnostic;
    }());
    exports.TypeDiagnostic = TypeDiagnostic;
    // AstType calculatetype of the ast given AST element.
    var AstType = /** @class */ (function () {
        function AstType(scope, query, context) {
            this.scope = scope;
            this.query = query;
            this.context = context;
        }
        AstType.prototype.getType = function (ast) { return ast.visit(this); };
        AstType.prototype.getDiagnostics = function (ast) {
            this.diagnostics = [];
            var type = ast.visit(this);
            if (this.context.event && type.callable) {
                this.reportWarning('Unexpected callable expression. Expected a method call', ast);
            }
            return this.diagnostics;
        };
        AstType.prototype.visitBinary = function (ast) {
            var _this_1 = this;
            // Treat undefined and null as other.
            function normalize(kind, other) {
                switch (kind) {
                    case symbols_1.BuiltinType.Undefined:
                    case symbols_1.BuiltinType.Null:
                        return normalize(other, symbols_1.BuiltinType.Other);
                }
                return kind;
            }
            var getType = function (ast, operation) {
                var type = _this_1.getType(ast);
                if (type.nullable) {
                    switch (operation) {
                        case '&&':
                        case '||':
                        case '==':
                        case '!=':
                        case '===':
                        case '!==':
                            // Nullable allowed.
                            break;
                        default:
                            _this_1.reportError("The expression might be null", ast);
                            break;
                    }
                    return _this_1.query.getNonNullableType(type);
                }
                return type;
            };
            var leftType = getType(ast.left, ast.operation);
            var rightType = getType(ast.right, ast.operation);
            var leftRawKind = this.query.getTypeKind(leftType);
            var rightRawKind = this.query.getTypeKind(rightType);
            var leftKind = normalize(leftRawKind, rightRawKind);
            var rightKind = normalize(rightRawKind, leftRawKind);
            // The following swtich implements operator typing similar to the
            // type production tables in the TypeScript specification.
            // https://github.com/Microsoft/TypeScript/blob/v1.8.10/doc/spec.md#4.19
            var operKind = leftKind << 8 | rightKind;
            switch (ast.operation) {
                case '*':
                case '/':
                case '%':
                case '-':
                case '<<':
                case '>>':
                case '>>>':
                case '&':
                case '^':
                case '|':
                    switch (operKind) {
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.Number << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Number:
                        case symbols_1.BuiltinType.Number << 8 | symbols_1.BuiltinType.Number:
                            return this.query.getBuiltinType(symbols_1.BuiltinType.Number);
                        default:
                            var errorAst = ast.left;
                            switch (leftKind) {
                                case symbols_1.BuiltinType.Any:
                                case symbols_1.BuiltinType.Number:
                                    errorAst = ast.right;
                                    break;
                            }
                            return this.reportError('Expected a numeric type', errorAst);
                    }
                case '+':
                    switch (operKind) {
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Boolean:
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Number:
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Other:
                        case symbols_1.BuiltinType.Boolean << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.Number << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.Other << 8 | symbols_1.BuiltinType.Any:
                            return this.anyType;
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.String:
                        case symbols_1.BuiltinType.Boolean << 8 | symbols_1.BuiltinType.String:
                        case symbols_1.BuiltinType.Number << 8 | symbols_1.BuiltinType.String:
                        case symbols_1.BuiltinType.String << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.String << 8 | symbols_1.BuiltinType.Boolean:
                        case symbols_1.BuiltinType.String << 8 | symbols_1.BuiltinType.Number:
                        case symbols_1.BuiltinType.String << 8 | symbols_1.BuiltinType.String:
                        case symbols_1.BuiltinType.String << 8 | symbols_1.BuiltinType.Other:
                        case symbols_1.BuiltinType.Other << 8 | symbols_1.BuiltinType.String:
                            return this.query.getBuiltinType(symbols_1.BuiltinType.String);
                        case symbols_1.BuiltinType.Number << 8 | symbols_1.BuiltinType.Number:
                            return this.query.getBuiltinType(symbols_1.BuiltinType.Number);
                        case symbols_1.BuiltinType.Boolean << 8 | symbols_1.BuiltinType.Number:
                        case symbols_1.BuiltinType.Other << 8 | symbols_1.BuiltinType.Number:
                            return this.reportError('Expected a number type', ast.left);
                        case symbols_1.BuiltinType.Number << 8 | symbols_1.BuiltinType.Boolean:
                        case symbols_1.BuiltinType.Number << 8 | symbols_1.BuiltinType.Other:
                            return this.reportError('Expected a number type', ast.right);
                        default:
                            return this.reportError('Expected operands to be a string or number type', ast);
                    }
                case '>':
                case '<':
                case '<=':
                case '>=':
                case '==':
                case '!=':
                case '===':
                case '!==':
                    switch (operKind) {
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Boolean:
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Number:
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.String:
                        case symbols_1.BuiltinType.Any << 8 | symbols_1.BuiltinType.Other:
                        case symbols_1.BuiltinType.Boolean << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.Boolean << 8 | symbols_1.BuiltinType.Boolean:
                        case symbols_1.BuiltinType.Number << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.Number << 8 | symbols_1.BuiltinType.Number:
                        case symbols_1.BuiltinType.String << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.String << 8 | symbols_1.BuiltinType.String:
                        case symbols_1.BuiltinType.Other << 8 | symbols_1.BuiltinType.Any:
                        case symbols_1.BuiltinType.Other << 8 | symbols_1.BuiltinType.Other:
                            return this.query.getBuiltinType(symbols_1.BuiltinType.Boolean);
                        default:
                            return this.reportError('Expected the operants to be of similar type or any', ast);
                    }
                case '&&':
                    return rightType;
                case '||':
                    return this.query.getTypeUnion(leftType, rightType);
            }
            return this.reportError("Unrecognized operator " + ast.operation, ast);
        };
        AstType.prototype.visitChain = function (ast) {
            if (this.diagnostics) {
                // If we are producing diagnostics, visit the children
                compiler_1.visitAstChildren(ast, this);
            }
            // The type of a chain is always undefined.
            return this.query.getBuiltinType(symbols_1.BuiltinType.Undefined);
        };
        AstType.prototype.visitConditional = function (ast) {
            // The type of a conditional is the union of the true and false conditions.
            if (this.diagnostics) {
                compiler_1.visitAstChildren(ast, this);
            }
            return this.query.getTypeUnion(this.getType(ast.trueExp), this.getType(ast.falseExp));
        };
        AstType.prototype.visitFunctionCall = function (ast) {
            var _this_1 = this;
            // The type of a function call is the return type of the selected signature.
            // The signature is selected based on the types of the arguments. Angular doesn't
            // support contextual typing of arguments so this is simpler than TypeScript's
            // version.
            var args = ast.args.map(function (arg) { return _this_1.getType(arg); });
            var target = this.getType(ast.target);
            if (!target || !target.callable)
                return this.reportError('Call target is not callable', ast);
            var signature = target.selectSignature(args);
            if (signature)
                return signature.result;
            // TODO: Consider a better error message here.
            return this.reportError('Unable no compatible signature found for call', ast);
        };
        AstType.prototype.visitImplicitReceiver = function (ast) {
            var _this = this;
            // Return a pseudo-symbol for the implicit receiver.
            // The members of the implicit receiver are what is defined by the
            // scope passed into this class.
            return {
                name: '$implict',
                kind: 'component',
                language: 'ng-template',
                type: undefined,
                container: undefined,
                callable: false,
                nullable: false,
                public: true,
                definition: undefined,
                members: function () { return _this.scope; },
                signatures: function () { return []; },
                selectSignature: function (types) { return undefined; },
                indexed: function (argument) { return undefined; }
            };
        };
        AstType.prototype.visitInterpolation = function (ast) {
            // If we are producing diagnostics, visit the children.
            if (this.diagnostics) {
                compiler_1.visitAstChildren(ast, this);
            }
            return this.undefinedType;
        };
        AstType.prototype.visitKeyedRead = function (ast) {
            var targetType = this.getType(ast.obj);
            var keyType = this.getType(ast.key);
            var result = targetType.indexed(keyType);
            return result || this.anyType;
        };
        AstType.prototype.visitKeyedWrite = function (ast) {
            // The write of a type is the type of the value being written.
            return this.getType(ast.value);
        };
        AstType.prototype.visitLiteralArray = function (ast) {
            var _this_1 = this;
            var _a;
            // A type literal is an array type of the union of the elements
            return this.query.getArrayType((_a = this.query).getTypeUnion.apply(_a, tslib_1.__spread(ast.expressions.map(function (element) { return _this_1.getType(element); }))));
        };
        AstType.prototype.visitLiteralMap = function (ast) {
            // If we are producing diagnostics, visit the children
            if (this.diagnostics) {
                compiler_1.visitAstChildren(ast, this);
            }
            // TODO: Return a composite type.
            return this.anyType;
        };
        AstType.prototype.visitLiteralPrimitive = function (ast) {
            // The type of a literal primitive depends on the value of the literal.
            switch (ast.value) {
                case true:
                case false:
                    return this.query.getBuiltinType(symbols_1.BuiltinType.Boolean);
                case null:
                    return this.query.getBuiltinType(symbols_1.BuiltinType.Null);
                case undefined:
                    return this.query.getBuiltinType(symbols_1.BuiltinType.Undefined);
                default:
                    switch (typeof ast.value) {
                        case 'string':
                            return this.query.getBuiltinType(symbols_1.BuiltinType.String);
                        case 'number':
                            return this.query.getBuiltinType(symbols_1.BuiltinType.Number);
                        default:
                            return this.reportError('Unrecognized primitive', ast);
                    }
            }
        };
        AstType.prototype.visitMethodCall = function (ast) {
            return this.resolveMethodCall(this.getType(ast.receiver), ast);
        };
        AstType.prototype.visitPipe = function (ast) {
            var _this_1 = this;
            // The type of a pipe node is the return type of the pipe's transform method. The table returned
            // by getPipes() is expected to contain symbols with the corresponding transform method type.
            var pipe = this.query.getPipes().get(ast.name);
            if (!pipe)
                return this.reportError("No pipe by the name " + ast.name + " found", ast);
            var expType = this.getType(ast.exp);
            var signature = pipe.selectSignature([expType].concat(ast.args.map(function (arg) { return _this_1.getType(arg); })));
            if (!signature)
                return this.reportError('Unable to resolve signature for pipe invocation', ast);
            return signature.result;
        };
        AstType.prototype.visitPrefixNot = function (ast) {
            // The type of a prefix ! is always boolean.
            return this.query.getBuiltinType(symbols_1.BuiltinType.Boolean);
        };
        AstType.prototype.visitNonNullAssert = function (ast) {
            var expressionType = this.getType(ast.expression);
            return this.query.getNonNullableType(expressionType);
        };
        AstType.prototype.visitPropertyRead = function (ast) {
            return this.resolvePropertyRead(this.getType(ast.receiver), ast);
        };
        AstType.prototype.visitPropertyWrite = function (ast) {
            // The type of a write is the type of the value being written.
            return this.getType(ast.value);
        };
        AstType.prototype.visitQuote = function (ast) {
            // The type of a quoted expression is any.
            return this.query.getBuiltinType(symbols_1.BuiltinType.Any);
        };
        AstType.prototype.visitSafeMethodCall = function (ast) {
            return this.resolveMethodCall(this.query.getNonNullableType(this.getType(ast.receiver)), ast);
        };
        AstType.prototype.visitSafePropertyRead = function (ast) {
            return this.resolvePropertyRead(this.query.getNonNullableType(this.getType(ast.receiver)), ast);
        };
        Object.defineProperty(AstType.prototype, "anyType", {
            get: function () {
                var result = this._anyType;
                if (!result) {
                    result = this._anyType = this.query.getBuiltinType(symbols_1.BuiltinType.Any);
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AstType.prototype, "undefinedType", {
            get: function () {
                var result = this._undefinedType;
                if (!result) {
                    result = this._undefinedType = this.query.getBuiltinType(symbols_1.BuiltinType.Undefined);
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        AstType.prototype.resolveMethodCall = function (receiverType, ast) {
            var _this_1 = this;
            if (this.isAny(receiverType)) {
                return this.anyType;
            }
            // The type of a method is the selected methods result type.
            var method = receiverType.members().get(ast.name);
            if (!method)
                return this.reportError("Unknown method '" + ast.name + "'", ast);
            if (!method.type)
                return this.reportError("Could not find a type for '" + ast.name + "'", ast);
            if (!method.type.callable)
                return this.reportError("Member '" + ast.name + "' is not callable", ast);
            var signature = method.type.selectSignature(ast.args.map(function (arg) { return _this_1.getType(arg); }));
            if (!signature)
                return this.reportError("Unable to resolve signature for call of method " + ast.name, ast);
            return signature.result;
        };
        AstType.prototype.resolvePropertyRead = function (receiverType, ast) {
            if (this.isAny(receiverType)) {
                return this.anyType;
            }
            // The type of a property read is the seelcted member's type.
            var member = receiverType.members().get(ast.name);
            if (!member) {
                var receiverInfo = receiverType.name;
                if (receiverInfo == '$implict') {
                    receiverInfo =
                        'The component declaration, template variable declarations, and element references do';
                }
                else if (receiverType.nullable) {
                    return this.reportError("The expression might be null", ast.receiver);
                }
                else {
                    receiverInfo = "'" + receiverInfo + "' does";
                }
                return this.reportError("Identifier '" + ast.name + "' is not defined. " + receiverInfo + " not contain such a member", ast);
            }
            if (!member.public) {
                var receiverInfo = receiverType.name;
                if (receiverInfo == '$implict') {
                    receiverInfo = 'the component';
                }
                else {
                    receiverInfo = "'" + receiverInfo + "'";
                }
                this.reportWarning("Identifier '" + ast.name + "' refers to a private member of " + receiverInfo, ast);
            }
            return member.type;
        };
        AstType.prototype.reportError = function (message, ast) {
            if (this.diagnostics) {
                this.diagnostics.push(new TypeDiagnostic(DiagnosticKind.Error, message, ast));
            }
            return this.anyType;
        };
        AstType.prototype.reportWarning = function (message, ast) {
            if (this.diagnostics) {
                this.diagnostics.push(new TypeDiagnostic(DiagnosticKind.Warning, message, ast));
            }
            return this.anyType;
        };
        AstType.prototype.isAny = function (symbol) {
            return !symbol || this.query.getTypeKind(symbol) == symbols_1.BuiltinType.Any ||
                (!!symbol.type && this.isAny(symbol.type));
        };
        return AstType;
    }());
    exports.AstType = AstType;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbl90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9kaWFnbm9zdGljcy9leHByZXNzaW9uX3R5cGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsOENBQTJVO0lBRTNVLHlFQUF5RjtJQUl6RixJQUFZLGNBR1g7SUFIRCxXQUFZLGNBQWM7UUFDeEIscURBQUssQ0FBQTtRQUNMLHlEQUFPLENBQUE7SUFDVCxDQUFDLEVBSFcsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUFHekI7SUFFRDtRQUNFLHdCQUFtQixJQUFvQixFQUFTLE9BQWUsRUFBUyxHQUFRO1lBQTdELFNBQUksR0FBSixJQUFJLENBQWdCO1lBQVMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUFTLFFBQUcsR0FBSCxHQUFHLENBQUs7UUFBRyxDQUFDO1FBQ3RGLHFCQUFDO0lBQUQsQ0FBQyxBQUZELElBRUM7SUFGWSx3Q0FBYztJQUkzQixzREFBc0Q7SUFDdEQ7UUFJRSxpQkFDWSxLQUFrQixFQUFVLEtBQWtCLEVBQzlDLE9BQXFDO1lBRHJDLFVBQUssR0FBTCxLQUFLLENBQWE7WUFBVSxVQUFLLEdBQUwsS0FBSyxDQUFhO1lBQzlDLFlBQU8sR0FBUCxPQUFPLENBQThCO1FBQUcsQ0FBQztRQUVyRCx5QkFBTyxHQUFQLFVBQVEsR0FBUSxJQUFZLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckQsZ0NBQWMsR0FBZCxVQUFlLEdBQVE7WUFDckIsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDdEIsSUFBTSxJQUFJLEdBQVcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLElB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QUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQy9FO1lBQ0QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3RCLENBQUM7UUFFTywrQkFBYSxHQUFyQixVQUFzQixPQUFlLEVBQUUsR0FBUTtZQUM3QyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksY0FBYyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDakY7WUFDRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDdEIsQ0FBQztRQUVPLHVCQUFLLEdBQWIsVUFBYyxNQUFjO1lBQzFCLE9BQU8sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUkscUJBQVcsQ0FBQyxHQUFHO2dCQUMvRCxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUNILGNBQUM7SUFBRCxDQUFDLEFBalpELElBaVpDO0lBalpZLDBCQUFPIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FTVCwgQXN0VmlzaXRvciwgQmluYXJ5LCBCaW5kaW5nUGlwZSwgQ2hhaW4sIENvbmRpdGlvbmFsLCBGdW5jdGlvbkNhbGwsIEltcGxpY2l0UmVjZWl2ZXIsIEludGVycG9sYXRpb24sIEtleWVkUmVhZCwgS2V5ZWRXcml0ZSwgTGl0ZXJhbEFycmF5LCBMaXRlcmFsTWFwLCBMaXRlcmFsUHJpbWl0aXZlLCBNZXRob2RDYWxsLCBOb25OdWxsQXNzZXJ0LCBQcmVmaXhOb3QsIFByb3BlcnR5UmVhZCwgUHJvcGVydHlXcml0ZSwgUXVvdGUsIFNhZmVNZXRob2RDYWxsLCBTYWZlUHJvcGVydHlSZWFkLCB2aXNpdEFzdENoaWxkcmVufSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7QnVpbHRpblR5cGUsIFNpZ25hdHVyZSwgU3BhbiwgU3ltYm9sLCBTeW1ib2xRdWVyeSwgU3ltYm9sVGFibGV9IGZyb20gJy4vc3ltYm9scyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhwcmVzc2lvbkRpYWdub3N0aWNzQ29udGV4dCB7IGV2ZW50PzogYm9vbGVhbjsgfVxuXG5leHBvcnQgZW51bSBEaWFnbm9zdGljS2luZCB7XG4gIEVycm9yLFxuICBXYXJuaW5nLFxufVxuXG5leHBvcnQgY2xhc3MgVHlwZURpYWdub3N0aWMge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMga2luZDogRGlhZ25vc3RpY0tpbmQsIHB1YmxpYyBtZXNzYWdlOiBzdHJpbmcsIHB1YmxpYyBhc3Q6IEFTVCkge31cbn1cblxuLy8gQXN0VHlwZSBjYWxjdWxhdGV0eXBlIG9mIHRoZSBhc3QgZ2l2ZW4gQVNUIGVsZW1lbnQuXG5leHBvcnQgY2xhc3MgQXN0VHlwZSBpbXBsZW1lbnRzIEFzdFZpc2l0b3Ige1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHVibGljIGRpYWdub3N0aWNzICE6IFR5cGVEaWFnbm9zdGljW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHNjb3BlOiBTeW1ib2xUYWJsZSwgcHJpdmF0ZSBxdWVyeTogU3ltYm9sUXVlcnksXG4gICAgICBwcml2YXRlIGNvbnRleHQ6IEV4cHJlc3Npb25EaWFnbm9zdGljc0NvbnRleHQpIHt9XG5cbiAgZ2V0VHlwZShhc3Q6IEFTVCk6IFN5bWJvbCB7IHJldHVybiBhc3QudmlzaXQodGhpcyk7IH1cblxuICBnZXREaWFnbm9zdGljcyhhc3Q6IEFTVCk6IFR5cGVEaWFnbm9zdGljW10ge1xuICAgIHRoaXMuZGlhZ25vc3RpY3MgPSBbXTtcbiAgICBjb25zdCB0eXBlOiBTeW1ib2wgPSBhc3QudmlzaXQodGhpcyk7XG4gICAgaWYgKHRoaXMuY29udGV4dC5ldmVudCAmJiB0eXBlLmNhbGxhYmxlKSB7XG4gICAgICB0aGlzLnJlcG9ydFdhcm5pbmcoJ1VuZXhwZWN0ZWQgY2FsbGFibGUgZXhwcmVzc2lvbi4gRXhwZWN0ZWQgYSBtZXRob2QgY2FsbCcsIGFzdCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmRpYWdub3N0aWNzO1xuICB9XG5cbiAgdmlzaXRCaW5hcnkoYXN0OiBCaW5hcnkpOiBTeW1ib2wge1xuICAgIC8vIFRyZWF0IHVuZGVmaW5lZCBhbmQgbnVsbCBhcyBvdGhlci5cbiAgICBmdW5jdGlvbiBub3JtYWxpemUoa2luZDogQnVpbHRpblR5cGUsIG90aGVyOiBCdWlsdGluVHlwZSk6IEJ1aWx0aW5UeXBlIHtcbiAgICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLlVuZGVmaW5lZDpcbiAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5OdWxsOlxuICAgICAgICAgIHJldHVybiBub3JtYWxpemUob3RoZXIsIEJ1aWx0aW5UeXBlLk90aGVyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBraW5kO1xuICAgIH1cblxuICAgIGNvbnN0IGdldFR5cGUgPSAoYXN0OiBBU1QsIG9wZXJhdGlvbjogc3RyaW5nKTogU3ltYm9sID0+IHtcbiAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFR5cGUoYXN0KTtcbiAgICAgIGlmICh0eXBlLm51bGxhYmxlKSB7XG4gICAgICAgIHN3aXRjaCAob3BlcmF0aW9uKSB7XG4gICAgICAgICAgY2FzZSAnJiYnOlxuICAgICAgICAgIGNhc2UgJ3x8JzpcbiAgICAgICAgICBjYXNlICc9PSc6XG4gICAgICAgICAgY2FzZSAnIT0nOlxuICAgICAgICAgIGNhc2UgJz09PSc6XG4gICAgICAgICAgY2FzZSAnIT09JzpcbiAgICAgICAgICAgIC8vIE51bGxhYmxlIGFsbG93ZWQuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhpcy5yZXBvcnRFcnJvcihgVGhlIGV4cHJlc3Npb24gbWlnaHQgYmUgbnVsbGAsIGFzdCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeS5nZXROb25OdWxsYWJsZVR5cGUodHlwZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHlwZTtcbiAgICB9O1xuXG4gICAgY29uc3QgbGVmdFR5cGUgPSBnZXRUeXBlKGFzdC5sZWZ0LCBhc3Qub3BlcmF0aW9uKTtcbiAgICBjb25zdCByaWdodFR5cGUgPSBnZXRUeXBlKGFzdC5yaWdodCwgYXN0Lm9wZXJhdGlvbik7XG4gICAgY29uc3QgbGVmdFJhd0tpbmQgPSB0aGlzLnF1ZXJ5LmdldFR5cGVLaW5kKGxlZnRUeXBlKTtcbiAgICBjb25zdCByaWdodFJhd0tpbmQgPSB0aGlzLnF1ZXJ5LmdldFR5cGVLaW5kKHJpZ2h0VHlwZSk7XG4gICAgY29uc3QgbGVmdEtpbmQgPSBub3JtYWxpemUobGVmdFJhd0tpbmQsIHJpZ2h0UmF3S2luZCk7XG4gICAgY29uc3QgcmlnaHRLaW5kID0gbm9ybWFsaXplKHJpZ2h0UmF3S2luZCwgbGVmdFJhd0tpbmQpO1xuXG4gICAgLy8gVGhlIGZvbGxvd2luZyBzd3RpY2ggaW1wbGVtZW50cyBvcGVyYXRvciB0eXBpbmcgc2ltaWxhciB0byB0aGVcbiAgICAvLyB0eXBlIHByb2R1Y3Rpb24gdGFibGVzIGluIHRoZSBUeXBlU2NyaXB0IHNwZWNpZmljYXRpb24uXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2Jsb2IvdjEuOC4xMC9kb2Mvc3BlYy5tZCM0LjE5XG4gICAgY29uc3Qgb3BlcktpbmQgPSBsZWZ0S2luZCA8PCA4IHwgcmlnaHRLaW5kO1xuICAgIHN3aXRjaCAoYXN0Lm9wZXJhdGlvbikge1xuICAgICAgY2FzZSAnKic6XG4gICAgICBjYXNlICcvJzpcbiAgICAgIGNhc2UgJyUnOlxuICAgICAgY2FzZSAnLSc6XG4gICAgICBjYXNlICc8PCc6XG4gICAgICBjYXNlICc+Pic6XG4gICAgICBjYXNlICc+Pj4nOlxuICAgICAgY2FzZSAnJic6XG4gICAgICBjYXNlICdeJzpcbiAgICAgIGNhc2UgJ3wnOlxuICAgICAgICBzd2l0Y2ggKG9wZXJLaW5kKSB7XG4gICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5BbnkgPDwgOCB8IEJ1aWx0aW5UeXBlLkFueTpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLk51bWJlciA8PCA4IHwgQnVpbHRpblR5cGUuQW55OlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuQW55IDw8IDggfCBCdWlsdGluVHlwZS5OdW1iZXI6XG4gICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5OdW1iZXIgPDwgOCB8IEJ1aWx0aW5UeXBlLk51bWJlcjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLk51bWJlcik7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGxldCBlcnJvckFzdCA9IGFzdC5sZWZ0O1xuICAgICAgICAgICAgc3dpdGNoIChsZWZ0S2luZCkge1xuICAgICAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLkFueTpcbiAgICAgICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5OdW1iZXI6XG4gICAgICAgICAgICAgICAgZXJyb3JBc3QgPSBhc3QucmlnaHQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXBvcnRFcnJvcignRXhwZWN0ZWQgYSBudW1lcmljIHR5cGUnLCBlcnJvckFzdCk7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgJysnOlxuICAgICAgICBzd2l0Y2ggKG9wZXJLaW5kKSB7XG4gICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5BbnkgPDwgOCB8IEJ1aWx0aW5UeXBlLkFueTpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLkFueSA8PCA4IHwgQnVpbHRpblR5cGUuQm9vbGVhbjpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLkFueSA8PCA4IHwgQnVpbHRpblR5cGUuTnVtYmVyOlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuQW55IDw8IDggfCBCdWlsdGluVHlwZS5PdGhlcjpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLkJvb2xlYW4gPDwgOCB8IEJ1aWx0aW5UeXBlLkFueTpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLk51bWJlciA8PCA4IHwgQnVpbHRpblR5cGUuQW55OlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuT3RoZXIgPDwgOCB8IEJ1aWx0aW5UeXBlLkFueTpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFueVR5cGU7XG4gICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5BbnkgPDwgOCB8IEJ1aWx0aW5UeXBlLlN0cmluZzpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLkJvb2xlYW4gPDwgOCB8IEJ1aWx0aW5UeXBlLlN0cmluZzpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLk51bWJlciA8PCA4IHwgQnVpbHRpblR5cGUuU3RyaW5nOlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuU3RyaW5nIDw8IDggfCBCdWlsdGluVHlwZS5Bbnk6XG4gICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5TdHJpbmcgPDwgOCB8IEJ1aWx0aW5UeXBlLkJvb2xlYW46XG4gICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5TdHJpbmcgPDwgOCB8IEJ1aWx0aW5UeXBlLk51bWJlcjpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLlN0cmluZyA8PCA4IHwgQnVpbHRpblR5cGUuU3RyaW5nOlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuU3RyaW5nIDw8IDggfCBCdWlsdGluVHlwZS5PdGhlcjpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLk90aGVyIDw8IDggfCBCdWlsdGluVHlwZS5TdHJpbmc6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeS5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5TdHJpbmcpO1xuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuTnVtYmVyIDw8IDggfCBCdWlsdGluVHlwZS5OdW1iZXI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeS5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5OdW1iZXIpO1xuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuQm9vbGVhbiA8PCA4IHwgQnVpbHRpblR5cGUuTnVtYmVyOlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuT3RoZXIgPDwgOCB8IEJ1aWx0aW5UeXBlLk51bWJlcjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlcG9ydEVycm9yKCdFeHBlY3RlZCBhIG51bWJlciB0eXBlJywgYXN0LmxlZnQpO1xuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuTnVtYmVyIDw8IDggfCBCdWlsdGluVHlwZS5Cb29sZWFuOlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuTnVtYmVyIDw8IDggfCBCdWlsdGluVHlwZS5PdGhlcjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlcG9ydEVycm9yKCdFeHBlY3RlZCBhIG51bWJlciB0eXBlJywgYXN0LnJpZ2h0KTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVwb3J0RXJyb3IoJ0V4cGVjdGVkIG9wZXJhbmRzIHRvIGJlIGEgc3RyaW5nIG9yIG51bWJlciB0eXBlJywgYXN0KTtcbiAgICAgICAgfVxuICAgICAgY2FzZSAnPic6XG4gICAgICBjYXNlICc8JzpcbiAgICAgIGNhc2UgJzw9JzpcbiAgICAgIGNhc2UgJz49JzpcbiAgICAgIGNhc2UgJz09JzpcbiAgICAgIGNhc2UgJyE9JzpcbiAgICAgIGNhc2UgJz09PSc6XG4gICAgICBjYXNlICchPT0nOlxuICAgICAgICBzd2l0Y2ggKG9wZXJLaW5kKSB7XG4gICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5BbnkgPDwgOCB8IEJ1aWx0aW5UeXBlLkFueTpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLkFueSA8PCA4IHwgQnVpbHRpblR5cGUuQm9vbGVhbjpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLkFueSA8PCA4IHwgQnVpbHRpblR5cGUuTnVtYmVyOlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuQW55IDw8IDggfCBCdWlsdGluVHlwZS5TdHJpbmc6XG4gICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5BbnkgPDwgOCB8IEJ1aWx0aW5UeXBlLk90aGVyOlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuQm9vbGVhbiA8PCA4IHwgQnVpbHRpblR5cGUuQW55OlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuQm9vbGVhbiA8PCA4IHwgQnVpbHRpblR5cGUuQm9vbGVhbjpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLk51bWJlciA8PCA4IHwgQnVpbHRpblR5cGUuQW55OlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuTnVtYmVyIDw8IDggfCBCdWlsdGluVHlwZS5OdW1iZXI6XG4gICAgICAgICAgY2FzZSBCdWlsdGluVHlwZS5TdHJpbmcgPDwgOCB8IEJ1aWx0aW5UeXBlLkFueTpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLlN0cmluZyA8PCA4IHwgQnVpbHRpblR5cGUuU3RyaW5nOlxuICAgICAgICAgIGNhc2UgQnVpbHRpblR5cGUuT3RoZXIgPDwgOCB8IEJ1aWx0aW5UeXBlLkFueTpcbiAgICAgICAgICBjYXNlIEJ1aWx0aW5UeXBlLk90aGVyIDw8IDggfCBCdWlsdGluVHlwZS5PdGhlcjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLkJvb2xlYW4pO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXBvcnRFcnJvcignRXhwZWN0ZWQgdGhlIG9wZXJhbnRzIHRvIGJlIG9mIHNpbWlsYXIgdHlwZSBvciBhbnknLCBhc3QpO1xuICAgICAgICB9XG4gICAgICBjYXNlICcmJic6XG4gICAgICAgIHJldHVybiByaWdodFR5cGU7XG4gICAgICBjYXNlICd8fCc6XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5LmdldFR5cGVVbmlvbihsZWZ0VHlwZSwgcmlnaHRUeXBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZXBvcnRFcnJvcihgVW5yZWNvZ25pemVkIG9wZXJhdG9yICR7YXN0Lm9wZXJhdGlvbn1gLCBhc3QpO1xuICB9XG5cbiAgdmlzaXRDaGFpbihhc3Q6IENoYWluKSB7XG4gICAgaWYgKHRoaXMuZGlhZ25vc3RpY3MpIHtcbiAgICAgIC8vIElmIHdlIGFyZSBwcm9kdWNpbmcgZGlhZ25vc3RpY3MsIHZpc2l0IHRoZSBjaGlsZHJlblxuICAgICAgdmlzaXRBc3RDaGlsZHJlbihhc3QsIHRoaXMpO1xuICAgIH1cbiAgICAvLyBUaGUgdHlwZSBvZiBhIGNoYWluIGlzIGFsd2F5cyB1bmRlZmluZWQuXG4gICAgcmV0dXJuIHRoaXMucXVlcnkuZ2V0QnVpbHRpblR5cGUoQnVpbHRpblR5cGUuVW5kZWZpbmVkKTtcbiAgfVxuXG4gIHZpc2l0Q29uZGl0aW9uYWwoYXN0OiBDb25kaXRpb25hbCkge1xuICAgIC8vIFRoZSB0eXBlIG9mIGEgY29uZGl0aW9uYWwgaXMgdGhlIHVuaW9uIG9mIHRoZSB0cnVlIGFuZCBmYWxzZSBjb25kaXRpb25zLlxuICAgIGlmICh0aGlzLmRpYWdub3N0aWNzKSB7XG4gICAgICB2aXNpdEFzdENoaWxkcmVuKGFzdCwgdGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnF1ZXJ5LmdldFR5cGVVbmlvbih0aGlzLmdldFR5cGUoYXN0LnRydWVFeHApLCB0aGlzLmdldFR5cGUoYXN0LmZhbHNlRXhwKSk7XG4gIH1cblxuICB2aXNpdEZ1bmN0aW9uQ2FsbChhc3Q6IEZ1bmN0aW9uQ2FsbCkge1xuICAgIC8vIFRoZSB0eXBlIG9mIGEgZnVuY3Rpb24gY2FsbCBpcyB0aGUgcmV0dXJuIHR5cGUgb2YgdGhlIHNlbGVjdGVkIHNpZ25hdHVyZS5cbiAgICAvLyBUaGUgc2lnbmF0dXJlIGlzIHNlbGVjdGVkIGJhc2VkIG9uIHRoZSB0eXBlcyBvZiB0aGUgYXJndW1lbnRzLiBBbmd1bGFyIGRvZXNuJ3RcbiAgICAvLyBzdXBwb3J0IGNvbnRleHR1YWwgdHlwaW5nIG9mIGFyZ3VtZW50cyBzbyB0aGlzIGlzIHNpbXBsZXIgdGhhbiBUeXBlU2NyaXB0J3NcbiAgICAvLyB2ZXJzaW9uLlxuICAgIGNvbnN0IGFyZ3MgPSBhc3QuYXJncy5tYXAoYXJnID0+IHRoaXMuZ2V0VHlwZShhcmcpKTtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmdldFR5cGUoYXN0LnRhcmdldCAhKTtcbiAgICBpZiAoIXRhcmdldCB8fCAhdGFyZ2V0LmNhbGxhYmxlKSByZXR1cm4gdGhpcy5yZXBvcnRFcnJvcignQ2FsbCB0YXJnZXQgaXMgbm90IGNhbGxhYmxlJywgYXN0KTtcbiAgICBjb25zdCBzaWduYXR1cmUgPSB0YXJnZXQuc2VsZWN0U2lnbmF0dXJlKGFyZ3MpO1xuICAgIGlmIChzaWduYXR1cmUpIHJldHVybiBzaWduYXR1cmUucmVzdWx0O1xuICAgIC8vIFRPRE86IENvbnNpZGVyIGEgYmV0dGVyIGVycm9yIG1lc3NhZ2UgaGVyZS5cbiAgICByZXR1cm4gdGhpcy5yZXBvcnRFcnJvcignVW5hYmxlIG5vIGNvbXBhdGlibGUgc2lnbmF0dXJlIGZvdW5kIGZvciBjYWxsJywgYXN0KTtcbiAgfVxuXG4gIHZpc2l0SW1wbGljaXRSZWNlaXZlcihhc3Q6IEltcGxpY2l0UmVjZWl2ZXIpOiBTeW1ib2wge1xuICAgIGNvbnN0IF90aGlzID0gdGhpcztcbiAgICAvLyBSZXR1cm4gYSBwc2V1ZG8tc3ltYm9sIGZvciB0aGUgaW1wbGljaXQgcmVjZWl2ZXIuXG4gICAgLy8gVGhlIG1lbWJlcnMgb2YgdGhlIGltcGxpY2l0IHJlY2VpdmVyIGFyZSB3aGF0IGlzIGRlZmluZWQgYnkgdGhlXG4gICAgLy8gc2NvcGUgcGFzc2VkIGludG8gdGhpcyBjbGFzcy5cbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogJyRpbXBsaWN0JyxcbiAgICAgIGtpbmQ6ICdjb21wb25lbnQnLFxuICAgICAgbGFuZ3VhZ2U6ICduZy10ZW1wbGF0ZScsXG4gICAgICB0eXBlOiB1bmRlZmluZWQsXG4gICAgICBjb250YWluZXI6IHVuZGVmaW5lZCxcbiAgICAgIGNhbGxhYmxlOiBmYWxzZSxcbiAgICAgIG51bGxhYmxlOiBmYWxzZSxcbiAgICAgIHB1YmxpYzogdHJ1ZSxcbiAgICAgIGRlZmluaXRpb246IHVuZGVmaW5lZCxcbiAgICAgIG1lbWJlcnMoKTogU3ltYm9sVGFibGV7cmV0dXJuIF90aGlzLnNjb3BlO30sXG4gICAgICBzaWduYXR1cmVzKCk6IFNpZ25hdHVyZVtde3JldHVybiBbXTt9LFxuICAgICAgc2VsZWN0U2lnbmF0dXJlKHR5cGVzKTogU2lnbmF0dXJlIHwgdW5kZWZpbmVke3JldHVybiB1bmRlZmluZWQ7fSxcbiAgICAgIGluZGV4ZWQoYXJndW1lbnQpOiBTeW1ib2wgfCB1bmRlZmluZWR7cmV0dXJuIHVuZGVmaW5lZDt9XG4gICAgfTtcbiAgfVxuXG4gIHZpc2l0SW50ZXJwb2xhdGlvbihhc3Q6IEludGVycG9sYXRpb24pOiBTeW1ib2wge1xuICAgIC8vIElmIHdlIGFyZSBwcm9kdWNpbmcgZGlhZ25vc3RpY3MsIHZpc2l0IHRoZSBjaGlsZHJlbi5cbiAgICBpZiAodGhpcy5kaWFnbm9zdGljcykge1xuICAgICAgdmlzaXRBc3RDaGlsZHJlbihhc3QsIHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy51bmRlZmluZWRUeXBlO1xuICB9XG5cbiAgdmlzaXRLZXllZFJlYWQoYXN0OiBLZXllZFJlYWQpOiBTeW1ib2wge1xuICAgIGNvbnN0IHRhcmdldFR5cGUgPSB0aGlzLmdldFR5cGUoYXN0Lm9iaik7XG4gICAgY29uc3Qga2V5VHlwZSA9IHRoaXMuZ2V0VHlwZShhc3Qua2V5KTtcbiAgICBjb25zdCByZXN1bHQgPSB0YXJnZXRUeXBlLmluZGV4ZWQoa2V5VHlwZSk7XG4gICAgcmV0dXJuIHJlc3VsdCB8fCB0aGlzLmFueVR5cGU7XG4gIH1cblxuICB2aXNpdEtleWVkV3JpdGUoYXN0OiBLZXllZFdyaXRlKTogU3ltYm9sIHtcbiAgICAvLyBUaGUgd3JpdGUgb2YgYSB0eXBlIGlzIHRoZSB0eXBlIG9mIHRoZSB2YWx1ZSBiZWluZyB3cml0dGVuLlxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoYXN0LnZhbHVlKTtcbiAgfVxuXG4gIHZpc2l0TGl0ZXJhbEFycmF5KGFzdDogTGl0ZXJhbEFycmF5KTogU3ltYm9sIHtcbiAgICAvLyBBIHR5cGUgbGl0ZXJhbCBpcyBhbiBhcnJheSB0eXBlIG9mIHRoZSB1bmlvbiBvZiB0aGUgZWxlbWVudHNcbiAgICByZXR1cm4gdGhpcy5xdWVyeS5nZXRBcnJheVR5cGUoXG4gICAgICAgIHRoaXMucXVlcnkuZ2V0VHlwZVVuaW9uKC4uLmFzdC5leHByZXNzaW9ucy5tYXAoZWxlbWVudCA9PiB0aGlzLmdldFR5cGUoZWxlbWVudCkpKSk7XG4gIH1cblxuICB2aXNpdExpdGVyYWxNYXAoYXN0OiBMaXRlcmFsTWFwKTogU3ltYm9sIHtcbiAgICAvLyBJZiB3ZSBhcmUgcHJvZHVjaW5nIGRpYWdub3N0aWNzLCB2aXNpdCB0aGUgY2hpbGRyZW5cbiAgICBpZiAodGhpcy5kaWFnbm9zdGljcykge1xuICAgICAgdmlzaXRBc3RDaGlsZHJlbihhc3QsIHRoaXMpO1xuICAgIH1cbiAgICAvLyBUT0RPOiBSZXR1cm4gYSBjb21wb3NpdGUgdHlwZS5cbiAgICByZXR1cm4gdGhpcy5hbnlUeXBlO1xuICB9XG5cbiAgdmlzaXRMaXRlcmFsUHJpbWl0aXZlKGFzdDogTGl0ZXJhbFByaW1pdGl2ZSkge1xuICAgIC8vIFRoZSB0eXBlIG9mIGEgbGl0ZXJhbCBwcmltaXRpdmUgZGVwZW5kcyBvbiB0aGUgdmFsdWUgb2YgdGhlIGxpdGVyYWwuXG4gICAgc3dpdGNoIChhc3QudmFsdWUpIHtcbiAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgIGNhc2UgZmFsc2U6XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLkJvb2xlYW4pO1xuICAgICAgY2FzZSBudWxsOlxuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeS5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5OdWxsKTtcbiAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeS5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5VbmRlZmluZWQpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgYXN0LnZhbHVlKSB7XG4gICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLlN0cmluZyk7XG4gICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLk51bWJlcik7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlcG9ydEVycm9yKCdVbnJlY29nbml6ZWQgcHJpbWl0aXZlJywgYXN0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHZpc2l0TWV0aG9kQ2FsbChhc3Q6IE1ldGhvZENhbGwpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlTWV0aG9kQ2FsbCh0aGlzLmdldFR5cGUoYXN0LnJlY2VpdmVyKSwgYXN0KTtcbiAgfVxuXG4gIHZpc2l0UGlwZShhc3Q6IEJpbmRpbmdQaXBlKSB7XG4gICAgLy8gVGhlIHR5cGUgb2YgYSBwaXBlIG5vZGUgaXMgdGhlIHJldHVybiB0eXBlIG9mIHRoZSBwaXBlJ3MgdHJhbnNmb3JtIG1ldGhvZC4gVGhlIHRhYmxlIHJldHVybmVkXG4gICAgLy8gYnkgZ2V0UGlwZXMoKSBpcyBleHBlY3RlZCB0byBjb250YWluIHN5bWJvbHMgd2l0aCB0aGUgY29ycmVzcG9uZGluZyB0cmFuc2Zvcm0gbWV0aG9kIHR5cGUuXG4gICAgY29uc3QgcGlwZSA9IHRoaXMucXVlcnkuZ2V0UGlwZXMoKS5nZXQoYXN0Lm5hbWUpO1xuICAgIGlmICghcGlwZSkgcmV0dXJuIHRoaXMucmVwb3J0RXJyb3IoYE5vIHBpcGUgYnkgdGhlIG5hbWUgJHthc3QubmFtZX0gZm91bmRgLCBhc3QpO1xuICAgIGNvbnN0IGV4cFR5cGUgPSB0aGlzLmdldFR5cGUoYXN0LmV4cCk7XG4gICAgY29uc3Qgc2lnbmF0dXJlID1cbiAgICAgICAgcGlwZS5zZWxlY3RTaWduYXR1cmUoW2V4cFR5cGVdLmNvbmNhdChhc3QuYXJncy5tYXAoYXJnID0+IHRoaXMuZ2V0VHlwZShhcmcpKSkpO1xuICAgIGlmICghc2lnbmF0dXJlKSByZXR1cm4gdGhpcy5yZXBvcnRFcnJvcignVW5hYmxlIHRvIHJlc29sdmUgc2lnbmF0dXJlIGZvciBwaXBlIGludm9jYXRpb24nLCBhc3QpO1xuICAgIHJldHVybiBzaWduYXR1cmUucmVzdWx0O1xuICB9XG5cbiAgdmlzaXRQcmVmaXhOb3QoYXN0OiBQcmVmaXhOb3QpIHtcbiAgICAvLyBUaGUgdHlwZSBvZiBhIHByZWZpeCAhIGlzIGFsd2F5cyBib29sZWFuLlxuICAgIHJldHVybiB0aGlzLnF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLkJvb2xlYW4pO1xuICB9XG5cbiAgdmlzaXROb25OdWxsQXNzZXJ0KGFzdDogTm9uTnVsbEFzc2VydCkge1xuICAgIGNvbnN0IGV4cHJlc3Npb25UeXBlID0gdGhpcy5nZXRUeXBlKGFzdC5leHByZXNzaW9uKTtcbiAgICByZXR1cm4gdGhpcy5xdWVyeS5nZXROb25OdWxsYWJsZVR5cGUoZXhwcmVzc2lvblR5cGUpO1xuICB9XG5cbiAgdmlzaXRQcm9wZXJ0eVJlYWQoYXN0OiBQcm9wZXJ0eVJlYWQpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlUHJvcGVydHlSZWFkKHRoaXMuZ2V0VHlwZShhc3QucmVjZWl2ZXIpLCBhc3QpO1xuICB9XG5cbiAgdmlzaXRQcm9wZXJ0eVdyaXRlKGFzdDogUHJvcGVydHlXcml0ZSkge1xuICAgIC8vIFRoZSB0eXBlIG9mIGEgd3JpdGUgaXMgdGhlIHR5cGUgb2YgdGhlIHZhbHVlIGJlaW5nIHdyaXR0ZW4uXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHlwZShhc3QudmFsdWUpO1xuICB9XG5cbiAgdmlzaXRRdW90ZShhc3Q6IFF1b3RlKSB7XG4gICAgLy8gVGhlIHR5cGUgb2YgYSBxdW90ZWQgZXhwcmVzc2lvbiBpcyBhbnkuXG4gICAgcmV0dXJuIHRoaXMucXVlcnkuZ2V0QnVpbHRpblR5cGUoQnVpbHRpblR5cGUuQW55KTtcbiAgfVxuXG4gIHZpc2l0U2FmZU1ldGhvZENhbGwoYXN0OiBTYWZlTWV0aG9kQ2FsbCkge1xuICAgIHJldHVybiB0aGlzLnJlc29sdmVNZXRob2RDYWxsKHRoaXMucXVlcnkuZ2V0Tm9uTnVsbGFibGVUeXBlKHRoaXMuZ2V0VHlwZShhc3QucmVjZWl2ZXIpKSwgYXN0KTtcbiAgfVxuXG4gIHZpc2l0U2FmZVByb3BlcnR5UmVhZChhc3Q6IFNhZmVQcm9wZXJ0eVJlYWQpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlUHJvcGVydHlSZWFkKHRoaXMucXVlcnkuZ2V0Tm9uTnVsbGFibGVUeXBlKHRoaXMuZ2V0VHlwZShhc3QucmVjZWl2ZXIpKSwgYXN0KTtcbiAgfVxuXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9hbnlUeXBlICE6IFN5bWJvbDtcbiAgcHJpdmF0ZSBnZXQgYW55VHlwZSgpOiBTeW1ib2wge1xuICAgIGxldCByZXN1bHQgPSB0aGlzLl9hbnlUeXBlO1xuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICByZXN1bHQgPSB0aGlzLl9hbnlUeXBlID0gdGhpcy5xdWVyeS5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5BbnkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX3VuZGVmaW5lZFR5cGUgITogU3ltYm9sO1xuICBwcml2YXRlIGdldCB1bmRlZmluZWRUeXBlKCk6IFN5bWJvbCB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMuX3VuZGVmaW5lZFR5cGU7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIHJlc3VsdCA9IHRoaXMuX3VuZGVmaW5lZFR5cGUgPSB0aGlzLnF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLlVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIHJlc29sdmVNZXRob2RDYWxsKHJlY2VpdmVyVHlwZTogU3ltYm9sLCBhc3Q6IFNhZmVNZXRob2RDYWxsfE1ldGhvZENhbGwpIHtcbiAgICBpZiAodGhpcy5pc0FueShyZWNlaXZlclR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5hbnlUeXBlO1xuICAgIH1cblxuICAgIC8vIFRoZSB0eXBlIG9mIGEgbWV0aG9kIGlzIHRoZSBzZWxlY3RlZCBtZXRob2RzIHJlc3VsdCB0eXBlLlxuICAgIGNvbnN0IG1ldGhvZCA9IHJlY2VpdmVyVHlwZS5tZW1iZXJzKCkuZ2V0KGFzdC5uYW1lKTtcbiAgICBpZiAoIW1ldGhvZCkgcmV0dXJuIHRoaXMucmVwb3J0RXJyb3IoYFVua25vd24gbWV0aG9kICcke2FzdC5uYW1lfSdgLCBhc3QpO1xuICAgIGlmICghbWV0aG9kLnR5cGUpIHJldHVybiB0aGlzLnJlcG9ydEVycm9yKGBDb3VsZCBub3QgZmluZCBhIHR5cGUgZm9yICcke2FzdC5uYW1lfSdgLCBhc3QpO1xuICAgIGlmICghbWV0aG9kLnR5cGUuY2FsbGFibGUpIHJldHVybiB0aGlzLnJlcG9ydEVycm9yKGBNZW1iZXIgJyR7YXN0Lm5hbWV9JyBpcyBub3QgY2FsbGFibGVgLCBhc3QpO1xuICAgIGNvbnN0IHNpZ25hdHVyZSA9IG1ldGhvZC50eXBlLnNlbGVjdFNpZ25hdHVyZShhc3QuYXJncy5tYXAoYXJnID0+IHRoaXMuZ2V0VHlwZShhcmcpKSk7XG4gICAgaWYgKCFzaWduYXR1cmUpXG4gICAgICByZXR1cm4gdGhpcy5yZXBvcnRFcnJvcihgVW5hYmxlIHRvIHJlc29sdmUgc2lnbmF0dXJlIGZvciBjYWxsIG9mIG1ldGhvZCAke2FzdC5uYW1lfWAsIGFzdCk7XG4gICAgcmV0dXJuIHNpZ25hdHVyZS5yZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIHJlc29sdmVQcm9wZXJ0eVJlYWQocmVjZWl2ZXJUeXBlOiBTeW1ib2wsIGFzdDogU2FmZVByb3BlcnR5UmVhZHxQcm9wZXJ0eVJlYWQpIHtcbiAgICBpZiAodGhpcy5pc0FueShyZWNlaXZlclR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5hbnlUeXBlO1xuICAgIH1cblxuICAgIC8vIFRoZSB0eXBlIG9mIGEgcHJvcGVydHkgcmVhZCBpcyB0aGUgc2VlbGN0ZWQgbWVtYmVyJ3MgdHlwZS5cbiAgICBjb25zdCBtZW1iZXIgPSByZWNlaXZlclR5cGUubWVtYmVycygpLmdldChhc3QubmFtZSk7XG4gICAgaWYgKCFtZW1iZXIpIHtcbiAgICAgIGxldCByZWNlaXZlckluZm8gPSByZWNlaXZlclR5cGUubmFtZTtcbiAgICAgIGlmIChyZWNlaXZlckluZm8gPT0gJyRpbXBsaWN0Jykge1xuICAgICAgICByZWNlaXZlckluZm8gPVxuICAgICAgICAgICAgJ1RoZSBjb21wb25lbnQgZGVjbGFyYXRpb24sIHRlbXBsYXRlIHZhcmlhYmxlIGRlY2xhcmF0aW9ucywgYW5kIGVsZW1lbnQgcmVmZXJlbmNlcyBkbyc7XG4gICAgICB9IGVsc2UgaWYgKHJlY2VpdmVyVHlwZS5udWxsYWJsZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXBvcnRFcnJvcihgVGhlIGV4cHJlc3Npb24gbWlnaHQgYmUgbnVsbGAsIGFzdC5yZWNlaXZlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWNlaXZlckluZm8gPSBgJyR7cmVjZWl2ZXJJbmZvfScgZG9lc2A7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5yZXBvcnRFcnJvcihcbiAgICAgICAgICBgSWRlbnRpZmllciAnJHthc3QubmFtZX0nIGlzIG5vdCBkZWZpbmVkLiAke3JlY2VpdmVySW5mb30gbm90IGNvbnRhaW4gc3VjaCBhIG1lbWJlcmAsXG4gICAgICAgICAgYXN0KTtcbiAgICB9XG4gICAgaWYgKCFtZW1iZXIucHVibGljKSB7XG4gICAgICBsZXQgcmVjZWl2ZXJJbmZvID0gcmVjZWl2ZXJUeXBlLm5hbWU7XG4gICAgICBpZiAocmVjZWl2ZXJJbmZvID09ICckaW1wbGljdCcpIHtcbiAgICAgICAgcmVjZWl2ZXJJbmZvID0gJ3RoZSBjb21wb25lbnQnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVjZWl2ZXJJbmZvID0gYCcke3JlY2VpdmVySW5mb30nYDtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVwb3J0V2FybmluZyhcbiAgICAgICAgICBgSWRlbnRpZmllciAnJHthc3QubmFtZX0nIHJlZmVycyB0byBhIHByaXZhdGUgbWVtYmVyIG9mICR7cmVjZWl2ZXJJbmZvfWAsIGFzdCk7XG4gICAgfVxuICAgIHJldHVybiBtZW1iZXIudHlwZTtcbiAgfVxuXG4gIHByaXZhdGUgcmVwb3J0RXJyb3IobWVzc2FnZTogc3RyaW5nLCBhc3Q6IEFTVCk6IFN5bWJvbCB7XG4gICAgaWYgKHRoaXMuZGlhZ25vc3RpY3MpIHtcbiAgICAgIHRoaXMuZGlhZ25vc3RpY3MucHVzaChuZXcgVHlwZURpYWdub3N0aWMoRGlhZ25vc3RpY0tpbmQuRXJyb3IsIG1lc3NhZ2UsIGFzdCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hbnlUeXBlO1xuICB9XG5cbiAgcHJpdmF0ZSByZXBvcnRXYXJuaW5nKG1lc3NhZ2U6IHN0cmluZywgYXN0OiBBU1QpOiBTeW1ib2wge1xuICAgIGlmICh0aGlzLmRpYWdub3N0aWNzKSB7XG4gICAgICB0aGlzLmRpYWdub3N0aWNzLnB1c2gobmV3IFR5cGVEaWFnbm9zdGljKERpYWdub3N0aWNLaW5kLldhcm5pbmcsIG1lc3NhZ2UsIGFzdCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hbnlUeXBlO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0FueShzeW1ib2w6IFN5bWJvbCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhc3ltYm9sIHx8IHRoaXMucXVlcnkuZ2V0VHlwZUtpbmQoc3ltYm9sKSA9PSBCdWlsdGluVHlwZS5BbnkgfHxcbiAgICAgICAgKCEhc3ltYm9sLnR5cGUgJiYgdGhpcy5pc0FueShzeW1ib2wudHlwZSkpO1xuICB9XG59Il19