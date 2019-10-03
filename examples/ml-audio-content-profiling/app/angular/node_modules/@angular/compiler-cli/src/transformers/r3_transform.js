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
        define("@angular/compiler-cli/src/transformers/r3_transform", ["require", "exports", "tslib", "@angular/compiler-cli/src/transformers/node_emitter"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var node_emitter_1 = require("@angular/compiler-cli/src/transformers/node_emitter");
    /**
     * Returns a transformer that adds the requested static methods specified by modules.
     */
    function getAngularClassTransformerFactory(modules) {
        if (modules.length === 0) {
            // If no modules are specified, just return an identity transform.
            return function () { return function (sf) { return sf; }; };
        }
        var moduleMap = new Map(modules.map(function (m) { return [m.fileName, m]; }));
        return function (context) {
            return function (sourceFile) {
                var module = moduleMap.get(sourceFile.fileName);
                if (module && module.statements.length > 0) {
                    var _a = tslib_1.__read(node_emitter_1.updateSourceFile(sourceFile, module, context), 1), newSourceFile = _a[0];
                    return newSourceFile;
                }
                return sourceFile;
            };
        };
    }
    exports.getAngularClassTransformerFactory = getAngularClassTransformerFactory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy90cmFuc2Zvcm1lcnMvcjNfdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUtILG9GQUFnRDtJQUtoRDs7T0FFRztJQUNILFNBQWdCLGlDQUFpQyxDQUFDLE9BQXdCO1FBQ3hFLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDeEIsa0VBQWtFO1lBQ2xFLE9BQU8sY0FBTSxPQUFBLFVBQUEsRUFBRSxJQUFJLE9BQUEsRUFBRSxFQUFGLENBQUUsRUFBUixDQUFRLENBQUM7U0FDdkI7UUFDRCxJQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUEwQixVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBZixDQUFlLENBQUMsQ0FBQyxDQUFDO1FBQ3RGLE9BQU8sVUFBUyxPQUFpQztZQUMvQyxPQUFPLFVBQVMsVUFBeUI7Z0JBQ3ZDLElBQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ3BDLElBQUEsb0ZBQStELEVBQTlELHFCQUE4RCxDQUFDO29CQUN0RSxPQUFPLGFBQWEsQ0FBQztpQkFDdEI7Z0JBQ0QsT0FBTyxVQUFVLENBQUM7WUFDcEIsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQWhCRCw4RUFnQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGFydGlhbE1vZHVsZSwgU3RhdGVtZW50LCBTdGF0aWNTeW1ib2x9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge3VwZGF0ZVNvdXJjZUZpbGV9IGZyb20gJy4vbm9kZV9lbWl0dGVyJztcblxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtZXIgPSAoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkgPT4gdHMuU291cmNlRmlsZTtcbmV4cG9ydCB0eXBlIFRyYW5zZm9ybWVyRmFjdG9yeSA9IChjb250ZXh0OiB0cy5UcmFuc2Zvcm1hdGlvbkNvbnRleHQpID0+IFRyYW5zZm9ybWVyO1xuXG4vKipcbiAqIFJldHVybnMgYSB0cmFuc2Zvcm1lciB0aGF0IGFkZHMgdGhlIHJlcXVlc3RlZCBzdGF0aWMgbWV0aG9kcyBzcGVjaWZpZWQgYnkgbW9kdWxlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFuZ3VsYXJDbGFzc1RyYW5zZm9ybWVyRmFjdG9yeShtb2R1bGVzOiBQYXJ0aWFsTW9kdWxlW10pOiBUcmFuc2Zvcm1lckZhY3Rvcnkge1xuICBpZiAobW9kdWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAvLyBJZiBubyBtb2R1bGVzIGFyZSBzcGVjaWZpZWQsIGp1c3QgcmV0dXJuIGFuIGlkZW50aXR5IHRyYW5zZm9ybS5cbiAgICByZXR1cm4gKCkgPT4gc2YgPT4gc2Y7XG4gIH1cbiAgY29uc3QgbW9kdWxlTWFwID0gbmV3IE1hcChtb2R1bGVzLm1hcDxbc3RyaW5nLCBQYXJ0aWFsTW9kdWxlXT4obSA9PiBbbS5maWxlTmFtZSwgbV0pKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQ6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuU291cmNlRmlsZSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBtb2R1bGVNYXAuZ2V0KHNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgICAgaWYgKG1vZHVsZSAmJiBtb2R1bGUuc3RhdGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IFtuZXdTb3VyY2VGaWxlXSA9IHVwZGF0ZVNvdXJjZUZpbGUoc291cmNlRmlsZSwgbW9kdWxlLCBjb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIG5ld1NvdXJjZUZpbGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gc291cmNlRmlsZTtcbiAgICB9O1xuICB9O1xufVxuIl19