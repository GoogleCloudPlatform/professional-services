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
/**
 * Finds the specified project configuration in the workspace. Throws an error if the project
 * couldn't be found.
 */
function getProjectFromWorkspace(workspace, projectName) {
    const project = workspace.projects[projectName || workspace.defaultProject];
    if (!project) {
        throw new schematics_1.SchematicsException(`Could not find project in workspace: ${projectName}`);
    }
    return project;
}
exports.getProjectFromWorkspace = getProjectFromWorkspace;
//# sourceMappingURL=get-project.js.map