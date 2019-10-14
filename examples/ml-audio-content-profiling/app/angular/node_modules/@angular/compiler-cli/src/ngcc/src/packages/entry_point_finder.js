(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/packages/entry_point_finder", ["require", "exports", "tslib", "canonical-path", "fs", "@angular/compiler-cli/src/ngcc/src/packages/entry_point"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var path = require("canonical-path");
    var fs = require("fs");
    var entry_point_1 = require("@angular/compiler-cli/src/ngcc/src/packages/entry_point");
    var EntryPointFinder = /** @class */ (function () {
        function EntryPointFinder(resolver) {
            this.resolver = resolver;
        }
        /**
         * Search the given directory, and sub-directories, for Angular package entry points.
         * @param sourceDirectory An absolute path to the directory to search for entry points.
         */
        EntryPointFinder.prototype.findEntryPoints = function (sourceDirectory) {
            var unsortedEntryPoints = walkDirectoryForEntryPoints(sourceDirectory);
            return this.resolver.sortEntryPointsByDependency(unsortedEntryPoints);
        };
        return EntryPointFinder;
    }());
    exports.EntryPointFinder = EntryPointFinder;
    /**
     * Look for entry points that need to be compiled, starting at the source directory.
     * The function will recurse into directories that start with `@...`, e.g. `@angular/...`.
     * @param sourceDirectory An absolute path to the root directory where searching begins.
     */
    function walkDirectoryForEntryPoints(sourceDirectory) {
        var entryPoints = [];
        fs.readdirSync(sourceDirectory)
            // Not interested in hidden files
            .filter(function (p) { return !p.startsWith('.'); })
            // Ignore node_modules
            .filter(function (p) { return p !== 'node_modules'; })
            // Only interested in directories (and only those that are not symlinks)
            .filter(function (p) {
            var stat = fs.lstatSync(path.resolve(sourceDirectory, p));
            return stat.isDirectory() && !stat.isSymbolicLink();
        })
            .forEach(function (p) {
            // Either the directory is a potential package or a namespace containing packages (e.g
            // `@angular`).
            var packagePath = path.join(sourceDirectory, p);
            if (p.startsWith('@')) {
                entryPoints.push.apply(entryPoints, tslib_1.__spread(walkDirectoryForEntryPoints(packagePath)));
            }
            else {
                entryPoints.push.apply(entryPoints, tslib_1.__spread(getEntryPointsForPackage(packagePath)));
                // Also check for any nested node_modules in this package
                var nestedNodeModulesPath = path.resolve(packagePath, 'node_modules');
                if (fs.existsSync(nestedNodeModulesPath)) {
                    entryPoints.push.apply(entryPoints, tslib_1.__spread(walkDirectoryForEntryPoints(nestedNodeModulesPath)));
                }
            }
        });
        return entryPoints;
    }
    /**
     * Recurse the folder structure looking for all the entry points
     * @param packagePath The absolute path to an npm package that may contain entry points
     * @returns An array of entry points that were discovered.
     */
    function getEntryPointsForPackage(packagePath) {
        var entryPoints = [];
        // Try to get an entry point from the top level package directory
        var topLevelEntryPoint = entry_point_1.getEntryPointInfo(packagePath, packagePath);
        if (topLevelEntryPoint !== null) {
            entryPoints.push(topLevelEntryPoint);
        }
        // Now search all the directories of this package for possible entry points
        walkDirectory(packagePath, function (subdir) {
            var subEntryPoint = entry_point_1.getEntryPointInfo(packagePath, subdir);
            if (subEntryPoint !== null) {
                entryPoints.push(subEntryPoint);
            }
        });
        return entryPoints;
    }
    /**
     * Recursively walk a directory and its sub-directories, applying a given
     * function to each directory.
     * @param dir the directory to recursively walk.
     * @param fn the function to apply to each directory.
     */
    function walkDirectory(dir, fn) {
        return fs
            .readdirSync(dir)
            // Not interested in hidden files
            .filter(function (p) { return !p.startsWith('.'); })
            // Ignore node_modules
            .filter(function (p) { return p !== 'node_modules'; })
            // Only interested in directories (and only those that are not symlinks)
            .filter(function (p) {
            var stat = fs.lstatSync(path.resolve(dir, p));
            return stat.isDirectory() && !stat.isSymbolicLink();
        })
            .forEach(function (subdir) {
            subdir = path.resolve(dir, subdir);
            fn(subdir);
            walkDirectory(subdir, fn);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50cnlfcG9pbnRfZmluZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ2NjL3NyYy9wYWNrYWdlcy9lbnRyeV9wb2ludF9maW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gscUNBQXVDO0lBQ3ZDLHVCQUF5QjtJQUd6Qix1RkFBNEQ7SUFHNUQ7UUFDRSwwQkFBb0IsUUFBNEI7WUFBNUIsYUFBUSxHQUFSLFFBQVEsQ0FBb0I7UUFBRyxDQUFDO1FBQ3BEOzs7V0FHRztRQUNILDBDQUFlLEdBQWYsVUFBZ0IsZUFBdUI7WUFDckMsSUFBTSxtQkFBbUIsR0FBRywyQkFBMkIsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUN6RSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsMkJBQTJCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBQ0gsdUJBQUM7SUFBRCxDQUFDLEFBVkQsSUFVQztJQVZZLDRDQUFnQjtJQVk3Qjs7OztPQUlHO0lBQ0gsU0FBUywyQkFBMkIsQ0FBQyxlQUF1QjtRQUMxRCxJQUFNLFdBQVcsR0FBaUIsRUFBRSxDQUFDO1FBQ3JDLEVBQUUsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDO1lBQzNCLGlDQUFpQzthQUNoQyxNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQWxCLENBQWtCLENBQUM7WUFDaEMsc0JBQXNCO2FBQ3JCLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsS0FBSyxjQUFjLEVBQXBCLENBQW9CLENBQUM7WUFDbEMsd0VBQXdFO2FBQ3ZFLE1BQU0sQ0FBQyxVQUFBLENBQUM7WUFDUCxJQUFNLElBQUksR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUQsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDdEQsQ0FBQyxDQUFDO2FBQ0QsT0FBTyxDQUFDLFVBQUEsQ0FBQztZQUNSLHNGQUFzRjtZQUN0RixlQUFlO1lBQ2YsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNyQixXQUFXLENBQUMsSUFBSSxPQUFoQixXQUFXLG1CQUFTLDJCQUEyQixDQUFDLFdBQVcsQ0FBQyxHQUFFO2FBQy9EO2lCQUFNO2dCQUNMLFdBQVcsQ0FBQyxJQUFJLE9BQWhCLFdBQVcsbUJBQVMsd0JBQXdCLENBQUMsV0FBVyxDQUFDLEdBQUU7Z0JBRTNELHlEQUF5RDtnQkFDekQsSUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDeEUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLEVBQUU7b0JBQ3hDLFdBQVcsQ0FBQyxJQUFJLE9BQWhCLFdBQVcsbUJBQVMsMkJBQTJCLENBQUMscUJBQXFCLENBQUMsR0FBRTtpQkFDekU7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ1AsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFTLHdCQUF3QixDQUFDLFdBQW1CO1FBQ25ELElBQU0sV0FBVyxHQUFpQixFQUFFLENBQUM7UUFFckMsaUVBQWlFO1FBQ2pFLElBQU0sa0JBQWtCLEdBQUcsK0JBQWlCLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZFLElBQUksa0JBQWtCLEtBQUssSUFBSSxFQUFFO1lBQy9CLFdBQVcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztTQUN0QztRQUVELDJFQUEyRTtRQUMzRSxhQUFhLENBQUMsV0FBVyxFQUFFLFVBQUEsTUFBTTtZQUMvQixJQUFNLGFBQWEsR0FBRywrQkFBaUIsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0QsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFO2dCQUMxQixXQUFXLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQ2pDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxTQUFTLGFBQWEsQ0FBQyxHQUFXLEVBQUUsRUFBeUI7UUFDM0QsT0FBTyxFQUFFO2FBQ0osV0FBVyxDQUFDLEdBQUcsQ0FBQztZQUNqQixpQ0FBaUM7YUFDaEMsTUFBTSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFsQixDQUFrQixDQUFDO1lBQ2hDLHNCQUFzQjthQUNyQixNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLEtBQUssY0FBYyxFQUFwQixDQUFvQixDQUFDO1lBQ2xDLHdFQUF3RTthQUN2RSxNQUFNLENBQUMsVUFBQSxDQUFDO1lBQ1AsSUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3RELENBQUMsQ0FBQzthQUNELE9BQU8sQ0FBQyxVQUFBLE1BQU07WUFDYixNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbkMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ1gsYUFBYSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztJQUNULENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ2Nhbm9uaWNhbC1wYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcblxuaW1wb3J0IHtEZXBlbmRlbmN5UmVzb2x2ZXIsIFNvcnRlZEVudHJ5UG9pbnRzSW5mb30gZnJvbSAnLi9kZXBlbmRlbmN5X3Jlc29sdmVyJztcbmltcG9ydCB7RW50cnlQb2ludCwgZ2V0RW50cnlQb2ludEluZm99IGZyb20gJy4vZW50cnlfcG9pbnQnO1xuXG5cbmV4cG9ydCBjbGFzcyBFbnRyeVBvaW50RmluZGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZXNvbHZlcjogRGVwZW5kZW5jeVJlc29sdmVyKSB7fVxuICAvKipcbiAgICogU2VhcmNoIHRoZSBnaXZlbiBkaXJlY3RvcnksIGFuZCBzdWItZGlyZWN0b3JpZXMsIGZvciBBbmd1bGFyIHBhY2thZ2UgZW50cnkgcG9pbnRzLlxuICAgKiBAcGFyYW0gc291cmNlRGlyZWN0b3J5IEFuIGFic29sdXRlIHBhdGggdG8gdGhlIGRpcmVjdG9yeSB0byBzZWFyY2ggZm9yIGVudHJ5IHBvaW50cy5cbiAgICovXG4gIGZpbmRFbnRyeVBvaW50cyhzb3VyY2VEaXJlY3Rvcnk6IHN0cmluZyk6IFNvcnRlZEVudHJ5UG9pbnRzSW5mbyB7XG4gICAgY29uc3QgdW5zb3J0ZWRFbnRyeVBvaW50cyA9IHdhbGtEaXJlY3RvcnlGb3JFbnRyeVBvaW50cyhzb3VyY2VEaXJlY3RvcnkpO1xuICAgIHJldHVybiB0aGlzLnJlc29sdmVyLnNvcnRFbnRyeVBvaW50c0J5RGVwZW5kZW5jeSh1bnNvcnRlZEVudHJ5UG9pbnRzKTtcbiAgfVxufVxuXG4vKipcbiAqIExvb2sgZm9yIGVudHJ5IHBvaW50cyB0aGF0IG5lZWQgdG8gYmUgY29tcGlsZWQsIHN0YXJ0aW5nIGF0IHRoZSBzb3VyY2UgZGlyZWN0b3J5LlxuICogVGhlIGZ1bmN0aW9uIHdpbGwgcmVjdXJzZSBpbnRvIGRpcmVjdG9yaWVzIHRoYXQgc3RhcnQgd2l0aCBgQC4uLmAsIGUuZy4gYEBhbmd1bGFyLy4uLmAuXG4gKiBAcGFyYW0gc291cmNlRGlyZWN0b3J5IEFuIGFic29sdXRlIHBhdGggdG8gdGhlIHJvb3QgZGlyZWN0b3J5IHdoZXJlIHNlYXJjaGluZyBiZWdpbnMuXG4gKi9cbmZ1bmN0aW9uIHdhbGtEaXJlY3RvcnlGb3JFbnRyeVBvaW50cyhzb3VyY2VEaXJlY3Rvcnk6IHN0cmluZyk6IEVudHJ5UG9pbnRbXSB7XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiBFbnRyeVBvaW50W10gPSBbXTtcbiAgZnMucmVhZGRpclN5bmMoc291cmNlRGlyZWN0b3J5KVxuICAgICAgLy8gTm90IGludGVyZXN0ZWQgaW4gaGlkZGVuIGZpbGVzXG4gICAgICAuZmlsdGVyKHAgPT4gIXAuc3RhcnRzV2l0aCgnLicpKVxuICAgICAgLy8gSWdub3JlIG5vZGVfbW9kdWxlc1xuICAgICAgLmZpbHRlcihwID0+IHAgIT09ICdub2RlX21vZHVsZXMnKVxuICAgICAgLy8gT25seSBpbnRlcmVzdGVkIGluIGRpcmVjdG9yaWVzIChhbmQgb25seSB0aG9zZSB0aGF0IGFyZSBub3Qgc3ltbGlua3MpXG4gICAgICAuZmlsdGVyKHAgPT4ge1xuICAgICAgICBjb25zdCBzdGF0ID0gZnMubHN0YXRTeW5jKHBhdGgucmVzb2x2ZShzb3VyY2VEaXJlY3RvcnksIHApKTtcbiAgICAgICAgcmV0dXJuIHN0YXQuaXNEaXJlY3RvcnkoKSAmJiAhc3RhdC5pc1N5bWJvbGljTGluaygpO1xuICAgICAgfSlcbiAgICAgIC5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAvLyBFaXRoZXIgdGhlIGRpcmVjdG9yeSBpcyBhIHBvdGVudGlhbCBwYWNrYWdlIG9yIGEgbmFtZXNwYWNlIGNvbnRhaW5pbmcgcGFja2FnZXMgKGUuZ1xuICAgICAgICAvLyBgQGFuZ3VsYXJgKS5cbiAgICAgICAgY29uc3QgcGFja2FnZVBhdGggPSBwYXRoLmpvaW4oc291cmNlRGlyZWN0b3J5LCBwKTtcbiAgICAgICAgaWYgKHAuc3RhcnRzV2l0aCgnQCcpKSB7XG4gICAgICAgICAgZW50cnlQb2ludHMucHVzaCguLi53YWxrRGlyZWN0b3J5Rm9yRW50cnlQb2ludHMocGFja2FnZVBhdGgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnRyeVBvaW50cy5wdXNoKC4uLmdldEVudHJ5UG9pbnRzRm9yUGFja2FnZShwYWNrYWdlUGF0aCkpO1xuXG4gICAgICAgICAgLy8gQWxzbyBjaGVjayBmb3IgYW55IG5lc3RlZCBub2RlX21vZHVsZXMgaW4gdGhpcyBwYWNrYWdlXG4gICAgICAgICAgY29uc3QgbmVzdGVkTm9kZU1vZHVsZXNQYXRoID0gcGF0aC5yZXNvbHZlKHBhY2thZ2VQYXRoLCAnbm9kZV9tb2R1bGVzJyk7XG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobmVzdGVkTm9kZU1vZHVsZXNQYXRoKSkge1xuICAgICAgICAgICAgZW50cnlQb2ludHMucHVzaCguLi53YWxrRGlyZWN0b3J5Rm9yRW50cnlQb2ludHMobmVzdGVkTm9kZU1vZHVsZXNQYXRoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgcmV0dXJuIGVudHJ5UG9pbnRzO1xufVxuXG4vKipcbiAqIFJlY3Vyc2UgdGhlIGZvbGRlciBzdHJ1Y3R1cmUgbG9va2luZyBmb3IgYWxsIHRoZSBlbnRyeSBwb2ludHNcbiAqIEBwYXJhbSBwYWNrYWdlUGF0aCBUaGUgYWJzb2x1dGUgcGF0aCB0byBhbiBucG0gcGFja2FnZSB0aGF0IG1heSBjb250YWluIGVudHJ5IHBvaW50c1xuICogQHJldHVybnMgQW4gYXJyYXkgb2YgZW50cnkgcG9pbnRzIHRoYXQgd2VyZSBkaXNjb3ZlcmVkLlxuICovXG5mdW5jdGlvbiBnZXRFbnRyeVBvaW50c0ZvclBhY2thZ2UocGFja2FnZVBhdGg6IHN0cmluZyk6IEVudHJ5UG9pbnRbXSB7XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiBFbnRyeVBvaW50W10gPSBbXTtcblxuICAvLyBUcnkgdG8gZ2V0IGFuIGVudHJ5IHBvaW50IGZyb20gdGhlIHRvcCBsZXZlbCBwYWNrYWdlIGRpcmVjdG9yeVxuICBjb25zdCB0b3BMZXZlbEVudHJ5UG9pbnQgPSBnZXRFbnRyeVBvaW50SW5mbyhwYWNrYWdlUGF0aCwgcGFja2FnZVBhdGgpO1xuICBpZiAodG9wTGV2ZWxFbnRyeVBvaW50ICE9PSBudWxsKSB7XG4gICAgZW50cnlQb2ludHMucHVzaCh0b3BMZXZlbEVudHJ5UG9pbnQpO1xuICB9XG5cbiAgLy8gTm93IHNlYXJjaCBhbGwgdGhlIGRpcmVjdG9yaWVzIG9mIHRoaXMgcGFja2FnZSBmb3IgcG9zc2libGUgZW50cnkgcG9pbnRzXG4gIHdhbGtEaXJlY3RvcnkocGFja2FnZVBhdGgsIHN1YmRpciA9PiB7XG4gICAgY29uc3Qgc3ViRW50cnlQb2ludCA9IGdldEVudHJ5UG9pbnRJbmZvKHBhY2thZ2VQYXRoLCBzdWJkaXIpO1xuICAgIGlmIChzdWJFbnRyeVBvaW50ICE9PSBudWxsKSB7XG4gICAgICBlbnRyeVBvaW50cy5wdXNoKHN1YkVudHJ5UG9pbnQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGVudHJ5UG9pbnRzO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHdhbGsgYSBkaXJlY3RvcnkgYW5kIGl0cyBzdWItZGlyZWN0b3JpZXMsIGFwcGx5aW5nIGEgZ2l2ZW5cbiAqIGZ1bmN0aW9uIHRvIGVhY2ggZGlyZWN0b3J5LlxuICogQHBhcmFtIGRpciB0aGUgZGlyZWN0b3J5IHRvIHJlY3Vyc2l2ZWx5IHdhbGsuXG4gKiBAcGFyYW0gZm4gdGhlIGZ1bmN0aW9uIHRvIGFwcGx5IHRvIGVhY2ggZGlyZWN0b3J5LlxuICovXG5mdW5jdGlvbiB3YWxrRGlyZWN0b3J5KGRpcjogc3RyaW5nLCBmbjogKGRpcjogc3RyaW5nKSA9PiB2b2lkKSB7XG4gIHJldHVybiBmc1xuICAgICAgLnJlYWRkaXJTeW5jKGRpcilcbiAgICAgIC8vIE5vdCBpbnRlcmVzdGVkIGluIGhpZGRlbiBmaWxlc1xuICAgICAgLmZpbHRlcihwID0+ICFwLnN0YXJ0c1dpdGgoJy4nKSlcbiAgICAgIC8vIElnbm9yZSBub2RlX21vZHVsZXNcbiAgICAgIC5maWx0ZXIocCA9PiBwICE9PSAnbm9kZV9tb2R1bGVzJylcbiAgICAgIC8vIE9ubHkgaW50ZXJlc3RlZCBpbiBkaXJlY3RvcmllcyAoYW5kIG9ubHkgdGhvc2UgdGhhdCBhcmUgbm90IHN5bWxpbmtzKVxuICAgICAgLmZpbHRlcihwID0+IHtcbiAgICAgICAgY29uc3Qgc3RhdCA9IGZzLmxzdGF0U3luYyhwYXRoLnJlc29sdmUoZGlyLCBwKSk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRGlyZWN0b3J5KCkgJiYgIXN0YXQuaXNTeW1ib2xpY0xpbmsoKTtcbiAgICAgIH0pXG4gICAgICAuZm9yRWFjaChzdWJkaXIgPT4ge1xuICAgICAgICBzdWJkaXIgPSBwYXRoLnJlc29sdmUoZGlyLCBzdWJkaXIpO1xuICAgICAgICBmbihzdWJkaXIpO1xuICAgICAgICB3YWxrRGlyZWN0b3J5KHN1YmRpciwgZm4pO1xuICAgICAgfSk7XG59XG4iXX0=