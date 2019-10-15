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
function isBlockLike(node) {
    return node.kind === ts.SyntaxKind.Block
        || node.kind === ts.SyntaxKind.ModuleBlock
        || node.kind === ts.SyntaxKind.CaseClause
        || node.kind === ts.SyntaxKind.DefaultClause
        || node.kind === ts.SyntaxKind.SourceFile;
}
function getWrapEnumsTransformer() {
    return (context) => {
        const transformer = sf => {
            const result = visitBlockStatements(sf.statements, context);
            return ts.updateSourceFileNode(sf, ts.setTextRange(result, sf.statements));
        };
        return transformer;
    };
}
exports.getWrapEnumsTransformer = getWrapEnumsTransformer;
function visitBlockStatements(statements, context) {
    // copy of statements to modify; lazy initialized
    let updatedStatements;
    const visitor = (node) => {
        if (isBlockLike(node)) {
            let result = visitBlockStatements(node.statements, context);
            if (result === node.statements) {
                return node;
            }
            result = ts.setTextRange(result, node.statements);
            switch (node.kind) {
                case ts.SyntaxKind.Block:
                    return ts.updateBlock(node, result);
                case ts.SyntaxKind.ModuleBlock:
                    return ts.updateModuleBlock(node, result);
                case ts.SyntaxKind.CaseClause:
                    return ts.updateCaseClause(node, node.expression, result);
                case ts.SyntaxKind.DefaultClause:
                    return ts.updateDefaultClause(node, result);
                default:
                    return node;
            }
        }
        else {
            return ts.visitEachChild(node, visitor, context);
        }
    };
    // 'oIndex' is the original statement index; 'uIndex' is the updated statement index
    for (let oIndex = 0, uIndex = 0; oIndex < statements.length; oIndex++, uIndex++) {
        const currentStatement = statements[oIndex];
        // these can't contain an enum declaration
        if (currentStatement.kind === ts.SyntaxKind.ImportDeclaration) {
            continue;
        }
        // enum declarations must:
        //   * not be last statement
        //   * be a variable statement
        //   * have only one declaration
        //   * have an identifer as a declaration name
        if (oIndex < statements.length - 1
            && ts.isVariableStatement(currentStatement)
            && currentStatement.declarationList.declarations.length === 1) {
            const variableDeclaration = currentStatement.declarationList.declarations[0];
            if (ts.isIdentifier(variableDeclaration.name)) {
                const name = variableDeclaration.name.text;
                if (!variableDeclaration.initializer) {
                    const iife = findTs2_3EnumIife(name, statements[oIndex + 1]);
                    if (iife) {
                        // found an enum
                        if (!updatedStatements) {
                            updatedStatements = statements.slice();
                        }
                        // update IIFE and replace variable statement and old IIFE
                        updatedStatements.splice(uIndex, 2, updateEnumIife(currentStatement, iife[0], iife[1]));
                        // skip IIFE statement
                        oIndex++;
                        continue;
                    }
                }
                else if (ts.isObjectLiteralExpression(variableDeclaration.initializer)
                    && variableDeclaration.initializer.properties.length === 0) {
                    const enumStatements = findTs2_2EnumStatements(name, statements, oIndex + 1);
                    if (enumStatements.length > 0) {
                        // found an enum
                        if (!updatedStatements) {
                            updatedStatements = statements.slice();
                        }
                        // create wrapper and replace variable statement and enum member statements
                        updatedStatements.splice(uIndex, enumStatements.length + 1, createWrappedEnum(name, currentStatement, enumStatements, variableDeclaration.initializer));
                        // skip enum member declarations
                        oIndex += enumStatements.length;
                        continue;
                    }
                }
                else if (ts.isObjectLiteralExpression(variableDeclaration.initializer)
                    && variableDeclaration.initializer.properties.length !== 0) {
                    const literalPropertyCount = variableDeclaration.initializer.properties.length;
                    const enumStatements = findEnumNameStatements(name, statements, oIndex + 1);
                    if (enumStatements.length === literalPropertyCount) {
                        // found an enum
                        if (!updatedStatements) {
                            updatedStatements = statements.slice();
                        }
                        // create wrapper and replace variable statement and enum member statements
                        updatedStatements.splice(uIndex, enumStatements.length + 1, createWrappedEnum(name, currentStatement, enumStatements, variableDeclaration.initializer));
                        // skip enum member declarations
                        oIndex += enumStatements.length;
                        continue;
                    }
                }
            }
        }
        const result = ts.visitNode(currentStatement, visitor);
        if (result !== currentStatement) {
            if (!updatedStatements) {
                updatedStatements = statements.slice();
            }
            updatedStatements[uIndex] = result;
        }
    }
    // if changes, return updated statements
    // otherwise, return original array instance
    return updatedStatements ? ts.createNodeArray(updatedStatements) : statements;
}
// TS 2.3 enums have statements that are inside a IIFE.
function findTs2_3EnumIife(name, statement) {
    if (!ts.isExpressionStatement(statement)) {
        return null;
    }
    let expression = statement.expression;
    while (ts.isParenthesizedExpression(expression)) {
        expression = expression.expression;
    }
    if (!expression || !ts.isCallExpression(expression) || expression.arguments.length !== 1) {
        return null;
    }
    const callExpression = expression;
    let exportExpression;
    let argument = expression.arguments[0];
    if (!ts.isBinaryExpression(argument)) {
        return null;
    }
    if (!ts.isIdentifier(argument.left) || argument.left.text !== name) {
        return null;
    }
    let potentialExport = false;
    if (argument.operatorToken.kind === ts.SyntaxKind.FirstAssignment) {
        if (!ts.isBinaryExpression(argument.right)
            || argument.right.operatorToken.kind !== ts.SyntaxKind.BarBarToken) {
            return null;
        }
        potentialExport = true;
        argument = argument.right;
    }
    if (!ts.isBinaryExpression(argument)) {
        return null;
    }
    if (argument.operatorToken.kind !== ts.SyntaxKind.BarBarToken) {
        return null;
    }
    if (potentialExport && !ts.isIdentifier(argument.left)) {
        exportExpression = argument.left;
    }
    expression = expression.expression;
    while (ts.isParenthesizedExpression(expression)) {
        expression = expression.expression;
    }
    if (!expression || !ts.isFunctionExpression(expression) || expression.parameters.length !== 1) {
        return null;
    }
    const parameter = expression.parameters[0];
    if (!ts.isIdentifier(parameter.name)) {
        return null;
    }
    // The name of the parameter can be different than the name of the enum if it was renamed
    // due to scope hoisting.
    const parameterName = parameter.name.text;
    // In TS 2.3 enums, the IIFE contains only expressions with a certain format.
    // If we find any that is different, we ignore the whole thing.
    for (let bodyIndex = 0; bodyIndex < expression.body.statements.length; ++bodyIndex) {
        const bodyStatement = expression.body.statements[bodyIndex];
        if (!ts.isExpressionStatement(bodyStatement) || !bodyStatement.expression) {
            return null;
        }
        if (!ts.isBinaryExpression(bodyStatement.expression)
            || bodyStatement.expression.operatorToken.kind !== ts.SyntaxKind.FirstAssignment) {
            return null;
        }
        const assignment = bodyStatement.expression.left;
        const value = bodyStatement.expression.right;
        if (!ts.isElementAccessExpression(assignment) || !ts.isStringLiteral(value)) {
            return null;
        }
        if (!ts.isIdentifier(assignment.expression) || assignment.expression.text !== parameterName) {
            return null;
        }
        const memberArgument = assignment.argumentExpression;
        if (!memberArgument || !ts.isBinaryExpression(memberArgument)
            || memberArgument.operatorToken.kind !== ts.SyntaxKind.FirstAssignment) {
            return null;
        }
        if (!ts.isElementAccessExpression(memberArgument.left)) {
            return null;
        }
        if (!ts.isIdentifier(memberArgument.left.expression)
            || memberArgument.left.expression.text !== parameterName) {
            return null;
        }
        if (!memberArgument.left.argumentExpression
            || !ts.isStringLiteral(memberArgument.left.argumentExpression)) {
            return null;
        }
        if (memberArgument.left.argumentExpression.text !== value.text) {
            return null;
        }
    }
    return [callExpression, exportExpression];
}
// TS 2.2 enums have statements after the variable declaration, with index statements followed
// by value statements.
function findTs2_2EnumStatements(name, statements, statementOffset) {
    const enumValueStatements = [];
    const memberNames = [];
    let index = statementOffset;
    for (; index < statements.length; ++index) {
        // Ensure all statements are of the expected format and using the right identifer.
        // When we find a statement that isn't part of the enum, return what we collected so far.
        const current = statements[index];
        if (!ts.isExpressionStatement(current) || !ts.isBinaryExpression(current.expression)) {
            break;
        }
        const property = current.expression.left;
        if (!property || !ts.isPropertyAccessExpression(property)) {
            break;
        }
        if (!ts.isIdentifier(property.expression) || property.expression.text !== name) {
            break;
        }
        memberNames.push(property.name.text);
        enumValueStatements.push(current);
    }
    if (enumValueStatements.length === 0) {
        return [];
    }
    const enumNameStatements = findEnumNameStatements(name, statements, index, memberNames);
    if (enumNameStatements.length !== enumValueStatements.length) {
        return [];
    }
    return enumValueStatements.concat(enumNameStatements);
}
// Tsickle enums have a variable statement with indexes, followed by value statements.
// See https://github.com/angular/devkit/issues/229#issuecomment-338512056 fore more information.
function findEnumNameStatements(name, statements, statementOffset, memberNames) {
    const enumStatements = [];
    for (let index = statementOffset; index < statements.length; ++index) {
        // Ensure all statements are of the expected format and using the right identifer.
        // When we find a statement that isn't part of the enum, return what we collected so far.
        const current = statements[index];
        if (!ts.isExpressionStatement(current) || !ts.isBinaryExpression(current.expression)) {
            break;
        }
        const access = current.expression.left;
        const value = current.expression.right;
        if (!access || !ts.isElementAccessExpression(access) || !value || !ts.isStringLiteral(value)) {
            break;
        }
        if (memberNames && !memberNames.includes(value.text)) {
            break;
        }
        if (!ts.isIdentifier(access.expression) || access.expression.text !== name) {
            break;
        }
        if (!access.argumentExpression || !ts.isPropertyAccessExpression(access.argumentExpression)) {
            break;
        }
        const enumExpression = access.argumentExpression.expression;
        if (!ts.isIdentifier(enumExpression) || enumExpression.text !== name) {
            break;
        }
        if (value.text !== access.argumentExpression.name.text) {
            break;
        }
        enumStatements.push(current);
    }
    return enumStatements;
}
function addPureComment(node) {
    const pureFunctionComment = '@__PURE__';
    return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, pureFunctionComment, false);
}
function updateHostNode(hostNode, expression) {
    // Update existing host node with the pure comment before the variable declaration initializer.
    const variableDeclaration = hostNode.declarationList.declarations[0];
    const outerVarStmt = ts.updateVariableStatement(hostNode, hostNode.modifiers, ts.updateVariableDeclarationList(hostNode.declarationList, [
        ts.updateVariableDeclaration(variableDeclaration, variableDeclaration.name, variableDeclaration.type, expression),
    ]));
    return outerVarStmt;
}
function updateEnumIife(hostNode, iife, exportAssignment) {
    if (!ts.isParenthesizedExpression(iife.expression)
        || !ts.isFunctionExpression(iife.expression.expression)) {
        throw new Error('Invalid IIFE Structure');
    }
    // Ignore export assignment if variable is directly exported
    if (hostNode.modifiers
        && hostNode.modifiers.findIndex(m => m.kind == ts.SyntaxKind.ExportKeyword) != -1) {
        exportAssignment = undefined;
    }
    const expression = iife.expression.expression;
    const updatedFunction = ts.updateFunctionExpression(expression, expression.modifiers, expression.asteriskToken, expression.name, expression.typeParameters, expression.parameters, expression.type, ts.updateBlock(expression.body, [
        ...expression.body.statements,
        ts.createReturn(expression.parameters[0].name),
    ]));
    let arg = ts.createObjectLiteral();
    if (exportAssignment) {
        arg = ts.createBinary(exportAssignment, ts.SyntaxKind.BarBarToken, arg);
    }
    const updatedIife = ts.updateCall(iife, ts.updateParen(iife.expression, updatedFunction), iife.typeArguments, [arg]);
    let value = addPureComment(updatedIife);
    if (exportAssignment) {
        value = ts.createBinary(exportAssignment, ts.SyntaxKind.FirstAssignment, updatedIife);
    }
    return updateHostNode(hostNode, value);
}
function createWrappedEnum(name, hostNode, statements, literalInitializer) {
    literalInitializer = literalInitializer || ts.createObjectLiteral();
    const innerVarStmt = ts.createVariableStatement(undefined, ts.createVariableDeclarationList([
        ts.createVariableDeclaration(name, undefined, literalInitializer),
    ]));
    const innerReturn = ts.createReturn(ts.createIdentifier(name));
    const iife = ts.createImmediatelyInvokedFunctionExpression([
        innerVarStmt,
        ...statements,
        innerReturn,
    ]);
    return updateHostNode(hostNode, addPureComment(ts.createParen(iife)));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JhcC1lbnVtcy5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfb3B0aW1pemVyL3NyYy90cmFuc2Zvcm1zL3dyYXAtZW51bXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxpQ0FBaUM7QUFFakMsU0FBUyxXQUFXLENBQUMsSUFBYTtJQUNoQyxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLO1dBQ2pDLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXO1dBQ3ZDLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVO1dBQ3RDLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhO1dBQ3pDLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUM7QUFDaEQsQ0FBQztBQUVELFNBQWdCLHVCQUF1QjtJQUNyQyxPQUFPLENBQUMsT0FBaUMsRUFBaUMsRUFBRTtRQUMxRSxNQUFNLFdBQVcsR0FBa0MsRUFBRSxDQUFDLEVBQUU7WUFDdEQsTUFBTSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU1RCxPQUFPLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDN0UsQ0FBQyxDQUFDO1FBRUYsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVZELDBEQVVDO0FBRUQsU0FBUyxvQkFBb0IsQ0FDM0IsVUFBc0MsRUFDdEMsT0FBaUM7SUFHakMsaURBQWlEO0lBQ2pELElBQUksaUJBQWtELENBQUM7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ZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmZ1bmN0aW9uIGlzQmxvY2tMaWtlKG5vZGU6IHRzLk5vZGUpOiBub2RlIGlzIHRzLkJsb2NrTGlrZSB7XG4gIHJldHVybiBub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQmxvY2tcbiAgICAgIHx8IG5vZGUua2luZCA9PT0gdHMuU3ludGF4S2luZC5Nb2R1bGVCbG9ja1xuICAgICAgfHwgbm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLkNhc2VDbGF1c2VcbiAgICAgIHx8IG5vZGUua2luZCA9PT0gdHMuU3ludGF4S2luZC5EZWZhdWx0Q2xhdXNlXG4gICAgICB8fCBub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU291cmNlRmlsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFdyYXBFbnVtc1RyYW5zZm9ybWVyKCk6IHRzLlRyYW5zZm9ybWVyRmFjdG9yeTx0cy5Tb3VyY2VGaWxlPiB7XG4gIHJldHVybiAoY29udGV4dDogdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0KTogdHMuVHJhbnNmb3JtZXI8dHMuU291cmNlRmlsZT4gPT4ge1xuICAgIGNvbnN0IHRyYW5zZm9ybWVyOiB0cy5UcmFuc2Zvcm1lcjx0cy5Tb3VyY2VGaWxlPiA9IHNmID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZpc2l0QmxvY2tTdGF0ZW1lbnRzKHNmLnN0YXRlbWVudHMsIGNvbnRleHQpO1xuXG4gICAgICByZXR1cm4gdHMudXBkYXRlU291cmNlRmlsZU5vZGUoc2YsIHRzLnNldFRleHRSYW5nZShyZXN1bHQsIHNmLnN0YXRlbWVudHMpKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRyYW5zZm9ybWVyO1xuICB9O1xufVxuXG5mdW5jdGlvbiB2aXNpdEJsb2NrU3RhdGVtZW50cyhcbiAgc3RhdGVtZW50czogdHMuTm9kZUFycmF5PHRzLlN0YXRlbWVudD4sXG4gIGNvbnRleHQ6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCxcbik6IHRzLk5vZGVBcnJheTx0cy5TdGF0ZW1lbnQ+IHtcblxuICAvLyBjb3B5IG9mIHN0YXRlbWVudHMgdG8gbW9kaWZ5OyBsYXp5IGluaXRpYWxpemVkXG4gIGxldCB1cGRhdGVkU3RhdGVtZW50czogQXJyYXk8dHMuU3RhdGVtZW50PiB8IHVuZGVmaW5lZDtcblxuICBjb25zdCB2aXNpdG9yOiB0cy5WaXNpdG9yID0gKG5vZGUpID0+IHtcbiAgICBpZiAoaXNCbG9ja0xpa2Uobm9kZSkpIHtcbiAgICAgIGxldCByZXN1bHQgPSB2aXNpdEJsb2NrU3RhdGVtZW50cyhub2RlLnN0YXRlbWVudHMsIGNvbnRleHQpO1xuICAgICAgaWYgKHJlc3VsdCA9PT0gbm9kZS5zdGF0ZW1lbnRzKSB7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfVxuICAgICAgcmVzdWx0ID0gdHMuc2V0VGV4dFJhbmdlKHJlc3VsdCwgbm9kZS5zdGF0ZW1lbnRzKTtcbiAgICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5CbG9jazpcbiAgICAgICAgICByZXR1cm4gdHMudXBkYXRlQmxvY2sobm9kZSwgcmVzdWx0KTtcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk1vZHVsZUJsb2NrOlxuICAgICAgICAgIHJldHVybiB0cy51cGRhdGVNb2R1bGVCbG9jayhub2RlLCByZXN1bHQpO1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQ2FzZUNsYXVzZTpcbiAgICAgICAgICByZXR1cm4gdHMudXBkYXRlQ2FzZUNsYXVzZShub2RlLCBub2RlLmV4cHJlc3Npb24sIHJlc3VsdCk7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5EZWZhdWx0Q2xhdXNlOlxuICAgICAgICAgIHJldHVybiB0cy51cGRhdGVEZWZhdWx0Q2xhdXNlKG5vZGUsIHJlc3VsdCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cy52aXNpdEVhY2hDaGlsZChub2RlLCB2aXNpdG9yLCBjb250ZXh0KTtcbiAgICB9XG4gIH07XG5cbiAgLy8gJ29JbmRleCcgaXMgdGhlIG9yaWdpbmFsIHN0YXRlbWVudCBpbmRleDsgJ3VJbmRleCcgaXMgdGhlIHVwZGF0ZWQgc3RhdGVtZW50IGluZGV4XG4gIGZvciAobGV0IG9JbmRleCA9IDAsIHVJbmRleCA9IDA7IG9JbmRleCA8IHN0YXRlbWVudHMubGVuZ3RoOyBvSW5kZXgrKywgdUluZGV4KyspIHtcbiAgICBjb25zdCBjdXJyZW50U3RhdGVtZW50ID0gc3RhdGVtZW50c1tvSW5kZXhdO1xuXG4gICAgLy8gdGhlc2UgY2FuJ3QgY29udGFpbiBhbiBlbnVtIGRlY2xhcmF0aW9uXG4gICAgaWYgKGN1cnJlbnRTdGF0ZW1lbnQua2luZCA9PT0gdHMuU3ludGF4S2luZC5JbXBvcnREZWNsYXJhdGlvbikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gZW51bSBkZWNsYXJhdGlvbnMgbXVzdDpcbiAgICAvLyAgICogbm90IGJlIGxhc3Qgc3RhdGVtZW50XG4gICAgLy8gICAqIGJlIGEgdmFyaWFibGUgc3RhdGVtZW50XG4gICAgLy8gICAqIGhhdmUgb25seSBvbmUgZGVjbGFyYXRpb25cbiAgICAvLyAgICogaGF2ZSBhbiBpZGVudGlmZXIgYXMgYSBkZWNsYXJhdGlvbiBuYW1lXG4gICAgaWYgKG9JbmRleCA8IHN0YXRlbWVudHMubGVuZ3RoIC0gMVxuICAgICAgICAmJiB0cy5pc1ZhcmlhYmxlU3RhdGVtZW50KGN1cnJlbnRTdGF0ZW1lbnQpXG4gICAgICAgICYmIGN1cnJlbnRTdGF0ZW1lbnQuZGVjbGFyYXRpb25MaXN0LmRlY2xhcmF0aW9ucy5sZW5ndGggPT09IDEpIHtcblxuICAgICAgY29uc3QgdmFyaWFibGVEZWNsYXJhdGlvbiA9IGN1cnJlbnRTdGF0ZW1lbnQuZGVjbGFyYXRpb25MaXN0LmRlY2xhcmF0aW9uc1swXTtcbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIodmFyaWFibGVEZWNsYXJhdGlvbi5uYW1lKSkge1xuICAgICAgICBjb25zdCBuYW1lID0gdmFyaWFibGVEZWNsYXJhdGlvbi5uYW1lLnRleHQ7XG5cbiAgICAgICAgaWYgKCF2YXJpYWJsZURlY2xhcmF0aW9uLmluaXRpYWxpemVyKSB7XG4gICAgICAgICAgY29uc3QgaWlmZSA9IGZpbmRUczJfM0VudW1JaWZlKG5hbWUsIHN0YXRlbWVudHNbb0luZGV4ICsgMV0pO1xuICAgICAgICAgIGlmIChpaWZlKSB7XG4gICAgICAgICAgICAvLyBmb3VuZCBhbiBlbnVtXG4gICAgICAgICAgICBpZiAoIXVwZGF0ZWRTdGF0ZW1lbnRzKSB7XG4gICAgICAgICAgICAgIHVwZGF0ZWRTdGF0ZW1lbnRzID0gc3RhdGVtZW50cy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdXBkYXRlIElJRkUgYW5kIHJlcGxhY2UgdmFyaWFibGUgc3RhdGVtZW50IGFuZCBvbGQgSUlGRVxuICAgICAgICAgICAgdXBkYXRlZFN0YXRlbWVudHMuc3BsaWNlKHVJbmRleCwgMiwgdXBkYXRlRW51bUlpZmUoXG4gICAgICAgICAgICAgIGN1cnJlbnRTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgIGlpZmVbMF0sXG4gICAgICAgICAgICAgIGlpZmVbMV0sXG4gICAgICAgICAgICApKTtcbiAgICAgICAgICAgIC8vIHNraXAgSUlGRSBzdGF0ZW1lbnRcbiAgICAgICAgICAgIG9JbmRleCsrO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24odmFyaWFibGVEZWNsYXJhdGlvbi5pbml0aWFsaXplcilcbiAgICAgICAgICAgICAgICAgICAmJiB2YXJpYWJsZURlY2xhcmF0aW9uLmluaXRpYWxpemVyLnByb3BlcnRpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgY29uc3QgZW51bVN0YXRlbWVudHMgPSBmaW5kVHMyXzJFbnVtU3RhdGVtZW50cyhuYW1lLCBzdGF0ZW1lbnRzLCBvSW5kZXggKyAxKTtcbiAgICAgICAgICBpZiAoZW51bVN0YXRlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gZm91bmQgYW4gZW51bVxuICAgICAgICAgICAgaWYgKCF1cGRhdGVkU3RhdGVtZW50cykge1xuICAgICAgICAgICAgICB1cGRhdGVkU3RhdGVtZW50cyA9IHN0YXRlbWVudHMuc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNyZWF0ZSB3cmFwcGVyIGFuZCByZXBsYWNlIHZhcmlhYmxlIHN0YXRlbWVudCBhbmQgZW51bSBtZW1iZXIgc3RhdGVtZW50c1xuICAgICAgICAgICAgdXBkYXRlZFN0YXRlbWVudHMuc3BsaWNlKHVJbmRleCwgZW51bVN0YXRlbWVudHMubGVuZ3RoICsgMSwgY3JlYXRlV3JhcHBlZEVudW0oXG4gICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgIGN1cnJlbnRTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgIGVudW1TdGF0ZW1lbnRzLFxuICAgICAgICAgICAgICB2YXJpYWJsZURlY2xhcmF0aW9uLmluaXRpYWxpemVyLFxuICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICAvLyBza2lwIGVudW0gbWVtYmVyIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICAgb0luZGV4ICs9IGVudW1TdGF0ZW1lbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKHZhcmlhYmxlRGVjbGFyYXRpb24uaW5pdGlhbGl6ZXIpXG4gICAgICAgICAgJiYgdmFyaWFibGVEZWNsYXJhdGlvbi5pbml0aWFsaXplci5wcm9wZXJ0aWVzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgIGNvbnN0IGxpdGVyYWxQcm9wZXJ0eUNvdW50ID0gdmFyaWFibGVEZWNsYXJhdGlvbi5pbml0aWFsaXplci5wcm9wZXJ0aWVzLmxlbmd0aDtcbiAgICAgICAgICBjb25zdCBlbnVtU3RhdGVtZW50cyA9IGZpbmRFbnVtTmFtZVN0YXRlbWVudHMobmFtZSwgc3RhdGVtZW50cywgb0luZGV4ICsgMSk7XG4gICAgICAgICAgaWYgKGVudW1TdGF0ZW1lbnRzLmxlbmd0aCA9PT0gbGl0ZXJhbFByb3BlcnR5Q291bnQpIHtcbiAgICAgICAgICAgIC8vIGZvdW5kIGFuIGVudW1cbiAgICAgICAgICAgIGlmICghdXBkYXRlZFN0YXRlbWVudHMpIHtcbiAgICAgICAgICAgICAgdXBkYXRlZFN0YXRlbWVudHMgPSBzdGF0ZW1lbnRzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjcmVhdGUgd3JhcHBlciBhbmQgcmVwbGFjZSB2YXJpYWJsZSBzdGF0ZW1lbnQgYW5kIGVudW0gbWVtYmVyIHN0YXRlbWVudHNcbiAgICAgICAgICAgIHVwZGF0ZWRTdGF0ZW1lbnRzLnNwbGljZSh1SW5kZXgsIGVudW1TdGF0ZW1lbnRzLmxlbmd0aCArIDEsIGNyZWF0ZVdyYXBwZWRFbnVtKFxuICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICBjdXJyZW50U3RhdGVtZW50LFxuICAgICAgICAgICAgICBlbnVtU3RhdGVtZW50cyxcbiAgICAgICAgICAgICAgdmFyaWFibGVEZWNsYXJhdGlvbi5pbml0aWFsaXplcixcbiAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgLy8gc2tpcCBlbnVtIG1lbWJlciBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAgIG9JbmRleCArPSBlbnVtU3RhdGVtZW50cy5sZW5ndGg7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0cy52aXNpdE5vZGUoY3VycmVudFN0YXRlbWVudCwgdmlzaXRvcik7XG4gICAgaWYgKHJlc3VsdCAhPT0gY3VycmVudFN0YXRlbWVudCkge1xuICAgICAgaWYgKCF1cGRhdGVkU3RhdGVtZW50cykge1xuICAgICAgICB1cGRhdGVkU3RhdGVtZW50cyA9IHN0YXRlbWVudHMuc2xpY2UoKTtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZWRTdGF0ZW1lbnRzW3VJbmRleF0gPSByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgY2hhbmdlcywgcmV0dXJuIHVwZGF0ZWQgc3RhdGVtZW50c1xuICAvLyBvdGhlcndpc2UsIHJldHVybiBvcmlnaW5hbCBhcnJheSBpbnN0YW5jZVxuICByZXR1cm4gdXBkYXRlZFN0YXRlbWVudHMgPyB0cy5jcmVhdGVOb2RlQXJyYXkodXBkYXRlZFN0YXRlbWVudHMpIDogc3RhdGVtZW50cztcbn1cblxuLy8gVFMgMi4zIGVudW1zIGhhdmUgc3RhdGVtZW50cyB0aGF0IGFyZSBpbnNpZGUgYSBJSUZFLlxuZnVuY3Rpb24gZmluZFRzMl8zRW51bUlpZmUoXG4gIG5hbWU6IHN0cmluZyxcbiAgc3RhdGVtZW50OiB0cy5TdGF0ZW1lbnQsXG4pOiBbdHMuQ2FsbEV4cHJlc3Npb24sIHRzLkV4cHJlc3Npb24gfCB1bmRlZmluZWRdIHwgbnVsbCB7XG4gIGlmICghdHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KHN0YXRlbWVudCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGxldCBleHByZXNzaW9uID0gc3RhdGVtZW50LmV4cHJlc3Npb247XG4gIHdoaWxlICh0cy5pc1BhcmVudGhlc2l6ZWRFeHByZXNzaW9uKGV4cHJlc3Npb24pKSB7XG4gICAgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb24uZXhwcmVzc2lvbjtcbiAgfVxuXG4gIGlmICghZXhwcmVzc2lvbiB8fCAhdHMuaXNDYWxsRXhwcmVzc2lvbihleHByZXNzaW9uKSB8fCBleHByZXNzaW9uLmFyZ3VtZW50cy5sZW5ndGggIT09IDEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGNhbGxFeHByZXNzaW9uID0gZXhwcmVzc2lvbjtcbiAgbGV0IGV4cG9ydEV4cHJlc3Npb247XG5cbiAgbGV0IGFyZ3VtZW50ID0gZXhwcmVzc2lvbi5hcmd1bWVudHNbMF07XG4gIGlmICghdHMuaXNCaW5hcnlFeHByZXNzaW9uKGFyZ3VtZW50KSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKCF0cy5pc0lkZW50aWZpZXIoYXJndW1lbnQubGVmdCkgfHwgYXJndW1lbnQubGVmdC50ZXh0ICE9PSBuYW1lKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBsZXQgcG90ZW50aWFsRXhwb3J0ID0gZmFsc2U7XG4gIGlmIChhcmd1bWVudC5vcGVyYXRvclRva2VuLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRmlyc3RBc3NpZ25tZW50KSB7XG4gICAgaWYgKCF0cy5pc0JpbmFyeUV4cHJlc3Npb24oYXJndW1lbnQucmlnaHQpXG4gICAgICAgIHx8IGFyZ3VtZW50LnJpZ2h0Lm9wZXJhdG9yVG9rZW4ua2luZCAhPT0gdHMuU3ludGF4S2luZC5CYXJCYXJUb2tlbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcG90ZW50aWFsRXhwb3J0ID0gdHJ1ZTtcbiAgICBhcmd1bWVudCA9IGFyZ3VtZW50LnJpZ2h0O1xuICB9XG5cbiAgaWYgKCF0cy5pc0JpbmFyeUV4cHJlc3Npb24oYXJndW1lbnQpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAoYXJndW1lbnQub3BlcmF0b3JUb2tlbi5raW5kICE9PSB0cy5TeW50YXhLaW5kLkJhckJhclRva2VuKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAocG90ZW50aWFsRXhwb3J0ICYmICF0cy5pc0lkZW50aWZpZXIoYXJndW1lbnQubGVmdCkpIHtcbiAgICBleHBvcnRFeHByZXNzaW9uID0gYXJndW1lbnQubGVmdDtcbiAgfVxuXG4gIGV4cHJlc3Npb24gPSBleHByZXNzaW9uLmV4cHJlc3Npb247XG4gIHdoaWxlICh0cy5pc1BhcmVudGhlc2l6ZWRFeHByZXNzaW9uKGV4cHJlc3Npb24pKSB7XG4gICAgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb24uZXhwcmVzc2lvbjtcbiAgfVxuXG4gIGlmICghZXhwcmVzc2lvbiB8fCAhdHMuaXNGdW5jdGlvbkV4cHJlc3Npb24oZXhwcmVzc2lvbikgfHwgZXhwcmVzc2lvbi5wYXJhbWV0ZXJzLmxlbmd0aCAhPT0gMSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgcGFyYW1ldGVyID0gZXhwcmVzc2lvbi5wYXJhbWV0ZXJzWzBdO1xuICBpZiAoIXRzLmlzSWRlbnRpZmllcihwYXJhbWV0ZXIubmFtZSkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIgY2FuIGJlIGRpZmZlcmVudCB0aGFuIHRoZSBuYW1lIG9mIHRoZSBlbnVtIGlmIGl0IHdhcyByZW5hbWVkXG4gIC8vIGR1ZSB0byBzY29wZSBob2lzdGluZy5cbiAgY29uc3QgcGFyYW1ldGVyTmFtZSA9IHBhcmFtZXRlci5uYW1lLnRleHQ7XG5cbiAgLy8gSW4gVFMgMi4zIGVudW1zLCB0aGUgSUlGRSBjb250YWlucyBvbmx5IGV4cHJlc3Npb25zIHdpdGggYSBjZXJ0YWluIGZvcm1hdC5cbiAgLy8gSWYgd2UgZmluZCBhbnkgdGhhdCBpcyBkaWZmZXJlbnQsIHdlIGlnbm9yZSB0aGUgd2hvbGUgdGhpbmcuXG4gIGZvciAobGV0IGJvZHlJbmRleCA9IDA7IGJvZHlJbmRleCA8IGV4cHJlc3Npb24uYm9keS5zdGF0ZW1lbnRzLmxlbmd0aDsgKytib2R5SW5kZXgpIHtcbiAgICBjb25zdCBib2R5U3RhdGVtZW50ID0gZXhwcmVzc2lvbi5ib2R5LnN0YXRlbWVudHNbYm9keUluZGV4XTtcblxuICAgIGlmICghdHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KGJvZHlTdGF0ZW1lbnQpIHx8ICFib2R5U3RhdGVtZW50LmV4cHJlc3Npb24pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghdHMuaXNCaW5hcnlFeHByZXNzaW9uKGJvZHlTdGF0ZW1lbnQuZXhwcmVzc2lvbilcbiAgICAgICAgfHwgYm9keVN0YXRlbWVudC5leHByZXNzaW9uLm9wZXJhdG9yVG9rZW4ua2luZCAhPT0gdHMuU3ludGF4S2luZC5GaXJzdEFzc2lnbm1lbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGFzc2lnbm1lbnQgPSBib2R5U3RhdGVtZW50LmV4cHJlc3Npb24ubGVmdDtcbiAgICBjb25zdCB2YWx1ZSA9IGJvZHlTdGF0ZW1lbnQuZXhwcmVzc2lvbi5yaWdodDtcbiAgICBpZiAoIXRzLmlzRWxlbWVudEFjY2Vzc0V4cHJlc3Npb24oYXNzaWdubWVudCkgfHwgIXRzLmlzU3RyaW5nTGl0ZXJhbCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghdHMuaXNJZGVudGlmaWVyKGFzc2lnbm1lbnQuZXhwcmVzc2lvbikgfHwgYXNzaWdubWVudC5leHByZXNzaW9uLnRleHQgIT09IHBhcmFtZXRlck5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG1lbWJlckFyZ3VtZW50ID0gYXNzaWdubWVudC5hcmd1bWVudEV4cHJlc3Npb247XG4gICAgaWYgKCFtZW1iZXJBcmd1bWVudCB8fCAhdHMuaXNCaW5hcnlFeHByZXNzaW9uKG1lbWJlckFyZ3VtZW50KVxuICAgICAgICB8fCBtZW1iZXJBcmd1bWVudC5vcGVyYXRvclRva2VuLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuRmlyc3RBc3NpZ25tZW50KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cblxuICAgIGlmICghdHMuaXNFbGVtZW50QWNjZXNzRXhwcmVzc2lvbihtZW1iZXJBcmd1bWVudC5sZWZ0KSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCF0cy5pc0lkZW50aWZpZXIobWVtYmVyQXJndW1lbnQubGVmdC5leHByZXNzaW9uKVxuICAgICAgfHwgbWVtYmVyQXJndW1lbnQubGVmdC5leHByZXNzaW9uLnRleHQgIT09IHBhcmFtZXRlck5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghbWVtYmVyQXJndW1lbnQubGVmdC5hcmd1bWVudEV4cHJlc3Npb25cbiAgICAgICAgfHwgIXRzLmlzU3RyaW5nTGl0ZXJhbChtZW1iZXJBcmd1bWVudC5sZWZ0LmFyZ3VtZW50RXhwcmVzc2lvbikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChtZW1iZXJBcmd1bWVudC5sZWZ0LmFyZ3VtZW50RXhwcmVzc2lvbi50ZXh0ICE9PSB2YWx1ZS50ZXh0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW2NhbGxFeHByZXNzaW9uLCBleHBvcnRFeHByZXNzaW9uXTtcbn1cblxuLy8gVFMgMi4yIGVudW1zIGhhdmUgc3RhdGVtZW50cyBhZnRlciB0aGUgdmFyaWFibGUgZGVjbGFyYXRpb24sIHdpdGggaW5kZXggc3RhdGVtZW50cyBmb2xsb3dlZFxuLy8gYnkgdmFsdWUgc3RhdGVtZW50cy5cbmZ1bmN0aW9uIGZpbmRUczJfMkVudW1TdGF0ZW1lbnRzKFxuICBuYW1lOiBzdHJpbmcsXG4gIHN0YXRlbWVudHM6IHRzLk5vZGVBcnJheTx0cy5TdGF0ZW1lbnQ+LFxuICBzdGF0ZW1lbnRPZmZzZXQ6IG51bWJlcixcbik6IHRzLlN0YXRlbWVudFtdIHtcbiAgY29uc3QgZW51bVZhbHVlU3RhdGVtZW50czogdHMuU3RhdGVtZW50W10gPSBbXTtcbiAgY29uc3QgbWVtYmVyTmFtZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGluZGV4ID0gc3RhdGVtZW50T2Zmc2V0O1xuICBmb3IgKDsgaW5kZXggPCBzdGF0ZW1lbnRzLmxlbmd0aDsgKytpbmRleCkge1xuICAgIC8vIEVuc3VyZSBhbGwgc3RhdGVtZW50cyBhcmUgb2YgdGhlIGV4cGVjdGVkIGZvcm1hdCBhbmQgdXNpbmcgdGhlIHJpZ2h0IGlkZW50aWZlci5cbiAgICAvLyBXaGVuIHdlIGZpbmQgYSBzdGF0ZW1lbnQgdGhhdCBpc24ndCBwYXJ0IG9mIHRoZSBlbnVtLCByZXR1cm4gd2hhdCB3ZSBjb2xsZWN0ZWQgc28gZmFyLlxuICAgIGNvbnN0IGN1cnJlbnQgPSBzdGF0ZW1lbnRzW2luZGV4XTtcbiAgICBpZiAoIXRzLmlzRXhwcmVzc2lvblN0YXRlbWVudChjdXJyZW50KSB8fCAhdHMuaXNCaW5hcnlFeHByZXNzaW9uKGN1cnJlbnQuZXhwcmVzc2lvbikpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IHByb3BlcnR5ID0gY3VycmVudC5leHByZXNzaW9uLmxlZnQ7XG4gICAgaWYgKCFwcm9wZXJ0eSB8fCAhdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24ocHJvcGVydHkpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoIXRzLmlzSWRlbnRpZmllcihwcm9wZXJ0eS5leHByZXNzaW9uKSB8fCBwcm9wZXJ0eS5leHByZXNzaW9uLnRleHQgIT09IG5hbWUpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIG1lbWJlck5hbWVzLnB1c2gocHJvcGVydHkubmFtZS50ZXh0KTtcbiAgICBlbnVtVmFsdWVTdGF0ZW1lbnRzLnB1c2goY3VycmVudCk7XG4gIH1cblxuICBpZiAoZW51bVZhbHVlU3RhdGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCBlbnVtTmFtZVN0YXRlbWVudHMgPSBmaW5kRW51bU5hbWVTdGF0ZW1lbnRzKG5hbWUsIHN0YXRlbWVudHMsIGluZGV4LCBtZW1iZXJOYW1lcyk7XG4gIGlmIChlbnVtTmFtZVN0YXRlbWVudHMubGVuZ3RoICE9PSBlbnVtVmFsdWVTdGF0ZW1lbnRzLmxlbmd0aCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHJldHVybiBlbnVtVmFsdWVTdGF0ZW1lbnRzLmNvbmNhdChlbnVtTmFtZVN0YXRlbWVudHMpO1xufVxuXG4vLyBUc2lja2xlIGVudW1zIGhhdmUgYSB2YXJpYWJsZSBzdGF0ZW1lbnQgd2l0aCBpbmRleGVzLCBmb2xsb3dlZCBieSB2YWx1ZSBzdGF0ZW1lbnRzLlxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2RldmtpdC9pc3N1ZXMvMjI5I2lzc3VlY29tbWVudC0zMzg1MTIwNTYgZm9yZSBtb3JlIGluZm9ybWF0aW9uLlxuZnVuY3Rpb24gZmluZEVudW1OYW1lU3RhdGVtZW50cyhcbiAgbmFtZTogc3RyaW5nLFxuICBzdGF0ZW1lbnRzOiB0cy5Ob2RlQXJyYXk8dHMuU3RhdGVtZW50PixcbiAgc3RhdGVtZW50T2Zmc2V0OiBudW1iZXIsXG4gIG1lbWJlck5hbWVzPzogc3RyaW5nW10sXG4pOiB0cy5TdGF0ZW1lbnRbXSB7XG4gIGNvbnN0IGVudW1TdGF0ZW1lbnRzOiB0cy5TdGF0ZW1lbnRbXSA9IFtdO1xuXG4gIGZvciAobGV0IGluZGV4ID0gc3RhdGVtZW50T2Zmc2V0OyBpbmRleCA8IHN0YXRlbWVudHMubGVuZ3RoOyArK2luZGV4KSB7XG4gICAgLy8gRW5zdXJlIGFsbCBzdGF0ZW1lbnRzIGFyZSBvZiB0aGUgZXhwZWN0ZWQgZm9ybWF0IGFuZCB1c2luZyB0aGUgcmlnaHQgaWRlbnRpZmVyLlxuICAgIC8vIFdoZW4gd2UgZmluZCBhIHN0YXRlbWVudCB0aGF0IGlzbid0IHBhcnQgb2YgdGhlIGVudW0sIHJldHVybiB3aGF0IHdlIGNvbGxlY3RlZCBzbyBmYXIuXG4gICAgY29uc3QgY3VycmVudCA9IHN0YXRlbWVudHNbaW5kZXhdO1xuICAgIGlmICghdHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KGN1cnJlbnQpIHx8ICF0cy5pc0JpbmFyeUV4cHJlc3Npb24oY3VycmVudC5leHByZXNzaW9uKSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgYWNjZXNzID0gY3VycmVudC5leHByZXNzaW9uLmxlZnQ7XG4gICAgY29uc3QgdmFsdWUgPSBjdXJyZW50LmV4cHJlc3Npb24ucmlnaHQ7XG4gICAgaWYgKCFhY2Nlc3MgfHwgIXRzLmlzRWxlbWVudEFjY2Vzc0V4cHJlc3Npb24oYWNjZXNzKSB8fCAhdmFsdWUgfHwgIXRzLmlzU3RyaW5nTGl0ZXJhbCh2YWx1ZSkpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChtZW1iZXJOYW1lcyAmJiAhbWVtYmVyTmFtZXMuaW5jbHVkZXModmFsdWUudGV4dCkpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmICghdHMuaXNJZGVudGlmaWVyKGFjY2Vzcy5leHByZXNzaW9uKSB8fCBhY2Nlc3MuZXhwcmVzc2lvbi50ZXh0ICE9PSBuYW1lKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoIWFjY2Vzcy5hcmd1bWVudEV4cHJlc3Npb24gfHwgIXRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKGFjY2Vzcy5hcmd1bWVudEV4cHJlc3Npb24pKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBlbnVtRXhwcmVzc2lvbiA9IGFjY2Vzcy5hcmd1bWVudEV4cHJlc3Npb24uZXhwcmVzc2lvbjtcbiAgICBpZiAoIXRzLmlzSWRlbnRpZmllcihlbnVtRXhwcmVzc2lvbikgfHwgZW51bUV4cHJlc3Npb24udGV4dCAhPT0gbmFtZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlLnRleHQgIT09IGFjY2Vzcy5hcmd1bWVudEV4cHJlc3Npb24ubmFtZS50ZXh0KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBlbnVtU3RhdGVtZW50cy5wdXNoKGN1cnJlbnQpO1xuICB9XG5cbiAgcmV0dXJuIGVudW1TdGF0ZW1lbnRzO1xufVxuXG5mdW5jdGlvbiBhZGRQdXJlQ29tbWVudDxUIGV4dGVuZHMgdHMuTm9kZT4obm9kZTogVCk6IFQge1xuICBjb25zdCBwdXJlRnVuY3Rpb25Db21tZW50ID0gJ0BfX1BVUkVfXyc7XG5cbiAgcmV0dXJuIHRzLmFkZFN5bnRoZXRpY0xlYWRpbmdDb21tZW50KFxuICAgIG5vZGUsXG4gICAgdHMuU3ludGF4S2luZC5NdWx0aUxpbmVDb21tZW50VHJpdmlhLFxuICAgIHB1cmVGdW5jdGlvbkNvbW1lbnQsXG4gICAgZmFsc2UsXG4gICk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUhvc3ROb2RlKFxuICBob3N0Tm9kZTogdHMuVmFyaWFibGVTdGF0ZW1lbnQsXG4gIGV4cHJlc3Npb246IHRzLkV4cHJlc3Npb24sXG4pOiB0cy5TdGF0ZW1lbnQge1xuXG4gIC8vIFVwZGF0ZSBleGlzdGluZyBob3N0IG5vZGUgd2l0aCB0aGUgcHVyZSBjb21tZW50IGJlZm9yZSB0aGUgdmFyaWFibGUgZGVjbGFyYXRpb24gaW5pdGlhbGl6ZXIuXG4gIGNvbnN0IHZhcmlhYmxlRGVjbGFyYXRpb24gPSBob3N0Tm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zWzBdO1xuICBjb25zdCBvdXRlclZhclN0bXQgPSB0cy51cGRhdGVWYXJpYWJsZVN0YXRlbWVudChcbiAgICBob3N0Tm9kZSxcbiAgICBob3N0Tm9kZS5tb2RpZmllcnMsXG4gICAgdHMudXBkYXRlVmFyaWFibGVEZWNsYXJhdGlvbkxpc3QoXG4gICAgICBob3N0Tm9kZS5kZWNsYXJhdGlvbkxpc3QsXG4gICAgICBbXG4gICAgICAgIHRzLnVwZGF0ZVZhcmlhYmxlRGVjbGFyYXRpb24oXG4gICAgICAgICAgdmFyaWFibGVEZWNsYXJhdGlvbixcbiAgICAgICAgICB2YXJpYWJsZURlY2xhcmF0aW9uLm5hbWUsXG4gICAgICAgICAgdmFyaWFibGVEZWNsYXJhdGlvbi50eXBlLFxuICAgICAgICAgIGV4cHJlc3Npb24sXG4gICAgICAgICksXG4gICAgICBdLFxuICAgICksXG4gICk7XG5cbiAgcmV0dXJuIG91dGVyVmFyU3RtdDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRW51bUlpZmUoXG4gIGhvc3ROb2RlOiB0cy5WYXJpYWJsZVN0YXRlbWVudCxcbiAgaWlmZTogdHMuQ2FsbEV4cHJlc3Npb24sXG4gIGV4cG9ydEFzc2lnbm1lbnQ/OiB0cy5FeHByZXNzaW9uLFxuKTogdHMuU3RhdGVtZW50IHtcbiAgaWYgKCF0cy5pc1BhcmVudGhlc2l6ZWRFeHByZXNzaW9uKGlpZmUuZXhwcmVzc2lvbilcbiAgICAgIHx8ICF0cy5pc0Z1bmN0aW9uRXhwcmVzc2lvbihpaWZlLmV4cHJlc3Npb24uZXhwcmVzc2lvbikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgSUlGRSBTdHJ1Y3R1cmUnKTtcbiAgfVxuXG4gIC8vIElnbm9yZSBleHBvcnQgYXNzaWdubWVudCBpZiB2YXJpYWJsZSBpcyBkaXJlY3RseSBleHBvcnRlZFxuICBpZiAoaG9zdE5vZGUubW9kaWZpZXJzXG4gICAgICAmJiBob3N0Tm9kZS5tb2RpZmllcnMuZmluZEluZGV4KG0gPT4gbS5raW5kID09IHRzLlN5bnRheEtpbmQuRXhwb3J0S2V5d29yZCkgIT0gLTEpIHtcbiAgICBleHBvcnRBc3NpZ25tZW50ID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgZXhwcmVzc2lvbiA9IGlpZmUuZXhwcmVzc2lvbi5leHByZXNzaW9uO1xuICBjb25zdCB1cGRhdGVkRnVuY3Rpb24gPSB0cy51cGRhdGVGdW5jdGlvbkV4cHJlc3Npb24oXG4gICAgZXhwcmVzc2lvbixcbiAgICBleHByZXNzaW9uLm1vZGlmaWVycyxcbiAgICBleHByZXNzaW9uLmFzdGVyaXNrVG9rZW4sXG4gICAgZXhwcmVzc2lvbi5uYW1lLFxuICAgIGV4cHJlc3Npb24udHlwZVBhcmFtZXRlcnMsXG4gICAgZXhwcmVzc2lvbi5wYXJhbWV0ZXJzLFxuICAgIGV4cHJlc3Npb24udHlwZSxcbiAgICB0cy51cGRhdGVCbG9jayhcbiAgICAgIGV4cHJlc3Npb24uYm9keSxcbiAgICAgIFtcbiAgICAgICAgLi4uZXhwcmVzc2lvbi5ib2R5LnN0YXRlbWVudHMsXG4gICAgICAgIHRzLmNyZWF0ZVJldHVybihleHByZXNzaW9uLnBhcmFtZXRlcnNbMF0ubmFtZSBhcyB0cy5JZGVudGlmaWVyKSxcbiAgICAgIF0sXG4gICAgKSxcbiAgKTtcblxuICBsZXQgYXJnOiB0cy5FeHByZXNzaW9uID0gdHMuY3JlYXRlT2JqZWN0TGl0ZXJhbCgpO1xuICBpZiAoZXhwb3J0QXNzaWdubWVudCkge1xuICAgIGFyZyA9IHRzLmNyZWF0ZUJpbmFyeShleHBvcnRBc3NpZ25tZW50LCB0cy5TeW50YXhLaW5kLkJhckJhclRva2VuLCBhcmcpO1xuICB9XG4gIGNvbnN0IHVwZGF0ZWRJaWZlID0gdHMudXBkYXRlQ2FsbChcbiAgICBpaWZlLFxuICAgIHRzLnVwZGF0ZVBhcmVuKFxuICAgICAgaWlmZS5leHByZXNzaW9uLFxuICAgICAgdXBkYXRlZEZ1bmN0aW9uLFxuICAgICksXG4gICAgaWlmZS50eXBlQXJndW1lbnRzLFxuICAgIFthcmddLFxuICApO1xuXG4gIGxldCB2YWx1ZTogdHMuRXhwcmVzc2lvbiA9IGFkZFB1cmVDb21tZW50KHVwZGF0ZWRJaWZlKTtcbiAgaWYgKGV4cG9ydEFzc2lnbm1lbnQpIHtcbiAgICB2YWx1ZSA9IHRzLmNyZWF0ZUJpbmFyeShcbiAgICAgIGV4cG9ydEFzc2lnbm1lbnQsXG4gICAgICB0cy5TeW50YXhLaW5kLkZpcnN0QXNzaWdubWVudCxcbiAgICAgIHVwZGF0ZWRJaWZlKTtcbiAgfVxuXG4gIHJldHVybiB1cGRhdGVIb3N0Tm9kZShob3N0Tm9kZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVXcmFwcGVkRW51bShcbiAgbmFtZTogc3RyaW5nLFxuICBob3N0Tm9kZTogdHMuVmFyaWFibGVTdGF0ZW1lbnQsXG4gIHN0YXRlbWVudHM6IEFycmF5PHRzLlN0YXRlbWVudD4sXG4gIGxpdGVyYWxJbml0aWFsaXplcjogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24gfCB1bmRlZmluZWQsXG4pOiB0cy5TdGF0ZW1lbnQge1xuICBsaXRlcmFsSW5pdGlhbGl6ZXIgPSBsaXRlcmFsSW5pdGlhbGl6ZXIgfHwgdHMuY3JlYXRlT2JqZWN0TGl0ZXJhbCgpO1xuICBjb25zdCBpbm5lclZhclN0bXQgPSB0cy5jcmVhdGVWYXJpYWJsZVN0YXRlbWVudChcbiAgICB1bmRlZmluZWQsXG4gICAgdHMuY3JlYXRlVmFyaWFibGVEZWNsYXJhdGlvbkxpc3QoW1xuICAgICAgdHMuY3JlYXRlVmFyaWFibGVEZWNsYXJhdGlvbihuYW1lLCB1bmRlZmluZWQsIGxpdGVyYWxJbml0aWFsaXplciksXG4gICAgXSksXG4gICk7XG5cbiAgY29uc3QgaW5uZXJSZXR1cm4gPSB0cy5jcmVhdGVSZXR1cm4odHMuY3JlYXRlSWRlbnRpZmllcihuYW1lKSk7XG5cbiAgY29uc3QgaWlmZSA9IHRzLmNyZWF0ZUltbWVkaWF0ZWx5SW52b2tlZEZ1bmN0aW9uRXhwcmVzc2lvbihbXG4gICAgaW5uZXJWYXJTdG10LFxuICAgIC4uLnN0YXRlbWVudHMsXG4gICAgaW5uZXJSZXR1cm4sXG4gIF0pO1xuXG4gIHJldHVybiB1cGRhdGVIb3N0Tm9kZShob3N0Tm9kZSwgYWRkUHVyZUNvbW1lbnQodHMuY3JlYXRlUGFyZW4oaWlmZSkpKTtcbn1cbiJdfQ==