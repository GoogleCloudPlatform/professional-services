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
const utils_1 = require("../../utils");
/** Scaffolds a new Angular component that uses the Drag and Drop module. */
function default_1(options) {
    return schematics_1.chain([
        utils_1.buildComponent(Object.assign({}, options), {
            template: './__path__/__name@dasherize@if-flat__/__name@dasherize__.component.html',
            stylesheet: './__path__/__name@dasherize@if-flat__/__name@dasherize__.component.__styleext__',
        }),
        options.skipImport ? schematics_1.noop() : addDragDropModulesToModule(options)
    ]);
}
exports.default = default_1;
/** Adds the required modules to the main module of the CLI project. */
function addDragDropModulesToModule(options) {
    return (host) => {
        const modulePath = utils_1.findModuleFromOptions(host, options);
        utils_1.addModuleImportToModule(host, modulePath, 'DragDropModule', '@angular/cdk/drag-drop');
        return host;
    };
}
//# sourceMappingURL=index.js.map