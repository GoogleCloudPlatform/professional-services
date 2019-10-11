/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { NgModule } from '@angular/core';
import { InternalFormsSharedModule, NG_FORM_SELECTOR_WARNING, NG_MODEL_WITH_FORM_CONTROL_WARNING, REACTIVE_DRIVEN_DIRECTIVES, TEMPLATE_DRIVEN_DIRECTIVES } from './directives';
import { RadioControlRegistry } from './directives/radio_control_value_accessor';
import { FormBuilder } from './form_builder';
/**
 * Exports the required providers and directives for template-driven forms,
 * making them available for import by NgModules that import this module.
 * @see [Forms](guide/forms)
 *
 * @see [Forms Guide](/guide/forms)
 *
 * @publicApi
 */
var FormsModule = /** @class */ (function () {
    function FormsModule() {
    }
    FormsModule_1 = FormsModule;
    /**
     * @description
     * Provides options for configuring the template-driven forms module.
     *
     * @param opts An object of configuration options
     * * `warnOnDeprecatedNgFormSelector` Configures when to emit a warning when the deprecated
     * `ngForm` selector is used.
     */
    FormsModule.withConfig = function (opts) {
        return {
            ngModule: FormsModule_1,
            providers: [{ provide: NG_FORM_SELECTOR_WARNING, useValue: opts.warnOnDeprecatedNgFormSelector }]
        };
    };
    var FormsModule_1;
    FormsModule = FormsModule_1 = tslib_1.__decorate([
        NgModule({
            declarations: TEMPLATE_DRIVEN_DIRECTIVES,
            providers: [RadioControlRegistry],
            exports: [InternalFormsSharedModule, TEMPLATE_DRIVEN_DIRECTIVES]
        })
    ], FormsModule);
    return FormsModule;
}());
export { FormsModule };
/**
 * Exports the required infrastructure and directives for reactive forms,
 * making them available for import by NgModules that import this module.
 * @see [Forms](guide/reactive-forms)
 *
 * @see [Reactive Forms Guide](/guide/reactive-forms)
 *
 * @publicApi
 */
