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
const pureFunctionComment = '@__PURE__';
function getPrefixFunctionsTransformer() {
    return (context) => {
        const transformer = (sf) => {
            const topLevelFunctions = findTopLevelFunctions(sf);
            const visitor = (node) => {
                // Add pure function comment to top level functions.
                if (topLevelFunctions.has(node)) {
                    const newNode = ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, pureFunctionComment, false);
                    // Replace node with modified one.
                    return ts.visitEachChild(newNode, visitor, context);
                }
                // Otherwise return node as is.
                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitNode(sf, visitor);
        };
        return transformer;
    };
}
exports.getPrefixFunctionsTransformer = getPrefixFunctionsTransformer;
function findTopLevelFunctions(parentNode) {
    const topLevelFunctions = new Set();
    function cb(node) {
        // Stop recursing into this branch if it's a definition construct.
        // These are function expression, function declaration, class, or arrow function (lambda).
        // The body of these constructs will not execute when loading the module, so we don't
        // need to mark function calls inside them as pure.
        // Class static initializers in ES2015 are an exception we don't cover. They would need similar
        // processing as enums to prevent property setting from causing the class to be retained.
        if (ts.isFunctionDeclaration(node)
            || ts.isFunctionExpression(node)
            || ts.isClassDeclaration(node)
            || ts.isArrowFunction(node)
            || ts.isMethodDeclaration(node)) {
            return;
        }
        let noPureComment = !hasPureComment(node);
        let innerNode = node;
        while (innerNode && ts.isParenthesizedExpression(innerNode)) {
            innerNode = innerNode.expression;
            noPureComment = noPureComment && !hasPureComment(innerNode);
        }
        if (!innerNode) {
            return;
        }
        if (noPureComment) {
            if (ts.isNewExpression(innerNode)) {
                topLevelFunctions.add(node);
            }
            else if (ts.isCallExpression(innerNode)) {
                let expression = innerNode.expression;
                while (expression && ts.isParenthesizedExpression(expression)) {
                    expression = expression.expression;
                }
                if (expression) {
                    if (ts.isFunctionExpression(expression)) {
                        // Skip IIFE's with arguments
                        // This could be improved to check if there are any references to variables
                        if (innerNode.arguments.length === 0) {
                            topLevelFunctions.add(node);
                        }
                    }
                    else {
                        topLevelFunctions.add(node);
                    }
                }
            }
        }
        ts.forEachChild(innerNode, cb);
    }
    ts.forEachChild(parentNode, cb);
    return topLevelFunctions;
}
exports.findTopLevelFunctions = findTopLevelFunctions;
function hasPureComment(node) {
    if (!node) {
        return false;
    }
    const leadingComment = ts.getSyntheticLeadingComments(node);
    return leadingComment && leadingComment.some((comment) => comment.text === pureFunctionComment);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZml4LWZ1bmN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfb3B0aW1pemVyL3NyYy90cmFuc2Zvcm1zL3ByZWZpeC1mdW5jdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxpQ0FBaUM7QUFHakMsTUFBTSxtQkFBbUIsR0FBRyxXQUFXLENBQUM7QUFFeEMsU0FBZ0IsNkJBQTZCO0lBQzNDLE9BQU8sQ0FBQyxPQUFpQyxFQUFpQyxFQUFFO1FBQzFFLE1BQU0sV0FBVyxHQUFrQyxDQUFDLEVBQWlCLEVBQUUsRUFBRTtZQUV2RSxNQUFNLGlCQUFpQixHQUFHLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXBELE1BQU0sT0FBTyxHQUFlLENBQUMsSUFBYSxFQUFXLEVBQUU7Z0JBQ3JELG9EQUFvRDtnQkFDcEQsSUFBSSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQy9CLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsQ0FDM0MsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQXNCLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBRTFFLGtDQUFrQztvQkFDbEMsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7aUJBQ3JEO2dCQUVELCtCQUErQjtnQkFDL0IsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkQsQ0FBQyxDQUFDO1lBRUYsT0FBTyxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuQyxDQUFDLENBQUM7UUFFRixPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDLENBQUM7QUFDSixDQUFDO0FBekJELHNFQXlCQztBQUVELFNBQWdCLHFCQUFxQixDQUFDLFVBQW1CO0lBQ3ZELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQVcsQ0FBQztJQUU3QyxTQUFTLEVBQUUsQ0FBQyxJQUFhO1FBQ3ZCLGtFQUFrRTtRQUNsRSwwRkFBMEY7UUFDMUYscUZBQXFGO1FBQ3JGLG1EQUFtRDtRQUNuRCwrRkFBK0Y7UUFDL0YseUZBQXlGO1FBQ3pGLElBQUksRUFBRSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQztlQUM3QixFQUFFLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDO2VBQzdCLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7ZUFDM0IsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7ZUFDeEIsRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUMvQjtZQUNBLE9BQU87U0FDUjtRQUVELElBQUksYUFBYSxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQztRQUNyQixPQUFPLFNBQVMsSUFBSSxFQUFFLENBQUMseUJBQXlCLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDM0QsU0FBUyxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUM7WUFDakMsYUFBYSxHQUFHLGFBQWEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM3RDtRQUVELElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDZCxPQUFPO1NBQ1I7UUFFRCxJQUFJLGFBQWEsRUFBRTtZQUNqQixJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ2pDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUM3QjtpQkFBTSxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDekMsSUFBSSxVQUFVLEdBQWtCLFNBQVMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3JELE9BQU8sVUFBVSxJQUFJLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDN0QsVUFBVSxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUM7aUJBQ3BDO2dCQUNELElBQUksVUFBVSxFQUFFO29CQUNkLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxFQUFFO3dCQUN2Qyw2QkFBNkI7d0JBQzdCLDJFQUEyRTt3QkFDM0UsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7NEJBQ3BDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzt5QkFDN0I7cUJBQ0Y7eUJBQU07d0JBQ0wsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUM3QjtpQkFDRjthQUNGO1NBQ0Y7UUFFRCxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFaEMsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDO0FBMURELHNEQTBEQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQWE7SUFDbkMsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFNUQsT0FBTyxjQUFjLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ2xHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuXG5jb25zdCBwdXJlRnVuY3Rpb25Db21tZW50ID0gJ0BfX1BVUkVfXyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmVmaXhGdW5jdGlvbnNUcmFuc2Zvcm1lcigpOiB0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8dHMuU291cmNlRmlsZT4ge1xuICByZXR1cm4gKGNvbnRleHQ6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCk6IHRzLlRyYW5zZm9ybWVyPHRzLlNvdXJjZUZpbGU+ID0+IHtcbiAgICBjb25zdCB0cmFuc2Zvcm1lcjogdHMuVHJhbnNmb3JtZXI8dHMuU291cmNlRmlsZT4gPSAoc2Y6IHRzLlNvdXJjZUZpbGUpID0+IHtcblxuICAgICAgY29uc3QgdG9wTGV2ZWxGdW5jdGlvbnMgPSBmaW5kVG9wTGV2ZWxGdW5jdGlvbnMoc2YpO1xuXG4gICAgICBjb25zdCB2aXNpdG9yOiB0cy5WaXNpdG9yID0gKG5vZGU6IHRzLk5vZGUpOiB0cy5Ob2RlID0+IHtcbiAgICAgICAgLy8gQWRkIHB1cmUgZnVuY3Rpb24gY29tbWVudCB0byB0b3AgbGV2ZWwgZnVuY3Rpb25zLlxuICAgICAgICBpZiAodG9wTGV2ZWxGdW5jdGlvbnMuaGFzKG5vZGUpKSB7XG4gICAgICAgICAgY29uc3QgbmV3Tm9kZSA9IHRzLmFkZFN5bnRoZXRpY0xlYWRpbmdDb21tZW50KFxuICAgICAgICAgICAgbm9kZSwgdHMuU3ludGF4S2luZC5NdWx0aUxpbmVDb21tZW50VHJpdmlhLCBwdXJlRnVuY3Rpb25Db21tZW50LCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBSZXBsYWNlIG5vZGUgd2l0aCBtb2RpZmllZCBvbmUuXG4gICAgICAgICAgcmV0dXJuIHRzLnZpc2l0RWFjaENoaWxkKG5ld05vZGUsIHZpc2l0b3IsIGNvbnRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3RoZXJ3aXNlIHJldHVybiBub2RlIGFzIGlzLlxuICAgICAgICByZXR1cm4gdHMudmlzaXRFYWNoQ2hpbGQobm9kZSwgdmlzaXRvciwgY29udGV4dCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gdHMudmlzaXROb2RlKHNmLCB2aXNpdG9yKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRyYW5zZm9ybWVyO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFRvcExldmVsRnVuY3Rpb25zKHBhcmVudE5vZGU6IHRzLk5vZGUpOiBTZXQ8dHMuTm9kZT4ge1xuICBjb25zdCB0b3BMZXZlbEZ1bmN0aW9ucyA9IG5ldyBTZXQ8dHMuTm9kZT4oKTtcblxuICBmdW5jdGlvbiBjYihub2RlOiB0cy5Ob2RlKSB7XG4gICAgLy8gU3RvcCByZWN1cnNpbmcgaW50byB0aGlzIGJyYW5jaCBpZiBpdCdzIGEgZGVmaW5pdGlvbiBjb25zdHJ1Y3QuXG4gICAgLy8gVGhlc2UgYXJlIGZ1bmN0aW9uIGV4cHJlc3Npb24sIGZ1bmN0aW9uIGRlY2xhcmF0aW9uLCBjbGFzcywgb3IgYXJyb3cgZnVuY3Rpb24gKGxhbWJkYSkuXG4gICAgLy8gVGhlIGJvZHkgb2YgdGhlc2UgY29uc3RydWN0cyB3aWxsIG5vdCBleGVjdXRlIHdoZW4gbG9hZGluZyB0aGUgbW9kdWxlLCBzbyB3ZSBkb24ndFxuICAgIC8vIG5lZWQgdG8gbWFyayBmdW5jdGlvbiBjYWxscyBpbnNpZGUgdGhlbSBhcyBwdXJlLlxuICAgIC8vIENsYXNzIHN0YXRpYyBpbml0aWFsaXplcnMgaW4gRVMyMDE1IGFyZSBhbiBleGNlcHRpb24gd2UgZG9uJ3QgY292ZXIuIFRoZXkgd291bGQgbmVlZCBzaW1pbGFyXG4gICAgLy8gcHJvY2Vzc2luZyBhcyBlbnVtcyB0byBwcmV2ZW50IHByb3BlcnR5IHNldHRpbmcgZnJvbSBjYXVzaW5nIHRoZSBjbGFzcyB0byBiZSByZXRhaW5lZC5cbiAgICBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpXG4gICAgICB8fCB0cy5pc0Z1bmN0aW9uRXhwcmVzc2lvbihub2RlKVxuICAgICAgfHwgdHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5vZGUpXG4gICAgICB8fCB0cy5pc0Fycm93RnVuY3Rpb24obm9kZSlcbiAgICAgIHx8IHRzLmlzTWV0aG9kRGVjbGFyYXRpb24obm9kZSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgbm9QdXJlQ29tbWVudCA9ICFoYXNQdXJlQ29tbWVudChub2RlKTtcbiAgICBsZXQgaW5uZXJOb2RlID0gbm9kZTtcbiAgICB3aGlsZSAoaW5uZXJOb2RlICYmIHRzLmlzUGFyZW50aGVzaXplZEV4cHJlc3Npb24oaW5uZXJOb2RlKSkge1xuICAgICAgaW5uZXJOb2RlID0gaW5uZXJOb2RlLmV4cHJlc3Npb247XG4gICAgICBub1B1cmVDb21tZW50ID0gbm9QdXJlQ29tbWVudCAmJiAhaGFzUHVyZUNvbW1lbnQoaW5uZXJOb2RlKTtcbiAgICB9XG5cbiAgICBpZiAoIWlubmVyTm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChub1B1cmVDb21tZW50KSB7XG4gICAgICBpZiAodHMuaXNOZXdFeHByZXNzaW9uKGlubmVyTm9kZSkpIHtcbiAgICAgICAgdG9wTGV2ZWxGdW5jdGlvbnMuYWRkKG5vZGUpO1xuICAgICAgfSBlbHNlIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKGlubmVyTm9kZSkpIHtcbiAgICAgICAgbGV0IGV4cHJlc3Npb246IHRzLkV4cHJlc3Npb24gPSBpbm5lck5vZGUuZXhwcmVzc2lvbjtcbiAgICAgICAgd2hpbGUgKGV4cHJlc3Npb24gJiYgdHMuaXNQYXJlbnRoZXNpemVkRXhwcmVzc2lvbihleHByZXNzaW9uKSkge1xuICAgICAgICAgIGV4cHJlc3Npb24gPSBleHByZXNzaW9uLmV4cHJlc3Npb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4cHJlc3Npb24pIHtcbiAgICAgICAgICBpZiAodHMuaXNGdW5jdGlvbkV4cHJlc3Npb24oZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICAgIC8vIFNraXAgSUlGRSdzIHdpdGggYXJndW1lbnRzXG4gICAgICAgICAgICAvLyBUaGlzIGNvdWxkIGJlIGltcHJvdmVkIHRvIGNoZWNrIGlmIHRoZXJlIGFyZSBhbnkgcmVmZXJlbmNlcyB0byB2YXJpYWJsZXNcbiAgICAgICAgICAgIGlmIChpbm5lck5vZGUuYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICB0b3BMZXZlbEZ1bmN0aW9ucy5hZGQobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvcExldmVsRnVuY3Rpb25zLmFkZChub2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cy5mb3JFYWNoQ2hpbGQoaW5uZXJOb2RlLCBjYik7XG4gIH1cblxuICB0cy5mb3JFYWNoQ2hpbGQocGFyZW50Tm9kZSwgY2IpO1xuXG4gIHJldHVybiB0b3BMZXZlbEZ1bmN0aW9ucztcbn1cblxuZnVuY3Rpb24gaGFzUHVyZUNvbW1lbnQobm9kZTogdHMuTm9kZSkge1xuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgbGVhZGluZ0NvbW1lbnQgPSB0cy5nZXRTeW50aGV0aWNMZWFkaW5nQ29tbWVudHMobm9kZSk7XG5cbiAgcmV0dXJuIGxlYWRpbmdDb21tZW50ICYmIGxlYWRpbmdDb21tZW50LnNvbWUoKGNvbW1lbnQpID0+IGNvbW1lbnQudGV4dCA9PT0gcHVyZUZ1bmN0aW9uQ29tbWVudCk7XG59XG4iXX0=