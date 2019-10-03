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
        define("@angular/compiler-cli/src/ngcc/src/packages/dependency_resolver", ["require", "exports", "tslib", "dependency-graph"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var dependency_graph_1 = require("dependency-graph");
    /**
     * A class that resolves dependencies between entry-points.
     */
    var DependencyResolver = /** @class */ (function () {
        function DependencyResolver(host) {
            this.host = host;
        }
        /**
         * Sort the array of entry points so that the dependant entry points always come later than
         * their dependencies in the array.
         * @param entryPoints An array entry points to sort.
         * @returns the result of sorting the entry points.
         */
        DependencyResolver.prototype.sortEntryPointsByDependency = function (entryPoints) {
            var _this = this;
            var invalidEntryPoints = [];
            var ignoredDependencies = [];
            var graph = new dependency_graph_1.DepGraph();
            // Add the entry ponts to the graph as nodes
            entryPoints.forEach(function (entryPoint) { return graph.addNode(entryPoint.path, entryPoint); });
            // Now add the dependencies between them
            entryPoints.forEach(function (entryPoint) {
                var entryPointPath = entryPoint.esm2015;
                if (!entryPointPath) {
                    throw new Error("Esm2015 format missing in '" + entryPoint.path + "' entry-point.");
                }
                var dependencies = new Set();
                var missing = new Set();
                _this.host.computeDependencies(entryPointPath, dependencies, missing);
                if (missing.size > 0) {
                    // This entry point has dependencies that are missing
                    // so remove it from the graph.
                    removeNodes(entryPoint, Array.from(missing));
                }
                else {
                    dependencies.forEach(function (dependencyPath) {
                        if (graph.hasNode(dependencyPath)) {
                            // The dependency path maps to an entry point that exists in the graph
                            // so add the dependency.
                            graph.addDependency(entryPoint.path, dependencyPath);
                        }
                        else if (invalidEntryPoints.some(function (i) { return i.entryPoint.path === dependencyPath; })) {
                            // The dependency path maps to an entry-point that was previously removed
                            // from the graph, so remove this entry-point as well.
                            removeNodes(entryPoint, [dependencyPath]);
                        }
                        else {
                            // The dependency path points to a package that ngcc does not care about.
                            ignoredDependencies.push({ entryPoint: entryPoint, dependencyPath: dependencyPath });
                        }
                    });
                }
            });
            // The map now only holds entry-points that ngcc cares about and whose dependencies
            // (direct and transitive) all exist.
            return {
                entryPoints: graph.overallOrder().map(function (path) { return graph.getNodeData(path); }),
                invalidEntryPoints: invalidEntryPoints,
                ignoredDependencies: ignoredDependencies
            };
            function removeNodes(entryPoint, missingDependencies) {
                var nodesToRemove = tslib_1.__spread([entryPoint.path], graph.dependantsOf(entryPoint.path));
                nodesToRemove.forEach(function (node) {
                    invalidEntryPoints.push({ entryPoint: graph.getNodeData(node), missingDependencies: missingDependencies });
                    graph.removeNode(node);
                });
            }
        };
        return DependencyResolver;
    }());
    exports.DependencyResolver = DependencyResolver;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwZW5kZW5jeV9yZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmdjYy9zcmMvcGFja2FnZXMvZGVwZW5kZW5jeV9yZXNvbHZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxxREFBMEM7SUFvRDFDOztPQUVHO0lBQ0g7UUFDRSw0QkFBb0IsSUFBb0I7WUFBcEIsU0FBSSxHQUFKLElBQUksQ0FBZ0I7UUFBRyxDQUFDO1FBQzVDOzs7OztXQUtHO1FBQ0gsd0RBQTJCLEdBQTNCLFVBQTRCLFdBQXlCO1lBQXJELGlCQXdEQztZQXZEQyxJQUFNLGtCQUFrQixHQUF3QixFQUFFLENBQUM7WUFDbkQsSUFBTSxtQkFBbUIsR0FBd0IsRUFBRSxDQUFDO1lBQ3BELElBQU0sS0FBSyxHQUFHLElBQUksMkJBQVEsRUFBYyxDQUFDO1lBRXpDLDRDQUE0QztZQUM1QyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsVUFBVSxJQUFJLE9BQUEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUExQyxDQUEwQyxDQUFDLENBQUM7WUFFOUUsd0NBQXdDO1lBQ3hDLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBQSxVQUFVO2dCQUM1QixJQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDO2dCQUMxQyxJQUFJLENBQUMsY0FBYyxFQUFFO29CQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUE4QixVQUFVLENBQUMsSUFBSSxtQkFBZ0IsQ0FBQyxDQUFDO2lCQUNoRjtnQkFFRCxJQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO2dCQUN2QyxJQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO2dCQUNsQyxLQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGNBQWMsRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRXJFLElBQUksT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUU7b0JBQ3BCLHFEQUFxRDtvQkFDckQsK0JBQStCO29CQUMvQixXQUFXLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDOUM7cUJBQU07b0JBQ0wsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFBLGNBQWM7d0JBQ2pDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBRTs0QkFDakMsc0VBQXNFOzRCQUN0RSx5QkFBeUI7NEJBQ3pCLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQzt5QkFDdEQ7NkJBQU0sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxjQUFjLEVBQXBDLENBQW9DLENBQUMsRUFBRTs0QkFDN0UseUVBQXlFOzRCQUN6RSxzREFBc0Q7NEJBQ3RELFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO3lCQUMzQzs2QkFBTTs0QkFDTCx5RUFBeUU7NEJBQ3pFLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsWUFBQSxFQUFFLGNBQWMsZ0JBQUEsRUFBQyxDQUFDLENBQUM7eUJBQ3hEO29CQUNILENBQUMsQ0FBQyxDQUFDO2lCQUNKO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxtRkFBbUY7WUFDbkYscUNBQXFDO1lBQ3JDLE9BQU87Z0JBQ0wsV0FBVyxFQUFFLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUF2QixDQUF1QixDQUFDO2dCQUN0RSxrQkFBa0Isb0JBQUE7Z0JBQ2xCLG1CQUFtQixxQkFBQTthQUNwQixDQUFDO1lBRUYsU0FBUyxXQUFXLENBQUMsVUFBc0IsRUFBRSxtQkFBNkI7Z0JBQ3hFLElBQU0sYUFBYSxxQkFBSSxVQUFVLENBQUMsSUFBSSxHQUFLLEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hGLGFBQWEsQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJO29CQUN4QixrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxtQkFBbUIscUJBQUEsRUFBQyxDQUFDLENBQUM7b0JBQ3BGLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztRQUNILENBQUM7UUFDSCx5QkFBQztJQUFELENBQUMsQUFqRUQsSUFpRUM7SUFqRVksZ0RBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RlcEdyYXBofSBmcm9tICdkZXBlbmRlbmN5LWdyYXBoJztcbmltcG9ydCB7RGVwZW5kZW5jeUhvc3R9IGZyb20gJy4vZGVwZW5kZW5jeV9ob3N0JztcbmltcG9ydCB7RW50cnlQb2ludH0gZnJvbSAnLi9lbnRyeV9wb2ludCc7XG5cblxuLyoqXG4gKiBIb2xkcyBpbmZvcm1hdGlvbiBhYm91dCBlbnRyeSBwb2ludHMgdGhhdCBhcmUgcmVtb3ZlZCBiZWNhdXNlXG4gKiB0aGV5IGhhdmUgZGVwZW5kZW5jaWVzIHRoYXQgYXJlIG1pc3NpbmcgKGRpcmVjdGx5IG9yIHRyYW5zaXRpdmVseSkuXG4gKlxuICogVGhpcyBtaWdodCBub3QgYmUgYW4gZXJyb3IsIGJlY2F1c2Ugc3VjaCBhbiBlbnRyeSBwb2ludCBtaWdodCBub3QgYWN0dWFsbHkgYmUgdXNlZFxuICogaW4gdGhlIGFwcGxpY2F0aW9uLiBJZiBpdCBpcyB1c2VkIHRoZW4gdGhlIGBuZ2NgIGFwcGxpY2F0aW9uIGNvbXBpbGF0aW9uIHdvdWxkXG4gKiBmYWlsIGFsc28sIHNvIHdlIGRvbid0IG5lZWQgbmdjYyB0byBjYXRjaCB0aGlzLlxuICpcbiAqIEZvciBleGFtcGxlLCBjb25zaWRlciBhbiBhcHBsaWNhdGlvbiB0aGF0IHVzZXMgdGhlIGBAYW5ndWxhci9yb3V0ZXJgIHBhY2thZ2UuXG4gKiBUaGlzIHBhY2thZ2UgaW5jbHVkZXMgYW4gZW50cnktcG9pbnQgY2FsbGVkIGBAYW5ndWxhci9yb3V0ZXIvdXBncmFkZWAsIHdoaWNoIGhhcyBhIGRlcGVuZGVuY3lcbiAqIG9uIHRoZSBgQGFuZ3VsYXIvdXBncmFkZWAgcGFja2FnZS5cbiAqIElmIHRoZSBhcHBsaWNhdGlvbiBuZXZlciB1c2VzIGNvZGUgZnJvbSBgQGFuZ3VsYXIvcm91dGVyL3VwZ3JhZGVgIHRoZW4gdGhlcmUgaXMgbm8gbmVlZCBmb3JcbiAqIGBAYW5ndWxhci91cGdyYWRlYCB0byBiZSBpbnN0YWxsZWQuXG4gKiBJbiB0aGlzIGNhc2UgdGhlIG5nY2MgdG9vbCBzaG91bGQganVzdCBpZ25vcmUgdGhlIGBAYW5ndWxhci9yb3V0ZXIvdXBncmFkZWAgZW5kLXBvaW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEludmFsaWRFbnRyeVBvaW50IHtcbiAgZW50cnlQb2ludDogRW50cnlQb2ludDtcbiAgbWlzc2luZ0RlcGVuZGVuY2llczogc3RyaW5nW107XG59XG5cbi8qKlxuICogSG9sZHMgaW5mb3JtYXRpb24gYWJvdXQgZGVwZW5kZW5jaWVzIG9mIGFuIGVudHJ5LXBvaW50IHRoYXQgZG8gbm90IG5lZWQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBieSB0aGUgbmdjYyB0b29sLlxuICpcbiAqIEZvciBleGFtcGxlLCB0aGUgYHJ4anNgIHBhY2thZ2UgZG9lcyBub3QgY29udGFpbiBhbnkgQW5ndWxhciBkZWNvcmF0b3JzIHRoYXQgbmVlZCB0byBiZVxuICogY29tcGlsZWQgYW5kIHNvIHRoaXMgY2FuIGJlIHNhZmVseSBpZ25vcmVkIGJ5IG5nY2MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSWdub3JlZERlcGVuZGVuY3kge1xuICBlbnRyeVBvaW50OiBFbnRyeVBvaW50O1xuICBkZXBlbmRlbmN5UGF0aDogc3RyaW5nO1xufVxuXG4vKipcbiAqIFRoZSByZXN1bHQgb2Ygc29ydGluZyB0aGUgZW50cnktcG9pbnRzIGJ5IHRoZWlyIGRlcGVuZGVuY2llcy5cbiAqXG4gKiBUaGUgYGVudHJ5UG9pbnRzYCBhcnJheSB3aWxsIGJlIG9yZGVyZWQgc28gdGhhdCBubyBlbnRyeSBwb2ludCBkZXBlbmRzIHVwb24gYW4gZW50cnkgcG9pbnQgdGhhdFxuICogYXBwZWFycyBsYXRlciBpbiB0aGUgYXJyYXkuXG4gKlxuICogU29tZSBlbnRyeSBwb2ludHMgb3IgdGhlaXIgZGVwZW5kZW5jaWVzIG1heSBiZSBoYXZlIGJlZW4gaWdub3JlZC4gVGhlc2UgYXJlIGNhcHR1cmVkIGZvclxuICogZGlhZ25vc3RpYyBwdXJwb3NlcyBpbiBgaW52YWxpZEVudHJ5UG9pbnRzYCBhbmQgYGlnbm9yZWREZXBlbmRlbmNpZXNgIHJlc3BlY3RpdmVseS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTb3J0ZWRFbnRyeVBvaW50c0luZm8ge1xuICBlbnRyeVBvaW50czogRW50cnlQb2ludFtdO1xuICBpbnZhbGlkRW50cnlQb2ludHM6IEludmFsaWRFbnRyeVBvaW50W107XG4gIGlnbm9yZWREZXBlbmRlbmNpZXM6IElnbm9yZWREZXBlbmRlbmN5W107XG59XG5cbi8qKlxuICogQSBjbGFzcyB0aGF0IHJlc29sdmVzIGRlcGVuZGVuY2llcyBiZXR3ZWVuIGVudHJ5LXBvaW50cy5cbiAqL1xuZXhwb3J0IGNsYXNzIERlcGVuZGVuY3lSZXNvbHZlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaG9zdDogRGVwZW5kZW5jeUhvc3QpIHt9XG4gIC8qKlxuICAgKiBTb3J0IHRoZSBhcnJheSBvZiBlbnRyeSBwb2ludHMgc28gdGhhdCB0aGUgZGVwZW5kYW50IGVudHJ5IHBvaW50cyBhbHdheXMgY29tZSBsYXRlciB0aGFuXG4gICAqIHRoZWlyIGRlcGVuZGVuY2llcyBpbiB0aGUgYXJyYXkuXG4gICAqIEBwYXJhbSBlbnRyeVBvaW50cyBBbiBhcnJheSBlbnRyeSBwb2ludHMgdG8gc29ydC5cbiAgICogQHJldHVybnMgdGhlIHJlc3VsdCBvZiBzb3J0aW5nIHRoZSBlbnRyeSBwb2ludHMuXG4gICAqL1xuICBzb3J0RW50cnlQb2ludHNCeURlcGVuZGVuY3koZW50cnlQb2ludHM6IEVudHJ5UG9pbnRbXSk6IFNvcnRlZEVudHJ5UG9pbnRzSW5mbyB7XG4gICAgY29uc3QgaW52YWxpZEVudHJ5UG9pbnRzOiBJbnZhbGlkRW50cnlQb2ludFtdID0gW107XG4gICAgY29uc3QgaWdub3JlZERlcGVuZGVuY2llczogSWdub3JlZERlcGVuZGVuY3lbXSA9IFtdO1xuICAgIGNvbnN0IGdyYXBoID0gbmV3IERlcEdyYXBoPEVudHJ5UG9pbnQ+KCk7XG5cbiAgICAvLyBBZGQgdGhlIGVudHJ5IHBvbnRzIHRvIHRoZSBncmFwaCBhcyBub2Rlc1xuICAgIGVudHJ5UG9pbnRzLmZvckVhY2goZW50cnlQb2ludCA9PiBncmFwaC5hZGROb2RlKGVudHJ5UG9pbnQucGF0aCwgZW50cnlQb2ludCkpO1xuXG4gICAgLy8gTm93IGFkZCB0aGUgZGVwZW5kZW5jaWVzIGJldHdlZW4gdGhlbVxuICAgIGVudHJ5UG9pbnRzLmZvckVhY2goZW50cnlQb2ludCA9PiB7XG4gICAgICBjb25zdCBlbnRyeVBvaW50UGF0aCA9IGVudHJ5UG9pbnQuZXNtMjAxNTtcbiAgICAgIGlmICghZW50cnlQb2ludFBhdGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFc20yMDE1IGZvcm1hdCBtaXNzaW5nIGluICcke2VudHJ5UG9pbnQucGF0aH0nIGVudHJ5LXBvaW50LmApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGNvbnN0IG1pc3NpbmcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIHRoaXMuaG9zdC5jb21wdXRlRGVwZW5kZW5jaWVzKGVudHJ5UG9pbnRQYXRoLCBkZXBlbmRlbmNpZXMsIG1pc3NpbmcpO1xuXG4gICAgICBpZiAobWlzc2luZy5zaXplID4gMCkge1xuICAgICAgICAvLyBUaGlzIGVudHJ5IHBvaW50IGhhcyBkZXBlbmRlbmNpZXMgdGhhdCBhcmUgbWlzc2luZ1xuICAgICAgICAvLyBzbyByZW1vdmUgaXQgZnJvbSB0aGUgZ3JhcGguXG4gICAgICAgIHJlbW92ZU5vZGVzKGVudHJ5UG9pbnQsIEFycmF5LmZyb20obWlzc2luZykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVwZW5kZW5jaWVzLmZvckVhY2goZGVwZW5kZW5jeVBhdGggPT4ge1xuICAgICAgICAgIGlmIChncmFwaC5oYXNOb2RlKGRlcGVuZGVuY3lQYXRoKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlcGVuZGVuY3kgcGF0aCBtYXBzIHRvIGFuIGVudHJ5IHBvaW50IHRoYXQgZXhpc3RzIGluIHRoZSBncmFwaFxuICAgICAgICAgICAgLy8gc28gYWRkIHRoZSBkZXBlbmRlbmN5LlxuICAgICAgICAgICAgZ3JhcGguYWRkRGVwZW5kZW5jeShlbnRyeVBvaW50LnBhdGgsIGRlcGVuZGVuY3lQYXRoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGludmFsaWRFbnRyeVBvaW50cy5zb21lKGkgPT4gaS5lbnRyeVBvaW50LnBhdGggPT09IGRlcGVuZGVuY3lQYXRoKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlcGVuZGVuY3kgcGF0aCBtYXBzIHRvIGFuIGVudHJ5LXBvaW50IHRoYXQgd2FzIHByZXZpb3VzbHkgcmVtb3ZlZFxuICAgICAgICAgICAgLy8gZnJvbSB0aGUgZ3JhcGgsIHNvIHJlbW92ZSB0aGlzIGVudHJ5LXBvaW50IGFzIHdlbGwuXG4gICAgICAgICAgICByZW1vdmVOb2RlcyhlbnRyeVBvaW50LCBbZGVwZW5kZW5jeVBhdGhdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhlIGRlcGVuZGVuY3kgcGF0aCBwb2ludHMgdG8gYSBwYWNrYWdlIHRoYXQgbmdjYyBkb2VzIG5vdCBjYXJlIGFib3V0LlxuICAgICAgICAgICAgaWdub3JlZERlcGVuZGVuY2llcy5wdXNoKHtlbnRyeVBvaW50LCBkZXBlbmRlbmN5UGF0aH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBUaGUgbWFwIG5vdyBvbmx5IGhvbGRzIGVudHJ5LXBvaW50cyB0aGF0IG5nY2MgY2FyZXMgYWJvdXQgYW5kIHdob3NlIGRlcGVuZGVuY2llc1xuICAgIC8vIChkaXJlY3QgYW5kIHRyYW5zaXRpdmUpIGFsbCBleGlzdC5cbiAgICByZXR1cm4ge1xuICAgICAgZW50cnlQb2ludHM6IGdyYXBoLm92ZXJhbGxPcmRlcigpLm1hcChwYXRoID0+IGdyYXBoLmdldE5vZGVEYXRhKHBhdGgpKSxcbiAgICAgIGludmFsaWRFbnRyeVBvaW50cyxcbiAgICAgIGlnbm9yZWREZXBlbmRlbmNpZXNcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gcmVtb3ZlTm9kZXMoZW50cnlQb2ludDogRW50cnlQb2ludCwgbWlzc2luZ0RlcGVuZGVuY2llczogc3RyaW5nW10pIHtcbiAgICAgIGNvbnN0IG5vZGVzVG9SZW1vdmUgPSBbZW50cnlQb2ludC5wYXRoLCAuLi5ncmFwaC5kZXBlbmRhbnRzT2YoZW50cnlQb2ludC5wYXRoKV07XG4gICAgICBub2Rlc1RvUmVtb3ZlLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIGludmFsaWRFbnRyeVBvaW50cy5wdXNoKHtlbnRyeVBvaW50OiBncmFwaC5nZXROb2RlRGF0YShub2RlKSwgbWlzc2luZ0RlcGVuZGVuY2llc30pO1xuICAgICAgICBncmFwaC5yZW1vdmVOb2RlKG5vZGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=