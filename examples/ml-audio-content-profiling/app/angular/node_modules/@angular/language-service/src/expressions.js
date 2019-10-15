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
        define("@angular/language-service/src/expressions", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler-cli/src/language_services", "@angular/language-service/src/types", "@angular/language-service/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var language_services_1 = require("@angular/compiler-cli/src/language_services");
    var types_1 = require("@angular/language-service/src/types");
    var utils_1 = require("@angular/language-service/src/utils");
    function findAstAt(ast, position, excludeEmpty) {
        if (excludeEmpty === void 0) { excludeEmpty = false; }
        var path = [];
        var visitor = new /** @class */ (function (_super) {
            tslib_1.__extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.visit = function (ast) {
                if ((!excludeEmpty || ast.span.start < ast.span.end) && utils_1.inSpan(position, ast.span)) {
                    path.push(ast);
                    compiler_1.visitAstChildren(ast, this);
                }
            };
            return class_1;
        }(compiler_1.NullAstVisitor));
        // We never care about the ASTWithSource node and its visit() method calls its ast's visit so
        // the visit() method above would never see it.
        if (ast instanceof compiler_1.ASTWithSource) {
            ast = ast.ast;
        }
        visitor.visit(ast);
        return new compiler_1.AstPath(path, position);
    }
    function getExpressionCompletions(scope, ast, position, query) {
        var path = findAstAt(ast, position);
        if (path.empty)
            return undefined;
        var tail = path.tail;
        var result = scope;
        function getType(ast) { return new language_services_1.AstType(scope, query, {}).getType(ast); }
        // If the completion request is in a not in a pipe or property access then the global scope
        // (that is the scope of the implicit receiver) is the right scope as the user is typing the
        // beginning of an expression.
        tail.visit({
            visitBinary: function (ast) { },
            visitChain: function (ast) { },
            visitConditional: function (ast) { },
            visitFunctionCall: function (ast) { },
            visitImplicitReceiver: function (ast) { },
            visitInterpolation: function (ast) { result = undefined; },
            visitKeyedRead: function (ast) { },
            visitKeyedWrite: function (ast) { },
            visitLiteralArray: function (ast) { },
            visitLiteralMap: function (ast) { },
            visitLiteralPrimitive: function (ast) { },
            visitMethodCall: function (ast) { },
            visitPipe: function (ast) {
                if (position >= ast.exp.span.end &&
                    (!ast.args || !ast.args.length || position < ast.args[0].span.start)) {
                    // We are in a position a pipe name is expected.
                    result = query.getPipes();
                }
            },
            visitPrefixNot: function (ast) { },
            visitNonNullAssert: function (ast) { },
            visitPropertyRead: function (ast) {
                var receiverType = getType(ast.receiver);
                result = receiverType ? receiverType.members() : scope;
            },
            visitPropertyWrite: function (ast) {
                var receiverType = getType(ast.receiver);
                result = receiverType ? receiverType.members() : scope;
            },
            visitQuote: function (ast) {
                // For a quote, return the members of any (if there are any).
                result = query.getBuiltinType(types_1.BuiltinType.Any).members();
            },
            visitSafeMethodCall: function (ast) {
                var receiverType = getType(ast.receiver);
                result = receiverType ? receiverType.members() : scope;
            },
            visitSafePropertyRead: function (ast) {
                var receiverType = getType(ast.receiver);
                result = receiverType ? receiverType.members() : scope;
            },
        });
        return result && result.values();
    }
    exports.getExpressionCompletions = getExpressionCompletions;
    function getExpressionSymbol(scope, ast, position, query) {
        var path = findAstAt(ast, position, /* excludeEmpty */ true);
        if (path.empty)
            return undefined;
        var tail = path.tail;
        function getType(ast) { return new language_services_1.AstType(scope, query, {}).getType(ast); }
        var symbol = undefined;
        var span = undefined;
        // If the completion request is in a not in a pipe or property access then the global scope
        // (that is the scope of the implicit receiver) is the right scope as the user is typing the
        // beginning of an expression.
        tail.visit({
            visitBinary: function (ast) { },
            visitChain: function (ast) { },
            visitConditional: function (ast) { },
            visitFunctionCall: function (ast) { },
            visitImplicitReceiver: function (ast) { },
            visitInterpolation: function (ast) { },
            visitKeyedRead: function (ast) { },
            visitKeyedWrite: function (ast) { },
            visitLiteralArray: function (ast) { },
            visitLiteralMap: function (ast) { },
            visitLiteralPrimitive: function (ast) { },
            visitMethodCall: function (ast) {
                var receiverType = getType(ast.receiver);
                symbol = receiverType && receiverType.members().get(ast.name);
                span = ast.span;
            },
            visitPipe: function (ast) {
                if (position >= ast.exp.span.end &&
                    (!ast.args || !ast.args.length || position < ast.args[0].span.start)) {
                    // We are in a position a pipe name is expected.
                    var pipes = query.getPipes();
                    if (pipes) {
                        symbol = pipes.get(ast.name);
                        span = ast.span;
                    }
                }
            },
            visitPrefixNot: function (ast) { },
            visitNonNullAssert: function (ast) { },
            visitPropertyRead: function (ast) {
                var receiverType = getType(ast.receiver);
                symbol = receiverType && receiverType.members().get(ast.name);
                span = ast.span;
            },
            visitPropertyWrite: function (ast) {
                var receiverType = getType(ast.receiver);
                symbol = receiverType && receiverType.members().get(ast.name);
                span = ast.span;
            },
            visitQuote: function (ast) { },
            visitSafeMethodCall: function (ast) {
                var receiverType = getType(ast.receiver);
                symbol = receiverType && receiverType.members().get(ast.name);
                span = ast.span;
            },
            visitSafePropertyRead: function (ast) {
                var receiverType = getType(ast.receiver);
                symbol = receiverType && receiverType.members().get(ast.name);
                span = ast.span;
            },
        });
        if (symbol && span) {
            return { symbol: symbol, span: span };
        }
    }
    exports.getExpressionSymbol = getExpressionSymbol;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL3NyYy9leHByZXNzaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCw4Q0FBK0c7SUFDL0csaUZBQW9FO0lBRXBFLDZEQUE0RTtJQUM1RSw2REFBK0I7SUFJL0IsU0FBUyxTQUFTLENBQUMsR0FBUSxFQUFFLFFBQWdCLEVBQUUsWUFBNkI7UUFBN0IsNkJBQUEsRUFBQSxvQkFBNkI7UUFDMUUsSUFBTSxJQUFJLEdBQVUsRUFBRSxDQUFDO1FBQ3ZCLElBQU0sT0FBTyxHQUFHO1lBQWtCLG1DQUFjO1lBQTVCOztZQU9wQixDQUFDO1lBTkMsdUJBQUssR0FBTCxVQUFNLEdBQVE7Z0JBQ1osSUFBSSxDQUFDLENBQUMsWUFBWSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksY0FBTSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2xGLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2YsMkJBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUM3QjtZQUNILENBQUM7WUFDSCxjQUFDO1FBQUQsQ0FBQyxBQVBtQixDQUFjLHlCQUFjLEVBTy9DLENBQUM7UUFFRiw2RkFBNkY7UUFDN0YsK0NBQStDO1FBQy9DLElBQUksR0FBRyxZQUFZLHdCQUFhLEVBQUU7WUFDaEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7U0FDZjtRQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbkIsT0FBTyxJQUFJLGtCQUFXLENBQU0sSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlDLENB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QztTQUNGLENBQUMsQ0FBQztRQUVILElBQUksTUFBTSxJQUFJLElBQUksRUFBRTtZQUNsQixPQUFPLEVBQUMsTUFBTSxRQUFBLEVBQUUsSUFBSSxNQUFBLEVBQUMsQ0FBQztTQUN2QjtJQUNILENBQUM7SUF2RUQsa0RBdUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FTVCwgQVNUV2l0aFNvdXJjZSwgQXN0UGF0aCBhcyBBc3RQYXRoQmFzZSwgTnVsbEFzdFZpc2l0b3IsIHZpc2l0QXN0Q2hpbGRyZW59IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7QXN0VHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9sYW5ndWFnZV9zZXJ2aWNlcyc7XG5cbmltcG9ydCB7QnVpbHRpblR5cGUsIFNwYW4sIFN5bWJvbCwgU3ltYm9sUXVlcnksIFN5bWJvbFRhYmxlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7aW5TcGFufSBmcm9tICcuL3V0aWxzJztcblxudHlwZSBBc3RQYXRoID0gQXN0UGF0aEJhc2U8QVNUPjtcblxuZnVuY3Rpb24gZmluZEFzdEF0KGFzdDogQVNULCBwb3NpdGlvbjogbnVtYmVyLCBleGNsdWRlRW1wdHk6IGJvb2xlYW4gPSBmYWxzZSk6IEFzdFBhdGgge1xuICBjb25zdCBwYXRoOiBBU1RbXSA9IFtdO1xuICBjb25zdCB2aXNpdG9yID0gbmV3IGNsYXNzIGV4dGVuZHMgTnVsbEFzdFZpc2l0b3Ige1xuICAgIHZpc2l0KGFzdDogQVNUKSB7XG4gICAgICBpZiAoKCFleGNsdWRlRW1wdHkgfHwgYXN0LnNwYW4uc3RhcnQgPCBhc3Quc3Bhbi5lbmQpICYmIGluU3Bhbihwb3NpdGlvbiwgYXN0LnNwYW4pKSB7XG4gICAgICAgIHBhdGgucHVzaChhc3QpO1xuICAgICAgICB2aXNpdEFzdENoaWxkcmVuKGFzdCwgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFdlIG5ldmVyIGNhcmUgYWJvdXQgdGhlIEFTVFdpdGhTb3VyY2Ugbm9kZSBhbmQgaXRzIHZpc2l0KCkgbWV0aG9kIGNhbGxzIGl0cyBhc3QncyB2aXNpdCBzb1xuICAvLyB0aGUgdmlzaXQoKSBtZXRob2QgYWJvdmUgd291bGQgbmV2ZXIgc2VlIGl0LlxuICBpZiAoYXN0IGluc3RhbmNlb2YgQVNUV2l0aFNvdXJjZSkge1xuICAgIGFzdCA9IGFzdC5hc3Q7XG4gIH1cblxuICB2aXNpdG9yLnZpc2l0KGFzdCk7XG5cbiAgcmV0dXJuIG5ldyBBc3RQYXRoQmFzZTxBU1Q+KHBhdGgsIHBvc2l0aW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4cHJlc3Npb25Db21wbGV0aW9ucyhcbiAgICBzY29wZTogU3ltYm9sVGFibGUsIGFzdDogQVNULCBwb3NpdGlvbjogbnVtYmVyLCBxdWVyeTogU3ltYm9sUXVlcnkpOiBTeW1ib2xbXXx1bmRlZmluZWQge1xuICBjb25zdCBwYXRoID0gZmluZEFzdEF0KGFzdCwgcG9zaXRpb24pO1xuICBpZiAocGF0aC5lbXB0eSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgdGFpbCA9IHBhdGgudGFpbCAhO1xuICBsZXQgcmVzdWx0OiBTeW1ib2xUYWJsZXx1bmRlZmluZWQgPSBzY29wZTtcblxuICBmdW5jdGlvbiBnZXRUeXBlKGFzdDogQVNUKTogU3ltYm9sIHsgcmV0dXJuIG5ldyBBc3RUeXBlKHNjb3BlLCBxdWVyeSwge30pLmdldFR5cGUoYXN0KTsgfVxuXG4gIC8vIElmIHRoZSBjb21wbGV0aW9uIHJlcXVlc3QgaXMgaW4gYSBub3QgaW4gYSBwaXBlIG9yIHByb3BlcnR5IGFjY2VzcyB0aGVuIHRoZSBnbG9iYWwgc2NvcGVcbiAgLy8gKHRoYXQgaXMgdGhlIHNjb3BlIG9mIHRoZSBpbXBsaWNpdCByZWNlaXZlcikgaXMgdGhlIHJpZ2h0IHNjb3BlIGFzIHRoZSB1c2VyIGlzIHR5cGluZyB0aGVcbiAgLy8gYmVnaW5uaW5nIG9mIGFuIGV4cHJlc3Npb24uXG4gIHRhaWwudmlzaXQoe1xuICAgIHZpc2l0QmluYXJ5KGFzdCkge30sXG4gICAgdmlzaXRDaGFpbihhc3QpIHt9LFxuICAgIHZpc2l0Q29uZGl0aW9uYWwoYXN0KSB7fSxcbiAgICB2aXNpdEZ1bmN0aW9uQ2FsbChhc3QpIHt9LFxuICAgIHZpc2l0SW1wbGljaXRSZWNlaXZlcihhc3QpIHt9LFxuICAgIHZpc2l0SW50ZXJwb2xhdGlvbihhc3QpIHsgcmVzdWx0ID0gdW5kZWZpbmVkOyB9LFxuICAgIHZpc2l0S2V5ZWRSZWFkKGFzdCkge30sXG4gICAgdmlzaXRLZXllZFdyaXRlKGFzdCkge30sXG4gICAgdmlzaXRMaXRlcmFsQXJyYXkoYXN0KSB7fSxcbiAgICB2aXNpdExpdGVyYWxNYXAoYXN0KSB7fSxcbiAgICB2aXNpdExpdGVyYWxQcmltaXRpdmUoYXN0KSB7fSxcbiAgICB2aXNpdE1ldGhvZENhbGwoYXN0KSB7fSxcbiAgICB2aXNpdFBpcGUoYXN0KSB7XG4gICAgICBpZiAocG9zaXRpb24gPj0gYXN0LmV4cC5zcGFuLmVuZCAmJlxuICAgICAgICAgICghYXN0LmFyZ3MgfHwgIWFzdC5hcmdzLmxlbmd0aCB8fCBwb3NpdGlvbiA8ICg8QVNUPmFzdC5hcmdzWzBdKS5zcGFuLnN0YXJ0KSkge1xuICAgICAgICAvLyBXZSBhcmUgaW4gYSBwb3NpdGlvbiBhIHBpcGUgbmFtZSBpcyBleHBlY3RlZC5cbiAgICAgICAgcmVzdWx0ID0gcXVlcnkuZ2V0UGlwZXMoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHZpc2l0UHJlZml4Tm90KGFzdCkge30sXG4gICAgdmlzaXROb25OdWxsQXNzZXJ0KGFzdCkge30sXG4gICAgdmlzaXRQcm9wZXJ0eVJlYWQoYXN0KSB7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBnZXRUeXBlKGFzdC5yZWNlaXZlcik7XG4gICAgICByZXN1bHQgPSByZWNlaXZlclR5cGUgPyByZWNlaXZlclR5cGUubWVtYmVycygpIDogc2NvcGU7XG4gICAgfSxcbiAgICB2aXNpdFByb3BlcnR5V3JpdGUoYXN0KSB7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBnZXRUeXBlKGFzdC5yZWNlaXZlcik7XG4gICAgICByZXN1bHQgPSByZWNlaXZlclR5cGUgPyByZWNlaXZlclR5cGUubWVtYmVycygpIDogc2NvcGU7XG4gICAgfSxcbiAgICB2aXNpdFF1b3RlKGFzdCkge1xuICAgICAgLy8gRm9yIGEgcXVvdGUsIHJldHVybiB0aGUgbWVtYmVycyBvZiBhbnkgKGlmIHRoZXJlIGFyZSBhbnkpLlxuICAgICAgcmVzdWx0ID0gcXVlcnkuZ2V0QnVpbHRpblR5cGUoQnVpbHRpblR5cGUuQW55KS5tZW1iZXJzKCk7XG4gICAgfSxcbiAgICB2aXNpdFNhZmVNZXRob2RDYWxsKGFzdCkge1xuICAgICAgY29uc3QgcmVjZWl2ZXJUeXBlID0gZ2V0VHlwZShhc3QucmVjZWl2ZXIpO1xuICAgICAgcmVzdWx0ID0gcmVjZWl2ZXJUeXBlID8gcmVjZWl2ZXJUeXBlLm1lbWJlcnMoKSA6IHNjb3BlO1xuICAgIH0sXG4gICAgdmlzaXRTYWZlUHJvcGVydHlSZWFkKGFzdCkge1xuICAgICAgY29uc3QgcmVjZWl2ZXJUeXBlID0gZ2V0VHlwZShhc3QucmVjZWl2ZXIpO1xuICAgICAgcmVzdWx0ID0gcmVjZWl2ZXJUeXBlID8gcmVjZWl2ZXJUeXBlLm1lbWJlcnMoKSA6IHNjb3BlO1xuICAgIH0sXG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQgJiYgcmVzdWx0LnZhbHVlcygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXhwcmVzc2lvblN5bWJvbChcbiAgICBzY29wZTogU3ltYm9sVGFibGUsIGFzdDogQVNULCBwb3NpdGlvbjogbnVtYmVyLFxuICAgIHF1ZXJ5OiBTeW1ib2xRdWVyeSk6IHtzeW1ib2w6IFN5bWJvbCwgc3BhbjogU3Bhbn18dW5kZWZpbmVkIHtcbiAgY29uc3QgcGF0aCA9IGZpbmRBc3RBdChhc3QsIHBvc2l0aW9uLCAvKiBleGNsdWRlRW1wdHkgKi8gdHJ1ZSk7XG4gIGlmIChwYXRoLmVtcHR5KSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCB0YWlsID0gcGF0aC50YWlsICE7XG5cbiAgZnVuY3Rpb24gZ2V0VHlwZShhc3Q6IEFTVCk6IFN5bWJvbCB7IHJldHVybiBuZXcgQXN0VHlwZShzY29wZSwgcXVlcnksIHt9KS5nZXRUeXBlKGFzdCk7IH1cblxuICBsZXQgc3ltYm9sOiBTeW1ib2x8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgc3BhbjogU3Bhbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgLy8gSWYgdGhlIGNvbXBsZXRpb24gcmVxdWVzdCBpcyBpbiBhIG5vdCBpbiBhIHBpcGUgb3IgcHJvcGVydHkgYWNjZXNzIHRoZW4gdGhlIGdsb2JhbCBzY29wZVxuICAvLyAodGhhdCBpcyB0aGUgc2NvcGUgb2YgdGhlIGltcGxpY2l0IHJlY2VpdmVyKSBpcyB0aGUgcmlnaHQgc2NvcGUgYXMgdGhlIHVzZXIgaXMgdHlwaW5nIHRoZVxuICAvLyBiZWdpbm5pbmcgb2YgYW4gZXhwcmVzc2lvbi5cbiAgdGFpbC52aXNpdCh7XG4gICAgdmlzaXRCaW5hcnkoYXN0KSB7fSxcbiAgICB2aXNpdENoYWluKGFzdCkge30sXG4gICAgdmlzaXRDb25kaXRpb25hbChhc3QpIHt9LFxuICAgIHZpc2l0RnVuY3Rpb25DYWxsKGFzdCkge30sXG4gICAgdmlzaXRJbXBsaWNpdFJlY2VpdmVyKGFzdCkge30sXG4gICAgdmlzaXRJbnRlcnBvbGF0aW9uKGFzdCkge30sXG4gICAgdmlzaXRLZXllZFJlYWQoYXN0KSB7fSxcbiAgICB2aXNpdEtleWVkV3JpdGUoYXN0KSB7fSxcbiAgICB2aXNpdExpdGVyYWxBcnJheShhc3QpIHt9LFxuICAgIHZpc2l0TGl0ZXJhbE1hcChhc3QpIHt9LFxuICAgIHZpc2l0TGl0ZXJhbFByaW1pdGl2ZShhc3QpIHt9LFxuICAgIHZpc2l0TWV0aG9kQ2FsbChhc3QpIHtcbiAgICAgIGNvbnN0IHJlY2VpdmVyVHlwZSA9IGdldFR5cGUoYXN0LnJlY2VpdmVyKTtcbiAgICAgIHN5bWJvbCA9IHJlY2VpdmVyVHlwZSAmJiByZWNlaXZlclR5cGUubWVtYmVycygpLmdldChhc3QubmFtZSk7XG4gICAgICBzcGFuID0gYXN0LnNwYW47XG4gICAgfSxcbiAgICB2aXNpdFBpcGUoYXN0KSB7XG4gICAgICBpZiAocG9zaXRpb24gPj0gYXN0LmV4cC5zcGFuLmVuZCAmJlxuICAgICAgICAgICghYXN0LmFyZ3MgfHwgIWFzdC5hcmdzLmxlbmd0aCB8fCBwb3NpdGlvbiA8ICg8QVNUPmFzdC5hcmdzWzBdKS5zcGFuLnN0YXJ0KSkge1xuICAgICAgICAvLyBXZSBhcmUgaW4gYSBwb3NpdGlvbiBhIHBpcGUgbmFtZSBpcyBleHBlY3RlZC5cbiAgICAgICAgY29uc3QgcGlwZXMgPSBxdWVyeS5nZXRQaXBlcygpO1xuICAgICAgICBpZiAocGlwZXMpIHtcbiAgICAgICAgICBzeW1ib2wgPSBwaXBlcy5nZXQoYXN0Lm5hbWUpO1xuICAgICAgICAgIHNwYW4gPSBhc3Quc3BhbjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgdmlzaXRQcmVmaXhOb3QoYXN0KSB7fSxcbiAgICB2aXNpdE5vbk51bGxBc3NlcnQoYXN0KSB7fSxcbiAgICB2aXNpdFByb3BlcnR5UmVhZChhc3QpIHtcbiAgICAgIGNvbnN0IHJlY2VpdmVyVHlwZSA9IGdldFR5cGUoYXN0LnJlY2VpdmVyKTtcbiAgICAgIHN5bWJvbCA9IHJlY2VpdmVyVHlwZSAmJiByZWNlaXZlclR5cGUubWVtYmVycygpLmdldChhc3QubmFtZSk7XG4gICAgICBzcGFuID0gYXN0LnNwYW47XG4gICAgfSxcbiAgICB2aXNpdFByb3BlcnR5V3JpdGUoYXN0KSB7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBnZXRUeXBlKGFzdC5yZWNlaXZlcik7XG4gICAgICBzeW1ib2wgPSByZWNlaXZlclR5cGUgJiYgcmVjZWl2ZXJUeXBlLm1lbWJlcnMoKS5nZXQoYXN0Lm5hbWUpO1xuICAgICAgc3BhbiA9IGFzdC5zcGFuO1xuICAgIH0sXG4gICAgdmlzaXRRdW90ZShhc3QpIHt9LFxuICAgIHZpc2l0U2FmZU1ldGhvZENhbGwoYXN0KSB7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBnZXRUeXBlKGFzdC5yZWNlaXZlcik7XG4gICAgICBzeW1ib2wgPSByZWNlaXZlclR5cGUgJiYgcmVjZWl2ZXJUeXBlLm1lbWJlcnMoKS5nZXQoYXN0Lm5hbWUpO1xuICAgICAgc3BhbiA9IGFzdC5zcGFuO1xuICAgIH0sXG4gICAgdmlzaXRTYWZlUHJvcGVydHlSZWFkKGFzdCkge1xuICAgICAgY29uc3QgcmVjZWl2ZXJUeXBlID0gZ2V0VHlwZShhc3QucmVjZWl2ZXIpO1xuICAgICAgc3ltYm9sID0gcmVjZWl2ZXJUeXBlICYmIHJlY2VpdmVyVHlwZS5tZW1iZXJzKCkuZ2V0KGFzdC5uYW1lKTtcbiAgICAgIHNwYW4gPSBhc3Quc3BhbjtcbiAgICB9LFxuICB9KTtcblxuICBpZiAoc3ltYm9sICYmIHNwYW4pIHtcbiAgICByZXR1cm4ge3N5bWJvbCwgc3Bhbn07XG4gIH1cbn1cbiJdfQ==