"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const elements_1 = require("./elements");
/** Finds the specified Angular @Input in the given elements with tag name. */
function findInputsOnElementWithTag(html, inputName, tagNames) {
    return [
        // Inputs can be also used without brackets (e.g. `<mat-toolbar color="primary">`)
        ...elements_1.findAttributeOnElementWithTag(html, inputName, tagNames),
        // Add one column to the mapped offset because the first bracket for the @Input
        // is part of the attribute and therefore also part of the offset. We only want to return
        // the offset for the inner name of the bracketed input.
        ...elements_1.findAttributeOnElementWithTag(html, `[${inputName}]`, tagNames).map(offset => offset + 1),
    ];
}
exports.findInputsOnElementWithTag = findInputsOnElementWithTag;
/** Finds the specified Angular @Input in elements that have one of the specified attributes. */
function findInputsOnElementWithAttr(html, inputName, attrs) {
    return [
        // Inputs can be also used without brackets (e.g. `<button mat-button color="primary">`)
        ...elements_1.findAttributeOnElementWithAttrs(html, inputName, attrs),
        // Add one column to the mapped offset because the first bracket for the @Input
        // is part of the attribute and therefore also part of the offset. We only want to return
        // the offset for the inner name of the bracketed input.
        ...elements_1.findAttributeOnElementWithAttrs(html, `[${inputName}]`, attrs).map(offset => offset + 1),
    ];
}
exports.findInputsOnElementWithAttr = findInputsOnElementWithAttr;
/** Finds the specified Angular @Output in the given elements with tag name. */
function findOutputsOnElementWithTag(html, outputName, tagNames) {
    // Add one column to the mapped offset because the first parenthesis for the @Output
    // is part of the attribute and therefore also part of the offset. We only want to return
    // the offset for the inner name of the output.
    return elements_1.findAttributeOnElementWithTag(html, `(${outputName})`, tagNames).map(offset => offset + 1);
}
exports.findOutputsOnElementWithTag = findOutputsOnElementWithTag;
/** Finds the specified Angular @Output in elements that have one of the specified attributes. */
function findOutputsOnElementWithAttr(html, outputName, attrs) {
    // Add one column to the mapped offset because the first bracket for the @Output
    // is part of the attribute and therefore also part of the offset. We only want to return
    // the offset for the inner name of the output.
    return elements_1.findAttributeOnElementWithAttrs(html, `(${outputName})`, attrs).map(offset => offset + 1);
}
exports.findOutputsOnElementWithAttr = findOutputsOnElementWithAttr;
//# sourceMappingURL=angular.js.map