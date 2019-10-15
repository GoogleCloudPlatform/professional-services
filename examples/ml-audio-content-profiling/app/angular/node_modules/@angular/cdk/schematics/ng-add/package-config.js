"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Sorts the keys of the given object.
 * @returns A new object instance with sorted keys
 */
function sortObjectByKeys(obj) {
    return Object.keys(obj).sort().reduce((result, key) => (result[key] = obj[key]) && result, {});
}
/** Adds a package to the package.json in the given host tree. */
function addPackageToPackageJson(host, pkg, version) {
    if (host.exists('package.json')) {
        const sourceText = host.read('package.json').toString('utf-8');
        const json = JSON.parse(sourceText);
        if (!json.dependencies) {
            json.dependencies = {};
        }
        if (!json.dependencies[pkg]) {
            json.dependencies[pkg] = version;
            json.dependencies = sortObjectByKeys(json.dependencies);
        }
        host.overwrite('package.json', JSON.stringify(json, null, 2));
    }
    return host;
}
exports.addPackageToPackageJson = addPackageToPackageJson;
//# sourceMappingURL=package-config.js.map