"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
exports.getClassName = function (property) {
    var parent = property.parent;
    var identifier = parent && ts.isClassDeclaration(parent) ? parent.name : undefined;
    return identifier && ts.isIdentifier(identifier) ? identifier.text : undefined;
};
exports.getDecoratorArgument = function (decorator) {
    var expression = decorator.expression;
    if (ts.isCallExpression(expression) && expression.arguments && expression.arguments.length > 0) {
        var args = expression.arguments[0];
        if (ts.isObjectLiteralExpression(args) && args.properties) {
            return args;
        }
    }
    return undefined;
};
exports.getDecoratorPropertyInitializer = function (decorator, name) {
    var args = ts.isCallExpression(decorator.expression) ? decorator.expression.arguments[0] : undefined;
    var properties = ts.createNodeArray(args && ts.isObjectLiteralExpression(args) ? args.properties : undefined);
    return properties
        .filter(function (prop) { return prop.name && ts.isIdentifier(prop.name) && prop.name.text === name; })
        .map(function (prop) { return (ts.isPropertyAssignment(prop) ? prop.initializer : undefined); })
        .pop();
};
exports.getDecoratorName = function (decorator) {
    return ts.isCallExpression(decorator.expression) && ts.isIdentifier(decorator.expression.expression)
        ? decorator.expression.expression.text
        : undefined;
};
exports.getComponentDecorator = function (declaration) {
    return ts.createNodeArray(declaration.decorators).find(function (d) {
        return (ts.isCallExpression(d.expression) &&
            d.expression.arguments &&
            d.expression.arguments.length > 0 &&
            exports.getDecoratorName(d) === 'Component');
    });
};
exports.getSymbolName = function (expression) {
    var childExpression = expression.expression;
    return ts.isPropertyAccessExpression(childExpression) ? childExpression.name.getText() : childExpression.getText();
};
exports.maybeNodeArray = function (nodes) {
    return nodes || [];
};
exports.isSameLine = function (sourceFile, pos1, pos2) {
    return ts.getLineAndCharacterOfPosition(sourceFile, pos1).line === ts.getLineAndCharacterOfPosition(sourceFile, pos2).line;
};
exports.isStringLiteralLike = function (node) {
    return node.kind === ts.SyntaxKind.StringLiteral || node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral;
};
