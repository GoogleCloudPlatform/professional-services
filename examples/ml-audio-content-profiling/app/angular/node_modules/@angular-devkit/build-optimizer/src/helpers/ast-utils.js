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
// Find all nodes from the AST in the subtree of node of SyntaxKind kind.
function collectDeepNodes(node, kind) {
    const nodes = [];
    const helper = (child) => {
        if (child.kind === kind) {
            nodes.push(child);
        }
        ts.forEachChild(child, helper);
    };
    ts.forEachChild(node, helper);
    return nodes;
}
exports.collectDeepNodes = collectDeepNodes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LXV0aWxzLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9vcHRpbWl6ZXIvc3JjL2hlbHBlcnMvYXN0LXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsaUNBQWlDO0FBRWpDLHlFQUF5RTtBQUN6RSxTQUFnQixnQkFBZ0IsQ0FBb0IsSUFBYSxFQUFFLElBQW1CO0lBQ3BGLE1BQU0sS0FBSyxHQUFRLEVBQUUsQ0FBQztJQUN0QixNQUFNLE1BQU0sR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFO1FBQ2hDLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDdkIsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFVLENBQUMsQ0FBQztTQUN4QjtRQUNELEVBQUUsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLENBQUMsQ0FBQztJQUNGLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRTlCLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQVhELDRDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbi8vIEZpbmQgYWxsIG5vZGVzIGZyb20gdGhlIEFTVCBpbiB0aGUgc3VidHJlZSBvZiBub2RlIG9mIFN5bnRheEtpbmQga2luZC5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0RGVlcE5vZGVzPFQgZXh0ZW5kcyB0cy5Ob2RlPihub2RlOiB0cy5Ob2RlLCBraW5kOiB0cy5TeW50YXhLaW5kKTogVFtdIHtcbiAgY29uc3Qgbm9kZXM6IFRbXSA9IFtdO1xuICBjb25zdCBoZWxwZXIgPSAoY2hpbGQ6IHRzLk5vZGUpID0+IHtcbiAgICBpZiAoY2hpbGQua2luZCA9PT0ga2luZCkge1xuICAgICAgbm9kZXMucHVzaChjaGlsZCBhcyBUKTtcbiAgICB9XG4gICAgdHMuZm9yRWFjaENoaWxkKGNoaWxkLCBoZWxwZXIpO1xuICB9O1xuICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgaGVscGVyKTtcblxuICByZXR1cm4gbm9kZXM7XG59XG4iXX0=