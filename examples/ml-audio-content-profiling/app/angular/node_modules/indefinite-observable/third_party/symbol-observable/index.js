

/** @license for symbol-observable:
 * The MIT License (MIT)
 *
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
 * Copyright (c) Ben Lesh <ben@benlesh.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// Using 4 spaces for indentation, to match TypeScript output.
var $$observable = (
    () => {
        var root;

        if (typeof self !== 'undefined') {
            root = self;
        } else if (typeof window !== 'undefined') {
            root = window;
        } else if (typeof global !== 'undefined') {
            root = global;
        } else if (typeof module !== 'undefined') {
            root = module;
        } else {
            root = Function('return this')();
        }

        // symbol-observable/ponyfill.js
        var result;
        var Symbol = root.Symbol;

        if (typeof Symbol === 'function') {
            if (Symbol.observable) {
                result = Symbol.observable;
            } else {
                result = Symbol('observable');
                Symbol.observable = result;
            }
        } else {
            result = '@@observable';
        }

        return result;
    }
)();
