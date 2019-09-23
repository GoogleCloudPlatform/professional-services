"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Must start with a letter, and must contain only alphanumeric characters or dashes.
// When adding a dash the segment after the dash must also start with a letter.
exports.htmlSelectorRe = /^[a-zA-Z][.0-9a-zA-Z]*(:?-[a-zA-Z][.0-9a-zA-Z]*)*$/;
exports.htmlSelectorFormat = {
    name: 'html-selector',
    formatter: {
        async: false,
        validate: (selector) => exports.htmlSelectorRe.test(selector),
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC1zZWxlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvZm9ybWF0cy9odG1sLXNlbGVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBS0gscUZBQXFGO0FBQ3JGLCtFQUErRTtBQUNsRSxRQUFBLGNBQWMsR0FBRyxvREFBb0QsQ0FBQztBQUV0RSxRQUFBLGtCQUFrQixHQUF3QjtJQUNyRCxJQUFJLEVBQUUsZUFBZTtJQUNyQixTQUFTLEVBQUU7UUFDVCxLQUFLLEVBQUUsS0FBSztRQUNaLFFBQVEsRUFBRSxDQUFDLFFBQWdCLEVBQUUsRUFBRSxDQUFDLHNCQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztLQUM5RDtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IHNjaGVtYSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcblxuXG4vLyBNdXN0IHN0YXJ0IHdpdGggYSBsZXR0ZXIsIGFuZCBtdXN0IGNvbnRhaW4gb25seSBhbHBoYW51bWVyaWMgY2hhcmFjdGVycyBvciBkYXNoZXMuXG4vLyBXaGVuIGFkZGluZyBhIGRhc2ggdGhlIHNlZ21lbnQgYWZ0ZXIgdGhlIGRhc2ggbXVzdCBhbHNvIHN0YXJ0IHdpdGggYSBsZXR0ZXIuXG5leHBvcnQgY29uc3QgaHRtbFNlbGVjdG9yUmUgPSAvXlthLXpBLVpdWy4wLTlhLXpBLVpdKig6Py1bYS16QS1aXVsuMC05YS16QS1aXSopKiQvO1xuXG5leHBvcnQgY29uc3QgaHRtbFNlbGVjdG9yRm9ybWF0OiBzY2hlbWEuU2NoZW1hRm9ybWF0ID0ge1xuICBuYW1lOiAnaHRtbC1zZWxlY3RvcicsXG4gIGZvcm1hdHRlcjoge1xuICAgIGFzeW5jOiBmYWxzZSxcbiAgICB2YWxpZGF0ZTogKHNlbGVjdG9yOiBzdHJpbmcpID0+IGh0bWxTZWxlY3RvclJlLnRlc3Qoc2VsZWN0b3IpLFxuICB9LFxufTtcbiJdfQ==