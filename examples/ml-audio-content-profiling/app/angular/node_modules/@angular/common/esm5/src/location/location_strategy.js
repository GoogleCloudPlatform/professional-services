/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
/**
 * `LocationStrategy` is responsible for representing and reading route state
 * from the browser's URL. Angular provides two strategies:
 * {@link HashLocationStrategy} and {@link PathLocationStrategy}.
 *
 * This is used under the hood of the {@link Location} service.
 *
 * Applications should use the {@link Router} or {@link Location} services to
 * interact with application route state.
 *
 * For instance, {@link HashLocationStrategy} produces URLs like
 * `http://example.com#/foo`, and {@link PathLocationStrategy} produces
 * `http://example.com/foo` as an equivalent URL.
 *
 * See these two classes for more.
 *
 * @publicApi
 */
var LocationStrategy = /** @class */ (function () {
    function LocationStrategy() {
    }
    return LocationStrategy;
}());
export { LocationStrategy };
/**
 * The `APP_BASE_HREF` token represents the base href to be used with the
 * {@link PathLocationStrategy}.
 *
 * If you're using {@link PathLocationStrategy}, you must provide a provider to a string
 * representing the URL prefix that should be preserved when generating and recognizing
 * URLs.
 *
 * @usageNotes
 *
 * ### Example
 *
 * ```typescript
 * import {Component, NgModule} from '@angular/core';
 * import {APP_BASE_HREF} from '@angular/common';
 *
 * @NgModule({
 *   providers: [{provide: APP_BASE_HREF, useValue: '/my/app'}]
 * })
 * class AppModule {}
 * ```
 *
 * @publicApi
 */
export var APP_BASE_HREF = new InjectionToken('appBaseHref');

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYXRpb25fc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vc3JjL2xvY2F0aW9uL2xvY2F0aW9uX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHN0M7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0g7SUFBQTtJQVNBLENBQUM7SUFBRCx1QkFBQztBQUFELENBQUMsQUFURCxJQVNDOztBQUdEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXVCRztBQUNILE1BQU0sQ0FBQyxJQUFNLGFBQWEsR0FBRyxJQUFJLGNBQWMsQ0FBUyxhQUFhLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0xvY2F0aW9uQ2hhbmdlTGlzdGVuZXJ9IGZyb20gJy4vcGxhdGZvcm1fbG9jYXRpb24nO1xuXG4vKipcbiAqIGBMb2NhdGlvblN0cmF0ZWd5YCBpcyByZXNwb25zaWJsZSBmb3IgcmVwcmVzZW50aW5nIGFuZCByZWFkaW5nIHJvdXRlIHN0YXRlXG4gKiBmcm9tIHRoZSBicm93c2VyJ3MgVVJMLiBBbmd1bGFyIHByb3ZpZGVzIHR3byBzdHJhdGVnaWVzOlxuICoge0BsaW5rIEhhc2hMb2NhdGlvblN0cmF0ZWd5fSBhbmQge0BsaW5rIFBhdGhMb2NhdGlvblN0cmF0ZWd5fS5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgdW5kZXIgdGhlIGhvb2Qgb2YgdGhlIHtAbGluayBMb2NhdGlvbn0gc2VydmljZS5cbiAqXG4gKiBBcHBsaWNhdGlvbnMgc2hvdWxkIHVzZSB0aGUge0BsaW5rIFJvdXRlcn0gb3Ige0BsaW5rIExvY2F0aW9ufSBzZXJ2aWNlcyB0b1xuICogaW50ZXJhY3Qgd2l0aCBhcHBsaWNhdGlvbiByb3V0ZSBzdGF0ZS5cbiAqXG4gKiBGb3IgaW5zdGFuY2UsIHtAbGluayBIYXNoTG9jYXRpb25TdHJhdGVneX0gcHJvZHVjZXMgVVJMcyBsaWtlXG4gKiBgaHR0cDovL2V4YW1wbGUuY29tIy9mb29gLCBhbmQge0BsaW5rIFBhdGhMb2NhdGlvblN0cmF0ZWd5fSBwcm9kdWNlc1xuICogYGh0dHA6Ly9leGFtcGxlLmNvbS9mb29gIGFzIGFuIGVxdWl2YWxlbnQgVVJMLlxuICpcbiAqIFNlZSB0aGVzZSB0d28gY2xhc3NlcyBmb3IgbW9yZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBMb2NhdGlvblN0cmF0ZWd5IHtcbiAgYWJzdHJhY3QgcGF0aChpbmNsdWRlSGFzaD86IGJvb2xlYW4pOiBzdHJpbmc7XG4gIGFic3RyYWN0IHByZXBhcmVFeHRlcm5hbFVybChpbnRlcm5hbDogc3RyaW5nKTogc3RyaW5nO1xuICBhYnN0cmFjdCBwdXNoU3RhdGUoc3RhdGU6IGFueSwgdGl0bGU6IHN0cmluZywgdXJsOiBzdHJpbmcsIHF1ZXJ5UGFyYW1zOiBzdHJpbmcpOiB2b2lkO1xuICBhYnN0cmFjdCByZXBsYWNlU3RhdGUoc3RhdGU6IGFueSwgdGl0bGU6IHN0cmluZywgdXJsOiBzdHJpbmcsIHF1ZXJ5UGFyYW1zOiBzdHJpbmcpOiB2b2lkO1xuICBhYnN0cmFjdCBmb3J3YXJkKCk6IHZvaWQ7XG4gIGFic3RyYWN0IGJhY2soKTogdm9pZDtcbiAgYWJzdHJhY3Qgb25Qb3BTdGF0ZShmbjogTG9jYXRpb25DaGFuZ2VMaXN0ZW5lcik6IHZvaWQ7XG4gIGFic3RyYWN0IGdldEJhc2VIcmVmKCk6IHN0cmluZztcbn1cblxuXG4vKipcbiAqIFRoZSBgQVBQX0JBU0VfSFJFRmAgdG9rZW4gcmVwcmVzZW50cyB0aGUgYmFzZSBocmVmIHRvIGJlIHVzZWQgd2l0aCB0aGVcbiAqIHtAbGluayBQYXRoTG9jYXRpb25TdHJhdGVneX0uXG4gKlxuICogSWYgeW91J3JlIHVzaW5nIHtAbGluayBQYXRoTG9jYXRpb25TdHJhdGVneX0sIHlvdSBtdXN0IHByb3ZpZGUgYSBwcm92aWRlciB0byBhIHN0cmluZ1xuICogcmVwcmVzZW50aW5nIHRoZSBVUkwgcHJlZml4IHRoYXQgc2hvdWxkIGJlIHByZXNlcnZlZCB3aGVuIGdlbmVyYXRpbmcgYW5kIHJlY29nbml6aW5nXG4gKiBVUkxzLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQge0NvbXBvbmVudCwgTmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICogaW1wb3J0IHtBUFBfQkFTRV9IUkVGfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuICpcbiAqIEBOZ01vZHVsZSh7XG4gKiAgIHByb3ZpZGVyczogW3twcm92aWRlOiBBUFBfQkFTRV9IUkVGLCB1c2VWYWx1ZTogJy9teS9hcHAnfV1cbiAqIH0pXG4gKiBjbGFzcyBBcHBNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9CQVNFX0hSRUYgPSBuZXcgSW5qZWN0aW9uVG9rZW48c3RyaW5nPignYXBwQmFzZUhyZWYnKTtcbiJdfQ==