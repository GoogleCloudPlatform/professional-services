"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable:no-implicit-dependencies
const benchmark_1 = require("@_/benchmark");
const parser_1 = require("./parser");
const testCase = {
    'hello': [0, 1, 'world', 2],
    'world': {
        'great': 123E-12,
    },
};
const testCaseJson = JSON.stringify(testCase);
describe('parserJson', () => {
    benchmark_1.benchmark('parseJsonAst', () => parser_1.parseJsonAst(testCaseJson), () => JSON.parse(testCaseJson));
    benchmark_1.benchmark('parseJson', () => parser_1.parseJson(testCaseJson));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyX2JlbmNobWFyay5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvanNvbi9wYXJzZXJfYmVuY2htYXJrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsMENBQTBDO0FBQzFDLDRDQUF5QztBQUN6QyxxQ0FBbUQ7QUFHbkQsTUFBTSxRQUFRLEdBQUc7SUFDZixPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDM0IsT0FBTyxFQUFFO1FBQ1AsT0FBTyxFQUFFLE9BQU87S0FDakI7Q0FDRixDQUFDO0FBQ0YsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUc5QyxRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtJQUMxQixxQkFBUyxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxxQkFBWSxDQUFDLFlBQVksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUM1RixxQkFBUyxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxrQkFBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG4vLyB0c2xpbnQ6ZGlzYWJsZTpuby1pbXBsaWNpdC1kZXBlbmRlbmNpZXNcbmltcG9ydCB7IGJlbmNobWFyayB9IGZyb20gJ0BfL2JlbmNobWFyayc7XG5pbXBvcnQgeyBwYXJzZUpzb24sIHBhcnNlSnNvbkFzdCB9IGZyb20gJy4vcGFyc2VyJztcblxuXG5jb25zdCB0ZXN0Q2FzZSA9IHtcbiAgJ2hlbGxvJzogWzAsIDEsICd3b3JsZCcsIDJdLFxuICAnd29ybGQnOiB7XG4gICAgJ2dyZWF0JzogMTIzRS0xMixcbiAgfSxcbn07XG5jb25zdCB0ZXN0Q2FzZUpzb24gPSBKU09OLnN0cmluZ2lmeSh0ZXN0Q2FzZSk7XG5cblxuZGVzY3JpYmUoJ3BhcnNlckpzb24nLCAoKSA9PiB7XG4gIGJlbmNobWFyaygncGFyc2VKc29uQXN0JywgKCkgPT4gcGFyc2VKc29uQXN0KHRlc3RDYXNlSnNvbiksICgpID0+IEpTT04ucGFyc2UodGVzdENhc2VKc29uKSk7XG4gIGJlbmNobWFyaygncGFyc2VKc29uJywgKCkgPT4gcGFyc2VKc29uKHRlc3RDYXNlSnNvbikpO1xufSk7XG4iXX0=