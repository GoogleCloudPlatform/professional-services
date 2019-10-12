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
        define("@angular/compiler-cli/src/perform_compile", ["require", "exports", "tslib", "@angular/compiler", "fs", "path", "typescript", "@angular/compiler-cli/src/transformers/api", "@angular/compiler-cli/src/transformers/entry_points", "@angular/compiler-cli/src/transformers/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var fs = require("fs");
    var path = require("path");
    var ts = require("typescript");
    var api = require("@angular/compiler-cli/src/transformers/api");
    var ng = require("@angular/compiler-cli/src/transformers/entry_points");
    var util_1 = require("@angular/compiler-cli/src/transformers/util");
    var TS_EXT = /\.ts$/;
    function filterErrorsAndWarnings(diagnostics) {
        return diagnostics.filter(function (d) { return d.category !== ts.DiagnosticCategory.Message; });
    }
    exports.filterErrorsAndWarnings = filterErrorsAndWarnings;
    var defaultFormatHost = {
        getCurrentDirectory: function () { return ts.sys.getCurrentDirectory(); },
        getCanonicalFileName: function (fileName) { return fileName; },
        getNewLine: function () { return ts.sys.newLine; }
    };
    function displayFileName(fileName, host) {
        return path.relative(host.getCurrentDirectory(), host.getCanonicalFileName(fileName));
    }
    function formatDiagnosticPosition(position, host) {
        if (host === void 0) { host = defaultFormatHost; }
        return displayFileName(position.fileName, host) + "(" + (position.line + 1) + "," + (position.column + 1) + ")";
    }
    exports.formatDiagnosticPosition = formatDiagnosticPosition;
    function flattenDiagnosticMessageChain(chain, host) {
        if (host === void 0) { host = defaultFormatHost; }
        var result = chain.messageText;
        var indent = 1;
        var current = chain.next;
        var newLine = host.getNewLine();
        while (current) {
            result += newLine;
            for (var i = 0; i < indent; i++) {
                result += '  ';
            }
            result += current.messageText;
            var position = current.position;
            if (position) {
                result += " at " + formatDiagnosticPosition(position, host);
            }
            current = current.next;
            indent++;
        }
        return result;
    }
    exports.flattenDiagnosticMessageChain = flattenDiagnosticMessageChain;
    function formatDiagnostic(diagnostic, host) {
        if (host === void 0) { host = defaultFormatHost; }
        var result = '';
        var newLine = host.getNewLine();
        var span = diagnostic.span;
        if (span) {
            result += formatDiagnosticPosition({
                fileName: span.start.file.url,
                line: span.start.line,
                column: span.start.col
            }, host) + ": ";
        }
        else if (diagnostic.position) {
            result += formatDiagnosticPosition(diagnostic.position, host) + ": ";
        }
        if (diagnostic.span && diagnostic.span.details) {
            result += ": " + diagnostic.span.details + ", " + diagnostic.messageText + newLine;
        }
        else if (diagnostic.chain) {
            result += flattenDiagnosticMessageChain(diagnostic.chain, host) + "." + newLine;
        }
        else {
            result += ": " + diagnostic.messageText + newLine;
        }
        return result;
    }
    exports.formatDiagnostic = formatDiagnostic;
    function formatDiagnostics(diags, host) {
        if (host === void 0) { host = defaultFormatHost; }
        if (diags && diags.length) {
            return diags
                .map(function (diagnostic) {
                if (api.isTsDiagnostic(diagnostic)) {
                    return ts.formatDiagnostics([diagnostic], host);
                }
                else {
                    return formatDiagnostic(diagnostic, host);
                }
            })
                .join('');
        }
        else {
            return '';
        }
    }
    exports.formatDiagnostics = formatDiagnostics;
    function calcProjectFileAndBasePath(project) {
        var projectIsDir = fs.lstatSync(project).isDirectory();
        var projectFile = projectIsDir ? path.join(project, 'tsconfig.json') : project;
        var projectDir = projectIsDir ? project : path.dirname(project);
        var basePath = path.resolve(process.cwd(), projectDir);
        return { projectFile: projectFile, basePath: basePath };
    }
    exports.calcProjectFileAndBasePath = calcProjectFileAndBasePath;
    function createNgCompilerOptions(basePath, config, tsOptions) {
        return tslib_1.__assign({}, tsOptions, config.angularCompilerOptions, { genDir: basePath, basePath: basePath });
    }
    exports.createNgCompilerOptions = createNgCompilerOptions;
    function readConfiguration(project, existingOptions) {
        try {
            var _a = calcProjectFileAndBasePath(project), projectFile = _a.projectFile, basePath = _a.basePath;
            var readExtendedConfigFile_1 = function (configFile, existingConfig) {
                var _a = ts.readConfigFile(configFile, ts.sys.readFile), config = _a.config, error = _a.error;
                if (error) {
                    return { error: error };
                }
                // we are only interested into merging 'angularCompilerOptions' as
                // other options like 'compilerOptions' are merged by TS
                var baseConfig = existingConfig || config;
                if (existingConfig) {
                    baseConfig.angularCompilerOptions = tslib_1.__assign({}, config.angularCompilerOptions, baseConfig.angularCompilerOptions);
                }
                if (config.extends) {
                    var extendedConfigPath = path.resolve(path.dirname(configFile), config.extends);
                    extendedConfigPath = path.extname(extendedConfigPath) ? extendedConfigPath :
                        extendedConfigPath + ".json";
                    if (fs.existsSync(extendedConfigPath)) {
                        // Call read config recursively as TypeScript only merges CompilerOptions
                        return readExtendedConfigFile_1(extendedConfigPath, baseConfig);
                    }
                }
                return { config: baseConfig };
            };
            var _b = readExtendedConfigFile_1(projectFile), config = _b.config, error = _b.error;
            if (error) {
                return {
                    project: project,
                    errors: [error],
                    rootNames: [],
                    options: {},
                    emitFlags: api.EmitFlags.Default
                };
            }
            var parseConfigHost = {
                useCaseSensitiveFileNames: true,
                fileExists: fs.existsSync,
                readDirectory: ts.sys.readDirectory,
                readFile: ts.sys.readFile
            };
            var parsed = ts.parseJsonConfigFileContent(config, parseConfigHost, basePath, existingOptions);
            var rootNames = parsed.fileNames.map(function (f) { return path.normalize(f); });
            var options = createNgCompilerOptions(basePath, config, parsed.options);
            var emitFlags = api.EmitFlags.Default;
            if (!(options.skipMetadataEmit || options.flatModuleOutFile)) {
                emitFlags |= api.EmitFlags.Metadata;
            }
            if (options.skipTemplateCodegen) {
                emitFlags = emitFlags & ~api.EmitFlags.Codegen;
            }
            return { project: projectFile, rootNames: rootNames, options: options, errors: parsed.errors, emitFlags: emitFlags };
        }
        catch (e) {
            var errors = [{
                    category: ts.DiagnosticCategory.Error,
                    messageText: e.stack,
                    source: api.SOURCE,
                    code: api.UNKNOWN_ERROR_CODE
                }];
            return { project: '', errors: errors, rootNames: [], options: {}, emitFlags: api.EmitFlags.Default };
        }
    }
    exports.readConfiguration = readConfiguration;
    function exitCodeFromResult(diags) {
        if (!diags || filterErrorsAndWarnings(diags).length === 0) {
            // If we have a result and didn't get any errors, we succeeded.
            return 0;
        }
        // Return 2 if any of the errors were unknown.
        return diags.some(function (d) { return d.source === 'angular' && d.code === api.UNKNOWN_ERROR_CODE; }) ? 2 : 1;
    }
    exports.exitCodeFromResult = exitCodeFromResult;
    function performCompilation(_a) {
        var rootNames = _a.rootNames, options = _a.options, host = _a.host, oldProgram = _a.oldProgram, emitCallback = _a.emitCallback, mergeEmitResultsCallback = _a.mergeEmitResultsCallback, _b = _a.gatherDiagnostics, gatherDiagnostics = _b === void 0 ? defaultGatherDiagnostics : _b, customTransformers = _a.customTransformers, _c = _a.emitFlags, emitFlags = _c === void 0 ? api.EmitFlags.Default : _c;
        var program;
        var emitResult;
        var allDiagnostics = [];
        try {
            if (!host) {
                host = ng.createCompilerHost({ options: options });
            }
            program = ng.createProgram({ rootNames: rootNames, host: host, options: options, oldProgram: oldProgram });
            var beforeDiags = Date.now();
            allDiagnostics.push.apply(allDiagnostics, tslib_1.__spread(gatherDiagnostics(program)));
            if (options.diagnostics) {
                var afterDiags = Date.now();
                allDiagnostics.push(util_1.createMessageDiagnostic("Time for diagnostics: " + (afterDiags - beforeDiags) + "ms."));
            }
            if (!hasErrors(allDiagnostics)) {
                emitResult =
                    program.emit({ emitCallback: emitCallback, mergeEmitResultsCallback: mergeEmitResultsCallback, customTransformers: customTransformers, emitFlags: emitFlags });
                allDiagnostics.push.apply(allDiagnostics, tslib_1.__spread(emitResult.diagnostics));
                return { diagnostics: allDiagnostics, program: program, emitResult: emitResult };
            }
            return { diagnostics: allDiagnostics, program: program };
        }
        catch (e) {
            var errMsg = void 0;
            var code = void 0;
            if (compiler_1.isSyntaxError(e)) {
                // don't report the stack for syntax errors as they are well known errors.
                errMsg = e.message;
                code = api.DEFAULT_ERROR_CODE;
            }
            else {
                errMsg = e.stack;
                // It is not a syntax error we might have a program with unknown state, discard it.
                program = undefined;
                code = api.UNKNOWN_ERROR_CODE;
            }
            allDiagnostics.push({ category: ts.DiagnosticCategory.Error, messageText: errMsg, code: code, source: api.SOURCE });
            return { diagnostics: allDiagnostics, program: program };
        }
    }
    exports.performCompilation = performCompilation;
    function defaultGatherDiagnostics(program) {
        var allDiagnostics = [];
        function checkDiagnostics(diags) {
            if (diags) {
                allDiagnostics.push.apply(allDiagnostics, tslib_1.__spread(diags));
                return !hasErrors(diags);
            }
            return true;
        }
        var checkOtherDiagnostics = true;
        // Check parameter diagnostics
        checkOtherDiagnostics = checkOtherDiagnostics &&
            checkDiagnostics(tslib_1.__spread(program.getTsOptionDiagnostics(), program.getNgOptionDiagnostics()));
        // Check syntactic diagnostics
        checkOtherDiagnostics =
            checkOtherDiagnostics && checkDiagnostics(program.getTsSyntacticDiagnostics());
        // Check TypeScript semantic and Angular structure diagnostics
        checkOtherDiagnostics =
            checkOtherDiagnostics &&
                checkDiagnostics(tslib_1.__spread(program.getTsSemanticDiagnostics(), program.getNgStructuralDiagnostics()));
        // Check Angular semantic diagnostics
        checkOtherDiagnostics =
            checkOtherDiagnostics && checkDiagnostics(program.getNgSemanticDiagnostics());
        return allDiagnostics;
    }
    function hasErrors(diags) {
        return diags.some(function (d) { return d.category === ts.DiagnosticCategory.Error; });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZm9ybV9jb21waWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9wZXJmb3JtX2NvbXBpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsOENBQXVFO0lBQ3ZFLHVCQUF5QjtJQUN6QiwyQkFBNkI7SUFDN0IsK0JBQWlDO0lBRWpDLGdFQUEwQztJQUMxQyx3RUFBa0Q7SUFDbEQsb0VBQTREO0lBRTVELElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQztJQUl2QixTQUFnQix1QkFBdUIsQ0FBQyxXQUF3QjtRQUM5RCxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsUUFBUSxLQUFLLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQTVDLENBQTRDLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRkQsMERBRUM7SUFFRCxJQUFNLGlCQUFpQixHQUE2QjtRQUNsRCxtQkFBbUIsRUFBRSxjQUFNLE9BQUEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxFQUE1QixDQUE0QjtRQUN2RCxvQkFBb0IsRUFBRSxVQUFBLFFBQVEsSUFBSSxPQUFBLFFBQVEsRUFBUixDQUFRO1FBQzFDLFVBQVUsRUFBRSxjQUFNLE9BQUEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQWQsQ0FBYztLQUNqQyxDQUFDO0lBRUYsU0FBUyxlQUFlLENBQUMsUUFBZ0IsRUFBRSxJQUE4QjtRQUN2RSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDeEYsQ0FBQztJQUVELFNBQWdCLHdCQUF3QixDQUNwQyxRQUFrQixFQUFFLElBQWtEO1FBQWxELHFCQUFBLEVBQUEsd0JBQWtEO1FBQ3hFLE9BQVUsZUFBZSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQUksUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLFdBQUksUUFBUSxDQUFDLE1BQU0sR0FBQyxDQUFDLE9BQUcsQ0FBQztJQUNsRyxDQUFDO0lBSEQsNERBR0M7SUFFRCxTQUFnQiw2QkFBNkIsQ0FDekMsS0FBaUMsRUFBRSxJQUFrRDtRQUFsRCxxQkFBQSxFQUFBLHdCQUFrRDtRQUN2RixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBQy9CLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNmLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFDekIsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sT0FBTyxFQUFFO1lBQ2QsTUFBTSxJQUFJLE9BQU8sQ0FBQztZQUNsQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLElBQUksSUFBSSxDQUFDO2FBQ2hCO1lBQ0QsTUFBTSxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFDOUIsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUNsQyxJQUFJLFFBQVEsRUFBRTtnQkFDWixNQUFNLElBQUksU0FBTyx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFHLENBQUM7YUFDN0Q7WUFDRCxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUN2QixNQUFNLEVBQUUsQ0FBQztTQUNWO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQXBCRCxzRUFvQkM7SUFFRCxTQUFnQixnQkFBZ0IsQ0FDNUIsVUFBMEIsRUFBRSxJQUFrRDtRQUFsRCxxQkFBQSxFQUFBLHdCQUFrRDtRQUNoRixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xDLElBQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFDN0IsSUFBSSxJQUFJLEVBQUU7WUFDUixNQUFNLElBQU8sd0JBQXdCLENBQUM7Z0JBQ3BDLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHO2dCQUM3QixJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO2dCQUNyQixNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHO2FBQ3ZCLEVBQUUsSUFBSSxDQUFDLE9BQUksQ0FBQztTQUNkO2FBQU0sSUFBSSxVQUFVLENBQUMsUUFBUSxFQUFFO1lBQzlCLE1BQU0sSUFBTyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFJLENBQUM7U0FDdEU7UUFDRCxJQUFJLFVBQVUsQ0FBQyxJQUFJLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDOUMsTUFBTSxJQUFJLE9BQUssVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLFVBQUssVUFBVSxDQUFDLFdBQVcsR0FBRyxPQUFTLENBQUM7U0FDL0U7YUFBTSxJQUFJLFVBQVUsQ0FBQyxLQUFLLEVBQUU7WUFDM0IsTUFBTSxJQUFPLDZCQUE2QixDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQUksT0FBUyxDQUFDO1NBQ2pGO2FBQU07WUFDTCxNQUFNLElBQUksT0FBSyxVQUFVLENBQUMsV0FBVyxHQUFHLE9BQVMsQ0FBQztTQUNuRDtRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUF0QkQsNENBc0JDO0lBRUQsU0FBZ0IsaUJBQWlCLENBQzdCLEtBQWtCLEVBQUUsSUFBa0Q7UUFBbEQscUJBQUEsRUFBQSx3QkFBa0Q7UUFDeEUsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUN6QixPQUFPLEtBQUs7aUJBQ1AsR0FBRyxDQUFDLFVBQUEsVUFBVTtnQkFDYixJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ2xDLE9BQU8sRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ2pEO3FCQUFNO29CQUNMLE9BQU8sZ0JBQWdCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUMzQztZQUNILENBQUMsQ0FBQztpQkFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDZjthQUFNO1lBQ0wsT0FBTyxFQUFFLENBQUM7U0FDWDtJQUNILENBQUM7SUFmRCw4Q0FlQztJQVVELFNBQWdCLDBCQUEwQixDQUFDLE9BQWU7UUFFeEQsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN6RCxJQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDakYsSUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEUsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDekQsT0FBTyxFQUFDLFdBQVcsYUFBQSxFQUFFLFFBQVEsVUFBQSxFQUFDLENBQUM7SUFDakMsQ0FBQztJQVBELGdFQU9DO0lBRUQsU0FBZ0IsdUJBQXVCLENBQ25DLFFBQWdCLEVBQUUsTUFBVyxFQUFFLFNBQTZCO1FBQzlELDRCQUFXLFNBQVMsRUFBSyxNQUFNLENBQUMsc0JBQXNCLElBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLFVBQUEsSUFBRTtJQUN0RixDQUFDO0lBSEQsMERBR0M7SUFFRCxTQUFnQixpQkFBaUIsQ0FDN0IsT0FBZSxFQUFFLGVBQW9DO1FBQ3ZELElBQUk7WUFDSSxJQUFBLHdDQUE2RCxFQUE1RCw0QkFBVyxFQUFFLHNCQUErQyxDQUFDO1lBRXBFLElBQU0sd0JBQXNCLEdBQ3hCLFVBQUMsVUFBa0IsRUFBRSxjQUFvQjtnQkFDakMsSUFBQSxtREFBZ0UsRUFBL0Qsa0JBQU0sRUFBRSxnQkFBdUQsQ0FBQztnQkFFdkUsSUFBSSxLQUFLLEVBQUU7b0JBQ1QsT0FBTyxFQUFDLEtBQUssT0FBQSxFQUFDLENBQUM7aUJBQ2hCO2dCQUVELGtFQUFrRTtnQkFDbEUsd0RBQXdEO2dCQUN4RCxJQUFNLFVBQVUsR0FBRyxjQUFjLElBQUksTUFBTSxDQUFDO2dCQUM1QyxJQUFJLGNBQWMsRUFBRTtvQkFDbEIsVUFBVSxDQUFDLHNCQUFzQix3QkFBTyxNQUFNLENBQUMsc0JBQXNCLEVBQzdCLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2lCQUM1RTtnQkFFRCxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7b0JBQ2xCLElBQUksa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDaEYsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO3dCQUNqQixrQkFBa0IsVUFBTyxDQUFDO29CQUVyRixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsRUFBRTt3QkFDckMseUVBQXlFO3dCQUN6RSxPQUFPLHdCQUFzQixDQUFDLGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxDQUFDO3FCQUMvRDtpQkFDRjtnQkFFRCxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxDQUFDO1lBQzlCLENBQUMsQ0FBQztZQUVBLElBQUEsMENBQXFELEVBQXBELGtCQUFNLEVBQUUsZ0JBQTRDLENBQUM7WUFFNUQsSUFBSSxLQUFLLEVBQUU7Z0JBQ1QsT0FBTztvQkFDTCxPQUFPLFNBQUE7b0JBQ1AsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDO29CQUNmLFNBQVMsRUFBRSxFQUFFO29CQUNiLE9BQU8sRUFBRSxFQUFFO29CQUNYLFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU87aUJBQ2pDLENBQUM7YUFDSDtZQUNELElBQU0sZUFBZSxHQUFHO2dCQUN0Qix5QkFBeUIsRUFBRSxJQUFJO2dCQUMvQixVQUFVLEVBQUUsRUFBRSxDQUFDLFVBQVU7Z0JBQ3pCLGFBQWEsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLGFBQWE7Z0JBQ25DLFFBQVEsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVE7YUFDMUIsQ0FBQztZQUNGLElBQU0sTUFBTSxHQUNSLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUN0RixJQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQWpCLENBQWlCLENBQUMsQ0FBQztZQUUvRCxJQUFNLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxRSxJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztZQUN0QyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLElBQUksT0FBTyxDQUFDLGlCQUFpQixDQUFDLEVBQUU7Z0JBQzVELFNBQVMsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQzthQUNyQztZQUNELElBQUksT0FBTyxDQUFDLG1CQUFtQixFQUFFO2dCQUMvQixTQUFTLEdBQUcsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7YUFDaEQ7WUFDRCxPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxTQUFTLFdBQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLFdBQUEsRUFBQyxDQUFDO1NBQ3JGO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixJQUFNLE1BQU0sR0FBZ0IsQ0FBQztvQkFDM0IsUUFBUSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLO29CQUNyQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEtBQUs7b0JBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtvQkFDbEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxrQkFBa0I7aUJBQzdCLENBQUMsQ0FBQztZQUNILE9BQU8sRUFBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLE1BQU0sUUFBQSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUMsQ0FBQztTQUM1RjtJQUNILENBQUM7SUExRUQsOENBMEVDO0lBUUQsU0FBZ0Isa0JBQWtCLENBQUMsS0FBOEI7UUFDL0QsSUFBSSxDQUFDLEtBQUssSUFBSSx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3pELCtEQUErRDtZQUMvRCxPQUFPLENBQUMsQ0FBQztTQUNWO1FBRUQsOENBQThDO1FBQzlDLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxNQUFNLEtBQUssU0FBUyxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLGtCQUFrQixFQUEzRCxDQUEyRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFSRCxnREFRQztJQUVELFNBQWdCLGtCQUFrQixDQUFDLEVBYWxDO1lBYm1DLHdCQUFTLEVBQUUsb0JBQU8sRUFBRSxjQUFJLEVBQUUsMEJBQVUsRUFBRSw4QkFBWSxFQUNsRCxzREFBd0IsRUFDeEIseUJBQTRDLEVBQTVDLGlFQUE0QyxFQUM1QywwQ0FBa0IsRUFBRSxpQkFBaUMsRUFBakMsc0RBQWlDO1FBV3ZGLElBQUksT0FBOEIsQ0FBQztRQUNuQyxJQUFJLFVBQW1DLENBQUM7UUFDeEMsSUFBSSxjQUFjLEdBQXdDLEVBQUUsQ0FBQztRQUM3RCxJQUFJO1lBQ0YsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDVCxJQUFJLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEVBQUMsT0FBTyxTQUFBLEVBQUMsQ0FBQyxDQUFDO2FBQ3pDO1lBRUQsT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBQyxTQUFTLFdBQUEsRUFBRSxJQUFJLE1BQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxVQUFVLFlBQUEsRUFBQyxDQUFDLENBQUM7WUFFbkUsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLGNBQWMsQ0FBQyxJQUFJLE9BQW5CLGNBQWMsbUJBQVMsaUJBQWlCLENBQUMsT0FBUyxDQUFDLEdBQUU7WUFDckQsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFO2dCQUN2QixJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzlCLGNBQWMsQ0FBQyxJQUFJLENBQ2YsOEJBQXVCLENBQUMsNEJBQXlCLFVBQVUsR0FBRyxXQUFXLFNBQUssQ0FBQyxDQUFDLENBQUM7YUFDdEY7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxFQUFFO2dCQUM5QixVQUFVO29CQUNOLE9BQVMsQ0FBQyxJQUFJLENBQUMsRUFBQyxZQUFZLGNBQUEsRUFBRSx3QkFBd0IsMEJBQUEsRUFBRSxrQkFBa0Isb0JBQUEsRUFBRSxTQUFTLFdBQUEsRUFBQyxDQUFDLENBQUM7Z0JBQzVGLGNBQWMsQ0FBQyxJQUFJLE9BQW5CLGNBQWMsbUJBQVMsVUFBVSxDQUFDLFdBQVcsR0FBRTtnQkFDL0MsT0FBTyxFQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsT0FBTyxTQUFBLEVBQUUsVUFBVSxZQUFBLEVBQUMsQ0FBQzthQUMzRDtZQUNELE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLE9BQU8sU0FBQSxFQUFDLENBQUM7U0FDL0M7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLElBQUksTUFBTSxTQUFRLENBQUM7WUFDbkIsSUFBSSxJQUFJLFNBQVEsQ0FBQztZQUNqQixJQUFJLHdCQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BCLDBFQUEwRTtnQkFDMUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQ25CLElBQUksR0FBRyxHQUFHLENBQUMsa0JBQWtCLENBQUM7YUFDL0I7aUJBQU07Z0JBQ0wsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ2pCLG1GQUFtRjtnQkFDbkYsT0FBTyxHQUFHLFNBQVMsQ0FBQztnQkFDcEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQzthQUMvQjtZQUNELGNBQWMsQ0FBQyxJQUFJLENBQ2YsRUFBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLElBQUksTUFBQSxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQztZQUM1RixPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxPQUFPLFNBQUEsRUFBQyxDQUFDO1NBQy9DO0lBQ0gsQ0FBQztJQXhERCxnREF3REM7SUFDRCxTQUFTLHdCQUF3QixDQUFDLE9BQW9CO1FBQ3BELElBQU0sY0FBYyxHQUF3QyxFQUFFLENBQUM7UUFFL0QsU0FBUyxnQkFBZ0IsQ0FBQyxLQUE4QjtZQUN0RCxJQUFJLEtBQUssRUFBRTtnQkFDVCxjQUFjLENBQUMsSUFBSSxPQUFuQixjQUFjLG1CQUFTLEtBQUssR0FBRTtnQkFDOUIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMxQjtZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQUkscUJBQXFCLEdBQUcsSUFBSSxDQUFDO1FBQ2pDLDhCQUE4QjtRQUM5QixxQkFBcUIsR0FBRyxxQkFBcUI7WUFDekMsZ0JBQWdCLGtCQUFLLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxFQUFLLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUM7UUFFakcsOEJBQThCO1FBQzlCLHFCQUFxQjtZQUNqQixxQkFBcUIsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMseUJBQXlCLEVBQWlCLENBQUMsQ0FBQztRQUVsRyw4REFBOEQ7UUFDOUQscUJBQXFCO1lBQ2pCLHFCQUFxQjtnQkFDckIsZ0JBQWdCLGtCQUNSLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxFQUFLLE9BQU8sQ0FBQywwQkFBMEIsRUFBRSxFQUFFLENBQUM7UUFFMUYscUNBQXFDO1FBQ3JDLHFCQUFxQjtZQUNqQixxQkFBcUIsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsd0JBQXdCLEVBQWlCLENBQUMsQ0FBQztRQUVqRyxPQUFPLGNBQWMsQ0FBQztJQUN4QixDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUMsS0FBa0I7UUFDbkMsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLFFBQVEsS0FBSyxFQUFFLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUExQyxDQUEwQyxDQUFDLENBQUM7SUFDckUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQb3NpdGlvbiwgaXNTeW50YXhFcnJvciwgc3ludGF4RXJyb3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0ICogYXMgYXBpIGZyb20gJy4vdHJhbnNmb3JtZXJzL2FwaSc7XG5pbXBvcnQgKiBhcyBuZyBmcm9tICcuL3RyYW5zZm9ybWVycy9lbnRyeV9wb2ludHMnO1xuaW1wb3J0IHtjcmVhdGVNZXNzYWdlRGlhZ25vc3RpY30gZnJvbSAnLi90cmFuc2Zvcm1lcnMvdXRpbCc7XG5cbmNvbnN0IFRTX0VYVCA9IC9cXC50cyQvO1xuXG5leHBvcnQgdHlwZSBEaWFnbm9zdGljcyA9IFJlYWRvbmx5QXJyYXk8dHMuRGlhZ25vc3RpY3xhcGkuRGlhZ25vc3RpYz47XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJFcnJvcnNBbmRXYXJuaW5ncyhkaWFnbm9zdGljczogRGlhZ25vc3RpY3MpOiBEaWFnbm9zdGljcyB7XG4gIHJldHVybiBkaWFnbm9zdGljcy5maWx0ZXIoZCA9PiBkLmNhdGVnb3J5ICE9PSB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuTWVzc2FnZSk7XG59XG5cbmNvbnN0IGRlZmF1bHRGb3JtYXRIb3N0OiB0cy5Gb3JtYXREaWFnbm9zdGljc0hvc3QgPSB7XG4gIGdldEN1cnJlbnREaXJlY3Rvcnk6ICgpID0+IHRzLnN5cy5nZXRDdXJyZW50RGlyZWN0b3J5KCksXG4gIGdldENhbm9uaWNhbEZpbGVOYW1lOiBmaWxlTmFtZSA9PiBmaWxlTmFtZSxcbiAgZ2V0TmV3TGluZTogKCkgPT4gdHMuc3lzLm5ld0xpbmVcbn07XG5cbmZ1bmN0aW9uIGRpc3BsYXlGaWxlTmFtZShmaWxlTmFtZTogc3RyaW5nLCBob3N0OiB0cy5Gb3JtYXREaWFnbm9zdGljc0hvc3QpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5yZWxhdGl2ZShob3N0LmdldEN1cnJlbnREaXJlY3RvcnkoKSwgaG9zdC5nZXRDYW5vbmljYWxGaWxlTmFtZShmaWxlTmFtZSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGlhZ25vc3RpY1Bvc2l0aW9uKFxuICAgIHBvc2l0aW9uOiBQb3NpdGlvbiwgaG9zdDogdHMuRm9ybWF0RGlhZ25vc3RpY3NIb3N0ID0gZGVmYXVsdEZvcm1hdEhvc3QpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7ZGlzcGxheUZpbGVOYW1lKHBvc2l0aW9uLmZpbGVOYW1lLCBob3N0KX0oJHtwb3NpdGlvbi5saW5lICsgMX0sJHtwb3NpdGlvbi5jb2x1bW4rMX0pYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW5EaWFnbm9zdGljTWVzc2FnZUNoYWluKFxuICAgIGNoYWluOiBhcGkuRGlhZ25vc3RpY01lc3NhZ2VDaGFpbiwgaG9zdDogdHMuRm9ybWF0RGlhZ25vc3RpY3NIb3N0ID0gZGVmYXVsdEZvcm1hdEhvc3QpOiBzdHJpbmcge1xuICBsZXQgcmVzdWx0ID0gY2hhaW4ubWVzc2FnZVRleHQ7XG4gIGxldCBpbmRlbnQgPSAxO1xuICBsZXQgY3VycmVudCA9IGNoYWluLm5leHQ7XG4gIGNvbnN0IG5ld0xpbmUgPSBob3N0LmdldE5ld0xpbmUoKTtcbiAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICByZXN1bHQgKz0gbmV3TGluZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZGVudDsgaSsrKSB7XG4gICAgICByZXN1bHQgKz0gJyAgJztcbiAgICB9XG4gICAgcmVzdWx0ICs9IGN1cnJlbnQubWVzc2FnZVRleHQ7XG4gICAgY29uc3QgcG9zaXRpb24gPSBjdXJyZW50LnBvc2l0aW9uO1xuICAgIGlmIChwb3NpdGlvbikge1xuICAgICAgcmVzdWx0ICs9IGAgYXQgJHtmb3JtYXREaWFnbm9zdGljUG9zaXRpb24ocG9zaXRpb24sIGhvc3QpfWA7XG4gICAgfVxuICAgIGN1cnJlbnQgPSBjdXJyZW50Lm5leHQ7XG4gICAgaW5kZW50Kys7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdERpYWdub3N0aWMoXG4gICAgZGlhZ25vc3RpYzogYXBpLkRpYWdub3N0aWMsIGhvc3Q6IHRzLkZvcm1hdERpYWdub3N0aWNzSG9zdCA9IGRlZmF1bHRGb3JtYXRIb3N0KSB7XG4gIGxldCByZXN1bHQgPSAnJztcbiAgY29uc3QgbmV3TGluZSA9IGhvc3QuZ2V0TmV3TGluZSgpO1xuICBjb25zdCBzcGFuID0gZGlhZ25vc3RpYy5zcGFuO1xuICBpZiAoc3Bhbikge1xuICAgIHJlc3VsdCArPSBgJHtmb3JtYXREaWFnbm9zdGljUG9zaXRpb24oe1xuICAgICAgZmlsZU5hbWU6IHNwYW4uc3RhcnQuZmlsZS51cmwsXG4gICAgICBsaW5lOiBzcGFuLnN0YXJ0LmxpbmUsXG4gICAgICBjb2x1bW46IHNwYW4uc3RhcnQuY29sXG4gICAgfSwgaG9zdCl9OiBgO1xuICB9IGVsc2UgaWYgKGRpYWdub3N0aWMucG9zaXRpb24pIHtcbiAgICByZXN1bHQgKz0gYCR7Zm9ybWF0RGlhZ25vc3RpY1Bvc2l0aW9uKGRpYWdub3N0aWMucG9zaXRpb24sIGhvc3QpfTogYDtcbiAgfVxuICBpZiAoZGlhZ25vc3RpYy5zcGFuICYmIGRpYWdub3N0aWMuc3Bhbi5kZXRhaWxzKSB7XG4gICAgcmVzdWx0ICs9IGA6ICR7ZGlhZ25vc3RpYy5zcGFuLmRldGFpbHN9LCAke2RpYWdub3N0aWMubWVzc2FnZVRleHR9JHtuZXdMaW5lfWA7XG4gIH0gZWxzZSBpZiAoZGlhZ25vc3RpYy5jaGFpbikge1xuICAgIHJlc3VsdCArPSBgJHtmbGF0dGVuRGlhZ25vc3RpY01lc3NhZ2VDaGFpbihkaWFnbm9zdGljLmNoYWluLCBob3N0KX0uJHtuZXdMaW5lfWA7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ICs9IGA6ICR7ZGlhZ25vc3RpYy5tZXNzYWdlVGV4dH0ke25ld0xpbmV9YDtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGlhZ25vc3RpY3MoXG4gICAgZGlhZ3M6IERpYWdub3N0aWNzLCBob3N0OiB0cy5Gb3JtYXREaWFnbm9zdGljc0hvc3QgPSBkZWZhdWx0Rm9ybWF0SG9zdCk6IHN0cmluZyB7XG4gIGlmIChkaWFncyAmJiBkaWFncy5sZW5ndGgpIHtcbiAgICByZXR1cm4gZGlhZ3NcbiAgICAgICAgLm1hcChkaWFnbm9zdGljID0+IHtcbiAgICAgICAgICBpZiAoYXBpLmlzVHNEaWFnbm9zdGljKGRpYWdub3N0aWMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHMuZm9ybWF0RGlhZ25vc3RpY3MoW2RpYWdub3N0aWNdLCBob3N0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdERpYWdub3N0aWMoZGlhZ25vc3RpYywgaG9zdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuam9pbignJyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkQ29uZmlndXJhdGlvbiB7XG4gIHByb2plY3Q6IHN0cmluZztcbiAgb3B0aW9uczogYXBpLkNvbXBpbGVyT3B0aW9ucztcbiAgcm9vdE5hbWVzOiBzdHJpbmdbXTtcbiAgZW1pdEZsYWdzOiBhcGkuRW1pdEZsYWdzO1xuICBlcnJvcnM6IERpYWdub3N0aWNzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY1Byb2plY3RGaWxlQW5kQmFzZVBhdGgocHJvamVjdDogc3RyaW5nKTpcbiAgICB7cHJvamVjdEZpbGU6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZ30ge1xuICBjb25zdCBwcm9qZWN0SXNEaXIgPSBmcy5sc3RhdFN5bmMocHJvamVjdCkuaXNEaXJlY3RvcnkoKTtcbiAgY29uc3QgcHJvamVjdEZpbGUgPSBwcm9qZWN0SXNEaXIgPyBwYXRoLmpvaW4ocHJvamVjdCwgJ3RzY29uZmlnLmpzb24nKSA6IHByb2plY3Q7XG4gIGNvbnN0IHByb2plY3REaXIgPSBwcm9qZWN0SXNEaXIgPyBwcm9qZWN0IDogcGF0aC5kaXJuYW1lKHByb2plY3QpO1xuICBjb25zdCBiYXNlUGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBwcm9qZWN0RGlyKTtcbiAgcmV0dXJuIHtwcm9qZWN0RmlsZSwgYmFzZVBhdGh9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTmdDb21waWxlck9wdGlvbnMoXG4gICAgYmFzZVBhdGg6IHN0cmluZywgY29uZmlnOiBhbnksIHRzT3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zKTogYXBpLkNvbXBpbGVyT3B0aW9ucyB7XG4gIHJldHVybiB7Li4udHNPcHRpb25zLCAuLi5jb25maWcuYW5ndWxhckNvbXBpbGVyT3B0aW9ucywgZ2VuRGlyOiBiYXNlUGF0aCwgYmFzZVBhdGh9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZENvbmZpZ3VyYXRpb24oXG4gICAgcHJvamVjdDogc3RyaW5nLCBleGlzdGluZ09wdGlvbnM/OiB0cy5Db21waWxlck9wdGlvbnMpOiBQYXJzZWRDb25maWd1cmF0aW9uIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7cHJvamVjdEZpbGUsIGJhc2VQYXRofSA9IGNhbGNQcm9qZWN0RmlsZUFuZEJhc2VQYXRoKHByb2plY3QpO1xuXG4gICAgY29uc3QgcmVhZEV4dGVuZGVkQ29uZmlnRmlsZSA9XG4gICAgICAgIChjb25maWdGaWxlOiBzdHJpbmcsIGV4aXN0aW5nQ29uZmlnPzogYW55KToge2NvbmZpZz86IGFueSwgZXJyb3I/OiB0cy5EaWFnbm9zdGljfSA9PiB7XG4gICAgICAgICAgY29uc3Qge2NvbmZpZywgZXJyb3J9ID0gdHMucmVhZENvbmZpZ0ZpbGUoY29uZmlnRmlsZSwgdHMuc3lzLnJlYWRGaWxlKTtcblxuICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHtlcnJvcn07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gd2UgYXJlIG9ubHkgaW50ZXJlc3RlZCBpbnRvIG1lcmdpbmcgJ2FuZ3VsYXJDb21waWxlck9wdGlvbnMnIGFzXG4gICAgICAgICAgLy8gb3RoZXIgb3B0aW9ucyBsaWtlICdjb21waWxlck9wdGlvbnMnIGFyZSBtZXJnZWQgYnkgVFNcbiAgICAgICAgICBjb25zdCBiYXNlQ29uZmlnID0gZXhpc3RpbmdDb25maWcgfHwgY29uZmlnO1xuICAgICAgICAgIGlmIChleGlzdGluZ0NvbmZpZykge1xuICAgICAgICAgICAgYmFzZUNvbmZpZy5hbmd1bGFyQ29tcGlsZXJPcHRpb25zID0gey4uLmNvbmZpZy5hbmd1bGFyQ29tcGlsZXJPcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmJhc2VDb25maWcuYW5ndWxhckNvbXBpbGVyT3B0aW9uc307XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNvbmZpZy5leHRlbmRzKSB7XG4gICAgICAgICAgICBsZXQgZXh0ZW5kZWRDb25maWdQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShjb25maWdGaWxlKSwgY29uZmlnLmV4dGVuZHMpO1xuICAgICAgICAgICAgZXh0ZW5kZWRDb25maWdQYXRoID0gcGF0aC5leHRuYW1lKGV4dGVuZGVkQ29uZmlnUGF0aCkgPyBleHRlbmRlZENvbmZpZ1BhdGggOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgJHtleHRlbmRlZENvbmZpZ1BhdGh9Lmpzb25gO1xuXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhleHRlbmRlZENvbmZpZ1BhdGgpKSB7XG4gICAgICAgICAgICAgIC8vIENhbGwgcmVhZCBjb25maWcgcmVjdXJzaXZlbHkgYXMgVHlwZVNjcmlwdCBvbmx5IG1lcmdlcyBDb21waWxlck9wdGlvbnNcbiAgICAgICAgICAgICAgcmV0dXJuIHJlYWRFeHRlbmRlZENvbmZpZ0ZpbGUoZXh0ZW5kZWRDb25maWdQYXRoLCBiYXNlQ29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4ge2NvbmZpZzogYmFzZUNvbmZpZ307XG4gICAgICAgIH07XG5cbiAgICBjb25zdCB7Y29uZmlnLCBlcnJvcn0gPSByZWFkRXh0ZW5kZWRDb25maWdGaWxlKHByb2plY3RGaWxlKTtcblxuICAgIGlmIChlcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcHJvamVjdCxcbiAgICAgICAgZXJyb3JzOiBbZXJyb3JdLFxuICAgICAgICByb290TmFtZXM6IFtdLFxuICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgZW1pdEZsYWdzOiBhcGkuRW1pdEZsYWdzLkRlZmF1bHRcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHBhcnNlQ29uZmlnSG9zdCA9IHtcbiAgICAgIHVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXM6IHRydWUsXG4gICAgICBmaWxlRXhpc3RzOiBmcy5leGlzdHNTeW5jLFxuICAgICAgcmVhZERpcmVjdG9yeTogdHMuc3lzLnJlYWREaXJlY3RvcnksXG4gICAgICByZWFkRmlsZTogdHMuc3lzLnJlYWRGaWxlXG4gICAgfTtcbiAgICBjb25zdCBwYXJzZWQgPVxuICAgICAgICB0cy5wYXJzZUpzb25Db25maWdGaWxlQ29udGVudChjb25maWcsIHBhcnNlQ29uZmlnSG9zdCwgYmFzZVBhdGgsIGV4aXN0aW5nT3B0aW9ucyk7XG4gICAgY29uc3Qgcm9vdE5hbWVzID0gcGFyc2VkLmZpbGVOYW1lcy5tYXAoZiA9PiBwYXRoLm5vcm1hbGl6ZShmKSk7XG5cbiAgICBjb25zdCBvcHRpb25zID0gY3JlYXRlTmdDb21waWxlck9wdGlvbnMoYmFzZVBhdGgsIGNvbmZpZywgcGFyc2VkLm9wdGlvbnMpO1xuICAgIGxldCBlbWl0RmxhZ3MgPSBhcGkuRW1pdEZsYWdzLkRlZmF1bHQ7XG4gICAgaWYgKCEob3B0aW9ucy5za2lwTWV0YWRhdGFFbWl0IHx8IG9wdGlvbnMuZmxhdE1vZHVsZU91dEZpbGUpKSB7XG4gICAgICBlbWl0RmxhZ3MgfD0gYXBpLkVtaXRGbGFncy5NZXRhZGF0YTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuc2tpcFRlbXBsYXRlQ29kZWdlbikge1xuICAgICAgZW1pdEZsYWdzID0gZW1pdEZsYWdzICYgfmFwaS5FbWl0RmxhZ3MuQ29kZWdlbjtcbiAgICB9XG4gICAgcmV0dXJuIHtwcm9qZWN0OiBwcm9qZWN0RmlsZSwgcm9vdE5hbWVzLCBvcHRpb25zLCBlcnJvcnM6IHBhcnNlZC5lcnJvcnMsIGVtaXRGbGFnc307XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zdCBlcnJvcnM6IERpYWdub3N0aWNzID0gW3tcbiAgICAgIGNhdGVnb3J5OiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICBtZXNzYWdlVGV4dDogZS5zdGFjayxcbiAgICAgIHNvdXJjZTogYXBpLlNPVVJDRSxcbiAgICAgIGNvZGU6IGFwaS5VTktOT1dOX0VSUk9SX0NPREVcbiAgICB9XTtcbiAgICByZXR1cm4ge3Byb2plY3Q6ICcnLCBlcnJvcnMsIHJvb3ROYW1lczogW10sIG9wdGlvbnM6IHt9LCBlbWl0RmxhZ3M6IGFwaS5FbWl0RmxhZ3MuRGVmYXVsdH07XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBQZXJmb3JtQ29tcGlsYXRpb25SZXN1bHQge1xuICBkaWFnbm9zdGljczogRGlhZ25vc3RpY3M7XG4gIHByb2dyYW0/OiBhcGkuUHJvZ3JhbTtcbiAgZW1pdFJlc3VsdD86IHRzLkVtaXRSZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGl0Q29kZUZyb21SZXN1bHQoZGlhZ3M6IERpYWdub3N0aWNzIHwgdW5kZWZpbmVkKTogbnVtYmVyIHtcbiAgaWYgKCFkaWFncyB8fCBmaWx0ZXJFcnJvcnNBbmRXYXJuaW5ncyhkaWFncykubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gSWYgd2UgaGF2ZSBhIHJlc3VsdCBhbmQgZGlkbid0IGdldCBhbnkgZXJyb3JzLCB3ZSBzdWNjZWVkZWQuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvLyBSZXR1cm4gMiBpZiBhbnkgb2YgdGhlIGVycm9ycyB3ZXJlIHVua25vd24uXG4gIHJldHVybiBkaWFncy5zb21lKGQgPT4gZC5zb3VyY2UgPT09ICdhbmd1bGFyJyAmJiBkLmNvZGUgPT09IGFwaS5VTktOT1dOX0VSUk9SX0NPREUpID8gMiA6IDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwZXJmb3JtQ29tcGlsYXRpb24oe3Jvb3ROYW1lcywgb3B0aW9ucywgaG9zdCwgb2xkUHJvZ3JhbSwgZW1pdENhbGxiYWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VFbWl0UmVzdWx0c0NhbGxiYWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2F0aGVyRGlhZ25vc3RpY3MgPSBkZWZhdWx0R2F0aGVyRGlhZ25vc3RpY3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21UcmFuc2Zvcm1lcnMsIGVtaXRGbGFncyA9IGFwaS5FbWl0RmxhZ3MuRGVmYXVsdH06IHtcbiAgcm9vdE5hbWVzOiBzdHJpbmdbXSxcbiAgb3B0aW9uczogYXBpLkNvbXBpbGVyT3B0aW9ucyxcbiAgaG9zdD86IGFwaS5Db21waWxlckhvc3QsXG4gIG9sZFByb2dyYW0/OiBhcGkuUHJvZ3JhbSxcbiAgZW1pdENhbGxiYWNrPzogYXBpLlRzRW1pdENhbGxiYWNrLFxuICBtZXJnZUVtaXRSZXN1bHRzQ2FsbGJhY2s/OiBhcGkuVHNNZXJnZUVtaXRSZXN1bHRzQ2FsbGJhY2ssXG4gIGdhdGhlckRpYWdub3N0aWNzPzogKHByb2dyYW06IGFwaS5Qcm9ncmFtKSA9PiBEaWFnbm9zdGljcyxcbiAgY3VzdG9tVHJhbnNmb3JtZXJzPzogYXBpLkN1c3RvbVRyYW5zZm9ybWVycyxcbiAgZW1pdEZsYWdzPzogYXBpLkVtaXRGbGFnc1xufSk6IFBlcmZvcm1Db21waWxhdGlvblJlc3VsdCB7XG4gIGxldCBwcm9ncmFtOiBhcGkuUHJvZ3JhbXx1bmRlZmluZWQ7XG4gIGxldCBlbWl0UmVzdWx0OiB0cy5FbWl0UmVzdWx0fHVuZGVmaW5lZDtcbiAgbGV0IGFsbERpYWdub3N0aWNzOiBBcnJheTx0cy5EaWFnbm9zdGljfGFwaS5EaWFnbm9zdGljPiA9IFtdO1xuICB0cnkge1xuICAgIGlmICghaG9zdCkge1xuICAgICAgaG9zdCA9IG5nLmNyZWF0ZUNvbXBpbGVySG9zdCh7b3B0aW9uc30pO1xuICAgIH1cblxuICAgIHByb2dyYW0gPSBuZy5jcmVhdGVQcm9ncmFtKHtyb290TmFtZXMsIGhvc3QsIG9wdGlvbnMsIG9sZFByb2dyYW19KTtcblxuICAgIGNvbnN0IGJlZm9yZURpYWdzID0gRGF0ZS5ub3coKTtcbiAgICBhbGxEaWFnbm9zdGljcy5wdXNoKC4uLmdhdGhlckRpYWdub3N0aWNzKHByb2dyYW0gISkpO1xuICAgIGlmIChvcHRpb25zLmRpYWdub3N0aWNzKSB7XG4gICAgICBjb25zdCBhZnRlckRpYWdzID0gRGF0ZS5ub3coKTtcbiAgICAgIGFsbERpYWdub3N0aWNzLnB1c2goXG4gICAgICAgICAgY3JlYXRlTWVzc2FnZURpYWdub3N0aWMoYFRpbWUgZm9yIGRpYWdub3N0aWNzOiAke2FmdGVyRGlhZ3MgLSBiZWZvcmVEaWFnc31tcy5gKSk7XG4gICAgfVxuXG4gICAgaWYgKCFoYXNFcnJvcnMoYWxsRGlhZ25vc3RpY3MpKSB7XG4gICAgICBlbWl0UmVzdWx0ID1cbiAgICAgICAgICBwcm9ncmFtICEuZW1pdCh7ZW1pdENhbGxiYWNrLCBtZXJnZUVtaXRSZXN1bHRzQ2FsbGJhY2ssIGN1c3RvbVRyYW5zZm9ybWVycywgZW1pdEZsYWdzfSk7XG4gICAgICBhbGxEaWFnbm9zdGljcy5wdXNoKC4uLmVtaXRSZXN1bHQuZGlhZ25vc3RpY3MpO1xuICAgICAgcmV0dXJuIHtkaWFnbm9zdGljczogYWxsRGlhZ25vc3RpY3MsIHByb2dyYW0sIGVtaXRSZXN1bHR9O1xuICAgIH1cbiAgICByZXR1cm4ge2RpYWdub3N0aWNzOiBhbGxEaWFnbm9zdGljcywgcHJvZ3JhbX07XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsZXQgZXJyTXNnOiBzdHJpbmc7XG4gICAgbGV0IGNvZGU6IG51bWJlcjtcbiAgICBpZiAoaXNTeW50YXhFcnJvcihlKSkge1xuICAgICAgLy8gZG9uJ3QgcmVwb3J0IHRoZSBzdGFjayBmb3Igc3ludGF4IGVycm9ycyBhcyB0aGV5IGFyZSB3ZWxsIGtub3duIGVycm9ycy5cbiAgICAgIGVyck1zZyA9IGUubWVzc2FnZTtcbiAgICAgIGNvZGUgPSBhcGkuREVGQVVMVF9FUlJPUl9DT0RFO1xuICAgIH0gZWxzZSB7XG4gICAgICBlcnJNc2cgPSBlLnN0YWNrO1xuICAgICAgLy8gSXQgaXMgbm90IGEgc3ludGF4IGVycm9yIHdlIG1pZ2h0IGhhdmUgYSBwcm9ncmFtIHdpdGggdW5rbm93biBzdGF0ZSwgZGlzY2FyZCBpdC5cbiAgICAgIHByb2dyYW0gPSB1bmRlZmluZWQ7XG4gICAgICBjb2RlID0gYXBpLlVOS05PV05fRVJST1JfQ09ERTtcbiAgICB9XG4gICAgYWxsRGlhZ25vc3RpY3MucHVzaChcbiAgICAgICAge2NhdGVnb3J5OiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsIG1lc3NhZ2VUZXh0OiBlcnJNc2csIGNvZGUsIHNvdXJjZTogYXBpLlNPVVJDRX0pO1xuICAgIHJldHVybiB7ZGlhZ25vc3RpY3M6IGFsbERpYWdub3N0aWNzLCBwcm9ncmFtfTtcbiAgfVxufVxuZnVuY3Rpb24gZGVmYXVsdEdhdGhlckRpYWdub3N0aWNzKHByb2dyYW06IGFwaS5Qcm9ncmFtKTogRGlhZ25vc3RpY3Mge1xuICBjb25zdCBhbGxEaWFnbm9zdGljczogQXJyYXk8dHMuRGlhZ25vc3RpY3xhcGkuRGlhZ25vc3RpYz4gPSBbXTtcblxuICBmdW5jdGlvbiBjaGVja0RpYWdub3N0aWNzKGRpYWdzOiBEaWFnbm9zdGljcyB8IHVuZGVmaW5lZCkge1xuICAgIGlmIChkaWFncykge1xuICAgICAgYWxsRGlhZ25vc3RpY3MucHVzaCguLi5kaWFncyk7XG4gICAgICByZXR1cm4gIWhhc0Vycm9ycyhkaWFncyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgbGV0IGNoZWNrT3RoZXJEaWFnbm9zdGljcyA9IHRydWU7XG4gIC8vIENoZWNrIHBhcmFtZXRlciBkaWFnbm9zdGljc1xuICBjaGVja090aGVyRGlhZ25vc3RpY3MgPSBjaGVja090aGVyRGlhZ25vc3RpY3MgJiZcbiAgICAgIGNoZWNrRGlhZ25vc3RpY3MoWy4uLnByb2dyYW0uZ2V0VHNPcHRpb25EaWFnbm9zdGljcygpLCAuLi5wcm9ncmFtLmdldE5nT3B0aW9uRGlhZ25vc3RpY3MoKV0pO1xuXG4gIC8vIENoZWNrIHN5bnRhY3RpYyBkaWFnbm9zdGljc1xuICBjaGVja090aGVyRGlhZ25vc3RpY3MgPVxuICAgICAgY2hlY2tPdGhlckRpYWdub3N0aWNzICYmIGNoZWNrRGlhZ25vc3RpY3MocHJvZ3JhbS5nZXRUc1N5bnRhY3RpY0RpYWdub3N0aWNzKCkgYXMgRGlhZ25vc3RpY3MpO1xuXG4gIC8vIENoZWNrIFR5cGVTY3JpcHQgc2VtYW50aWMgYW5kIEFuZ3VsYXIgc3RydWN0dXJlIGRpYWdub3N0aWNzXG4gIGNoZWNrT3RoZXJEaWFnbm9zdGljcyA9XG4gICAgICBjaGVja090aGVyRGlhZ25vc3RpY3MgJiZcbiAgICAgIGNoZWNrRGlhZ25vc3RpY3MoXG4gICAgICAgICAgWy4uLnByb2dyYW0uZ2V0VHNTZW1hbnRpY0RpYWdub3N0aWNzKCksIC4uLnByb2dyYW0uZ2V0TmdTdHJ1Y3R1cmFsRGlhZ25vc3RpY3MoKV0pO1xuXG4gIC8vIENoZWNrIEFuZ3VsYXIgc2VtYW50aWMgZGlhZ25vc3RpY3NcbiAgY2hlY2tPdGhlckRpYWdub3N0aWNzID1cbiAgICAgIGNoZWNrT3RoZXJEaWFnbm9zdGljcyAmJiBjaGVja0RpYWdub3N0aWNzKHByb2dyYW0uZ2V0TmdTZW1hbnRpY0RpYWdub3N0aWNzKCkgYXMgRGlhZ25vc3RpY3MpO1xuXG4gIHJldHVybiBhbGxEaWFnbm9zdGljcztcbn1cblxuZnVuY3Rpb24gaGFzRXJyb3JzKGRpYWdzOiBEaWFnbm9zdGljcykge1xuICByZXR1cm4gZGlhZ3Muc29tZShkID0+IGQuY2F0ZWdvcnkgPT09IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcik7XG59XG4iXX0=