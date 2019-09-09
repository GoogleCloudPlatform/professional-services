"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const parse5_element_1 = require("./parse5-element");
const parse5_1 = require("parse5");
/** Appends the given element HTML fragment to the `<head>` element of the specified HTML file. */
function appendHtmlElementToHead(host, htmlFilePath, elementHtml) {
    const htmlFileBuffer = host.read(htmlFilePath);
    if (!htmlFileBuffer) {
        throw new schematics_1.SchematicsException(`Could not read file for path: ${htmlFilePath}`);
    }
    const htmlContent = htmlFileBuffer.toString();
    if (htmlContent.includes(elementHtml)) {
        return;
    }
    const headTag = getHtmlHeadTagElement(htmlContent);
    if (!headTag) {
        throw `Could not find '<head>' element in HTML file: ${htmlFileBuffer}`;
    }
    // We always have access to the source code location here because the `getHeadTagElement`
    // function explicitly has the `sourceCodeLocationInfo` option enabled.
    const endTagOffset = headTag.sourceCodeLocation.endTag.startOffset;
    const indentationOffset = parse5_element_1.getChildElementIndentation(headTag);
    const insertion = `${' '.repeat(indentationOffset)}${elementHtml}`;
    const recordedChange = host
        .beginUpdate(htmlFilePath)
        .insertRight(endTagOffset, `${insertion}\n`);
    host.commitUpdate(recordedChange);
}
exports.appendHtmlElementToHead = appendHtmlElementToHead;
/** Parses the given HTML file and returns the head element if available. */
function getHtmlHeadTagElement(htmlContent) {
    const document = parse5_1.parse(htmlContent, { sourceCodeLocationInfo: true });
    const nodeQueue = [...document.childNodes];
    while (nodeQueue.length) {
        const node = nodeQueue.shift();
        if (node.nodeName.toLowerCase() === 'head') {
            return node;
        }
        else if (node.childNodes) {
            nodeQueue.push(...node.childNodes);
        }
    }
    return null;
}
exports.getHtmlHeadTagElement = getHtmlHeadTagElement;
//# sourceMappingURL=html-head-element.js.map