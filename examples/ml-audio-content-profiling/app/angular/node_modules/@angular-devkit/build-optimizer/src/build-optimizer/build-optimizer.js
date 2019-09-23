"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const fs_1 = require("fs");
const transform_javascript_1 = require("../helpers/transform-javascript");
const class_fold_1 = require("../transforms/class-fold");
const import_tslib_1 = require("../transforms/import-tslib");
const prefix_classes_1 = require("../transforms/prefix-classes");
const prefix_functions_1 = require("../transforms/prefix-functions");
const scrub_file_1 = require("../transforms/scrub-file");
const wrap_enums_1 = require("../transforms/wrap-enums");
// Angular packages are known to have no side effects.
const whitelistedAngularModules = [
    /[\\/]node_modules[\\/]@angular[\\/]animations[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]common[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]compiler[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]core[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]forms[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]http[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]platform-browser-dynamic[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]platform-browser[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]platform-webworker-dynamic[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]platform-webworker[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]router[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]upgrade[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]material[\\/]/,
    /[\\/]node_modules[\\/]@angular[\\/]cdk[\\/]/,
];
// Factories created by AOT are known to have no side effects.
// In Angular 2/4 the file path for factories can be `.ts`, but in Angular 5 it is `.js`.
const ngFactories = [
    /\.ngfactory\.[jt]s/,
    /\.ngstyle\.[jt]s/,
];
function isKnownSideEffectFree(filePath) {
    return ngFactories.some((re) => re.test(filePath)) ||
        whitelistedAngularModules.some((re) => re.test(filePath));
}
function buildOptimizer(options) {
    const { inputFilePath } = options;
    let { originalFilePath, content } = options;
    if (!originalFilePath && inputFilePath) {
        originalFilePath = inputFilePath;
    }
    if (!inputFilePath && content === undefined) {
        throw new Error('Either filePath or content must be specified in options.');
    }
    if (content === undefined) {
        content = fs_1.readFileSync(inputFilePath, 'UTF-8');
    }
    if (!content) {
        return {
            content: null,
            sourceMap: null,
            emitSkipped: true,
        };
    }
    const isWebpackBundle = content.indexOf('__webpack_require__') !== -1;
    // Determine which transforms to apply.
    const getTransforms = [];
    let typeCheck = false;
    if (options.isSideEffectFree || originalFilePath && isKnownSideEffectFree(originalFilePath)) {
        getTransforms.push(
        // getPrefixFunctionsTransformer is rather dangerous, apply only to known pure es5 modules.
        // It will mark both `require()` calls and `console.log(stuff)` as pure.
        // We only apply it to whitelisted modules, since we know they are safe.
        // getPrefixFunctionsTransformer needs to be before getFoldFileTransformer.
        prefix_functions_1.getPrefixFunctionsTransformer, scrub_file_1.getScrubFileTransformer, class_fold_1.getFoldFileTransformer);
        typeCheck = true;
    }
    else if (scrub_file_1.testScrubFile(content)) {
        // Always test as these require the type checker
        getTransforms.push(scrub_file_1.getScrubFileTransformer, class_fold_1.getFoldFileTransformer);
        typeCheck = true;
    }
    // tests are not needed for fast path
    // usage will be expanded once transformers are verified safe
    const ignoreTest = !options.emitSourceMap && !typeCheck;
    if (prefix_classes_1.testPrefixClasses(content)) {
        getTransforms.unshift(prefix_classes_1.getPrefixClassesTransformer);
    }
    // This transform introduces import/require() calls, but this won't work properly on libraries
    // built with Webpack. These libraries use __webpack_require__() calls instead, which will break
    // with a new import that wasn't part of it's original module list.
    // We ignore this transform for such libraries.
    if (!isWebpackBundle && (ignoreTest || import_tslib_1.testImportTslib(content))) {
        getTransforms.unshift(import_tslib_1.getImportTslibTransformer);
    }
    getTransforms.unshift(wrap_enums_1.getWrapEnumsTransformer);
    const transformJavascriptOpts = {
        content: content,
        inputFilePath: options.inputFilePath,
        outputFilePath: options.outputFilePath,
        emitSourceMap: options.emitSourceMap,
        strict: options.strict,
        getTransforms,
        typeCheck,
    };
    return transform_javascript_1.transformJavascript(transformJavascriptOpts);
}
exports.buildOptimizer = buildOptimizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtb3B0aW1pemVyLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9vcHRpbWl6ZXIvc3JjL2J1aWxkLW9wdGltaXplci9idWlsZC1vcHRpbWl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwyQkFBa0M7QUFDbEMsMEVBSXlDO0FBQ3pDLHlEQUFrRTtBQUNsRSw2REFBd0Y7QUFDeEYsaUVBQThGO0FBQzlGLHFFQUErRTtBQUMvRSx5REFBa0Y7QUFDbEYseURBQW1FO0FBR25FLHNEQUFzRDtBQUN0RCxNQUFNLHlCQUF5QixHQUFHO0lBQ2hDLG9EQUFvRDtJQUNwRCxnREFBZ0Q7SUFDaEQsa0RBQWtEO0lBQ2xELDhDQUE4QztJQUM5QywrQ0FBK0M7SUFDL0MsOENBQThDO0lBQzlDLGtFQUFrRTtJQUNsRSwwREFBMEQ7SUFDMUQsb0VBQW9FO0lBQ3BFLDREQUE0RDtJQUM1RCxnREFBZ0Q7SUFDaEQsaURBQWlEO0lBQ2pELGtEQUFrRDtJQUNsRCw2Q0FBNkM7Q0FDOUMsQ0FBQztBQUVGLDhEQUE4RDtBQUM5RCx5RkFBeUY7QUFDekYsTUFBTSxXQUFXLEdBQUc7SUFDbEIsb0JBQW9CO0lBQ3BCLGtCQUFrQjtDQUNuQixDQUFDO0FBRUYsU0FBUyxxQkFBcUIsQ0FBQyxRQUFnQjtJQUM3QyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQVlELFNBQWdCLGNBQWMsQ0FBQyxPQUE4QjtJQUUzRCxNQUFNLEVBQUUsYUFBYSxFQUFFLEdBQUcsT0FBTyxDQUFDO0lBQ2xDLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUM7SUFFNUMsSUFBSSxDQUFDLGdCQUFnQixJQUFJLGFBQWEsRUFBRTtRQUN0QyxnQkFBZ0IsR0FBRyxhQUFhLENBQUM7S0FDbEM7SUFFRCxJQUFJLENBQUMsYUFBYSxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7UUFDM0MsTUFBTSxJQUFJLEtBQUssQ0FBQywwREFBMEQsQ0FBQyxDQUFDO0tBQzdFO0lBRUQsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO1FBQ3pCLE9BQU8sR0FBRyxpQkFBWSxDQUFDLGFBQXVCLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDMUQ7SUFFRCxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTztZQUNMLE9BQU8sRUFBRSxJQUFJO1lBQ2IsU0FBUyxFQUFFLElBQUk7WUFDZixXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFDO0tBQ0g7SUFFRCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFdEUsdUNBQXVDO0lBQ3ZDLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUV6QixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDdEIsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLElBQUksZ0JBQWdCLElBQUkscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtRQUMzRixhQUFhLENBQUMsSUFBSTtRQUNoQiwyRkFBMkY7UUFDM0Ysd0VBQXdFO1FBQ3hFLHdFQUF3RTtRQUN4RSwyRUFBMkU7UUFDM0UsZ0RBQTZCLEVBQzdCLG9DQUF1QixFQUN2QixtQ0FBc0IsQ0FDdkIsQ0FBQztRQUNGLFNBQVMsR0FBRyxJQUFJLENBQUM7S0FDbEI7U0FBTSxJQUFJLDBCQUFhLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDakMsZ0RBQWdEO1FBQ2hELGFBQWEsQ0FBQyxJQUFJLENBQ2hCLG9DQUF1QixFQUN2QixtQ0FBc0IsQ0FDdkIsQ0FBQztRQUNGLFNBQVMsR0FBRyxJQUFJLENBQUM7S0FDbEI7SUFFRCxxQ0FBcUM7SUFDckMsNkRBQTZEO0lBQzdELE1BQU0sVUFBVSxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUV4RCxJQUFJLGtDQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzlCLGFBQWEsQ0FBQyxPQUFPLENBQUMsNENBQTJCLENBQUMsQ0FBQztLQUNwRDtJQUVELDhGQUE4RjtJQUM5RixnR0FBZ0c7SUFDaEcsbUVBQW1FO0lBQ25FLCtDQUErQztJQUMvQyxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsVUFBVSxJQUFJLDhCQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTtRQUNoRSxhQUFhLENBQUMsT0FBTyxDQUFDLHdDQUF5QixDQUFDLENBQUM7S0FDbEQ7SUFFRCxhQUFhLENBQUMsT0FBTyxDQUFDLG9DQUF1QixDQUFDLENBQUM7SUFFL0MsTUFBTSx1QkFBdUIsR0FBK0I7UUFDMUQsT0FBTyxFQUFFLE9BQU87UUFDaEIsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhO1FBQ3BDLGNBQWMsRUFBRSxPQUFPLENBQUMsY0FBYztRQUN0QyxhQUFhLEVBQUUsT0FBTyxDQUFDLGFBQWE7UUFDcEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNO1FBQ3RCLGFBQWE7UUFDYixTQUFTO0tBQ1YsQ0FBQztJQUVGLE9BQU8sMENBQW1CLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBaEZELHdDQWdGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7XG4gIFRyYW5zZm9ybUphdmFzY3JpcHRPcHRpb25zLFxuICBUcmFuc2Zvcm1KYXZhc2NyaXB0T3V0cHV0LFxuICB0cmFuc2Zvcm1KYXZhc2NyaXB0LFxufSBmcm9tICcuLi9oZWxwZXJzL3RyYW5zZm9ybS1qYXZhc2NyaXB0JztcbmltcG9ydCB7IGdldEZvbGRGaWxlVHJhbnNmb3JtZXIgfSBmcm9tICcuLi90cmFuc2Zvcm1zL2NsYXNzLWZvbGQnO1xuaW1wb3J0IHsgZ2V0SW1wb3J0VHNsaWJUcmFuc2Zvcm1lciwgdGVzdEltcG9ydFRzbGliIH0gZnJvbSAnLi4vdHJhbnNmb3Jtcy9pbXBvcnQtdHNsaWInO1xuaW1wb3J0IHsgZ2V0UHJlZml4Q2xhc3Nlc1RyYW5zZm9ybWVyLCB0ZXN0UHJlZml4Q2xhc3NlcyB9IGZyb20gJy4uL3RyYW5zZm9ybXMvcHJlZml4LWNsYXNzZXMnO1xuaW1wb3J0IHsgZ2V0UHJlZml4RnVuY3Rpb25zVHJhbnNmb3JtZXIgfSBmcm9tICcuLi90cmFuc2Zvcm1zL3ByZWZpeC1mdW5jdGlvbnMnO1xuaW1wb3J0IHsgZ2V0U2NydWJGaWxlVHJhbnNmb3JtZXIsIHRlc3RTY3J1YkZpbGUgfSBmcm9tICcuLi90cmFuc2Zvcm1zL3NjcnViLWZpbGUnO1xuaW1wb3J0IHsgZ2V0V3JhcEVudW1zVHJhbnNmb3JtZXIgfSBmcm9tICcuLi90cmFuc2Zvcm1zL3dyYXAtZW51bXMnO1xuXG5cbi8vIEFuZ3VsYXIgcGFja2FnZXMgYXJlIGtub3duIHRvIGhhdmUgbm8gc2lkZSBlZmZlY3RzLlxuY29uc3Qgd2hpdGVsaXN0ZWRBbmd1bGFyTW9kdWxlcyA9IFtcbiAgL1tcXFxcL11ub2RlX21vZHVsZXNbXFxcXC9dQGFuZ3VsYXJbXFxcXC9dYW5pbWF0aW9uc1tcXFxcL10vLFxuICAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL11AYW5ndWxhcltcXFxcL11jb21tb25bXFxcXC9dLyxcbiAgL1tcXFxcL11ub2RlX21vZHVsZXNbXFxcXC9dQGFuZ3VsYXJbXFxcXC9dY29tcGlsZXJbXFxcXC9dLyxcbiAgL1tcXFxcL11ub2RlX21vZHVsZXNbXFxcXC9dQGFuZ3VsYXJbXFxcXC9dY29yZVtcXFxcL10vLFxuICAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL11AYW5ndWxhcltcXFxcL11mb3Jtc1tcXFxcL10vLFxuICAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL11AYW5ndWxhcltcXFxcL11odHRwW1xcXFwvXS8sXG4gIC9bXFxcXC9dbm9kZV9tb2R1bGVzW1xcXFwvXUBhbmd1bGFyW1xcXFwvXXBsYXRmb3JtLWJyb3dzZXItZHluYW1pY1tcXFxcL10vLFxuICAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL11AYW5ndWxhcltcXFxcL11wbGF0Zm9ybS1icm93c2VyW1xcXFwvXS8sXG4gIC9bXFxcXC9dbm9kZV9tb2R1bGVzW1xcXFwvXUBhbmd1bGFyW1xcXFwvXXBsYXRmb3JtLXdlYndvcmtlci1keW5hbWljW1xcXFwvXS8sXG4gIC9bXFxcXC9dbm9kZV9tb2R1bGVzW1xcXFwvXUBhbmd1bGFyW1xcXFwvXXBsYXRmb3JtLXdlYndvcmtlcltcXFxcL10vLFxuICAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL11AYW5ndWxhcltcXFxcL11yb3V0ZXJbXFxcXC9dLyxcbiAgL1tcXFxcL11ub2RlX21vZHVsZXNbXFxcXC9dQGFuZ3VsYXJbXFxcXC9ddXBncmFkZVtcXFxcL10vLFxuICAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL11AYW5ndWxhcltcXFxcL11tYXRlcmlhbFtcXFxcL10vLFxuICAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL11AYW5ndWxhcltcXFxcL11jZGtbXFxcXC9dLyxcbl07XG5cbi8vIEZhY3RvcmllcyBjcmVhdGVkIGJ5IEFPVCBhcmUga25vd24gdG8gaGF2ZSBubyBzaWRlIGVmZmVjdHMuXG4vLyBJbiBBbmd1bGFyIDIvNCB0aGUgZmlsZSBwYXRoIGZvciBmYWN0b3JpZXMgY2FuIGJlIGAudHNgLCBidXQgaW4gQW5ndWxhciA1IGl0IGlzIGAuanNgLlxuY29uc3QgbmdGYWN0b3JpZXMgPSBbXG4gIC9cXC5uZ2ZhY3RvcnlcXC5banRdcy8sXG4gIC9cXC5uZ3N0eWxlXFwuW2p0XXMvLFxuXTtcblxuZnVuY3Rpb24gaXNLbm93blNpZGVFZmZlY3RGcmVlKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgcmV0dXJuIG5nRmFjdG9yaWVzLnNvbWUoKHJlKSA9PiByZS50ZXN0KGZpbGVQYXRoKSkgfHxcbiAgICB3aGl0ZWxpc3RlZEFuZ3VsYXJNb2R1bGVzLnNvbWUoKHJlKSA9PiByZS50ZXN0KGZpbGVQYXRoKSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnVpbGRPcHRpbWl6ZXJPcHRpb25zIHtcbiAgY29udGVudD86IHN0cmluZztcbiAgb3JpZ2luYWxGaWxlUGF0aD86IHN0cmluZztcbiAgaW5wdXRGaWxlUGF0aD86IHN0cmluZztcbiAgb3V0cHV0RmlsZVBhdGg/OiBzdHJpbmc7XG4gIGVtaXRTb3VyY2VNYXA/OiBib29sZWFuO1xuICBzdHJpY3Q/OiBib29sZWFuO1xuICBpc1NpZGVFZmZlY3RGcmVlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkT3B0aW1pemVyKG9wdGlvbnM6IEJ1aWxkT3B0aW1pemVyT3B0aW9ucyk6IFRyYW5zZm9ybUphdmFzY3JpcHRPdXRwdXQge1xuXG4gIGNvbnN0IHsgaW5wdXRGaWxlUGF0aCB9ID0gb3B0aW9ucztcbiAgbGV0IHsgb3JpZ2luYWxGaWxlUGF0aCwgY29udGVudCB9ID0gb3B0aW9ucztcblxuICBpZiAoIW9yaWdpbmFsRmlsZVBhdGggJiYgaW5wdXRGaWxlUGF0aCkge1xuICAgIG9yaWdpbmFsRmlsZVBhdGggPSBpbnB1dEZpbGVQYXRoO1xuICB9XG5cbiAgaWYgKCFpbnB1dEZpbGVQYXRoICYmIGNvbnRlbnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignRWl0aGVyIGZpbGVQYXRoIG9yIGNvbnRlbnQgbXVzdCBiZSBzcGVjaWZpZWQgaW4gb3B0aW9ucy4nKTtcbiAgfVxuXG4gIGlmIChjb250ZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGlucHV0RmlsZVBhdGggYXMgc3RyaW5nLCAnVVRGLTgnKTtcbiAgfVxuXG4gIGlmICghY29udGVudCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50OiBudWxsLFxuICAgICAgc291cmNlTWFwOiBudWxsLFxuICAgICAgZW1pdFNraXBwZWQ6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGlzV2VicGFja0J1bmRsZSA9IGNvbnRlbnQuaW5kZXhPZignX193ZWJwYWNrX3JlcXVpcmVfXycpICE9PSAtMTtcblxuICAvLyBEZXRlcm1pbmUgd2hpY2ggdHJhbnNmb3JtcyB0byBhcHBseS5cbiAgY29uc3QgZ2V0VHJhbnNmb3JtcyA9IFtdO1xuXG4gIGxldCB0eXBlQ2hlY2sgPSBmYWxzZTtcbiAgaWYgKG9wdGlvbnMuaXNTaWRlRWZmZWN0RnJlZSB8fCBvcmlnaW5hbEZpbGVQYXRoICYmIGlzS25vd25TaWRlRWZmZWN0RnJlZShvcmlnaW5hbEZpbGVQYXRoKSkge1xuICAgIGdldFRyYW5zZm9ybXMucHVzaChcbiAgICAgIC8vIGdldFByZWZpeEZ1bmN0aW9uc1RyYW5zZm9ybWVyIGlzIHJhdGhlciBkYW5nZXJvdXMsIGFwcGx5IG9ubHkgdG8ga25vd24gcHVyZSBlczUgbW9kdWxlcy5cbiAgICAgIC8vIEl0IHdpbGwgbWFyayBib3RoIGByZXF1aXJlKClgIGNhbGxzIGFuZCBgY29uc29sZS5sb2coc3R1ZmYpYCBhcyBwdXJlLlxuICAgICAgLy8gV2Ugb25seSBhcHBseSBpdCB0byB3aGl0ZWxpc3RlZCBtb2R1bGVzLCBzaW5jZSB3ZSBrbm93IHRoZXkgYXJlIHNhZmUuXG4gICAgICAvLyBnZXRQcmVmaXhGdW5jdGlvbnNUcmFuc2Zvcm1lciBuZWVkcyB0byBiZSBiZWZvcmUgZ2V0Rm9sZEZpbGVUcmFuc2Zvcm1lci5cbiAgICAgIGdldFByZWZpeEZ1bmN0aW9uc1RyYW5zZm9ybWVyLFxuICAgICAgZ2V0U2NydWJGaWxlVHJhbnNmb3JtZXIsXG4gICAgICBnZXRGb2xkRmlsZVRyYW5zZm9ybWVyLFxuICAgICk7XG4gICAgdHlwZUNoZWNrID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICh0ZXN0U2NydWJGaWxlKGNvbnRlbnQpKSB7XG4gICAgLy8gQWx3YXlzIHRlc3QgYXMgdGhlc2UgcmVxdWlyZSB0aGUgdHlwZSBjaGVja2VyXG4gICAgZ2V0VHJhbnNmb3Jtcy5wdXNoKFxuICAgICAgZ2V0U2NydWJGaWxlVHJhbnNmb3JtZXIsXG4gICAgICBnZXRGb2xkRmlsZVRyYW5zZm9ybWVyLFxuICAgICk7XG4gICAgdHlwZUNoZWNrID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIHRlc3RzIGFyZSBub3QgbmVlZGVkIGZvciBmYXN0IHBhdGhcbiAgLy8gdXNhZ2Ugd2lsbCBiZSBleHBhbmRlZCBvbmNlIHRyYW5zZm9ybWVycyBhcmUgdmVyaWZpZWQgc2FmZVxuICBjb25zdCBpZ25vcmVUZXN0ID0gIW9wdGlvbnMuZW1pdFNvdXJjZU1hcCAmJiAhdHlwZUNoZWNrO1xuXG4gIGlmICh0ZXN0UHJlZml4Q2xhc3Nlcyhjb250ZW50KSkge1xuICAgIGdldFRyYW5zZm9ybXMudW5zaGlmdChnZXRQcmVmaXhDbGFzc2VzVHJhbnNmb3JtZXIpO1xuICB9XG5cbiAgLy8gVGhpcyB0cmFuc2Zvcm0gaW50cm9kdWNlcyBpbXBvcnQvcmVxdWlyZSgpIGNhbGxzLCBidXQgdGhpcyB3b24ndCB3b3JrIHByb3Blcmx5IG9uIGxpYnJhcmllc1xuICAvLyBidWlsdCB3aXRoIFdlYnBhY2suIFRoZXNlIGxpYnJhcmllcyB1c2UgX193ZWJwYWNrX3JlcXVpcmVfXygpIGNhbGxzIGluc3RlYWQsIHdoaWNoIHdpbGwgYnJlYWtcbiAgLy8gd2l0aCBhIG5ldyBpbXBvcnQgdGhhdCB3YXNuJ3QgcGFydCBvZiBpdCdzIG9yaWdpbmFsIG1vZHVsZSBsaXN0LlxuICAvLyBXZSBpZ25vcmUgdGhpcyB0cmFuc2Zvcm0gZm9yIHN1Y2ggbGlicmFyaWVzLlxuICBpZiAoIWlzV2VicGFja0J1bmRsZSAmJiAoaWdub3JlVGVzdCB8fCB0ZXN0SW1wb3J0VHNsaWIoY29udGVudCkpKSB7XG4gICAgZ2V0VHJhbnNmb3Jtcy51bnNoaWZ0KGdldEltcG9ydFRzbGliVHJhbnNmb3JtZXIpO1xuICB9XG5cbiAgZ2V0VHJhbnNmb3Jtcy51bnNoaWZ0KGdldFdyYXBFbnVtc1RyYW5zZm9ybWVyKTtcblxuICBjb25zdCB0cmFuc2Zvcm1KYXZhc2NyaXB0T3B0czogVHJhbnNmb3JtSmF2YXNjcmlwdE9wdGlvbnMgPSB7XG4gICAgY29udGVudDogY29udGVudCxcbiAgICBpbnB1dEZpbGVQYXRoOiBvcHRpb25zLmlucHV0RmlsZVBhdGgsXG4gICAgb3V0cHV0RmlsZVBhdGg6IG9wdGlvbnMub3V0cHV0RmlsZVBhdGgsXG4gICAgZW1pdFNvdXJjZU1hcDogb3B0aW9ucy5lbWl0U291cmNlTWFwLFxuICAgIHN0cmljdDogb3B0aW9ucy5zdHJpY3QsXG4gICAgZ2V0VHJhbnNmb3JtcyxcbiAgICB0eXBlQ2hlY2ssXG4gIH07XG5cbiAgcmV0dXJuIHRyYW5zZm9ybUphdmFzY3JpcHQodHJhbnNmb3JtSmF2YXNjcmlwdE9wdHMpO1xufVxuIl19