"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
/** Checks whether the given node is part of an import specifier node. */
function isImportSpecifierNode(node) {
    return isPartOfKind(node, ts.SyntaxKind.ImportSpecifier);
}
exports.isImportSpecifierNode = isImportSpecifierNode;
/** Checks whether the given node is part of an export specifier node. */
function isExportSpecifierNode(node) {
    return isPartOfKind(node, ts.SyntaxKind.ExportSpecifier);
}
exports.isExportSpecifierNode = isExportSpecifierNode;
/** Checks whether the given node is part of a namespace import. */
function isNamespaceImportNode(node) {
    return isPartOfKind(node, ts.SyntaxKind.NamespaceImport);
}
exports.isNamespaceImportNode = isNamespaceImportNode;
/** Finds the parent import declaration of a given TypeScript node. */
function getImportDeclaration(node) {
    return findDeclaration(node, ts.SyntaxKind.ImportDeclaration);
}
exports.getImportDeclaration = getImportDeclaration;
/** Finds the parent export declaration of a given TypeScript node */
function getExportDeclaration(node) {
    return findDeclaration(node, ts.SyntaxKind.ExportDeclaration);
}
exports.getExportDeclaration = getExportDeclaration;
/** Finds the specified declaration for the given node by walking up the TypeScript nodes. */
function findDeclaration(node, kind) {
    while (node.kind !== kind) {
        node = node.parent;
    }
    return node;
}
/** Checks whether the given node is part of another TypeScript Node with the specified kind. */
function isPartOfKind(node, kind) {
    if (node.kind === kind) {
        return true;
    }
    else if (node.kind === ts.SyntaxKind.SourceFile) {
        return false;
    }
    return isPartOfKind(node.parent, kind);
}
//# sourceMappingURL=imports.js.map