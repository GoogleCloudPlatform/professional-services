"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const experimental = require("./experimental");
exports.experimental = experimental;
const json = require("./json");
exports.json = json;
const logging = require("./logger");
exports.logging = logging;
const terminal = require("./terminal");
exports.terminal = terminal;
__export(require("./exception/exception"));
__export(require("./json"));
__export(require("./utils"));
__export(require("./virtual-fs"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQStDO0FBVzdDLG9DQUFZO0FBVmQsK0JBQStCO0FBVzdCLG9CQUFJO0FBVk4sb0NBQW9DO0FBV2xDLDBCQUFPO0FBVlQsdUNBQXVDO0FBV3JDLDRCQUFRO0FBVFYsMkNBQXNDO0FBQ3RDLDRCQUF1QjtBQUN2Qiw2QkFBd0I7QUFDeEIsa0NBQTZCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgZXhwZXJpbWVudGFsIGZyb20gJy4vZXhwZXJpbWVudGFsJztcbmltcG9ydCAqIGFzIGpzb24gZnJvbSAnLi9qc29uJztcbmltcG9ydCAqIGFzIGxvZ2dpbmcgZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0ICogYXMgdGVybWluYWwgZnJvbSAnLi90ZXJtaW5hbCc7XG5cbmV4cG9ydCAqIGZyb20gJy4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL2pzb24nO1xuZXhwb3J0ICogZnJvbSAnLi91dGlscyc7XG5leHBvcnQgKiBmcm9tICcuL3ZpcnR1YWwtZnMnO1xuXG5leHBvcnQge1xuICBleHBlcmltZW50YWwsXG4gIGpzb24sXG4gIGxvZ2dpbmcsXG4gIHRlcm1pbmFsLFxufTtcbiJdfQ==