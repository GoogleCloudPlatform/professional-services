"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const schematics_2 = require("@angular/cdk/schematics");
/**
 * Scaffolds a new dashboard component.
 * Internally it bootstraps the base component schematic
 */
function default_1(options) {
    return schematics_1.chain([
        schematics_2.buildComponent(Object.assign({}, options), {
            template: './__path__/__name@dasherize@if-flat__/__name@dasherize__.component.html',
            stylesheet: './__path__/__name@dasherize@if-flat__/__name@dasherize__.component.__styleext__',
        }),
        options.skipImport ? schematics_1.noop() : addNavModulesToModule(options)
    ]);
}
exports.default = default_1;
/**
 * Adds the required modules to the relative module.
 */
function addNavModulesToModule(options) {
    return (host) => {
        const modulePath = schematics_2.findModuleFromOptions(host, options);
        schematics_2.addModuleImportToModule(host, modulePath, 'MatGridListModule', '@angular/material');
        schematics_2.addModuleImportToModule(host, modulePath, 'MatCardModule', '@angular/material');
        schematics_2.addModuleImportToModule(host, modulePath, 'MatMenuModule', '@angular/material');
        schematics_2.addModuleImportToModule(host, modulePath, 'MatIconModule', '@angular/material');
        schematics_2.addModuleImportToModule(host, modulePath, 'MatButtonModule', '@angular/material');
        schematics_2.addModuleImportToModule(host, modulePath, 'LayoutModule', '@angular/cdk/layout');
        return host;
    };
}
//# sourceMappingURL=index.js.map