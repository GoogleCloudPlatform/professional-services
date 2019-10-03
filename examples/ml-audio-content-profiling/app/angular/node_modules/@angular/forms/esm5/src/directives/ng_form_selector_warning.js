/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Directive, Inject, InjectionToken, Optional } from '@angular/core';
import { TemplateDrivenErrors } from './template_driven_errors';
/**
 * Token to provide to turn off the warning when using 'ngForm' deprecated selector.
 */
export var NG_FORM_SELECTOR_WARNING = new InjectionToken('NgFormSelectorWarning');
/**
 * This directive is solely used to display warnings when the deprecated `ngForm` selector is used.
 *
 * @deprecated in Angular v6 and will be removed in Angular v9.
 * @ngModule FormsModule
 * @publicApi
 */
var NgFormSelectorWarning = /** @class */ (function () {
    function NgFormSelectorWarning(ngFormWarning) {
        if (((!ngFormWarning || ngFormWarning === 'once') && !NgFormSelectorWarning_1._ngFormWarning) ||
            ngFormWarning === 'always') {
            TemplateDrivenErrors.ngFormWarning();
            NgFormSelectorWarning_1._ngFormWarning = true;
        }
    }
    NgFormSelectorWarning_1 = NgFormSelectorWarning;
    var NgFormSelectorWarning_1;
    /**
     * Static property used to track whether the deprecation warning for this selector has been sent.
     * Used to support warning config of "once".
     *
     * @internal
     */
    NgFormSelectorWarning._ngFormWarning = false;
    NgFormSelectorWarning = NgFormSelectorWarning_1 = tslib_1.__decorate([
        Directive({ selector: 'ngForm' }),
        tslib_1.__param(0, Optional()), tslib_1.__param(0, Inject(NG_FORM_SELECTOR_WARNING)),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], NgFormSelectorWarning);
    return NgFormSelectorWarning;
}());
export { NgFormSelectorWarning };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfZm9ybV9zZWxlY3Rvcl93YXJuaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZm9ybXMvc3JjL2RpcmVjdGl2ZXMvbmdfZm9ybV9zZWxlY3Rvcl93YXJuaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRTlEOztHQUVHO0FBQ0gsTUFBTSxDQUFDLElBQU0sd0JBQXdCLEdBQUcsSUFBSSxjQUFjLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUVwRjs7Ozs7O0dBTUc7QUFFSDtJQVNFLCtCQUEwRCxhQUEwQjtRQUNsRixJQUFJLENBQUMsQ0FBQyxDQUFDLGFBQWEsSUFBSSxhQUFhLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyx1QkFBcUIsQ0FBQyxjQUFjLENBQUM7WUFDdkYsYUFBYSxLQUFLLFFBQVEsRUFBRTtZQUM5QixvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNyQyx1QkFBcUIsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1NBQzdDO0lBQ0gsQ0FBQzs4QkFmVSxxQkFBcUI7O0lBQ2hDOzs7OztPQUtHO0lBQ0ksb0NBQWMsR0FBRyxLQUFLLENBQUM7SUFQbkIscUJBQXFCO1FBRGpDLFNBQVMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsQ0FBQztRQVVqQixtQkFBQSxRQUFRLEVBQUUsQ0FBQSxFQUFFLG1CQUFBLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBOztPQVQ5QyxxQkFBcUIsQ0FnQmpDO0lBQUQsNEJBQUM7Q0FBQSxBQWhCRCxJQWdCQztTQWhCWSxxQkFBcUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBJbmplY3QsIEluamVjdGlvblRva2VuLCBPcHRpb25hbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1RlbXBsYXRlRHJpdmVuRXJyb3JzfSBmcm9tICcuL3RlbXBsYXRlX2RyaXZlbl9lcnJvcnMnO1xuXG4vKipcbiAqIFRva2VuIHRvIHByb3ZpZGUgdG8gdHVybiBvZmYgdGhlIHdhcm5pbmcgd2hlbiB1c2luZyAnbmdGb3JtJyBkZXByZWNhdGVkIHNlbGVjdG9yLlxuICovXG5leHBvcnQgY29uc3QgTkdfRk9STV9TRUxFQ1RPUl9XQVJOSU5HID0gbmV3IEluamVjdGlvblRva2VuKCdOZ0Zvcm1TZWxlY3Rvcldhcm5pbmcnKTtcblxuLyoqXG4gKiBUaGlzIGRpcmVjdGl2ZSBpcyBzb2xlbHkgdXNlZCB0byBkaXNwbGF5IHdhcm5pbmdzIHdoZW4gdGhlIGRlcHJlY2F0ZWQgYG5nRm9ybWAgc2VsZWN0b3IgaXMgdXNlZC5cbiAqXG4gKiBAZGVwcmVjYXRlZCBpbiBBbmd1bGFyIHY2IGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gQW5ndWxhciB2OS5cbiAqIEBuZ01vZHVsZSBGb3Jtc01vZHVsZVxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ25nRm9ybSd9KVxuZXhwb3J0IGNsYXNzIE5nRm9ybVNlbGVjdG9yV2FybmluZyB7XG4gIC8qKlxuICAgKiBTdGF0aWMgcHJvcGVydHkgdXNlZCB0byB0cmFjayB3aGV0aGVyIHRoZSBkZXByZWNhdGlvbiB3YXJuaW5nIGZvciB0aGlzIHNlbGVjdG9yIGhhcyBiZWVuIHNlbnQuXG4gICAqIFVzZWQgdG8gc3VwcG9ydCB3YXJuaW5nIGNvbmZpZyBvZiBcIm9uY2VcIi5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX25nRm9ybVdhcm5pbmcgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihAT3B0aW9uYWwoKSBASW5qZWN0KE5HX0ZPUk1fU0VMRUNUT1JfV0FSTklORykgbmdGb3JtV2FybmluZzogc3RyaW5nfG51bGwpIHtcbiAgICBpZiAoKCghbmdGb3JtV2FybmluZyB8fCBuZ0Zvcm1XYXJuaW5nID09PSAnb25jZScpICYmICFOZ0Zvcm1TZWxlY3Rvcldhcm5pbmcuX25nRm9ybVdhcm5pbmcpIHx8XG4gICAgICAgIG5nRm9ybVdhcm5pbmcgPT09ICdhbHdheXMnKSB7XG4gICAgICBUZW1wbGF0ZURyaXZlbkVycm9ycy5uZ0Zvcm1XYXJuaW5nKCk7XG4gICAgICBOZ0Zvcm1TZWxlY3Rvcldhcm5pbmcuX25nRm9ybVdhcm5pbmcgPSB0cnVlO1xuICAgIH1cbiAgfVxufVxuIl19