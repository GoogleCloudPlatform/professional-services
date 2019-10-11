"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const path = require("path");
const ts = require("typescript");
/**
 * Find all nodes from the AST in the subtree of node of SyntaxKind kind.
 * @param node The root node to check, or null if the whole tree should be searched.
 * @param sourceFile The source file where the node is.
 * @param kind The kind of nodes to find.
 * @param recursive Whether to go in matched nodes to keep matching.
 * @param max The maximum number of items to return.
 * @return all nodes of kind, or [] if none is found
 */
// TODO: replace this with collectDeepNodes and add limits to collectDeepNodes
function findAstNodes(node, sourceFile, kind, recursive = false, max = Infinity) {
    // TODO: refactor operations that only need `refactor.findAstNodes()` to use this instead.
    if (max == 0) {
        return [];
    }
    if (!node) {
        node = sourceFile;
    }
    const arr = [];
    if (node.kind === kind) {
        // If we're not recursively looking for children, stop here.
        if (!recursive) {
            return [node];
        }
        arr.push(node);
        max--;
    }
    if (max > 0) {
        for (const child of node.getChildren(sourceFile)) {
            findAstNodes(child, sourceFile, kind, recursive, max)
                .forEach((node) => {
                if (max > 0) {
                    arr.push(node);
                }
                max--;
            });
            if (max <= 0) {
                break;
            }
        }
    }
    return arr;
}
exports.findAstNodes = findAstNodes;
function resolve(filePath, _host, compilerOptions) {
    if (path.isAbsolute(filePath)) {
        return filePath;
    }
    const basePath = compilerOptions.baseUrl || compilerOptions.rootDir;
    if (!basePath) {
        throw new Error(`Trying to resolve '${filePath}' without a basePath.`);
    }
    return path.join(basePath, filePath);
}
exports.resolve = resolve;
class TypeScriptFileRefactor {
    get fileName() { return this._fileName; }
    get sourceFile() { return this._sourceFile; }
    constructor(fileName, _host, _program, source) {
        let sourceFile = null;
        if (_program) {
            fileName = resolve(fileName, _host, _program.getCompilerOptions()).replace(/\\/g, '/');
            this._fileName = fileName;
            if (source) {
                sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
            }
            else {
                sourceFile = _program.getSourceFile(fileName) || null;
            }
        }
        if (!sourceFile) {
            const maybeContent = source || _host.readFile(fileName);
            if (maybeContent) {
                sourceFile = ts.createSourceFile(fileName, maybeContent, ts.ScriptTarget.Latest, true);
            }
        }
        if (!sourceFile) {
            throw new Error('Must have a source file to refactor.');
        }
        this._sourceFile = sourceFile;
    }
    /**
     * Find all nodes from the AST in the subtree of node of SyntaxKind kind.
     * @param node The root node to check, or null if the whole tree should be searched.
     * @param kind The kind of nodes to find.
     * @param recursive Whether to go in matched nodes to keep matching.
     * @param max The maximum number of items to return.
     * @return all nodes of kind, or [] if none is found
     */
    findAstNodes(node, kind, recursive = false, max = Infinity) {
        return findAstNodes(node, this._sourceFile, kind, recursive, max);
    }
}
exports.TypeScriptFileRefactor = TypeScriptFileRefactor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmYWN0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvcmVmYWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCw2QkFBNkI7QUFDN0IsaUNBQWlDO0FBR2pDOzs7Ozs7OztHQVFHO0FBQ0gsOEVBQThFO0FBQzlFLFNBQWdCLFlBQVksQ0FDMUIsSUFBb0IsRUFDcEIsVUFBeUIsRUFDekIsSUFBbUIsRUFDbkIsU0FBUyxHQUFHLEtBQUssRUFDakIsR0FBRyxHQUFHLFFBQVE7SUFFZCwwRkFBMEY7SUFDMUYsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFO1FBQ1osT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDVCxJQUFJLEdBQUcsVUFBVSxDQUFDO0tBQ25CO0lBRUQsTUFBTSxHQUFHLEdBQVEsRUFBRSxDQUFDO0lBQ3BCLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7UUFDdEIsNERBQTREO1FBQzVELElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDZCxPQUFPLENBQUMsSUFBUyxDQUFDLENBQUM7U0FDcEI7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDLElBQVMsQ0FBQyxDQUFDO1FBQ3BCLEdBQUcsRUFBRSxDQUFDO0tBQ1A7SUFFRCxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUU7UUFDWCxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDaEQsWUFBWSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUM7aUJBQ2xELE9BQU8sQ0FBQyxDQUFDLElBQWEsRUFBRSxFQUFFO2dCQUN6QixJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUU7b0JBQ1gsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFTLENBQUMsQ0FBQztpQkFDckI7Z0JBQ0QsR0FBRyxFQUFFLENBQUM7WUFDUixDQUFDLENBQUMsQ0FBQztZQUVMLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRTtnQkFDWixNQUFNO2FBQ1A7U0FDRjtLQUNGO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBM0NELG9DQTJDQztBQUVELFNBQWdCLE9BQU8sQ0FDckIsUUFBZ0IsRUFDaEIsS0FBc0IsRUFDdEIsZUFBbUM7SUFFbkMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzdCLE9BQU8sUUFBUSxDQUFDO0tBQ2pCO0lBQ0QsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLE9BQU8sSUFBSSxlQUFlLENBQUMsT0FBTyxDQUFDO0lBQ3BFLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixRQUFRLHVCQUF1QixDQUFDLENBQUM7S0FDeEU7SUFFRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUFkRCwwQkFjQztBQUdELE1BQWEsc0JBQXNCO0lBSWpDLElBQUksUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDekMsSUFBSSxVQUFVLEtBQUssT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUU3QyxZQUFZLFFBQWdCLEVBQ2hCLEtBQXNCLEVBQ3RCLFFBQXFCLEVBQ3JCLE1BQXNCO1FBQ2hDLElBQUksVUFBVSxHQUF5QixJQUFJLENBQUM7UUFFNUMsSUFBSSxRQUFRLEVBQUU7WUFDWixRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBRTFCLElBQUksTUFBTSxFQUFFO2dCQUNWLFVBQVUsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNsRjtpQkFBTTtnQkFDTCxVQUFVLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUM7YUFDdkQ7U0FDRjtRQUNELElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDZixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxJQUFJLFlBQVksRUFBRTtnQkFDaEIsVUFBVSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FDOUIsUUFBUSxFQUNSLFlBQVksRUFDWixFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFDdEIsSUFBSSxDQUNMLENBQUM7YUFDSDtTQUNGO1FBQ0QsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQztTQUN6RDtRQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsWUFBWSxDQUFDLElBQW9CLEVBQ3BCLElBQW1CLEVBQ25CLFNBQVMsR0FBRyxLQUFLLEVBQ2pCLEdBQUcsR0FBRyxRQUFRO1FBQ3pCLE9BQU8sWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDcEUsQ0FBQztDQUVGO0FBeERELHdEQXdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuXG4vKipcbiAqIEZpbmQgYWxsIG5vZGVzIGZyb20gdGhlIEFTVCBpbiB0aGUgc3VidHJlZSBvZiBub2RlIG9mIFN5bnRheEtpbmQga2luZC5cbiAqIEBwYXJhbSBub2RlIFRoZSByb290IG5vZGUgdG8gY2hlY2ssIG9yIG51bGwgaWYgdGhlIHdob2xlIHRyZWUgc2hvdWxkIGJlIHNlYXJjaGVkLlxuICogQHBhcmFtIHNvdXJjZUZpbGUgVGhlIHNvdXJjZSBmaWxlIHdoZXJlIHRoZSBub2RlIGlzLlxuICogQHBhcmFtIGtpbmQgVGhlIGtpbmQgb2Ygbm9kZXMgdG8gZmluZC5cbiAqIEBwYXJhbSByZWN1cnNpdmUgV2hldGhlciB0byBnbyBpbiBtYXRjaGVkIG5vZGVzIHRvIGtlZXAgbWF0Y2hpbmcuXG4gKiBAcGFyYW0gbWF4IFRoZSBtYXhpbXVtIG51bWJlciBvZiBpdGVtcyB0byByZXR1cm4uXG4gKiBAcmV0dXJuIGFsbCBub2RlcyBvZiBraW5kLCBvciBbXSBpZiBub25lIGlzIGZvdW5kXG4gKi9cbi8vIFRPRE86IHJlcGxhY2UgdGhpcyB3aXRoIGNvbGxlY3REZWVwTm9kZXMgYW5kIGFkZCBsaW1pdHMgdG8gY29sbGVjdERlZXBOb2Rlc1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBc3ROb2RlczxUIGV4dGVuZHMgdHMuTm9kZT4oXG4gIG5vZGU6IHRzLk5vZGUgfCBudWxsLFxuICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLFxuICBraW5kOiB0cy5TeW50YXhLaW5kLFxuICByZWN1cnNpdmUgPSBmYWxzZSxcbiAgbWF4ID0gSW5maW5pdHksXG4pOiBUW10ge1xuICAvLyBUT0RPOiByZWZhY3RvciBvcGVyYXRpb25zIHRoYXQgb25seSBuZWVkIGByZWZhY3Rvci5maW5kQXN0Tm9kZXMoKWAgdG8gdXNlIHRoaXMgaW5zdGVhZC5cbiAgaWYgKG1heCA9PSAwKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGlmICghbm9kZSkge1xuICAgIG5vZGUgPSBzb3VyY2VGaWxlO1xuICB9XG5cbiAgY29uc3QgYXJyOiBUW10gPSBbXTtcbiAgaWYgKG5vZGUua2luZCA9PT0ga2luZCkge1xuICAgIC8vIElmIHdlJ3JlIG5vdCByZWN1cnNpdmVseSBsb29raW5nIGZvciBjaGlsZHJlbiwgc3RvcCBoZXJlLlxuICAgIGlmICghcmVjdXJzaXZlKSB7XG4gICAgICByZXR1cm4gW25vZGUgYXMgVF07XG4gICAgfVxuXG4gICAgYXJyLnB1c2gobm9kZSBhcyBUKTtcbiAgICBtYXgtLTtcbiAgfVxuXG4gIGlmIChtYXggPiAwKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmdldENoaWxkcmVuKHNvdXJjZUZpbGUpKSB7XG4gICAgICBmaW5kQXN0Tm9kZXMoY2hpbGQsIHNvdXJjZUZpbGUsIGtpbmQsIHJlY3Vyc2l2ZSwgbWF4KVxuICAgICAgICAuZm9yRWFjaCgobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgICAgIGlmIChtYXggPiAwKSB7XG4gICAgICAgICAgICBhcnIucHVzaChub2RlIGFzIFQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtYXgtLTtcbiAgICAgICAgfSk7XG5cbiAgICAgIGlmIChtYXggPD0gMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXJyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZShcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgX2hvc3Q6IHRzLkNvbXBpbGVySG9zdCxcbiAgY29tcGlsZXJPcHRpb25zOiB0cy5Db21waWxlck9wdGlvbnMsXG4pOiBzdHJpbmcge1xuICBpZiAocGF0aC5pc0Fic29sdXRlKGZpbGVQYXRoKSkge1xuICAgIHJldHVybiBmaWxlUGF0aDtcbiAgfVxuICBjb25zdCBiYXNlUGF0aCA9IGNvbXBpbGVyT3B0aW9ucy5iYXNlVXJsIHx8IGNvbXBpbGVyT3B0aW9ucy5yb290RGlyO1xuICBpZiAoIWJhc2VQYXRoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBUcnlpbmcgdG8gcmVzb2x2ZSAnJHtmaWxlUGF0aH0nIHdpdGhvdXQgYSBiYXNlUGF0aC5gKTtcbiAgfVxuXG4gIHJldHVybiBwYXRoLmpvaW4oYmFzZVBhdGgsIGZpbGVQYXRoKTtcbn1cblxuXG5leHBvcnQgY2xhc3MgVHlwZVNjcmlwdEZpbGVSZWZhY3RvciB7XG4gIHByaXZhdGUgX2ZpbGVOYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgX3NvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGU7XG5cbiAgZ2V0IGZpbGVOYW1lKCkgeyByZXR1cm4gdGhpcy5fZmlsZU5hbWU7IH1cbiAgZ2V0IHNvdXJjZUZpbGUoKSB7IHJldHVybiB0aGlzLl9zb3VyY2VGaWxlOyB9XG5cbiAgY29uc3RydWN0b3IoZmlsZU5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgX2hvc3Q6IHRzLkNvbXBpbGVySG9zdCxcbiAgICAgICAgICAgICAgX3Byb2dyYW0/OiB0cy5Qcm9ncmFtLFxuICAgICAgICAgICAgICBzb3VyY2U/OiBzdHJpbmcgfCBudWxsKSB7XG4gICAgbGV0IHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUgfCBudWxsID0gbnVsbDtcblxuICAgIGlmIChfcHJvZ3JhbSkge1xuICAgICAgZmlsZU5hbWUgPSByZXNvbHZlKGZpbGVOYW1lLCBfaG9zdCwgX3Byb2dyYW0uZ2V0Q29tcGlsZXJPcHRpb25zKCkpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgIHRoaXMuX2ZpbGVOYW1lID0gZmlsZU5hbWU7XG5cbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgc291cmNlRmlsZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUoZmlsZU5hbWUsIHNvdXJjZSwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3VyY2VGaWxlID0gX3Byb2dyYW0uZ2V0U291cmNlRmlsZShmaWxlTmFtZSkgfHwgbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFzb3VyY2VGaWxlKSB7XG4gICAgICBjb25zdCBtYXliZUNvbnRlbnQgPSBzb3VyY2UgfHwgX2hvc3QucmVhZEZpbGUoZmlsZU5hbWUpO1xuICAgICAgaWYgKG1heWJlQ29udGVudCkge1xuICAgICAgICBzb3VyY2VGaWxlID0gdHMuY3JlYXRlU291cmNlRmlsZShcbiAgICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgICBtYXliZUNvbnRlbnQsXG4gICAgICAgICAgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXNvdXJjZUZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTXVzdCBoYXZlIGEgc291cmNlIGZpbGUgdG8gcmVmYWN0b3IuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fc291cmNlRmlsZSA9IHNvdXJjZUZpbGU7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBhbGwgbm9kZXMgZnJvbSB0aGUgQVNUIGluIHRoZSBzdWJ0cmVlIG9mIG5vZGUgb2YgU3ludGF4S2luZCBraW5kLlxuICAgKiBAcGFyYW0gbm9kZSBUaGUgcm9vdCBub2RlIHRvIGNoZWNrLCBvciBudWxsIGlmIHRoZSB3aG9sZSB0cmVlIHNob3VsZCBiZSBzZWFyY2hlZC5cbiAgICogQHBhcmFtIGtpbmQgVGhlIGtpbmQgb2Ygbm9kZXMgdG8gZmluZC5cbiAgICogQHBhcmFtIHJlY3Vyc2l2ZSBXaGV0aGVyIHRvIGdvIGluIG1hdGNoZWQgbm9kZXMgdG8ga2VlcCBtYXRjaGluZy5cbiAgICogQHBhcmFtIG1heCBUaGUgbWF4aW11bSBudW1iZXIgb2YgaXRlbXMgdG8gcmV0dXJuLlxuICAgKiBAcmV0dXJuIGFsbCBub2RlcyBvZiBraW5kLCBvciBbXSBpZiBub25lIGlzIGZvdW5kXG4gICAqL1xuICBmaW5kQXN0Tm9kZXMobm9kZTogdHMuTm9kZSB8IG51bGwsXG4gICAgICAgICAgICAgICBraW5kOiB0cy5TeW50YXhLaW5kLFxuICAgICAgICAgICAgICAgcmVjdXJzaXZlID0gZmFsc2UsXG4gICAgICAgICAgICAgICBtYXggPSBJbmZpbml0eSk6IHRzLk5vZGVbXSB7XG4gICAgcmV0dXJuIGZpbmRBc3ROb2Rlcyhub2RlLCB0aGlzLl9zb3VyY2VGaWxlLCBraW5kLCByZWN1cnNpdmUsIG1heCk7XG4gIH1cblxufVxuIl19