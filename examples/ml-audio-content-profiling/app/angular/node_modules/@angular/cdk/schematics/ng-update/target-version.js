"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
/** Possible versions that can be automatically migrated by `ng update`. */
var TargetVersion;
(function (TargetVersion) {
    TargetVersion[TargetVersion["V6"] = 0] = "V6";
    TargetVersion[TargetVersion["V7"] = 1] = "V7";
    TargetVersion[TargetVersion["V8"] = 2] = "V8";
})(TargetVersion = exports.TargetVersion || (exports.TargetVersion = {}));
/**
 * Returns all versions that are supported by "ng update". The versions are determined
 * based on the "TargetVersion" enum.
 */
function getAllVersionNames() {
    return Object.keys(TargetVersion)
        .filter(enumValue => typeof TargetVersion[enumValue] === 'number');
}
exports.getAllVersionNames = getAllVersionNames;
//# sourceMappingURL=target-version.js.map