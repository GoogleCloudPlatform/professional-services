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
        define("@angular/compiler-cli/src/transformers/nocollapse_hack", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Closure compiler transforms the form `Service.ngInjectableDef = X` into
    // `Service$ngInjectableDef = X`. To prevent this transformation, such assignments need to be
    // annotated with @nocollapse. Unfortunately, a bug in Typescript where comments aren't propagated
    // through the TS transformations precludes adding the comment via the AST. This workaround detects
    // the static assignments to R3 properties such as ngInjectableDef using a regex, as output files
    // are written, and applies the annotation through regex replacement.
    //
    // TODO(alxhub): clean up once fix for TS transformers lands in upstream
    //
    // Typescript reference issue: https://github.com/Microsoft/TypeScript/issues/22497
    // Pattern matching all Render3 property names.
    var R3_DEF_NAME_PATTERN = [
        'ngBaseDef',
        'ngComponentDef',
        'ngDirectiveDef',
        'ngInjectableDef',
        'ngInjectorDef',
        'ngModuleDef',
        'ngPipeDef',
    ].join('|');
    // Pattern matching `Identifier.property` where property is a Render3 property.
    var R3_DEF_ACCESS_PATTERN = "[^\\s\\.()[\\]]+.(" + R3_DEF_NAME_PATTERN + ")";
    // Pattern matching a source line that contains a Render3 static property assignment.
    // It declares two matching groups - one for the preceding whitespace, the second for the rest
    // of the assignment expression.
    var R3_DEF_LINE_PATTERN = "^(\\s*)(" + R3_DEF_ACCESS_PATTERN + " = .*)$";
    // Regex compilation of R3_DEF_LINE_PATTERN. Matching group 1 yields the whitespace preceding the
    // assignment, matching group 2 gives the rest of the assignment expressions.
    var R3_MATCH_DEFS = new RegExp(R3_DEF_LINE_PATTERN, 'gmu');
    var R3_TSICKLE_DECL_PATTERN = "(\\/\\*\\*[*\\s]*)(@[^*]+\\*\\/\\s+[^.]+\\.(?:" + R3_DEF_NAME_PATTERN + ");)";
    var R3_MATCH_TSICKLE_DECL = new RegExp(R3_TSICKLE_DECL_PATTERN, 'gmu');
    // Replacement string that complements R3_MATCH_DEFS. It inserts `/** @nocollapse */` before the
    // assignment but after any indentation. Note that this will mess up any sourcemaps on this line
    // (though there shouldn't be any, since Render3 properties are synthetic).
    var R3_NOCOLLAPSE_DEFS = '$1\/** @nocollapse *\/ $2';
    var R3_NOCOLLAPSE_TSICKLE_DECL = '$1@nocollapse $2';
    function nocollapseHack(contents) {
        return contents.replace(R3_MATCH_DEFS, R3_NOCOLLAPSE_DEFS)
            .replace(R3_MATCH_TSICKLE_DECL, R3_NOCOLLAPSE_TSICKLE_DECL);
    }
    exports.nocollapseHack = nocollapseHack;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9jb2xsYXBzZV9oYWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy90cmFuc2Zvcm1lcnMvbm9jb2xsYXBzZV9oYWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsMEVBQTBFO0lBQzFFLDZGQUE2RjtJQUM3RixrR0FBa0c7SUFDbEcsbUdBQW1HO0lBQ25HLGlHQUFpRztJQUNqRyxxRUFBcUU7SUFDckUsRUFBRTtJQUNGLHdFQUF3RTtJQUN4RSxFQUFFO0lBQ0YsbUZBQW1GO0lBRW5GLCtDQUErQztJQUMvQyxJQUFNLG1CQUFtQixHQUFHO1FBQzFCLFdBQVc7UUFDWCxnQkFBZ0I7UUFDaEIsZ0JBQWdCO1FBQ2hCLGlCQUFpQjtRQUNqQixlQUFlO1FBQ2YsYUFBYTtRQUNiLFdBQVc7S0FDWixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVaLCtFQUErRTtJQUMvRSxJQUFNLHFCQUFxQixHQUFHLHVCQUFzQixtQkFBbUIsTUFBRyxDQUFDO0lBRTNFLHFGQUFxRjtJQUNyRiw4RkFBOEY7SUFDOUYsZ0NBQWdDO0lBQ2hDLElBQU0sbUJBQW1CLEdBQUcsYUFBVyxxQkFBcUIsWUFBUyxDQUFDO0lBRXRFLGlHQUFpRztJQUNqRyw2RUFBNkU7SUFDN0UsSUFBTSxhQUFhLEdBQUcsSUFBSSxNQUFNLENBQUMsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFN0QsSUFBTSx1QkFBdUIsR0FDekIsbURBQWlELG1CQUFtQixRQUFLLENBQUM7SUFFOUUsSUFBTSxxQkFBcUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV6RSxnR0FBZ0c7SUFDaEcsZ0dBQWdHO0lBQ2hHLDJFQUEyRTtJQUMzRSxJQUFNLGtCQUFrQixHQUFHLDJCQUEyQixDQUFDO0lBRXZELElBQU0sMEJBQTBCLEdBQUcsa0JBQWtCLENBQUM7SUFFdEQsU0FBZ0IsY0FBYyxDQUFDLFFBQWdCO1FBQzdDLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLENBQUM7YUFDckQsT0FBTyxDQUFDLHFCQUFxQixFQUFFLDBCQUEwQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUhELHdDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBDbG9zdXJlIGNvbXBpbGVyIHRyYW5zZm9ybXMgdGhlIGZvcm0gYFNlcnZpY2UubmdJbmplY3RhYmxlRGVmID0gWGAgaW50b1xuLy8gYFNlcnZpY2UkbmdJbmplY3RhYmxlRGVmID0gWGAuIFRvIHByZXZlbnQgdGhpcyB0cmFuc2Zvcm1hdGlvbiwgc3VjaCBhc3NpZ25tZW50cyBuZWVkIHRvIGJlXG4vLyBhbm5vdGF0ZWQgd2l0aCBAbm9jb2xsYXBzZS4gVW5mb3J0dW5hdGVseSwgYSBidWcgaW4gVHlwZXNjcmlwdCB3aGVyZSBjb21tZW50cyBhcmVuJ3QgcHJvcGFnYXRlZFxuLy8gdGhyb3VnaCB0aGUgVFMgdHJhbnNmb3JtYXRpb25zIHByZWNsdWRlcyBhZGRpbmcgdGhlIGNvbW1lbnQgdmlhIHRoZSBBU1QuIFRoaXMgd29ya2Fyb3VuZCBkZXRlY3RzXG4vLyB0aGUgc3RhdGljIGFzc2lnbm1lbnRzIHRvIFIzIHByb3BlcnRpZXMgc3VjaCBhcyBuZ0luamVjdGFibGVEZWYgdXNpbmcgYSByZWdleCwgYXMgb3V0cHV0IGZpbGVzXG4vLyBhcmUgd3JpdHRlbiwgYW5kIGFwcGxpZXMgdGhlIGFubm90YXRpb24gdGhyb3VnaCByZWdleCByZXBsYWNlbWVudC5cbi8vXG4vLyBUT0RPKGFseGh1Yik6IGNsZWFuIHVwIG9uY2UgZml4IGZvciBUUyB0cmFuc2Zvcm1lcnMgbGFuZHMgaW4gdXBzdHJlYW1cbi8vXG4vLyBUeXBlc2NyaXB0IHJlZmVyZW5jZSBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8yMjQ5N1xuXG4vLyBQYXR0ZXJuIG1hdGNoaW5nIGFsbCBSZW5kZXIzIHByb3BlcnR5IG5hbWVzLlxuY29uc3QgUjNfREVGX05BTUVfUEFUVEVSTiA9IFtcbiAgJ25nQmFzZURlZicsXG4gICduZ0NvbXBvbmVudERlZicsXG4gICduZ0RpcmVjdGl2ZURlZicsXG4gICduZ0luamVjdGFibGVEZWYnLFxuICAnbmdJbmplY3RvckRlZicsXG4gICduZ01vZHVsZURlZicsXG4gICduZ1BpcGVEZWYnLFxuXS5qb2luKCd8Jyk7XG5cbi8vIFBhdHRlcm4gbWF0Y2hpbmcgYElkZW50aWZpZXIucHJvcGVydHlgIHdoZXJlIHByb3BlcnR5IGlzIGEgUmVuZGVyMyBwcm9wZXJ0eS5cbmNvbnN0IFIzX0RFRl9BQ0NFU1NfUEFUVEVSTiA9IGBbXlxcXFxzXFxcXC4oKVtcXFxcXV0rXFwuKCR7UjNfREVGX05BTUVfUEFUVEVSTn0pYDtcblxuLy8gUGF0dGVybiBtYXRjaGluZyBhIHNvdXJjZSBsaW5lIHRoYXQgY29udGFpbnMgYSBSZW5kZXIzIHN0YXRpYyBwcm9wZXJ0eSBhc3NpZ25tZW50LlxuLy8gSXQgZGVjbGFyZXMgdHdvIG1hdGNoaW5nIGdyb3VwcyAtIG9uZSBmb3IgdGhlIHByZWNlZGluZyB3aGl0ZXNwYWNlLCB0aGUgc2Vjb25kIGZvciB0aGUgcmVzdFxuLy8gb2YgdGhlIGFzc2lnbm1lbnQgZXhwcmVzc2lvbi5cbmNvbnN0IFIzX0RFRl9MSU5FX1BBVFRFUk4gPSBgXihcXFxccyopKCR7UjNfREVGX0FDQ0VTU19QQVRURVJOfSA9IC4qKSRgO1xuXG4vLyBSZWdleCBjb21waWxhdGlvbiBvZiBSM19ERUZfTElORV9QQVRURVJOLiBNYXRjaGluZyBncm91cCAxIHlpZWxkcyB0aGUgd2hpdGVzcGFjZSBwcmVjZWRpbmcgdGhlXG4vLyBhc3NpZ25tZW50LCBtYXRjaGluZyBncm91cCAyIGdpdmVzIHRoZSByZXN0IG9mIHRoZSBhc3NpZ25tZW50IGV4cHJlc3Npb25zLlxuY29uc3QgUjNfTUFUQ0hfREVGUyA9IG5ldyBSZWdFeHAoUjNfREVGX0xJTkVfUEFUVEVSTiwgJ2dtdScpO1xuXG5jb25zdCBSM19UU0lDS0xFX0RFQ0xfUEFUVEVSTiA9XG4gICAgYChcXFxcL1xcXFwqXFxcXCpbKlxcXFxzXSopKEBbXipdK1xcXFwqXFxcXC9cXFxccytbXi5dK1xcXFwuKD86JHtSM19ERUZfTkFNRV9QQVRURVJOfSk7KWA7XG5cbmNvbnN0IFIzX01BVENIX1RTSUNLTEVfREVDTCA9IG5ldyBSZWdFeHAoUjNfVFNJQ0tMRV9ERUNMX1BBVFRFUk4sICdnbXUnKTtcblxuLy8gUmVwbGFjZW1lbnQgc3RyaW5nIHRoYXQgY29tcGxlbWVudHMgUjNfTUFUQ0hfREVGUy4gSXQgaW5zZXJ0cyBgLyoqIEBub2NvbGxhcHNlICovYCBiZWZvcmUgdGhlXG4vLyBhc3NpZ25tZW50IGJ1dCBhZnRlciBhbnkgaW5kZW50YXRpb24uIE5vdGUgdGhhdCB0aGlzIHdpbGwgbWVzcyB1cCBhbnkgc291cmNlbWFwcyBvbiB0aGlzIGxpbmVcbi8vICh0aG91Z2ggdGhlcmUgc2hvdWxkbid0IGJlIGFueSwgc2luY2UgUmVuZGVyMyBwcm9wZXJ0aWVzIGFyZSBzeW50aGV0aWMpLlxuY29uc3QgUjNfTk9DT0xMQVBTRV9ERUZTID0gJyQxXFwvKiogQG5vY29sbGFwc2UgKlxcLyAkMic7XG5cbmNvbnN0IFIzX05PQ09MTEFQU0VfVFNJQ0tMRV9ERUNMID0gJyQxQG5vY29sbGFwc2UgJDInO1xuXG5leHBvcnQgZnVuY3Rpb24gbm9jb2xsYXBzZUhhY2soY29udGVudHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZW50cy5yZXBsYWNlKFIzX01BVENIX0RFRlMsIFIzX05PQ09MTEFQU0VfREVGUylcbiAgICAgIC5yZXBsYWNlKFIzX01BVENIX1RTSUNLTEVfREVDTCwgUjNfTk9DT0xMQVBTRV9UU0lDS0xFX0RFQ0wpO1xufVxuIl19