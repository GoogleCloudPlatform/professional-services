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
        define("@angular/compiler-cli/src/metadata/evaluator", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/metadata/schema"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var schema_1 = require("@angular/compiler-cli/src/metadata/schema");
    // In TypeScript 2.1 the spread element kind was renamed.
    var spreadElementSyntaxKind = ts.SyntaxKind.SpreadElement || ts.SyntaxKind.SpreadElementExpression;
    function isMethodCallOf(callExpression, memberName) {
        var expression = callExpression.expression;
        if (expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            var propertyAccessExpression = expression;
            var name = propertyAccessExpression.name;
            if (name.kind == ts.SyntaxKind.Identifier) {
                return name.text === memberName;
            }
        }
        return false;
    }
    function isCallOf(callExpression, ident) {
        var expression = callExpression.expression;
        if (expression.kind === ts.SyntaxKind.Identifier) {
            var identifier = expression;
            return identifier.text === ident;
        }
        return false;
    }
    /* @internal */
    function recordMapEntry(entry, node, nodeMap, sourceFile) {
        if (!nodeMap.has(entry)) {
            nodeMap.set(entry, node);
            if (node && (schema_1.isMetadataImportedSymbolReferenceExpression(entry) ||
                schema_1.isMetadataImportDefaultReference(entry)) &&
                entry.line == null) {
                var info = sourceInfo(node, sourceFile);
                if (info.line != null)
                    entry.line = info.line;
                if (info.character != null)
                    entry.character = info.character;
            }
        }
        return entry;
    }
    exports.recordMapEntry = recordMapEntry;
    /**
     * ts.forEachChild stops iterating children when the callback return a truthy value.
     * This method inverts this to implement an `every` style iterator. It will return
     * true if every call to `cb` returns `true`.
     */
    function everyNodeChild(node, cb) {
        return !ts.forEachChild(node, function (node) { return !cb(node); });
    }
    function isPrimitive(value) {
        return Object(value) !== value;
    }
    exports.isPrimitive = isPrimitive;
    function isDefined(obj) {
        return obj !== undefined;
    }
    function getSourceFileOfNode(node) {
        while (node && node.kind != ts.SyntaxKind.SourceFile) {
            node = node.parent;
        }
        return node;
    }
    /* @internal */
    function sourceInfo(node, sourceFile) {
        if (node) {
            sourceFile = sourceFile || getSourceFileOfNode(node);
            if (sourceFile) {
                return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile));
            }
        }
        return {};
    }
    exports.sourceInfo = sourceInfo;
    /* @internal */
    function errorSymbol(message, node, context, sourceFile) {
        var result = tslib_1.__assign({ __symbolic: 'error', message: message }, sourceInfo(node, sourceFile));
        if (context) {
            result.context = context;
        }
        return result;
    }
    exports.errorSymbol = errorSymbol;
    /**
     * Produce a symbolic representation of an expression folding values into their final value when
     * possible.
     */
    var Evaluator = /** @class */ (function () {
        function Evaluator(symbols, nodeMap, options, recordExport) {
            if (options === void 0) { options = {}; }
            this.symbols = symbols;
            this.nodeMap = nodeMap;
            this.options = options;
            this.recordExport = recordExport;
        }
        Evaluator.prototype.nameOf = function (node) {
            if (node && node.kind == ts.SyntaxKind.Identifier) {
                return node.text;
            }
            var result = node && this.evaluateNode(node);
            if (schema_1.isMetadataError(result) || typeof result === 'string') {
                return result;
            }
            else {
                return errorSymbol('Name expected', node, { received: (node && node.getText()) || '<missing>' });
            }
        };
        /**
         * Returns true if the expression represented by `node` can be folded into a literal expression.
         *
         * For example, a literal is always foldable. This means that literal expressions such as `1.2`
         * `"Some value"` `true` `false` are foldable.
         *
         * - An object literal is foldable if all the properties in the literal are foldable.
         * - An array literal is foldable if all the elements are foldable.
         * - A call is foldable if it is a call to a Array.prototype.concat or a call to CONST_EXPR.
         * - A property access is foldable if the object is foldable.
         * - A array index is foldable if index expression is foldable and the array is foldable.
         * - Binary operator expressions are foldable if the left and right expressions are foldable and
         *   it is one of '+', '-', '*', '/', '%', '||', and '&&'.
         * - An identifier is foldable if a value can be found for its symbol in the evaluator symbol
         *   table.
         */
        Evaluator.prototype.isFoldable = function (node) {
            return this.isFoldableWorker(node, new Map());
        };
        Evaluator.prototype.isFoldableWorker = function (node, folding) {
            var _this = this;
            if (node) {
                switch (node.kind) {
                    case ts.SyntaxKind.ObjectLiteralExpression:
                        return everyNodeChild(node, function (child) {
                            if (child.kind === ts.SyntaxKind.PropertyAssignment) {
                                var propertyAssignment = child;
                                return _this.isFoldableWorker(propertyAssignment.initializer, folding);
                            }
                            return false;
                        });
                    case ts.SyntaxKind.ArrayLiteralExpression:
                        return everyNodeChild(node, function (child) { return _this.isFoldableWorker(child, folding); });
                    case ts.SyntaxKind.CallExpression:
                        var callExpression = node;
                        // We can fold a <array>.concat(<v>).
                        if (isMethodCallOf(callExpression, 'concat') &&
                            arrayOrEmpty(callExpression.arguments).length === 1) {
                            var arrayNode = callExpression.expression.expression;
                            if (this.isFoldableWorker(arrayNode, folding) &&
                                this.isFoldableWorker(callExpression.arguments[0], folding)) {
                                // It needs to be an array.
                                var arrayValue = this.evaluateNode(arrayNode);
                                if (arrayValue && Array.isArray(arrayValue)) {
                                    return true;
                                }
                            }
                        }
                        // We can fold a call to CONST_EXPR
                        if (isCallOf(callExpression, 'CONST_EXPR') &&
                            arrayOrEmpty(callExpression.arguments).length === 1)
                            return this.isFoldableWorker(callExpression.arguments[0], folding);
                        return false;
                    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                    case ts.SyntaxKind.StringLiteral:
                    case ts.SyntaxKind.NumericLiteral:
                    case ts.SyntaxKind.NullKeyword:
                    case ts.SyntaxKind.TrueKeyword:
                    case ts.SyntaxKind.FalseKeyword:
                    case ts.SyntaxKind.TemplateHead:
                    case ts.SyntaxKind.TemplateMiddle:
                    case ts.SyntaxKind.TemplateTail:
                        return true;
                    case ts.SyntaxKind.ParenthesizedExpression:
                        var parenthesizedExpression = node;
                        return this.isFoldableWorker(parenthesizedExpression.expression, folding);
                    case ts.SyntaxKind.BinaryExpression:
                        var binaryExpression = node;
                        switch (binaryExpression.operatorToken.kind) {
                            case ts.SyntaxKind.PlusToken:
                            case ts.SyntaxKind.MinusToken:
                            case ts.SyntaxKind.AsteriskToken:
                            case ts.SyntaxKind.SlashToken:
                            case ts.SyntaxKind.PercentToken:
                            case ts.SyntaxKind.AmpersandAmpersandToken:
                            case ts.SyntaxKind.BarBarToken:
                                return this.isFoldableWorker(binaryExpression.left, folding) &&
                                    this.isFoldableWorker(binaryExpression.right, folding);
                            default:
                                return false;
                        }
                    case ts.SyntaxKind.PropertyAccessExpression:
                        var propertyAccessExpression = node;
                        return this.isFoldableWorker(propertyAccessExpression.expression, folding);
                    case ts.SyntaxKind.ElementAccessExpression:
                        var elementAccessExpression = node;
                        return this.isFoldableWorker(elementAccessExpression.expression, folding) &&
                            this.isFoldableWorker(elementAccessExpression.argumentExpression, folding);
                    case ts.SyntaxKind.Identifier:
                        var identifier = node;
                        var reference = this.symbols.resolve(identifier.text);
                        if (reference !== undefined && isPrimitive(reference)) {
                            return true;
                        }
                        break;
                    case ts.SyntaxKind.TemplateExpression:
                        var templateExpression = node;
                        return templateExpression.templateSpans.every(function (span) { return _this.isFoldableWorker(span.expression, folding); });
                }
            }
            return false;
        };
        /**
         * Produce a JSON serialiable object representing `node`. The foldable values in the expression
         * tree are folded. For example, a node representing `1 + 2` is folded into `3`.
         */
        Evaluator.prototype.evaluateNode = function (node, preferReference) {
            var _this = this;
            var t = this;
            var error;
            function recordEntry(entry, node) {
                if (t.options.substituteExpression) {
                    var newEntry = t.options.substituteExpression(entry, node);
                    if (t.recordExport && newEntry != entry && schema_1.isMetadataGlobalReferenceExpression(newEntry)) {
                        t.recordExport(newEntry.name, entry);
                    }
                    entry = newEntry;
                }
                return recordMapEntry(entry, node, t.nodeMap);
            }
            function isFoldableError(value) {
                return !t.options.verboseInvalidExpression && schema_1.isMetadataError(value);
            }
            var resolveName = function (name, preferReference) {
                var reference = _this.symbols.resolve(name, preferReference);
                if (reference === undefined) {
                    // Encode as a global reference. StaticReflector will check the reference.
                    return recordEntry({ __symbolic: 'reference', name: name }, node);
                }
                if (reference && schema_1.isMetadataSymbolicReferenceExpression(reference)) {
                    return recordEntry(tslib_1.__assign({}, reference), node);
                }
                return reference;
            };
            switch (node.kind) {
                case ts.SyntaxKind.ObjectLiteralExpression:
                    var obj_1 = {};
                    var quoted_1 = [];
                    ts.forEachChild(node, function (child) {
                        switch (child.kind) {
                            case ts.SyntaxKind.ShorthandPropertyAssignment:
                            case ts.SyntaxKind.PropertyAssignment:
                                var assignment = child;
                                if (assignment.name.kind == ts.SyntaxKind.StringLiteral) {
                                    var name_1 = assignment.name.text;
                                    quoted_1.push(name_1);
                                }
                                var propertyName = _this.nameOf(assignment.name);
                                if (isFoldableError(propertyName)) {
                                    error = propertyName;
                                    return true;
                                }
                                var propertyValue = isPropertyAssignment(assignment) ?
                                    _this.evaluateNode(assignment.initializer, /* preferReference */ true) :
                                    resolveName(propertyName, /* preferReference */ true);
                                if (isFoldableError(propertyValue)) {
                                    error = propertyValue;
                                    return true; // Stop the forEachChild.
                                }
                                else {
                                    obj_1[propertyName] = isPropertyAssignment(assignment) ?
                                        recordEntry(propertyValue, assignment.initializer) :
                                        propertyValue;
                                }
                        }
                    });
                    if (error)
                        return error;
                    if (this.options.quotedNames && quoted_1.length) {
                        obj_1['$quoted$'] = quoted_1;
                    }
                    return recordEntry(obj_1, node);
                case ts.SyntaxKind.ArrayLiteralExpression:
                    var arr_1 = [];
                    ts.forEachChild(node, function (child) {
                        var e_1, _a;
                        var value = _this.evaluateNode(child, /* preferReference */ true);
                        // Check for error
                        if (isFoldableError(value)) {
                            error = value;
                            return true; // Stop the forEachChild.
                        }
                        // Handle spread expressions
                        if (schema_1.isMetadataSymbolicSpreadExpression(value)) {
                            if (Array.isArray(value.expression)) {
                                try {
                                    for (var _b = tslib_1.__values(value.expression), _c = _b.next(); !_c.done; _c = _b.next()) {
                                        var spreadValue = _c.value;
                                        arr_1.push(spreadValue);
                                    }
                                }
                                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                                finally {
                                    try {
                                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                                    }
                                    finally { if (e_1) throw e_1.error; }
                                }
                                return;
                            }
                        }
                        arr_1.push(value);
                    });
                    if (error)
                        return error;
                    return recordEntry(arr_1, node);
                case spreadElementSyntaxKind:
                    var spreadExpression = this.evaluateNode(node.expression);
                    return recordEntry({ __symbolic: 'spread', expression: spreadExpression }, node);
                case ts.SyntaxKind.CallExpression:
                    var callExpression = node;
                    if (isCallOf(callExpression, 'forwardRef') &&
                        arrayOrEmpty(callExpression.arguments).length === 1) {
                        var firstArgument = callExpression.arguments[0];
                        if (firstArgument.kind == ts.SyntaxKind.ArrowFunction) {
                            var arrowFunction = firstArgument;
                            return recordEntry(this.evaluateNode(arrowFunction.body), node);
                        }
                    }
                    var args = arrayOrEmpty(callExpression.arguments).map(function (arg) { return _this.evaluateNode(arg); });
                    if (this.isFoldable(callExpression)) {
                        if (isMethodCallOf(callExpression, 'concat')) {
                            var arrayValue = this.evaluateNode(callExpression.expression.expression);
                            if (isFoldableError(arrayValue))
                                return arrayValue;
                            return arrayValue.concat(args[0]);
                        }
                    }
                    // Always fold a CONST_EXPR even if the argument is not foldable.
                    if (isCallOf(callExpression, 'CONST_EXPR') &&
                        arrayOrEmpty(callExpression.arguments).length === 1) {
                        return recordEntry(args[0], node);
                    }
                    var expression = this.evaluateNode(callExpression.expression);
                    if (isFoldableError(expression)) {
                        return recordEntry(expression, node);
                    }
                    var result = { __symbolic: 'call', expression: expression };
                    if (args && args.length) {
                        result.arguments = args;
                    }
                    return recordEntry(result, node);
                case ts.SyntaxKind.NewExpression:
                    var newExpression = node;
                    var newArgs = arrayOrEmpty(newExpression.arguments).map(function (arg) { return _this.evaluateNode(arg); });
                    var newTarget = this.evaluateNode(newExpression.expression);
                    if (schema_1.isMetadataError(newTarget)) {
                        return recordEntry(newTarget, node);
                    }
                    var call = { __symbolic: 'new', expression: newTarget };
                    if (newArgs.length) {
                        call.arguments = newArgs;
                    }
                    return recordEntry(call, node);
                case ts.SyntaxKind.PropertyAccessExpression: {
                    var propertyAccessExpression = node;
                    var expression_1 = this.evaluateNode(propertyAccessExpression.expression);
                    if (isFoldableError(expression_1)) {
                        return recordEntry(expression_1, node);
                    }
                    var member = this.nameOf(propertyAccessExpression.name);
                    if (isFoldableError(member)) {
                        return recordEntry(member, node);
                    }
                    if (expression_1 && this.isFoldable(propertyAccessExpression.expression))
                        return expression_1[member];
                    if (schema_1.isMetadataModuleReferenceExpression(expression_1)) {
                        // A select into a module reference and be converted into a reference to the symbol
                        // in the module
                        return recordEntry({ __symbolic: 'reference', module: expression_1.module, name: member }, node);
                    }
                    return recordEntry({ __symbolic: 'select', expression: expression_1, member: member }, node);
                }
                case ts.SyntaxKind.ElementAccessExpression: {
                    var elementAccessExpression = node;
                    var expression_2 = this.evaluateNode(elementAccessExpression.expression);
                    if (isFoldableError(expression_2)) {
                        return recordEntry(expression_2, node);
                    }
                    if (!elementAccessExpression.argumentExpression) {
                        return recordEntry(errorSymbol('Expression form not supported', node), node);
                    }
                    var index = this.evaluateNode(elementAccessExpression.argumentExpression);
                    if (isFoldableError(expression_2)) {
                        return recordEntry(expression_2, node);
                    }
                    if (this.isFoldable(elementAccessExpression.expression) &&
                        this.isFoldable(elementAccessExpression.argumentExpression))
                        return expression_2[index];
                    return recordEntry({ __symbolic: 'index', expression: expression_2, index: index }, node);
                }
                case ts.SyntaxKind.Identifier:
                    var identifier = node;
                    var name = identifier.text;
                    return resolveName(name, preferReference);
                case ts.SyntaxKind.TypeReference:
                    var typeReferenceNode = node;
                    var typeNameNode_1 = typeReferenceNode.typeName;
                    var getReference = function (node) {
                        if (typeNameNode_1.kind === ts.SyntaxKind.QualifiedName) {
                            var qualifiedName = node;
                            var left_1 = _this.evaluateNode(qualifiedName.left);
                            if (schema_1.isMetadataModuleReferenceExpression(left_1)) {
                                return recordEntry({
                                    __symbolic: 'reference',
                                    module: left_1.module,
                                    name: qualifiedName.right.text
                                }, node);
                            }
                            // Record a type reference to a declared type as a select.
                            return { __symbolic: 'select', expression: left_1, member: qualifiedName.right.text };
                        }
                        else {
                            var identifier_1 = typeNameNode_1;
                            var symbol = _this.symbols.resolve(identifier_1.text);
                            if (isFoldableError(symbol) || schema_1.isMetadataSymbolicReferenceExpression(symbol)) {
                                return recordEntry(symbol, node);
                            }
                            return recordEntry(errorSymbol('Could not resolve type', node, { typeName: identifier_1.text }), node);
                        }
                    };
                    var typeReference = getReference(typeNameNode_1);
                    if (isFoldableError(typeReference)) {
                        return recordEntry(typeReference, node);
                    }
                    if (!schema_1.isMetadataModuleReferenceExpression(typeReference) &&
                        typeReferenceNode.typeArguments && typeReferenceNode.typeArguments.length) {
                        var args_1 = typeReferenceNode.typeArguments.map(function (element) { return _this.evaluateNode(element); });
                        // TODO: Remove typecast when upgraded to 2.0 as it will be correctly inferred.
                        // Some versions of 1.9 do not infer this correctly.
                        typeReference.arguments = args_1;
                    }
                    return recordEntry(typeReference, node);
                case ts.SyntaxKind.UnionType:
                    var unionType = node;
                    // Remove null and undefined from the list of unions.
                    var references = unionType.types
                        .filter(function (n) { return n.kind != ts.SyntaxKind.NullKeyword &&
                        n.kind != ts.SyntaxKind.UndefinedKeyword; })
                        .map(function (n) { return _this.evaluateNode(n); });
                    // The remmaining reference must be the same. If two have type arguments consider them
                    // different even if the type arguments are the same.
                    var candidate = null;
                    for (var i = 0; i < references.length; i++) {
                        var reference = references[i];
                        if (schema_1.isMetadataSymbolicReferenceExpression(reference)) {
                            if (candidate) {
                                if (reference.name == candidate.name &&
                                    reference.module == candidate.module && !reference.arguments) {
                                    candidate = reference;
                                }
                            }
                            else {
                                candidate = reference;
                            }
                        }
                        else {
                            return reference;
                        }
                    }
                    if (candidate)
                        return candidate;
                    break;
                case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                case ts.SyntaxKind.StringLiteral:
                case ts.SyntaxKind.TemplateHead:
                case ts.SyntaxKind.TemplateTail:
                case ts.SyntaxKind.TemplateMiddle:
                    return node.text;
                case ts.SyntaxKind.NumericLiteral:
                    return parseFloat(node.text);
                case ts.SyntaxKind.AnyKeyword:
                    return recordEntry({ __symbolic: 'reference', name: 'any' }, node);
                case ts.SyntaxKind.StringKeyword:
                    return recordEntry({ __symbolic: 'reference', name: 'string' }, node);
                case ts.SyntaxKind.NumberKeyword:
                    return recordEntry({ __symbolic: 'reference', name: 'number' }, node);
                case ts.SyntaxKind.BooleanKeyword:
                    return recordEntry({ __symbolic: 'reference', name: 'boolean' }, node);
                case ts.SyntaxKind.ArrayType:
                    var arrayTypeNode = node;
                    return recordEntry({
                        __symbolic: 'reference',
                        name: 'Array',
                        arguments: [this.evaluateNode(arrayTypeNode.elementType)]
                    }, node);
                case ts.SyntaxKind.NullKeyword:
                    return null;
                case ts.SyntaxKind.TrueKeyword:
                    return true;
                case ts.SyntaxKind.FalseKeyword:
                    return false;
                case ts.SyntaxKind.ParenthesizedExpression:
                    var parenthesizedExpression = node;
                    return this.evaluateNode(parenthesizedExpression.expression);
                case ts.SyntaxKind.TypeAssertionExpression:
                    var typeAssertion = node;
                    return this.evaluateNode(typeAssertion.expression);
                case ts.SyntaxKind.PrefixUnaryExpression:
                    var prefixUnaryExpression = node;
                    var operand = this.evaluateNode(prefixUnaryExpression.operand);
                    if (isDefined(operand) && isPrimitive(operand)) {
                        switch (prefixUnaryExpression.operator) {
                            case ts.SyntaxKind.PlusToken:
                                return +operand;
                            case ts.SyntaxKind.MinusToken:
                                return -operand;
                            case ts.SyntaxKind.TildeToken:
                                return ~operand;
                            case ts.SyntaxKind.ExclamationToken:
                                return !operand;
                        }
                    }
                    var operatorText = void 0;
                    switch (prefixUnaryExpression.operator) {
                        case ts.SyntaxKind.PlusToken:
                            operatorText = '+';
                            break;
                        case ts.SyntaxKind.MinusToken:
                            operatorText = '-';
                            break;
                        case ts.SyntaxKind.TildeToken:
                            operatorText = '~';
                            break;
                        case ts.SyntaxKind.ExclamationToken:
                            operatorText = '!';
                            break;
                        default:
                            return undefined;
                    }
                    return recordEntry({ __symbolic: 'pre', operator: operatorText, operand: operand }, node);
                case ts.SyntaxKind.BinaryExpression:
                    var binaryExpression = node;
                    var left = this.evaluateNode(binaryExpression.left);
                    var right = this.evaluateNode(binaryExpression.right);
                    if (isDefined(left) && isDefined(right)) {
                        if (isPrimitive(left) && isPrimitive(right))
                            switch (binaryExpression.operatorToken.kind) {
                                case ts.SyntaxKind.BarBarToken:
                                    return left || right;
                                case ts.SyntaxKind.AmpersandAmpersandToken:
                                    return left && right;
                                case ts.SyntaxKind.AmpersandToken:
                                    return left & right;
                                case ts.SyntaxKind.BarToken:
                                    return left | right;
                                case ts.SyntaxKind.CaretToken:
                                    return left ^ right;
                                case ts.SyntaxKind.EqualsEqualsToken:
                                    return left == right;
                                case ts.SyntaxKind.ExclamationEqualsToken:
                                    return left != right;
                                case ts.SyntaxKind.EqualsEqualsEqualsToken:
                                    return left === right;
                                case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                                    return left !== right;
                                case ts.SyntaxKind.LessThanToken:
                                    return left < right;
                                case ts.SyntaxKind.GreaterThanToken:
                                    return left > right;
                                case ts.SyntaxKind.LessThanEqualsToken:
                                    return left <= right;
                                case ts.SyntaxKind.GreaterThanEqualsToken:
                                    return left >= right;
                                case ts.SyntaxKind.LessThanLessThanToken:
                                    return left << right;
                                case ts.SyntaxKind.GreaterThanGreaterThanToken:
                                    return left >> right;
                                case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
                                    return left >>> right;
                                case ts.SyntaxKind.PlusToken:
                                    return left + right;
                                case ts.SyntaxKind.MinusToken:
                                    return left - right;
                                case ts.SyntaxKind.AsteriskToken:
                                    return left * right;
                                case ts.SyntaxKind.SlashToken:
                                    return left / right;
                                case ts.SyntaxKind.PercentToken:
                                    return left % right;
                            }
                        return recordEntry({
                            __symbolic: 'binop',
                            operator: binaryExpression.operatorToken.getText(),
                            left: left,
                            right: right
                        }, node);
                    }
                    break;
                case ts.SyntaxKind.ConditionalExpression:
                    var conditionalExpression = node;
                    var condition = this.evaluateNode(conditionalExpression.condition);
                    var thenExpression = this.evaluateNode(conditionalExpression.whenTrue);
                    var elseExpression = this.evaluateNode(conditionalExpression.whenFalse);
                    if (isPrimitive(condition)) {
                        return condition ? thenExpression : elseExpression;
                    }
                    return recordEntry({ __symbolic: 'if', condition: condition, thenExpression: thenExpression, elseExpression: elseExpression }, node);
                case ts.SyntaxKind.FunctionExpression:
                case ts.SyntaxKind.ArrowFunction:
                    return recordEntry(errorSymbol('Lambda not supported', node), node);
                case ts.SyntaxKind.TaggedTemplateExpression:
                    return recordEntry(errorSymbol('Tagged template expressions are not supported in metadata', node), node);
                case ts.SyntaxKind.TemplateExpression:
                    var templateExpression = node;
                    if (this.isFoldable(node)) {
                        return templateExpression.templateSpans.reduce(function (previous, current) { return previous + _this.evaluateNode(current.expression) +
                            _this.evaluateNode(current.literal); }, this.evaluateNode(templateExpression.head));
                    }
                    else {
                        return templateExpression.templateSpans.reduce(function (previous, current) {
                            var expr = _this.evaluateNode(current.expression);
                            var literal = _this.evaluateNode(current.literal);
                            if (isFoldableError(expr))
                                return expr;
                            if (isFoldableError(literal))
                                return literal;
                            if (typeof previous === 'string' && typeof expr === 'string' &&
                                typeof literal === 'string') {
                                return previous + expr + literal;
                            }
                            var result = expr;
                            if (previous !== '') {
                                result = { __symbolic: 'binop', operator: '+', left: previous, right: expr };
                            }
                            if (literal != '') {
                                result = { __symbolic: 'binop', operator: '+', left: result, right: literal };
                            }
                            return result;
                        }, this.evaluateNode(templateExpression.head));
                    }
                case ts.SyntaxKind.AsExpression:
                    var asExpression = node;
                    return this.evaluateNode(asExpression.expression);
                case ts.SyntaxKind.ClassExpression:
                    return { __symbolic: 'class' };
            }
            return recordEntry(errorSymbol('Expression form not supported', node), node);
        };
        return Evaluator;
    }());
    exports.Evaluator = Evaluator;
    function isPropertyAssignment(node) {
        return node.kind == ts.SyntaxKind.PropertyAssignment;
    }
    var empty = ts.createNodeArray();
    function arrayOrEmpty(v) {
        return v || empty;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9tZXRhZGF0YS9ldmFsdWF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQWlDO0lBR2pDLG9FQUFxZDtJQUtyZCx5REFBeUQ7SUFDekQsSUFBTSx1QkFBdUIsR0FDeEIsRUFBRSxDQUFDLFVBQWtCLENBQUMsYUFBYSxJQUFLLEVBQUUsQ0FBQyxVQUFrQixDQUFDLHVCQUF1QixDQUFDO0lBRTNGLFNBQVMsY0FBYyxDQUFDLGNBQWlDLEVBQUUsVUFBa0I7UUFDM0UsSUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQztRQUM3QyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsRUFBRTtZQUM5RCxJQUFNLHdCQUF3QixHQUFnQyxVQUFVLENBQUM7WUFDekUsSUFBTSxJQUFJLEdBQUcsd0JBQXdCLENBQUMsSUFBSSxDQUFDO1lBQzNDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRTtnQkFDekMsT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQzthQUNqQztTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxRQUFRLENBQUMsY0FBaUMsRUFBRSxLQUFhO1FBQ2hFLElBQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUM7UUFDN0MsSUFBSSxVQUFVLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFO1lBQ2hELElBQU0sVUFBVSxHQUFrQixVQUFVLENBQUM7WUFDN0MsT0FBTyxVQUFVLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQztTQUNsQztRQUNELE9BQU8s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LFVBQVUsQ0FBQyxZQUFZO29CQUM3QixJQUFNLFlBQVksR0FBb0IsSUFBSSxDQUFDO29CQUMzQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNwRCxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZTtvQkFDaEMsT0FBTyxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUMsQ0FBQzthQUNoQztZQUNELE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQywrQkFBK0IsRUFBRSxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBQ0gsZ0JBQUM7SUFBRCxDQUFDLEFBampCRCxJQWlqQkM7SUFqakJZLDhCQUFTO0lBbWpCdEIsU0FBUyxvQkFBb0IsQ0FBQyxJQUFhO1FBQ3pDLE9BQU8sSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDO0lBQ3ZELENBQUM7SUFFRCxJQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsZUFBZSxFQUFPLENBQUM7SUFFeEMsU0FBUyxZQUFZLENBQW9CLENBQTZCO1FBQ3BFLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQztJQUNwQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtDb2xsZWN0b3JPcHRpb25zfSBmcm9tICcuL2NvbGxlY3Rvcic7XG5pbXBvcnQge0NsYXNzTWV0YWRhdGEsIEZ1bmN0aW9uTWV0YWRhdGEsIEludGVyZmFjZU1ldGFkYXRhLCBNZXRhZGF0YUVudHJ5LCBNZXRhZGF0YUVycm9yLCBNZXRhZGF0YUltcG9ydGVkU3ltYm9sUmVmZXJlbmNlRXhwcmVzc2lvbiwgTWV0YWRhdGFTb3VyY2VMb2NhdGlvbkluZm8sIE1ldGFkYXRhU3ltYm9saWNDYWxsRXhwcmVzc2lvbiwgTWV0YWRhdGFWYWx1ZSwgaXNNZXRhZGF0YUVycm9yLCBpc01ldGFkYXRhR2xvYmFsUmVmZXJlbmNlRXhwcmVzc2lvbiwgaXNNZXRhZGF0YUltcG9ydERlZmF1bHRSZWZlcmVuY2UsIGlzTWV0YWRhdGFJbXBvcnRlZFN5bWJvbFJlZmVyZW5jZUV4cHJlc3Npb24sIGlzTWV0YWRhdGFNb2R1bGVSZWZlcmVuY2VFeHByZXNzaW9uLCBpc01ldGFkYXRhU3ltYm9saWNSZWZlcmVuY2VFeHByZXNzaW9uLCBpc01ldGFkYXRhU3ltYm9saWNTcHJlYWRFeHByZXNzaW9ufSBmcm9tICcuL3NjaGVtYSc7XG5pbXBvcnQge1N5bWJvbHN9IGZyb20gJy4vc3ltYm9scyc7XG5cblxuXG4vLyBJbiBUeXBlU2NyaXB0IDIuMSB0aGUgc3ByZWFkIGVsZW1lbnQga2luZCB3YXMgcmVuYW1lZC5cbmNvbnN0IHNwcmVhZEVsZW1lbnRTeW50YXhLaW5kOiB0cy5TeW50YXhLaW5kID1cbiAgICAodHMuU3ludGF4S2luZCBhcyBhbnkpLlNwcmVhZEVsZW1lbnQgfHwgKHRzLlN5bnRheEtpbmQgYXMgYW55KS5TcHJlYWRFbGVtZW50RXhwcmVzc2lvbjtcblxuZnVuY3Rpb24gaXNNZXRob2RDYWxsT2YoY2FsbEV4cHJlc3Npb246IHRzLkNhbGxFeHByZXNzaW9uLCBtZW1iZXJOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgZXhwcmVzc2lvbiA9IGNhbGxFeHByZXNzaW9uLmV4cHJlc3Npb247XG4gIGlmIChleHByZXNzaW9uLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKSB7XG4gICAgY29uc3QgcHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uID0gPHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbj5leHByZXNzaW9uO1xuICAgIGNvbnN0IG5hbWUgPSBwcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24ubmFtZTtcbiAgICBpZiAobmFtZS5raW5kID09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgICAgcmV0dXJuIG5hbWUudGV4dCA9PT0gbWVtYmVyTmFtZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc0NhbGxPZihjYWxsRXhwcmVzc2lvbjogdHMuQ2FsbEV4cHJlc3Npb24sIGlkZW50OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgZXhwcmVzc2lvbiA9IGNhbGxFeHByZXNzaW9uLmV4cHJlc3Npb247XG4gIGlmIChleHByZXNzaW9uLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgIGNvbnN0IGlkZW50aWZpZXIgPSA8dHMuSWRlbnRpZmllcj5leHByZXNzaW9uO1xuICAgIHJldHVybiBpZGVudGlmaWVyLnRleHQgPT09IGlkZW50O1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gcmVjb3JkTWFwRW50cnk8VCBleHRlbmRzIE1ldGFkYXRhRW50cnk+KFxuICAgIGVudHJ5OiBULCBub2RlOiB0cy5Ob2RlLFxuICAgIG5vZGVNYXA6IE1hcDxNZXRhZGF0YVZhbHVlfENsYXNzTWV0YWRhdGF8SW50ZXJmYWNlTWV0YWRhdGF8RnVuY3Rpb25NZXRhZGF0YSwgdHMuTm9kZT4sXG4gICAgc291cmNlRmlsZT86IHRzLlNvdXJjZUZpbGUpIHtcbiAgaWYgKCFub2RlTWFwLmhhcyhlbnRyeSkpIHtcbiAgICBub2RlTWFwLnNldChlbnRyeSwgbm9kZSk7XG4gICAgaWYgKG5vZGUgJiYgKGlzTWV0YWRhdGFJbXBvcnRlZFN5bWJvbFJlZmVyZW5jZUV4cHJlc3Npb24oZW50cnkpIHx8XG4gICAgICAgICAgICAgICAgIGlzTWV0YWRhdGFJbXBvcnREZWZhdWx0UmVmZXJlbmNlKGVudHJ5KSkgJiZcbiAgICAgICAgZW50cnkubGluZSA9PSBudWxsKSB7XG4gICAgICBjb25zdCBpbmZvID0gc291cmNlSW5mbyhub2RlLCBzb3VyY2VGaWxlKTtcbiAgICAgIGlmIChpbmZvLmxpbmUgIT0gbnVsbCkgZW50cnkubGluZSA9IGluZm8ubGluZTtcbiAgICAgIGlmIChpbmZvLmNoYXJhY3RlciAhPSBudWxsKSBlbnRyeS5jaGFyYWN0ZXIgPSBpbmZvLmNoYXJhY3RlcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGVudHJ5O1xufVxuXG4vKipcbiAqIHRzLmZvckVhY2hDaGlsZCBzdG9wcyBpdGVyYXRpbmcgY2hpbGRyZW4gd2hlbiB0aGUgY2FsbGJhY2sgcmV0dXJuIGEgdHJ1dGh5IHZhbHVlLlxuICogVGhpcyBtZXRob2QgaW52ZXJ0cyB0aGlzIHRvIGltcGxlbWVudCBhbiBgZXZlcnlgIHN0eWxlIGl0ZXJhdG9yLiBJdCB3aWxsIHJldHVyblxuICogdHJ1ZSBpZiBldmVyeSBjYWxsIHRvIGBjYmAgcmV0dXJucyBgdHJ1ZWAuXG4gKi9cbmZ1bmN0aW9uIGV2ZXJ5Tm9kZUNoaWxkKG5vZGU6IHRzLk5vZGUsIGNiOiAobm9kZTogdHMuTm9kZSkgPT4gYm9vbGVhbikge1xuICByZXR1cm4gIXRzLmZvckVhY2hDaGlsZChub2RlLCBub2RlID0+ICFjYihub2RlKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1ByaW1pdGl2ZSh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBPYmplY3QodmFsdWUpICE9PSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaXNEZWZpbmVkKG9iajogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBvYmogIT09IHVuZGVmaW5lZDtcbn1cblxuLy8gaW1wb3J0IHtwcm9wZXJ0eU5hbWUgYXMgbmFtZX0gZnJvbSAncGxhY2UnXG4vLyBpbXBvcnQge25hbWV9IGZyb20gJ3BsYWNlJ1xuZXhwb3J0IGludGVyZmFjZSBJbXBvcnRTcGVjaWZpZXJNZXRhZGF0YSB7XG4gIG5hbWU6IHN0cmluZztcbiAgcHJvcGVydHlOYW1lPzogc3RyaW5nO1xufVxuZXhwb3J0IGludGVyZmFjZSBJbXBvcnRNZXRhZGF0YSB7XG4gIGRlZmF1bHROYW1lPzogc3RyaW5nOyAgICAgICAgICAgICAgICAgICAgICAvLyBpbXBvcnQgZCBmcm9tICdwbGFjZSdcbiAgbmFtZXNwYWNlPzogc3RyaW5nOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIGltcG9ydCAqIGFzIGQgZnJvbSAncGxhY2UnXG4gIG5hbWVkSW1wb3J0cz86IEltcG9ydFNwZWNpZmllck1ldGFkYXRhW107ICAvLyBpbXBvcnQge2F9IGZyb20gJ3BsYWNlJ1xuICBmcm9tOiBzdHJpbmc7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZnJvbSAncGxhY2UnXG59XG5cblxuZnVuY3Rpb24gZ2V0U291cmNlRmlsZU9mTm9kZShub2RlOiB0cy5Ob2RlIHwgdW5kZWZpbmVkKTogdHMuU291cmNlRmlsZSB7XG4gIHdoaWxlIChub2RlICYmIG5vZGUua2luZCAhPSB0cy5TeW50YXhLaW5kLlNvdXJjZUZpbGUpIHtcbiAgICBub2RlID0gbm9kZS5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIDx0cy5Tb3VyY2VGaWxlPm5vZGU7XG59XG5cbi8qIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNvdXJjZUluZm8oXG4gICAgbm9kZTogdHMuTm9kZSB8IHVuZGVmaW5lZCwgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSB8IHVuZGVmaW5lZCk6IE1ldGFkYXRhU291cmNlTG9jYXRpb25JbmZvIHtcbiAgaWYgKG5vZGUpIHtcbiAgICBzb3VyY2VGaWxlID0gc291cmNlRmlsZSB8fCBnZXRTb3VyY2VGaWxlT2ZOb2RlKG5vZGUpO1xuICAgIGlmIChzb3VyY2VGaWxlKSB7XG4gICAgICByZXR1cm4gdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgbm9kZS5nZXRTdGFydChzb3VyY2VGaWxlKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB7fTtcbn1cblxuLyogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gZXJyb3JTeW1ib2woXG4gICAgbWVzc2FnZTogc3RyaW5nLCBub2RlPzogdHMuTm9kZSwgY29udGV4dD86IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICBzb3VyY2VGaWxlPzogdHMuU291cmNlRmlsZSk6IE1ldGFkYXRhRXJyb3Ige1xuICBjb25zdCByZXN1bHQ6IE1ldGFkYXRhRXJyb3IgPSB7X19zeW1ib2xpYzogJ2Vycm9yJywgbWVzc2FnZSwgLi4uc291cmNlSW5mbyhub2RlLCBzb3VyY2VGaWxlKX07XG4gIGlmIChjb250ZXh0KSB7XG4gICAgcmVzdWx0LmNvbnRleHQgPSBjb250ZXh0O1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUHJvZHVjZSBhIHN5bWJvbGljIHJlcHJlc2VudGF0aW9uIG9mIGFuIGV4cHJlc3Npb24gZm9sZGluZyB2YWx1ZXMgaW50byB0aGVpciBmaW5hbCB2YWx1ZSB3aGVuXG4gKiBwb3NzaWJsZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2YWx1YXRvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBzeW1ib2xzOiBTeW1ib2xzLCBwcml2YXRlIG5vZGVNYXA6IE1hcDxNZXRhZGF0YUVudHJ5LCB0cy5Ob2RlPixcbiAgICAgIHByaXZhdGUgb3B0aW9uczogQ29sbGVjdG9yT3B0aW9ucyA9IHt9LFxuICAgICAgcHJpdmF0ZSByZWNvcmRFeHBvcnQ/OiAobmFtZTogc3RyaW5nLCB2YWx1ZTogTWV0YWRhdGFWYWx1ZSkgPT4gdm9pZCkge31cblxuICBuYW1lT2Yobm9kZTogdHMuTm9kZXx1bmRlZmluZWQpOiBzdHJpbmd8TWV0YWRhdGFFcnJvciB7XG4gICAgaWYgKG5vZGUgJiYgbm9kZS5raW5kID09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgICAgcmV0dXJuICg8dHMuSWRlbnRpZmllcj5ub2RlKS50ZXh0O1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBub2RlICYmIHRoaXMuZXZhbHVhdGVOb2RlKG5vZGUpO1xuICAgIGlmIChpc01ldGFkYXRhRXJyb3IocmVzdWx0KSB8fCB0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGVycm9yU3ltYm9sKFxuICAgICAgICAgICdOYW1lIGV4cGVjdGVkJywgbm9kZSwge3JlY2VpdmVkOiAobm9kZSAmJiBub2RlLmdldFRleHQoKSkgfHwgJzxtaXNzaW5nPid9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBleHByZXNzaW9uIHJlcHJlc2VudGVkIGJ5IGBub2RlYCBjYW4gYmUgZm9sZGVkIGludG8gYSBsaXRlcmFsIGV4cHJlc3Npb24uXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBhIGxpdGVyYWwgaXMgYWx3YXlzIGZvbGRhYmxlLiBUaGlzIG1lYW5zIHRoYXQgbGl0ZXJhbCBleHByZXNzaW9ucyBzdWNoIGFzIGAxLjJgXG4gICAqIGBcIlNvbWUgdmFsdWVcImAgYHRydWVgIGBmYWxzZWAgYXJlIGZvbGRhYmxlLlxuICAgKlxuICAgKiAtIEFuIG9iamVjdCBsaXRlcmFsIGlzIGZvbGRhYmxlIGlmIGFsbCB0aGUgcHJvcGVydGllcyBpbiB0aGUgbGl0ZXJhbCBhcmUgZm9sZGFibGUuXG4gICAqIC0gQW4gYXJyYXkgbGl0ZXJhbCBpcyBmb2xkYWJsZSBpZiBhbGwgdGhlIGVsZW1lbnRzIGFyZSBmb2xkYWJsZS5cbiAgICogLSBBIGNhbGwgaXMgZm9sZGFibGUgaWYgaXQgaXMgYSBjYWxsIHRvIGEgQXJyYXkucHJvdG90eXBlLmNvbmNhdCBvciBhIGNhbGwgdG8gQ09OU1RfRVhQUi5cbiAgICogLSBBIHByb3BlcnR5IGFjY2VzcyBpcyBmb2xkYWJsZSBpZiB0aGUgb2JqZWN0IGlzIGZvbGRhYmxlLlxuICAgKiAtIEEgYXJyYXkgaW5kZXggaXMgZm9sZGFibGUgaWYgaW5kZXggZXhwcmVzc2lvbiBpcyBmb2xkYWJsZSBhbmQgdGhlIGFycmF5IGlzIGZvbGRhYmxlLlxuICAgKiAtIEJpbmFyeSBvcGVyYXRvciBleHByZXNzaW9ucyBhcmUgZm9sZGFibGUgaWYgdGhlIGxlZnQgYW5kIHJpZ2h0IGV4cHJlc3Npb25zIGFyZSBmb2xkYWJsZSBhbmRcbiAgICogICBpdCBpcyBvbmUgb2YgJysnLCAnLScsICcqJywgJy8nLCAnJScsICd8fCcsIGFuZCAnJiYnLlxuICAgKiAtIEFuIGlkZW50aWZpZXIgaXMgZm9sZGFibGUgaWYgYSB2YWx1ZSBjYW4gYmUgZm91bmQgZm9yIGl0cyBzeW1ib2wgaW4gdGhlIGV2YWx1YXRvciBzeW1ib2xcbiAgICogICB0YWJsZS5cbiAgICovXG4gIHB1YmxpYyBpc0ZvbGRhYmxlKG5vZGU6IHRzLk5vZGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc0ZvbGRhYmxlV29ya2VyKG5vZGUsIG5ldyBNYXA8dHMuTm9kZSwgYm9vbGVhbj4oKSk7XG4gIH1cblxuICBwcml2YXRlIGlzRm9sZGFibGVXb3JrZXIobm9kZTogdHMuTm9kZXx1bmRlZmluZWQsIGZvbGRpbmc6IE1hcDx0cy5Ob2RlLCBib29sZWFuPik6IGJvb2xlYW4ge1xuICAgIGlmIChub2RlKSB7XG4gICAgICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb246XG4gICAgICAgICAgcmV0dXJuIGV2ZXJ5Tm9kZUNoaWxkKG5vZGUsIGNoaWxkID0+IHtcbiAgICAgICAgICAgIGlmIChjaGlsZC5raW5kID09PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QXNzaWdubWVudCkge1xuICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eUFzc2lnbm1lbnQgPSA8dHMuUHJvcGVydHlBc3NpZ25tZW50PmNoaWxkO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc0ZvbGRhYmxlV29ya2VyKHByb3BlcnR5QXNzaWdubWVudC5pbml0aWFsaXplciwgZm9sZGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5BcnJheUxpdGVyYWxFeHByZXNzaW9uOlxuICAgICAgICAgIHJldHVybiBldmVyeU5vZGVDaGlsZChub2RlLCBjaGlsZCA9PiB0aGlzLmlzRm9sZGFibGVXb3JrZXIoY2hpbGQsIGZvbGRpbmcpKTtcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNhbGxFeHByZXNzaW9uOlxuICAgICAgICAgIGNvbnN0IGNhbGxFeHByZXNzaW9uID0gPHRzLkNhbGxFeHByZXNzaW9uPm5vZGU7XG4gICAgICAgICAgLy8gV2UgY2FuIGZvbGQgYSA8YXJyYXk+LmNvbmNhdCg8dj4pLlxuICAgICAgICAgIGlmIChpc01ldGhvZENhbGxPZihjYWxsRXhwcmVzc2lvbiwgJ2NvbmNhdCcpICYmXG4gICAgICAgICAgICAgIGFycmF5T3JFbXB0eShjYWxsRXhwcmVzc2lvbi5hcmd1bWVudHMpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgY29uc3QgYXJyYXlOb2RlID0gKDx0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24+Y2FsbEV4cHJlc3Npb24uZXhwcmVzc2lvbikuZXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzRm9sZGFibGVXb3JrZXIoYXJyYXlOb2RlLCBmb2xkaW5nKSAmJlxuICAgICAgICAgICAgICAgIHRoaXMuaXNGb2xkYWJsZVdvcmtlcihjYWxsRXhwcmVzc2lvbi5hcmd1bWVudHNbMF0sIGZvbGRpbmcpKSB7XG4gICAgICAgICAgICAgIC8vIEl0IG5lZWRzIHRvIGJlIGFuIGFycmF5LlxuICAgICAgICAgICAgICBjb25zdCBhcnJheVZhbHVlID0gdGhpcy5ldmFsdWF0ZU5vZGUoYXJyYXlOb2RlKTtcbiAgICAgICAgICAgICAgaWYgKGFycmF5VmFsdWUgJiYgQXJyYXkuaXNBcnJheShhcnJheVZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gV2UgY2FuIGZvbGQgYSBjYWxsIHRvIENPTlNUX0VYUFJcbiAgICAgICAgICBpZiAoaXNDYWxsT2YoY2FsbEV4cHJlc3Npb24sICdDT05TVF9FWFBSJykgJiZcbiAgICAgICAgICAgICAgYXJyYXlPckVtcHR5KGNhbGxFeHByZXNzaW9uLmFyZ3VtZW50cykubGVuZ3RoID09PSAxKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNGb2xkYWJsZVdvcmtlcihjYWxsRXhwcmVzc2lvbi5hcmd1bWVudHNbMF0sIGZvbGRpbmcpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk5vU3Vic3RpdHV0aW9uVGVtcGxhdGVMaXRlcmFsOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk51bWVyaWNMaXRlcmFsOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTnVsbEtleXdvcmQ6XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5UcnVlS2V5d29yZDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkZhbHNlS2V5d29yZDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlRlbXBsYXRlSGVhZDpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlRlbXBsYXRlTWlkZGxlOlxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuVGVtcGxhdGVUYWlsOlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuUGFyZW50aGVzaXplZEV4cHJlc3Npb246XG4gICAgICAgICAgY29uc3QgcGFyZW50aGVzaXplZEV4cHJlc3Npb24gPSA8dHMuUGFyZW50aGVzaXplZEV4cHJlc3Npb24+bm9kZTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pc0ZvbGRhYmxlV29ya2VyKHBhcmVudGhlc2l6ZWRFeHByZXNzaW9uLmV4cHJlc3Npb24sIGZvbGRpbmcpO1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQmluYXJ5RXhwcmVzc2lvbjpcbiAgICAgICAgICBjb25zdCBiaW5hcnlFeHByZXNzaW9uID0gPHRzLkJpbmFyeUV4cHJlc3Npb24+bm9kZTtcbiAgICAgICAgICBzd2l0Y2ggKGJpbmFyeUV4cHJlc3Npb24ub3BlcmF0b3JUb2tlbi5raW5kKSB7XG4gICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuUGx1c1Rva2VuOlxuICAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk1pbnVzVG9rZW46XG4gICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQXN0ZXJpc2tUb2tlbjpcbiAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5TbGFzaFRva2VuOlxuICAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlBlcmNlbnRUb2tlbjpcbiAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5BbXBlcnNhbmRBbXBlcnNhbmRUb2tlbjpcbiAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5CYXJCYXJUb2tlbjpcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNGb2xkYWJsZVdvcmtlcihiaW5hcnlFeHByZXNzaW9uLmxlZnQsIGZvbGRpbmcpICYmXG4gICAgICAgICAgICAgICAgICB0aGlzLmlzRm9sZGFibGVXb3JrZXIoYmluYXJ5RXhwcmVzc2lvbi5yaWdodCwgZm9sZGluZyk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uOlxuICAgICAgICAgIGNvbnN0IHByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbiA9IDx0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24+bm9kZTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pc0ZvbGRhYmxlV29ya2VyKHByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbi5leHByZXNzaW9uLCBmb2xkaW5nKTtcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkVsZW1lbnRBY2Nlc3NFeHByZXNzaW9uOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnRBY2Nlc3NFeHByZXNzaW9uID0gPHRzLkVsZW1lbnRBY2Nlc3NFeHByZXNzaW9uPm5vZGU7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaXNGb2xkYWJsZVdvcmtlcihlbGVtZW50QWNjZXNzRXhwcmVzc2lvbi5leHByZXNzaW9uLCBmb2xkaW5nKSAmJlxuICAgICAgICAgICAgICB0aGlzLmlzRm9sZGFibGVXb3JrZXIoZWxlbWVudEFjY2Vzc0V4cHJlc3Npb24uYXJndW1lbnRFeHByZXNzaW9uLCBmb2xkaW5nKTtcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXI6XG4gICAgICAgICAgbGV0IGlkZW50aWZpZXIgPSA8dHMuSWRlbnRpZmllcj5ub2RlO1xuICAgICAgICAgIGxldCByZWZlcmVuY2UgPSB0aGlzLnN5bWJvbHMucmVzb2x2ZShpZGVudGlmaWVyLnRleHQpO1xuICAgICAgICAgIGlmIChyZWZlcmVuY2UgIT09IHVuZGVmaW5lZCAmJiBpc1ByaW1pdGl2ZShyZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5UZW1wbGF0ZUV4cHJlc3Npb246XG4gICAgICAgICAgY29uc3QgdGVtcGxhdGVFeHByZXNzaW9uID0gPHRzLlRlbXBsYXRlRXhwcmVzc2lvbj5ub2RlO1xuICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZUV4cHJlc3Npb24udGVtcGxhdGVTcGFucy5ldmVyeShcbiAgICAgICAgICAgICAgc3BhbiA9PiB0aGlzLmlzRm9sZGFibGVXb3JrZXIoc3Bhbi5leHByZXNzaW9uLCBmb2xkaW5nKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9kdWNlIGEgSlNPTiBzZXJpYWxpYWJsZSBvYmplY3QgcmVwcmVzZW50aW5nIGBub2RlYC4gVGhlIGZvbGRhYmxlIHZhbHVlcyBpbiB0aGUgZXhwcmVzc2lvblxuICAgKiB0cmVlIGFyZSBmb2xkZWQuIEZvciBleGFtcGxlLCBhIG5vZGUgcmVwcmVzZW50aW5nIGAxICsgMmAgaXMgZm9sZGVkIGludG8gYDNgLlxuICAgKi9cbiAgcHVibGljIGV2YWx1YXRlTm9kZShub2RlOiB0cy5Ob2RlLCBwcmVmZXJSZWZlcmVuY2U/OiBib29sZWFuKTogTWV0YWRhdGFWYWx1ZSB7XG4gICAgY29uc3QgdCA9IHRoaXM7XG4gICAgbGV0IGVycm9yOiBNZXRhZGF0YUVycm9yfHVuZGVmaW5lZDtcblxuICAgIGZ1bmN0aW9uIHJlY29yZEVudHJ5KGVudHJ5OiBNZXRhZGF0YVZhbHVlLCBub2RlOiB0cy5Ob2RlKTogTWV0YWRhdGFWYWx1ZSB7XG4gICAgICBpZiAodC5vcHRpb25zLnN1YnN0aXR1dGVFeHByZXNzaW9uKSB7XG4gICAgICAgIGNvbnN0IG5ld0VudHJ5ID0gdC5vcHRpb25zLnN1YnN0aXR1dGVFeHByZXNzaW9uKGVudHJ5LCBub2RlKTtcbiAgICAgICAgaWYgKHQucmVjb3JkRXhwb3J0ICYmIG5ld0VudHJ5ICE9IGVudHJ5ICYmIGlzTWV0YWRhdGFHbG9iYWxSZWZlcmVuY2VFeHByZXNzaW9uKG5ld0VudHJ5KSkge1xuICAgICAgICAgIHQucmVjb3JkRXhwb3J0KG5ld0VudHJ5Lm5hbWUsIGVudHJ5KTtcbiAgICAgICAgfVxuICAgICAgICBlbnRyeSA9IG5ld0VudHJ5O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlY29yZE1hcEVudHJ5KGVudHJ5LCBub2RlLCB0Lm5vZGVNYXApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRm9sZGFibGVFcnJvcih2YWx1ZTogYW55KTogdmFsdWUgaXMgTWV0YWRhdGFFcnJvciB7XG4gICAgICByZXR1cm4gIXQub3B0aW9ucy52ZXJib3NlSW52YWxpZEV4cHJlc3Npb24gJiYgaXNNZXRhZGF0YUVycm9yKHZhbHVlKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNvbHZlTmFtZSA9IChuYW1lOiBzdHJpbmcsIHByZWZlclJlZmVyZW5jZT86IGJvb2xlYW4pOiBNZXRhZGF0YVZhbHVlID0+IHtcbiAgICAgIGNvbnN0IHJlZmVyZW5jZSA9IHRoaXMuc3ltYm9scy5yZXNvbHZlKG5hbWUsIHByZWZlclJlZmVyZW5jZSk7XG4gICAgICBpZiAocmVmZXJlbmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gRW5jb2RlIGFzIGEgZ2xvYmFsIHJlZmVyZW5jZS4gU3RhdGljUmVmbGVjdG9yIHdpbGwgY2hlY2sgdGhlIHJlZmVyZW5jZS5cbiAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KHtfX3N5bWJvbGljOiAncmVmZXJlbmNlJywgbmFtZX0sIG5vZGUpO1xuICAgICAgfVxuICAgICAgaWYgKHJlZmVyZW5jZSAmJiBpc01ldGFkYXRhU3ltYm9saWNSZWZlcmVuY2VFeHByZXNzaW9uKHJlZmVyZW5jZSkpIHtcbiAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KHsuLi5yZWZlcmVuY2V9LCBub2RlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZWZlcmVuY2U7XG4gICAgfTtcblxuICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb246XG4gICAgICAgIGxldCBvYmo6IHtbbmFtZTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgICAgICBsZXQgcXVvdGVkOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgY2hpbGQgPT4ge1xuICAgICAgICAgIHN3aXRjaCAoY2hpbGQua2luZCkge1xuICAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlNob3J0aGFuZFByb3BlcnR5QXNzaWdubWVudDpcbiAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFzc2lnbm1lbnQ6XG4gICAgICAgICAgICAgIGNvbnN0IGFzc2lnbm1lbnQgPSA8dHMuUHJvcGVydHlBc3NpZ25tZW50fHRzLlNob3J0aGFuZFByb3BlcnR5QXNzaWdubWVudD5jaGlsZDtcbiAgICAgICAgICAgICAgaWYgKGFzc2lnbm1lbnQubmFtZS5raW5kID09IHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoYXNzaWdubWVudC5uYW1lIGFzIHRzLlN0cmluZ0xpdGVyYWwpLnRleHQ7XG4gICAgICAgICAgICAgICAgcXVvdGVkLnB1c2gobmFtZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gdGhpcy5uYW1lT2YoYXNzaWdubWVudC5uYW1lKTtcbiAgICAgICAgICAgICAgaWYgKGlzRm9sZGFibGVFcnJvcihwcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSBwcm9wZXJ0eU5hbWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHlWYWx1ZSA9IGlzUHJvcGVydHlBc3NpZ25tZW50KGFzc2lnbm1lbnQpID9cbiAgICAgICAgICAgICAgICAgIHRoaXMuZXZhbHVhdGVOb2RlKGFzc2lnbm1lbnQuaW5pdGlhbGl6ZXIsIC8qIHByZWZlclJlZmVyZW5jZSAqLyB0cnVlKSA6XG4gICAgICAgICAgICAgICAgICByZXNvbHZlTmFtZShwcm9wZXJ0eU5hbWUsIC8qIHByZWZlclJlZmVyZW5jZSAqLyB0cnVlKTtcbiAgICAgICAgICAgICAgaWYgKGlzRm9sZGFibGVFcnJvcihwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGVycm9yID0gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgIC8vIFN0b3AgdGhlIGZvckVhY2hDaGlsZC5cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvYmpbPHN0cmluZz5wcm9wZXJ0eU5hbWVdID0gaXNQcm9wZXJ0eUFzc2lnbm1lbnQoYXNzaWdubWVudCkgP1xuICAgICAgICAgICAgICAgICAgICByZWNvcmRFbnRyeShwcm9wZXJ0eVZhbHVlLCBhc3NpZ25tZW50LmluaXRpYWxpemVyKSA6XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZXJyb3IpIHJldHVybiBlcnJvcjtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5xdW90ZWROYW1lcyAmJiBxdW90ZWQubGVuZ3RoKSB7XG4gICAgICAgICAgb2JqWyckcXVvdGVkJCddID0gcXVvdGVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWNvcmRFbnRyeShvYmosIG5vZGUpO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkFycmF5TGl0ZXJhbEV4cHJlc3Npb246XG4gICAgICAgIGxldCBhcnI6IE1ldGFkYXRhVmFsdWVbXSA9IFtdO1xuICAgICAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgY2hpbGQgPT4ge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZU5vZGUoY2hpbGQsIC8qIHByZWZlclJlZmVyZW5jZSAqLyB0cnVlKTtcblxuICAgICAgICAgIC8vIENoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChpc0ZvbGRhYmxlRXJyb3IodmFsdWUpKSB7XG4gICAgICAgICAgICBlcnJvciA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7ICAvLyBTdG9wIHRoZSBmb3JFYWNoQ2hpbGQuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSGFuZGxlIHNwcmVhZCBleHByZXNzaW9uc1xuICAgICAgICAgIGlmIChpc01ldGFkYXRhU3ltYm9saWNTcHJlYWRFeHByZXNzaW9uKHZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBzcHJlYWRWYWx1ZSBvZiB2YWx1ZS5leHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgYXJyLnB1c2goc3ByZWFkVmFsdWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhcnIucHVzaCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZXJyb3IpIHJldHVybiBlcnJvcjtcbiAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KGFyciwgbm9kZSk7XG4gICAgICBjYXNlIHNwcmVhZEVsZW1lbnRTeW50YXhLaW5kOlxuICAgICAgICBsZXQgc3ByZWFkRXhwcmVzc2lvbiA9IHRoaXMuZXZhbHVhdGVOb2RlKChub2RlIGFzIGFueSkuZXhwcmVzc2lvbik7XG4gICAgICAgIHJldHVybiByZWNvcmRFbnRyeSh7X19zeW1ib2xpYzogJ3NwcmVhZCcsIGV4cHJlc3Npb246IHNwcmVhZEV4cHJlc3Npb259LCBub2RlKTtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbjpcbiAgICAgICAgY29uc3QgY2FsbEV4cHJlc3Npb24gPSA8dHMuQ2FsbEV4cHJlc3Npb24+bm9kZTtcbiAgICAgICAgaWYgKGlzQ2FsbE9mKGNhbGxFeHByZXNzaW9uLCAnZm9yd2FyZFJlZicpICYmXG4gICAgICAgICAgICBhcnJheU9yRW1wdHkoY2FsbEV4cHJlc3Npb24uYXJndW1lbnRzKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEFyZ3VtZW50ID0gY2FsbEV4cHJlc3Npb24uYXJndW1lbnRzWzBdO1xuICAgICAgICAgIGlmIChmaXJzdEFyZ3VtZW50LmtpbmQgPT0gdHMuU3ludGF4S2luZC5BcnJvd0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBhcnJvd0Z1bmN0aW9uID0gPHRzLkFycm93RnVuY3Rpb24+Zmlyc3RBcmd1bWVudDtcbiAgICAgICAgICAgIHJldHVybiByZWNvcmRFbnRyeSh0aGlzLmV2YWx1YXRlTm9kZShhcnJvd0Z1bmN0aW9uLmJvZHkpLCBub2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXJncyA9IGFycmF5T3JFbXB0eShjYWxsRXhwcmVzc2lvbi5hcmd1bWVudHMpLm1hcChhcmcgPT4gdGhpcy5ldmFsdWF0ZU5vZGUoYXJnKSk7XG4gICAgICAgIGlmICh0aGlzLmlzRm9sZGFibGUoY2FsbEV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgaWYgKGlzTWV0aG9kQ2FsbE9mKGNhbGxFeHByZXNzaW9uLCAnY29uY2F0JykpIHtcbiAgICAgICAgICAgIGNvbnN0IGFycmF5VmFsdWUgPSA8TWV0YWRhdGFWYWx1ZVtdPnRoaXMuZXZhbHVhdGVOb2RlKFxuICAgICAgICAgICAgICAgICg8dHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uPmNhbGxFeHByZXNzaW9uLmV4cHJlc3Npb24pLmV4cHJlc3Npb24pO1xuICAgICAgICAgICAgaWYgKGlzRm9sZGFibGVFcnJvcihhcnJheVZhbHVlKSkgcmV0dXJuIGFycmF5VmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXlWYWx1ZS5jb25jYXQoYXJnc1swXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEFsd2F5cyBmb2xkIGEgQ09OU1RfRVhQUiBldmVuIGlmIHRoZSBhcmd1bWVudCBpcyBub3QgZm9sZGFibGUuXG4gICAgICAgIGlmIChpc0NhbGxPZihjYWxsRXhwcmVzc2lvbiwgJ0NPTlNUX0VYUFInKSAmJlxuICAgICAgICAgICAgYXJyYXlPckVtcHR5KGNhbGxFeHByZXNzaW9uLmFyZ3VtZW50cykubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KGFyZ3NbMF0sIG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSB0aGlzLmV2YWx1YXRlTm9kZShjYWxsRXhwcmVzc2lvbi5leHByZXNzaW9uKTtcbiAgICAgICAgaWYgKGlzRm9sZGFibGVFcnJvcihleHByZXNzaW9uKSkge1xuICAgICAgICAgIHJldHVybiByZWNvcmRFbnRyeShleHByZXNzaW9uLCBub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzdWx0OiBNZXRhZGF0YVN5bWJvbGljQ2FsbEV4cHJlc3Npb24gPSB7X19zeW1ib2xpYzogJ2NhbGwnLCBleHByZXNzaW9uOiBleHByZXNzaW9ufTtcbiAgICAgICAgaWYgKGFyZ3MgJiYgYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICByZXN1bHQuYXJndW1lbnRzID0gYXJncztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkocmVzdWx0LCBub2RlKTtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5OZXdFeHByZXNzaW9uOlxuICAgICAgICBjb25zdCBuZXdFeHByZXNzaW9uID0gPHRzLk5ld0V4cHJlc3Npb24+bm9kZTtcbiAgICAgICAgY29uc3QgbmV3QXJncyA9IGFycmF5T3JFbXB0eShuZXdFeHByZXNzaW9uLmFyZ3VtZW50cykubWFwKGFyZyA9PiB0aGlzLmV2YWx1YXRlTm9kZShhcmcpKTtcbiAgICAgICAgY29uc3QgbmV3VGFyZ2V0ID0gdGhpcy5ldmFsdWF0ZU5vZGUobmV3RXhwcmVzc2lvbi5leHByZXNzaW9uKTtcbiAgICAgICAgaWYgKGlzTWV0YWRhdGFFcnJvcihuZXdUYXJnZXQpKSB7XG4gICAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KG5ld1RhcmdldCwgbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2FsbDogTWV0YWRhdGFTeW1ib2xpY0NhbGxFeHByZXNzaW9uID0ge19fc3ltYm9saWM6ICduZXcnLCBleHByZXNzaW9uOiBuZXdUYXJnZXR9O1xuICAgICAgICBpZiAobmV3QXJncy5sZW5ndGgpIHtcbiAgICAgICAgICBjYWxsLmFyZ3VtZW50cyA9IG5ld0FyZ3M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KGNhbGwsIG5vZGUpO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbjoge1xuICAgICAgICBjb25zdCBwcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24gPSA8dHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uPm5vZGU7XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSB0aGlzLmV2YWx1YXRlTm9kZShwcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24uZXhwcmVzc2lvbik7XG4gICAgICAgIGlmIChpc0ZvbGRhYmxlRXJyb3IoZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkoZXhwcmVzc2lvbiwgbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWVtYmVyID0gdGhpcy5uYW1lT2YocHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uLm5hbWUpO1xuICAgICAgICBpZiAoaXNGb2xkYWJsZUVycm9yKG1lbWJlcikpIHtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkobWVtYmVyLCBub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhwcmVzc2lvbiAmJiB0aGlzLmlzRm9sZGFibGUocHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uLmV4cHJlc3Npb24pKVxuICAgICAgICAgIHJldHVybiAoPGFueT5leHByZXNzaW9uKVs8c3RyaW5nPm1lbWJlcl07XG4gICAgICAgIGlmIChpc01ldGFkYXRhTW9kdWxlUmVmZXJlbmNlRXhwcmVzc2lvbihleHByZXNzaW9uKSkge1xuICAgICAgICAgIC8vIEEgc2VsZWN0IGludG8gYSBtb2R1bGUgcmVmZXJlbmNlIGFuZCBiZSBjb252ZXJ0ZWQgaW50byBhIHJlZmVyZW5jZSB0byB0aGUgc3ltYm9sXG4gICAgICAgICAgLy8gaW4gdGhlIG1vZHVsZVxuICAgICAgICAgIHJldHVybiByZWNvcmRFbnRyeShcbiAgICAgICAgICAgICAge19fc3ltYm9saWM6ICdyZWZlcmVuY2UnLCBtb2R1bGU6IGV4cHJlc3Npb24ubW9kdWxlLCBuYW1lOiBtZW1iZXJ9LCBub2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkoe19fc3ltYm9saWM6ICdzZWxlY3QnLCBleHByZXNzaW9uLCBtZW1iZXJ9LCBub2RlKTtcbiAgICAgIH1cbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5FbGVtZW50QWNjZXNzRXhwcmVzc2lvbjoge1xuICAgICAgICBjb25zdCBlbGVtZW50QWNjZXNzRXhwcmVzc2lvbiA9IDx0cy5FbGVtZW50QWNjZXNzRXhwcmVzc2lvbj5ub2RlO1xuICAgICAgICBjb25zdCBleHByZXNzaW9uID0gdGhpcy5ldmFsdWF0ZU5vZGUoZWxlbWVudEFjY2Vzc0V4cHJlc3Npb24uZXhwcmVzc2lvbik7XG4gICAgICAgIGlmIChpc0ZvbGRhYmxlRXJyb3IoZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkoZXhwcmVzc2lvbiwgbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlbGVtZW50QWNjZXNzRXhwcmVzc2lvbi5hcmd1bWVudEV4cHJlc3Npb24pIHtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkoZXJyb3JTeW1ib2woJ0V4cHJlc3Npb24gZm9ybSBub3Qgc3VwcG9ydGVkJywgbm9kZSksIG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ldmFsdWF0ZU5vZGUoZWxlbWVudEFjY2Vzc0V4cHJlc3Npb24uYXJndW1lbnRFeHByZXNzaW9uKTtcbiAgICAgICAgaWYgKGlzRm9sZGFibGVFcnJvcihleHByZXNzaW9uKSkge1xuICAgICAgICAgIHJldHVybiByZWNvcmRFbnRyeShleHByZXNzaW9uLCBub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pc0ZvbGRhYmxlKGVsZW1lbnRBY2Nlc3NFeHByZXNzaW9uLmV4cHJlc3Npb24pICYmXG4gICAgICAgICAgICB0aGlzLmlzRm9sZGFibGUoZWxlbWVudEFjY2Vzc0V4cHJlc3Npb24uYXJndW1lbnRFeHByZXNzaW9uKSlcbiAgICAgICAgICByZXR1cm4gKDxhbnk+ZXhwcmVzc2lvbilbPHN0cmluZ3xudW1iZXI+aW5kZXhdO1xuICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkoe19fc3ltYm9saWM6ICdpbmRleCcsIGV4cHJlc3Npb24sIGluZGV4fSwgbm9kZSk7XG4gICAgICB9XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcjpcbiAgICAgICAgY29uc3QgaWRlbnRpZmllciA9IDx0cy5JZGVudGlmaWVyPm5vZGU7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBpZGVudGlmaWVyLnRleHQ7XG4gICAgICAgIHJldHVybiByZXNvbHZlTmFtZShuYW1lLCBwcmVmZXJSZWZlcmVuY2UpO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlR5cGVSZWZlcmVuY2U6XG4gICAgICAgIGNvbnN0IHR5cGVSZWZlcmVuY2VOb2RlID0gPHRzLlR5cGVSZWZlcmVuY2VOb2RlPm5vZGU7XG4gICAgICAgIGNvbnN0IHR5cGVOYW1lTm9kZSA9IHR5cGVSZWZlcmVuY2VOb2RlLnR5cGVOYW1lO1xuICAgICAgICBjb25zdCBnZXRSZWZlcmVuY2U6ICh0eXBlTmFtZU5vZGU6IHRzLklkZW50aWZpZXIgfCB0cy5RdWFsaWZpZWROYW1lKSA9PiBNZXRhZGF0YVZhbHVlID1cbiAgICAgICAgICAgIG5vZGUgPT4ge1xuICAgICAgICAgICAgICBpZiAodHlwZU5hbWVOb2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuUXVhbGlmaWVkTmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHF1YWxpZmllZE5hbWUgPSA8dHMuUXVhbGlmaWVkTmFtZT5ub2RlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxlZnQgPSB0aGlzLmV2YWx1YXRlTm9kZShxdWFsaWZpZWROYW1lLmxlZnQpO1xuICAgICAgICAgICAgICAgIGlmIChpc01ldGFkYXRhTW9kdWxlUmVmZXJlbmNlRXhwcmVzc2lvbihsZWZ0KSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KFxuICAgICAgICAgICAgICAgICAgICAgIDxNZXRhZGF0YUltcG9ydGVkU3ltYm9sUmVmZXJlbmNlRXhwcmVzc2lvbj57XG4gICAgICAgICAgICAgICAgICAgICAgICBfX3N5bWJvbGljOiAncmVmZXJlbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZTogbGVmdC5tb2R1bGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBxdWFsaWZpZWROYW1lLnJpZ2h0LnRleHRcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBSZWNvcmQgYSB0eXBlIHJlZmVyZW5jZSB0byBhIGRlY2xhcmVkIHR5cGUgYXMgYSBzZWxlY3QuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtfX3N5bWJvbGljOiAnc2VsZWN0JywgZXhwcmVzc2lvbjogbGVmdCwgbWVtYmVyOiBxdWFsaWZpZWROYW1lLnJpZ2h0LnRleHR9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkZW50aWZpZXIgPSA8dHMuSWRlbnRpZmllcj50eXBlTmFtZU5vZGU7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3ltYm9sID0gdGhpcy5zeW1ib2xzLnJlc29sdmUoaWRlbnRpZmllci50ZXh0KTtcbiAgICAgICAgICAgICAgICBpZiAoaXNGb2xkYWJsZUVycm9yKHN5bWJvbCkgfHwgaXNNZXRhZGF0YVN5bWJvbGljUmVmZXJlbmNlRXhwcmVzc2lvbihzeW1ib2wpKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkoc3ltYm9sLCBub2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KFxuICAgICAgICAgICAgICAgICAgICBlcnJvclN5bWJvbCgnQ291bGQgbm90IHJlc29sdmUgdHlwZScsIG5vZGUsIHt0eXBlTmFtZTogaWRlbnRpZmllci50ZXh0fSksIG5vZGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICBjb25zdCB0eXBlUmVmZXJlbmNlID0gZ2V0UmVmZXJlbmNlKHR5cGVOYW1lTm9kZSk7XG4gICAgICAgIGlmIChpc0ZvbGRhYmxlRXJyb3IodHlwZVJlZmVyZW5jZSkpIHtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkodHlwZVJlZmVyZW5jZSwgbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc01ldGFkYXRhTW9kdWxlUmVmZXJlbmNlRXhwcmVzc2lvbih0eXBlUmVmZXJlbmNlKSAmJlxuICAgICAgICAgICAgdHlwZVJlZmVyZW5jZU5vZGUudHlwZUFyZ3VtZW50cyAmJiB0eXBlUmVmZXJlbmNlTm9kZS50eXBlQXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IGFyZ3MgPSB0eXBlUmVmZXJlbmNlTm9kZS50eXBlQXJndW1lbnRzLm1hcChlbGVtZW50ID0+IHRoaXMuZXZhbHVhdGVOb2RlKGVsZW1lbnQpKTtcbiAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgdHlwZWNhc3Qgd2hlbiB1cGdyYWRlZCB0byAyLjAgYXMgaXQgd2lsbCBiZSBjb3JyZWN0bHkgaW5mZXJyZWQuXG4gICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiAxLjkgZG8gbm90IGluZmVyIHRoaXMgY29ycmVjdGx5LlxuICAgICAgICAgICg8TWV0YWRhdGFJbXBvcnRlZFN5bWJvbFJlZmVyZW5jZUV4cHJlc3Npb24+dHlwZVJlZmVyZW5jZSkuYXJndW1lbnRzID0gYXJncztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkodHlwZVJlZmVyZW5jZSwgbm9kZSk7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuVW5pb25UeXBlOlxuICAgICAgICBjb25zdCB1bmlvblR5cGUgPSA8dHMuVW5pb25UeXBlTm9kZT5ub2RlO1xuXG4gICAgICAgIC8vIFJlbW92ZSBudWxsIGFuZCB1bmRlZmluZWQgZnJvbSB0aGUgbGlzdCBvZiB1bmlvbnMuXG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZXMgPSB1bmlvblR5cGUudHlwZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuID0+IG4ua2luZCAhPSB0cy5TeW50YXhLaW5kLk51bGxLZXl3b3JkICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuLmtpbmQgIT0gdHMuU3ludGF4S2luZC5VbmRlZmluZWRLZXl3b3JkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAobiA9PiB0aGlzLmV2YWx1YXRlTm9kZShuKSk7XG5cbiAgICAgICAgLy8gVGhlIHJlbW1haW5pbmcgcmVmZXJlbmNlIG11c3QgYmUgdGhlIHNhbWUuIElmIHR3byBoYXZlIHR5cGUgYXJndW1lbnRzIGNvbnNpZGVyIHRoZW1cbiAgICAgICAgLy8gZGlmZmVyZW50IGV2ZW4gaWYgdGhlIHR5cGUgYXJndW1lbnRzIGFyZSB0aGUgc2FtZS5cbiAgICAgICAgbGV0IGNhbmRpZGF0ZTogYW55ID0gbnVsbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWZlcmVuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgcmVmZXJlbmNlID0gcmVmZXJlbmNlc1tpXTtcbiAgICAgICAgICBpZiAoaXNNZXRhZGF0YVN5bWJvbGljUmVmZXJlbmNlRXhwcmVzc2lvbihyZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICBpZiAoY2FuZGlkYXRlKSB7XG4gICAgICAgICAgICAgIGlmICgocmVmZXJlbmNlIGFzIGFueSkubmFtZSA9PSBjYW5kaWRhdGUubmFtZSAmJlxuICAgICAgICAgICAgICAgICAgKHJlZmVyZW5jZSBhcyBhbnkpLm1vZHVsZSA9PSBjYW5kaWRhdGUubW9kdWxlICYmICEocmVmZXJlbmNlIGFzIGFueSkuYXJndW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgY2FuZGlkYXRlID0gcmVmZXJlbmNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjYW5kaWRhdGUgPSByZWZlcmVuY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiByZWZlcmVuY2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYW5kaWRhdGUpIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk5vU3Vic3RpdHV0aW9uVGVtcGxhdGVMaXRlcmFsOlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWw6XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuVGVtcGxhdGVIZWFkOlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlRlbXBsYXRlVGFpbDpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5UZW1wbGF0ZU1pZGRsZTpcbiAgICAgICAgcmV0dXJuICg8dHMuTGl0ZXJhbExpa2VOb2RlPm5vZGUpLnRleHQ7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTnVtZXJpY0xpdGVyYWw6XG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KCg8dHMuTGl0ZXJhbEV4cHJlc3Npb24+bm9kZSkudGV4dCk7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQW55S2V5d29yZDpcbiAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KHtfX3N5bWJvbGljOiAncmVmZXJlbmNlJywgbmFtZTogJ2FueSd9LCBub2RlKTtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5TdHJpbmdLZXl3b3JkOlxuICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkoe19fc3ltYm9saWM6ICdyZWZlcmVuY2UnLCBuYW1lOiAnc3RyaW5nJ30sIG5vZGUpO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk51bWJlcktleXdvcmQ6XG4gICAgICAgIHJldHVybiByZWNvcmRFbnRyeSh7X19zeW1ib2xpYzogJ3JlZmVyZW5jZScsIG5hbWU6ICdudW1iZXInfSwgbm9kZSk7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQm9vbGVhbktleXdvcmQ6XG4gICAgICAgIHJldHVybiByZWNvcmRFbnRyeSh7X19zeW1ib2xpYzogJ3JlZmVyZW5jZScsIG5hbWU6ICdib29sZWFuJ30sIG5vZGUpO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkFycmF5VHlwZTpcbiAgICAgICAgY29uc3QgYXJyYXlUeXBlTm9kZSA9IDx0cy5BcnJheVR5cGVOb2RlPm5vZGU7XG4gICAgICAgIHJldHVybiByZWNvcmRFbnRyeShcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgX19zeW1ib2xpYzogJ3JlZmVyZW5jZScsXG4gICAgICAgICAgICAgIG5hbWU6ICdBcnJheScsXG4gICAgICAgICAgICAgIGFyZ3VtZW50czogW3RoaXMuZXZhbHVhdGVOb2RlKGFycmF5VHlwZU5vZGUuZWxlbWVudFR5cGUpXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5vZGUpO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk51bGxLZXl3b3JkOlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5UcnVlS2V5d29yZDpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuRmFsc2VLZXl3b3JkOlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuUGFyZW50aGVzaXplZEV4cHJlc3Npb246XG4gICAgICAgIGNvbnN0IHBhcmVudGhlc2l6ZWRFeHByZXNzaW9uID0gPHRzLlBhcmVudGhlc2l6ZWRFeHByZXNzaW9uPm5vZGU7XG4gICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlTm9kZShwYXJlbnRoZXNpemVkRXhwcmVzc2lvbi5leHByZXNzaW9uKTtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5UeXBlQXNzZXJ0aW9uRXhwcmVzc2lvbjpcbiAgICAgICAgY29uc3QgdHlwZUFzc2VydGlvbiA9IDx0cy5UeXBlQXNzZXJ0aW9uPm5vZGU7XG4gICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlTm9kZSh0eXBlQXNzZXJ0aW9uLmV4cHJlc3Npb24pO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlByZWZpeFVuYXJ5RXhwcmVzc2lvbjpcbiAgICAgICAgY29uc3QgcHJlZml4VW5hcnlFeHByZXNzaW9uID0gPHRzLlByZWZpeFVuYXJ5RXhwcmVzc2lvbj5ub2RlO1xuICAgICAgICBjb25zdCBvcGVyYW5kID0gdGhpcy5ldmFsdWF0ZU5vZGUocHJlZml4VW5hcnlFeHByZXNzaW9uLm9wZXJhbmQpO1xuICAgICAgICBpZiAoaXNEZWZpbmVkKG9wZXJhbmQpICYmIGlzUHJpbWl0aXZlKG9wZXJhbmQpKSB7XG4gICAgICAgICAgc3dpdGNoIChwcmVmaXhVbmFyeUV4cHJlc3Npb24ub3BlcmF0b3IpIHtcbiAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5QbHVzVG9rZW46XG4gICAgICAgICAgICAgIHJldHVybiArKG9wZXJhbmQgYXMgYW55KTtcbiAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5NaW51c1Rva2VuOlxuICAgICAgICAgICAgICByZXR1cm4gLShvcGVyYW5kIGFzIGFueSk7XG4gICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuVGlsZGVUb2tlbjpcbiAgICAgICAgICAgICAgcmV0dXJuIH4ob3BlcmFuZCBhcyBhbnkpO1xuICAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkV4Y2xhbWF0aW9uVG9rZW46XG4gICAgICAgICAgICAgIHJldHVybiAhb3BlcmFuZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9wZXJhdG9yVGV4dDogc3RyaW5nO1xuICAgICAgICBzd2l0Y2ggKHByZWZpeFVuYXJ5RXhwcmVzc2lvbi5vcGVyYXRvcikge1xuICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5QbHVzVG9rZW46XG4gICAgICAgICAgICBvcGVyYXRvclRleHQgPSAnKyc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTWludXNUb2tlbjpcbiAgICAgICAgICAgIG9wZXJhdG9yVGV4dCA9ICctJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5UaWxkZVRva2VuOlxuICAgICAgICAgICAgb3BlcmF0b3JUZXh0ID0gJ34nO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkV4Y2xhbWF0aW9uVG9rZW46XG4gICAgICAgICAgICBvcGVyYXRvclRleHQgPSAnISc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkoe19fc3ltYm9saWM6ICdwcmUnLCBvcGVyYXRvcjogb3BlcmF0b3JUZXh0LCBvcGVyYW5kOiBvcGVyYW5kfSwgbm9kZSk7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQmluYXJ5RXhwcmVzc2lvbjpcbiAgICAgICAgY29uc3QgYmluYXJ5RXhwcmVzc2lvbiA9IDx0cy5CaW5hcnlFeHByZXNzaW9uPm5vZGU7XG4gICAgICAgIGNvbnN0IGxlZnQgPSB0aGlzLmV2YWx1YXRlTm9kZShiaW5hcnlFeHByZXNzaW9uLmxlZnQpO1xuICAgICAgICBjb25zdCByaWdodCA9IHRoaXMuZXZhbHVhdGVOb2RlKGJpbmFyeUV4cHJlc3Npb24ucmlnaHQpO1xuICAgICAgICBpZiAoaXNEZWZpbmVkKGxlZnQpICYmIGlzRGVmaW5lZChyaWdodCkpIHtcbiAgICAgICAgICBpZiAoaXNQcmltaXRpdmUobGVmdCkgJiYgaXNQcmltaXRpdmUocmlnaHQpKVxuICAgICAgICAgICAgc3dpdGNoIChiaW5hcnlFeHByZXNzaW9uLm9wZXJhdG9yVG9rZW4ua2luZCkge1xuICAgICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQmFyQmFyVG9rZW46XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxhbnk+bGVmdCB8fCA8YW55PnJpZ2h0O1xuICAgICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQW1wZXJzYW5kQW1wZXJzYW5kVG9rZW46XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxhbnk+bGVmdCAmJiA8YW55PnJpZ2h0O1xuICAgICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQW1wZXJzYW5kVG9rZW46XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxhbnk+bGVmdCAmIDxhbnk+cmlnaHQ7XG4gICAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5CYXJUb2tlbjpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGFueT5sZWZ0IHwgPGFueT5yaWdodDtcbiAgICAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNhcmV0VG9rZW46XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxhbnk+bGVmdCBeIDxhbnk+cmlnaHQ7XG4gICAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5FcXVhbHNFcXVhbHNUb2tlbjpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGFueT5sZWZ0ID09IDxhbnk+cmlnaHQ7XG4gICAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5FeGNsYW1hdGlvbkVxdWFsc1Rva2VuOlxuICAgICAgICAgICAgICAgIHJldHVybiA8YW55PmxlZnQgIT0gPGFueT5yaWdodDtcbiAgICAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkVxdWFsc0VxdWFsc0VxdWFsc1Rva2VuOlxuICAgICAgICAgICAgICAgIHJldHVybiA8YW55PmxlZnQgPT09IDxhbnk+cmlnaHQ7XG4gICAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5FeGNsYW1hdGlvbkVxdWFsc0VxdWFsc1Rva2VuOlxuICAgICAgICAgICAgICAgIHJldHVybiA8YW55PmxlZnQgIT09IDxhbnk+cmlnaHQ7XG4gICAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5MZXNzVGhhblRva2VuOlxuICAgICAgICAgICAgICAgIHJldHVybiA8YW55PmxlZnQgPCA8YW55PnJpZ2h0O1xuICAgICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuR3JlYXRlclRoYW5Ub2tlbjpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGFueT5sZWZ0ID4gPGFueT5yaWdodDtcbiAgICAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkxlc3NUaGFuRXF1YWxzVG9rZW46XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxhbnk+bGVmdCA8PSA8YW55PnJpZ2h0O1xuICAgICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuR3JlYXRlclRoYW5FcXVhbHNUb2tlbjpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGFueT5sZWZ0ID49IDxhbnk+cmlnaHQ7XG4gICAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5MZXNzVGhhbkxlc3NUaGFuVG9rZW46XG4gICAgICAgICAgICAgICAgcmV0dXJuICg8YW55PmxlZnQpIDw8ICg8YW55PnJpZ2h0KTtcbiAgICAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkdyZWF0ZXJUaGFuR3JlYXRlclRoYW5Ub2tlbjpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGFueT5sZWZ0ID4+IDxhbnk+cmlnaHQ7XG4gICAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5HcmVhdGVyVGhhbkdyZWF0ZXJUaGFuR3JlYXRlclRoYW5Ub2tlbjpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGFueT5sZWZ0ID4+PiA8YW55PnJpZ2h0O1xuICAgICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuUGx1c1Rva2VuOlxuICAgICAgICAgICAgICAgIHJldHVybiA8YW55PmxlZnQgKyA8YW55PnJpZ2h0O1xuICAgICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTWludXNUb2tlbjpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGFueT5sZWZ0IC0gPGFueT5yaWdodDtcbiAgICAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkFzdGVyaXNrVG9rZW46XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxhbnk+bGVmdCAqIDxhbnk+cmlnaHQ7XG4gICAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5TbGFzaFRva2VuOlxuICAgICAgICAgICAgICAgIHJldHVybiA8YW55PmxlZnQgLyA8YW55PnJpZ2h0O1xuICAgICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuUGVyY2VudFRva2VuOlxuICAgICAgICAgICAgICAgIHJldHVybiA8YW55PmxlZnQgJSA8YW55PnJpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZWNvcmRFbnRyeShcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9fc3ltYm9saWM6ICdiaW5vcCcsXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IGJpbmFyeUV4cHJlc3Npb24ub3BlcmF0b3JUb2tlbi5nZXRUZXh0KCksXG4gICAgICAgICAgICAgICAgbGVmdDogbGVmdCxcbiAgICAgICAgICAgICAgICByaWdodDogcmlnaHRcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQ29uZGl0aW9uYWxFeHByZXNzaW9uOlxuICAgICAgICBjb25zdCBjb25kaXRpb25hbEV4cHJlc3Npb24gPSA8dHMuQ29uZGl0aW9uYWxFeHByZXNzaW9uPm5vZGU7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuZXZhbHVhdGVOb2RlKGNvbmRpdGlvbmFsRXhwcmVzc2lvbi5jb25kaXRpb24pO1xuICAgICAgICBjb25zdCB0aGVuRXhwcmVzc2lvbiA9IHRoaXMuZXZhbHVhdGVOb2RlKGNvbmRpdGlvbmFsRXhwcmVzc2lvbi53aGVuVHJ1ZSk7XG4gICAgICAgIGNvbnN0IGVsc2VFeHByZXNzaW9uID0gdGhpcy5ldmFsdWF0ZU5vZGUoY29uZGl0aW9uYWxFeHByZXNzaW9uLndoZW5GYWxzZSk7XG4gICAgICAgIGlmIChpc1ByaW1pdGl2ZShjb25kaXRpb24pKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbiA/IHRoZW5FeHByZXNzaW9uIDogZWxzZUV4cHJlc3Npb247XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KHtfX3N5bWJvbGljOiAnaWYnLCBjb25kaXRpb24sIHRoZW5FeHByZXNzaW9uLCBlbHNlRXhwcmVzc2lvbn0sIG5vZGUpO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkZ1bmN0aW9uRXhwcmVzc2lvbjpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5BcnJvd0Z1bmN0aW9uOlxuICAgICAgICByZXR1cm4gcmVjb3JkRW50cnkoZXJyb3JTeW1ib2woJ0xhbWJkYSBub3Qgc3VwcG9ydGVkJywgbm9kZSksIG5vZGUpO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlRhZ2dlZFRlbXBsYXRlRXhwcmVzc2lvbjpcbiAgICAgICAgcmV0dXJuIHJlY29yZEVudHJ5KFxuICAgICAgICAgICAgZXJyb3JTeW1ib2woJ1RhZ2dlZCB0ZW1wbGF0ZSBleHByZXNzaW9ucyBhcmUgbm90IHN1cHBvcnRlZCBpbiBtZXRhZGF0YScsIG5vZGUpLCBub2RlKTtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5UZW1wbGF0ZUV4cHJlc3Npb246XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlRXhwcmVzc2lvbiA9IDx0cy5UZW1wbGF0ZUV4cHJlc3Npb24+bm9kZTtcbiAgICAgICAgaWYgKHRoaXMuaXNGb2xkYWJsZShub2RlKSkge1xuICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZUV4cHJlc3Npb24udGVtcGxhdGVTcGFucy5yZWR1Y2UoXG4gICAgICAgICAgICAgIChwcmV2aW91cywgY3VycmVudCkgPT4gcHJldmlvdXMgKyA8c3RyaW5nPnRoaXMuZXZhbHVhdGVOb2RlKGN1cnJlbnQuZXhwcmVzc2lvbikgK1xuICAgICAgICAgICAgICAgICAgPHN0cmluZz50aGlzLmV2YWx1YXRlTm9kZShjdXJyZW50LmxpdGVyYWwpLFxuICAgICAgICAgICAgICB0aGlzLmV2YWx1YXRlTm9kZSh0ZW1wbGF0ZUV4cHJlc3Npb24uaGVhZCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZUV4cHJlc3Npb24udGVtcGxhdGVTcGFucy5yZWR1Y2UoKHByZXZpb3VzLCBjdXJyZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBleHByID0gdGhpcy5ldmFsdWF0ZU5vZGUoY3VycmVudC5leHByZXNzaW9uKTtcbiAgICAgICAgICAgIGNvbnN0IGxpdGVyYWwgPSB0aGlzLmV2YWx1YXRlTm9kZShjdXJyZW50LmxpdGVyYWwpO1xuICAgICAgICAgICAgaWYgKGlzRm9sZGFibGVFcnJvcihleHByKSkgcmV0dXJuIGV4cHI7XG4gICAgICAgICAgICBpZiAoaXNGb2xkYWJsZUVycm9yKGxpdGVyYWwpKSByZXR1cm4gbGl0ZXJhbDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJldmlvdXMgPT09ICdzdHJpbmcnICYmIHR5cGVvZiBleHByID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBsaXRlcmFsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICByZXR1cm4gcHJldmlvdXMgKyBleHByICsgbGl0ZXJhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCByZXN1bHQgPSBleHByO1xuICAgICAgICAgICAgaWYgKHByZXZpb3VzICE9PSAnJykge1xuICAgICAgICAgICAgICByZXN1bHQgPSB7X19zeW1ib2xpYzogJ2Jpbm9wJywgb3BlcmF0b3I6ICcrJywgbGVmdDogcHJldmlvdXMsIHJpZ2h0OiBleHByfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsaXRlcmFsICE9ICcnKSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IHtfX3N5bWJvbGljOiAnYmlub3AnLCBvcGVyYXRvcjogJysnLCBsZWZ0OiByZXN1bHQsIHJpZ2h0OiBsaXRlcmFsfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgfSwgdGhpcy5ldmFsdWF0ZU5vZGUodGVtcGxhdGVFeHByZXNzaW9uLmhlYWQpKTtcbiAgICAgICAgfVxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkFzRXhwcmVzc2lvbjpcbiAgICAgICAgY29uc3QgYXNFeHByZXNzaW9uID0gPHRzLkFzRXhwcmVzc2lvbj5ub2RlO1xuICAgICAgICByZXR1cm4gdGhpcy5ldmFsdWF0ZU5vZGUoYXNFeHByZXNzaW9uLmV4cHJlc3Npb24pO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNsYXNzRXhwcmVzc2lvbjpcbiAgICAgICAgcmV0dXJuIHtfX3N5bWJvbGljOiAnY2xhc3MnfTtcbiAgICB9XG4gICAgcmV0dXJuIHJlY29yZEVudHJ5KGVycm9yU3ltYm9sKCdFeHByZXNzaW9uIGZvcm0gbm90IHN1cHBvcnRlZCcsIG5vZGUpLCBub2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1Byb3BlcnR5QXNzaWdubWVudChub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5Qcm9wZXJ0eUFzc2lnbm1lbnQge1xuICByZXR1cm4gbm9kZS5raW5kID09IHRzLlN5bnRheEtpbmQuUHJvcGVydHlBc3NpZ25tZW50O1xufVxuXG5jb25zdCBlbXB0eSA9IHRzLmNyZWF0ZU5vZGVBcnJheTxhbnk+KCk7XG5cbmZ1bmN0aW9uIGFycmF5T3JFbXB0eTxUIGV4dGVuZHMgdHMuTm9kZT4odjogdHMuTm9kZUFycmF5PFQ+fCB1bmRlZmluZWQpOiB0cy5Ob2RlQXJyYXk8VD4ge1xuICByZXR1cm4gdiB8fCBlbXB0eTtcbn0iXX0=