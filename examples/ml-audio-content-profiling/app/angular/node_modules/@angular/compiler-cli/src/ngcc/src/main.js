(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/main", ["require", "exports", "canonical-path", "yargs", "@angular/compiler-cli/src/ngcc/src/packages/dependency_host", "@angular/compiler-cli/src/ngcc/src/packages/dependency_resolver", "@angular/compiler-cli/src/ngcc/src/packages/entry_point_finder", "@angular/compiler-cli/src/ngcc/src/packages/transformer"], factory);
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
    var path = require("canonical-path");
    var yargs = require("yargs");
    var dependency_host_1 = require("@angular/compiler-cli/src/ngcc/src/packages/dependency_host");
    var dependency_resolver_1 = require("@angular/compiler-cli/src/ngcc/src/packages/dependency_resolver");
    var entry_point_finder_1 = require("@angular/compiler-cli/src/ngcc/src/packages/entry_point_finder");
    var transformer_1 = require("@angular/compiler-cli/src/ngcc/src/packages/transformer");
    function mainNgcc(args) {
        var options = yargs
            .option('s', {
            alias: 'source',
            describe: 'A path to the root folder to compile.',
            default: './node_modules'
        })
            .option('f', {
            alias: 'formats',
            array: true,
            describe: 'An array of formats to compile.',
            default: ['fesm2015', 'esm2015', 'fesm5', 'esm5']
        })
            .option('t', {
            alias: 'target',
            describe: 'A path to a root folder where the compiled files will be written.',
            defaultDescription: 'The `source` folder.'
        })
            .help()
            .parse(args);
        var sourcePath = path.resolve(options['s']);
        var formats = options['f'];
        var targetPath = options['t'] || sourcePath;
        var transformer = new transformer_1.Transformer(sourcePath, targetPath);
        var host = new dependency_host_1.DependencyHost();
        var resolver = new dependency_resolver_1.DependencyResolver(host);
        var finder = new entry_point_finder_1.EntryPointFinder(resolver);
        try {
            var entryPoints = finder.findEntryPoints(sourcePath).entryPoints;
            entryPoints.forEach(function (entryPoint) { return formats.forEach(function (format) { return transformer.transform(entryPoint, format); }); });
        }
        catch (e) {
            console.error(e.stack);
            return 1;
        }
        return 0;
    }
    exports.mainNgcc = mainNgcc;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmdjYy9zcmMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILHFDQUF1QztJQUV2Qyw2QkFBK0I7SUFFL0IsK0ZBQTBEO0lBQzFELHVHQUFrRTtJQUVsRSxxR0FBK0Q7SUFDL0QsdUZBQW1EO0lBRW5ELFNBQWdCLFFBQVEsQ0FBQyxJQUFjO1FBQ3JDLElBQU0sT0FBTyxHQUNULEtBQUs7YUFDQSxNQUFNLENBQUMsR0FBRyxFQUFFO1lBQ1gsS0FBSyxFQUFFLFFBQVE7WUFDZixRQUFRLEVBQUUsdUNBQXVDO1lBQ2pELE9BQU8sRUFBRSxnQkFBZ0I7U0FDMUIsQ0FBQzthQUNELE1BQU0sQ0FBQyxHQUFHLEVBQUU7WUFDWCxLQUFLLEVBQUUsU0FBUztZQUNoQixLQUFLLEVBQUUsSUFBSTtZQUNYLFFBQVEsRUFBRSxpQ0FBaUM7WUFDM0MsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1NBQ2xELENBQUM7YUFDRCxNQUFNLENBQUMsR0FBRyxFQUFFO1lBQ1gsS0FBSyxFQUFFLFFBQVE7WUFDZixRQUFRLEVBQUUsbUVBQW1FO1lBQzdFLGtCQUFrQixFQUFFLHNCQUFzQjtTQUMzQyxDQUFDO2FBQ0QsSUFBSSxFQUFFO2FBQ04sS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXJCLElBQU0sVUFBVSxHQUFXLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdEQsSUFBTSxPQUFPLEdBQXVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqRCxJQUFNLFVBQVUsR0FBVyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDO1FBRXRELElBQU0sV0FBVyxHQUFHLElBQUkseUJBQVcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDNUQsSUFBTSxJQUFJLEdBQUcsSUFBSSxnQ0FBYyxFQUFFLENBQUM7UUFDbEMsSUFBTSxRQUFRLEdBQUcsSUFBSSx3Q0FBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxJQUFNLE1BQU0sR0FBRyxJQUFJLHFDQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlDLElBQUk7WUFDSyxJQUFBLDREQUFXLENBQXVDO1lBQ3pELFdBQVcsQ0FBQyxPQUFPLENBQ2YsVUFBQSxVQUFVLElBQUksT0FBQSxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQUEsTUFBTSxJQUFJLE9BQUEsV0FBVyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLEVBQXpDLENBQXlDLENBQUMsRUFBcEUsQ0FBb0UsQ0FBQyxDQUFDO1NBQ3pGO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QixPQUFPLENBQUMsQ0FBQztTQUNWO1FBRUQsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBekNELDRCQXlDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAnY2Fub25pY2FsLXBhdGgnO1xuaW1wb3J0IHtleGlzdHNTeW5jLCBsc3RhdFN5bmMsIHJlYWRGaWxlU3luYywgcmVhZGRpclN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHlhcmdzIGZyb20gJ3lhcmdzJztcblxuaW1wb3J0IHtEZXBlbmRlbmN5SG9zdH0gZnJvbSAnLi9wYWNrYWdlcy9kZXBlbmRlbmN5X2hvc3QnO1xuaW1wb3J0IHtEZXBlbmRlbmN5UmVzb2x2ZXJ9IGZyb20gJy4vcGFja2FnZXMvZGVwZW5kZW5jeV9yZXNvbHZlcic7XG5pbXBvcnQge0VudHJ5UG9pbnRGb3JtYXR9IGZyb20gJy4vcGFja2FnZXMvZW50cnlfcG9pbnQnO1xuaW1wb3J0IHtFbnRyeVBvaW50RmluZGVyfSBmcm9tICcuL3BhY2thZ2VzL2VudHJ5X3BvaW50X2ZpbmRlcic7XG5pbXBvcnQge1RyYW5zZm9ybWVyfSBmcm9tICcuL3BhY2thZ2VzL3RyYW5zZm9ybWVyJztcblxuZXhwb3J0IGZ1bmN0aW9uIG1haW5OZ2NjKGFyZ3M6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgY29uc3Qgb3B0aW9ucyA9XG4gICAgICB5YXJnc1xuICAgICAgICAgIC5vcHRpb24oJ3MnLCB7XG4gICAgICAgICAgICBhbGlhczogJ3NvdXJjZScsXG4gICAgICAgICAgICBkZXNjcmliZTogJ0EgcGF0aCB0byB0aGUgcm9vdCBmb2xkZXIgdG8gY29tcGlsZS4nLFxuICAgICAgICAgICAgZGVmYXVsdDogJy4vbm9kZV9tb2R1bGVzJ1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLm9wdGlvbignZicsIHtcbiAgICAgICAgICAgIGFsaWFzOiAnZm9ybWF0cycsXG4gICAgICAgICAgICBhcnJheTogdHJ1ZSxcbiAgICAgICAgICAgIGRlc2NyaWJlOiAnQW4gYXJyYXkgb2YgZm9ybWF0cyB0byBjb21waWxlLicsXG4gICAgICAgICAgICBkZWZhdWx0OiBbJ2Zlc20yMDE1JywgJ2VzbTIwMTUnLCAnZmVzbTUnLCAnZXNtNSddXG4gICAgICAgICAgfSlcbiAgICAgICAgICAub3B0aW9uKCd0Jywge1xuICAgICAgICAgICAgYWxpYXM6ICd0YXJnZXQnLFxuICAgICAgICAgICAgZGVzY3JpYmU6ICdBIHBhdGggdG8gYSByb290IGZvbGRlciB3aGVyZSB0aGUgY29tcGlsZWQgZmlsZXMgd2lsbCBiZSB3cml0dGVuLicsXG4gICAgICAgICAgICBkZWZhdWx0RGVzY3JpcHRpb246ICdUaGUgYHNvdXJjZWAgZm9sZGVyLidcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5oZWxwKClcbiAgICAgICAgICAucGFyc2UoYXJncyk7XG5cbiAgY29uc3Qgc291cmNlUGF0aDogc3RyaW5nID0gcGF0aC5yZXNvbHZlKG9wdGlvbnNbJ3MnXSk7XG4gIGNvbnN0IGZvcm1hdHM6IEVudHJ5UG9pbnRGb3JtYXRbXSA9IG9wdGlvbnNbJ2YnXTtcbiAgY29uc3QgdGFyZ2V0UGF0aDogc3RyaW5nID0gb3B0aW9uc1sndCddIHx8IHNvdXJjZVBhdGg7XG5cbiAgY29uc3QgdHJhbnNmb3JtZXIgPSBuZXcgVHJhbnNmb3JtZXIoc291cmNlUGF0aCwgdGFyZ2V0UGF0aCk7XG4gIGNvbnN0IGhvc3QgPSBuZXcgRGVwZW5kZW5jeUhvc3QoKTtcbiAgY29uc3QgcmVzb2x2ZXIgPSBuZXcgRGVwZW5kZW5jeVJlc29sdmVyKGhvc3QpO1xuICBjb25zdCBmaW5kZXIgPSBuZXcgRW50cnlQb2ludEZpbmRlcihyZXNvbHZlcik7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7ZW50cnlQb2ludHN9ID0gZmluZGVyLmZpbmRFbnRyeVBvaW50cyhzb3VyY2VQYXRoKTtcbiAgICBlbnRyeVBvaW50cy5mb3JFYWNoKFxuICAgICAgICBlbnRyeVBvaW50ID0+IGZvcm1hdHMuZm9yRWFjaChmb3JtYXQgPT4gdHJhbnNmb3JtZXIudHJhbnNmb3JtKGVudHJ5UG9pbnQsIGZvcm1hdCkpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICByZXR1cm4gMDtcbn1cbiJdfQ==