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
const ast_utils_1 = require("../helpers/ast-utils");
/**
 * @deprecated From 0.9.0
 */
function testScrubFile(content) {
    const markers = [
        'decorators',
        '__decorate',
        'propDecorators',
        'ctorParameters',
    ];
    return markers.some((marker) => content.indexOf(marker) !== -1);
}
exports.testScrubFile = testScrubFile;
// Don't remove `ctorParameters` from these.
const platformWhitelist = [
    'PlatformRef_',
    'TestabilityRegistry',
    'Console',
    'BrowserPlatformLocation',
];
const angularSpecifiers = [
    // Class level decorators.
    'Component',
    'Directive',
    'Injectable',
    'NgModule',
    'Pipe',
    // Property level decorators.
    'ContentChild',
    'ContentChildren',
    'HostBinding',
    'HostListener',
    'Input',
    'Output',
    'ViewChild',
    'ViewChildren',
];
function getScrubFileTransformer(program) {
    const checker = program.getTypeChecker();
    return (context) => {
        const transformer = (sf) => {
            const ngMetadata = findAngularMetadata(sf);
            const tslibImports = findTslibImports(sf);
            const nodes = [];
            ts.forEachChild(sf, checkNodeForDecorators);
            function checkNodeForDecorators(node) {
                if (node.kind !== ts.SyntaxKind.ExpressionStatement) {
                    // TS 2.4 nests decorators inside downleveled class IIFEs, so we
                    // must recurse into them to find the relevant expression statements.
                    return ts.forEachChild(node, checkNodeForDecorators);
                }
                const exprStmt = node;
                if (isDecoratorAssignmentExpression(exprStmt)) {
                    nodes.push(...pickDecorationNodesToRemove(exprStmt, ngMetadata, checker));
                }
                if (isDecorateAssignmentExpression(exprStmt, tslibImports, checker)) {
                    nodes.push(...pickDecorateNodesToRemove(exprStmt, tslibImports, ngMetadata, checker));
                }
                if (isAngularDecoratorMetadataExpression(exprStmt, ngMetadata, tslibImports, checker)) {
                    nodes.push(node);
                }
                if (isPropDecoratorAssignmentExpression(exprStmt)) {
                    nodes.push(...pickPropDecorationNodesToRemove(exprStmt, ngMetadata, checker));
                }
                if (isCtorParamsAssignmentExpression(exprStmt)
                    && !isCtorParamsWhitelistedService(exprStmt)) {
                    nodes.push(node);
                }
            }
            const visitor = (node) => {
                // Check if node is a statement to be dropped.
                if (nodes.find((n) => n === node)) {
                    return undefined;
                }
                // Otherwise return node as is.
                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitNode(sf, visitor);
        };
        return transformer;
    };
}
exports.getScrubFileTransformer = getScrubFileTransformer;
function expect(node, kind) {
    if (node.kind !== kind) {
        throw new Error('Invalid node type.');
    }
    return node;
}
exports.expect = expect;
function nameOfSpecifier(node) {
    return node.name && node.name.text || '<unknown>';
}
function findAngularMetadata(node) {
    let specs = [];
    ts.forEachChild(node, (child) => {
        if (child.kind === ts.SyntaxKind.ImportDeclaration) {
            const importDecl = child;
            if (isAngularCoreImport(importDecl)) {
                specs.push(...ast_utils_1.collectDeepNodes(node, ts.SyntaxKind.ImportSpecifier)
                    .filter((spec) => isAngularCoreSpecifier(spec)));
            }
        }
    });
    const localDecl = findAllDeclarations(node)
        .filter((decl) => angularSpecifiers.indexOf(decl.name.text) !== -1);
    if (localDecl.length === angularSpecifiers.length) {
        specs = specs.concat(localDecl);
    }
    return specs;
}
function findAllDeclarations(node) {
    const nodes = [];
    ts.forEachChild(node, (child) => {
        if (child.kind === ts.SyntaxKind.VariableStatement) {
            const vStmt = child;
            vStmt.declarationList.declarations.forEach((decl) => {
                if (decl.name.kind !== ts.SyntaxKind.Identifier) {
                    return;
                }
                nodes.push(decl);
            });
        }
    });
    return nodes;
}
function isAngularCoreImport(node) {
    return true &&
        node.moduleSpecifier &&
        node.moduleSpecifier.kind === ts.SyntaxKind.StringLiteral &&
        node.moduleSpecifier.text === '@angular/core';
}
function isAngularCoreSpecifier(node) {
    return angularSpecifiers.indexOf(nameOfSpecifier(node)) !== -1;
}
// Check if assignment is `Clazz.decorators = [...];`.
function isDecoratorAssignmentExpression(exprStmt) {
    if (exprStmt.expression.kind !== ts.SyntaxKind.BinaryExpression) {
        return false;
    }
    const expr = exprStmt.expression;
    if (expr.left.kind !== ts.SyntaxKind.PropertyAccessExpression) {
        return false;
    }
    const propAccess = expr.left;
    if (propAccess.expression.kind !== ts.SyntaxKind.Identifier) {
        return false;
    }
    if (propAccess.name.text !== 'decorators') {
        return false;
    }
    if (expr.operatorToken.kind !== ts.SyntaxKind.FirstAssignment) {
        return false;
    }
    if (expr.right.kind !== ts.SyntaxKind.ArrayLiteralExpression) {
        return false;
    }
    return true;
}
// Check if assignment is `Clazz = __decorate([...], Clazz)`.
function isDecorateAssignmentExpression(exprStmt, tslibImports, checker) {
    if (exprStmt.expression.kind !== ts.SyntaxKind.BinaryExpression) {
        return false;
    }
    const expr = exprStmt.expression;
    if (expr.left.kind !== ts.SyntaxKind.Identifier) {
        return false;
    }
    const classIdent = expr.left;
    let callExpr;
    if (expr.right.kind === ts.SyntaxKind.CallExpression) {
        callExpr = expr.right;
    }
    else if (expr.right.kind === ts.SyntaxKind.BinaryExpression) {
        // `Clazz = Clazz_1 = __decorate([...], Clazz)` can be found when there are static property
        // accesses.
        const innerExpr = expr.right;
        if (innerExpr.left.kind !== ts.SyntaxKind.Identifier
            || innerExpr.right.kind !== ts.SyntaxKind.CallExpression) {
            return false;
        }
        callExpr = innerExpr.right;
    }
    else {
        return false;
    }
    if (!isTslibHelper(callExpr, '__decorate', tslibImports, checker)) {
        return false;
    }
    if (callExpr.arguments.length !== 2) {
        return false;
    }
    if (callExpr.arguments[1].kind !== ts.SyntaxKind.Identifier) {
        return false;
    }
    const classArg = callExpr.arguments[1];
    if (classIdent.text !== classArg.text) {
        return false;
    }
    if (callExpr.arguments[0].kind !== ts.SyntaxKind.ArrayLiteralExpression) {
        return false;
    }
    return true;
}
// Check if expression is `__decorate([smt, __metadata("design:type", Object)], ...)`.
function isAngularDecoratorMetadataExpression(exprStmt, ngMetadata, tslibImports, checker) {
    if (exprStmt.expression.kind !== ts.SyntaxKind.CallExpression) {
        return false;
    }
    const callExpr = exprStmt.expression;
    if (!isTslibHelper(callExpr, '__decorate', tslibImports, checker)) {
        return false;
    }
    if (callExpr.arguments.length !== 4) {
        return false;
    }
    if (callExpr.arguments[0].kind !== ts.SyntaxKind.ArrayLiteralExpression) {
        return false;
    }
    const decorateArray = callExpr.arguments[0];
    // Check first array entry for Angular decorators.
    if (decorateArray.elements[0].kind !== ts.SyntaxKind.CallExpression) {
        return false;
    }
    const decoratorCall = decorateArray.elements[0];
    if (decoratorCall.expression.kind !== ts.SyntaxKind.Identifier) {
        return false;
    }
    const decoratorId = decoratorCall.expression;
    if (!identifierIsMetadata(decoratorId, ngMetadata, checker)) {
        return false;
    }
    // Check second array entry for __metadata call.
    if (decorateArray.elements[1].kind !== ts.SyntaxKind.CallExpression) {
        return false;
    }
    const metadataCall = decorateArray.elements[1];
    if (!isTslibHelper(metadataCall, '__metadata', tslibImports, checker)) {
        return false;
    }
    return true;
}
// Check if assignment is `Clazz.propDecorators = [...];`.
function isPropDecoratorAssignmentExpression(exprStmt) {
    if (exprStmt.expression.kind !== ts.SyntaxKind.BinaryExpression) {
        return false;
    }
    const expr = exprStmt.expression;
    if (expr.left.kind !== ts.SyntaxKind.PropertyAccessExpression) {
        return false;
    }
    const propAccess = expr.left;
    if (propAccess.expression.kind !== ts.SyntaxKind.Identifier) {
        return false;
    }
    if (propAccess.name.text !== 'propDecorators') {
        return false;
    }
    if (expr.operatorToken.kind !== ts.SyntaxKind.FirstAssignment) {
        return false;
    }
    if (expr.right.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
        return false;
    }
    return true;
}
// Check if assignment is `Clazz.ctorParameters = [...];`.
function isCtorParamsAssignmentExpression(exprStmt) {
    if (exprStmt.expression.kind !== ts.SyntaxKind.BinaryExpression) {
        return false;
    }
    const expr = exprStmt.expression;
    if (expr.left.kind !== ts.SyntaxKind.PropertyAccessExpression) {
        return false;
    }
    const propAccess = expr.left;
    if (propAccess.name.text !== 'ctorParameters') {
        return false;
    }
    if (propAccess.expression.kind !== ts.SyntaxKind.Identifier) {
        return false;
    }
    if (expr.operatorToken.kind !== ts.SyntaxKind.FirstAssignment) {
        return false;
    }
    if (expr.right.kind !== ts.SyntaxKind.FunctionExpression
        && expr.right.kind !== ts.SyntaxKind.ArrowFunction) {
        return false;
    }
    return true;
}
function isCtorParamsWhitelistedService(exprStmt) {
    const expr = exprStmt.expression;
    const propAccess = expr.left;
    const serviceId = propAccess.expression;
    return platformWhitelist.indexOf(serviceId.text) !== -1;
}
// Remove Angular decorators from`Clazz.decorators = [...];`, or expression itself if all are
// removed.
function pickDecorationNodesToRemove(exprStmt, ngMetadata, checker) {
    const expr = expect(exprStmt.expression, ts.SyntaxKind.BinaryExpression);
    const literal = expect(expr.right, ts.SyntaxKind.ArrayLiteralExpression);
    if (!literal.elements.every((elem) => elem.kind === ts.SyntaxKind.ObjectLiteralExpression)) {
        return [];
    }
    const elements = literal.elements;
    const ngDecorators = elements.filter((elem) => isAngularDecorator(elem, ngMetadata, checker));
    return (elements.length > ngDecorators.length) ? ngDecorators : [exprStmt];
}
// Remove Angular decorators from `Clazz = __decorate([...], Clazz)`, or expression itself if all
// are removed.
function pickDecorateNodesToRemove(exprStmt, tslibImports, ngMetadata, checker) {
    const expr = expect(exprStmt.expression, ts.SyntaxKind.BinaryExpression);
    const classId = expect(expr.left, ts.SyntaxKind.Identifier);
    let callExpr;
    if (expr.right.kind === ts.SyntaxKind.CallExpression) {
        callExpr = expect(expr.right, ts.SyntaxKind.CallExpression);
    }
    else if (expr.right.kind === ts.SyntaxKind.BinaryExpression) {
        const innerExpr = expr.right;
        callExpr = expect(innerExpr.right, ts.SyntaxKind.CallExpression);
    }
    else {
        return [];
    }
    const arrLiteral = expect(callExpr.arguments[0], ts.SyntaxKind.ArrayLiteralExpression);
    if (!arrLiteral.elements.every((elem) => elem.kind === ts.SyntaxKind.CallExpression)) {
        return [];
    }
    const elements = arrLiteral.elements;
    const ngDecoratorCalls = elements.filter((el) => {
        if (el.expression.kind !== ts.SyntaxKind.Identifier) {
            return false;
        }
        const id = el.expression;
        return identifierIsMetadata(id, ngMetadata, checker);
    });
    // Only remove constructor parameter metadata on non-whitelisted classes.
    if (platformWhitelist.indexOf(classId.text) === -1) {
        // Remove __metadata calls of type 'design:paramtypes'.
        const metadataCalls = elements.filter((el) => {
            if (!isTslibHelper(el, '__metadata', tslibImports, checker)) {
                return false;
            }
            if (el.arguments.length < 2) {
                return false;
            }
            if (el.arguments[0].kind !== ts.SyntaxKind.StringLiteral) {
                return false;
            }
            const metadataTypeId = el.arguments[0];
            if (metadataTypeId.text !== 'design:paramtypes') {
                return false;
            }
            return true;
        });
        // Remove all __param calls.
        const paramCalls = elements.filter((el) => {
            if (!isTslibHelper(el, '__param', tslibImports, checker)) {
                return false;
            }
            if (el.arguments.length != 2) {
                return false;
            }
            if (el.arguments[0].kind !== ts.SyntaxKind.NumericLiteral) {
                return false;
            }
            return true;
        });
        ngDecoratorCalls.push(...metadataCalls, ...paramCalls);
    }
    // If all decorators are metadata decorators then return the whole `Class = __decorate([...])'`
    // statement so that it is removed in entirety
    return (elements.length === ngDecoratorCalls.length) ? [exprStmt] : ngDecoratorCalls;
}
// Remove Angular decorators from`Clazz.propDecorators = [...];`, or expression itself if all
// are removed.
function pickPropDecorationNodesToRemove(exprStmt, ngMetadata, checker) {
    const expr = expect(exprStmt.expression, ts.SyntaxKind.BinaryExpression);
    const literal = expect(expr.right, ts.SyntaxKind.ObjectLiteralExpression);
    if (!literal.properties.every((elem) => elem.kind === ts.SyntaxKind.PropertyAssignment &&
        elem.initializer.kind === ts.SyntaxKind.ArrayLiteralExpression)) {
        return [];
    }
    const assignments = literal.properties;
    // Consider each assignment individually. Either the whole assignment will be removed or
    // a particular decorator within will.
    const toRemove = assignments
        .map((assign) => {
        const decorators = expect(assign.initializer, ts.SyntaxKind.ArrayLiteralExpression).elements;
        if (!decorators.every((el) => el.kind === ts.SyntaxKind.ObjectLiteralExpression)) {
            return [];
        }
        const decsToRemove = decorators.filter((expression) => {
            const lit = expect(expression, ts.SyntaxKind.ObjectLiteralExpression);
            return isAngularDecorator(lit, ngMetadata, checker);
        });
        if (decsToRemove.length === decorators.length) {
            return [assign];
        }
        return decsToRemove;
    })
        .reduce((accum, toRm) => accum.concat(toRm), []);
    // If every node to be removed is a property assignment (full property's decorators) and
    // all properties are accounted for, remove the whole assignment. Otherwise, remove the
    // nodes which were marked as safe.
    if (toRemove.length === assignments.length &&
        toRemove.every((node) => node.kind === ts.SyntaxKind.PropertyAssignment)) {
        return [exprStmt];
    }
    return toRemove;
}
function isAngularDecorator(literal, ngMetadata, checker) {
    const types = literal.properties.filter(isTypeProperty);
    if (types.length !== 1) {
        return false;
    }
    const assign = expect(types[0], ts.SyntaxKind.PropertyAssignment);
    if (assign.initializer.kind !== ts.SyntaxKind.Identifier) {
        return false;
    }
    const id = assign.initializer;
    const res = identifierIsMetadata(id, ngMetadata, checker);
    return res;
}
function isTypeProperty(prop) {
    if (prop.kind !== ts.SyntaxKind.PropertyAssignment) {
        return false;
    }
    const assignment = prop;
    if (assignment.name.kind !== ts.SyntaxKind.Identifier) {
        return false;
    }
    const name = assignment.name;
    return name.text === 'type';
}
// Check if an identifier is part of the known Angular Metadata.
function identifierIsMetadata(id, metadata, checker) {
    const symbol = checker.getSymbolAtLocation(id);
    if (!symbol || !symbol.declarations || !symbol.declarations.length) {
        return false;
    }
    return symbol
        .declarations
        .some((spec) => metadata.indexOf(spec) !== -1);
}
// Check if an import is a tslib helper import (`import * as tslib from "tslib";`)
function isTslibImport(node) {
    return !!(node.moduleSpecifier &&
        node.moduleSpecifier.kind === ts.SyntaxKind.StringLiteral &&
        node.moduleSpecifier.text === 'tslib' &&
        node.importClause &&
        node.importClause.namedBindings &&
        node.importClause.namedBindings.kind === ts.SyntaxKind.NamespaceImport);
}
// Find all namespace imports for `tslib`.
function findTslibImports(node) {
    const imports = [];
    ts.forEachChild(node, (child) => {
        if (child.kind === ts.SyntaxKind.ImportDeclaration) {
            const importDecl = child;
            if (isTslibImport(importDecl)) {
                const importClause = importDecl.importClause;
                const namespaceImport = importClause.namedBindings;
                imports.push(namespaceImport);
            }
        }
    });
    return imports;
}
// Check if an identifier is part of the known tslib identifiers.
function identifierIsTslib(id, tslibImports, checker) {
    const symbol = checker.getSymbolAtLocation(id);
    if (!symbol || !symbol.declarations || !symbol.declarations.length) {
        return false;
    }
    return symbol
        .declarations
        .some((spec) => tslibImports.indexOf(spec) !== -1);
}
// Check if a function call is a tslib helper.
function isTslibHelper(callExpr, helper, tslibImports, checker) {
    let callExprIdent = callExpr.expression;
    if (callExpr.expression.kind !== ts.SyntaxKind.Identifier) {
        if (callExpr.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            const propAccess = callExpr.expression;
            const left = propAccess.expression;
            callExprIdent = propAccess.name;
            if (left.kind !== ts.SyntaxKind.Identifier) {
                return false;
            }
            const id = left;
            if (!identifierIsTslib(id, tslibImports, checker)) {
                return false;
            }
        }
        else {
            return false;
        }
    }
    // node.text on a name that starts with two underscores will return three instead.
    // Unless it's an expression like tslib.__decorate, in which case it's only 2.
    if (callExprIdent.text !== `_${helper}` && callExprIdent.text !== helper) {
        return false;
    }
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NydWItZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfb3B0aW1pemVyL3NyYy90cmFuc2Zvcm1zL3NjcnViLWZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxpQ0FBaUM7QUFDakMsb0RBQXdEO0FBRXhEOztHQUVHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLE9BQWU7SUFDM0MsTUFBTSxPQUFPLEdBQUc7UUFDZCxZQUFZO1FBQ1osWUFBWTtRQUNaLGdCQUFnQjtRQUNoQixnQkFBZ0I7S0FDakIsQ0FBQztJQUVGLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLENBQUM7QUFURCxzQ0FTQztBQUVELDRDQUE0QztBQUM1QyxNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLGNBQWM7SUFDZCxxQkFBcUI7SUFDckIsU0FBUztJQUNULHlCQUF5QjtDQUMxQixDQUFDO0FBRUYsTUFBTSxpQkFBaUIsR0FBRztJQUN4QiwwQkFBMEI7SUFDMUIsV0FBVztJQUNYLFdBQVc7SUFDWCxZQUFZO0lBQ1osVUFBVTtJQUNWLE1BQU07SUFFTiw2QkFBNkI7SUFDN0IsY0FBYztJQUNkLGlCQUFpQjtJQUNqQixhQUFhO0lBQ2IsY0FBYztJQUNkLE9BQU87SUFDUCxRQUFRO0lBQ1IsV0FBVztJQUNYLGNBQWM7Q0FDZixDQUFDO0FBRUYsU0FBZ0IsdUJBQXVCLENBQUMsT0FBbUI7SUFDekQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBRXpDLE9BQU8sQ0FBQyxPQUFpQyxFQUFpQyxFQUFFO1FBRTFFLE1BQU0sV0FBVyxHQUFrQyxDQUFDLEVBQWlCLEVBQUUsRUFBRTtZQUV2RSxNQUFNLFVBQVUs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UUFDeEUsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgY29sbGVjdERlZXBOb2RlcyB9IGZyb20gJy4uL2hlbHBlcnMvYXN0LXV0aWxzJztcblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBGcm9tIDAuOS4wXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0U2NydWJGaWxlKGNvbnRlbnQ6IHN0cmluZykge1xuICBjb25zdCBtYXJrZXJzID0gW1xuICAgICdkZWNvcmF0b3JzJyxcbiAgICAnX19kZWNvcmF0ZScsXG4gICAgJ3Byb3BEZWNvcmF0b3JzJyxcbiAgICAnY3RvclBhcmFtZXRlcnMnLFxuICBdO1xuXG4gIHJldHVybiBtYXJrZXJzLnNvbWUoKG1hcmtlcikgPT4gY29udGVudC5pbmRleE9mKG1hcmtlcikgIT09IC0xKTtcbn1cblxuLy8gRG9uJ3QgcmVtb3ZlIGBjdG9yUGFyYW1ldGVyc2AgZnJvbSB0aGVzZS5cbmNvbnN0IHBsYXRmb3JtV2hpdGVsaXN0ID0gW1xuICAnUGxhdGZvcm1SZWZfJyxcbiAgJ1Rlc3RhYmlsaXR5UmVnaXN0cnknLFxuICAnQ29uc29sZScsXG4gICdCcm93c2VyUGxhdGZvcm1Mb2NhdGlvbicsXG5dO1xuXG5jb25zdCBhbmd1bGFyU3BlY2lmaWVycyA9IFtcbiAgLy8gQ2xhc3MgbGV2ZWwgZGVjb3JhdG9ycy5cbiAgJ0NvbXBvbmVudCcsXG4gICdEaXJlY3RpdmUnLFxuICAnSW5qZWN0YWJsZScsXG4gICdOZ01vZHVsZScsXG4gICdQaXBlJyxcblxuICAvLyBQcm9wZXJ0eSBsZXZlbCBkZWNvcmF0b3JzLlxuICAnQ29udGVudENoaWxkJyxcbiAgJ0NvbnRlbnRDaGlsZHJlbicsXG4gICdIb3N0QmluZGluZycsXG4gICdIb3N0TGlzdGVuZXInLFxuICAnSW5wdXQnLFxuICAnT3V0cHV0JyxcbiAgJ1ZpZXdDaGlsZCcsXG4gICdWaWV3Q2hpbGRyZW4nLFxuXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNjcnViRmlsZVRyYW5zZm9ybWVyKHByb2dyYW06IHRzLlByb2dyYW0pOiB0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8dHMuU291cmNlRmlsZT4ge1xuICBjb25zdCBjaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuXG4gIHJldHVybiAoY29udGV4dDogdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0KTogdHMuVHJhbnNmb3JtZXI8dHMuU291cmNlRmlsZT4gPT4ge1xuXG4gICAgY29uc3QgdHJhbnNmb3JtZXI6IHRzLlRyYW5zZm9ybWVyPHRzLlNvdXJjZUZpbGU+ID0gKHNmOiB0cy5Tb3VyY2VGaWxlKSA9PiB7XG5cbiAgICAgIGNvbnN0IG5nTWV0YWRhdGEgPSBmaW5kQW5ndWxhck1ldGFkYXRhKHNmKTtcbiAgICAgIGNvbnN0IHRzbGliSW1wb3J0cyA9IGZpbmRUc2xpYkltcG9ydHMoc2YpO1xuXG4gICAgICBjb25zdCBub2RlczogdHMuTm9kZVtdID0gW107XG4gICAgICB0cy5mb3JFYWNoQ2hpbGQoc2YsIGNoZWNrTm9kZUZvckRlY29yYXRvcnMpO1xuXG4gICAgICBmdW5jdGlvbiBjaGVja05vZGVGb3JEZWNvcmF0b3JzKG5vZGU6IHRzLk5vZGUpOiB2b2lkIHtcbiAgICAgICAgaWYgKG5vZGUua2luZCAhPT0gdHMuU3ludGF4S2luZC5FeHByZXNzaW9uU3RhdGVtZW50KSB7XG4gICAgICAgICAgLy8gVFMgMi40IG5lc3RzIGRlY29yYXRvcnMgaW5zaWRlIGRvd25sZXZlbGVkIGNsYXNzIElJRkVzLCBzbyB3ZVxuICAgICAgICAgIC8vIG11c3QgcmVjdXJzZSBpbnRvIHRoZW0gdG8gZmluZCB0aGUgcmVsZXZhbnQgZXhwcmVzc2lvbiBzdGF0ZW1lbnRzLlxuICAgICAgICAgIHJldHVybiB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgY2hlY2tOb2RlRm9yRGVjb3JhdG9ycyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhwclN0bXQgPSBub2RlIGFzIHRzLkV4cHJlc3Npb25TdGF0ZW1lbnQ7XG4gICAgICAgIGlmIChpc0RlY29yYXRvckFzc2lnbm1lbnRFeHByZXNzaW9uKGV4cHJTdG10KSkge1xuICAgICAgICAgIG5vZGVzLnB1c2goLi4ucGlja0RlY29yYXRpb25Ob2Rlc1RvUmVtb3ZlKGV4cHJTdG10LCBuZ01ldGFkYXRhLCBjaGVja2VyKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRGVjb3JhdGVBc3NpZ25tZW50RXhwcmVzc2lvbihleHByU3RtdCwgdHNsaWJJbXBvcnRzLCBjaGVja2VyKSkge1xuICAgICAgICAgIG5vZGVzLnB1c2goLi4ucGlja0RlY29yYXRlTm9kZXNUb1JlbW92ZShleHByU3RtdCwgdHNsaWJJbXBvcnRzLCBuZ01ldGFkYXRhLCBjaGVja2VyKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzQW5ndWxhckRlY29yYXRvck1ldGFkYXRhRXhwcmVzc2lvbihleHByU3RtdCwgbmdNZXRhZGF0YSwgdHNsaWJJbXBvcnRzLCBjaGVja2VyKSkge1xuICAgICAgICAgIG5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzUHJvcERlY29yYXRvckFzc2lnbm1lbnRFeHByZXNzaW9uKGV4cHJTdG10KSkge1xuICAgICAgICAgIG5vZGVzLnB1c2goLi4ucGlja1Byb3BEZWNvcmF0aW9uTm9kZXNUb1JlbW92ZShleHByU3RtdCwgbmdNZXRhZGF0YSwgY2hlY2tlcikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0N0b3JQYXJhbXNBc3NpZ25tZW50RXhwcmVzc2lvbihleHByU3RtdClcbiAgICAgICAgICAmJiAhaXNDdG9yUGFyYW1zV2hpdGVsaXN0ZWRTZXJ2aWNlKGV4cHJTdG10KSkge1xuICAgICAgICAgIG5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdmlzaXRvcjogdHMuVmlzaXRvciA9IChub2RlOiB0cy5Ob2RlKTogdHMuVmlzaXRSZXN1bHQ8dHMuTm9kZT4gPT4ge1xuICAgICAgICAvLyBDaGVjayBpZiBub2RlIGlzIGEgc3RhdGVtZW50IHRvIGJlIGRyb3BwZWQuXG4gICAgICAgIGlmIChub2Rlcy5maW5kKChuKSA9PiBuID09PSBub2RlKSkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UgcmV0dXJuIG5vZGUgYXMgaXMuXG4gICAgICAgIHJldHVybiB0cy52aXNpdEVhY2hDaGlsZChub2RlLCB2aXNpdG9yLCBjb250ZXh0KTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiB0cy52aXNpdE5vZGUoc2YsIHZpc2l0b3IpO1xuICAgIH07XG5cbiAgICByZXR1cm4gdHJhbnNmb3JtZXI7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBlY3Q8VCBleHRlbmRzIHRzLk5vZGU+KG5vZGU6IHRzLk5vZGUsIGtpbmQ6IHRzLlN5bnRheEtpbmQpOiBUIHtcbiAgaWYgKG5vZGUua2luZCAhPT0ga2luZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub2RlIHR5cGUuJyk7XG4gIH1cblxuICByZXR1cm4gbm9kZSBhcyBUO1xufVxuXG5mdW5jdGlvbiBuYW1lT2ZTcGVjaWZpZXIobm9kZTogdHMuSW1wb3J0U3BlY2lmaWVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5vZGUubmFtZSAmJiBub2RlLm5hbWUudGV4dCB8fCAnPHVua25vd24+Jztcbn1cblxuZnVuY3Rpb24gZmluZEFuZ3VsYXJNZXRhZGF0YShub2RlOiB0cy5Ob2RlKTogdHMuTm9kZVtdIHtcbiAgbGV0IHNwZWNzOiB0cy5Ob2RlW10gPSBbXTtcbiAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIChjaGlsZCkgPT4ge1xuICAgIGlmIChjaGlsZC5raW5kID09PSB0cy5TeW50YXhLaW5kLkltcG9ydERlY2xhcmF0aW9uKSB7XG4gICAgICBjb25zdCBpbXBvcnREZWNsID0gY2hpbGQgYXMgdHMuSW1wb3J0RGVjbGFyYXRpb247XG4gICAgICBpZiAoaXNBbmd1bGFyQ29yZUltcG9ydChpbXBvcnREZWNsKSkge1xuICAgICAgICBzcGVjcy5wdXNoKC4uLmNvbGxlY3REZWVwTm9kZXM8dHMuSW1wb3J0U3BlY2lmaWVyPihub2RlLCB0cy5TeW50YXhLaW5kLkltcG9ydFNwZWNpZmllcilcbiAgICAgICAgICAuZmlsdGVyKChzcGVjKSA9PiBpc0FuZ3VsYXJDb3JlU3BlY2lmaWVyKHNwZWMpKSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBsb2NhbERlY2wgPSBmaW5kQWxsRGVjbGFyYXRpb25zKG5vZGUpXG4gICAgLmZpbHRlcigoZGVjbCkgPT4gYW5ndWxhclNwZWNpZmllcnMuaW5kZXhPZigoZGVjbC5uYW1lIGFzIHRzLklkZW50aWZpZXIpLnRleHQpICE9PSAtMSk7XG4gIGlmIChsb2NhbERlY2wubGVuZ3RoID09PSBhbmd1bGFyU3BlY2lmaWVycy5sZW5ndGgpIHtcbiAgICBzcGVjcyA9IHNwZWNzLmNvbmNhdChsb2NhbERlY2wpO1xuICB9XG5cbiAgcmV0dXJuIHNwZWNzO1xufVxuXG5mdW5jdGlvbiBmaW5kQWxsRGVjbGFyYXRpb25zKG5vZGU6IHRzLk5vZGUpOiB0cy5WYXJpYWJsZURlY2xhcmF0aW9uW10ge1xuICBjb25zdCBub2RlczogdHMuVmFyaWFibGVEZWNsYXJhdGlvbltdID0gW107XG4gIHRzLmZvckVhY2hDaGlsZChub2RlLCAoY2hpbGQpID0+IHtcbiAgICBpZiAoY2hpbGQua2luZCA9PT0gdHMuU3ludGF4S2luZC5WYXJpYWJsZVN0YXRlbWVudCkge1xuICAgICAgY29uc3QgdlN0bXQgPSBjaGlsZCBhcyB0cy5WYXJpYWJsZVN0YXRlbWVudDtcbiAgICAgIHZTdG10LmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnMuZm9yRWFjaCgoZGVjbCkgPT4ge1xuICAgICAgICBpZiAoZGVjbC5uYW1lLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBub2Rlcy5wdXNoKGRlY2wpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gbm9kZXM7XG59XG5cbmZ1bmN0aW9uIGlzQW5ndWxhckNvcmVJbXBvcnQobm9kZTogdHMuSW1wb3J0RGVjbGFyYXRpb24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHRydWUgJiZcbiAgICBub2RlLm1vZHVsZVNwZWNpZmllciAmJlxuICAgIG5vZGUubW9kdWxlU3BlY2lmaWVyLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbCAmJlxuICAgIChub2RlLm1vZHVsZVNwZWNpZmllciBhcyB0cy5TdHJpbmdMaXRlcmFsKS50ZXh0ID09PSAnQGFuZ3VsYXIvY29yZSc7XG59XG5cbmZ1bmN0aW9uIGlzQW5ndWxhckNvcmVTcGVjaWZpZXIobm9kZTogdHMuSW1wb3J0U3BlY2lmaWVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBhbmd1bGFyU3BlY2lmaWVycy5pbmRleE9mKG5hbWVPZlNwZWNpZmllcihub2RlKSkgIT09IC0xO1xufVxuXG4vLyBDaGVjayBpZiBhc3NpZ25tZW50IGlzIGBDbGF6ei5kZWNvcmF0b3JzID0gWy4uLl07YC5cbmZ1bmN0aW9uIGlzRGVjb3JhdG9yQXNzaWdubWVudEV4cHJlc3Npb24oZXhwclN0bXQ6IHRzLkV4cHJlc3Npb25TdGF0ZW1lbnQpOiBib29sZWFuIHtcbiAgaWYgKGV4cHJTdG10LmV4cHJlc3Npb24ua2luZCAhPT0gdHMuU3ludGF4S2luZC5CaW5hcnlFeHByZXNzaW9uKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGV4cHIgPSBleHByU3RtdC5leHByZXNzaW9uIGFzIHRzLkJpbmFyeUV4cHJlc3Npb247XG4gIGlmIChleHByLmxlZnQua2luZCAhPT0gdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgcHJvcEFjY2VzcyA9IGV4cHIubGVmdCBhcyB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb247XG4gIGlmIChwcm9wQWNjZXNzLmV4cHJlc3Npb24ua2luZCAhPT0gdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChwcm9wQWNjZXNzLm5hbWUudGV4dCAhPT0gJ2RlY29yYXRvcnMnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChleHByLm9wZXJhdG9yVG9rZW4ua2luZCAhPT0gdHMuU3ludGF4S2luZC5GaXJzdEFzc2lnbm1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGV4cHIucmlnaHQua2luZCAhPT0gdHMuU3ludGF4S2luZC5BcnJheUxpdGVyYWxFeHByZXNzaW9uKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIENoZWNrIGlmIGFzc2lnbm1lbnQgaXMgYENsYXp6ID0gX19kZWNvcmF0ZShbLi4uXSwgQ2xhenopYC5cbmZ1bmN0aW9uIGlzRGVjb3JhdGVBc3NpZ25tZW50RXhwcmVzc2lvbihcbiAgZXhwclN0bXQ6IHRzLkV4cHJlc3Npb25TdGF0ZW1lbnQsXG4gIHRzbGliSW1wb3J0czogdHMuTmFtZXNwYWNlSW1wb3J0W10sXG4gIGNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuKTogYm9vbGVhbiB7XG5cbiAgaWYgKGV4cHJTdG10LmV4cHJlc3Npb24ua2luZCAhPT0gdHMuU3ludGF4S2luZC5CaW5hcnlFeHByZXNzaW9uKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGV4cHIgPSBleHByU3RtdC5leHByZXNzaW9uIGFzIHRzLkJpbmFyeUV4cHJlc3Npb247XG4gIGlmIChleHByLmxlZnQua2luZCAhPT0gdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGNsYXNzSWRlbnQgPSBleHByLmxlZnQgYXMgdHMuSWRlbnRpZmllcjtcbiAgbGV0IGNhbGxFeHByOiB0cy5DYWxsRXhwcmVzc2lvbjtcblxuICBpZiAoZXhwci5yaWdodC5raW5kID09PSB0cy5TeW50YXhLaW5kLkNhbGxFeHByZXNzaW9uKSB7XG4gICAgY2FsbEV4cHIgPSBleHByLnJpZ2h0IGFzIHRzLkNhbGxFeHByZXNzaW9uO1xuICB9IGVsc2UgaWYgKGV4cHIucmlnaHQua2luZCA9PT0gdHMuU3ludGF4S2luZC5CaW5hcnlFeHByZXNzaW9uKSB7XG4gICAgLy8gYENsYXp6ID0gQ2xhenpfMSA9IF9fZGVjb3JhdGUoWy4uLl0sIENsYXp6KWAgY2FuIGJlIGZvdW5kIHdoZW4gdGhlcmUgYXJlIHN0YXRpYyBwcm9wZXJ0eVxuICAgIC8vIGFjY2Vzc2VzLlxuICAgIGNvbnN0IGlubmVyRXhwciA9IGV4cHIucmlnaHQgYXMgdHMuQmluYXJ5RXhwcmVzc2lvbjtcbiAgICBpZiAoaW5uZXJFeHByLmxlZnQua2luZCAhPT0gdHMuU3ludGF4S2luZC5JZGVudGlmaWVyXG4gICAgICB8fCBpbm5lckV4cHIucmlnaHQua2luZCAhPT0gdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjYWxsRXhwciA9IGlubmVyRXhwci5yaWdodCBhcyB0cy5DYWxsRXhwcmVzc2lvbjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIWlzVHNsaWJIZWxwZXIoY2FsbEV4cHIsICdfX2RlY29yYXRlJywgdHNsaWJJbXBvcnRzLCBjaGVja2VyKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChjYWxsRXhwci5hcmd1bWVudHMubGVuZ3RoICE9PSAyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChjYWxsRXhwci5hcmd1bWVudHNbMV0ua2luZCAhPT0gdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGNsYXNzQXJnID0gY2FsbEV4cHIuYXJndW1lbnRzWzFdIGFzIHRzLklkZW50aWZpZXI7XG4gIGlmIChjbGFzc0lkZW50LnRleHQgIT09IGNsYXNzQXJnLnRleHQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGNhbGxFeHByLmFyZ3VtZW50c1swXS5raW5kICE9PSB0cy5TeW50YXhLaW5kLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gQ2hlY2sgaWYgZXhwcmVzc2lvbiBpcyBgX19kZWNvcmF0ZShbc210LCBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgT2JqZWN0KV0sIC4uLilgLlxuZnVuY3Rpb24gaXNBbmd1bGFyRGVjb3JhdG9yTWV0YWRhdGFFeHByZXNzaW9uKFxuICBleHByU3RtdDogdHMuRXhwcmVzc2lvblN0YXRlbWVudCxcbiAgbmdNZXRhZGF0YTogdHMuTm9kZVtdLFxuICB0c2xpYkltcG9ydHM6IHRzLk5hbWVzcGFjZUltcG9ydFtdLFxuICBjaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbik6IGJvb2xlYW4ge1xuXG4gIGlmIChleHByU3RtdC5leHByZXNzaW9uLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgY2FsbEV4cHIgPSBleHByU3RtdC5leHByZXNzaW9uIGFzIHRzLkNhbGxFeHByZXNzaW9uO1xuICBpZiAoIWlzVHNsaWJIZWxwZXIoY2FsbEV4cHIsICdfX2RlY29yYXRlJywgdHNsaWJJbXBvcnRzLCBjaGVja2VyKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoY2FsbEV4cHIuYXJndW1lbnRzLmxlbmd0aCAhPT0gNCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoY2FsbEV4cHIuYXJndW1lbnRzWzBdLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuQXJyYXlMaXRlcmFsRXhwcmVzc2lvbikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBkZWNvcmF0ZUFycmF5ID0gY2FsbEV4cHIuYXJndW1lbnRzWzBdIGFzIHRzLkFycmF5TGl0ZXJhbEV4cHJlc3Npb247XG4gIC8vIENoZWNrIGZpcnN0IGFycmF5IGVudHJ5IGZvciBBbmd1bGFyIGRlY29yYXRvcnMuXG4gIGlmIChkZWNvcmF0ZUFycmF5LmVsZW1lbnRzWzBdLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgZGVjb3JhdG9yQ2FsbCA9IGRlY29yYXRlQXJyYXkuZWxlbWVudHNbMF0gYXMgdHMuQ2FsbEV4cHJlc3Npb247XG4gIGlmIChkZWNvcmF0b3JDYWxsLmV4cHJlc3Npb24ua2luZCAhPT0gdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGRlY29yYXRvcklkID0gZGVjb3JhdG9yQ2FsbC5leHByZXNzaW9uIGFzIHRzLklkZW50aWZpZXI7XG4gIGlmICghaWRlbnRpZmllcklzTWV0YWRhdGEoZGVjb3JhdG9ySWQsIG5nTWV0YWRhdGEsIGNoZWNrZXIpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIENoZWNrIHNlY29uZCBhcnJheSBlbnRyeSBmb3IgX19tZXRhZGF0YSBjYWxsLlxuICBpZiAoZGVjb3JhdGVBcnJheS5lbGVtZW50c1sxXS5raW5kICE9PSB0cy5TeW50YXhLaW5kLkNhbGxFeHByZXNzaW9uKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IG1ldGFkYXRhQ2FsbCA9IGRlY29yYXRlQXJyYXkuZWxlbWVudHNbMV0gYXMgdHMuQ2FsbEV4cHJlc3Npb247XG4gIGlmICghaXNUc2xpYkhlbHBlcihtZXRhZGF0YUNhbGwsICdfX21ldGFkYXRhJywgdHNsaWJJbXBvcnRzLCBjaGVja2VyKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBDaGVjayBpZiBhc3NpZ25tZW50IGlzIGBDbGF6ei5wcm9wRGVjb3JhdG9ycyA9IFsuLi5dO2AuXG5mdW5jdGlvbiBpc1Byb3BEZWNvcmF0b3JBc3NpZ25tZW50RXhwcmVzc2lvbihleHByU3RtdDogdHMuRXhwcmVzc2lvblN0YXRlbWVudCk6IGJvb2xlYW4ge1xuICBpZiAoZXhwclN0bXQuZXhwcmVzc2lvbi5raW5kICE9PSB0cy5TeW50YXhLaW5kLkJpbmFyeUV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgZXhwciA9IGV4cHJTdG10LmV4cHJlc3Npb24gYXMgdHMuQmluYXJ5RXhwcmVzc2lvbjtcbiAgaWYgKGV4cHIubGVmdC5raW5kICE9PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBwcm9wQWNjZXNzID0gZXhwci5sZWZ0IGFzIHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbjtcbiAgaWYgKHByb3BBY2Nlc3MuZXhwcmVzc2lvbi5raW5kICE9PSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHByb3BBY2Nlc3MubmFtZS50ZXh0ICE9PSAncHJvcERlY29yYXRvcnMnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChleHByLm9wZXJhdG9yVG9rZW4ua2luZCAhPT0gdHMuU3ludGF4S2luZC5GaXJzdEFzc2lnbm1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGV4cHIucmlnaHQua2luZCAhPT0gdHMuU3ludGF4S2luZC5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBDaGVjayBpZiBhc3NpZ25tZW50IGlzIGBDbGF6ei5jdG9yUGFyYW1ldGVycyA9IFsuLi5dO2AuXG5mdW5jdGlvbiBpc0N0b3JQYXJhbXNBc3NpZ25tZW50RXhwcmVzc2lvbihleHByU3RtdDogdHMuRXhwcmVzc2lvblN0YXRlbWVudCk6IGJvb2xlYW4ge1xuICBpZiAoZXhwclN0bXQuZXhwcmVzc2lvbi5raW5kICE9PSB0cy5TeW50YXhLaW5kLkJpbmFyeUV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgZXhwciA9IGV4cHJTdG10LmV4cHJlc3Npb24gYXMgdHMuQmluYXJ5RXhwcmVzc2lvbjtcbiAgaWYgKGV4cHIubGVmdC5raW5kICE9PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBwcm9wQWNjZXNzID0gZXhwci5sZWZ0IGFzIHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbjtcbiAgaWYgKHByb3BBY2Nlc3MubmFtZS50ZXh0ICE9PSAnY3RvclBhcmFtZXRlcnMnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChwcm9wQWNjZXNzLmV4cHJlc3Npb24ua2luZCAhPT0gdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChleHByLm9wZXJhdG9yVG9rZW4ua2luZCAhPT0gdHMuU3ludGF4S2luZC5GaXJzdEFzc2lnbm1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGV4cHIucmlnaHQua2luZCAhPT0gdHMuU3ludGF4S2luZC5GdW5jdGlvbkV4cHJlc3Npb25cbiAgICAmJiBleHByLnJpZ2h0LmtpbmQgIT09IHRzLlN5bnRheEtpbmQuQXJyb3dGdW5jdGlvblxuICApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNDdG9yUGFyYW1zV2hpdGVsaXN0ZWRTZXJ2aWNlKGV4cHJTdG10OiB0cy5FeHByZXNzaW9uU3RhdGVtZW50KTogYm9vbGVhbiB7XG4gIGNvbnN0IGV4cHIgPSBleHByU3RtdC5leHByZXNzaW9uIGFzIHRzLkJpbmFyeUV4cHJlc3Npb247XG4gIGNvbnN0IHByb3BBY2Nlc3MgPSBleHByLmxlZnQgYXMgdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uO1xuICBjb25zdCBzZXJ2aWNlSWQgPSBwcm9wQWNjZXNzLmV4cHJlc3Npb24gYXMgdHMuSWRlbnRpZmllcjtcblxuICByZXR1cm4gcGxhdGZvcm1XaGl0ZWxpc3QuaW5kZXhPZihzZXJ2aWNlSWQudGV4dCkgIT09IC0xO1xufVxuXG4vLyBSZW1vdmUgQW5ndWxhciBkZWNvcmF0b3JzIGZyb21gQ2xhenouZGVjb3JhdG9ycyA9IFsuLi5dO2AsIG9yIGV4cHJlc3Npb24gaXRzZWxmIGlmIGFsbCBhcmVcbi8vIHJlbW92ZWQuXG5mdW5jdGlvbiBwaWNrRGVjb3JhdGlvbk5vZGVzVG9SZW1vdmUoXG4gIGV4cHJTdG10OiB0cy5FeHByZXNzaW9uU3RhdGVtZW50LFxuICBuZ01ldGFkYXRhOiB0cy5Ob2RlW10sXG4gIGNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuKTogdHMuTm9kZVtdIHtcblxuICBjb25zdCBleHByID0gZXhwZWN0PHRzLkJpbmFyeUV4cHJlc3Npb24+KGV4cHJTdG10LmV4cHJlc3Npb24sIHRzLlN5bnRheEtpbmQuQmluYXJ5RXhwcmVzc2lvbik7XG4gIGNvbnN0IGxpdGVyYWwgPSBleHBlY3Q8dHMuQXJyYXlMaXRlcmFsRXhwcmVzc2lvbj4oZXhwci5yaWdodCxcbiAgICB0cy5TeW50YXhLaW5kLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24pO1xuICBpZiAoIWxpdGVyYWwuZWxlbWVudHMuZXZlcnkoKGVsZW0pID0+IGVsZW0ua2luZCA9PT0gdHMuU3ludGF4S2luZC5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgY29uc3QgZWxlbWVudHMgPSBsaXRlcmFsLmVsZW1lbnRzIGFzIHRzLk5vZGVBcnJheTx0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbj47XG4gIGNvbnN0IG5nRGVjb3JhdG9ycyA9IGVsZW1lbnRzLmZpbHRlcigoZWxlbSkgPT4gaXNBbmd1bGFyRGVjb3JhdG9yKGVsZW0sIG5nTWV0YWRhdGEsIGNoZWNrZXIpKTtcblxuICByZXR1cm4gKGVsZW1lbnRzLmxlbmd0aCA+IG5nRGVjb3JhdG9ycy5sZW5ndGgpID8gbmdEZWNvcmF0b3JzIDogW2V4cHJTdG10XTtcbn1cblxuLy8gUmVtb3ZlIEFuZ3VsYXIgZGVjb3JhdG9ycyBmcm9tIGBDbGF6eiA9IF9fZGVjb3JhdGUoWy4uLl0sIENsYXp6KWAsIG9yIGV4cHJlc3Npb24gaXRzZWxmIGlmIGFsbFxuLy8gYXJlIHJlbW92ZWQuXG5mdW5jdGlvbiBwaWNrRGVjb3JhdGVOb2Rlc1RvUmVtb3ZlKFxuICBleHByU3RtdDogdHMuRXhwcmVzc2lvblN0YXRlbWVudCxcbiAgdHNsaWJJbXBvcnRzOiB0cy5OYW1lc3BhY2VJbXBvcnRbXSxcbiAgbmdNZXRhZGF0YTogdHMuTm9kZVtdLFxuICBjaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbik6IHRzLk5vZGVbXSB7XG5cbiAgY29uc3QgZXhwciA9IGV4cGVjdDx0cy5CaW5hcnlFeHByZXNzaW9uPihleHByU3RtdC5leHByZXNzaW9uLCB0cy5TeW50YXhLaW5kLkJpbmFyeUV4cHJlc3Npb24pO1xuICBjb25zdCBjbGFzc0lkID0gZXhwZWN0PHRzLklkZW50aWZpZXI+KGV4cHIubGVmdCwgdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKTtcbiAgbGV0IGNhbGxFeHByOiB0cy5DYWxsRXhwcmVzc2lvbjtcblxuICBpZiAoZXhwci5yaWdodC5raW5kID09PSB0cy5TeW50YXhLaW5kLkNhbGxFeHByZXNzaW9uKSB7XG4gICAgY2FsbEV4cHIgPSBleHBlY3Q8dHMuQ2FsbEV4cHJlc3Npb24+KGV4cHIucmlnaHQsIHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pO1xuICB9IGVsc2UgaWYgKGV4cHIucmlnaHQua2luZCA9PT0gdHMuU3ludGF4S2luZC5CaW5hcnlFeHByZXNzaW9uKSB7XG4gICAgY29uc3QgaW5uZXJFeHByID0gZXhwci5yaWdodCBhcyB0cy5CaW5hcnlFeHByZXNzaW9uO1xuICAgIGNhbGxFeHByID0gZXhwZWN0PHRzLkNhbGxFeHByZXNzaW9uPihpbm5lckV4cHIucmlnaHQsIHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IGFyckxpdGVyYWwgPSBleHBlY3Q8dHMuQXJyYXlMaXRlcmFsRXhwcmVzc2lvbj4oY2FsbEV4cHIuYXJndW1lbnRzWzBdLFxuICAgIHRzLlN5bnRheEtpbmQuQXJyYXlMaXRlcmFsRXhwcmVzc2lvbik7XG5cbiAgaWYgKCFhcnJMaXRlcmFsLmVsZW1lbnRzLmV2ZXJ5KChlbGVtKSA9PiBlbGVtLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGNvbnN0IGVsZW1lbnRzID0gYXJyTGl0ZXJhbC5lbGVtZW50cyBhcyB0cy5Ob2RlQXJyYXk8dHMuQ2FsbEV4cHJlc3Npb24+O1xuICBjb25zdCBuZ0RlY29yYXRvckNhbGxzID0gZWxlbWVudHMuZmlsdGVyKChlbCkgPT4ge1xuICAgIGlmIChlbC5leHByZXNzaW9uLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBpZCA9IGVsLmV4cHJlc3Npb24gYXMgdHMuSWRlbnRpZmllcjtcblxuICAgIHJldHVybiBpZGVudGlmaWVySXNNZXRhZGF0YShpZCwgbmdNZXRhZGF0YSwgY2hlY2tlcik7XG4gIH0pO1xuXG4gIC8vIE9ubHkgcmVtb3ZlIGNvbnN0cnVjdG9yIHBhcmFtZXRlciBtZXRhZGF0YSBvbiBub24td2hpdGVsaXN0ZWQgY2xhc3Nlcy5cbiAgaWYgKHBsYXRmb3JtV2hpdGVsaXN0LmluZGV4T2YoY2xhc3NJZC50ZXh0KSA9PT0gLTEpIHtcbiAgICAvLyBSZW1vdmUgX19tZXRhZGF0YSBjYWxscyBvZiB0eXBlICdkZXNpZ246cGFyYW10eXBlcycuXG4gICAgY29uc3QgbWV0YWRhdGFDYWxscyA9IGVsZW1lbnRzLmZpbHRlcigoZWwpID0+IHtcbiAgICAgIGlmICghaXNUc2xpYkhlbHBlcihlbCwgJ19fbWV0YWRhdGEnLCB0c2xpYkltcG9ydHMsIGNoZWNrZXIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChlbC5hcmd1bWVudHMubGVuZ3RoIDwgMikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoZWwuYXJndW1lbnRzWzBdLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCBtZXRhZGF0YVR5cGVJZCA9IGVsLmFyZ3VtZW50c1swXSBhcyB0cy5TdHJpbmdMaXRlcmFsO1xuICAgICAgaWYgKG1ldGFkYXRhVHlwZUlkLnRleHQgIT09ICdkZXNpZ246cGFyYW10eXBlcycpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICAvLyBSZW1vdmUgYWxsIF9fcGFyYW0gY2FsbHMuXG4gICAgY29uc3QgcGFyYW1DYWxscyA9IGVsZW1lbnRzLmZpbHRlcigoZWwpID0+IHtcbiAgICAgIGlmICghaXNUc2xpYkhlbHBlcihlbCwgJ19fcGFyYW0nLCB0c2xpYkltcG9ydHMsIGNoZWNrZXIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChlbC5hcmd1bWVudHMubGVuZ3RoICE9IDIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKGVsLmFyZ3VtZW50c1swXS5raW5kICE9PSB0cy5TeW50YXhLaW5kLk51bWVyaWNMaXRlcmFsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgbmdEZWNvcmF0b3JDYWxscy5wdXNoKC4uLm1ldGFkYXRhQ2FsbHMsIC4uLnBhcmFtQ2FsbHMpO1xuICB9XG5cbiAgLy8gSWYgYWxsIGRlY29yYXRvcnMgYXJlIG1ldGFkYXRhIGRlY29yYXRvcnMgdGhlbiByZXR1cm4gdGhlIHdob2xlIGBDbGFzcyA9IF9fZGVjb3JhdGUoWy4uLl0pJ2BcbiAgLy8gc3RhdGVtZW50IHNvIHRoYXQgaXQgaXMgcmVtb3ZlZCBpbiBlbnRpcmV0eVxuICByZXR1cm4gKGVsZW1lbnRzLmxlbmd0aCA9PT0gbmdEZWNvcmF0b3JDYWxscy5sZW5ndGgpID8gW2V4cHJTdG10XSA6IG5nRGVjb3JhdG9yQ2FsbHM7XG59XG5cbi8vIFJlbW92ZSBBbmd1bGFyIGRlY29yYXRvcnMgZnJvbWBDbGF6ei5wcm9wRGVjb3JhdG9ycyA9IFsuLi5dO2AsIG9yIGV4cHJlc3Npb24gaXRzZWxmIGlmIGFsbFxuLy8gYXJlIHJlbW92ZWQuXG5mdW5jdGlvbiBwaWNrUHJvcERlY29yYXRpb25Ob2Rlc1RvUmVtb3ZlKFxuICBleHByU3RtdDogdHMuRXhwcmVzc2lvblN0YXRlbWVudCxcbiAgbmdNZXRhZGF0YTogdHMuTm9kZVtdLFxuICBjaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbik6IHRzLk5vZGVbXSB7XG5cbiAgY29uc3QgZXhwciA9IGV4cGVjdDx0cy5CaW5hcnlFeHByZXNzaW9uPihleHByU3RtdC5leHByZXNzaW9uLCB0cy5TeW50YXhLaW5kLkJpbmFyeUV4cHJlc3Npb24pO1xuICBjb25zdCBsaXRlcmFsID0gZXhwZWN0PHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uPihleHByLnJpZ2h0LFxuICAgIHRzLlN5bnRheEtpbmQuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24pO1xuICBpZiAoIWxpdGVyYWwucHJvcGVydGllcy5ldmVyeSgoZWxlbSkgPT4gZWxlbS5raW5kID09PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QXNzaWdubWVudCAmJlxuICAgIChlbGVtIGFzIHRzLlByb3BlcnR5QXNzaWdubWVudCkuaW5pdGlhbGl6ZXIua2luZCA9PT0gdHMuU3ludGF4S2luZC5BcnJheUxpdGVyYWxFeHByZXNzaW9uKSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBjb25zdCBhc3NpZ25tZW50cyA9IGxpdGVyYWwucHJvcGVydGllcyBhcyB0cy5Ob2RlQXJyYXk8dHMuUHJvcGVydHlBc3NpZ25tZW50PjtcbiAgLy8gQ29uc2lkZXIgZWFjaCBhc3NpZ25tZW50IGluZGl2aWR1YWxseS4gRWl0aGVyIHRoZSB3aG9sZSBhc3NpZ25tZW50IHdpbGwgYmUgcmVtb3ZlZCBvclxuICAvLyBhIHBhcnRpY3VsYXIgZGVjb3JhdG9yIHdpdGhpbiB3aWxsLlxuICBjb25zdCB0b1JlbW92ZSA9IGFzc2lnbm1lbnRzXG4gICAgLm1hcCgoYXNzaWduKSA9PiB7XG4gICAgICBjb25zdCBkZWNvcmF0b3JzID1cbiAgICAgICAgZXhwZWN0PHRzLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24+KGFzc2lnbi5pbml0aWFsaXplcixcbiAgICAgICAgICB0cy5TeW50YXhLaW5kLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24pLmVsZW1lbnRzO1xuICAgICAgaWYgKCFkZWNvcmF0b3JzLmV2ZXJ5KChlbCkgPT4gZWwua2luZCA9PT0gdHMuU3ludGF4S2luZC5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgY29uc3QgZGVjc1RvUmVtb3ZlID0gZGVjb3JhdG9ycy5maWx0ZXIoKGV4cHJlc3Npb24pID0+IHtcbiAgICAgICAgY29uc3QgbGl0ID0gZXhwZWN0PHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uPihleHByZXNzaW9uLFxuICAgICAgICAgIHRzLlN5bnRheEtpbmQuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24pO1xuXG4gICAgICAgIHJldHVybiBpc0FuZ3VsYXJEZWNvcmF0b3IobGl0LCBuZ01ldGFkYXRhLCBjaGVja2VyKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKGRlY3NUb1JlbW92ZS5sZW5ndGggPT09IGRlY29yYXRvcnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBbYXNzaWduXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRlY3NUb1JlbW92ZTtcbiAgICB9KVxuICAgIC5yZWR1Y2UoKGFjY3VtLCB0b1JtKSA9PiBhY2N1bS5jb25jYXQodG9SbSksIFtdIGFzIHRzLk5vZGVbXSk7XG4gIC8vIElmIGV2ZXJ5IG5vZGUgdG8gYmUgcmVtb3ZlZCBpcyBhIHByb3BlcnR5IGFzc2lnbm1lbnQgKGZ1bGwgcHJvcGVydHkncyBkZWNvcmF0b3JzKSBhbmRcbiAgLy8gYWxsIHByb3BlcnRpZXMgYXJlIGFjY291bnRlZCBmb3IsIHJlbW92ZSB0aGUgd2hvbGUgYXNzaWdubWVudC4gT3RoZXJ3aXNlLCByZW1vdmUgdGhlXG4gIC8vIG5vZGVzIHdoaWNoIHdlcmUgbWFya2VkIGFzIHNhZmUuXG4gIGlmICh0b1JlbW92ZS5sZW5ndGggPT09IGFzc2lnbm1lbnRzLmxlbmd0aCAmJlxuICAgIHRvUmVtb3ZlLmV2ZXJ5KChub2RlKSA9PiBub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuUHJvcGVydHlBc3NpZ25tZW50KSkge1xuICAgIHJldHVybiBbZXhwclN0bXRdO1xuICB9XG5cbiAgcmV0dXJuIHRvUmVtb3ZlO1xufVxuXG5mdW5jdGlvbiBpc0FuZ3VsYXJEZWNvcmF0b3IoXG4gIGxpdGVyYWw6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uLFxuICBuZ01ldGFkYXRhOiB0cy5Ob2RlW10sXG4gIGNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuKTogYm9vbGVhbiB7XG5cbiAgY29uc3QgdHlwZXMgPSBsaXRlcmFsLnByb3BlcnRpZXMuZmlsdGVyKGlzVHlwZVByb3BlcnR5KTtcbiAgaWYgKHR5cGVzLmxlbmd0aCAhPT0gMSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBhc3NpZ24gPSBleHBlY3Q8dHMuUHJvcGVydHlBc3NpZ25tZW50Pih0eXBlc1swXSwgdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFzc2lnbm1lbnQpO1xuICBpZiAoYXNzaWduLmluaXRpYWxpemVyLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBpZCA9IGFzc2lnbi5pbml0aWFsaXplciBhcyB0cy5JZGVudGlmaWVyO1xuICBjb25zdCByZXMgPSBpZGVudGlmaWVySXNNZXRhZGF0YShpZCwgbmdNZXRhZGF0YSwgY2hlY2tlcik7XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gaXNUeXBlUHJvcGVydHkocHJvcDogdHMuT2JqZWN0TGl0ZXJhbEVsZW1lbnQpOiBib29sZWFuIHtcbiAgaWYgKHByb3Aua2luZCAhPT0gdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFzc2lnbm1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgYXNzaWdubWVudCA9IHByb3AgYXMgdHMuUHJvcGVydHlBc3NpZ25tZW50O1xuICBpZiAoYXNzaWdubWVudC5uYW1lLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBuYW1lID0gYXNzaWdubWVudC5uYW1lIGFzIHRzLklkZW50aWZpZXI7XG5cbiAgcmV0dXJuIG5hbWUudGV4dCA9PT0gJ3R5cGUnO1xufVxuXG4vLyBDaGVjayBpZiBhbiBpZGVudGlmaWVyIGlzIHBhcnQgb2YgdGhlIGtub3duIEFuZ3VsYXIgTWV0YWRhdGEuXG5mdW5jdGlvbiBpZGVudGlmaWVySXNNZXRhZGF0YShcbiAgaWQ6IHRzLklkZW50aWZpZXIsXG4gIG1ldGFkYXRhOiB0cy5Ob2RlW10sXG4gIGNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IHN5bWJvbCA9IGNoZWNrZXIuZ2V0U3ltYm9sQXRMb2NhdGlvbihpZCk7XG4gIGlmICghc3ltYm9sIHx8ICFzeW1ib2wuZGVjbGFyYXRpb25zIHx8ICFzeW1ib2wuZGVjbGFyYXRpb25zLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBzeW1ib2xcbiAgICAuZGVjbGFyYXRpb25zXG4gICAgLnNvbWUoKHNwZWMpID0+IG1ldGFkYXRhLmluZGV4T2Yoc3BlYykgIT09IC0xKTtcbn1cblxuLy8gQ2hlY2sgaWYgYW4gaW1wb3J0IGlzIGEgdHNsaWIgaGVscGVyIGltcG9ydCAoYGltcG9ydCAqIGFzIHRzbGliIGZyb20gXCJ0c2xpYlwiO2ApXG5mdW5jdGlvbiBpc1RzbGliSW1wb3J0KG5vZGU6IHRzLkltcG9ydERlY2xhcmF0aW9uKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIShub2RlLm1vZHVsZVNwZWNpZmllciAmJlxuICAgIG5vZGUubW9kdWxlU3BlY2lmaWVyLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbCAmJlxuICAgIChub2RlLm1vZHVsZVNwZWNpZmllciBhcyB0cy5TdHJpbmdMaXRlcmFsKS50ZXh0ID09PSAndHNsaWInICYmXG4gICAgbm9kZS5pbXBvcnRDbGF1c2UgJiZcbiAgICBub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzICYmXG4gICAgbm9kZS5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncy5raW5kID09PSB0cy5TeW50YXhLaW5kLk5hbWVzcGFjZUltcG9ydCk7XG59XG5cbi8vIEZpbmQgYWxsIG5hbWVzcGFjZSBpbXBvcnRzIGZvciBgdHNsaWJgLlxuZnVuY3Rpb24gZmluZFRzbGliSW1wb3J0cyhub2RlOiB0cy5Ob2RlKTogdHMuTmFtZXNwYWNlSW1wb3J0W10ge1xuICBjb25zdCBpbXBvcnRzOiB0cy5OYW1lc3BhY2VJbXBvcnRbXSA9IFtdO1xuICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgKGNoaWxkKSA9PiB7XG4gICAgaWYgKGNoaWxkLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuSW1wb3J0RGVjbGFyYXRpb24pIHtcbiAgICAgIGNvbnN0IGltcG9ydERlY2wgPSBjaGlsZCBhcyB0cy5JbXBvcnREZWNsYXJhdGlvbjtcbiAgICAgIGlmIChpc1RzbGliSW1wb3J0KGltcG9ydERlY2wpKSB7XG4gICAgICAgIGNvbnN0IGltcG9ydENsYXVzZSA9IGltcG9ydERlY2wuaW1wb3J0Q2xhdXNlIGFzIHRzLkltcG9ydENsYXVzZTtcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlSW1wb3J0ID0gaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3MgYXMgdHMuTmFtZXNwYWNlSW1wb3J0O1xuICAgICAgICBpbXBvcnRzLnB1c2gobmFtZXNwYWNlSW1wb3J0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpbXBvcnRzO1xufVxuXG4vLyBDaGVjayBpZiBhbiBpZGVudGlmaWVyIGlzIHBhcnQgb2YgdGhlIGtub3duIHRzbGliIGlkZW50aWZpZXJzLlxuZnVuY3Rpb24gaWRlbnRpZmllcklzVHNsaWIoXG4gIGlkOiB0cy5JZGVudGlmaWVyLFxuICB0c2xpYkltcG9ydHM6IHRzLk5hbWVzcGFjZUltcG9ydFtdLFxuICBjaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbik6IGJvb2xlYW4ge1xuICBjb25zdCBzeW1ib2wgPSBjaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24oaWQpO1xuICBpZiAoIXN5bWJvbCB8fCAhc3ltYm9sLmRlY2xhcmF0aW9ucyB8fCAhc3ltYm9sLmRlY2xhcmF0aW9ucy5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gc3ltYm9sXG4gICAgLmRlY2xhcmF0aW9uc1xuICAgIC5zb21lKChzcGVjKSA9PiB0c2xpYkltcG9ydHMuaW5kZXhPZihzcGVjIGFzIHRzLk5hbWVzcGFjZUltcG9ydCkgIT09IC0xKTtcbn1cblxuLy8gQ2hlY2sgaWYgYSBmdW5jdGlvbiBjYWxsIGlzIGEgdHNsaWIgaGVscGVyLlxuZnVuY3Rpb24gaXNUc2xpYkhlbHBlcihcbiAgY2FsbEV4cHI6IHRzLkNhbGxFeHByZXNzaW9uLFxuICBoZWxwZXI6IHN0cmluZyxcbiAgdHNsaWJJbXBvcnRzOiB0cy5OYW1lc3BhY2VJbXBvcnRbXSxcbiAgY2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4pIHtcblxuICBsZXQgY2FsbEV4cHJJZGVudCA9IGNhbGxFeHByLmV4cHJlc3Npb24gYXMgdHMuSWRlbnRpZmllcjtcblxuICBpZiAoY2FsbEV4cHIuZXhwcmVzc2lvbi5raW5kICE9PSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXIpIHtcbiAgICBpZiAoY2FsbEV4cHIuZXhwcmVzc2lvbi5raW5kID09PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbikge1xuICAgICAgY29uc3QgcHJvcEFjY2VzcyA9IGNhbGxFeHByLmV4cHJlc3Npb24gYXMgdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uO1xuICAgICAgY29uc3QgbGVmdCA9IHByb3BBY2Nlc3MuZXhwcmVzc2lvbjtcbiAgICAgIGNhbGxFeHBySWRlbnQgPSBwcm9wQWNjZXNzLm5hbWU7XG5cbiAgICAgIGlmIChsZWZ0LmtpbmQgIT09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlkID0gbGVmdCBhcyB0cy5JZGVudGlmaWVyO1xuXG4gICAgICBpZiAoIWlkZW50aWZpZXJJc1RzbGliKGlkLCB0c2xpYkltcG9ydHMsIGNoZWNrZXIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLy8gbm9kZS50ZXh0IG9uIGEgbmFtZSB0aGF0IHN0YXJ0cyB3aXRoIHR3byB1bmRlcnNjb3JlcyB3aWxsIHJldHVybiB0aHJlZSBpbnN0ZWFkLlxuICAvLyBVbmxlc3MgaXQncyBhbiBleHByZXNzaW9uIGxpa2UgdHNsaWIuX19kZWNvcmF0ZSwgaW4gd2hpY2ggY2FzZSBpdCdzIG9ubHkgMi5cbiAgaWYgKGNhbGxFeHBySWRlbnQudGV4dCAhPT0gYF8ke2hlbHBlcn1gICYmIGNhbGxFeHBySWRlbnQudGV4dCAhPT0gaGVscGVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG4iXX0=