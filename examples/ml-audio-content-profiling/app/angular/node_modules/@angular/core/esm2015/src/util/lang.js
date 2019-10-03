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
/**
 * Determine if the argument is shaped like a Promise
 * @param {?} obj
 * @return {?}
 */
export function isPromise(obj) {
    // allow any Promise/A+ compliant thenable.
    // It's up to the caller to ensure that obj.then conforms to the spec
    return !!obj && typeof obj.then === 'function';
}
/**
 * Determine if the argument is an Observable
 * @param {?} obj
 * @return {?}
 */
export function isObservable(obj) {
    // TODO: use isObservable once we update pass rxjs 6.1
    // https://github.com/ReactiveX/rxjs/blob/master/CHANGELOG.md#610-2018-05-03
    return !!obj && typeof obj.subscribe === 'function';
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3V0aWwvbGFuZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBYUEsTUFBTSxVQUFVLFNBQVMsQ0FBQyxHQUFROzs7SUFHaEMsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUM7Q0FDaEQ7Ozs7OztBQUtELE1BQU0sVUFBVSxZQUFZLENBQUMsR0FBMEI7OztJQUdyRCxPQUFPLENBQUMsQ0FBQyxHQUFHLElBQUksT0FBTyxHQUFHLENBQUMsU0FBUyxLQUFLLFVBQVUsQ0FBQztDQUNyRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgdGhlIGFyZ3VtZW50IGlzIHNoYXBlZCBsaWtlIGEgUHJvbWlzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNQcm9taXNlKG9iajogYW55KTogb2JqIGlzIFByb21pc2U8YW55PiB7XG4gIC8vIGFsbG93IGFueSBQcm9taXNlL0ErIGNvbXBsaWFudCB0aGVuYWJsZS5cbiAgLy8gSXQncyB1cCB0byB0aGUgY2FsbGVyIHRvIGVuc3VyZSB0aGF0IG9iai50aGVuIGNvbmZvcm1zIHRvIHRoZSBzcGVjXG4gIHJldHVybiAhIW9iaiAmJiB0eXBlb2Ygb2JqLnRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIHRoZSBhcmd1bWVudCBpcyBhbiBPYnNlcnZhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc09ic2VydmFibGUob2JqOiBhbnkgfCBPYnNlcnZhYmxlPGFueT4pOiBvYmogaXMgT2JzZXJ2YWJsZTxhbnk+IHtcbiAgLy8gVE9ETzogdXNlIGlzT2JzZXJ2YWJsZSBvbmNlIHdlIHVwZGF0ZSBwYXNzIHJ4anMgNi4xXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9SZWFjdGl2ZVgvcnhqcy9ibG9iL21hc3Rlci9DSEFOR0VMT0cubWQjNjEwLTIwMTgtMDUtMDNcbiAgcmV0dXJuICEhb2JqICYmIHR5cGVvZiBvYmouc3Vic2NyaWJlID09PSAnZnVuY3Rpb24nO1xufVxuIl19