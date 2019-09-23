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
 * To create a Pipe, you must implement this interface.
 *
 * Angular invokes the `transform` method with the value of a binding
 * as the first argument, and any parameters as the second argument in list form.
 *
 * \@usageNotes
 * ### Example
 *
 * The `RepeatPipe` below repeats the value as many times as indicated by the first argument:
 *
 * ```
 * import {Pipe, PipeTransform} from '\@angular/core';
 *
 * \@Pipe({name: 'repeat'})
 * export class RepeatPipe implements PipeTransform {
 *   transform(value: any, times: number) {
 *     return value.repeat(times);
 *   }
 * }
 * ```
 *
 * Invoking `{{ 'ok' | repeat:3 }}` in a template produces `okokok`.
 *
 * \@publicApi
 * @record
 */
export function PipeTransform() { }
/** @type {?} */
PipeTransform.prototype.transform;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZV90cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9jaGFuZ2VfZGV0ZWN0aW9uL3BpcGVfdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogVG8gY3JlYXRlIGEgUGlwZSwgeW91IG11c3QgaW1wbGVtZW50IHRoaXMgaW50ZXJmYWNlLlxuICpcbiAqIEFuZ3VsYXIgaW52b2tlcyB0aGUgYHRyYW5zZm9ybWAgbWV0aG9kIHdpdGggdGhlIHZhbHVlIG9mIGEgYmluZGluZ1xuICogYXMgdGhlIGZpcnN0IGFyZ3VtZW50LCBhbmQgYW55IHBhcmFtZXRlcnMgYXMgdGhlIHNlY29uZCBhcmd1bWVudCBpbiBsaXN0IGZvcm0uXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogVGhlIGBSZXBlYXRQaXBlYCBiZWxvdyByZXBlYXRzIHRoZSB2YWx1ZSBhcyBtYW55IHRpbWVzIGFzIGluZGljYXRlZCBieSB0aGUgZmlyc3QgYXJndW1lbnQ6XG4gKlxuICogYGBgXG4gKiBpbXBvcnQge1BpcGUsIFBpcGVUcmFuc2Zvcm19IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICpcbiAqIEBQaXBlKHtuYW1lOiAncmVwZWF0J30pXG4gKiBleHBvcnQgY2xhc3MgUmVwZWF0UGlwZSBpbXBsZW1lbnRzIFBpcGVUcmFuc2Zvcm0ge1xuICogICB0cmFuc2Zvcm0odmFsdWU6IGFueSwgdGltZXM6IG51bWJlcikge1xuICogICAgIHJldHVybiB2YWx1ZS5yZXBlYXQodGltZXMpO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBJbnZva2luZyBge3sgJ29rJyB8IHJlcGVhdDozIH19YCBpbiBhIHRlbXBsYXRlIHByb2R1Y2VzIGBva29rb2tgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQaXBlVHJhbnNmb3JtIHsgdHJhbnNmb3JtKHZhbHVlOiBhbnksIC4uLmFyZ3M6IGFueVtdKTogYW55OyB9XG4iXX0=