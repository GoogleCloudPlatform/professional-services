/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
!function(e,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports,require("@angular/core")):"function"==typeof define&&define.amd?define("@angular/cdk/coercion",["exports","@angular/core"],n):n((e.ng=e.ng||{},e.ng.cdk=e.ng.cdk||{},e.ng.cdk.coercion={}),e.ng.core)}(this,function(e,n){"use strict";function r(e){return null!=e&&""+e!="false"}function o(e,n){return void 0===n&&(n=0),t(e)?Number(e):n}function t(e){return!isNaN(parseFloat(e))&&!isNaN(Number(e))}function c(e){return Array.isArray(e)?e:[e]}function u(e){return null==e?"":"string"==typeof e?e:e+"px"}function i(e){return e instanceof n.ElementRef?e.nativeElement:e}e.coerceBooleanProperty=r,e.coerceNumberProperty=o,e._isNumberValue=t,e.coerceArray=c,e.coerceCssPixelValue=u,e.coerceElement=i,Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=cdk-coercion.umd.min.js.map
