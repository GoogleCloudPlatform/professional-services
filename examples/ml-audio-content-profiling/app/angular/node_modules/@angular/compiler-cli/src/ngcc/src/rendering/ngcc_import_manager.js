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
        define("@angular/compiler-cli/src/ngcc/src/rendering/ngcc_import_manager", ["require", "exports", "tslib", "@angular/compiler-cli/src/ngtsc/translator"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var translator_1 = require("@angular/compiler-cli/src/ngtsc/translator");
    var NgccImportManager = /** @class */ (function (_super) {
        tslib_1.__extends(NgccImportManager, _super);
        function NgccImportManager(isFlat, isCore, prefix) {
            var _this = _super.call(this, isCore, prefix) || this;
            _this.isFlat = isFlat;
            return _this;
        }
        NgccImportManager.prototype.generateNamedImport = function (moduleName, symbol) {
            if (this.isFlat && this.isCore && moduleName === '@angular/core') {
                return null;
            }
            return _super.prototype.generateNamedImport.call(this, moduleName, symbol);
        };
        return NgccImportManager;
    }(translator_1.ImportManager));
    exports.NgccImportManager = NgccImportManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdjY19pbXBvcnRfbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmdjYy9zcmMvcmVuZGVyaW5nL25nY2NfaW1wb3J0X21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgseUVBQXdEO0lBRXhEO1FBQXVDLDZDQUFhO1FBQ2xELDJCQUFvQixNQUFlLEVBQUUsTUFBZSxFQUFFLE1BQWU7WUFBckUsWUFBeUUsa0JBQU0sTUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFHO1lBQTdFLFlBQU0sR0FBTixNQUFNLENBQVM7O1FBQTZELENBQUM7UUFFakcsK0NBQW1CLEdBQW5CLFVBQW9CLFVBQWtCLEVBQUUsTUFBYztZQUNwRCxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxVQUFVLEtBQUssZUFBZSxFQUFFO2dCQUNoRSxPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsT0FBTyxpQkFBTSxtQkFBbUIsWUFBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUNILHdCQUFDO0lBQUQsQ0FBQyxBQVRELENBQXVDLDBCQUFhLEdBU25EO0lBVFksOENBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW1wb3J0TWFuYWdlcn0gZnJvbSAnLi4vLi4vLi4vbmd0c2MvdHJhbnNsYXRvcic7XG5cbmV4cG9ydCBjbGFzcyBOZ2NjSW1wb3J0TWFuYWdlciBleHRlbmRzIEltcG9ydE1hbmFnZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGlzRmxhdDogYm9vbGVhbiwgaXNDb3JlOiBib29sZWFuLCBwcmVmaXg/OiBzdHJpbmcpIHsgc3VwZXIoaXNDb3JlLCBwcmVmaXgpOyB9XG5cbiAgZ2VuZXJhdGVOYW1lZEltcG9ydChtb2R1bGVOYW1lOiBzdHJpbmcsIHN5bWJvbDogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICAgIGlmICh0aGlzLmlzRmxhdCAmJiB0aGlzLmlzQ29yZSAmJiBtb2R1bGVOYW1lID09PSAnQGFuZ3VsYXIvY29yZScpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gc3VwZXIuZ2VuZXJhdGVOYW1lZEltcG9ydChtb2R1bGVOYW1lLCBzeW1ib2wpO1xuICB9XG59Il19