var ReactiveFormsModule = /** @class */ (function () {
    function ReactiveFormsModule() {
    }
    ReactiveFormsModule_1 = ReactiveFormsModule;
    /**
     * @description
     * Provides options for configuring the reactive forms module.
     *
     * @param opts An object of configuration options
     * * `warnOnNgModelWithFormControl` Configures when to emit a warning when an `ngModel`
     * binding is used with reactive form directives.
     */
    ReactiveFormsModule.withConfig = function (opts) {
        return {
            ngModule: ReactiveFormsModule_1,
            providers: [{
                    provide: NG_MODEL_WITH_FORM_CONTROL_WARNING,
                    useValue: opts.warnOnNgModelWithFormControl
                }]
        };
    };
    var ReactiveFormsModule_1;
    ReactiveFormsModule = ReactiveFormsModule_1 = tslib_1.__decorate([
        NgModule({
            declarations: [REACTIVE_DRIVEN_DIRECTIVES],
            providers: [FormBuilder, RadioControlRegistry],
            exports: [InternalFormsSharedModule, REACTIVE_DRIVEN_DIRECTIVES]
        })
    ], ReactiveFormsModule);
    return ReactiveFormsModule;
}());
export { ReactiveFormsModule };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybV9wcm92aWRlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9mb3Jtcy9zcmMvZm9ybV9wcm92aWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBc0IsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTVELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxrQ0FBa0MsRUFBRSwwQkFBMEIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3SyxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQztBQUMvRSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFM0M7Ozs7Ozs7O0dBUUc7QUFNSDtJQUFBO0lBa0JBLENBQUM7b0JBbEJZLFdBQVc7SUFDdEI7Ozs7Ozs7T0FPRztJQUNJLHNCQUFVLEdBQWpCLFVBQWtCLElBRWpCO1FBQ0MsT0FBTztZQUNMLFFBQVEsRUFBRSxhQUFXO1lBQ3JCLFNBQVMsRUFDTCxDQUFDLEVBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsOEJBQThCLEVBQUMsQ0FBQztTQUN6RixDQUFDO0lBQ0osQ0FBQzs7SUFqQlUsV0FBVztRQUx2QixRQUFRLENBQUM7WUFDUixZQUFZLEVBQUUsMEJBQTBCO1lBQ3hDLFNBQVMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO1lBQ2pDLE9BQU8sRUFBRSxDQUFDLHlCQUF5QixFQUFFLDBCQUEwQixDQUFDO1NBQ2pFLENBQUM7T0FDVyxXQUFXLENBa0J2QjtJQUFELGtCQUFDO0NBQUEsQUFsQkQsSUFrQkM7U0FsQlksV0FBVztBQW9CeEI7Ozs7Ozs7O0dBUUc7QUFNSDtJQUFBO0lBb0JBLENBQUM7NEJBcEJZLG1CQUFtQjtJQUM5Qjs7Ozs7OztPQU9HO0lBQ0ksOEJBQVUsR0FBakIsVUFBa0IsSUFFakI7UUFDQyxPQUFPO1lBQ0wsUUFBUSxFQUFFLHFCQUFtQjtZQUM3QixTQUFTLEVBQUUsQ0FBQztvQkFDVixPQUFPLEVBQUUsa0NBQWtDO29CQUMzQyxRQUFRLEVBQUUsSUFBSSxDQUFDLDRCQUE0QjtpQkFDNUMsQ0FBQztTQUNILENBQUM7SUFDSixDQUFDOztJQW5CVSxtQkFBbUI7UUFML0IsUUFBUSxDQUFDO1lBQ1IsWUFBWSxFQUFFLENBQUMsMEJBQTBCLENBQUM7WUFDMUMsU0FBUyxFQUFFLENBQUMsV0FBVyxFQUFFLG9CQUFvQixDQUFDO1lBQzlDLE9BQU8sRUFBRSxDQUFDLHlCQUF5QixFQUFFLDBCQUEwQixDQUFDO1NBQ2pFLENBQUM7T0FDVyxtQkFBbUIsQ0FvQi9CO0lBQUQsMEJBQUM7Q0FBQSxBQXBCRCxJQW9CQztTQXBCWSxtQkFBbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0ludGVybmFsRm9ybXNTaGFyZWRNb2R1bGUsIE5HX0ZPUk1fU0VMRUNUT1JfV0FSTklORywgTkdfTU9ERUxfV0lUSF9GT1JNX0NPTlRST0xfV0FSTklORywgUkVBQ1RJVkVfRFJJVkVOX0RJUkVDVElWRVMsIFRFTVBMQVRFX0RSSVZFTl9ESVJFQ1RJVkVTfSBmcm9tICcuL2RpcmVjdGl2ZXMnO1xuaW1wb3J0IHtSYWRpb0NvbnRyb2xSZWdpc3RyeX0gZnJvbSAnLi9kaXJlY3RpdmVzL3JhZGlvX2NvbnRyb2xfdmFsdWVfYWNjZXNzb3InO1xuaW1wb3J0IHtGb3JtQnVpbGRlcn0gZnJvbSAnLi9mb3JtX2J1aWxkZXInO1xuXG4vKipcbiAqIEV4cG9ydHMgdGhlIHJlcXVpcmVkIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBmb3IgdGVtcGxhdGUtZHJpdmVuIGZvcm1zLFxuICogbWFraW5nIHRoZW0gYXZhaWxhYmxlIGZvciBpbXBvcnQgYnkgTmdNb2R1bGVzIHRoYXQgaW1wb3J0IHRoaXMgbW9kdWxlLlxuICogQHNlZSBbRm9ybXNdKGd1aWRlL2Zvcm1zKVxuICpcbiAqIEBzZWUgW0Zvcm1zIEd1aWRlXSgvZ3VpZGUvZm9ybXMpXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFRFTVBMQVRFX0RSSVZFTl9ESVJFQ1RJVkVTLFxuICBwcm92aWRlcnM6IFtSYWRpb0NvbnRyb2xSZWdpc3RyeV0sXG4gIGV4cG9ydHM6IFtJbnRlcm5hbEZvcm1zU2hhcmVkTW9kdWxlLCBURU1QTEFURV9EUklWRU5fRElSRUNUSVZFU11cbn0pXG5leHBvcnQgY2xhc3MgRm9ybXNNb2R1bGUge1xuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFByb3ZpZGVzIG9wdGlvbnMgZm9yIGNvbmZpZ3VyaW5nIHRoZSB0ZW1wbGF0ZS1kcml2ZW4gZm9ybXMgbW9kdWxlLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0cyBBbiBvYmplY3Qgb2YgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAqICogYHdhcm5PbkRlcHJlY2F0ZWROZ0Zvcm1TZWxlY3RvcmAgQ29uZmlndXJlcyB3aGVuIHRvIGVtaXQgYSB3YXJuaW5nIHdoZW4gdGhlIGRlcHJlY2F0ZWRcbiAgICogYG5nRm9ybWAgc2VsZWN0b3IgaXMgdXNlZC5cbiAgICovXG4gIHN0YXRpYyB3aXRoQ29uZmlnKG9wdHM6IHtcbiAgICAvKiogQGRlcHJlY2F0ZWQgYXMgb2YgdjYgKi8gd2Fybk9uRGVwcmVjYXRlZE5nRm9ybVNlbGVjdG9yPzogJ25ldmVyJyB8ICdvbmNlJyB8ICdhbHdheXMnLFxuICB9KTogTW9kdWxlV2l0aFByb3ZpZGVyczxGb3Jtc01vZHVsZT4ge1xuICAgIHJldHVybiB7XG4gICAgICBuZ01vZHVsZTogRm9ybXNNb2R1bGUsXG4gICAgICBwcm92aWRlcnM6XG4gICAgICAgICAgW3twcm92aWRlOiBOR19GT1JNX1NFTEVDVE9SX1dBUk5JTkcsIHVzZVZhbHVlOiBvcHRzLndhcm5PbkRlcHJlY2F0ZWROZ0Zvcm1TZWxlY3Rvcn1dXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIEV4cG9ydHMgdGhlIHJlcXVpcmVkIGluZnJhc3RydWN0dXJlIGFuZCBkaXJlY3RpdmVzIGZvciByZWFjdGl2ZSBmb3JtcyxcbiAqIG1ha2luZyB0aGVtIGF2YWlsYWJsZSBmb3IgaW1wb3J0IGJ5IE5nTW9kdWxlcyB0aGF0IGltcG9ydCB0aGlzIG1vZHVsZS5cbiAqIEBzZWUgW0Zvcm1zXShndWlkZS9yZWFjdGl2ZS1mb3JtcylcbiAqXG4gKiBAc2VlIFtSZWFjdGl2ZSBGb3JtcyBHdWlkZV0oL2d1aWRlL3JlYWN0aXZlLWZvcm1zKVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbUkVBQ1RJVkVfRFJJVkVOX0RJUkVDVElWRVNdLFxuICBwcm92aWRlcnM6IFtGb3JtQnVpbGRlciwgUmFkaW9Db250cm9sUmVnaXN0cnldLFxuICBleHBvcnRzOiBbSW50ZXJuYWxGb3Jtc1NoYXJlZE1vZHVsZSwgUkVBQ1RJVkVfRFJJVkVOX0RJUkVDVElWRVNdXG59KVxuZXhwb3J0IGNsYXNzIFJlYWN0aXZlRm9ybXNNb2R1bGUge1xuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFByb3ZpZGVzIG9wdGlvbnMgZm9yIGNvbmZpZ3VyaW5nIHRoZSByZWFjdGl2ZSBmb3JtcyBtb2R1bGUuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRzIEFuIG9iamVjdCBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICogKiBgd2Fybk9uTmdNb2RlbFdpdGhGb3JtQ29udHJvbGAgQ29uZmlndXJlcyB3aGVuIHRvIGVtaXQgYSB3YXJuaW5nIHdoZW4gYW4gYG5nTW9kZWxgXG4gICAqIGJpbmRpbmcgaXMgdXNlZCB3aXRoIHJlYWN0aXZlIGZvcm0gZGlyZWN0aXZlcy5cbiAgICovXG4gIHN0YXRpYyB3aXRoQ29uZmlnKG9wdHM6IHtcbiAgICAvKiogQGRlcHJlY2F0ZWQgYXMgb2YgdjYgKi8gd2Fybk9uTmdNb2RlbFdpdGhGb3JtQ29udHJvbDogJ25ldmVyJyB8ICdvbmNlJyB8ICdhbHdheXMnXG4gIH0pOiBNb2R1bGVXaXRoUHJvdmlkZXJzPFJlYWN0aXZlRm9ybXNNb2R1bGU+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbmdNb2R1bGU6IFJlYWN0aXZlRm9ybXNNb2R1bGUsXG4gICAgICBwcm92aWRlcnM6IFt7XG4gICAgICAgIHByb3ZpZGU6IE5HX01PREVMX1dJVEhfRk9STV9DT05UUk9MX1dBUk5JTkcsXG4gICAgICAgIHVzZVZhbHVlOiBvcHRzLndhcm5Pbk5nTW9kZWxXaXRoRm9ybUNvbnRyb2xcbiAgICAgIH1dXG4gICAgfTtcbiAgfVxufVxuIl19