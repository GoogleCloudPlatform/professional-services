/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Inject, InjectionToken, Optional } from '@angular/core';
import { TemplateDrivenErrors } from './template_driven_errors';
/** *
 * Token to provide to turn off the warning when using 'ngForm' deprecated selector.
  @type {?} */
export const NG_FORM_SELECTOR_WARNING = new InjectionToken('NgFormSelectorWarning');
/**
 * This directive is solely used to display warnings when the deprecated `ngForm` selector is used.
 *
 * @deprecated in Angular v6 and will be removed in Angular v9.
 * \@ngModule FormsModule
 * \@publicApi
 */
export class NgFormSelectorWarning {
    /**
     * @param {?} ngFormWarning
     */
    constructor(ngFormWarning) {
        if (((!ngFormWarning || ngFormWarning === 'once') && !NgFormSelectorWarning._ngFormWarning) ||
            ngFormWarning === 'always') {
            TemplateDrivenErrors.ngFormWarning();
            NgFormSelectorWarning._ngFormWarning = true;
        }
    }
}
/**
 * Static property used to track whether the deprecation warning for this selector has been sent.
 * Used to support warning config of "once".
 *
 * \@internal
 */
NgFormSelectorWarning._ngFormWarning = false;
NgFormSelectorWarning.decorators = [
    { type: Directive, args: [{ selector: 'ngForm' },] }
];
/** @nocollapse */
NgFormSelectorWarning.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [NG_FORM_SELECTOR_WARNING,] }] }
];
if (false) {
    /**
     * Static property used to track whether the deprecation warning for this selector has been sent.
     * Used to support warning config of "once".
     *
     * \@internal
     * @type {?}
     */
    NgFormSelectorWarning._ngFormWarning;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfZm9ybV9zZWxlY3Rvcl93YXJuaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZm9ybXMvc3JjL2RpcmVjdGl2ZXMvbmdfZm9ybV9zZWxlY3Rvcl93YXJuaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMxRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQzs7OztBQUs5RCxhQUFhLHdCQUF3QixHQUFHLElBQUksY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7Ozs7Ozs7O0FBVXBGLE1BQU0sT0FBTyxxQkFBcUI7Ozs7SUFTaEMsWUFBMEQsYUFBMEI7UUFDbEYsSUFBSSxDQUFDLENBQUMsQ0FBQyxhQUFhLElBQUksYUFBYSxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDO1lBQ3ZGLGFBQWEsS0FBSyxRQUFRLEVBQUU7WUFDOUIsb0JBQW9CLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDckMscUJBQXFCLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztTQUM3QztLQUNGOzs7Ozs7OztBQVJELHVDQUF3QixLQUFLLENBQUM7O1lBUi9CLFNBQVMsU0FBQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUM7Ozs7NENBVWhCLFFBQVEsWUFBSSxNQUFNLFNBQUMsd0JBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgSW5qZWN0LCBJbmplY3Rpb25Ub2tlbiwgT3B0aW9uYWx9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtUZW1wbGF0ZURyaXZlbkVycm9yc30gZnJvbSAnLi90ZW1wbGF0ZV9kcml2ZW5fZXJyb3JzJztcblxuLyoqXG4gKiBUb2tlbiB0byBwcm92aWRlIHRvIHR1cm4gb2ZmIHRoZSB3YXJuaW5nIHdoZW4gdXNpbmcgJ25nRm9ybScgZGVwcmVjYXRlZCBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGNvbnN0IE5HX0ZPUk1fU0VMRUNUT1JfV0FSTklORyA9IG5ldyBJbmplY3Rpb25Ub2tlbignTmdGb3JtU2VsZWN0b3JXYXJuaW5nJyk7XG5cbi8qKlxuICogVGhpcyBkaXJlY3RpdmUgaXMgc29sZWx5IHVzZWQgdG8gZGlzcGxheSB3YXJuaW5ncyB3aGVuIHRoZSBkZXByZWNhdGVkIGBuZ0Zvcm1gIHNlbGVjdG9yIGlzIHVzZWQuXG4gKlxuICogQGRlcHJlY2F0ZWQgaW4gQW5ndWxhciB2NiBhbmQgd2lsbCBiZSByZW1vdmVkIGluIEFuZ3VsYXIgdjkuXG4gKiBAbmdNb2R1bGUgRm9ybXNNb2R1bGVcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICduZ0Zvcm0nfSlcbmV4cG9ydCBjbGFzcyBOZ0Zvcm1TZWxlY3Rvcldhcm5pbmcge1xuICAvKipcbiAgICogU3RhdGljIHByb3BlcnR5IHVzZWQgdG8gdHJhY2sgd2hldGhlciB0aGUgZGVwcmVjYXRpb24gd2FybmluZyBmb3IgdGhpcyBzZWxlY3RvciBoYXMgYmVlbiBzZW50LlxuICAgKiBVc2VkIHRvIHN1cHBvcnQgd2FybmluZyBjb25maWcgb2YgXCJvbmNlXCIuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9uZ0Zvcm1XYXJuaW5nID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoQE9wdGlvbmFsKCkgQEluamVjdChOR19GT1JNX1NFTEVDVE9SX1dBUk5JTkcpIG5nRm9ybVdhcm5pbmc6IHN0cmluZ3xudWxsKSB7XG4gICAgaWYgKCgoIW5nRm9ybVdhcm5pbmcgfHwgbmdGb3JtV2FybmluZyA9PT0gJ29uY2UnKSAmJiAhTmdGb3JtU2VsZWN0b3JXYXJuaW5nLl9uZ0Zvcm1XYXJuaW5nKSB8fFxuICAgICAgICBuZ0Zvcm1XYXJuaW5nID09PSAnYWx3YXlzJykge1xuICAgICAgVGVtcGxhdGVEcml2ZW5FcnJvcnMubmdGb3JtV2FybmluZygpO1xuICAgICAgTmdGb3JtU2VsZWN0b3JXYXJuaW5nLl9uZ0Zvcm1XYXJuaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==