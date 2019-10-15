(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/utils", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ts = require("typescript");
    function getOriginalSymbol(checker) {
        return function (symbol) {
            return ts.SymbolFlags.Alias & symbol.flags ? checker.getAliasedSymbol(symbol) : symbol;
        };
    }
    exports.getOriginalSymbol = getOriginalSymbol;
    function isDefined(value) {
        return (value !== undefined) && (value !== null);
    }
    exports.isDefined = isDefined;
    function getNameText(name) {
        return ts.isIdentifier(name) || ts.isLiteralExpression(name) ? name.text : name.getText();
    }
    exports.getNameText = getNameText;
    /**
     * Parse down the AST and capture all the nodes that satisfy the test.
     * @param node The start node.
     * @param test The function that tests whether a node should be included.
     * @returns a collection of nodes that satisfy the test.
     */
    function findAll(node, test) {
        var nodes = [];
        findAllVisitor(node);
        return nodes;
        function findAllVisitor(n) {
            if (test(n)) {
                nodes.push(n);
            }
            else {
                n.forEachChild(function (child) { return findAllVisitor(child); });
            }
        }
    }
    exports.findAll = findAll;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25nY2Mvc3JjL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gsK0JBQWlDO0lBRWpDLFNBQWdCLGlCQUFpQixDQUFDLE9BQXVCO1FBQ3ZELE9BQU8sVUFBUyxNQUFpQjtZQUMvQixPQUFPLEVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3pGLENBQUMsQ0FBQztJQUNKLENBQUM7SUFKRCw4Q0FJQztJQUVELFNBQWdCLFNBQVMsQ0FBSSxLQUEyQjtRQUN0RCxPQUFPLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFGRCw4QkFFQztJQUVELFNBQWdCLFdBQVcsQ0FBQyxJQUFzQztRQUNoRSxPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDNUYsQ0FBQztJQUZELGtDQUVDO0lBRUQ7Ozs7O09BS0c7SUFDSCxTQUFnQixPQUFPLENBQUksSUFBYSxFQUFFLElBQTRDO1FBQ3BGLElBQU0sS0FBSyxHQUFRLEVBQUUsQ0FBQztRQUN0QixjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckIsT0FBTyxLQUFLLENBQUM7UUFFYixTQUFTLGNBQWMsQ0FBQyxDQUFVO1lBQ2hDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNYLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDZjtpQkFBTTtnQkFDTCxDQUFDLENBQUMsWUFBWSxDQUFDLFVBQUEsS0FBSyxJQUFJLE9BQUEsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFyQixDQUFxQixDQUFDLENBQUM7YUFDaEQ7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQVpELDBCQVlDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcmlnaW5hbFN5bWJvbChjaGVja2VyOiB0cy5UeXBlQ2hlY2tlcik6IChzeW1ib2w6IHRzLlN5bWJvbCkgPT4gdHMuU3ltYm9sIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHN5bWJvbDogdHMuU3ltYm9sKSB7XG4gICAgcmV0dXJuIHRzLlN5bWJvbEZsYWdzLkFsaWFzICYgc3ltYm9sLmZsYWdzID8gY2hlY2tlci5nZXRBbGlhc2VkU3ltYm9sKHN5bWJvbCkgOiBzeW1ib2w7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RlZmluZWQ8VD4odmFsdWU6IFQgfCB1bmRlZmluZWQgfCBudWxsKTogdmFsdWUgaXMgVCB7XG4gIHJldHVybiAodmFsdWUgIT09IHVuZGVmaW5lZCkgJiYgKHZhbHVlICE9PSBudWxsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWVUZXh0KG5hbWU6IHRzLlByb3BlcnR5TmFtZSB8IHRzLkJpbmRpbmdOYW1lKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRzLmlzSWRlbnRpZmllcihuYW1lKSB8fCB0cy5pc0xpdGVyYWxFeHByZXNzaW9uKG5hbWUpID8gbmFtZS50ZXh0IDogbmFtZS5nZXRUZXh0KCk7XG59XG5cbi8qKlxuICogUGFyc2UgZG93biB0aGUgQVNUIGFuZCBjYXB0dXJlIGFsbCB0aGUgbm9kZXMgdGhhdCBzYXRpc2Z5IHRoZSB0ZXN0LlxuICogQHBhcmFtIG5vZGUgVGhlIHN0YXJ0IG5vZGUuXG4gKiBAcGFyYW0gdGVzdCBUaGUgZnVuY3Rpb24gdGhhdCB0ZXN0cyB3aGV0aGVyIGEgbm9kZSBzaG91bGQgYmUgaW5jbHVkZWQuXG4gKiBAcmV0dXJucyBhIGNvbGxlY3Rpb24gb2Ygbm9kZXMgdGhhdCBzYXRpc2Z5IHRoZSB0ZXN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEFsbDxUPihub2RlOiB0cy5Ob2RlLCB0ZXN0OiAobm9kZTogdHMuTm9kZSkgPT4gbm9kZSBpcyB0cy5Ob2RlICYgVCk6IFRbXSB7XG4gIGNvbnN0IG5vZGVzOiBUW10gPSBbXTtcbiAgZmluZEFsbFZpc2l0b3Iobm9kZSk7XG4gIHJldHVybiBub2RlcztcblxuICBmdW5jdGlvbiBmaW5kQWxsVmlzaXRvcihuOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRlc3QobikpIHtcbiAgICAgIG5vZGVzLnB1c2gobik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG4uZm9yRWFjaENoaWxkKGNoaWxkID0+IGZpbmRBbGxWaXNpdG9yKGNoaWxkKSk7XG4gICAgfVxuICB9XG59XG4iXX0=