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
        define("@angular/compiler/src/render3/r3_jit", ["require", "exports", "tslib", "@angular/compiler/src/output/output_ast", "@angular/compiler/src/output/output_jit"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var o = require("@angular/compiler/src/output/output_ast");
    var output_jit_1 = require("@angular/compiler/src/output/output_jit");
    /**
     * Implementation of `CompileReflector` which resolves references to @angular/core
     * symbols at runtime, according to a consumer-provided mapping.
     *
     * Only supports `resolveExternalReference`, all other methods throw.
     */
    var R3JitReflector = /** @class */ (function () {
        function R3JitReflector(context) {
            this.context = context;
        }
        R3JitReflector.prototype.resolveExternalReference = function (ref) {
            // This reflector only handles @angular/core imports.
            if (ref.moduleName !== '@angular/core') {
                throw new Error("Cannot resolve external reference to " + ref.moduleName + ", only references to @angular/core are supported.");
            }
            if (!this.context.hasOwnProperty(ref.name)) {
                throw new Error("No value provided for @angular/core symbol '" + ref.name + "'.");
            }
            return this.context[ref.name];
        };
        R3JitReflector.prototype.parameters = function (typeOrFunc) { throw new Error('Not implemented.'); };
        R3JitReflector.prototype.annotations = function (typeOrFunc) { throw new Error('Not implemented.'); };
        R3JitReflector.prototype.shallowAnnotations = function (typeOrFunc) { throw new Error('Not implemented.'); };
        R3JitReflector.prototype.tryAnnotations = function (typeOrFunc) { throw new Error('Not implemented.'); };
        R3JitReflector.prototype.propMetadata = function (typeOrFunc) { throw new Error('Not implemented.'); };
        R3JitReflector.prototype.hasLifecycleHook = function (type, lcProperty) { throw new Error('Not implemented.'); };
        R3JitReflector.prototype.guards = function (typeOrFunc) { throw new Error('Not implemented.'); };
        R3JitReflector.prototype.componentModuleUrl = function (type, cmpMetadata) { throw new Error('Not implemented.'); };
        return R3JitReflector;
    }());
    /**
     * JIT compiles an expression and returns the result of executing that expression.
     *
     * @param def the definition which will be compiled and executed to get the value to patch
     * @param context an object map of @angular/core symbol names to symbols which will be available in
     * the context of the compiled expression
     * @param sourceUrl a URL to use for the source map of the compiled expression
     * @param constantPool an optional `ConstantPool` which contains constants used in the expression
     */
    function jitExpression(def, context, sourceUrl, preStatements) {
        // The ConstantPool may contain Statements which declare variables used in the final expression.
        // Therefore, its statements need to precede the actual JIT operation. The final statement is a
        // declaration of $def which is set to the expression being compiled.
        var statements = tslib_1.__spread(preStatements, [
            new o.DeclareVarStmt('$def', def, undefined, [o.StmtModifier.Exported]),
        ]);
        var res = output_jit_1.jitStatements(sourceUrl, statements, new R3JitReflector(context), false);
        return res['$def'];
    }
    exports.jitExpression = jitExpression;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaml0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3JlbmRlcjMvcjNfaml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUlILDJEQUEwQztJQUMxQyxzRUFBbUQ7SUFFbkQ7Ozs7O09BS0c7SUFDSDtRQUNFLHdCQUFvQixPQUE2QjtZQUE3QixZQUFPLEdBQVAsT0FBTyxDQUFzQjtRQUFHLENBQUM7UUFFckQsaURBQXdCLEdBQXhCLFVBQXlCLEdBQXdCO1lBQy9DLHFEQUFxRDtZQUNyRCxJQUFJLEdBQUcsQ0FBQyxVQUFVLEtBQUssZUFBZSxFQUFFO2dCQUN0QyxNQUFNLElBQUksS0FBSyxDQUNYLDBDQUF3QyxHQUFHLENBQUMsVUFBVSxzREFBbUQsQ0FBQyxDQUFDO2FBQ2hIO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFNLENBQUMsRUFBRTtnQkFDNUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBK0MsR0FBRyxDQUFDLElBQUssT0FBSSxDQUFDLENBQUM7YUFDL0U7WUFDRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQU0sQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxtQ0FBVSxHQUFWLFVBQVcsVUFBZSxJQUFhLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFN0Usb0NBQVcsR0FBWCxVQUFZLFVBQWUsSUFBVyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTVFLDJDQUFrQixHQUFsQixVQUFtQixVQUFlLElBQVcsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVuRix1Q0FBYyxHQUFkLFVBQWUsVUFBZSxJQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFL0UscUNBQVksR0FBWixVQUFhLFVBQWUsSUFBNkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUvRix5Q0FBZ0IsR0FBaEIsVUFBaUIsSUFBUyxFQUFFLFVBQWtCLElBQWEsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVqRywrQkFBTSxHQUFOLFVBQU8sVUFBZSxJQUEyQixNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXZGLDJDQUFrQixHQUFsQixVQUFtQixJQUFTLEVBQUUsV0FBZ0IsSUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xHLHFCQUFDO0lBQUQsQ0FBQyxBQTlCRCxJQThCQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsU0FBZ0IsYUFBYSxDQUN6QixHQUFpQixFQUFFLE9BQTZCLEVBQUUsU0FBaUIsRUFDbkUsYUFBNEI7UUFDOUIsZ0dBQWdHO1FBQ2hHLCtGQUErRjtRQUMvRixxRUFBcUU7UUFDckUsSUFBTSxVQUFVLG9CQUNYLGFBQWE7WUFDaEIsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztVQUN4RSxDQUFDO1FBRUYsSUFBTSxHQUFHLEdBQUcsMEJBQWEsQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JGLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFiRCxzQ0FhQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21waWxlUmVmbGVjdG9yfSBmcm9tICcuLi9jb21waWxlX3JlZmxlY3Rvcic7XG5pbXBvcnQge0NvbnN0YW50UG9vbH0gZnJvbSAnLi4vY29uc3RhbnRfcG9vbCc7XG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCB7aml0U3RhdGVtZW50c30gZnJvbSAnLi4vb3V0cHV0L291dHB1dF9qaXQnO1xuXG4vKipcbiAqIEltcGxlbWVudGF0aW9uIG9mIGBDb21waWxlUmVmbGVjdG9yYCB3aGljaCByZXNvbHZlcyByZWZlcmVuY2VzIHRvIEBhbmd1bGFyL2NvcmVcbiAqIHN5bWJvbHMgYXQgcnVudGltZSwgYWNjb3JkaW5nIHRvIGEgY29uc3VtZXItcHJvdmlkZWQgbWFwcGluZy5cbiAqXG4gKiBPbmx5IHN1cHBvcnRzIGByZXNvbHZlRXh0ZXJuYWxSZWZlcmVuY2VgLCBhbGwgb3RoZXIgbWV0aG9kcyB0aHJvdy5cbiAqL1xuY2xhc3MgUjNKaXRSZWZsZWN0b3IgaW1wbGVtZW50cyBDb21waWxlUmVmbGVjdG9yIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb250ZXh0OiB7W2tleTogc3RyaW5nXTogYW55fSkge31cblxuICByZXNvbHZlRXh0ZXJuYWxSZWZlcmVuY2UocmVmOiBvLkV4dGVybmFsUmVmZXJlbmNlKTogYW55IHtcbiAgICAvLyBUaGlzIHJlZmxlY3RvciBvbmx5IGhhbmRsZXMgQGFuZ3VsYXIvY29yZSBpbXBvcnRzLlxuICAgIGlmIChyZWYubW9kdWxlTmFtZSAhPT0gJ0Bhbmd1bGFyL2NvcmUnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCByZXNvbHZlIGV4dGVybmFsIHJlZmVyZW5jZSB0byAke3JlZi5tb2R1bGVOYW1lfSwgb25seSByZWZlcmVuY2VzIHRvIEBhbmd1bGFyL2NvcmUgYXJlIHN1cHBvcnRlZC5gKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmNvbnRleHQuaGFzT3duUHJvcGVydHkocmVmLm5hbWUgISkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gdmFsdWUgcHJvdmlkZWQgZm9yIEBhbmd1bGFyL2NvcmUgc3ltYm9sICcke3JlZi5uYW1lIX0nLmApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jb250ZXh0W3JlZi5uYW1lICFdO1xuICB9XG5cbiAgcGFyYW1ldGVycyh0eXBlT3JGdW5jOiBhbnkpOiBhbnlbXVtdIHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQuJyk7IH1cblxuICBhbm5vdGF0aW9ucyh0eXBlT3JGdW5jOiBhbnkpOiBhbnlbXSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkLicpOyB9XG5cbiAgc2hhbGxvd0Fubm90YXRpb25zKHR5cGVPckZ1bmM6IGFueSk6IGFueVtdIHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQuJyk7IH1cblxuICB0cnlBbm5vdGF0aW9ucyh0eXBlT3JGdW5jOiBhbnkpOiBhbnlbXSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkLicpOyB9XG5cbiAgcHJvcE1ldGFkYXRhKHR5cGVPckZ1bmM6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnlbXTt9IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQuJyk7IH1cblxuICBoYXNMaWZlY3ljbGVIb29rKHR5cGU6IGFueSwgbGNQcm9wZXJ0eTogc3RyaW5nKTogYm9vbGVhbiB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkLicpOyB9XG5cbiAgZ3VhcmRzKHR5cGVPckZ1bmM6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnk7fSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkLicpOyB9XG5cbiAgY29tcG9uZW50TW9kdWxlVXJsKHR5cGU6IGFueSwgY21wTWV0YWRhdGE6IGFueSk6IHN0cmluZyB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkLicpOyB9XG59XG5cbi8qKlxuICogSklUIGNvbXBpbGVzIGFuIGV4cHJlc3Npb24gYW5kIHJldHVybnMgdGhlIHJlc3VsdCBvZiBleGVjdXRpbmcgdGhhdCBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSBkZWYgdGhlIGRlZmluaXRpb24gd2hpY2ggd2lsbCBiZSBjb21waWxlZCBhbmQgZXhlY3V0ZWQgdG8gZ2V0IHRoZSB2YWx1ZSB0byBwYXRjaFxuICogQHBhcmFtIGNvbnRleHQgYW4gb2JqZWN0IG1hcCBvZiBAYW5ndWxhci9jb3JlIHN5bWJvbCBuYW1lcyB0byBzeW1ib2xzIHdoaWNoIHdpbGwgYmUgYXZhaWxhYmxlIGluXG4gKiB0aGUgY29udGV4dCBvZiB0aGUgY29tcGlsZWQgZXhwcmVzc2lvblxuICogQHBhcmFtIHNvdXJjZVVybCBhIFVSTCB0byB1c2UgZm9yIHRoZSBzb3VyY2UgbWFwIG9mIHRoZSBjb21waWxlZCBleHByZXNzaW9uXG4gKiBAcGFyYW0gY29uc3RhbnRQb29sIGFuIG9wdGlvbmFsIGBDb25zdGFudFBvb2xgIHdoaWNoIGNvbnRhaW5zIGNvbnN0YW50cyB1c2VkIGluIHRoZSBleHByZXNzaW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBqaXRFeHByZXNzaW9uKFxuICAgIGRlZjogby5FeHByZXNzaW9uLCBjb250ZXh0OiB7W2tleTogc3RyaW5nXTogYW55fSwgc291cmNlVXJsOiBzdHJpbmcsXG4gICAgcHJlU3RhdGVtZW50czogby5TdGF0ZW1lbnRbXSk6IGFueSB7XG4gIC8vIFRoZSBDb25zdGFudFBvb2wgbWF5IGNvbnRhaW4gU3RhdGVtZW50cyB3aGljaCBkZWNsYXJlIHZhcmlhYmxlcyB1c2VkIGluIHRoZSBmaW5hbCBleHByZXNzaW9uLlxuICAvLyBUaGVyZWZvcmUsIGl0cyBzdGF0ZW1lbnRzIG5lZWQgdG8gcHJlY2VkZSB0aGUgYWN0dWFsIEpJVCBvcGVyYXRpb24uIFRoZSBmaW5hbCBzdGF0ZW1lbnQgaXMgYVxuICAvLyBkZWNsYXJhdGlvbiBvZiAkZGVmIHdoaWNoIGlzIHNldCB0byB0aGUgZXhwcmVzc2lvbiBiZWluZyBjb21waWxlZC5cbiAgY29uc3Qgc3RhdGVtZW50czogby5TdGF0ZW1lbnRbXSA9IFtcbiAgICAuLi5wcmVTdGF0ZW1lbnRzLFxuICAgIG5ldyBvLkRlY2xhcmVWYXJTdG10KCckZGVmJywgZGVmLCB1bmRlZmluZWQsIFtvLlN0bXRNb2RpZmllci5FeHBvcnRlZF0pLFxuICBdO1xuXG4gIGNvbnN0IHJlcyA9IGppdFN0YXRlbWVudHMoc291cmNlVXJsLCBzdGF0ZW1lbnRzLCBuZXcgUjNKaXRSZWZsZWN0b3IoY29udGV4dCksIGZhbHNlKTtcbiAgcmV0dXJuIHJlc1snJGRlZiddO1xufVxuIl19