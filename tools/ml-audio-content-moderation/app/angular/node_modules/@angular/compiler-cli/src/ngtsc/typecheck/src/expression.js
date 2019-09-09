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
        define("@angular/compiler-cli/src/ngtsc/typecheck/src/expression", ["require", "exports", "@angular/compiler", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var compiler_1 = require("@angular/compiler");
    var ts = require("typescript");
    var BINARY_OPS = new Map([
        ['+', ts.SyntaxKind.PlusToken],
        ['-', ts.SyntaxKind.MinusToken],
        ['<', ts.SyntaxKind.LessThanToken],
        ['>', ts.SyntaxKind.GreaterThanToken],
        ['<=', ts.SyntaxKind.LessThanEqualsToken],
        ['>=', ts.SyntaxKind.GreaterThanEqualsToken],
        ['==', ts.SyntaxKind.EqualsEqualsToken],
        ['===', ts.SyntaxKind.EqualsEqualsEqualsToken],
        ['*', ts.SyntaxKind.AsteriskToken],
        ['/', ts.SyntaxKind.SlashToken],
        ['%', ts.SyntaxKind.PercentToken],
        ['!=', ts.SyntaxKind.ExclamationEqualsToken],
        ['!==', ts.SyntaxKind.ExclamationEqualsEqualsToken],
        ['||', ts.SyntaxKind.BarBarToken],
        ['&&', ts.SyntaxKind.AmpersandAmpersandToken],
        ['&', ts.SyntaxKind.AmpersandToken],
        ['|', ts.SyntaxKind.BarToken],
    ]);
    /**
     * Convert an `AST` to TypeScript code directly, without going through an intermediate `Expression`
     * AST.
     */
    function astToTypescript(ast, maybeResolve) {
        var resolved = maybeResolve(ast);
        if (resolved !== null) {
            return resolved;
        }
        // Branch based on the type of expression being processed.
        if (ast instanceof compiler_1.ASTWithSource) {
            // Fall through to the underlying AST.
            return astToTypescript(ast.ast, maybeResolve);
        }
        else if (ast instanceof compiler_1.PropertyRead) {
            // This is a normal property read - convert the receiver to an expression and emit the correct
            // TypeScript expression to read the property.
            var receiver = astToTypescript(ast.receiver, maybeResolve);
            return ts.createPropertyAccess(receiver, ast.name);
        }
        else if (ast instanceof compiler_1.Interpolation) {
            return astArrayToExpression(ast.expressions, maybeResolve);
        }
        else if (ast instanceof compiler_1.Binary) {
            var lhs = astToTypescript(ast.left, maybeResolve);
            var rhs = astToTypescript(ast.right, maybeResolve);
            var op = BINARY_OPS.get(ast.operation);
            if (op === undefined) {
                throw new Error("Unsupported Binary.operation: " + ast.operation);
            }
            return ts.createBinary(lhs, op, rhs);
        }
        else if (ast instanceof compiler_1.LiteralPrimitive) {
            if (ast.value === undefined) {
                return ts.createIdentifier('undefined');
            }
            else if (ast.value === null) {
                return ts.createNull();
            }
            else {
                return ts.createLiteral(ast.value);
            }
        }
        else if (ast instanceof compiler_1.MethodCall) {
            var receiver = astToTypescript(ast.receiver, maybeResolve);
            var method = ts.createPropertyAccess(receiver, ast.name);
            var args = ast.args.map(function (expr) { return astToTypescript(expr, maybeResolve); });
            return ts.createCall(method, undefined, args);
        }
        else if (ast instanceof compiler_1.Conditional) {
            var condExpr = astToTypescript(ast.condition, maybeResolve);
            var trueExpr = astToTypescript(ast.trueExp, maybeResolve);
            var falseExpr = astToTypescript(ast.falseExp, maybeResolve);
            return ts.createParen(ts.createConditional(condExpr, trueExpr, falseExpr));
        }
        else {
            throw new Error("Unknown node type: " + Object.getPrototypeOf(ast).constructor);
        }
    }
    exports.astToTypescript = astToTypescript;
    /**
     * Convert an array of `AST` expressions into a single `ts.Expression`, by converting them all
     * and separating them with commas.
     */
    function astArrayToExpression(astArray, maybeResolve) {
        // Reduce the `asts` array into a `ts.Expression`. Multiple expressions are combined into a
        // `ts.BinaryExpression` with a comma separator. First make a copy of the input array, as
        // it will be modified during the reduction.
        var asts = astArray.slice();
        return asts.reduce(function (lhs, ast) {
            return ts.createBinary(lhs, ts.SyntaxKind.CommaToken, astToTypescript(ast, maybeResolve));
        }, astToTypescript(asts.pop(), maybeResolve));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvdHlwZWNoZWNrL3NyYy9leHByZXNzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsOENBQXFJO0lBQ3JJLCtCQUFpQztJQUVqQyxJQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBd0I7UUFDaEQsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7UUFDOUIsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDL0IsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUM7UUFDbEMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQztRQUNyQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDO1FBQ3pDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQXNCLENBQUM7UUFDNUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQztRQUN2QyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDO1FBQzlDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1FBQ2xDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDO1FBQy9CLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDO1FBQ2pDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQXNCLENBQUM7UUFDNUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyw0QkFBNEIsQ0FBQztRQUNuRCxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztRQUNqQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDO1FBQzdDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDO1FBQ25DLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO0tBQzlCLENBQUMsQ0FBQztJQUVIOzs7T0FHRztJQUNILFNBQWdCLGVBQWUsQ0FDM0IsR0FBUSxFQUFFLFlBQWdEO1FBQzVELElBQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQyxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUU7WUFDckIsT0FBTyxRQUFRLENBQUM7U0FDakI7UUFDRCwwREFBMEQ7UUFDMUQsSUFBSSxHQUFHLFlBQVksd0JBQWEsRUFBRTtZQUNoQyxzQ0FBc0M7WUFDdEMsT0FBTyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUMvQzthQUFNLElBQUksR0FBRyxZQUFZLHVCQUFZLEVBQUU7WUFDdEMsOEZBQThGO1lBQzlGLDhDQUE4QztZQUM5QyxJQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUM3RCxPQUFPLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3BEO2FBQU0sSUFBSSxHQUFHLFlBQVksd0JBQWEsRUFBRTtZQUN2QyxPQUFPLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDNUQ7YUFBTSxJQUFJLEdBQUcsWUFBWSxpQkFBTSxFQUFFO1lBQ2hDLElBQU0sR0FBRyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3BELElBQU0sR0FBRyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3JELElBQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pDLElBQUksRUFBRSxLQUFLLFNBQVMsRUFBRTtnQkFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBaUMsR0FBRyxDQUFDLFNBQVcsQ0FBQyxDQUFDO2FBQ25FO1lBQ0QsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxFQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDN0M7YUFBTSxJQUFJLEdBQUcsWUFBWSwyQkFBZ0IsRUFBRTtZQUMxQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO2dCQUMzQixPQUFPLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUN6QztpQkFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssSUFBSSxFQUFFO2dCQUM3QixPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQzthQUN4QjtpQkFBTTtnQkFDTCxPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3BDO1NBQ0Y7YUFBTSxJQUFJLEdBQUcsWUFBWSxxQkFBVSxFQUFFO1lBQ3BDLElBQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzdELElBQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNELElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsSUFBSSxJQUFJLE9BQUEsZUFBZSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsRUFBbkMsQ0FBbUMsQ0FBQyxDQUFDO1lBQ3ZFLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQy9DO2FBQU0sSUFBSSxHQUFHLFlBQVksc0JBQVcsRUFBRTtZQUNyQyxJQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUM5RCxJQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUM1RCxJQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUM5RCxPQUFPLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztTQUM1RTthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBc0IsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFhLENBQUMsQ0FBQztTQUNqRjtJQUNILENBQUM7SUE5Q0QsMENBOENDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBUyxvQkFBb0IsQ0FDekIsUUFBZSxFQUFFLFlBQWdEO1FBQ25FLDJGQUEyRjtRQUMzRix5RkFBeUY7UUFDekYsNENBQTRDO1FBQzVDLElBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQ2QsVUFBQyxHQUFHLEVBQUUsR0FBRztZQUNMLE9BQUEsRUFBRSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUFsRixDQUFrRixFQUN0RixlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBU1QsIEFTVFdpdGhTb3VyY2UsIEJpbmFyeSwgQ29uZGl0aW9uYWwsIEludGVycG9sYXRpb24sIExpdGVyYWxQcmltaXRpdmUsIE1ldGhvZENhbGwsIFByb3BlcnR5UmVhZH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmNvbnN0IEJJTkFSWV9PUFMgPSBuZXcgTWFwPHN0cmluZywgdHMuU3ludGF4S2luZD4oW1xuICBbJysnLCB0cy5TeW50YXhLaW5kLlBsdXNUb2tlbl0sXG4gIFsnLScsIHRzLlN5bnRheEtpbmQuTWludXNUb2tlbl0sXG4gIFsnPCcsIHRzLlN5bnRheEtpbmQuTGVzc1RoYW5Ub2tlbl0sXG4gIFsnPicsIHRzLlN5bnRheEtpbmQuR3JlYXRlclRoYW5Ub2tlbl0sXG4gIFsnPD0nLCB0cy5TeW50YXhLaW5kLkxlc3NUaGFuRXF1YWxzVG9rZW5dLFxuICBbJz49JywgdHMuU3ludGF4S2luZC5HcmVhdGVyVGhhbkVxdWFsc1Rva2VuXSxcbiAgWyc9PScsIHRzLlN5bnRheEtpbmQuRXF1YWxzRXF1YWxzVG9rZW5dLFxuICBbJz09PScsIHRzLlN5bnRheEtpbmQuRXF1YWxzRXF1YWxzRXF1YWxzVG9rZW5dLFxuICBbJyonLCB0cy5TeW50YXhLaW5kLkFzdGVyaXNrVG9rZW5dLFxuICBbJy8nLCB0cy5TeW50YXhLaW5kLlNsYXNoVG9rZW5dLFxuICBbJyUnLCB0cy5TeW50YXhLaW5kLlBlcmNlbnRUb2tlbl0sXG4gIFsnIT0nLCB0cy5TeW50YXhLaW5kLkV4Y2xhbWF0aW9uRXF1YWxzVG9rZW5dLFxuICBbJyE9PScsIHRzLlN5bnRheEtpbmQuRXhjbGFtYXRpb25FcXVhbHNFcXVhbHNUb2tlbl0sXG4gIFsnfHwnLCB0cy5TeW50YXhLaW5kLkJhckJhclRva2VuXSxcbiAgWycmJicsIHRzLlN5bnRheEtpbmQuQW1wZXJzYW5kQW1wZXJzYW5kVG9rZW5dLFxuICBbJyYnLCB0cy5TeW50YXhLaW5kLkFtcGVyc2FuZFRva2VuXSxcbiAgWyd8JywgdHMuU3ludGF4S2luZC5CYXJUb2tlbl0sXG5dKTtcblxuLyoqXG4gKiBDb252ZXJ0IGFuIGBBU1RgIHRvIFR5cGVTY3JpcHQgY29kZSBkaXJlY3RseSwgd2l0aG91dCBnb2luZyB0aHJvdWdoIGFuIGludGVybWVkaWF0ZSBgRXhwcmVzc2lvbmBcbiAqIEFTVC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzdFRvVHlwZXNjcmlwdChcbiAgICBhc3Q6IEFTVCwgbWF5YmVSZXNvbHZlOiAoYXN0OiBBU1QpID0+IHRzLkV4cHJlc3Npb24gfCBudWxsKTogdHMuRXhwcmVzc2lvbiB7XG4gIGNvbnN0IHJlc29sdmVkID0gbWF5YmVSZXNvbHZlKGFzdCk7XG4gIGlmIChyZXNvbHZlZCAhPT0gbnVsbCkge1xuICAgIHJldHVybiByZXNvbHZlZDtcbiAgfVxuICAvLyBCcmFuY2ggYmFzZWQgb24gdGhlIHR5cGUgb2YgZXhwcmVzc2lvbiBiZWluZyBwcm9jZXNzZWQuXG4gIGlmIChhc3QgaW5zdGFuY2VvZiBBU1RXaXRoU291cmNlKSB7XG4gICAgLy8gRmFsbCB0aHJvdWdoIHRvIHRoZSB1bmRlcmx5aW5nIEFTVC5cbiAgICByZXR1cm4gYXN0VG9UeXBlc2NyaXB0KGFzdC5hc3QsIG1heWJlUmVzb2x2ZSk7XG4gIH0gZWxzZSBpZiAoYXN0IGluc3RhbmNlb2YgUHJvcGVydHlSZWFkKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5vcm1hbCBwcm9wZXJ0eSByZWFkIC0gY29udmVydCB0aGUgcmVjZWl2ZXIgdG8gYW4gZXhwcmVzc2lvbiBhbmQgZW1pdCB0aGUgY29ycmVjdFxuICAgIC8vIFR5cGVTY3JpcHQgZXhwcmVzc2lvbiB0byByZWFkIHRoZSBwcm9wZXJ0eS5cbiAgICBjb25zdCByZWNlaXZlciA9IGFzdFRvVHlwZXNjcmlwdChhc3QucmVjZWl2ZXIsIG1heWJlUmVzb2x2ZSk7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKHJlY2VpdmVyLCBhc3QubmFtZSk7XG4gIH0gZWxzZSBpZiAoYXN0IGluc3RhbmNlb2YgSW50ZXJwb2xhdGlvbikge1xuICAgIHJldHVybiBhc3RBcnJheVRvRXhwcmVzc2lvbihhc3QuZXhwcmVzc2lvbnMsIG1heWJlUmVzb2x2ZSk7XG4gIH0gZWxzZSBpZiAoYXN0IGluc3RhbmNlb2YgQmluYXJ5KSB7XG4gICAgY29uc3QgbGhzID0gYXN0VG9UeXBlc2NyaXB0KGFzdC5sZWZ0LCBtYXliZVJlc29sdmUpO1xuICAgIGNvbnN0IHJocyA9IGFzdFRvVHlwZXNjcmlwdChhc3QucmlnaHQsIG1heWJlUmVzb2x2ZSk7XG4gICAgY29uc3Qgb3AgPSBCSU5BUllfT1BTLmdldChhc3Qub3BlcmF0aW9uKTtcbiAgICBpZiAob3AgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBCaW5hcnkub3BlcmF0aW9uOiAke2FzdC5vcGVyYXRpb259YCk7XG4gICAgfVxuICAgIHJldHVybiB0cy5jcmVhdGVCaW5hcnkobGhzLCBvcCBhcyBhbnksIHJocyk7XG4gIH0gZWxzZSBpZiAoYXN0IGluc3RhbmNlb2YgTGl0ZXJhbFByaW1pdGl2ZSkge1xuICAgIGlmIChhc3QudmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRzLmNyZWF0ZUlkZW50aWZpZXIoJ3VuZGVmaW5lZCcpO1xuICAgIH0gZWxzZSBpZiAoYXN0LnZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdHMuY3JlYXRlTnVsbCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHMuY3JlYXRlTGl0ZXJhbChhc3QudmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChhc3QgaW5zdGFuY2VvZiBNZXRob2RDYWxsKSB7XG4gICAgY29uc3QgcmVjZWl2ZXIgPSBhc3RUb1R5cGVzY3JpcHQoYXN0LnJlY2VpdmVyLCBtYXliZVJlc29sdmUpO1xuICAgIGNvbnN0IG1ldGhvZCA9IHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKHJlY2VpdmVyLCBhc3QubmFtZSk7XG4gICAgY29uc3QgYXJncyA9IGFzdC5hcmdzLm1hcChleHByID0+IGFzdFRvVHlwZXNjcmlwdChleHByLCBtYXliZVJlc29sdmUpKTtcbiAgICByZXR1cm4gdHMuY3JlYXRlQ2FsbChtZXRob2QsIHVuZGVmaW5lZCwgYXJncyk7XG4gIH0gZWxzZSBpZiAoYXN0IGluc3RhbmNlb2YgQ29uZGl0aW9uYWwpIHtcbiAgICBjb25zdCBjb25kRXhwciA9IGFzdFRvVHlwZXNjcmlwdChhc3QuY29uZGl0aW9uLCBtYXliZVJlc29sdmUpO1xuICAgIGNvbnN0IHRydWVFeHByID0gYXN0VG9UeXBlc2NyaXB0KGFzdC50cnVlRXhwLCBtYXliZVJlc29sdmUpO1xuICAgIGNvbnN0IGZhbHNlRXhwciA9IGFzdFRvVHlwZXNjcmlwdChhc3QuZmFsc2VFeHAsIG1heWJlUmVzb2x2ZSk7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVBhcmVuKHRzLmNyZWF0ZUNvbmRpdGlvbmFsKGNvbmRFeHByLCB0cnVlRXhwciwgZmFsc2VFeHByKSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIG5vZGUgdHlwZTogJHtPYmplY3QuZ2V0UHJvdG90eXBlT2YoYXN0KS5jb25zdHJ1Y3Rvcn1gKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnQgYW4gYXJyYXkgb2YgYEFTVGAgZXhwcmVzc2lvbnMgaW50byBhIHNpbmdsZSBgdHMuRXhwcmVzc2lvbmAsIGJ5IGNvbnZlcnRpbmcgdGhlbSBhbGxcbiAqIGFuZCBzZXBhcmF0aW5nIHRoZW0gd2l0aCBjb21tYXMuXG4gKi9cbmZ1bmN0aW9uIGFzdEFycmF5VG9FeHByZXNzaW9uKFxuICAgIGFzdEFycmF5OiBBU1RbXSwgbWF5YmVSZXNvbHZlOiAoYXN0OiBBU1QpID0+IHRzLkV4cHJlc3Npb24gfCBudWxsKTogdHMuRXhwcmVzc2lvbiB7XG4gIC8vIFJlZHVjZSB0aGUgYGFzdHNgIGFycmF5IGludG8gYSBgdHMuRXhwcmVzc2lvbmAuIE11bHRpcGxlIGV4cHJlc3Npb25zIGFyZSBjb21iaW5lZCBpbnRvIGFcbiAgLy8gYHRzLkJpbmFyeUV4cHJlc3Npb25gIHdpdGggYSBjb21tYSBzZXBhcmF0b3IuIEZpcnN0IG1ha2UgYSBjb3B5IG9mIHRoZSBpbnB1dCBhcnJheSwgYXNcbiAgLy8gaXQgd2lsbCBiZSBtb2RpZmllZCBkdXJpbmcgdGhlIHJlZHVjdGlvbi5cbiAgY29uc3QgYXN0cyA9IGFzdEFycmF5LnNsaWNlKCk7XG4gIHJldHVybiBhc3RzLnJlZHVjZShcbiAgICAgIChsaHMsIGFzdCkgPT5cbiAgICAgICAgICB0cy5jcmVhdGVCaW5hcnkobGhzLCB0cy5TeW50YXhLaW5kLkNvbW1hVG9rZW4sIGFzdFRvVHlwZXNjcmlwdChhc3QsIG1heWJlUmVzb2x2ZSkpLFxuICAgICAgYXN0VG9UeXBlc2NyaXB0KGFzdHMucG9wKCkgISwgbWF5YmVSZXNvbHZlKSk7XG59XG4iXX0=