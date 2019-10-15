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
/** Determines the base types of the specified class declaration. */
function determineBaseTypes(node) {
    if (!node.heritageClauses) {
        return null;
    }
    return node.heritageClauses
        .reduce((types, clause) => types.concat(clause.types), [])
        .map(typeExpression => typeExpression.expression)
        .filter(expression => expression && ts.isIdentifier(expression))
        .map((identifier) => identifier.text);
}
exports.determineBaseTypes = determineBaseTypes;
//# sourceMappingURL=base-types.js.map