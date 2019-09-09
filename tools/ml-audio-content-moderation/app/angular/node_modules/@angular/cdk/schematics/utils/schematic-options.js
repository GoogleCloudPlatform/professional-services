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
 * Returns the default options for the `@schematics/angular:component` schematic which would
 * have been specified at project initialization (ng new or ng init).
 *
 * This is necessary because the Angular CLI only exposes the default values for the "--style",
 * "--inlineStyle", "--skipTests" and "--inlineTemplate" options to the "component" schematic.
 */
function getDefaultComponentOptions(project) {
    // Note: Not all options which are available when running "ng new" will be stored in the
    // workspace config. List of options which will be available in the configuration:
    // angular/angular-cli/blob/master/packages/schematics/angular/application/index.ts#L109-L131
    return {
        styleext: getDefaultComponentOption(project, 'styleext', 'css'),
        inlineStyle: getDefaultComponentOption(project, 'inlineStyle', false),
        inlineTemplate: getDefaultComponentOption(project, 'inlineTemplate', false),
        spec: getDefaultComponentOption(project, 'spec', true),
    };
}
exports.getDefaultComponentOptions = getDefaultComponentOptions;
/**
 * Gets the default value for the specified option. The default options will be determined
 * by looking at the stored schematic options for `@schematics/angular:component` in the
 * CLI workspace configuration.
 */
function getDefaultComponentOption(project, optionName, fallbackValue) {
    if (project.schematics &&
        project.schematics['@schematics/angular:component'] &&
        project.schematics['@schematics/angular:component'][optionName] != null) {
        return project.schematics['@schematics/angular:component'][optionName];
    }
    return fallbackValue;
}
//# sourceMappingURL=schematic-options.js.map