"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const ts = require("typescript");
/**
 * @deprecated From 0.9.0
 */
function testImportTslib(content) {
    const regex = /var (__extends|__decorate|__metadata|__param) = \(.*\r?\n\s+(.*\r?\n)*\s*\};/;
    return regex.test(content);
}
exports.testImportTslib = testImportTslib;
function getImportTslibTransformer() {
    return (context) => {
        const transformer = (sf) => {
            const tslibImports = [];
            // Check if module has CJS exports. If so, use 'require()' instead of 'import'.
            const useRequire = /exports.\S+\s*=/.test(sf.getText());
            const visitor = (node) => {
                // Check if node is a TS helper declaration and replace with import if yes
                if (ts.isVariableStatement(node)) {
                    const declarations = node.declarationList.declarations;
                    if (declarations.length === 1 && ts.isIdentifier(declarations[0].name)) {
                        const name = declarations[0].name.text;
                        if (isHelperName(name)) {
                            // TODO: maybe add a few more checks, like checking the first part of the assignment.
                            const tslibImport = createTslibImport(name, useRequire);
                            tslibImports.push(tslibImport);
                            return undefined;
                        }
                    }
                }
                return ts.visitEachChild(node, visitor, context);
            };
            const sfUpdated = ts.visitEachChild(sf, visitor, context);
            // Add tslib imports before any other statement
            return tslibImports.length > 0
                ? ts.updateSourceFileNode(sfUpdated, [
                    ...tslibImports,
                    ...sfUpdated.statements,
                ])
                : sfUpdated;
        };
        return transformer;
    };
}
exports.getImportTslibTransformer = getImportTslibTransformer;
function createTslibImport(name, useRequire = false) {
    if (useRequire) {
        // Use `var __helper = /*@__PURE__*/ require("tslib").__helper`.
        const requireCall = ts.createCall(ts.createIdentifier('require'), undefined, [ts.createLiteral('tslib')]);
        const pureRequireCall = ts.addSyntheticLeadingComment(requireCall, ts.SyntaxKind.MultiLineCommentTrivia, '@__PURE__', false);
        const helperAccess = ts.createPropertyAccess(pureRequireCall, name);
        const variableDeclaration = ts.createVariableDeclaration(name, undefined, helperAccess);
        const variableStatement = ts.createVariableStatement(undefined, [variableDeclaration]);
        return variableStatement;
    }
    else {
        // Use `import { __helper } from "tslib"`.
        const namedImports = ts.createNamedImports([ts.createImportSpecifier(undefined, ts.createIdentifier(name))]);
        const importClause = ts.createImportClause(undefined, namedImports);
        const newNode = ts.createImportDeclaration(undefined, undefined, importClause, ts.createLiteral('tslib'));
        return newNode;
    }
}
function isHelperName(name) {
    // TODO: there are more helpers than these, should we replace them all?
    const tsHelpers = [
        '__extends',
        '__decorate',
        '__metadata',
        '__param',
    ];
    return tsHelpers.indexOf(name) !== -1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXRzbGliLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9vcHRpbWl6ZXIvc3JjL3RyYW5zZm9ybXMvaW1wb3J0LXRzbGliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsaUNBQWlDO0FBRWpDOztHQUVHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLE9BQWU7SUFDN0MsTUFBTSxLQUFLLEdBQUcsOEVBQThFLENBQUM7SUFFN0YsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFKRCwwQ0FJQztBQUVELFNBQWdCLHlCQUF5QjtJQUN2QyxPQUFPLENBQUMsT0FBaUMsRUFBaUMsRUFBRTtRQUUxRSxNQUFNLFdBQVcsR0FBa0MsQ0FBQyxFQUFpQixFQUFFLEVBQUU7WUFFdkUsTUFBTSxZQUFZLEdBQW9ELEVBQUUsQ0FBQztZQUV6RSwrRUFBK0U7WUFDL0UsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRXhELE1BQU0sT0FBTyxHQUFlLENBQUMsSUFBYSxFQUF1QixFQUFFO2dCQUVqRSwwRUFBMEU7Z0JBQzFFLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNoQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQztvQkFFdkQsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDdEUsTUFBTSxJQUFJLEdBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQXNCLENBQUMsSUFBSSxDQUFDO3dCQUUxRCxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRTs0QkFDdEIscUZBQXFGOzRCQUNyRixNQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7NEJBQ3hELFlBQVksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7NEJBRS9CLE9BQU8sU0FBUyxDQUFDO3lCQUNsQjtxQkFDRjtpQkFDRjtnQkFFRCxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUM7WUFFRixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFMUQsK0NBQStDO1lBQy9DLE9BQU8sWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUM1QixDQUFDLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRTtvQkFDbkMsR0FBRyxZQUFZO29CQUNmLEdBQUcsU0FBUyxDQUFDLFVBQVU7aUJBQ3hCLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNoQixDQUFDLENBQUM7UUFFRixPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDLENBQUM7QUFDSixDQUFDO0FBN0NELDhEQTZDQztBQUVELFNBQVMsaUJBQWlCLENBQ3hCLElBQVksRUFDWixVQUFVLEdBQUcsS0FBSztJQUVsQixJQUFJLFVBQVUsRUFBRTtRQUNkLGdFQUFnRTtRQUNoRSxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxTQUFTLEVBQ3pFLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0IsTUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDLDBCQUEwQixDQUNuRCxXQUFXLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBc0IsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekUsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNwRSxNQUFNLG1CQUFtQixHQUFHLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3hGLE1BQU0saUJBQWlCLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztRQUV2RixPQUFPLGlCQUFpQixDQUFDO0tBQzFCO1NBQU07UUFDTCwwQ0FBMEM7UUFDMUMsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsRUFDNUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9CLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDcEUsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUMzRSxFQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFN0IsT0FBTyxPQUFPLENBQUM7S0FDaEI7QUFDSCxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBWTtJQUNoQyx1RUFBdUU7SUFDdkUsTUFBTSxTQUFTLEdBQUc7UUFDaEIsV0FBVztRQUNYLFlBQVk7UUFDWixZQUFZO1FBQ1osU0FBUztLQUNWLENBQUM7SUFFRixPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDeEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKipcbiAqIEBkZXByZWNhdGVkIEZyb20gMC45LjBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlc3RJbXBvcnRUc2xpYihjb250ZW50OiBzdHJpbmcpIHtcbiAgY29uc3QgcmVnZXggPSAvdmFyIChfX2V4dGVuZHN8X19kZWNvcmF0ZXxfX21ldGFkYXRhfF9fcGFyYW0pID0gXFwoLipcXHI/XFxuXFxzKyguKlxccj9cXG4pKlxccypcXH07LztcblxuICByZXR1cm4gcmVnZXgudGVzdChjb250ZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEltcG9ydFRzbGliVHJhbnNmb3JtZXIoKTogdHMuVHJhbnNmb3JtZXJGYWN0b3J5PHRzLlNvdXJjZUZpbGU+IHtcbiAgcmV0dXJuIChjb250ZXh0OiB0cy5UcmFuc2Zvcm1hdGlvbkNvbnRleHQpOiB0cy5UcmFuc2Zvcm1lcjx0cy5Tb3VyY2VGaWxlPiA9PiB7XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1lcjogdHMuVHJhbnNmb3JtZXI8dHMuU291cmNlRmlsZT4gPSAoc2Y6IHRzLlNvdXJjZUZpbGUpID0+IHtcblxuICAgICAgY29uc3QgdHNsaWJJbXBvcnRzOiAodHMuVmFyaWFibGVTdGF0ZW1lbnQgfCB0cy5JbXBvcnREZWNsYXJhdGlvbilbXSA9IFtdO1xuXG4gICAgICAvLyBDaGVjayBpZiBtb2R1bGUgaGFzIENKUyBleHBvcnRzLiBJZiBzbywgdXNlICdyZXF1aXJlKCknIGluc3RlYWQgb2YgJ2ltcG9ydCcuXG4gICAgICBjb25zdCB1c2VSZXF1aXJlID0gL2V4cG9ydHMuXFxTK1xccyo9Ly50ZXN0KHNmLmdldFRleHQoKSk7XG5cbiAgICAgIGNvbnN0IHZpc2l0b3I6IHRzLlZpc2l0b3IgPSAobm9kZTogdHMuTm9kZSk6IHRzLk5vZGUgfCB1bmRlZmluZWQgPT4ge1xuXG4gICAgICAgIC8vIENoZWNrIGlmIG5vZGUgaXMgYSBUUyBoZWxwZXIgZGVjbGFyYXRpb24gYW5kIHJlcGxhY2Ugd2l0aCBpbXBvcnQgaWYgeWVzXG4gICAgICAgIGlmICh0cy5pc1ZhcmlhYmxlU3RhdGVtZW50KG5vZGUpKSB7XG4gICAgICAgICAgY29uc3QgZGVjbGFyYXRpb25zID0gbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zO1xuXG4gICAgICAgICAgaWYgKGRlY2xhcmF0aW9ucy5sZW5ndGggPT09IDEgJiYgdHMuaXNJZGVudGlmaWVyKGRlY2xhcmF0aW9uc1swXS5uYW1lKSkge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChkZWNsYXJhdGlvbnNbMF0ubmFtZSBhcyB0cy5JZGVudGlmaWVyKS50ZXh0O1xuXG4gICAgICAgICAgICBpZiAoaXNIZWxwZXJOYW1lKG5hbWUpKSB7XG4gICAgICAgICAgICAgIC8vIFRPRE86IG1heWJlIGFkZCBhIGZldyBtb3JlIGNoZWNrcywgbGlrZSBjaGVja2luZyB0aGUgZmlyc3QgcGFydCBvZiB0aGUgYXNzaWdubWVudC5cbiAgICAgICAgICAgICAgY29uc3QgdHNsaWJJbXBvcnQgPSBjcmVhdGVUc2xpYkltcG9ydChuYW1lLCB1c2VSZXF1aXJlKTtcbiAgICAgICAgICAgICAgdHNsaWJJbXBvcnRzLnB1c2godHNsaWJJbXBvcnQpO1xuXG4gICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRzLnZpc2l0RWFjaENoaWxkKG5vZGUsIHZpc2l0b3IsIGNvbnRleHQpO1xuICAgICAgfTtcblxuICAgICAgY29uc3Qgc2ZVcGRhdGVkID0gdHMudmlzaXRFYWNoQ2hpbGQoc2YsIHZpc2l0b3IsIGNvbnRleHQpO1xuXG4gICAgICAvLyBBZGQgdHNsaWIgaW1wb3J0cyBiZWZvcmUgYW55IG90aGVyIHN0YXRlbWVudFxuICAgICAgcmV0dXJuIHRzbGliSW1wb3J0cy5sZW5ndGggPiAwXG4gICAgICAgID8gdHMudXBkYXRlU291cmNlRmlsZU5vZGUoc2ZVcGRhdGVkLCBbXG4gICAgICAgICAgLi4udHNsaWJJbXBvcnRzLFxuICAgICAgICAgIC4uLnNmVXBkYXRlZC5zdGF0ZW1lbnRzLFxuICAgICAgICBdKVxuICAgICAgICA6IHNmVXBkYXRlZDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRyYW5zZm9ybWVyO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUc2xpYkltcG9ydChcbiAgbmFtZTogc3RyaW5nLFxuICB1c2VSZXF1aXJlID0gZmFsc2UsXG4pOiB0cy5WYXJpYWJsZVN0YXRlbWVudCB8IHRzLkltcG9ydERlY2xhcmF0aW9uIHtcbiAgaWYgKHVzZVJlcXVpcmUpIHtcbiAgICAvLyBVc2UgYHZhciBfX2hlbHBlciA9IC8qQF9fUFVSRV9fKi8gcmVxdWlyZShcInRzbGliXCIpLl9faGVscGVyYC5cbiAgICBjb25zdCByZXF1aXJlQ2FsbCA9IHRzLmNyZWF0ZUNhbGwodHMuY3JlYXRlSWRlbnRpZmllcigncmVxdWlyZScpLCB1bmRlZmluZWQsXG4gICAgICBbdHMuY3JlYXRlTGl0ZXJhbCgndHNsaWInKV0pO1xuICAgIGNvbnN0IHB1cmVSZXF1aXJlQ2FsbCA9IHRzLmFkZFN5bnRoZXRpY0xlYWRpbmdDb21tZW50KFxuICAgICAgcmVxdWlyZUNhbGwsIHRzLlN5bnRheEtpbmQuTXVsdGlMaW5lQ29tbWVudFRyaXZpYSwgJ0BfX1BVUkVfXycsIGZhbHNlKTtcbiAgICBjb25zdCBoZWxwZXJBY2Nlc3MgPSB0cy5jcmVhdGVQcm9wZXJ0eUFjY2VzcyhwdXJlUmVxdWlyZUNhbGwsIG5hbWUpO1xuICAgIGNvbnN0IHZhcmlhYmxlRGVjbGFyYXRpb24gPSB0cy5jcmVhdGVWYXJpYWJsZURlY2xhcmF0aW9uKG5hbWUsIHVuZGVmaW5lZCwgaGVscGVyQWNjZXNzKTtcbiAgICBjb25zdCB2YXJpYWJsZVN0YXRlbWVudCA9IHRzLmNyZWF0ZVZhcmlhYmxlU3RhdGVtZW50KHVuZGVmaW5lZCwgW3ZhcmlhYmxlRGVjbGFyYXRpb25dKTtcblxuICAgIHJldHVybiB2YXJpYWJsZVN0YXRlbWVudDtcbiAgfSBlbHNlIHtcbiAgICAvLyBVc2UgYGltcG9ydCB7IF9faGVscGVyIH0gZnJvbSBcInRzbGliXCJgLlxuICAgIGNvbnN0IG5hbWVkSW1wb3J0cyA9IHRzLmNyZWF0ZU5hbWVkSW1wb3J0cyhbdHMuY3JlYXRlSW1wb3J0U3BlY2lmaWVyKHVuZGVmaW5lZCxcbiAgICAgIHRzLmNyZWF0ZUlkZW50aWZpZXIobmFtZSkpXSk7XG4gICAgY29uc3QgaW1wb3J0Q2xhdXNlID0gdHMuY3JlYXRlSW1wb3J0Q2xhdXNlKHVuZGVmaW5lZCwgbmFtZWRJbXBvcnRzKTtcbiAgICBjb25zdCBuZXdOb2RlID0gdHMuY3JlYXRlSW1wb3J0RGVjbGFyYXRpb24odW5kZWZpbmVkLCB1bmRlZmluZWQsIGltcG9ydENsYXVzZSxcbiAgICAgIHRzLmNyZWF0ZUxpdGVyYWwoJ3RzbGliJykpO1xuXG4gICAgcmV0dXJuIG5ld05vZGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNIZWxwZXJOYW1lKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAvLyBUT0RPOiB0aGVyZSBhcmUgbW9yZSBoZWxwZXJzIHRoYW4gdGhlc2UsIHNob3VsZCB3ZSByZXBsYWNlIHRoZW0gYWxsP1xuICBjb25zdCB0c0hlbHBlcnMgPSBbXG4gICAgJ19fZXh0ZW5kcycsXG4gICAgJ19fZGVjb3JhdGUnLFxuICAgICdfX21ldGFkYXRhJyxcbiAgICAnX19wYXJhbScsXG4gIF07XG5cbiAgcmV0dXJuIHRzSGVscGVycy5pbmRleE9mKG5hbWUpICE9PSAtMTtcbn1cbiJdfQ==