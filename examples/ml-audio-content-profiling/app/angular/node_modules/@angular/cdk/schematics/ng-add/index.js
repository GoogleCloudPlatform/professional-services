"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const package_config_1 = require("./package-config");
/** Name of the Angular CDK version that is shipped together with the schematics. */
exports.cdkVersion = loadPackageVersionGracefully('@angular/cdk');
/**
 * Schematic factory entry-point for the `ng-add` schematic. The ng-add schematic will be
 * automatically executed if developers run `ng add @angular/cdk`.
 *
 * By default, the CLI already installs the package that has been specified with `ng add`.
 * We just store the version in the `package.json` in case the package manager didn't. Also
 * this ensures that there will be no error that says that the CDK does not support `ng add`.
 */
function default_1() {
    return (host) => {
        // In order to align the CDK version with the other Angular dependencies, we use tilde
        // instead of caret. This is default for Angular dependencies in new CLI projects.
        package_config_1.addPackageToPackageJson(host, '@angular/cdk', `~${exports.cdkVersion}`);
    };
}
exports.default = default_1;
/** Loads the full version from the given Angular package gracefully. */
function loadPackageVersionGracefully(packageName) {
    try {
        return require(`${packageName}/package.json`).version;
    }
    catch (_a) {
        return null;
    }
}
//# sourceMappingURL=index.js.map