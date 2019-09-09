"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
function validateDiagnostics(diagnostics, strict) {
    // Print error diagnostics.
    const hasError = diagnostics.some(diag => diag.category === ts.DiagnosticCategory.Error);
    if (hasError) {
        // Throw only if we're in strict mode, otherwise return original content.
        if (strict) {
            const errorMessages = ts.formatDiagnostics(diagnostics, {
                getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
                getNewLine: () => ts.sys.newLine,
                getCanonicalFileName: (f) => f,
            });
            throw new Error(`
        TS failed with the following error messages:

        ${errorMessages}
      `);
        }
        else {
            return false;
        }
    }
    return true;
}
function transformJavascript(options) {
    const { content, getTransforms, emitSourceMap, inputFilePath, outputFilePath, strict, } = options;
    // Bail if there's no transform to do.
    if (getTransforms.length === 0) {
        return {
            content: null,
            sourceMap: null,
            emitSkipped: true,
        };
    }
    const allowFastPath = options.typeCheck === false && !emitSourceMap;
    const outputs = new Map();
    const tempFilename = 'bo-default-file.js';
    const tempSourceFile = ts.createSourceFile(tempFilename, content, ts.ScriptTarget.Latest, allowFastPath);
    const parseDiagnostics = tempSourceFile.parseDiagnostics;
    const tsOptions = {
        // We target latest so that there is no downleveling.
        target: ts.ScriptTarget.Latest,
        isolatedModules: true,
        suppressOutputPathCheck: true,
        allowNonTsExtensions: true,
        noLib: true,
        noResolve: true,
        sourceMap: emitSourceMap,
        inlineSources: emitSourceMap,
        inlineSourceMap: false,
    };
    if (allowFastPath && parseDiagnostics) {
        if (!validateDiagnostics(parseDiagnostics, strict)) {
            return {
                content: null,
                sourceMap: null,
                emitSkipped: true,
            };
        }
        const transforms = getTransforms.map((getTf) => getTf(undefined));
        const result = ts.transform(tempSourceFile, transforms, tsOptions);
        if (result.transformed.length === 0 || result.transformed[0] === tempSourceFile) {
            return {
                content: null,
                sourceMap: null,
                emitSkipped: true,
            };
        }
        const printer = ts.createPrinter(undefined, {
            onEmitNode: result.emitNodeWithNotification,
            substituteNode: result.substituteNode,
        });
        const output = printer.printFile(result.transformed[0]);
        result.dispose();
        return {
            content: output,
            sourceMap: null,
            emitSkipped: false,
        };
    }
    const host = {
        getSourceFile: (fileName) => {
            if (fileName !== tempFilename) {
                throw new Error(`File ${fileName} does not have a sourceFile.`);
            }
            return tempSourceFile;
        },
        getDefaultLibFileName: () => 'lib.d.ts',
        getCurrentDirectory: () => '',
        getDirectories: () => [],
        getCanonicalFileName: (fileName) => fileName,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n',
        fileExists: (fileName) => fileName === tempFilename,
        readFile: (_fileName) => '',
        writeFile: (fileName, text) => outputs.set(fileName, text),
    };
    const program = ts.createProgram([tempFilename], tsOptions, host);
    const diagnostics = program.getSyntacticDiagnostics(tempSourceFile);
    if (!validateDiagnostics(diagnostics, strict)) {
        return {
            content: null,
            sourceMap: null,
            emitSkipped: true,
        };
    }
    // We need the checker inside transforms.
    const transforms = getTransforms.map((getTf) => getTf(program));
    program.emit(undefined, undefined, undefined, undefined, { before: transforms, after: [] });
    let transformedContent = outputs.get(tempFilename);
    if (!transformedContent) {
        return {
            content: null,
            sourceMap: null,
            emitSkipped: true,
        };
    }
    let sourceMap = null;
    const tsSourceMap = outputs.get(`${tempFilename}.map`);
    if (emitSourceMap && tsSourceMap) {
        const urlRegExp = /^\/\/# sourceMappingURL=[^\r\n]*/gm;
        sourceMap = JSON.parse(tsSourceMap);
        // Fix sourcemaps file references.
        if (outputFilePath) {
            sourceMap.file = outputFilePath;
            transformedContent = transformedContent.replace(urlRegExp, `//# sourceMappingURL=${sourceMap.file}.map\n`);
            if (inputFilePath) {
                sourceMap.sources = [inputFilePath];
            }
            else {
                sourceMap.sources = [''];
            }
        }
        else {
            // TODO: figure out if we should inline sources here.
            transformedContent = transformedContent.replace(urlRegExp, '');
            sourceMap.file = '';
            sourceMap.sources = [''];
        }
    }
    return {
        content: transformedContent,
        sourceMap,
        emitSkipped: false,
    };
}
exports.transformJavascript = transformJavascript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLWphdmFzY3JpcHQuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX29wdGltaXplci9zcmMvaGVscGVycy90cmFuc2Zvcm0tamF2YXNjcmlwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVFBLGlDQUFpQztBQXVCakMsU0FBUyxtQkFBbUIsQ0FBQyxXQUF5QyxFQUFFLE1BQWdCO0lBQ3RGLDJCQUEyQjtJQUUzQixNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxFQUFFLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekYsSUFBSSxRQUFRLEVBQUU7UUFDWix5RUFBeUU7UUFDekUsSUFBSSxNQUFNLEVBQUU7WUFDVixNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFO2dCQUN0RCxtQkFBbUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFO2dCQUN2RCxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPO2dCQUNoQyxvQkFBb0IsRUFBRSxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUN2QyxDQUFDLENBQUM7WUFFSCxNQUFNLElBQUksS0FBSyxDQUFDOzs7VUFHWixhQUFhO09BQ2hCLENBQUMsQ0FBQztTQUNKO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQztTQUNkO0tBQ0Y7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFnQixtQkFBbUIsQ0FDakMsT0FBbUM7SUFHbkMsTUFBTSxFQUNKLE9BQU8sRUFDUCxhQUFhLEVBQ2IsYUFBYSxFQUNiLGFBQWEsRUFDYixjQUFjLEVBQ2QsTUFBTSxHQUNQLEdBQUcsT0FBTyxDQUFD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SztLQUNuQixDQUFDO0FBQ0osQ0FBQztBQS9KRCxrREErSkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBSYXdTb3VyY2VNYXAgfSBmcm9tICdzb3VyY2UtbWFwJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJhbnNmb3JtSmF2YXNjcmlwdE9wdGlvbnMge1xuICBjb250ZW50OiBzdHJpbmc7XG4gIGlucHV0RmlsZVBhdGg/OiBzdHJpbmc7XG4gIG91dHB1dEZpbGVQYXRoPzogc3RyaW5nO1xuICBlbWl0U291cmNlTWFwPzogYm9vbGVhbjtcbiAgc3RyaWN0PzogYm9vbGVhbjtcbiAgdHlwZUNoZWNrPzogYm9vbGVhbjtcbiAgZ2V0VHJhbnNmb3JtczogQXJyYXk8KHByb2dyYW0/OiB0cy5Qcm9ncmFtKSA9PiB0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8dHMuU291cmNlRmlsZT4+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zZm9ybUphdmFzY3JpcHRPdXRwdXQge1xuICBjb250ZW50OiBzdHJpbmcgfCBudWxsO1xuICBzb3VyY2VNYXA6IFJhd1NvdXJjZU1hcCB8IG51bGw7XG4gIGVtaXRTa2lwcGVkOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgRGlhZ25vc3RpY1NvdXJjZUZpbGUgZXh0ZW5kcyB0cy5Tb3VyY2VGaWxlIHtcbiAgcmVhZG9ubHkgcGFyc2VEaWFnbm9zdGljcz86IFJlYWRvbmx5QXJyYXk8dHMuRGlhZ25vc3RpYz47XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlRGlhZ25vc3RpY3MoZGlhZ25vc3RpY3M6IFJlYWRvbmx5QXJyYXk8dHMuRGlhZ25vc3RpYz4sIHN0cmljdD86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgLy8gUHJpbnQgZXJyb3IgZGlhZ25vc3RpY3MuXG5cbiAgY29uc3QgaGFzRXJyb3IgPSBkaWFnbm9zdGljcy5zb21lKGRpYWcgPT4gZGlhZy5jYXRlZ29yeSA9PT0gdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yKTtcbiAgaWYgKGhhc0Vycm9yKSB7XG4gICAgLy8gVGhyb3cgb25seSBpZiB3ZSdyZSBpbiBzdHJpY3QgbW9kZSwgb3RoZXJ3aXNlIHJldHVybiBvcmlnaW5hbCBjb250ZW50LlxuICAgIGlmIChzdHJpY3QpIHtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZXMgPSB0cy5mb3JtYXREaWFnbm9zdGljcyhkaWFnbm9zdGljcywge1xuICAgICAgICBnZXRDdXJyZW50RGlyZWN0b3J5OiAoKSA9PiB0cy5zeXMuZ2V0Q3VycmVudERpcmVjdG9yeSgpLFxuICAgICAgICBnZXROZXdMaW5lOiAoKSA9PiB0cy5zeXMubmV3TGluZSxcbiAgICAgICAgZ2V0Q2Fub25pY2FsRmlsZU5hbWU6IChmOiBzdHJpbmcpID0+IGYsXG4gICAgICB9KTtcblxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBcbiAgICAgICAgVFMgZmFpbGVkIHdpdGggdGhlIGZvbGxvd2luZyBlcnJvciBtZXNzYWdlczpcblxuICAgICAgICAke2Vycm9yTWVzc2FnZXN9XG4gICAgICBgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtSmF2YXNjcmlwdChcbiAgb3B0aW9uczogVHJhbnNmb3JtSmF2YXNjcmlwdE9wdGlvbnMsXG4pOiBUcmFuc2Zvcm1KYXZhc2NyaXB0T3V0cHV0IHtcblxuICBjb25zdCB7XG4gICAgY29udGVudCxcbiAgICBnZXRUcmFuc2Zvcm1zLFxuICAgIGVtaXRTb3VyY2VNYXAsXG4gICAgaW5wdXRGaWxlUGF0aCxcbiAgICBvdXRwdXRGaWxlUGF0aCxcbiAgICBzdHJpY3QsXG4gIH0gPSBvcHRpb25zO1xuXG4gIC8vIEJhaWwgaWYgdGhlcmUncyBubyB0cmFuc2Zvcm0gdG8gZG8uXG4gIGlmIChnZXRUcmFuc2Zvcm1zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50OiBudWxsLFxuICAgICAgc291cmNlTWFwOiBudWxsLFxuICAgICAgZW1pdFNraXBwZWQ6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGFsbG93RmFzdFBhdGggPSBvcHRpb25zLnR5cGVDaGVjayA9PT0gZmFsc2UgJiYgIWVtaXRTb3VyY2VNYXA7XG4gIGNvbnN0IG91dHB1dHMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCB0ZW1wRmlsZW5hbWUgPSAnYm8tZGVmYXVsdC1maWxlLmpzJztcbiAgY29uc3QgdGVtcFNvdXJjZUZpbGUgPSB0cy5jcmVhdGVTb3VyY2VGaWxlKFxuICAgIHRlbXBGaWxlbmFtZSxcbiAgICBjb250ZW50LFxuICAgIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsXG4gICAgYWxsb3dGYXN0UGF0aCxcbiAgKTtcbiAgY29uc3QgcGFyc2VEaWFnbm9zdGljcyA9ICh0ZW1wU291cmNlRmlsZSBhcyBEaWFnbm9zdGljU291cmNlRmlsZSkucGFyc2VEaWFnbm9zdGljcztcblxuICBjb25zdCB0c09wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucyA9IHtcbiAgICAvLyBXZSB0YXJnZXQgbGF0ZXN0IHNvIHRoYXQgdGhlcmUgaXMgbm8gZG93bmxldmVsaW5nLlxuICAgIHRhcmdldDogdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCxcbiAgICBpc29sYXRlZE1vZHVsZXM6IHRydWUsXG4gICAgc3VwcHJlc3NPdXRwdXRQYXRoQ2hlY2s6IHRydWUsXG4gICAgYWxsb3dOb25Uc0V4dGVuc2lvbnM6IHRydWUsXG4gICAgbm9MaWI6IHRydWUsXG4gICAgbm9SZXNvbHZlOiB0cnVlLFxuICAgIHNvdXJjZU1hcDogZW1pdFNvdXJjZU1hcCxcbiAgICBpbmxpbmVTb3VyY2VzOiBlbWl0U291cmNlTWFwLFxuICAgIGlubGluZVNvdXJjZU1hcDogZmFsc2UsXG4gIH07XG5cbiAgaWYgKGFsbG93RmFzdFBhdGggJiYgcGFyc2VEaWFnbm9zdGljcykge1xuICAgIGlmICghdmFsaWRhdGVEaWFnbm9zdGljcyhwYXJzZURpYWdub3N0aWNzLCBzdHJpY3QpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50OiBudWxsLFxuICAgICAgICBzb3VyY2VNYXA6IG51bGwsXG4gICAgICAgIGVtaXRTa2lwcGVkOiB0cnVlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1zID0gZ2V0VHJhbnNmb3Jtcy5tYXAoKGdldFRmKSA9PiBnZXRUZih1bmRlZmluZWQpKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHRzLnRyYW5zZm9ybSh0ZW1wU291cmNlRmlsZSwgdHJhbnNmb3JtcywgdHNPcHRpb25zKTtcbiAgICBpZiAocmVzdWx0LnRyYW5zZm9ybWVkLmxlbmd0aCA9PT0gMCB8fCByZXN1bHQudHJhbnNmb3JtZWRbMF0gPT09IHRlbXBTb3VyY2VGaWxlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50OiBudWxsLFxuICAgICAgICBzb3VyY2VNYXA6IG51bGwsXG4gICAgICAgIGVtaXRTa2lwcGVkOiB0cnVlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcihcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIHtcbiAgICAgICAgb25FbWl0Tm9kZTogcmVzdWx0LmVtaXROb2RlV2l0aE5vdGlmaWNhdGlvbixcbiAgICAgICAgc3Vic3RpdHV0ZU5vZGU6IHJlc3VsdC5zdWJzdGl0dXRlTm9kZSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGNvbnN0IG91dHB1dCA9IHByaW50ZXIucHJpbnRGaWxlKHJlc3VsdC50cmFuc2Zvcm1lZFswXSk7XG5cbiAgICByZXN1bHQuZGlzcG9zZSgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnQ6IG91dHB1dCxcbiAgICAgIHNvdXJjZU1hcDogbnVsbCxcbiAgICAgIGVtaXRTa2lwcGVkOiBmYWxzZSxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgaG9zdDogdHMuQ29tcGlsZXJIb3N0ID0ge1xuICAgIGdldFNvdXJjZUZpbGU6IChmaWxlTmFtZSkgPT4ge1xuICAgICAgaWYgKGZpbGVOYW1lICE9PSB0ZW1wRmlsZW5hbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaWxlICR7ZmlsZU5hbWV9IGRvZXMgbm90IGhhdmUgYSBzb3VyY2VGaWxlLmApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGVtcFNvdXJjZUZpbGU7XG4gICAgfSxcbiAgICBnZXREZWZhdWx0TGliRmlsZU5hbWU6ICgpID0+ICdsaWIuZC50cycsXG4gICAgZ2V0Q3VycmVudERpcmVjdG9yeTogKCkgPT4gJycsXG4gICAgZ2V0RGlyZWN0b3JpZXM6ICgpID0+IFtdLFxuICAgIGdldENhbm9uaWNhbEZpbGVOYW1lOiAoZmlsZU5hbWUpID0+IGZpbGVOYW1lLFxuICAgIHVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXM6ICgpID0+IHRydWUsXG4gICAgZ2V0TmV3TGluZTogKCkgPT4gJ1xcbicsXG4gICAgZmlsZUV4aXN0czogKGZpbGVOYW1lKSA9PiBmaWxlTmFtZSA9PT0gdGVtcEZpbGVuYW1lLFxuICAgIHJlYWRGaWxlOiAoX2ZpbGVOYW1lKSA9PiAnJyxcbiAgICB3cml0ZUZpbGU6IChmaWxlTmFtZSwgdGV4dCkgPT4gb3V0cHV0cy5zZXQoZmlsZU5hbWUsIHRleHQpLFxuICB9O1xuXG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKFt0ZW1wRmlsZW5hbWVdLCB0c09wdGlvbnMsIGhvc3QpO1xuXG4gIGNvbnN0IGRpYWdub3N0aWNzID0gcHJvZ3JhbS5nZXRTeW50YWN0aWNEaWFnbm9zdGljcyh0ZW1wU291cmNlRmlsZSk7XG4gIGlmICghdmFsaWRhdGVEaWFnbm9zdGljcyhkaWFnbm9zdGljcywgc3RyaWN0KSkge1xuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50OiBudWxsLFxuICAgICAgc291cmNlTWFwOiBudWxsLFxuICAgICAgZW1pdFNraXBwZWQ6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIC8vIFdlIG5lZWQgdGhlIGNoZWNrZXIgaW5zaWRlIHRyYW5zZm9ybXMuXG4gIGNvbnN0IHRyYW5zZm9ybXMgPSBnZXRUcmFuc2Zvcm1zLm1hcCgoZ2V0VGYpID0+IGdldFRmKHByb2dyYW0pKTtcblxuICBwcm9ncmFtLmVtaXQodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB7IGJlZm9yZTogdHJhbnNmb3JtcywgYWZ0ZXI6IFtdIH0pO1xuXG4gIGxldCB0cmFuc2Zvcm1lZENvbnRlbnQgPSBvdXRwdXRzLmdldCh0ZW1wRmlsZW5hbWUpO1xuXG4gIGlmICghdHJhbnNmb3JtZWRDb250ZW50KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnQ6IG51bGwsXG4gICAgICBzb3VyY2VNYXA6IG51bGwsXG4gICAgICBlbWl0U2tpcHBlZDogdHJ1ZSxcbiAgICB9O1xuICB9XG5cbiAgbGV0IHNvdXJjZU1hcDogUmF3U291cmNlTWFwIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IHRzU291cmNlTWFwID0gb3V0cHV0cy5nZXQoYCR7dGVtcEZpbGVuYW1lfS5tYXBgKTtcblxuICBpZiAoZW1pdFNvdXJjZU1hcCAmJiB0c1NvdXJjZU1hcCkge1xuICAgIGNvbnN0IHVybFJlZ0V4cCA9IC9eXFwvXFwvIyBzb3VyY2VNYXBwaW5nVVJMPVteXFxyXFxuXSovZ207XG4gICAgc291cmNlTWFwID0gSlNPTi5wYXJzZSh0c1NvdXJjZU1hcCkgYXMgUmF3U291cmNlTWFwO1xuICAgIC8vIEZpeCBzb3VyY2VtYXBzIGZpbGUgcmVmZXJlbmNlcy5cbiAgICBpZiAob3V0cHV0RmlsZVBhdGgpIHtcbiAgICAgIHNvdXJjZU1hcC5maWxlID0gb3V0cHV0RmlsZVBhdGg7XG4gICAgICB0cmFuc2Zvcm1lZENvbnRlbnQgPSB0cmFuc2Zvcm1lZENvbnRlbnQucmVwbGFjZSh1cmxSZWdFeHAsXG4gICAgICAgIGAvLyMgc291cmNlTWFwcGluZ1VSTD0ke3NvdXJjZU1hcC5maWxlfS5tYXBcXG5gKTtcbiAgICAgIGlmIChpbnB1dEZpbGVQYXRoKSB7XG4gICAgICAgIHNvdXJjZU1hcC5zb3VyY2VzID0gW2lucHV0RmlsZVBhdGhdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc291cmNlTWFwLnNvdXJjZXMgPSBbJyddO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IGlmIHdlIHNob3VsZCBpbmxpbmUgc291cmNlcyBoZXJlLlxuICAgICAgdHJhbnNmb3JtZWRDb250ZW50ID0gdHJhbnNmb3JtZWRDb250ZW50LnJlcGxhY2UodXJsUmVnRXhwLCAnJyk7XG4gICAgICBzb3VyY2VNYXAuZmlsZSA9ICcnO1xuICAgICAgc291cmNlTWFwLnNvdXJjZXMgPSBbJyddO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY29udGVudDogdHJhbnNmb3JtZWRDb250ZW50LFxuICAgIHNvdXJjZU1hcCxcbiAgICBlbWl0U2tpcHBlZDogZmFsc2UsXG4gIH07XG59XG4iXX0=