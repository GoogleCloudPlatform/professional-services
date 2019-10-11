/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Directive, Input, TemplateRef, ViewContainerRef, ɵstringify as stringify } from '@angular/core';
/**
 * Conditionally includes a template based on the value of an `expression`.
 *
 * `ngIf` evaluates the `expression` and then renders the `then` or `else` template in its place
 * when expression is truthy or falsy respectively. Typically the:
 *  - `then` template is the inline template of `ngIf` unless bound to a different value.
 *  - `else` template is blank unless it is bound.
 *
 *
 * @usageNotes
 *
 * ### Most common usage
 *
 * The most common usage of the `ngIf` directive is to conditionally show the inline template as
 * seen in this example:
 * {@example common/ngIf/ts/module.ts region='NgIfSimple'}
 *
 * ### Showing an alternative template using `else`
 *
 * If it is necessary to display a template when the `expression` is falsy use the `else` template
 * binding as shown. Note that the `else` binding points to a `<ng-template>` labeled `#elseBlock`.
 * The template can be defined anywhere in the component view but is typically placed right after
 * `ngIf` for readability.
 *
 * {@example common/ngIf/ts/module.ts region='NgIfElse'}
 *
 * ### Using non-inlined `then` template
 *
 * Usually the `then` template is the inlined template of the `ngIf`, but it can be changed using
 * a binding (just like `else`). Because `then` and `else` are bindings, the template references can
 * change at runtime as shown in this example.
 *
 * {@example common/ngIf/ts/module.ts region='NgIfThenElse'}
 *
 * ### Storing conditional result in a variable
 *
 * A common pattern is that we need to show a set of properties from the same object. If the
 * object is undefined, then we have to use the safe-traversal-operator `?.` to guard against
 * dereferencing a `null` value. This is especially the case when waiting on async data such as
 * when using the `async` pipe as shown in following example:
 *
 * ```
 * Hello {{ (userStream|async)?.last }}, {{ (userStream|async)?.first }}!
 * ```
 *
 * There are several inefficiencies in the above example:
 *  - We create multiple subscriptions on `userStream`. One for each `async` pipe, or two in the
 *    example above.
 *  - We cannot display an alternative screen while waiting for the data to arrive asynchronously.
 *  - We have to use the safe-traversal-operator `?.` to access properties, which is cumbersome.
 *  - We have to place the `async` pipe in parenthesis.
 *
 * A better way to do this is to use `ngIf` and store the result of the condition in a local
 * variable as shown in the the example below:
 *
 * {@example common/ngIf/ts/module.ts region='NgIfAs'}
 *
 * Notice that:
 *  - We use only one `async` pipe and hence only one subscription gets created.
 *  - `ngIf` stores the result of the `userStream|async` in the local variable `user`.
 *  - The local `user` can then be bound repeatedly in a more efficient way.
 *  - No need to use the safe-traversal-operator `?.` to access properties as `ngIf` will only
 *    display the data if `userStream` returns a value.
 *  - We can display an alternative template while waiting for the data.
 *
 * ### Syntax
 *
 * Simple form:
 * - `<div *ngIf="condition">...</div>`
 * - `<ng-template [ngIf]="condition"><div>...</div></ng-template>`
 *
 * Form with an else block:
 * ```
 * <div *ngIf="condition; else elseBlock">...</div>
 * <ng-template #elseBlock>...</ng-template>
 * ```
 *
 * Form with a `then` and `else` block:
 * ```
 * <div *ngIf="condition; then thenBlock else elseBlock"></div>
 * <ng-template #thenBlock>...</ng-template>
 * <ng-template #elseBlock>...</ng-template>
 * ```
 *
 * Form with storing the value locally:
 * ```
 * <div *ngIf="condition as value; else elseBlock">{{value}}</div>
 * <ng-template #elseBlock>...</ng-template>
 * ```
 *
 * @ngModule CommonModule
 * @publicApi
 */
