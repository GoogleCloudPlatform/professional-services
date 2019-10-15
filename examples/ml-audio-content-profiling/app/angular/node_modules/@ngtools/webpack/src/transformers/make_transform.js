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
const elide_imports_1 = require("./elide_imports");
const interfaces_1 = require("./interfaces");
// Typescript below 2.7.0 needs a workaround.
const tsVersionParts = ts.version.split('.').map(p => Number(p));
const visitEachChild = tsVersionParts[0] <= 2 && tsVersionParts[1] < 7
    ? visitEachChildWorkaround
    : ts.visitEachChild;
function makeTransform(standardTransform, getTypeChecker) {
    return (context) => {
        const transformer = (sf) => {
            const ops = standardTransform(sf);
            const removeOps = ops
                .filter((op) => op.kind === interfaces_1.OPERATION_KIND.Remove);
            const addOps = ops.filter((op) => op.kind === interfaces_1.OPERATION_KIND.Add);
            const replaceOps = ops
                .filter((op) => op.kind === interfaces_1.OPERATION_KIND.Replace);
            // If nodes are removed, elide the imports as well.
            // Mainly a workaround for https://github.com/Microsoft/TypeScript/issues/17552.
            // WARNING: this assumes that replaceOps DO NOT reuse any of the nodes they are replacing.
            // This is currently true for transforms that use replaceOps (replace_bootstrap and
            // replace_resources), but may not be true for new transforms.
            if (getTypeChecker && removeOps.length + replaceOps.length > 0) {
                const removedNodes = removeOps.concat(replaceOps).map((op) => op.target);
                removeOps.push(...elide_imports_1.elideImports(sf, removedNodes, getTypeChecker));
            }
            const visitor = (node) => {
                let modified = false;
                let modifiedNodes = [node];
                // Check if node should be dropped.
                if (removeOps.find((op) => op.target === node)) {
                    modifiedNodes = [];
                    modified = true;
                }
                // Check if node should be replaced (only replaces with first op found).
                const replace = replaceOps.find((op) => op.target === node);
                if (replace) {
                    modifiedNodes = [replace.replacement];
                    modified = true;
                }
                // Check if node should be added to.
                const add = addOps.filter((op) => op.target === node);
                if (add.length > 0) {
                    modifiedNodes = [
                        ...add.filter((op) => op.before).map(((op) => op.before)),
                        ...modifiedNodes,
                        ...add.filter((op) => op.after).map(((op) => op.after)),
                    ];
                    modified = true;
                }
                // If we changed anything, return modified nodes without visiting further.
                if (modified) {
                    return modifiedNodes;
                }
                else {
                    // Otherwise return node as is and visit children.
                    return visitEachChild(node, visitor, context);
                }
            };
            // Don't visit the sourcefile at all if we don't have ops for it.
            if (ops.length === 0) {
                return sf;
            }
            const result = ts.visitNode(sf, visitor);
            // If we removed any decorators, we need to clean up the decorator arrays.
            if (removeOps.some((op) => op.target.kind === ts.SyntaxKind.Decorator)) {
                cleanupDecorators(result);
            }
            return result;
        };
        return transformer;
    };
}
exports.makeTransform = makeTransform;
/**
 * This is a version of `ts.visitEachChild` that works that calls our version
 * of `updateSourceFileNode`, so that typescript doesn't lose type information
 * for property decorators.
 * See https://github.com/Microsoft/TypeScript/issues/17384 (fixed by
 * https://github.com/Microsoft/TypeScript/pull/20314 and released in TS 2.7.0) and
 * https://github.com/Microsoft/TypeScript/issues/17551 (fixed by
 * https://github.com/Microsoft/TypeScript/pull/18051 and released on TS 2.5.0).
 */
