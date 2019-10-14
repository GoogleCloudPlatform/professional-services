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
        define("@angular/compiler-cli/src/ngcc/src/packages/dependency_host", ["require", "exports", "canonical-path", "fs", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var path = require("canonical-path");
    var fs = require("fs");
    var ts = require("typescript");
    /**
     * Helper functions for computing dependencies.
     */
    var DependencyHost = /** @class */ (function () {
        function DependencyHost() {
        }
        /**
         * Get a list of the resolved paths to all the dependencies of this entry point.
         * @param from An absolute path to the file whose dependencies we want to get.
         * @param resolved A set that will have the resolved dependencies added to it.
         * @param missing A set that will have the dependencies that could not be found added to it.
         * @param internal A set that is used to track internal dependencies to prevent getting stuck in a
         * circular dependency loop.
         * @returns an object containing an array of absolute paths to `resolved` depenendencies and an
         * array of import specifiers for dependencies that were `missing`.
         */
        DependencyHost.prototype.computeDependencies = function (from, resolved, missing, internal) {
            var _this = this;
            if (internal === void 0) { internal = new Set(); }
            var fromContents = fs.readFileSync(from, 'utf8');
            if (!this.hasImportOrReeportStatements(fromContents)) {
                return;
            }
            // Parse the source into a TypeScript AST and then walk it looking for imports and re-exports.
            var sf = ts.createSourceFile(from, fromContents, ts.ScriptTarget.ES2015, false, ts.ScriptKind.JS);
            sf.statements
                // filter out statements that are not imports or reexports
                .filter(this.isStringImportOrReexport)
                // Grab the id of the module that is being imported
                .map(function (stmt) { return stmt.moduleSpecifier.text; })
                // Resolve this module id into an absolute path
                .forEach(function (importPath) {
                if (importPath.startsWith('.')) {
                    // This is an internal import so follow it
                    var internalDependency = _this.resolveInternal(from, importPath);
                    // Avoid circular dependencies
                    if (!internal.has(internalDependency)) {
                        internal.add(internalDependency);
                        _this.computeDependencies(internalDependency, resolved, missing, internal);
                    }
                }
                else {
                    var externalDependency = _this.tryResolveExternal(from, importPath);
                    if (externalDependency !== null) {
                        resolved.add(externalDependency);
                    }
                    else {
                        missing.add(importPath);
                    }
                }
            });
        };
        /**
         * Resolve an internal module import.
         * @param from the absolute file path from where to start trying to resolve this module
         * @param to the module specifier of the internal dependency to resolve
         * @returns the resolved path to the import.
         */
        DependencyHost.prototype.resolveInternal = function (from, to) {
            var fromDirectory = path.dirname(from);
            // `fromDirectory` is absolute so we don't need to worry about telling `require.resolve`
            // about it - unlike `tryResolve` below.
            return require.resolve(path.resolve(fromDirectory, to));
        };
        /**
         * We don't want to resolve external dependencies directly because if it is a path to a
         * sub-entry-point (e.g. @angular/animations/browser rather than @angular/animations)
         * then `require.resolve()` may return a path to a UMD bundle, which may actually live
         * in the folder containing the sub-entry-point
         * (e.g. @angular/animations/bundles/animations-browser.umd.js).
         *
         * Instead we try to resolve it as a package, which is what we would need anyway for it to be
         * compilable by ngcc.
         *
         * If `to` is actually a path to a file then this will fail, which is what we want.
         *
         * @param from the file path from where to start trying to resolve this module
         * @param to the module specifier of the dependency to resolve
         * @returns the resolved path to the entry point directory of the import or null
         * if it cannot be resolved.
         */
        DependencyHost.prototype.tryResolveExternal = function (from, to) {
            var externalDependency = this.tryResolve(from, to + "/package.json");
            return externalDependency && path.dirname(externalDependency);
        };
        /**
         * Resolve the absolute path of a module from a particular starting point.
         *
         * @param from the file path from where to start trying to resolve this module
         * @param to the module specifier of the dependency to resolve
         * @returns an absolute path to the entry-point of the dependency or null if it could not be
         * resolved.
         */
        DependencyHost.prototype.tryResolve = function (from, to) {
            try {
                return require.resolve(to, { paths: [from] });
            }
            catch (e) {
                return null;
            }
        };
        /**
         * Check whether the given statement is an import with a string literal module specifier.
         * @param stmt the statement node to check.
         * @returns true if the statement is an import with a string literal module specifier.
         */
        DependencyHost.prototype.isStringImportOrReexport = function (stmt) {
            return ts.isImportDeclaration(stmt) ||
                ts.isExportDeclaration(stmt) && !!stmt.moduleSpecifier &&
                    ts.isStringLiteral(stmt.moduleSpecifier);
        };
        /**
         * Check whether a source file needs to be parsed for imports.
         * This is a performance short-circuit, which saves us from creating
         * a TypeScript AST unnecessarily.
         *
         * @param source The content of the source file to check.
         *
         * @returns false if there are definitely no import or re-export statements
         * in this file, true otherwise.
         */
        DependencyHost.prototype.hasImportOrReeportStatements = function (source) {
            return /(import|export)\s.+from/.test(source);
        };
        return DependencyHost;
    }());
    exports.DependencyHost = DependencyHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwZW5kZW5jeV9ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ2NjL3NyYy9wYWNrYWdlcy9kZXBlbmRlbmN5X2hvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxxQ0FBdUM7SUFDdkMsdUJBQXlCO0lBQ3pCLCtCQUFpQztJQUVqQzs7T0FFRztJQUNIO1FBQUE7UUE0SEEsQ0FBQztRQTNIQzs7Ozs7Ozs7O1dBU0c7UUFDSCw0Q0FBbUIsR0FBbkIsVUFDSSxJQUFZLEVBQUUsUUFBcUIsRUFBRSxPQUFvQixFQUN6RCxRQUFpQztZQUZyQyxpQkFtQ0M7WUFqQ0cseUJBQUEsRUFBQSxlQUE0QixHQUFHLEVBQUU7WUFDbkMsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxZQUFZLENBQUMsRUFBRTtnQkFDcEQsT0FBTzthQUNSO1lBRUQsOEZBQThGO1lBQzlGLElBQU0sRUFBRSxHQUNKLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzdGLEVBQUUsQ0FBQyxVQUFVO2dCQUNULDBEQUEwRDtpQkFDekQsTUFBTSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztnQkFDdEMsbURBQW1EO2lCQUNsRCxHQUFHLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBekIsQ0FBeUIsQ0FBQztnQkFDdkMsK0NBQStDO2lCQUM5QyxPQUFPLENBQUMsVUFBQSxVQUFVO2dCQUNqQixJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQzlCLDBDQUEwQztvQkFDMUMsSUFBTSxrQkFBa0IsR0FBRyxLQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztvQkFDbEUsOEJBQThCO29CQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO3dCQUNyQyxRQUFRLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7d0JBQ2pDLEtBQUksQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO3FCQUMzRTtpQkFDRjtxQkFBTTtvQkFDTCxJQUFNLGtCQUFrQixHQUFHLEtBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ3JFLElBQUksa0JBQWtCLEtBQUssSUFBSSxFQUFFO3dCQUMvQixRQUFRLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7cUJBQ2xDO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7cUJBQ3pCO2lCQUNGO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDVCxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDSCx3Q0FBZSxHQUFmLFVBQWdCLElBQVksRUFBRSxFQUFVO1lBQ3RDLElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekMsd0ZBQXdGO1lBQ3hGLHdDQUF3QztZQUN4QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7V0FnQkc7UUFDSCwyQ0FBa0IsR0FBbEIsVUFBbUIsSUFBWSxFQUFFLEVBQVU7WUFDekMsSUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBSyxFQUFFLGtCQUFlLENBQUMsQ0FBQztZQUN2RSxPQUFPLGtCQUFrQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQ7Ozs7Ozs7V0FPRztRQUNILG1DQUFVLEdBQVYsVUFBVyxJQUFZLEVBQUUsRUFBVTtZQUNqQyxJQUFJO2dCQUNGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLENBQUM7YUFDN0M7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDVixPQUFPLElBQUksQ0FBQzthQUNiO1FBQ0gsQ0FBQztRQUVEOzs7O1dBSUc7UUFDSCxpREFBd0IsR0FBeEIsVUFBeUIsSUFBa0I7WUFFekMsT0FBTyxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDO2dCQUMvQixFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlO29CQUN0RCxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQ7Ozs7Ozs7OztXQVNHO1FBQ0gscURBQTRCLEdBQTVCLFVBQTZCLE1BQWM7WUFDekMsT0FBTyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUNILHFCQUFDO0lBQUQsQ0FBQyxBQTVIRCxJQTRIQztJQTVIWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdjYW5vbmljYWwtcGF0aCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb25zIGZvciBjb21wdXRpbmcgZGVwZW5kZW5jaWVzLlxuICovXG5leHBvcnQgY2xhc3MgRGVwZW5kZW5jeUhvc3Qge1xuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiB0aGUgcmVzb2x2ZWQgcGF0aHMgdG8gYWxsIHRoZSBkZXBlbmRlbmNpZXMgb2YgdGhpcyBlbnRyeSBwb2ludC5cbiAgICogQHBhcmFtIGZyb20gQW4gYWJzb2x1dGUgcGF0aCB0byB0aGUgZmlsZSB3aG9zZSBkZXBlbmRlbmNpZXMgd2Ugd2FudCB0byBnZXQuXG4gICAqIEBwYXJhbSByZXNvbHZlZCBBIHNldCB0aGF0IHdpbGwgaGF2ZSB0aGUgcmVzb2x2ZWQgZGVwZW5kZW5jaWVzIGFkZGVkIHRvIGl0LlxuICAgKiBAcGFyYW0gbWlzc2luZyBBIHNldCB0aGF0IHdpbGwgaGF2ZSB0aGUgZGVwZW5kZW5jaWVzIHRoYXQgY291bGQgbm90IGJlIGZvdW5kIGFkZGVkIHRvIGl0LlxuICAgKiBAcGFyYW0gaW50ZXJuYWwgQSBzZXQgdGhhdCBpcyB1c2VkIHRvIHRyYWNrIGludGVybmFsIGRlcGVuZGVuY2llcyB0byBwcmV2ZW50IGdldHRpbmcgc3R1Y2sgaW4gYVxuICAgKiBjaXJjdWxhciBkZXBlbmRlbmN5IGxvb3AuXG4gICAqIEByZXR1cm5zIGFuIG9iamVjdCBjb250YWluaW5nIGFuIGFycmF5IG9mIGFic29sdXRlIHBhdGhzIHRvIGByZXNvbHZlZGAgZGVwZW5lbmRlbmNpZXMgYW5kIGFuXG4gICAqIGFycmF5IG9mIGltcG9ydCBzcGVjaWZpZXJzIGZvciBkZXBlbmRlbmNpZXMgdGhhdCB3ZXJlIGBtaXNzaW5nYC5cbiAgICovXG4gIGNvbXB1dGVEZXBlbmRlbmNpZXMoXG4gICAgICBmcm9tOiBzdHJpbmcsIHJlc29sdmVkOiBTZXQ8c3RyaW5nPiwgbWlzc2luZzogU2V0PHN0cmluZz4sXG4gICAgICBpbnRlcm5hbDogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCkpOiB2b2lkIHtcbiAgICBjb25zdCBmcm9tQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoZnJvbSwgJ3V0ZjgnKTtcbiAgICBpZiAoIXRoaXMuaGFzSW1wb3J0T3JSZWVwb3J0U3RhdGVtZW50cyhmcm9tQ29udGVudHMpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgdGhlIHNvdXJjZSBpbnRvIGEgVHlwZVNjcmlwdCBBU1QgYW5kIHRoZW4gd2FsayBpdCBsb29raW5nIGZvciBpbXBvcnRzIGFuZCByZS1leHBvcnRzLlxuICAgIGNvbnN0IHNmID1cbiAgICAgICAgdHMuY3JlYXRlU291cmNlRmlsZShmcm9tLCBmcm9tQ29udGVudHMsIHRzLlNjcmlwdFRhcmdldC5FUzIwMTUsIGZhbHNlLCB0cy5TY3JpcHRLaW5kLkpTKTtcbiAgICBzZi5zdGF0ZW1lbnRzXG4gICAgICAgIC8vIGZpbHRlciBvdXQgc3RhdGVtZW50cyB0aGF0IGFyZSBub3QgaW1wb3J0cyBvciByZWV4cG9ydHNcbiAgICAgICAgLmZpbHRlcih0aGlzLmlzU3RyaW5nSW1wb3J0T3JSZWV4cG9ydClcbiAgICAgICAgLy8gR3JhYiB0aGUgaWQgb2YgdGhlIG1vZHVsZSB0aGF0IGlzIGJlaW5nIGltcG9ydGVkXG4gICAgICAgIC5tYXAoc3RtdCA9PiBzdG10Lm1vZHVsZVNwZWNpZmllci50ZXh0KVxuICAgICAgICAvLyBSZXNvbHZlIHRoaXMgbW9kdWxlIGlkIGludG8gYW4gYWJzb2x1dGUgcGF0aFxuICAgICAgICAuZm9yRWFjaChpbXBvcnRQYXRoID0+IHtcbiAgICAgICAgICBpZiAoaW1wb3J0UGF0aC5zdGFydHNXaXRoKCcuJykpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gaW50ZXJuYWwgaW1wb3J0IHNvIGZvbGxvdyBpdFxuICAgICAgICAgICAgY29uc3QgaW50ZXJuYWxEZXBlbmRlbmN5ID0gdGhpcy5yZXNvbHZlSW50ZXJuYWwoZnJvbSwgaW1wb3J0UGF0aCk7XG4gICAgICAgICAgICAvLyBBdm9pZCBjaXJjdWxhciBkZXBlbmRlbmNpZXNcbiAgICAgICAgICAgIGlmICghaW50ZXJuYWwuaGFzKGludGVybmFsRGVwZW5kZW5jeSkpIHtcbiAgICAgICAgICAgICAgaW50ZXJuYWwuYWRkKGludGVybmFsRGVwZW5kZW5jeSk7XG4gICAgICAgICAgICAgIHRoaXMuY29tcHV0ZURlcGVuZGVuY2llcyhpbnRlcm5hbERlcGVuZGVuY3ksIHJlc29sdmVkLCBtaXNzaW5nLCBpbnRlcm5hbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4dGVybmFsRGVwZW5kZW5jeSA9IHRoaXMudHJ5UmVzb2x2ZUV4dGVybmFsKGZyb20sIGltcG9ydFBhdGgpO1xuICAgICAgICAgICAgaWYgKGV4dGVybmFsRGVwZW5kZW5jeSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICByZXNvbHZlZC5hZGQoZXh0ZXJuYWxEZXBlbmRlbmN5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG1pc3NpbmcuYWRkKGltcG9ydFBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZSBhbiBpbnRlcm5hbCBtb2R1bGUgaW1wb3J0LlxuICAgKiBAcGFyYW0gZnJvbSB0aGUgYWJzb2x1dGUgZmlsZSBwYXRoIGZyb20gd2hlcmUgdG8gc3RhcnQgdHJ5aW5nIHRvIHJlc29sdmUgdGhpcyBtb2R1bGVcbiAgICogQHBhcmFtIHRvIHRoZSBtb2R1bGUgc3BlY2lmaWVyIG9mIHRoZSBpbnRlcm5hbCBkZXBlbmRlbmN5IHRvIHJlc29sdmVcbiAgICogQHJldHVybnMgdGhlIHJlc29sdmVkIHBhdGggdG8gdGhlIGltcG9ydC5cbiAgICovXG4gIHJlc29sdmVJbnRlcm5hbChmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZyb21EaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUoZnJvbSk7XG4gICAgLy8gYGZyb21EaXJlY3RvcnlgIGlzIGFic29sdXRlIHNvIHdlIGRvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgdGVsbGluZyBgcmVxdWlyZS5yZXNvbHZlYFxuICAgIC8vIGFib3V0IGl0IC0gdW5saWtlIGB0cnlSZXNvbHZlYCBiZWxvdy5cbiAgICByZXR1cm4gcmVxdWlyZS5yZXNvbHZlKHBhdGgucmVzb2x2ZShmcm9tRGlyZWN0b3J5LCB0bykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdlIGRvbid0IHdhbnQgdG8gcmVzb2x2ZSBleHRlcm5hbCBkZXBlbmRlbmNpZXMgZGlyZWN0bHkgYmVjYXVzZSBpZiBpdCBpcyBhIHBhdGggdG8gYVxuICAgKiBzdWItZW50cnktcG9pbnQgKGUuZy4gQGFuZ3VsYXIvYW5pbWF0aW9ucy9icm93c2VyIHJhdGhlciB0aGFuIEBhbmd1bGFyL2FuaW1hdGlvbnMpXG4gICAqIHRoZW4gYHJlcXVpcmUucmVzb2x2ZSgpYCBtYXkgcmV0dXJuIGEgcGF0aCB0byBhIFVNRCBidW5kbGUsIHdoaWNoIG1heSBhY3R1YWxseSBsaXZlXG4gICAqIGluIHRoZSBmb2xkZXIgY29udGFpbmluZyB0aGUgc3ViLWVudHJ5LXBvaW50XG4gICAqIChlLmcuIEBhbmd1bGFyL2FuaW1hdGlvbnMvYnVuZGxlcy9hbmltYXRpb25zLWJyb3dzZXIudW1kLmpzKS5cbiAgICpcbiAgICogSW5zdGVhZCB3ZSB0cnkgdG8gcmVzb2x2ZSBpdCBhcyBhIHBhY2thZ2UsIHdoaWNoIGlzIHdoYXQgd2Ugd291bGQgbmVlZCBhbnl3YXkgZm9yIGl0IHRvIGJlXG4gICAqIGNvbXBpbGFibGUgYnkgbmdjYy5cbiAgICpcbiAgICogSWYgYHRvYCBpcyBhY3R1YWxseSBhIHBhdGggdG8gYSBmaWxlIHRoZW4gdGhpcyB3aWxsIGZhaWwsIHdoaWNoIGlzIHdoYXQgd2Ugd2FudC5cbiAgICpcbiAgICogQHBhcmFtIGZyb20gdGhlIGZpbGUgcGF0aCBmcm9tIHdoZXJlIHRvIHN0YXJ0IHRyeWluZyB0byByZXNvbHZlIHRoaXMgbW9kdWxlXG4gICAqIEBwYXJhbSB0byB0aGUgbW9kdWxlIHNwZWNpZmllciBvZiB0aGUgZGVwZW5kZW5jeSB0byByZXNvbHZlXG4gICAqIEByZXR1cm5zIHRoZSByZXNvbHZlZCBwYXRoIHRvIHRoZSBlbnRyeSBwb2ludCBkaXJlY3Rvcnkgb2YgdGhlIGltcG9ydCBvciBudWxsXG4gICAqIGlmIGl0IGNhbm5vdCBiZSByZXNvbHZlZC5cbiAgICovXG4gIHRyeVJlc29sdmVFeHRlcm5hbChmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gICAgY29uc3QgZXh0ZXJuYWxEZXBlbmRlbmN5ID0gdGhpcy50cnlSZXNvbHZlKGZyb20sIGAke3RvfS9wYWNrYWdlLmpzb25gKTtcbiAgICByZXR1cm4gZXh0ZXJuYWxEZXBlbmRlbmN5ICYmIHBhdGguZGlybmFtZShleHRlcm5hbERlcGVuZGVuY3kpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmUgdGhlIGFic29sdXRlIHBhdGggb2YgYSBtb2R1bGUgZnJvbSBhIHBhcnRpY3VsYXIgc3RhcnRpbmcgcG9pbnQuXG4gICAqXG4gICAqIEBwYXJhbSBmcm9tIHRoZSBmaWxlIHBhdGggZnJvbSB3aGVyZSB0byBzdGFydCB0cnlpbmcgdG8gcmVzb2x2ZSB0aGlzIG1vZHVsZVxuICAgKiBAcGFyYW0gdG8gdGhlIG1vZHVsZSBzcGVjaWZpZXIgb2YgdGhlIGRlcGVuZGVuY3kgdG8gcmVzb2x2ZVxuICAgKiBAcmV0dXJucyBhbiBhYnNvbHV0ZSBwYXRoIHRvIHRoZSBlbnRyeS1wb2ludCBvZiB0aGUgZGVwZW5kZW5jeSBvciBudWxsIGlmIGl0IGNvdWxkIG5vdCBiZVxuICAgKiByZXNvbHZlZC5cbiAgICovXG4gIHRyeVJlc29sdmUoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gcmVxdWlyZS5yZXNvbHZlKHRvLCB7cGF0aHM6IFtmcm9tXX0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBnaXZlbiBzdGF0ZW1lbnQgaXMgYW4gaW1wb3J0IHdpdGggYSBzdHJpbmcgbGl0ZXJhbCBtb2R1bGUgc3BlY2lmaWVyLlxuICAgKiBAcGFyYW0gc3RtdCB0aGUgc3RhdGVtZW50IG5vZGUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHRydWUgaWYgdGhlIHN0YXRlbWVudCBpcyBhbiBpbXBvcnQgd2l0aCBhIHN0cmluZyBsaXRlcmFsIG1vZHVsZSBzcGVjaWZpZXIuXG4gICAqL1xuICBpc1N0cmluZ0ltcG9ydE9yUmVleHBvcnQoc3RtdDogdHMuU3RhdGVtZW50KTogc3RtdCBpcyB0cy5JbXBvcnREZWNsYXJhdGlvbiZcbiAgICAgIHttb2R1bGVTcGVjaWZpZXI6IHRzLlN0cmluZ0xpdGVyYWx9IHtcbiAgICByZXR1cm4gdHMuaXNJbXBvcnREZWNsYXJhdGlvbihzdG10KSB8fFxuICAgICAgICB0cy5pc0V4cG9ydERlY2xhcmF0aW9uKHN0bXQpICYmICEhc3RtdC5tb2R1bGVTcGVjaWZpZXIgJiZcbiAgICAgICAgdHMuaXNTdHJpbmdMaXRlcmFsKHN0bXQubW9kdWxlU3BlY2lmaWVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIGEgc291cmNlIGZpbGUgbmVlZHMgdG8gYmUgcGFyc2VkIGZvciBpbXBvcnRzLlxuICAgKiBUaGlzIGlzIGEgcGVyZm9ybWFuY2Ugc2hvcnQtY2lyY3VpdCwgd2hpY2ggc2F2ZXMgdXMgZnJvbSBjcmVhdGluZ1xuICAgKiBhIFR5cGVTY3JpcHQgQVNUIHVubmVjZXNzYXJpbHkuXG4gICAqXG4gICAqIEBwYXJhbSBzb3VyY2UgVGhlIGNvbnRlbnQgb2YgdGhlIHNvdXJjZSBmaWxlIHRvIGNoZWNrLlxuICAgKlxuICAgKiBAcmV0dXJucyBmYWxzZSBpZiB0aGVyZSBhcmUgZGVmaW5pdGVseSBubyBpbXBvcnQgb3IgcmUtZXhwb3J0IHN0YXRlbWVudHNcbiAgICogaW4gdGhpcyBmaWxlLCB0cnVlIG90aGVyd2lzZS5cbiAgICovXG4gIGhhc0ltcG9ydE9yUmVlcG9ydFN0YXRlbWVudHMoc291cmNlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gLyhpbXBvcnR8ZXhwb3J0KVxccy4rZnJvbS8udGVzdChzb3VyY2UpO1xuICB9XG59XG4iXX0=