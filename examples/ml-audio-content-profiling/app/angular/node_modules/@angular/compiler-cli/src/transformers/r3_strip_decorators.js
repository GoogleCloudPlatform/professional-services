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
        define("@angular/compiler-cli/src/transformers/r3_strip_decorators", ["require", "exports", "typescript", "@angular/compiler-cli/src/metadata/index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ts = require("typescript");
    var metadata_1 = require("@angular/compiler-cli/src/metadata/index");
    function getDecoratorStripTransformerFactory(coreDecorators, reflector, checker) {
        return function (context) {
            return function (sourceFile) {
                var stripDecoratorsFromClassDeclaration = function (node) {
                    if (node.decorators === undefined) {
                        return node;
                    }
                    var decorators = node.decorators.filter(function (decorator) {
                        var callExpr = decorator.expression;
                        if (ts.isCallExpression(callExpr)) {
                            var id = callExpr.expression;
                            if (ts.isIdentifier(id)) {
                                var symbol = resolveToStaticSymbol(id, sourceFile.fileName, reflector, checker);
                                return symbol && coreDecorators.has(symbol);
                            }
                        }
                        return true;
                    });
                    if (decorators.length !== node.decorators.length) {
                        return ts.updateClassDeclaration(node, decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses || [], node.members);
                    }
                    return node;
                };
                var stripDecoratorPropertyAssignment = function (node) {
                    return ts.visitEachChild(node, function (member) {
                        if (!ts.isPropertyDeclaration(member) || !isDecoratorAssignment(member) ||
                            !member.initializer || !ts.isArrayLiteralExpression(member.initializer)) {
                            return member;
                        }
                        var newInitializer = ts.visitEachChild(member.initializer, function (decorator) {
                            if (!ts.isObjectLiteralExpression(decorator)) {
                                return decorator;
                            }
                            var type = lookupProperty(decorator, 'type');
                            if (!type || !ts.isIdentifier(type)) {
                                return decorator;
                            }
                            var symbol = resolveToStaticSymbol(type, sourceFile.fileName, reflector, checker);
                            if (!symbol || !coreDecorators.has(symbol)) {
                                return decorator;
                            }
                            return undefined;
                        }, context);
                        if (newInitializer === member.initializer) {
                            return member;
                        }
                        else if (newInitializer.elements.length === 0) {
                            return undefined;
                        }
                        else {
                            return ts.updateProperty(member, member.decorators, member.modifiers, member.name, member.questionToken, member.type, newInitializer);
                        }
                    }, context);
                };
                return ts.visitEachChild(sourceFile, function (stmt) {
                    if (ts.isClassDeclaration(stmt)) {
                        var decl = stmt;
                        if (stmt.decorators) {
                            decl = stripDecoratorsFromClassDeclaration(stmt);
                        }
                        return stripDecoratorPropertyAssignment(decl);
                    }
                    return stmt;
                }, context);
            };
        };
    }
    exports.getDecoratorStripTransformerFactory = getDecoratorStripTransformerFactory;
    function isDecoratorAssignment(member) {
        if (!ts.isPropertyDeclaration(member)) {
            return false;
        }
        if (!member.modifiers ||
            !member.modifiers.some(function (mod) { return mod.kind === ts.SyntaxKind.StaticKeyword; })) {
            return false;
        }
        if (!ts.isIdentifier(member.name) || member.name.text !== 'decorators') {
            return false;
        }
        if (!member.initializer || !ts.isArrayLiteralExpression(member.initializer)) {
            return false;
        }
        return true;
    }
    function lookupProperty(expr, prop) {
        var decl = expr.properties.find(function (elem) { return !!elem.name && ts.isIdentifier(elem.name) && elem.name.text === prop; });
        if (decl === undefined || !ts.isPropertyAssignment(decl)) {
            return undefined;
        }
        return decl.initializer;
    }
    function resolveToStaticSymbol(id, containingFile, reflector, checker) {
        var res = checker.getSymbolAtLocation(id);
        if (!res || !res.declarations || res.declarations.length === 0) {
            return null;
        }
        var decl = res.declarations[0];
        if (!ts.isImportSpecifier(decl)) {
            return null;
        }
        var moduleSpecifier = decl.parent.parent.parent.moduleSpecifier;
        if (!ts.isStringLiteral(moduleSpecifier)) {
            return null;
        }
        return reflector.tryFindDeclaration(moduleSpecifier.text, id.text, containingFile);
    }
    var StripDecoratorsMetadataTransformer = /** @class */ (function () {
        function StripDecoratorsMetadataTransformer(coreDecorators, reflector) {
            this.coreDecorators = coreDecorators;
            this.reflector = reflector;
        }
        StripDecoratorsMetadataTransformer.prototype.start = function (sourceFile) {
            var _this = this;
            return function (value, node) {
                if (metadata_1.isClassMetadata(value) && ts.isClassDeclaration(node) && value.decorators) {
                    value.decorators = value.decorators.filter(function (d) {
                        if (metadata_1.isMetadataSymbolicCallExpression(d) &&
                            metadata_1.isMetadataImportedSymbolReferenceExpression(d.expression)) {
                            var declaration = _this.reflector.tryFindDeclaration(d.expression.module, d.expression.name, sourceFile.fileName);
                            if (declaration && _this.coreDecorators.has(declaration)) {
                                return false;
                            }
                        }
                        return true;
                    });
                }
                return value;
            };
        };
        return StripDecoratorsMetadataTransformer;
    }());
    exports.StripDecoratorsMetadataTransformer = StripDecoratorsMetadataTransformer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfc3RyaXBfZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvdHJhbnNmb3JtZXJzL3IzX3N0cmlwX2RlY29yYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCwrQkFBaUM7SUFFakMscUVBQTBJO0lBTzFJLFNBQWdCLG1DQUFtQyxDQUMvQyxjQUFpQyxFQUFFLFNBQTBCLEVBQzdELE9BQXVCO1FBQ3pCLE9BQU8sVUFBUyxPQUFpQztZQUMvQyxPQUFPLFVBQVMsVUFBeUI7Z0JBQ3ZDLElBQU0sbUNBQW1DLEdBQ3JDLFVBQUMsSUFBeUI7b0JBQ3hCLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7d0JBQ2pDLE9BQU8sSUFBSSxDQUFDO3FCQUNiO29CQUNELElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQUEsU0FBUzt3QkFDakQsSUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQzt3QkFDdEMsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEVBQUU7NEJBQ2pDLElBQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7NEJBQy9CLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsRUFBRTtnQ0FDdkIsSUFBTSxNQUFNLEdBQUcscUJBQXFCLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dDQUNsRixPQUFPLE1BQU0sSUFBSSxjQUFjLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzZCQUM3Qzt5QkFDRjt3QkFDRCxPQUFPLElBQUksQ0FBQztvQkFDZCxDQUFDLENBQUMsQ0FBQztvQkFDSCxJQUFJLFVBQVUsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7d0JBQ2hELE9BQU8sRUFBRSxDQUFDLHNCQUFzQixDQUM1QixJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsY0FBYyxFQUNoRSxJQUFJLENBQUMsZUFBZSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFHLENBQUM7cUJBQ2pEO29CQUNELE9BQU8sSUFBSSxDQUFDO2dCQUNkLENBQUMsQ0FBQztnQkFFTixJQUFNLGdDQUFnQyxHQUFHLFVBQUMsSUFBeUI7b0JBQ2pFLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsVUFBQSxNQUFNO3dCQUNuQyxJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDOzRCQUNuRSxDQUFDLE1BQU0sQ0FBQyxXQUFXLElBQUksQ0FBQyxFQUFFLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFOzRCQUMzRSxPQUFPLE1BQU0sQ0FBQzt5QkFDZjt3QkFFRCxJQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsVUFBQSxTQUFTOzRCQUNwRSxJQUFJLENBQUMsRUFBRSxDQUFDLHlCQUF5QixDQUFDLFNBQVMsQ0FBQyxFQUFFO2dDQUM1QyxPQUFPLFNBQVMsQ0FBQzs2QkFDbEI7NEJBQ0QsSUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQzs0QkFDL0MsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0NBQ25DLE9BQU8sU0FBUyxDQUFDOzZCQUNsQjs0QkFDRCxJQUFNLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7NEJBQ3BGLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dDQUMxQyxPQUFPLFNBQVMsQ0FBQzs2QkFDbEI7NEJBQ0QsT0FBTyxTQUFTLENBQUM7d0JBQ25CLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFFWixJQUFJLGNBQWMsS0FBSyxNQUFNLENBQUMsV0FBVyxFQUFFOzRCQUN6QyxPQUFPLE1BQU0sQ0FBQzt5QkFDZjs2QkFBTSxJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTs0QkFDL0MsT0FBTyxTQUFTLENBQUM7eUJBQ2xCOzZCQUFNOzRCQUNMLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FDcEIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxhQUFhLEVBQzlFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7eUJBQ2xDO29CQUNILENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDZCxDQUFDLENBQUM7Z0JBRUYsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxVQUFBLElBQUk7b0JBQ3ZDLElBQUksRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUMvQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7d0JBQ2hCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTs0QkFDbkIsSUFBSSxHQUFHLG1DQUFtQyxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUNsRDt3QkFDRCxPQUFPLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUMvQztvQkFDRCxPQUFPLElBQUksQ0FBQztnQkFDZCxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDZCxDQUFDLENBQUM7UUFDSixDQUFDLENBQUM7SUFDSixDQUFDO0lBM0VELGtGQTJFQztJQUVELFNBQVMscUJBQXFCLENBQUMsTUFBdUI7UUFDcEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNyQyxPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTO1lBQ2pCLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxHQUFHLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUF4QyxDQUF3QyxDQUFDLEVBQUU7WUFDM0UsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxZQUFZLEVBQUU7WUFDdEUsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxJQUFJLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUMzRSxPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUMsSUFBZ0MsRUFBRSxJQUFZO1FBQ3BFLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUM3QixVQUFBLElBQUksSUFBSSxPQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksRUFBcEUsQ0FBb0UsQ0FBQyxDQUFDO1FBQ2xGLElBQUksSUFBSSxLQUFLLFNBQVMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN4RCxPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUNELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUMxQixDQUFDO0lBRUQsU0FBUyxxQkFBcUIsQ0FDMUIsRUFBaUIsRUFBRSxjQUFzQixFQUFFLFNBQTBCLEVBQ3JFLE9BQXVCO1FBQ3pCLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDOUQsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMvQixPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsSUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQVEsQ0FBQyxNQUFRLENBQUMsTUFBUSxDQUFDLGVBQWUsQ0FBQztRQUN4RSxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUN4QyxPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsT0FBTyxTQUFTLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3JGLENBQUM7SUFFRDtRQUNFLDRDQUFvQixjQUFpQyxFQUFVLFNBQTBCO1lBQXJFLG1CQUFjLEdBQWQsY0FBYyxDQUFtQjtZQUFVLGNBQVMsR0FBVCxTQUFTLENBQWlCO1FBQUcsQ0FBQztRQUU3RixrREFBSyxHQUFMLFVBQU0sVUFBeUI7WUFBL0IsaUJBaUJDO1lBaEJDLE9BQU8sVUFBQyxLQUFvQixFQUFFLElBQWE7Z0JBQ3pDLElBQUksMEJBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtvQkFDN0UsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUM7d0JBQzFDLElBQUksMkNBQWdDLENBQUMsQ0FBQyxDQUFDOzRCQUNuQyxzREFBMkMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUU7NEJBQzdELElBQU0sV0FBVyxHQUFHLEtBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQ2pELENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQzs0QkFDakUsSUFBSSxXQUFXLElBQUksS0FBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0NBQ3ZELE9BQU8sS0FBSyxDQUFDOzZCQUNkO3lCQUNGO3dCQUNELE9BQU8sSUFBSSxDQUFDO29CQUNkLENBQUMsQ0FBQyxDQUFDO2lCQUNKO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNILHlDQUFDO0lBQUQsQ0FBQyxBQXJCRCxJQXFCQztJQXJCWSxnRkFBa0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3RhdGljUmVmbGVjdG9yLCBTdGF0aWNTeW1ib2x9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge01ldGFkYXRhVmFsdWUsIGlzQ2xhc3NNZXRhZGF0YSwgaXNNZXRhZGF0YUltcG9ydGVkU3ltYm9sUmVmZXJlbmNlRXhwcmVzc2lvbiwgaXNNZXRhZGF0YVN5bWJvbGljQ2FsbEV4cHJlc3Npb259IGZyb20gJy4uL21ldGFkYXRhJztcblxuaW1wb3J0IHtNZXRhZGF0YVRyYW5zZm9ybWVyLCBWYWx1ZVRyYW5zZm9ybX0gZnJvbSAnLi9tZXRhZGF0YV9jYWNoZSc7XG5cbmV4cG9ydCB0eXBlIFRyYW5zZm9ybWVyID0gKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpID0+IHRzLlNvdXJjZUZpbGU7XG5leHBvcnQgdHlwZSBUcmFuc2Zvcm1lckZhY3RvcnkgPSAoY29udGV4dDogdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0KSA9PiBUcmFuc2Zvcm1lcjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlY29yYXRvclN0cmlwVHJhbnNmb3JtZXJGYWN0b3J5KFxuICAgIGNvcmVEZWNvcmF0b3JzOiBTZXQ8U3RhdGljU3ltYm9sPiwgcmVmbGVjdG9yOiBTdGF0aWNSZWZsZWN0b3IsXG4gICAgY2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBUcmFuc2Zvcm1lckZhY3Rvcnkge1xuICByZXR1cm4gZnVuY3Rpb24oY29udGV4dDogdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5Tb3VyY2VGaWxlIHtcbiAgICAgIGNvbnN0IHN0cmlwRGVjb3JhdG9yc0Zyb21DbGFzc0RlY2xhcmF0aW9uID1cbiAgICAgICAgICAobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IHRzLkNsYXNzRGVjbGFyYXRpb24gPT4ge1xuICAgICAgICAgICAgaWYgKG5vZGUuZGVjb3JhdG9ycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGVjb3JhdG9ycyA9IG5vZGUuZGVjb3JhdG9ycy5maWx0ZXIoZGVjb3JhdG9yID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgY2FsbEV4cHIgPSBkZWNvcmF0b3IuZXhwcmVzc2lvbjtcbiAgICAgICAgICAgICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24oY2FsbEV4cHIpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBjYWxsRXhwci5leHByZXNzaW9uO1xuICAgICAgICAgICAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIoaWQpKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBzeW1ib2wgPSByZXNvbHZlVG9TdGF0aWNTeW1ib2woaWQsIHNvdXJjZUZpbGUuZmlsZU5hbWUsIHJlZmxlY3RvciwgY2hlY2tlcik7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc3ltYm9sICYmIGNvcmVEZWNvcmF0b3JzLmhhcyhzeW1ib2wpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGRlY29yYXRvcnMubGVuZ3RoICE9PSBub2RlLmRlY29yYXRvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cy51cGRhdGVDbGFzc0RlY2xhcmF0aW9uKFxuICAgICAgICAgICAgICAgICAgbm9kZSwgZGVjb3JhdG9ycywgbm9kZS5tb2RpZmllcnMsIG5vZGUubmFtZSwgbm9kZS50eXBlUGFyYW1ldGVycyxcbiAgICAgICAgICAgICAgICAgIG5vZGUuaGVyaXRhZ2VDbGF1c2VzIHx8IFtdLCBub2RlLm1lbWJlcnMsICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICB9O1xuXG4gICAgICBjb25zdCBzdHJpcERlY29yYXRvclByb3BlcnR5QXNzaWdubWVudCA9IChub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogdHMuQ2xhc3NEZWNsYXJhdGlvbiA9PiB7XG4gICAgICAgIHJldHVybiB0cy52aXNpdEVhY2hDaGlsZChub2RlLCBtZW1iZXIgPT4ge1xuICAgICAgICAgIGlmICghdHMuaXNQcm9wZXJ0eURlY2xhcmF0aW9uKG1lbWJlcikgfHwgIWlzRGVjb3JhdG9yQXNzaWdubWVudChtZW1iZXIpIHx8XG4gICAgICAgICAgICAgICFtZW1iZXIuaW5pdGlhbGl6ZXIgfHwgIXRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihtZW1iZXIuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbWVtYmVyO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG5ld0luaXRpYWxpemVyID0gdHMudmlzaXRFYWNoQ2hpbGQobWVtYmVyLmluaXRpYWxpemVyLCBkZWNvcmF0b3IgPT4ge1xuICAgICAgICAgICAgaWYgKCF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKGRlY29yYXRvcikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBsb29rdXBQcm9wZXJ0eShkZWNvcmF0b3IsICd0eXBlJyk7XG4gICAgICAgICAgICBpZiAoIXR5cGUgfHwgIXRzLmlzSWRlbnRpZmllcih0eXBlKSkge1xuICAgICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc3ltYm9sID0gcmVzb2x2ZVRvU3RhdGljU3ltYm9sKHR5cGUsIHNvdXJjZUZpbGUuZmlsZU5hbWUsIHJlZmxlY3RvciwgY2hlY2tlcik7XG4gICAgICAgICAgICBpZiAoIXN5bWJvbCB8fCAhY29yZURlY29yYXRvcnMuaGFzKHN5bWJvbCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfSwgY29udGV4dCk7XG5cbiAgICAgICAgICBpZiAobmV3SW5pdGlhbGl6ZXIgPT09IG1lbWJlci5pbml0aWFsaXplcikge1xuICAgICAgICAgICAgcmV0dXJuIG1lbWJlcjtcbiAgICAgICAgICB9IGVsc2UgaWYgKG5ld0luaXRpYWxpemVyLmVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRzLnVwZGF0ZVByb3BlcnR5KFxuICAgICAgICAgICAgICAgIG1lbWJlciwgbWVtYmVyLmRlY29yYXRvcnMsIG1lbWJlci5tb2RpZmllcnMsIG1lbWJlci5uYW1lLCBtZW1iZXIucXVlc3Rpb25Ub2tlbixcbiAgICAgICAgICAgICAgICBtZW1iZXIudHlwZSwgbmV3SW5pdGlhbGl6ZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgY29udGV4dCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gdHMudmlzaXRFYWNoQ2hpbGQoc291cmNlRmlsZSwgc3RtdCA9PiB7XG4gICAgICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24oc3RtdCkpIHtcbiAgICAgICAgICBsZXQgZGVjbCA9IHN0bXQ7XG4gICAgICAgICAgaWYgKHN0bXQuZGVjb3JhdG9ycykge1xuICAgICAgICAgICAgZGVjbCA9IHN0cmlwRGVjb3JhdG9yc0Zyb21DbGFzc0RlY2xhcmF0aW9uKHN0bXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc3RyaXBEZWNvcmF0b3JQcm9wZXJ0eUFzc2lnbm1lbnQoZGVjbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0bXQ7XG4gICAgICB9LCBjb250ZXh0KTtcbiAgICB9O1xuICB9O1xufVxuXG5mdW5jdGlvbiBpc0RlY29yYXRvckFzc2lnbm1lbnQobWVtYmVyOiB0cy5DbGFzc0VsZW1lbnQpOiBib29sZWFuIHtcbiAgaWYgKCF0cy5pc1Byb3BlcnR5RGVjbGFyYXRpb24obWVtYmVyKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoIW1lbWJlci5tb2RpZmllcnMgfHxcbiAgICAgICFtZW1iZXIubW9kaWZpZXJzLnNvbWUobW9kID0+IG1vZC5raW5kID09PSB0cy5TeW50YXhLaW5kLlN0YXRpY0tleXdvcmQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICghdHMuaXNJZGVudGlmaWVyKG1lbWJlci5uYW1lKSB8fCBtZW1iZXIubmFtZS50ZXh0ICE9PSAnZGVjb3JhdG9ycycpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKCFtZW1iZXIuaW5pdGlhbGl6ZXIgfHwgIXRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihtZW1iZXIuaW5pdGlhbGl6ZXIpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBsb29rdXBQcm9wZXJ0eShleHByOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiwgcHJvcDogc3RyaW5nKTogdHMuRXhwcmVzc2lvbnx1bmRlZmluZWQge1xuICBjb25zdCBkZWNsID0gZXhwci5wcm9wZXJ0aWVzLmZpbmQoXG4gICAgICBlbGVtID0+ICEhZWxlbS5uYW1lICYmIHRzLmlzSWRlbnRpZmllcihlbGVtLm5hbWUpICYmIGVsZW0ubmFtZS50ZXh0ID09PSBwcm9wKTtcbiAgaWYgKGRlY2wgPT09IHVuZGVmaW5lZCB8fCAhdHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQoZGVjbCkpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiBkZWNsLmluaXRpYWxpemVyO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlVG9TdGF0aWNTeW1ib2woXG4gICAgaWQ6IHRzLklkZW50aWZpZXIsIGNvbnRhaW5pbmdGaWxlOiBzdHJpbmcsIHJlZmxlY3RvcjogU3RhdGljUmVmbGVjdG9yLFxuICAgIGNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogU3RhdGljU3ltYm9sfG51bGwge1xuICBjb25zdCByZXMgPSBjaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24oaWQpO1xuICBpZiAoIXJlcyB8fCAhcmVzLmRlY2xhcmF0aW9ucyB8fCByZXMuZGVjbGFyYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGRlY2wgPSByZXMuZGVjbGFyYXRpb25zWzBdO1xuICBpZiAoIXRzLmlzSW1wb3J0U3BlY2lmaWVyKGRlY2wpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgbW9kdWxlU3BlY2lmaWVyID0gZGVjbC5wYXJlbnQgIS5wYXJlbnQgIS5wYXJlbnQgIS5tb2R1bGVTcGVjaWZpZXI7XG4gIGlmICghdHMuaXNTdHJpbmdMaXRlcmFsKG1vZHVsZVNwZWNpZmllcikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gcmVmbGVjdG9yLnRyeUZpbmREZWNsYXJhdGlvbihtb2R1bGVTcGVjaWZpZXIudGV4dCwgaWQudGV4dCwgY29udGFpbmluZ0ZpbGUpO1xufVxuXG5leHBvcnQgY2xhc3MgU3RyaXBEZWNvcmF0b3JzTWV0YWRhdGFUcmFuc2Zvcm1lciBpbXBsZW1lbnRzIE1ldGFkYXRhVHJhbnNmb3JtZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvcmVEZWNvcmF0b3JzOiBTZXQ8U3RhdGljU3ltYm9sPiwgcHJpdmF0ZSByZWZsZWN0b3I6IFN0YXRpY1JlZmxlY3Rvcikge31cblxuICBzdGFydChzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogVmFsdWVUcmFuc2Zvcm18dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gKHZhbHVlOiBNZXRhZGF0YVZhbHVlLCBub2RlOiB0cy5Ob2RlKTogTWV0YWRhdGFWYWx1ZSA9PiB7XG4gICAgICBpZiAoaXNDbGFzc01ldGFkYXRhKHZhbHVlKSAmJiB0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkgJiYgdmFsdWUuZGVjb3JhdG9ycykge1xuICAgICAgICB2YWx1ZS5kZWNvcmF0b3JzID0gdmFsdWUuZGVjb3JhdG9ycy5maWx0ZXIoZCA9PiB7XG4gICAgICAgICAgaWYgKGlzTWV0YWRhdGFTeW1ib2xpY0NhbGxFeHByZXNzaW9uKGQpICYmXG4gICAgICAgICAgICAgIGlzTWV0YWRhdGFJbXBvcnRlZFN5bWJvbFJlZmVyZW5jZUV4cHJlc3Npb24oZC5leHByZXNzaW9uKSkge1xuICAgICAgICAgICAgY29uc3QgZGVjbGFyYXRpb24gPSB0aGlzLnJlZmxlY3Rvci50cnlGaW5kRGVjbGFyYXRpb24oXG4gICAgICAgICAgICAgICAgZC5leHByZXNzaW9uLm1vZHVsZSwgZC5leHByZXNzaW9uLm5hbWUsIHNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgICAgICAgICAgaWYgKGRlY2xhcmF0aW9uICYmIHRoaXMuY29yZURlY29yYXRvcnMuaGFzKGRlY2xhcmF0aW9uKSkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICB9XG59XG4iXX0=