function visitEachChildWorkaround(node, visitor, context) {
    if (node.kind === ts.SyntaxKind.SourceFile) {
        const sf = node;
        const statements = ts.visitLexicalEnvironment(sf.statements, visitor, context);
        if (statements === sf.statements) {
            return sf;
        }
        // Note: Need to clone the original file (and not use `ts.updateSourceFileNode`)
        // as otherwise TS fails when resolving types for decorators.
        const sfClone = ts.getMutableClone(sf);
        sfClone.statements = statements;
        return sfClone;
    }
    return ts.visitEachChild(node, visitor, context);
}
// 1) If TS sees an empty decorator array, it will still emit a `__decorate` call.
//    This seems to be a TS bug.
// 2) Also ensure nodes with modified decorators have parents
//    built in TS transformers assume certain nodes have parents (fixed in TS 2.7+)
function cleanupDecorators(node) {
    if (node.decorators) {
        if (node.decorators.length == 0) {
            node.decorators = undefined;
        }
        else if (node.parent == undefined) {
            const originalNode = ts.getParseTreeNode(node);
            node.parent = originalNode.parent;
        }
    }
    ts.forEachChild(node, node => cleanupDecorators(node));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFrZV90cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvdHJhbnNmb3JtZXJzL21ha2VfdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsaUNBQWlDO0FBQ2pDLG1EQUErQztBQUMvQyw2Q0FPc0I7QUFHdEIsNkNBQTZDO0FBQzdDLE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLE1BQU0sY0FBYyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDcEUsQ0FBQyxDQUFDLHdCQUF3QjtJQUMxQixDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQztBQUV0QixTQUFnQixhQUFhLENBQzNCLGlCQUFvQyxFQUNwQyxjQUFxQztJQUdyQyxPQUFPLENBQUMsT0FBaUMsRUFBaUMsRUFBRTtRQUMxRSxNQUFNLFdBQVcsR0FBa0MsQ0FBQyxFQUFpQixFQUFFLEVBQUU7WUFDdkUsTUFBTSxHQUFHLEdBQXlCLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sU0FBUyxHQUFHLEdBQUc7aUJBQ2xCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSywyQkFBYyxDQUFDLE1BQU0sQ0FBMEIsQ0FBQztZQUM5RSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLDJCQUFjLENBQUMsR0FBRyxDQUF1QixDQUFDO1lBQ3hGLE1BQU0s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SUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDL0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7U0FDN0I7YUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksU0FBUyxFQUFFO1lBQ25DLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7U0FDbkM7S0FDRjtJQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN6RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBlbGlkZUltcG9ydHMgfSBmcm9tICcuL2VsaWRlX2ltcG9ydHMnO1xuaW1wb3J0IHtcbiAgQWRkTm9kZU9wZXJhdGlvbixcbiAgT1BFUkFUSU9OX0tJTkQsXG4gIFJlbW92ZU5vZGVPcGVyYXRpb24sXG4gIFJlcGxhY2VOb2RlT3BlcmF0aW9uLFxuICBTdGFuZGFyZFRyYW5zZm9ybSxcbiAgVHJhbnNmb3JtT3BlcmF0aW9uLFxufSBmcm9tICcuL2ludGVyZmFjZXMnO1xuXG5cbi8vIFR5cGVzY3JpcHQgYmVsb3cgMi43LjAgbmVlZHMgYSB3b3JrYXJvdW5kLlxuY29uc3QgdHNWZXJzaW9uUGFydHMgPSB0cy52ZXJzaW9uLnNwbGl0KCcuJykubWFwKHAgPT4gTnVtYmVyKHApKTtcbmNvbnN0IHZpc2l0RWFjaENoaWxkID0gdHNWZXJzaW9uUGFydHNbMF0gPD0gMiAmJiB0c1ZlcnNpb25QYXJ0c1sxXSA8IDdcbiAgPyB2aXNpdEVhY2hDaGlsZFdvcmthcm91bmRcbiAgOiB0cy52aXNpdEVhY2hDaGlsZDtcblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VUcmFuc2Zvcm0oXG4gIHN0YW5kYXJkVHJhbnNmb3JtOiBTdGFuZGFyZFRyYW5zZm9ybSxcbiAgZ2V0VHlwZUNoZWNrZXI/OiAoKSA9PiB0cy5UeXBlQ2hlY2tlcixcbik6IHRzLlRyYW5zZm9ybWVyRmFjdG9yeTx0cy5Tb3VyY2VGaWxlPiB7XG5cbiAgcmV0dXJuIChjb250ZXh0OiB0cy5UcmFuc2Zvcm1hdGlvbkNvbnRleHQpOiB0cy5UcmFuc2Zvcm1lcjx0cy5Tb3VyY2VGaWxlPiA9PiB7XG4gICAgY29uc3QgdHJhbnNmb3JtZXI6IHRzLlRyYW5zZm9ybWVyPHRzLlNvdXJjZUZpbGU+ID0gKHNmOiB0cy5Tb3VyY2VGaWxlKSA9PiB7XG4gICAgICBjb25zdCBvcHM6IFRyYW5zZm9ybU9wZXJhdGlvbltdID0gc3RhbmRhcmRUcmFuc2Zvcm0oc2YpO1xuICAgICAgY29uc3QgcmVtb3ZlT3BzID0gb3BzXG4gICAgICAgIC5maWx0ZXIoKG9wKSA9PiBvcC5raW5kID09PSBPUEVSQVRJT05fS0lORC5SZW1vdmUpIGFzIFJlbW92ZU5vZGVPcGVyYXRpb25bXTtcbiAgICAgIGNvbnN0IGFkZE9wcyA9IG9wcy5maWx0ZXIoKG9wKSA9PiBvcC5raW5kID09PSBPUEVSQVRJT05fS0lORC5BZGQpIGFzIEFkZE5vZGVPcGVyYXRpb25bXTtcbiAgICAgIGNvbnN0IHJlcGxhY2VPcHMgPSBvcHNcbiAgICAgICAgLmZpbHRlcigob3ApID0+IG9wLmtpbmQgPT09IE9QRVJBVElPTl9LSU5ELlJlcGxhY2UpIGFzIFJlcGxhY2VOb2RlT3BlcmF0aW9uW107XG5cbiAgICAgIC8vIElmIG5vZGVzIGFyZSByZW1vdmVkLCBlbGlkZSB0aGUgaW1wb3J0cyBhcyB3ZWxsLlxuICAgICAgLy8gTWFpbmx5IGEgd29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xNzU1Mi5cbiAgICAgIC8vIFdBUk5JTkc6IHRoaXMgYXNzdW1lcyB0aGF0IHJlcGxhY2VPcHMgRE8gTk9UIHJldXNlIGFueSBvZiB0aGUgbm9kZXMgdGhleSBhcmUgcmVwbGFjaW5nLlxuICAgICAgLy8gVGhpcyBpcyBjdXJyZW50bHkgdHJ1ZSBmb3IgdHJhbnNmb3JtcyB0aGF0IHVzZSByZXBsYWNlT3BzIChyZXBsYWNlX2Jvb3RzdHJhcCBhbmRcbiAgICAgIC8vIHJlcGxhY2VfcmVzb3VyY2VzKSwgYnV0IG1heSBub3QgYmUgdHJ1ZSBmb3IgbmV3IHRyYW5zZm9ybXMuXG4gICAgICBpZiAoZ2V0VHlwZUNoZWNrZXIgJiYgcmVtb3ZlT3BzLmxlbmd0aCArIHJlcGxhY2VPcHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCByZW1vdmVkTm9kZXMgPSByZW1vdmVPcHMuY29uY2F0KHJlcGxhY2VPcHMpLm1hcCgob3ApID0+IG9wLnRhcmdldCk7XG4gICAgICAgIHJlbW92ZU9wcy5wdXNoKC4uLmVsaWRlSW1wb3J0cyhzZiwgcmVtb3ZlZE5vZGVzLCBnZXRUeXBlQ2hlY2tlcikpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2aXNpdG9yOiB0cy5WaXNpdG9yID0gKG5vZGUpID0+IHtcbiAgICAgICAgbGV0IG1vZGlmaWVkID0gZmFsc2U7XG4gICAgICAgIGxldCBtb2RpZmllZE5vZGVzID0gW25vZGVdO1xuICAgICAgICAvLyBDaGVjayBpZiBub2RlIHNob3VsZCBiZSBkcm9wcGVkLlxuICAgICAgICBpZiAocmVtb3ZlT3BzLmZpbmQoKG9wKSA9PiBvcC50YXJnZXQgPT09IG5vZGUpKSB7XG4gICAgICAgICAgbW9kaWZpZWROb2RlcyA9IFtdO1xuICAgICAgICAgIG1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGlmIG5vZGUgc2hvdWxkIGJlIHJlcGxhY2VkIChvbmx5IHJlcGxhY2VzIHdpdGggZmlyc3Qgb3AgZm91bmQpLlxuICAgICAgICBjb25zdCByZXBsYWNlID0gcmVwbGFjZU9wcy5maW5kKChvcCkgPT4gb3AudGFyZ2V0ID09PSBub2RlKTtcbiAgICAgICAgaWYgKHJlcGxhY2UpIHtcbiAgICAgICAgICBtb2RpZmllZE5vZGVzID0gW3JlcGxhY2UucmVwbGFjZW1lbnRdO1xuICAgICAgICAgIG1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGlmIG5vZGUgc2hvdWxkIGJlIGFkZGVkIHRvLlxuICAgICAgICBjb25zdCBhZGQgPSBhZGRPcHMuZmlsdGVyKChvcCkgPT4gb3AudGFyZ2V0ID09PSBub2RlKTtcbiAgICAgICAgaWYgKGFkZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbW9kaWZpZWROb2RlcyA9IFtcbiAgICAgICAgICAgIC4uLmFkZC5maWx0ZXIoKG9wKSA9PiBvcC5iZWZvcmUpLm1hcCgoKG9wKSA9PiBvcC5iZWZvcmUpKSxcbiAgICAgICAgICAgIC4uLm1vZGlmaWVkTm9kZXMsXG4gICAgICAgICAgICAuLi5hZGQuZmlsdGVyKChvcCkgPT4gb3AuYWZ0ZXIpLm1hcCgoKG9wKSA9PiBvcC5hZnRlcikpLFxuICAgICAgICAgIF0gYXMgdHMuTm9kZVtdO1xuICAgICAgICAgIG1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGNoYW5nZWQgYW55dGhpbmcsIHJldHVybiBtb2RpZmllZCBub2RlcyB3aXRob3V0IHZpc2l0aW5nIGZ1cnRoZXIuXG4gICAgICAgIGlmIChtb2RpZmllZCkge1xuICAgICAgICAgIHJldHVybiBtb2RpZmllZE5vZGVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE90aGVyd2lzZSByZXR1cm4gbm9kZSBhcyBpcyBhbmQgdmlzaXQgY2hpbGRyZW4uXG4gICAgICAgICAgcmV0dXJuIHZpc2l0RWFjaENoaWxkKG5vZGUsIHZpc2l0b3IsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBEb24ndCB2aXNpdCB0aGUgc291cmNlZmlsZSBhdCBhbGwgaWYgd2UgZG9uJ3QgaGF2ZSBvcHMgZm9yIGl0LlxuICAgICAgaWYgKG9wcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHNmO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSB0cy52aXNpdE5vZGUoc2YsIHZpc2l0b3IpO1xuXG4gICAgICAvLyBJZiB3ZSByZW1vdmVkIGFueSBkZWNvcmF0b3JzLCB3ZSBuZWVkIHRvIGNsZWFuIHVwIHRoZSBkZWNvcmF0b3IgYXJyYXlzLlxuICAgICAgaWYgKHJlbW92ZU9wcy5zb21lKChvcCkgPT4gb3AudGFyZ2V0LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRGVjb3JhdG9yKSkge1xuICAgICAgICBjbGVhbnVwRGVjb3JhdG9ycyhyZXN1bHQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICByZXR1cm4gdHJhbnNmb3JtZXI7XG4gIH07XG59XG5cbi8qKlxuICogVGhpcyBpcyBhIHZlcnNpb24gb2YgYHRzLnZpc2l0RWFjaENoaWxkYCB0aGF0IHdvcmtzIHRoYXQgY2FsbHMgb3VyIHZlcnNpb25cbiAqIG9mIGB1cGRhdGVTb3VyY2VGaWxlTm9kZWAsIHNvIHRoYXQgdHlwZXNjcmlwdCBkb2Vzbid0IGxvc2UgdHlwZSBpbmZvcm1hdGlvblxuICogZm9yIHByb3BlcnR5IGRlY29yYXRvcnMuXG4gKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xNzM4NCAoZml4ZWQgYnlcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9wdWxsLzIwMzE0IGFuZCByZWxlYXNlZCBpbiBUUyAyLjcuMCkgYW5kXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzE3NTUxIChmaXhlZCBieVxuICogaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L3B1bGwvMTgwNTEgYW5kIHJlbGVhc2VkIG9uIFRTIDIuNS4wKS5cbiAqL1xuZnVuY3Rpb24gdmlzaXRFYWNoQ2hpbGRXb3JrYXJvdW5kKFxuICBub2RlOiB0cy5Ob2RlLFxuICB2aXNpdG9yOiB0cy5WaXNpdG9yLFxuICBjb250ZXh0OiB0cy5UcmFuc2Zvcm1hdGlvbkNvbnRleHQsXG4pIHtcblxuICBpZiAobm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLlNvdXJjZUZpbGUpIHtcbiAgICBjb25zdCBzZiA9IG5vZGUgYXMgdHMuU291cmNlRmlsZTtcbiAgICBjb25zdCBzdGF0ZW1lbnRzID0gdHMudmlzaXRMZXhpY2FsRW52aXJvbm1lbnQoc2Yuc3RhdGVtZW50cywgdmlzaXRvciwgY29udGV4dCk7XG5cbiAgICBpZiAoc3RhdGVtZW50cyA9PT0gc2Yuc3RhdGVtZW50cykge1xuICAgICAgcmV0dXJuIHNmO1xuICAgIH1cbiAgICAvLyBOb3RlOiBOZWVkIHRvIGNsb25lIHRoZSBvcmlnaW5hbCBmaWxlIChhbmQgbm90IHVzZSBgdHMudXBkYXRlU291cmNlRmlsZU5vZGVgKVxuICAgIC8vIGFzIG90aGVyd2lzZSBUUyBmYWlscyB3aGVuIHJlc29sdmluZyB0eXBlcyBmb3IgZGVjb3JhdG9ycy5cbiAgICBjb25zdCBzZkNsb25lID0gdHMuZ2V0TXV0YWJsZUNsb25lKHNmKTtcbiAgICBzZkNsb25lLnN0YXRlbWVudHMgPSBzdGF0ZW1lbnRzO1xuXG4gICAgcmV0dXJuIHNmQ2xvbmU7XG4gIH1cblxuICByZXR1cm4gdHMudmlzaXRFYWNoQ2hpbGQobm9kZSwgdmlzaXRvciwgY29udGV4dCk7XG59XG5cblxuLy8gMSkgSWYgVFMgc2VlcyBhbiBlbXB0eSBkZWNvcmF0b3IgYXJyYXksIGl0IHdpbGwgc3RpbGwgZW1pdCBhIGBfX2RlY29yYXRlYCBjYWxsLlxuLy8gICAgVGhpcyBzZWVtcyB0byBiZSBhIFRTIGJ1Zy5cbi8vIDIpIEFsc28gZW5zdXJlIG5vZGVzIHdpdGggbW9kaWZpZWQgZGVjb3JhdG9ycyBoYXZlIHBhcmVudHNcbi8vICAgIGJ1aWx0IGluIFRTIHRyYW5zZm9ybWVycyBhc3N1bWUgY2VydGFpbiBub2RlcyBoYXZlIHBhcmVudHMgKGZpeGVkIGluIFRTIDIuNyspXG5mdW5jdGlvbiBjbGVhbnVwRGVjb3JhdG9ycyhub2RlOiB0cy5Ob2RlKSB7XG4gIGlmIChub2RlLmRlY29yYXRvcnMpIHtcbiAgICBpZiAobm9kZS5kZWNvcmF0b3JzLmxlbmd0aCA9PSAwKSB7XG4gICAgICBub2RlLmRlY29yYXRvcnMgPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIGlmIChub2RlLnBhcmVudCA9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG9yaWdpbmFsTm9kZSA9IHRzLmdldFBhcnNlVHJlZU5vZGUobm9kZSk7XG4gICAgICBub2RlLnBhcmVudCA9IG9yaWdpbmFsTm9kZS5wYXJlbnQ7XG4gICAgfVxuICB9XG5cbiAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIG5vZGUgPT4gY2xlYW51cERlY29yYXRvcnMobm9kZSkpO1xufVxuIl19