"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
/** Name of the Material version that is shipped together with the schematics. */
exports.materialVersion = loadPackageVersionGracefully('@angular/cdk') ||
    loadPackageVersionGracefully('@angular/material');
/**
 * Range of Angular versions that can be used together with the Angular Material version
 * that provides these schematics.
 */
exports.requiredAngularVersionRange = '>=7.0.0';
/** HammerJS version that should be installed if gestures will be set up. */
exports.hammerjsVersion = '^2.0.8';
/** Loads the full version from the given Angular package gracefully. */
function loadPackageVersionGracefully(packageName) {
    try {
        return require(`${packageName}/package.json`).version;
    }
    catch (_a) {
        return null;
    }
}
//# sourceMappingURL=version-names.js.map