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
        define("@angular/compiler-cli/src/ngtsc/util/src/visitor", ["require", "exports", "tslib", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    /**
     * Visit a node with the given visitor and return a transformed copy.
     */
    function visit(node, visitor, context) {
        return visitor._visit(node, context);
    }
    exports.visit = visit;
    /**
     * Abstract base class for visitors, which processes certain nodes specially to allow insertion
     * of other nodes before them.
     */
    var Visitor = /** @class */ (function () {
        function Visitor() {
            /**
             * Maps statements to an array of statements that should be inserted before them.
             */
            this._before = new Map();
            /**
             * Maps statements to an array of statements that should be inserted after them.
             */
            this._after = new Map();
        }
        /**
         * Visit a class declaration, returning at least the transformed declaration and optionally other
         * nodes to insert before the declaration.
         */
        Visitor.prototype.visitClassDeclaration = function (node) {
            return { node: node };
        };
        Visitor.prototype._visitListEntryNode = function (node, visitor) {
            var result = visitor(node);
            if (result.before !== undefined) {
                // Record that some nodes should be inserted before the given declaration. The declaration's
                // parent's _visit call is responsible for performing this insertion.
                this._before.set(result.node, result.before);
            }
            if (result.after !== undefined) {
                // Same with nodes that should be inserted after.
                this._after.set(result.node, result.after);
            }
            return result.node;
        };
        /**
         * Visit types of nodes which don't have their own explicit visitor.
         */
        Visitor.prototype.visitOtherNode = function (node) { return node; };
        /**
         * @internal
         */
        Visitor.prototype._visit = function (node, context) {
            var _this = this;
            // First, visit the node. visitedNode starts off as `null` but should be set after visiting
            // is completed.
            var visitedNode = null;
            node = ts.visitEachChild(node, function (child) { return _this._visit(child, context); }, context);
            if (ts.isClassDeclaration(node)) {
                visitedNode = this._visitListEntryNode(node, function (node) { return _this.visitClassDeclaration(node); });
            }
            else {
                visitedNode = this.visitOtherNode(node);
            }
            // If the visited node has a `statements` array then process them, maybe replacing the visited
            // node and adding additional statements.
            if (hasStatements(visitedNode)) {
                visitedNode = this._maybeProcessStatements(visitedNode);
            }
            return visitedNode;
        };
        Visitor.prototype._maybeProcessStatements = function (node) {
            var _this = this;
            // Shortcut - if every statement doesn't require nodes to be prepended or appended,
            // this is a no-op.
            if (node.statements.every(function (stmt) { return !_this._before.has(stmt) && !_this._after.has(stmt); })) {
                return node;
            }
            // There are statements to prepend, so clone the original node.
            var clone = ts.getMutableClone(node);
            // Build a new list of statements and patch it onto the clone.
            var newStatements = [];
            clone.statements.forEach(function (stmt) {
                if (_this._before.has(stmt)) {
                    newStatements.push.apply(newStatements, tslib_1.__spread(_this._before.get(stmt)));
                    _this._before.delete(stmt);
                }
                newStatements.push(stmt);
                if (_this._after.has(stmt)) {
                    newStatements.push.apply(newStatements, tslib_1.__spread(_this._after.get(stmt)));
                    _this._after.delete(stmt);
                }
            });
            clone.statements = ts.createNodeArray(newStatements, node.statements.hasTrailingComma);
            return clone;
        };
        return Visitor;
    }());
    exports.Visitor = Visitor;
    function hasStatements(node) {
        var block = node;
        return block.statements !== undefined && Array.isArray(block.statements);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvdXRpbC9zcmMvdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCwrQkFBaUM7SUFZakM7O09BRUc7SUFDSCxTQUFnQixLQUFLLENBQ2pCLElBQU8sRUFBRSxPQUFnQixFQUFFLE9BQWlDO1FBQzlELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUhELHNCQUdDO0lBRUQ7OztPQUdHO0lBQ0g7UUFBQTtZQUNFOztlQUVHO1lBQ0ssWUFBTyxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1lBRXJEOztlQUVHO1lBQ0ssV0FBTSxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1FBb0Z0RCxDQUFDO1FBbEZDOzs7V0FHRztRQUNILHVDQUFxQixHQUFyQixVQUFzQixJQUF5QjtZQUU3QyxPQUFPLEVBQUMsSUFBSSxNQUFBLEVBQUMsQ0FBQztRQUNoQixDQUFDO1FBRU8scUNBQW1CLEdBQTNCLFVBQ0ksSUFBTyxFQUFFLE9BQTJEO1lBQ3RFLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QixJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO2dCQUMvQiw0RkFBNEY7Z0JBQzVGLHFFQUFxRTtnQkFDckUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDOUM7WUFDRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO2dCQUM5QixpREFBaUQ7Z0JBQ2pELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0s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QUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFDSCxjQUFDO0lBQUQsQ0FBQyxBQTdGRCxJQTZGQztJQTdGcUIsMEJBQU87SUErRjdCLFNBQVMsYUFBYSxDQUFDLElBQWE7UUFDbEMsSUFBTSxLQUFLLEdBQUcsSUFBeUIsQ0FBQztRQUN4QyxPQUFPLEtBQUssQ0FBQyxVQUFVLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzNFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKipcbiAqIFJlc3VsdCB0eXBlIG9mIHZpc2l0aW5nIGEgbm9kZSB0aGF0J3MgdHlwaWNhbGx5IGFuIGVudHJ5IGluIGEgbGlzdCwgd2hpY2ggYWxsb3dzIHNwZWNpZnlpbmcgdGhhdFxuICogbm9kZXMgc2hvdWxkIGJlIGFkZGVkIGJlZm9yZSB0aGUgdmlzaXRlZCBub2RlIGluIHRoZSBvdXRwdXQuXG4gKi9cbmV4cG9ydCB0eXBlIFZpc2l0TGlzdEVudHJ5UmVzdWx0PEIgZXh0ZW5kcyB0cy5Ob2RlLCBUIGV4dGVuZHMgQj4gPSB7XG4gIG5vZGU6IFQsXG4gIGJlZm9yZT86IEJbXSxcbiAgYWZ0ZXI/OiBCW10sXG59O1xuXG4vKipcbiAqIFZpc2l0IGEgbm9kZSB3aXRoIHRoZSBnaXZlbiB2aXNpdG9yIGFuZCByZXR1cm4gYSB0cmFuc2Zvcm1lZCBjb3B5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdmlzaXQ8VCBleHRlbmRzIHRzLk5vZGU+KFxuICAgIG5vZGU6IFQsIHZpc2l0b3I6IFZpc2l0b3IsIGNvbnRleHQ6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCk6IFQge1xuICByZXR1cm4gdmlzaXRvci5fdmlzaXQobm9kZSwgY29udGV4dCk7XG59XG5cbi8qKlxuICogQWJzdHJhY3QgYmFzZSBjbGFzcyBmb3IgdmlzaXRvcnMsIHdoaWNoIHByb2Nlc3NlcyBjZXJ0YWluIG5vZGVzIHNwZWNpYWxseSB0byBhbGxvdyBpbnNlcnRpb25cbiAqIG9mIG90aGVyIG5vZGVzIGJlZm9yZSB0aGVtLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVmlzaXRvciB7XG4gIC8qKlxuICAgKiBNYXBzIHN0YXRlbWVudHMgdG8gYW4gYXJyYXkgb2Ygc3RhdGVtZW50cyB0aGF0IHNob3VsZCBiZSBpbnNlcnRlZCBiZWZvcmUgdGhlbS5cbiAgICovXG4gIHByaXZhdGUgX2JlZm9yZSA9IG5ldyBNYXA8dHMuTm9kZSwgdHMuU3RhdGVtZW50W10+KCk7XG5cbiAgLyoqXG4gICAqIE1hcHMgc3RhdGVtZW50cyB0byBhbiBhcnJheSBvZiBzdGF0ZW1lbnRzIHRoYXQgc2hvdWxkIGJlIGluc2VydGVkIGFmdGVyIHRoZW0uXG4gICAqL1xuICBwcml2YXRlIF9hZnRlciA9IG5ldyBNYXA8dHMuTm9kZSwgdHMuU3RhdGVtZW50W10+KCk7XG5cbiAgLyoqXG4gICAqIFZpc2l0IGEgY2xhc3MgZGVjbGFyYXRpb24sIHJldHVybmluZyBhdCBsZWFzdCB0aGUgdHJhbnNmb3JtZWQgZGVjbGFyYXRpb24gYW5kIG9wdGlvbmFsbHkgb3RoZXJcbiAgICogbm9kZXMgdG8gaW5zZXJ0IGJlZm9yZSB0aGUgZGVjbGFyYXRpb24uXG4gICAqL1xuICB2aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6XG4gICAgICBWaXNpdExpc3RFbnRyeVJlc3VsdDx0cy5TdGF0ZW1lbnQsIHRzLkNsYXNzRGVjbGFyYXRpb24+IHtcbiAgICByZXR1cm4ge25vZGV9O1xuICB9XG5cbiAgcHJpdmF0ZSBfdmlzaXRMaXN0RW50cnlOb2RlPFQgZXh0ZW5kcyB0cy5TdGF0ZW1lbnQ+KFxuICAgICAgbm9kZTogVCwgdmlzaXRvcjogKG5vZGU6IFQpID0+IFZpc2l0TGlzdEVudHJ5UmVzdWx0PHRzLlN0YXRlbWVudCwgVD4pOiBUIHtcbiAgICBjb25zdCByZXN1bHQgPSB2aXNpdG9yKG5vZGUpO1xuICAgIGlmIChyZXN1bHQuYmVmb3JlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFJlY29yZCB0aGF0IHNvbWUgbm9kZXMgc2hvdWxkIGJlIGluc2VydGVkIGJlZm9yZSB0aGUgZ2l2ZW4gZGVjbGFyYXRpb24uIFRoZSBkZWNsYXJhdGlvbidzXG4gICAgICAvLyBwYXJlbnQncyBfdmlzaXQgY2FsbCBpcyByZXNwb25zaWJsZSBmb3IgcGVyZm9ybWluZyB0aGlzIGluc2VydGlvbi5cbiAgICAgIHRoaXMuX2JlZm9yZS5zZXQocmVzdWx0Lm5vZGUsIHJlc3VsdC5iZWZvcmUpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LmFmdGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFNhbWUgd2l0aCBub2RlcyB0aGF0IHNob3VsZCBiZSBpbnNlcnRlZCBhZnRlci5cbiAgICAgIHRoaXMuX2FmdGVyLnNldChyZXN1bHQubm9kZSwgcmVzdWx0LmFmdGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5ub2RlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZpc2l0IHR5cGVzIG9mIG5vZGVzIHdoaWNoIGRvbid0IGhhdmUgdGhlaXIgb3duIGV4cGxpY2l0IHZpc2l0b3IuXG4gICAqL1xuICB2aXNpdE90aGVyTm9kZTxUIGV4dGVuZHMgdHMuTm9kZT4obm9kZTogVCk6IFQgeyByZXR1cm4gbm9kZTsgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF92aXNpdDxUIGV4dGVuZHMgdHMuTm9kZT4obm9kZTogVCwgY29udGV4dDogdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0KTogVCB7XG4gICAgLy8gRmlyc3QsIHZpc2l0IHRoZSBub2RlLiB2aXNpdGVkTm9kZSBzdGFydHMgb2ZmIGFzIGBudWxsYCBidXQgc2hvdWxkIGJlIHNldCBhZnRlciB2aXNpdGluZ1xuICAgIC8vIGlzIGNvbXBsZXRlZC5cbiAgICBsZXQgdmlzaXRlZE5vZGU6IFR8bnVsbCA9IG51bGw7XG5cbiAgICBub2RlID0gdHMudmlzaXRFYWNoQ2hpbGQobm9kZSwgY2hpbGQgPT4gdGhpcy5fdmlzaXQoY2hpbGQsIGNvbnRleHQpLCBjb250ZXh0KSBhcyBUO1xuXG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgdmlzaXRlZE5vZGUgPSB0aGlzLl92aXNpdExpc3RFbnRyeU5vZGUoXG4gICAgICAgICAgbm9kZSwgKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pID0+IHRoaXMudmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpKSBhcyB0eXBlb2Ygbm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmlzaXRlZE5vZGUgPSB0aGlzLnZpc2l0T3RoZXJOb2RlKG5vZGUpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSB2aXNpdGVkIG5vZGUgaGFzIGEgYHN0YXRlbWVudHNgIGFycmF5IHRoZW4gcHJvY2VzcyB0aGVtLCBtYXliZSByZXBsYWNpbmcgdGhlIHZpc2l0ZWRcbiAgICAvLyBub2RlIGFuZCBhZGRpbmcgYWRkaXRpb25hbCBzdGF0ZW1lbnRzLlxuICAgIGlmIChoYXNTdGF0ZW1lbnRzKHZpc2l0ZWROb2RlKSkge1xuICAgICAgdmlzaXRlZE5vZGUgPSB0aGlzLl9tYXliZVByb2Nlc3NTdGF0ZW1lbnRzKHZpc2l0ZWROb2RlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmlzaXRlZE5vZGU7XG4gIH1cblxuICBwcml2YXRlIF9tYXliZVByb2Nlc3NTdGF0ZW1lbnRzPFQgZXh0ZW5kcyB0cy5Ob2RlJntzdGF0ZW1lbnRzOiB0cy5Ob2RlQXJyYXk8dHMuU3RhdGVtZW50Pn0+KFxuICAgICAgbm9kZTogVCk6IFQge1xuICAgIC8vIFNob3J0Y3V0IC0gaWYgZXZlcnkgc3RhdGVtZW50IGRvZXNuJ3QgcmVxdWlyZSBub2RlcyB0byBiZSBwcmVwZW5kZWQgb3IgYXBwZW5kZWQsXG4gICAgLy8gdGhpcyBpcyBhIG5vLW9wLlxuICAgIGlmIChub2RlLnN0YXRlbWVudHMuZXZlcnkoc3RtdCA9PiAhdGhpcy5fYmVmb3JlLmhhcyhzdG10KSAmJiAhdGhpcy5fYWZ0ZXIuaGFzKHN0bXQpKSkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgLy8gVGhlcmUgYXJlIHN0YXRlbWVudHMgdG8gcHJlcGVuZCwgc28gY2xvbmUgdGhlIG9yaWdpbmFsIG5vZGUuXG4gICAgY29uc3QgY2xvbmUgPSB0cy5nZXRNdXRhYmxlQ2xvbmUobm9kZSk7XG5cbiAgICAvLyBCdWlsZCBhIG5ldyBsaXN0IG9mIHN0YXRlbWVudHMgYW5kIHBhdGNoIGl0IG9udG8gdGhlIGNsb25lLlxuICAgIGNvbnN0IG5ld1N0YXRlbWVudHM6IHRzLlN0YXRlbWVudFtdID0gW107XG4gICAgY2xvbmUuc3RhdGVtZW50cy5mb3JFYWNoKHN0bXQgPT4ge1xuICAgICAgaWYgKHRoaXMuX2JlZm9yZS5oYXMoc3RtdCkpIHtcbiAgICAgICAgbmV3U3RhdGVtZW50cy5wdXNoKC4uLih0aGlzLl9iZWZvcmUuZ2V0KHN0bXQpICFhcyB0cy5TdGF0ZW1lbnRbXSkpO1xuICAgICAgICB0aGlzLl9iZWZvcmUuZGVsZXRlKHN0bXQpO1xuICAgICAgfVxuICAgICAgbmV3U3RhdGVtZW50cy5wdXNoKHN0bXQpO1xuICAgICAgaWYgKHRoaXMuX2FmdGVyLmhhcyhzdG10KSkge1xuICAgICAgICBuZXdTdGF0ZW1lbnRzLnB1c2goLi4uKHRoaXMuX2FmdGVyLmdldChzdG10KSAhYXMgdHMuU3RhdGVtZW50W10pKTtcbiAgICAgICAgdGhpcy5fYWZ0ZXIuZGVsZXRlKHN0bXQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNsb25lLnN0YXRlbWVudHMgPSB0cy5jcmVhdGVOb2RlQXJyYXkobmV3U3RhdGVtZW50cywgbm9kZS5zdGF0ZW1lbnRzLmhhc1RyYWlsaW5nQ29tbWEpO1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYXNTdGF0ZW1lbnRzKG5vZGU6IHRzLk5vZGUpOiBub2RlIGlzIHRzLk5vZGUme3N0YXRlbWVudHM6IHRzLk5vZGVBcnJheTx0cy5TdGF0ZW1lbnQ+fSB7XG4gIGNvbnN0IGJsb2NrID0gbm9kZSBhc3tzdGF0ZW1lbnRzPzogYW55fTtcbiAgcmV0dXJuIGJsb2NrLnN0YXRlbWVudHMgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KGJsb2NrLnN0YXRlbWVudHMpO1xufVxuIl19