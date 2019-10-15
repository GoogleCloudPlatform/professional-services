(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/packages/transformer", ["require", "exports", "tslib", "canonical-path", "fs", "shelljs", "typescript", "@angular/compiler-cli/src/ngcc/src/analysis/decoration_analyzer", "@angular/compiler-cli/src/ngcc/src/analysis/switch_marker_analyzer", "@angular/compiler-cli/src/ngcc/src/host/dts_mapper", "@angular/compiler-cli/src/ngcc/src/host/esm2015_host", "@angular/compiler-cli/src/ngcc/src/host/esm5_host", "@angular/compiler-cli/src/ngcc/src/host/fesm2015_host", "@angular/compiler-cli/src/ngcc/src/rendering/esm2015_renderer", "@angular/compiler-cli/src/ngcc/src/rendering/esm5_renderer", "@angular/compiler-cli/src/ngcc/src/rendering/fesm2015_renderer", "@angular/compiler-cli/src/ngcc/src/packages/build_marker"], factory);
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
    var canonical_path_1 = require("canonical-path");
    var fs_1 = require("fs");
    var shelljs_1 = require("shelljs");
    var ts = require("typescript");
    var decoration_analyzer_1 = require("@angular/compiler-cli/src/ngcc/src/analysis/decoration_analyzer");
    var switch_marker_analyzer_1 = require("@angular/compiler-cli/src/ngcc/src/analysis/switch_marker_analyzer");
    var dts_mapper_1 = require("@angular/compiler-cli/src/ngcc/src/host/dts_mapper");
    var esm2015_host_1 = require("@angular/compiler-cli/src/ngcc/src/host/esm2015_host");
    var esm5_host_1 = require("@angular/compiler-cli/src/ngcc/src/host/esm5_host");
    var fesm2015_host_1 = require("@angular/compiler-cli/src/ngcc/src/host/fesm2015_host");
    var esm2015_renderer_1 = require("@angular/compiler-cli/src/ngcc/src/rendering/esm2015_renderer");
    var esm5_renderer_1 = require("@angular/compiler-cli/src/ngcc/src/rendering/esm5_renderer");
    var fesm2015_renderer_1 = require("@angular/compiler-cli/src/ngcc/src/rendering/fesm2015_renderer");
    var build_marker_1 = require("@angular/compiler-cli/src/ngcc/src/packages/build_marker");
    /**
     * A Package is stored in a directory on disk and that directory can contain one or more package
     * formats - e.g. fesm2015, UMD, etc. Additionally, each package provides typings (`.d.ts` files).
     *
     * Each of these formats exposes one or more entry points, which are source files that need to be
     * parsed to identify the decorated exported classes that need to be analyzed and compiled by one or
     * more `DecoratorHandler` objects.
     *
     * Each entry point to a package is identified by a `SourceFile` that can be parsed and analyzed to
     * identify classes that need to be transformed; and then finally rendered and written to disk.
     * The actual file which needs to be transformed depends upon the package format.
     *
     * Along with the source files, the corresponding source maps (either inline or external) and
     * `.d.ts` files are transformed accordingly.
     *
     * - Flat file packages have all the classes in a single file.
     * - Other packages may re-export classes from other non-entry point files.
     * - Some formats may contain multiple "modules" in a single file.
     */
    var Transformer = /** @class */ (function () {
        function Transformer(sourcePath, targetPath) {
            this.sourcePath = sourcePath;
            this.targetPath = targetPath;
        }
        Transformer.prototype.transform = function (entryPoint, format) {
            var _this = this;
            if (build_marker_1.checkMarkerFile(entryPoint, format)) {
                return;
            }
            var options = {
                allowJs: true,
                maxNodeModuleJsDepth: Infinity,
                rootDir: entryPoint.path,
            };
            // Create the TS program and necessary helpers.
            // TODO : create a custom compiler host that reads from .bak files if available.
            var host = ts.createCompilerHost(options);
            var rootDirs = this.getRootDirs(host, options);
            var entryPointFilePath = entryPoint[format];
            if (!entryPointFilePath) {
                throw new Error("Missing entry point file for format, " + format + ", in package, " + entryPoint.path + ".");
            }
            var isCore = entryPoint.name === '@angular/core';
            var r3SymbolsPath = isCore ? this.findR3SymbolsPath(canonical_path_1.dirname(entryPointFilePath)) : null;
            var rootPaths = r3SymbolsPath ? [entryPointFilePath, r3SymbolsPath] : [entryPointFilePath];
            var packageProgram = ts.createProgram(rootPaths, options, host);
            var dtsMapper = new dts_mapper_1.DtsMapper(canonical_path_1.dirname(entryPointFilePath), canonical_path_1.dirname(entryPoint.typings));
            var reflectionHost = this.getHost(isCore, format, packageProgram, dtsMapper);
            var r3SymbolsFile = r3SymbolsPath && packageProgram.getSourceFile(r3SymbolsPath) || null;
            // Parse and analyze the files.
            var _a = this.analyzeProgram(packageProgram, reflectionHost, rootDirs, isCore), decorationAnalyses = _a.decorationAnalyses, switchMarkerAnalyses = _a.switchMarkerAnalyses;
            // Transform the source files and source maps.
            var renderer = this.getRenderer(format, packageProgram, reflectionHost, isCore, r3SymbolsFile, dtsMapper);
            var renderedFiles = renderer.renderProgram(packageProgram, decorationAnalyses, switchMarkerAnalyses);
            // Write out all the transformed files.
            renderedFiles.forEach(function (file) { return _this.writeFile(file); });
            // Write the built-with-ngcc marker
            build_marker_1.writeMarkerFile(entryPoint, format);
        };
        Transformer.prototype.getRootDirs = function (host, options) {
            if (options.rootDirs !== undefined) {
                return options.rootDirs;
            }
            else if (options.rootDir !== undefined) {
                return [options.rootDir];
            }
            else {
                return [host.getCurrentDirectory()];
            }
        };
        Transformer.prototype.getHost = function (isCore, format, program, dtsMapper) {
            switch (format) {
                case 'esm2015':
                    return new esm2015_host_1.Esm2015ReflectionHost(isCore, program.getTypeChecker(), dtsMapper);
                case 'fesm2015':
                    return new fesm2015_host_1.Fesm2015ReflectionHost(isCore, program.getTypeChecker());
                case 'esm5':
                case 'fesm5':
                    return new esm5_host_1.Esm5ReflectionHost(isCore, program.getTypeChecker());
                default:
                    throw new Error("Relection host for \"" + format + "\" not yet implemented.");
            }
        };
        Transformer.prototype.getRenderer = function (format, program, host, isCore, rewriteCoreImportsTo, dtsMapper) {
            switch (format) {
                case 'esm2015':
                    return new esm2015_renderer_1.Esm2015Renderer(host, isCore, rewriteCoreImportsTo, this.sourcePath, this.targetPath, dtsMapper);
                case 'fesm2015':
                    return new fesm2015_renderer_1.Fesm2015Renderer(host, isCore, rewriteCoreImportsTo, this.sourcePath, this.targetPath);
                case 'esm5':
                case 'fesm5':
                    return new esm5_renderer_1.Esm5Renderer(host, isCore, rewriteCoreImportsTo, this.sourcePath, this.targetPath);
                default:
                    throw new Error("Renderer for \"" + format + "\" not yet implemented.");
            }
        };
        Transformer.prototype.analyzeProgram = function (program, reflectionHost, rootDirs, isCore) {
            var decorationAnalyzer = new decoration_analyzer_1.DecorationAnalyzer(program.getTypeChecker(), reflectionHost, rootDirs, isCore);
            var switchMarkerAnalyzer = new switch_marker_analyzer_1.SwitchMarkerAnalyzer(reflectionHost);
            return {
                decorationAnalyses: decorationAnalyzer.analyzeProgram(program),
                switchMarkerAnalyses: switchMarkerAnalyzer.analyzeProgram(program),
            };
        };
        Transformer.prototype.writeFile = function (file) {
            shelljs_1.mkdir('-p', canonical_path_1.dirname(file.path));
            var backPath = file.path + '.bak';
            if (fs_1.existsSync(file.path) && !fs_1.existsSync(backPath)) {
                shelljs_1.mv(file.path, backPath);
            }
            fs_1.writeFileSync(file.path, file.contents, 'utf8');
        };
        Transformer.prototype.findR3SymbolsPath = function (directory) {
            var e_1, _a;
            var r3SymbolsFilePath = canonical_path_1.resolve(directory, 'r3_symbols.js');
            if (fs_1.existsSync(r3SymbolsFilePath)) {
                return r3SymbolsFilePath;
            }
            var subDirectories = fs_1.readdirSync(directory)
                // Not interested in hidden files
                .filter(function (p) { return !p.startsWith('.'); })
                // Ignore node_modules
                .filter(function (p) { return p !== 'node_modules'; })
                // Only interested in directories (and only those that are not symlinks)
                .filter(function (p) {
                var stat = fs_1.lstatSync(canonical_path_1.resolve(directory, p));
                return stat.isDirectory() && !stat.isSymbolicLink();
            });
            try {
                for (var subDirectories_1 = tslib_1.__values(subDirectories), subDirectories_1_1 = subDirectories_1.next(); !subDirectories_1_1.done; subDirectories_1_1 = subDirectories_1.next()) {
                    var subDirectory = subDirectories_1_1.value;
                    var r3SymbolsFilePath_1 = this.findR3SymbolsPath(canonical_path_1.resolve(directory, subDirectory));
                    if (r3SymbolsFilePath_1) {
                        return r3SymbolsFilePath_1;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (subDirectories_1_1 && !subDirectories_1_1.done && (_a = subDirectories_1.return)) _a.call(subDirectories_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return null;
        };
        return Transformer;
    }());
    exports.Transformer = Transformer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25nY2Mvc3JjL3BhY2thZ2VzL3RyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILGlEQUFnRDtJQUNoRCx5QkFBcUU7SUFDckUsbUNBQWtDO0lBQ2xDLCtCQUFpQztJQUVqQyx1R0FBbUU7SUFDbkUsNkdBQXdFO0lBQ3hFLGlGQUE2QztJQUM3QyxxRkFBMkQ7SUFDM0QsK0VBQXFEO0lBQ3JELHVGQUE2RDtJQUU3RCxrR0FBOEQ7SUFDOUQsNEZBQXdEO0lBQ3hELG9HQUFnRTtJQUdoRSx5RkFBZ0U7SUFHaEU7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQWtCRztJQUNIO1FBQ0UscUJBQW9CLFVBQWtCLEVBQVUsVUFBa0I7WUFBOUMsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUFVLGVBQVUsR0FBVixVQUFVLENBQVE7UUFBRyxDQUFDO1FBRXRFLCtCQUFTLEdBQVQsVUFBVSxVQUFzQixFQUFFLE1BQXdCO1lBQTFELGlCQTJDQztZQTFDQyxJQUFJLDhCQUFlLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUN2QyxPQUFPO2FBQ1I7WUFFRCxJQUFNLE9BQU8sR0FBdUI7Z0JBQ2xDLE9BQU8sRUFBRSxJQUFJO2dCQUNiLG9CQUFvQixFQUFFLFFBQVE7Z0JBQzlCLE9BQU8sRUFBRSxVQUFVLENBQUMsSUFBSTthQUN6QixDQUFDO1lBRUYsK0NBQStDO1lBQy9DLGdGQUFnRjtZQUNoRixJQUFNLElBQUksR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUMsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakQsSUFBTSxrQkFBa0Is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Q3ZFLE1BQU0sQ0FBQyxVQUFBLENBQUM7Z0JBQ1AsSUFBTSxJQUFJLEdBQUcsY0FBUyxDQUFDLHdCQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDOztnQkFFWCxLQUEyQixJQUFBLG1CQUFBLGlCQUFBLGNBQWMsQ0FBQSw4Q0FBQSwwRUFBRTtvQkFBdEMsSUFBTSxZQUFZLDJCQUFBO29CQUNyQixJQUFNLG1CQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyx3QkFBTyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUNuRixJQUFJLG1CQUFpQixFQUFFO3dCQUNyQixPQUFPLG1CQUFpQixDQUFDO3FCQUMxQjtpQkFDRjs7Ozs7Ozs7O1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0gsa0JBQUM7SUFBRCxDQUFDLEFBNUlELElBNElDO0lBNUlZLGtDQUFXIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtkaXJuYW1lLCByZXNvbHZlfSBmcm9tICdjYW5vbmljYWwtcGF0aCc7XG5pbXBvcnQge2V4aXN0c1N5bmMsIGxzdGF0U3luYywgcmVhZGRpclN5bmMsIHdyaXRlRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7bWtkaXIsIG12fSBmcm9tICdzaGVsbGpzJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0RlY29yYXRpb25BbmFseXplcn0gZnJvbSAnLi4vYW5hbHlzaXMvZGVjb3JhdGlvbl9hbmFseXplcic7XG5pbXBvcnQge1N3aXRjaE1hcmtlckFuYWx5emVyfSBmcm9tICcuLi9hbmFseXNpcy9zd2l0Y2hfbWFya2VyX2FuYWx5emVyJztcbmltcG9ydCB7RHRzTWFwcGVyfSBmcm9tICcuLi9ob3N0L2R0c19tYXBwZXInO1xuaW1wb3J0IHtFc20yMDE1UmVmbGVjdGlvbkhvc3R9IGZyb20gJy4uL2hvc3QvZXNtMjAxNV9ob3N0JztcbmltcG9ydCB7RXNtNVJlZmxlY3Rpb25Ib3N0fSBmcm9tICcuLi9ob3N0L2VzbTVfaG9zdCc7XG5pbXBvcnQge0Zlc20yMDE1UmVmbGVjdGlvbkhvc3R9IGZyb20gJy4uL2hvc3QvZmVzbTIwMTVfaG9zdCc7XG5pbXBvcnQge05nY2NSZWZsZWN0aW9uSG9zdH0gZnJvbSAnLi4vaG9zdC9uZ2NjX2hvc3QnO1xuaW1wb3J0IHtFc20yMDE1UmVuZGVyZXJ9IGZyb20gJy4uL3JlbmRlcmluZy9lc20yMDE1X3JlbmRlcmVyJztcbmltcG9ydCB7RXNtNVJlbmRlcmVyfSBmcm9tICcuLi9yZW5kZXJpbmcvZXNtNV9yZW5kZXJlcic7XG5pbXBvcnQge0Zlc20yMDE1UmVuZGVyZXJ9IGZyb20gJy4uL3JlbmRlcmluZy9mZXNtMjAxNV9yZW5kZXJlcic7XG5pbXBvcnQge0ZpbGVJbmZvLCBSZW5kZXJlcn0gZnJvbSAnLi4vcmVuZGVyaW5nL3JlbmRlcmVyJztcblxuaW1wb3J0IHtjaGVja01hcmtlckZpbGUsIHdyaXRlTWFya2VyRmlsZX0gZnJvbSAnLi9idWlsZF9tYXJrZXInO1xuaW1wb3J0IHtFbnRyeVBvaW50LCBFbnRyeVBvaW50Rm9ybWF0fSBmcm9tICcuL2VudHJ5X3BvaW50JztcblxuLyoqXG4gKiBBIFBhY2thZ2UgaXMgc3RvcmVkIGluIGEgZGlyZWN0b3J5IG9uIGRpc2sgYW5kIHRoYXQgZGlyZWN0b3J5IGNhbiBjb250YWluIG9uZSBvciBtb3JlIHBhY2thZ2VcbiAqIGZvcm1hdHMgLSBlLmcuIGZlc20yMDE1LCBVTUQsIGV0Yy4gQWRkaXRpb25hbGx5LCBlYWNoIHBhY2thZ2UgcHJvdmlkZXMgdHlwaW5ncyAoYC5kLnRzYCBmaWxlcykuXG4gKlxuICogRWFjaCBvZiB0aGVzZSBmb3JtYXRzIGV4cG9zZXMgb25lIG9yIG1vcmUgZW50cnkgcG9pbnRzLCB3aGljaCBhcmUgc291cmNlIGZpbGVzIHRoYXQgbmVlZCB0byBiZVxuICogcGFyc2VkIHRvIGlkZW50aWZ5IHRoZSBkZWNvcmF0ZWQgZXhwb3J0ZWQgY2xhc3NlcyB0aGF0IG5lZWQgdG8gYmUgYW5hbHl6ZWQgYW5kIGNvbXBpbGVkIGJ5IG9uZSBvclxuICogbW9yZSBgRGVjb3JhdG9ySGFuZGxlcmAgb2JqZWN0cy5cbiAqXG4gKiBFYWNoIGVudHJ5IHBvaW50IHRvIGEgcGFja2FnZSBpcyBpZGVudGlmaWVkIGJ5IGEgYFNvdXJjZUZpbGVgIHRoYXQgY2FuIGJlIHBhcnNlZCBhbmQgYW5hbHl6ZWQgdG9cbiAqIGlkZW50aWZ5IGNsYXNzZXMgdGhhdCBuZWVkIHRvIGJlIHRyYW5zZm9ybWVkOyBhbmQgdGhlbiBmaW5hbGx5IHJlbmRlcmVkIGFuZCB3cml0dGVuIHRvIGRpc2suXG4gKiBUaGUgYWN0dWFsIGZpbGUgd2hpY2ggbmVlZHMgdG8gYmUgdHJhbnNmb3JtZWQgZGVwZW5kcyB1cG9uIHRoZSBwYWNrYWdlIGZvcm1hdC5cbiAqXG4gKiBBbG9uZyB3aXRoIHRoZSBzb3VyY2UgZmlsZXMsIHRoZSBjb3JyZXNwb25kaW5nIHNvdXJjZSBtYXBzIChlaXRoZXIgaW5saW5lIG9yIGV4dGVybmFsKSBhbmRcbiAqIGAuZC50c2AgZmlsZXMgYXJlIHRyYW5zZm9ybWVkIGFjY29yZGluZ2x5LlxuICpcbiAqIC0gRmxhdCBmaWxlIHBhY2thZ2VzIGhhdmUgYWxsIHRoZSBjbGFzc2VzIGluIGEgc2luZ2xlIGZpbGUuXG4gKiAtIE90aGVyIHBhY2thZ2VzIG1heSByZS1leHBvcnQgY2xhc3NlcyBmcm9tIG90aGVyIG5vbi1lbnRyeSBwb2ludCBmaWxlcy5cbiAqIC0gU29tZSBmb3JtYXRzIG1heSBjb250YWluIG11bHRpcGxlIFwibW9kdWxlc1wiIGluIGEgc2luZ2xlIGZpbGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBUcmFuc2Zvcm1lciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgc291cmNlUGF0aDogc3RyaW5nLCBwcml2YXRlIHRhcmdldFBhdGg6IHN0cmluZykge31cblxuICB0cmFuc2Zvcm0oZW50cnlQb2ludDogRW50cnlQb2ludCwgZm9ybWF0OiBFbnRyeVBvaW50Rm9ybWF0KTogdm9pZCB7XG4gICAgaWYgKGNoZWNrTWFya2VyRmlsZShlbnRyeVBvaW50LCBmb3JtYXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zID0ge1xuICAgICAgYWxsb3dKczogdHJ1ZSxcbiAgICAgIG1heE5vZGVNb2R1bGVKc0RlcHRoOiBJbmZpbml0eSxcbiAgICAgIHJvb3REaXI6IGVudHJ5UG9pbnQucGF0aCxcbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBUUyBwcm9ncmFtIGFuZCBuZWNlc3NhcnkgaGVscGVycy5cbiAgICAvLyBUT0RPIDogY3JlYXRlIGEgY3VzdG9tIGNvbXBpbGVyIGhvc3QgdGhhdCByZWFkcyBmcm9tIC5iYWsgZmlsZXMgaWYgYXZhaWxhYmxlLlxuICAgIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3Qob3B0aW9ucyk7XG4gICAgY29uc3Qgcm9vdERpcnMgPSB0aGlzLmdldFJvb3REaXJzKGhvc3QsIG9wdGlvbnMpO1xuICAgIGNvbnN0IGVudHJ5UG9pbnRGaWxlUGF0aCA9IGVudHJ5UG9pbnRbZm9ybWF0XTtcbiAgICBpZiAoIWVudHJ5UG9pbnRGaWxlUGF0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBNaXNzaW5nIGVudHJ5IHBvaW50IGZpbGUgZm9yIGZvcm1hdCwgJHtmb3JtYXR9LCBpbiBwYWNrYWdlLCAke2VudHJ5UG9pbnQucGF0aH0uYCk7XG4gICAgfVxuICAgIGNvbnN0IGlzQ29yZSA9IGVudHJ5UG9pbnQubmFtZSA9PT0gJ0Bhbmd1bGFyL2NvcmUnO1xuICAgIGNvbnN0IHIzU3ltYm9sc1BhdGggPSBpc0NvcmUgPyB0aGlzLmZpbmRSM1N5bWJvbHNQYXRoKGRpcm5hbWUoZW50cnlQb2ludEZpbGVQYXRoKSkgOiBudWxsO1xuICAgIGNvbnN0IHJvb3RQYXRocyA9IHIzU3ltYm9sc1BhdGggPyBbZW50cnlQb2ludEZpbGVQYXRoLCByM1N5bWJvbHNQYXRoXSA6IFtlbnRyeVBvaW50RmlsZVBhdGhdO1xuICAgIGNvbnN0IHBhY2thZ2VQcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShyb290UGF0aHMsIG9wdGlvbnMsIGhvc3QpO1xuICAgIGNvbnN0IGR0c01hcHBlciA9IG5ldyBEdHNNYXBwZXIoZGlybmFtZShlbnRyeVBvaW50RmlsZVBhdGgpLCBkaXJuYW1lKGVudHJ5UG9pbnQudHlwaW5ncykpO1xuICAgIGNvbnN0IHJlZmxlY3Rpb25Ib3N0ID0gdGhpcy5nZXRIb3N0KGlzQ29yZSwgZm9ybWF0LCBwYWNrYWdlUHJvZ3JhbSwgZHRzTWFwcGVyKTtcbiAgICBjb25zdCByM1N5bWJvbHNGaWxlID0gcjNTeW1ib2xzUGF0aCAmJiBwYWNrYWdlUHJvZ3JhbS5nZXRTb3VyY2VGaWxlKHIzU3ltYm9sc1BhdGgpIHx8IG51bGw7XG5cbiAgICAvLyBQYXJzZSBhbmQgYW5hbHl6ZSB0aGUgZmlsZXMuXG4gICAgY29uc3Qge2RlY29yYXRpb25BbmFseXNlcywgc3dpdGNoTWFya2VyQW5hbHlzZXN9ID1cbiAgICAgICAgdGhpcy5hbmFseXplUHJvZ3JhbShwYWNrYWdlUHJvZ3JhbSwgcmVmbGVjdGlvbkhvc3QsIHJvb3REaXJzLCBpc0NvcmUpO1xuXG4gICAgLy8gVHJhbnNmb3JtIHRoZSBzb3VyY2UgZmlsZXMgYW5kIHNvdXJjZSBtYXBzLlxuICAgIGNvbnN0IHJlbmRlcmVyID1cbiAgICAgICAgdGhpcy5nZXRSZW5kZXJlcihmb3JtYXQsIHBhY2thZ2VQcm9ncmFtLCByZWZsZWN0aW9uSG9zdCwgaXNDb3JlLCByM1N5bWJvbHNGaWxlLCBkdHNNYXBwZXIpO1xuICAgIGNvbnN0IHJlbmRlcmVkRmlsZXMgPVxuICAgICAgICByZW5kZXJlci5yZW5kZXJQcm9ncmFtKHBhY2thZ2VQcm9ncmFtLCBkZWNvcmF0aW9uQW5hbHlzZXMsIHN3aXRjaE1hcmtlckFuYWx5c2VzKTtcblxuICAgIC8vIFdyaXRlIG91dCBhbGwgdGhlIHRyYW5zZm9ybWVkIGZpbGVzLlxuICAgIHJlbmRlcmVkRmlsZXMuZm9yRWFjaChmaWxlID0+IHRoaXMud3JpdGVGaWxlKGZpbGUpKTtcblxuICAgIC8vIFdyaXRlIHRoZSBidWlsdC13aXRoLW5nY2MgbWFya2VyXG4gICAgd3JpdGVNYXJrZXJGaWxlKGVudHJ5UG9pbnQsIGZvcm1hdCk7XG4gIH1cblxuICBnZXRSb290RGlycyhob3N0OiB0cy5Db21waWxlckhvc3QsIG9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLnJvb3REaXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLnJvb3REaXJzO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yb290RGlyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBbb3B0aW9ucy5yb290RGlyXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtob3N0LmdldEN1cnJlbnREaXJlY3RvcnkoKV07XG4gICAgfVxuICB9XG5cbiAgZ2V0SG9zdChpc0NvcmU6IGJvb2xlYW4sIGZvcm1hdDogc3RyaW5nLCBwcm9ncmFtOiB0cy5Qcm9ncmFtLCBkdHNNYXBwZXI6IER0c01hcHBlcik6XG4gICAgICBOZ2NjUmVmbGVjdGlvbkhvc3Qge1xuICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICBjYXNlICdlc20yMDE1JzpcbiAgICAgICAgcmV0dXJuIG5ldyBFc20yMDE1UmVmbGVjdGlvbkhvc3QoaXNDb3JlLCBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCksIGR0c01hcHBlcik7XG4gICAgICBjYXNlICdmZXNtMjAxNSc6XG4gICAgICAgIHJldHVybiBuZXcgRmVzbTIwMTVSZWZsZWN0aW9uSG9zdChpc0NvcmUsIHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKSk7XG4gICAgICBjYXNlICdlc201JzpcbiAgICAgIGNhc2UgJ2Zlc201JzpcbiAgICAgICAgcmV0dXJuIG5ldyBFc201UmVmbGVjdGlvbkhvc3QoaXNDb3JlLCBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCkpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxlY3Rpb24gaG9zdCBmb3IgXCIke2Zvcm1hdH1cIiBub3QgeWV0IGltcGxlbWVudGVkLmApO1xuICAgIH1cbiAgfVxuXG4gIGdldFJlbmRlcmVyKFxuICAgICAgZm9ybWF0OiBzdHJpbmcsIHByb2dyYW06IHRzLlByb2dyYW0sIGhvc3Q6IE5nY2NSZWZsZWN0aW9uSG9zdCwgaXNDb3JlOiBib29sZWFuLFxuICAgICAgcmV3cml0ZUNvcmVJbXBvcnRzVG86IHRzLlNvdXJjZUZpbGV8bnVsbCwgZHRzTWFwcGVyOiBEdHNNYXBwZXIpOiBSZW5kZXJlciB7XG4gICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgIGNhc2UgJ2VzbTIwMTUnOlxuICAgICAgICByZXR1cm4gbmV3IEVzbTIwMTVSZW5kZXJlcihcbiAgICAgICAgICAgIGhvc3QsIGlzQ29yZSwgcmV3cml0ZUNvcmVJbXBvcnRzVG8sIHRoaXMuc291cmNlUGF0aCwgdGhpcy50YXJnZXRQYXRoLCBkdHNNYXBwZXIpO1xuICAgICAgY2FzZSAnZmVzbTIwMTUnOlxuICAgICAgICByZXR1cm4gbmV3IEZlc20yMDE1UmVuZGVyZXIoXG4gICAgICAgICAgICBob3N0LCBpc0NvcmUsIHJld3JpdGVDb3JlSW1wb3J0c1RvLCB0aGlzLnNvdXJjZVBhdGgsIHRoaXMudGFyZ2V0UGF0aCk7XG4gICAgICBjYXNlICdlc201JzpcbiAgICAgIGNhc2UgJ2Zlc201JzpcbiAgICAgICAgcmV0dXJuIG5ldyBFc201UmVuZGVyZXIoXG4gICAgICAgICAgICBob3N0LCBpc0NvcmUsIHJld3JpdGVDb3JlSW1wb3J0c1RvLCB0aGlzLnNvdXJjZVBhdGgsIHRoaXMudGFyZ2V0UGF0aCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbmRlcmVyIGZvciBcIiR7Zm9ybWF0fVwiIG5vdCB5ZXQgaW1wbGVtZW50ZWQuYCk7XG4gICAgfVxuICB9XG5cbiAgYW5hbHl6ZVByb2dyYW0oXG4gICAgICBwcm9ncmFtOiB0cy5Qcm9ncmFtLCByZWZsZWN0aW9uSG9zdDogTmdjY1JlZmxlY3Rpb25Ib3N0LCByb290RGlyczogc3RyaW5nW10sXG4gICAgICBpc0NvcmU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBkZWNvcmF0aW9uQW5hbHl6ZXIgPVxuICAgICAgICBuZXcgRGVjb3JhdGlvbkFuYWx5emVyKHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKSwgcmVmbGVjdGlvbkhvc3QsIHJvb3REaXJzLCBpc0NvcmUpO1xuICAgIGNvbnN0IHN3aXRjaE1hcmtlckFuYWx5emVyID0gbmV3IFN3aXRjaE1hcmtlckFuYWx5emVyKHJlZmxlY3Rpb25Ib3N0KTtcbiAgICByZXR1cm4ge1xuICAgICAgZGVjb3JhdGlvbkFuYWx5c2VzOiBkZWNvcmF0aW9uQW5hbHl6ZXIuYW5hbHl6ZVByb2dyYW0ocHJvZ3JhbSksXG4gICAgICBzd2l0Y2hNYXJrZXJBbmFseXNlczogc3dpdGNoTWFya2VyQW5hbHl6ZXIuYW5hbHl6ZVByb2dyYW0ocHJvZ3JhbSksXG4gICAgfTtcbiAgfVxuXG4gIHdyaXRlRmlsZShmaWxlOiBGaWxlSW5mbyk6IHZvaWQge1xuICAgIG1rZGlyKCctcCcsIGRpcm5hbWUoZmlsZS5wYXRoKSk7XG4gICAgY29uc3QgYmFja1BhdGggPSBmaWxlLnBhdGggKyAnLmJhayc7XG4gICAgaWYgKGV4aXN0c1N5bmMoZmlsZS5wYXRoKSAmJiAhZXhpc3RzU3luYyhiYWNrUGF0aCkpIHtcbiAgICAgIG12KGZpbGUucGF0aCwgYmFja1BhdGgpO1xuICAgIH1cbiAgICB3cml0ZUZpbGVTeW5jKGZpbGUucGF0aCwgZmlsZS5jb250ZW50cywgJ3V0ZjgnKTtcbiAgfVxuXG4gIGZpbmRSM1N5bWJvbHNQYXRoKGRpcmVjdG9yeTogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICAgIGNvbnN0IHIzU3ltYm9sc0ZpbGVQYXRoID0gcmVzb2x2ZShkaXJlY3RvcnksICdyM19zeW1ib2xzLmpzJyk7XG4gICAgaWYgKGV4aXN0c1N5bmMocjNTeW1ib2xzRmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gcjNTeW1ib2xzRmlsZVBhdGg7XG4gICAgfVxuXG4gICAgY29uc3Qgc3ViRGlyZWN0b3JpZXMgPVxuICAgICAgICByZWFkZGlyU3luYyhkaXJlY3RvcnkpXG4gICAgICAgICAgICAvLyBOb3QgaW50ZXJlc3RlZCBpbiBoaWRkZW4gZmlsZXNcbiAgICAgICAgICAgIC5maWx0ZXIocCA9PiAhcC5zdGFydHNXaXRoKCcuJykpXG4gICAgICAgICAgICAvLyBJZ25vcmUgbm9kZV9tb2R1bGVzXG4gICAgICAgICAgICAuZmlsdGVyKHAgPT4gcCAhPT0gJ25vZGVfbW9kdWxlcycpXG4gICAgICAgICAgICAvLyBPbmx5IGludGVyZXN0ZWQgaW4gZGlyZWN0b3JpZXMgKGFuZCBvbmx5IHRob3NlIHRoYXQgYXJlIG5vdCBzeW1saW5rcylcbiAgICAgICAgICAgIC5maWx0ZXIocCA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBsc3RhdFN5bmMocmVzb2x2ZShkaXJlY3RvcnksIHApKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHN0YXQuaXNEaXJlY3RvcnkoKSAmJiAhc3RhdC5pc1N5bWJvbGljTGluaygpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IHN1YkRpcmVjdG9yeSBvZiBzdWJEaXJlY3Rvcmllcykge1xuICAgICAgY29uc3QgcjNTeW1ib2xzRmlsZVBhdGggPSB0aGlzLmZpbmRSM1N5bWJvbHNQYXRoKHJlc29sdmUoZGlyZWN0b3J5LCBzdWJEaXJlY3RvcnkpKTtcbiAgICAgIGlmIChyM1N5bWJvbHNGaWxlUGF0aCkge1xuICAgICAgICByZXR1cm4gcjNTeW1ib2xzRmlsZVBhdGg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==