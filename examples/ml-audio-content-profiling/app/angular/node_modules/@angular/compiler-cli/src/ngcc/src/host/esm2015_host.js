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
        define("@angular/compiler-cli/src/ngcc/src/host/esm2015_host", ["require", "exports", "tslib", "fs", "typescript", "@angular/compiler-cli/src/ngcc/src/host/fesm2015_host"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var fs_1 = require("fs");
    var ts = require("typescript");
    var fesm2015_host_1 = require("@angular/compiler-cli/src/ngcc/src/host/fesm2015_host");
    var Esm2015ReflectionHost = /** @class */ (function (_super) {
        tslib_1.__extends(Esm2015ReflectionHost, _super);
        function Esm2015ReflectionHost(isCore, checker, dtsMapper) {
            var _this = _super.call(this, isCore, checker) || this;
            _this.dtsMapper = dtsMapper;
            return _this;
        }
        /**
         * Get the number of generic type parameters of a given class.
         *
         * @returns the number of type parameters of the class, if known, or `null` if the declaration
         * is not a class or has an unknown number of type parameters.
         */
        Esm2015ReflectionHost.prototype.getGenericArityOfClass = function (clazz) {
            if (ts.isClassDeclaration(clazz) && clazz.name) {
                var sourcePath = clazz.getSourceFile();
                var dtsPath = this.dtsMapper.getDtsFileNameFor(sourcePath.fileName);
                var dtsContents = fs_1.readFileSync(dtsPath, 'utf8');
                // TODO: investigate caching parsed .d.ts files as they're needed for several different
                // purposes in ngcc.
                var dtsFile = ts.createSourceFile(dtsPath, dtsContents, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
                for (var i = dtsFile.statements.length - 1; i >= 0; i--) {
                    var stmt = dtsFile.statements[i];
                    if (ts.isClassDeclaration(stmt) && stmt.name !== undefined &&
                        stmt.name.text === clazz.name.text) {
                        return stmt.typeParameters ? stmt.typeParameters.length : 0;
                    }
                }
            }
            return null;
        };
        return Esm2015ReflectionHost;
    }(fesm2015_host_1.Fesm2015ReflectionHost));
    exports.Esm2015ReflectionHost = Esm2015ReflectionHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNtMjAxNV9ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ2NjL3NyYy9ob3N0L2VzbTIwMTVfaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCx5QkFBZ0M7SUFDaEMsK0JBQWlDO0lBR2pDLHVGQUF1RDtJQUV2RDtRQUEyQyxpREFBc0I7UUFDL0QsK0JBQVksTUFBZSxFQUFFLE9BQXVCLEVBQVksU0FBb0I7WUFBcEYsWUFDRSxrQkFBTSxNQUFNLEVBQUUsT0FBTyxDQUFDLFNBQ3ZCO1lBRitELGVBQVMsR0FBVCxTQUFTLENBQVc7O1FBRXBGLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNILHNEQUFzQixHQUF0QixVQUF1QixLQUFxQjtZQUMxQyxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUM5QyxJQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pDLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0RSxJQUFNLFdBQVcsR0FBRyxpQkFBWSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDbEQsdUZBQXVGO2dCQUN2RixvQkFBb0I7Z0JBQ3BCLElBQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FDL0IsT0FBTyxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFM0UsS0FBSyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDdkQsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbkMsSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTO3dCQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTt3QkFDdEMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUM3RDtpQkFDRjthQUNGO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0gsNEJBQUM7SUFBRCxDQUFDLEFBL0JELENBQTJDLHNDQUFzQixHQStCaEU7SUEvQlksc0RBQXFCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3JlYWRGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7RHRzTWFwcGVyfSBmcm9tICcuL2R0c19tYXBwZXInO1xuaW1wb3J0IHtGZXNtMjAxNVJlZmxlY3Rpb25Ib3N0fSBmcm9tICcuL2Zlc20yMDE1X2hvc3QnO1xuXG5leHBvcnQgY2xhc3MgRXNtMjAxNVJlZmxlY3Rpb25Ib3N0IGV4dGVuZHMgRmVzbTIwMTVSZWZsZWN0aW9uSG9zdCB7XG4gIGNvbnN0cnVjdG9yKGlzQ29yZTogYm9vbGVhbiwgY2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHByb3RlY3RlZCBkdHNNYXBwZXI6IER0c01hcHBlcikge1xuICAgIHN1cGVyKGlzQ29yZSwgY2hlY2tlcik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgZ2VuZXJpYyB0eXBlIHBhcmFtZXRlcnMgb2YgYSBnaXZlbiBjbGFzcy5cbiAgICpcbiAgICogQHJldHVybnMgdGhlIG51bWJlciBvZiB0eXBlIHBhcmFtZXRlcnMgb2YgdGhlIGNsYXNzLCBpZiBrbm93biwgb3IgYG51bGxgIGlmIHRoZSBkZWNsYXJhdGlvblxuICAgKiBpcyBub3QgYSBjbGFzcyBvciBoYXMgYW4gdW5rbm93biBudW1iZXIgb2YgdHlwZSBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgZ2V0R2VuZXJpY0FyaXR5T2ZDbGFzcyhjbGF6ejogdHMuRGVjbGFyYXRpb24pOiBudW1iZXJ8bnVsbCB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihjbGF6eikgJiYgY2xhenoubmFtZSkge1xuICAgICAgY29uc3Qgc291cmNlUGF0aCA9IGNsYXp6LmdldFNvdXJjZUZpbGUoKTtcbiAgICAgIGNvbnN0IGR0c1BhdGggPSB0aGlzLmR0c01hcHBlci5nZXREdHNGaWxlTmFtZUZvcihzb3VyY2VQYXRoLmZpbGVOYW1lKTtcbiAgICAgIGNvbnN0IGR0c0NvbnRlbnRzID0gcmVhZEZpbGVTeW5jKGR0c1BhdGgsICd1dGY4Jyk7XG4gICAgICAvLyBUT0RPOiBpbnZlc3RpZ2F0ZSBjYWNoaW5nIHBhcnNlZCAuZC50cyBmaWxlcyBhcyB0aGV5J3JlIG5lZWRlZCBmb3Igc2V2ZXJhbCBkaWZmZXJlbnRcbiAgICAgIC8vIHB1cnBvc2VzIGluIG5nY2MuXG4gICAgICBjb25zdCBkdHNGaWxlID0gdHMuY3JlYXRlU291cmNlRmlsZShcbiAgICAgICAgICBkdHNQYXRoLCBkdHNDb250ZW50cywgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgZmFsc2UsIHRzLlNjcmlwdEtpbmQuVFMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gZHRzRmlsZS5zdGF0ZW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGNvbnN0IHN0bXQgPSBkdHNGaWxlLnN0YXRlbWVudHNbaV07XG4gICAgICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24oc3RtdCkgJiYgc3RtdC5uYW1lICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHN0bXQubmFtZS50ZXh0ID09PSBjbGF6ei5uYW1lLnRleHQpIHtcbiAgICAgICAgICByZXR1cm4gc3RtdC50eXBlUGFyYW1ldGVycyA/IHN0bXQudHlwZVBhcmFtZXRlcnMubGVuZ3RoIDogMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl19