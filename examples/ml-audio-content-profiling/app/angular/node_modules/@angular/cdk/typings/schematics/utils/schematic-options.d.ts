/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { WorkspaceProject } from '@angular-devkit/core/src/workspace';
/**
 * Returns the default options for the `@schematics/angular:component` schematic which would
 * have been specified at project initialization (ng new or ng init).
 *
 * This is necessary because the Angular CLI only exposes the default values for the "--style",
 * "--inlineStyle", "--skipTests" and "--inlineTemplate" options to the "component" schematic.
 */
export declare function getDefaultComponentOptions(project: WorkspaceProject): {
    styleext: string | null;
    inlineStyle: boolean | null;
    inlineTemplate: boolean | null;
    spec: boolean | null;
};