var NgIf = /** @class */ (function () {
    function NgIf(_viewContainer, templateRef) {
        this._viewContainer = _viewContainer;
        this._context = new NgIfContext();
        this._thenTemplateRef = null;
        this._elseTemplateRef = null;
        this._thenViewRef = null;
        this._elseViewRef = null;
        this._thenTemplateRef = templateRef;
    }
    Object.defineProperty(NgIf.prototype, "ngIf", {
        set: function (condition) {
            this._context.$implicit = this._context.ngIf = condition;
            this._updateView();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NgIf.prototype, "ngIfThen", {
        set: function (templateRef) {
            assertTemplate('ngIfThen', templateRef);
            this._thenTemplateRef = templateRef;
            this._thenViewRef = null; // clear previous view if any.
            this._updateView();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NgIf.prototype, "ngIfElse", {
        set: function (templateRef) {
            assertTemplate('ngIfElse', templateRef);
            this._elseTemplateRef = templateRef;
            this._elseViewRef = null; // clear previous view if any.
            this._updateView();
        },
        enumerable: true,
        configurable: true
    });
    NgIf.prototype._updateView = function () {
        if (this._context.$implicit) {
            if (!this._thenViewRef) {
                this._viewContainer.clear();
                this._elseViewRef = null;
                if (this._thenTemplateRef) {
                    this._thenViewRef =
                        this._viewContainer.createEmbeddedView(this._thenTemplateRef, this._context);
                }
            }
        }
        else {
            if (!this._elseViewRef) {
                this._viewContainer.clear();
                this._thenViewRef = null;
                if (this._elseTemplateRef) {
                    this._elseViewRef =
                        this._viewContainer.createEmbeddedView(this._elseTemplateRef, this._context);
                }
            }
        }
    };
    /**
     * Assert the correct type of the expression bound to the `ngIf` input within the template.
     *
     * The presence of this method is a signal to the Ivy template type check compiler that when the
     * `NgIf` structural directive renders its template, the type of the expression bound to `ngIf`
     * should be narrowed in some way. For `NgIf`, it is narrowed to be non-null, which allows the
     * strictNullChecks feature of TypeScript to work with `NgIf`.
     */
    NgIf.ngTemplateGuard_ngIf = function (dir, expr) { return true; };
    tslib_1.__decorate([
        Input(),
        tslib_1.__metadata("design:type", Object),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], NgIf.prototype, "ngIf", null);
    tslib_1.__decorate([
        Input(),
        tslib_1.__metadata("design:type", Object),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], NgIf.prototype, "ngIfThen", null);
    tslib_1.__decorate([
        Input(),
        tslib_1.__metadata("design:type", Object),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], NgIf.prototype, "ngIfElse", null);
    NgIf = tslib_1.__decorate([
        Directive({ selector: '[ngIf]' }),
        tslib_1.__metadata("design:paramtypes", [ViewContainerRef, TemplateRef])
    ], NgIf);
    return NgIf;
}());
export { NgIf };
/**
 * @publicApi
 */
var NgIfContext = /** @class */ (function () {
    function NgIfContext() {
        this.$implicit = null;
        this.ngIf = null;
    }
    return NgIfContext;
}());
export { NgIfContext };
function assertTemplate(property, templateRef) {
    var isTemplateRefOrNull = !!(!templateRef || templateRef.createEmbeddedView);
    if (!isTemplateRefOrNull) {
        throw new Error(property + " must be a TemplateRef, but received '" + stringify(templateRef) + "'.");
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfaWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vc3JjL2RpcmVjdGl2ZXMvbmdfaWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQW1CLEtBQUssRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxJQUFJLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUd4SDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E0Rkc7QUFFSDtJQU9FLGNBQW9CLGNBQWdDLEVBQUUsV0FBcUM7UUFBdkUsbUJBQWMsR0FBZCxjQUFjLENBQWtCO1FBTjVDLGFBQVEsR0FBZ0IsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUMxQyxxQkFBZ0IsR0FBa0MsSUFBSSxDQUFDO1FBQ3ZELHFCQUFnQixHQUFrQyxJQUFJLENBQUM7UUFDdkQsaUJBQVksR0FBc0MsSUFBSSxDQUFDO1FBQ3ZELGlCQUFZLEdBQXNDLElBQUksQ0FBQztRQUc3RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO0lBQ3RDLENBQUM7SUFHRCxzQkFBSSxzQkFBSTthQUFSLFVBQVMsU0FBYztZQUNyQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7WUFDekQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JCLENBQUM7OztPQUFBO0lBR0Qsc0JBQUksMEJBQVE7YUFBWixVQUFhLFdBQTBDO1lBQ3JELGNBQWMsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFdBQVcsQ0FBQztZQUNwQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFFLDhCQUE4QjtZQUN6RCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDckIsQ0FBQzs7O09BQUE7SUFHRCxzQkFBSSwwQkFBUTthQUFaLFVBQWEsV0FBMEM7WUFDckQsY0FBYyxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUUsOEJBQThCO1lBQ3pELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNyQixDQUFDOzs7T0FBQTtJQUVPLDBCQUFXLEdBQW5CO1FBQ0UsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRTtZQUMzQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDdEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7Z0JBQ3pCLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO29CQUN6QixJQUFJLENBQUMsWUFBWTt3QkFDYixJQUFJLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ2xGO2FBQ0Y7U0FDRjthQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDekIsSUFBSSxDQUFDLFlBQVk7d0JBQ2IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUNsRjthQUNGO1NBQ0Y7SUFDSCxDQUFDO0lBS0Q7Ozs7Ozs7T0FPRztJQUNJLHlCQUFvQixHQUEzQixVQUErQixHQUFTLEVBQUUsSUFBTyxJQUE0QixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7SUF0RDNGO1FBREMsS0FBSyxFQUFFOzs7b0NBSVA7SUFHRDtRQURDLEtBQUssRUFBRTs7O3dDQU1QO0lBR0Q7UUFEQyxLQUFLLEVBQUU7Ozt3Q0FNUDtJQS9CVSxJQUFJO1FBRGhCLFNBQVMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsQ0FBQztpREFRTSxnQkFBZ0IsRUFBZSxXQUFXO09BUG5FLElBQUksQ0FtRWhCO0lBQUQsV0FBQztDQUFBLEFBbkVELElBbUVDO1NBbkVZLElBQUk7QUFxRWpCOztHQUVHO0FBQ0g7SUFBQTtRQUNTLGNBQVMsR0FBUSxJQUFJLENBQUM7UUFDdEIsU0FBSSxHQUFRLElBQUksQ0FBQztJQUMxQixDQUFDO0lBQUQsa0JBQUM7QUFBRCxDQUFDLEFBSEQsSUFHQzs7QUFFRCxTQUFTLGNBQWMsQ0FBQyxRQUFnQixFQUFFLFdBQW1DO0lBQzNFLElBQU0sbUJBQW1CLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDL0UsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1FBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUksUUFBUSw4Q0FBeUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxPQUFJLENBQUMsQ0FBQztLQUNqRztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBFbWJlZGRlZFZpZXdSZWYsIElucHV0LCBUZW1wbGF0ZVJlZiwgVmlld0NvbnRhaW5lclJlZiwgybVzdHJpbmdpZnkgYXMgc3RyaW5naWZ5fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuXG4vKipcbiAqIENvbmRpdGlvbmFsbHkgaW5jbHVkZXMgYSB0ZW1wbGF0ZSBiYXNlZCBvbiB0aGUgdmFsdWUgb2YgYW4gYGV4cHJlc3Npb25gLlxuICpcbiAqIGBuZ0lmYCBldmFsdWF0ZXMgdGhlIGBleHByZXNzaW9uYCBhbmQgdGhlbiByZW5kZXJzIHRoZSBgdGhlbmAgb3IgYGVsc2VgIHRlbXBsYXRlIGluIGl0cyBwbGFjZVxuICogd2hlbiBleHByZXNzaW9uIGlzIHRydXRoeSBvciBmYWxzeSByZXNwZWN0aXZlbHkuIFR5cGljYWxseSB0aGU6XG4gKiAgLSBgdGhlbmAgdGVtcGxhdGUgaXMgdGhlIGlubGluZSB0ZW1wbGF0ZSBvZiBgbmdJZmAgdW5sZXNzIGJvdW5kIHRvIGEgZGlmZmVyZW50IHZhbHVlLlxuICogIC0gYGVsc2VgIHRlbXBsYXRlIGlzIGJsYW5rIHVubGVzcyBpdCBpcyBib3VuZC5cbiAqXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiAjIyMgTW9zdCBjb21tb24gdXNhZ2VcbiAqXG4gKiBUaGUgbW9zdCBjb21tb24gdXNhZ2Ugb2YgdGhlIGBuZ0lmYCBkaXJlY3RpdmUgaXMgdG8gY29uZGl0aW9uYWxseSBzaG93IHRoZSBpbmxpbmUgdGVtcGxhdGUgYXNcbiAqIHNlZW4gaW4gdGhpcyBleGFtcGxlOlxuICoge0BleGFtcGxlIGNvbW1vbi9uZ0lmL3RzL21vZHVsZS50cyByZWdpb249J05nSWZTaW1wbGUnfVxuICpcbiAqICMjIyBTaG93aW5nIGFuIGFsdGVybmF0aXZlIHRlbXBsYXRlIHVzaW5nIGBlbHNlYFxuICpcbiAqIElmIGl0IGlzIG5lY2Vzc2FyeSB0byBkaXNwbGF5IGEgdGVtcGxhdGUgd2hlbiB0aGUgYGV4cHJlc3Npb25gIGlzIGZhbHN5IHVzZSB0aGUgYGVsc2VgIHRlbXBsYXRlXG4gKiBiaW5kaW5nIGFzIHNob3duLiBOb3RlIHRoYXQgdGhlIGBlbHNlYCBiaW5kaW5nIHBvaW50cyB0byBhIGA8bmctdGVtcGxhdGU+YCBsYWJlbGVkIGAjZWxzZUJsb2NrYC5cbiAqIFRoZSB0ZW1wbGF0ZSBjYW4gYmUgZGVmaW5lZCBhbnl3aGVyZSBpbiB0aGUgY29tcG9uZW50IHZpZXcgYnV0IGlzIHR5cGljYWxseSBwbGFjZWQgcmlnaHQgYWZ0ZXJcbiAqIGBuZ0lmYCBmb3IgcmVhZGFiaWxpdHkuXG4gKlxuICoge0BleGFtcGxlIGNvbW1vbi9uZ0lmL3RzL21vZHVsZS50cyByZWdpb249J05nSWZFbHNlJ31cbiAqXG4gKiAjIyMgVXNpbmcgbm9uLWlubGluZWQgYHRoZW5gIHRlbXBsYXRlXG4gKlxuICogVXN1YWxseSB0aGUgYHRoZW5gIHRlbXBsYXRlIGlzIHRoZSBpbmxpbmVkIHRlbXBsYXRlIG9mIHRoZSBgbmdJZmAsIGJ1dCBpdCBjYW4gYmUgY2hhbmdlZCB1c2luZ1xuICogYSBiaW5kaW5nIChqdXN0IGxpa2UgYGVsc2VgKS4gQmVjYXVzZSBgdGhlbmAgYW5kIGBlbHNlYCBhcmUgYmluZGluZ3MsIHRoZSB0ZW1wbGF0ZSByZWZlcmVuY2VzIGNhblxuICogY2hhbmdlIGF0IHJ1bnRpbWUgYXMgc2hvd24gaW4gdGhpcyBleGFtcGxlLlxuICpcbiAqIHtAZXhhbXBsZSBjb21tb24vbmdJZi90cy9tb2R1bGUudHMgcmVnaW9uPSdOZ0lmVGhlbkVsc2UnfVxuICpcbiAqICMjIyBTdG9yaW5nIGNvbmRpdGlvbmFsIHJlc3VsdCBpbiBhIHZhcmlhYmxlXG4gKlxuICogQSBjb21tb24gcGF0dGVybiBpcyB0aGF0IHdlIG5lZWQgdG8gc2hvdyBhIHNldCBvZiBwcm9wZXJ0aWVzIGZyb20gdGhlIHNhbWUgb2JqZWN0LiBJZiB0aGVcbiAqIG9iamVjdCBpcyB1bmRlZmluZWQsIHRoZW4gd2UgaGF2ZSB0byB1c2UgdGhlIHNhZmUtdHJhdmVyc2FsLW9wZXJhdG9yIGA/LmAgdG8gZ3VhcmQgYWdhaW5zdFxuICogZGVyZWZlcmVuY2luZyBhIGBudWxsYCB2YWx1ZS4gVGhpcyBpcyBlc3BlY2lhbGx5IHRoZSBjYXNlIHdoZW4gd2FpdGluZyBvbiBhc3luYyBkYXRhIHN1Y2ggYXNcbiAqIHdoZW4gdXNpbmcgdGhlIGBhc3luY2AgcGlwZSBhcyBzaG93biBpbiBmb2xsb3dpbmcgZXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIEhlbGxvIHt7ICh1c2VyU3RyZWFtfGFzeW5jKT8ubGFzdCB9fSwge3sgKHVzZXJTdHJlYW18YXN5bmMpPy5maXJzdCB9fSFcbiAqIGBgYFxuICpcbiAqIFRoZXJlIGFyZSBzZXZlcmFsIGluZWZmaWNpZW5jaWVzIGluIHRoZSBhYm92ZSBleGFtcGxlOlxuICogIC0gV2UgY3JlYXRlIG11bHRpcGxlIHN1YnNjcmlwdGlvbnMgb24gYHVzZXJTdHJlYW1gLiBPbmUgZm9yIGVhY2ggYGFzeW5jYCBwaXBlLCBvciB0d28gaW4gdGhlXG4gKiAgICBleGFtcGxlIGFib3ZlLlxuICogIC0gV2UgY2Fubm90IGRpc3BsYXkgYW4gYWx0ZXJuYXRpdmUgc2NyZWVuIHdoaWxlIHdhaXRpbmcgZm9yIHRoZSBkYXRhIHRvIGFycml2ZSBhc3luY2hyb25vdXNseS5cbiAqICAtIFdlIGhhdmUgdG8gdXNlIHRoZSBzYWZlLXRyYXZlcnNhbC1vcGVyYXRvciBgPy5gIHRvIGFjY2VzcyBwcm9wZXJ0aWVzLCB3aGljaCBpcyBjdW1iZXJzb21lLlxuICogIC0gV2UgaGF2ZSB0byBwbGFjZSB0aGUgYGFzeW5jYCBwaXBlIGluIHBhcmVudGhlc2lzLlxuICpcbiAqIEEgYmV0dGVyIHdheSB0byBkbyB0aGlzIGlzIHRvIHVzZSBgbmdJZmAgYW5kIHN0b3JlIHRoZSByZXN1bHQgb2YgdGhlIGNvbmRpdGlvbiBpbiBhIGxvY2FsXG4gKiB2YXJpYWJsZSBhcyBzaG93biBpbiB0aGUgdGhlIGV4YW1wbGUgYmVsb3c6XG4gKlxuICoge0BleGFtcGxlIGNvbW1vbi9uZ0lmL3RzL21vZHVsZS50cyByZWdpb249J05nSWZBcyd9XG4gKlxuICogTm90aWNlIHRoYXQ6XG4gKiAgLSBXZSB1c2Ugb25seSBvbmUgYGFzeW5jYCBwaXBlIGFuZCBoZW5jZSBvbmx5IG9uZSBzdWJzY3JpcHRpb24gZ2V0cyBjcmVhdGVkLlxuICogIC0gYG5nSWZgIHN0b3JlcyB0aGUgcmVzdWx0IG9mIHRoZSBgdXNlclN0cmVhbXxhc3luY2AgaW4gdGhlIGxvY2FsIHZhcmlhYmxlIGB1c2VyYC5cbiAqICAtIFRoZSBsb2NhbCBgdXNlcmAgY2FuIHRoZW4gYmUgYm91bmQgcmVwZWF0ZWRseSBpbiBhIG1vcmUgZWZmaWNpZW50IHdheS5cbiAqICAtIE5vIG5lZWQgdG8gdXNlIHRoZSBzYWZlLXRyYXZlcnNhbC1vcGVyYXRvciBgPy5gIHRvIGFjY2VzcyBwcm9wZXJ0aWVzIGFzIGBuZ0lmYCB3aWxsIG9ubHlcbiAqICAgIGRpc3BsYXkgdGhlIGRhdGEgaWYgYHVzZXJTdHJlYW1gIHJldHVybnMgYSB2YWx1ZS5cbiAqICAtIFdlIGNhbiBkaXNwbGF5IGFuIGFsdGVybmF0aXZlIHRlbXBsYXRlIHdoaWxlIHdhaXRpbmcgZm9yIHRoZSBkYXRhLlxuICpcbiAqICMjIyBTeW50YXhcbiAqXG4gKiBTaW1wbGUgZm9ybTpcbiAqIC0gYDxkaXYgKm5nSWY9XCJjb25kaXRpb25cIj4uLi48L2Rpdj5gXG4gKiAtIGA8bmctdGVtcGxhdGUgW25nSWZdPVwiY29uZGl0aW9uXCI+PGRpdj4uLi48L2Rpdj48L25nLXRlbXBsYXRlPmBcbiAqXG4gKiBGb3JtIHdpdGggYW4gZWxzZSBibG9jazpcbiAqIGBgYFxuICogPGRpdiAqbmdJZj1cImNvbmRpdGlvbjsgZWxzZSBlbHNlQmxvY2tcIj4uLi48L2Rpdj5cbiAqIDxuZy10ZW1wbGF0ZSAjZWxzZUJsb2NrPi4uLjwvbmctdGVtcGxhdGU+XG4gKiBgYGBcbiAqXG4gKiBGb3JtIHdpdGggYSBgdGhlbmAgYW5kIGBlbHNlYCBibG9jazpcbiAqIGBgYFxuICogPGRpdiAqbmdJZj1cImNvbmRpdGlvbjsgdGhlbiB0aGVuQmxvY2sgZWxzZSBlbHNlQmxvY2tcIj48L2Rpdj5cbiAqIDxuZy10ZW1wbGF0ZSAjdGhlbkJsb2NrPi4uLjwvbmctdGVtcGxhdGU+XG4gKiA8bmctdGVtcGxhdGUgI2Vsc2VCbG9jaz4uLi48L25nLXRlbXBsYXRlPlxuICogYGBgXG4gKlxuICogRm9ybSB3aXRoIHN0b3JpbmcgdGhlIHZhbHVlIGxvY2FsbHk6XG4gKiBgYGBcbiAqIDxkaXYgKm5nSWY9XCJjb25kaXRpb24gYXMgdmFsdWU7IGVsc2UgZWxzZUJsb2NrXCI+e3t2YWx1ZX19PC9kaXY+XG4gKiA8bmctdGVtcGxhdGUgI2Vsc2VCbG9jaz4uLi48L25nLXRlbXBsYXRlPlxuICogYGBgXG4gKlxuICogQG5nTW9kdWxlIENvbW1vbk1vZHVsZVxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tuZ0lmXSd9KVxuZXhwb3J0IGNsYXNzIE5nSWYge1xuICBwcml2YXRlIF9jb250ZXh0OiBOZ0lmQ29udGV4dCA9IG5ldyBOZ0lmQ29udGV4dCgpO1xuICBwcml2YXRlIF90aGVuVGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPE5nSWZDb250ZXh0PnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfZWxzZVRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxOZ0lmQ29udGV4dD58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3RoZW5WaWV3UmVmOiBFbWJlZGRlZFZpZXdSZWY8TmdJZkNvbnRleHQ+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9lbHNlVmlld1JlZjogRW1iZWRkZWRWaWV3UmVmPE5nSWZDb250ZXh0PnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF92aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmLCB0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8TmdJZkNvbnRleHQ+KSB7XG4gICAgdGhpcy5fdGhlblRlbXBsYXRlUmVmID0gdGVtcGxhdGVSZWY7XG4gIH1cblxuICBASW5wdXQoKVxuICBzZXQgbmdJZihjb25kaXRpb246IGFueSkge1xuICAgIHRoaXMuX2NvbnRleHQuJGltcGxpY2l0ID0gdGhpcy5fY29udGV4dC5uZ0lmID0gY29uZGl0aW9uO1xuICAgIHRoaXMuX3VwZGF0ZVZpZXcoKTtcbiAgfVxuXG4gIEBJbnB1dCgpXG4gIHNldCBuZ0lmVGhlbih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8TmdJZkNvbnRleHQ+fG51bGwpIHtcbiAgICBhc3NlcnRUZW1wbGF0ZSgnbmdJZlRoZW4nLCB0ZW1wbGF0ZVJlZik7XG4gICAgdGhpcy5fdGhlblRlbXBsYXRlUmVmID0gdGVtcGxhdGVSZWY7XG4gICAgdGhpcy5fdGhlblZpZXdSZWYgPSBudWxsOyAgLy8gY2xlYXIgcHJldmlvdXMgdmlldyBpZiBhbnkuXG4gICAgdGhpcy5fdXBkYXRlVmlldygpO1xuICB9XG5cbiAgQElucHV0KClcbiAgc2V0IG5nSWZFbHNlKHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxOZ0lmQ29udGV4dD58bnVsbCkge1xuICAgIGFzc2VydFRlbXBsYXRlKCduZ0lmRWxzZScsIHRlbXBsYXRlUmVmKTtcbiAgICB0aGlzLl9lbHNlVGVtcGxhdGVSZWYgPSB0ZW1wbGF0ZVJlZjtcbiAgICB0aGlzLl9lbHNlVmlld1JlZiA9IG51bGw7ICAvLyBjbGVhciBwcmV2aW91cyB2aWV3IGlmIGFueS5cbiAgICB0aGlzLl91cGRhdGVWaWV3KCk7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVWaWV3KCkge1xuICAgIGlmICh0aGlzLl9jb250ZXh0LiRpbXBsaWNpdCkge1xuICAgICAgaWYgKCF0aGlzLl90aGVuVmlld1JlZikge1xuICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX2Vsc2VWaWV3UmVmID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuX3RoZW5UZW1wbGF0ZVJlZikge1xuICAgICAgICAgIHRoaXMuX3RoZW5WaWV3UmVmID1cbiAgICAgICAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcodGhpcy5fdGhlblRlbXBsYXRlUmVmLCB0aGlzLl9jb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXRoaXMuX2Vsc2VWaWV3UmVmKSB7XG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fdGhlblZpZXdSZWYgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5fZWxzZVRlbXBsYXRlUmVmKSB7XG4gICAgICAgICAgdGhpcy5fZWxzZVZpZXdSZWYgPVxuICAgICAgICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyh0aGlzLl9lbHNlVGVtcGxhdGVSZWYsIHRoaXMuX2NvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwdWJsaWMgc3RhdGljIG5nSWZVc2VJZlR5cGVHdWFyZDogdm9pZDtcblxuICAvKipcbiAgICogQXNzZXJ0IHRoZSBjb3JyZWN0IHR5cGUgb2YgdGhlIGV4cHJlc3Npb24gYm91bmQgdG8gdGhlIGBuZ0lmYCBpbnB1dCB3aXRoaW4gdGhlIHRlbXBsYXRlLlxuICAgKlxuICAgKiBUaGUgcHJlc2VuY2Ugb2YgdGhpcyBtZXRob2QgaXMgYSBzaWduYWwgdG8gdGhlIEl2eSB0ZW1wbGF0ZSB0eXBlIGNoZWNrIGNvbXBpbGVyIHRoYXQgd2hlbiB0aGVcbiAgICogYE5nSWZgIHN0cnVjdHVyYWwgZGlyZWN0aXZlIHJlbmRlcnMgaXRzIHRlbXBsYXRlLCB0aGUgdHlwZSBvZiB0aGUgZXhwcmVzc2lvbiBib3VuZCB0byBgbmdJZmBcbiAgICogc2hvdWxkIGJlIG5hcnJvd2VkIGluIHNvbWUgd2F5LiBGb3IgYE5nSWZgLCBpdCBpcyBuYXJyb3dlZCB0byBiZSBub24tbnVsbCwgd2hpY2ggYWxsb3dzIHRoZVxuICAgKiBzdHJpY3ROdWxsQ2hlY2tzIGZlYXR1cmUgb2YgVHlwZVNjcmlwdCB0byB3b3JrIHdpdGggYE5nSWZgLlxuICAgKi9cbiAgc3RhdGljIG5nVGVtcGxhdGVHdWFyZF9uZ0lmPEU+KGRpcjogTmdJZiwgZXhwcjogRSk6IGV4cHIgaXMgTm9uTnVsbGFibGU8RT4geyByZXR1cm4gdHJ1ZTsgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5nSWZDb250ZXh0IHtcbiAgcHVibGljICRpbXBsaWNpdDogYW55ID0gbnVsbDtcbiAgcHVibGljIG5nSWY6IGFueSA9IG51bGw7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFRlbXBsYXRlKHByb3BlcnR5OiBzdHJpbmcsIHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxhbnk+fCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGlzVGVtcGxhdGVSZWZPck51bGwgPSAhISghdGVtcGxhdGVSZWYgfHwgdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KTtcbiAgaWYgKCFpc1RlbXBsYXRlUmVmT3JOdWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke3Byb3BlcnR5fSBtdXN0IGJlIGEgVGVtcGxhdGVSZWYsIGJ1dCByZWNlaXZlZCAnJHtzdHJpbmdpZnkodGVtcGxhdGVSZWYpfScuYCk7XG4gIH1cbn1cbiJdfQ==