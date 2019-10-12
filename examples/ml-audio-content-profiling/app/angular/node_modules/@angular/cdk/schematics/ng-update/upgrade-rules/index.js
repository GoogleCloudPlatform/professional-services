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
const tasks_1 = require("@angular-devkit/schematics/tasks");
const glob_1 = require("glob");
const project_tsconfig_paths_1 = require("./project-tsconfig-paths");
const tslint_config_1 = require("./tslint-config");
/** Creates a Angular schematic rule that runs the upgrade for the specified target version. */
function createUpgradeRule(targetVersion, upgradeConfig) {
    return (tree, context) => {
        const projectTsConfigPaths = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
        const tslintFixTasks = [];
        if (!projectTsConfigPaths.length) {
            throw new schematics_1.SchematicsException('Could not find any tsconfig file. Please submit an issue ' +
                'on the Angular Material repository that includes the path to your "tsconfig" file.');
        }
        // In some applications, developers will have global stylesheets which are not specified in any
        // Angular component. Therefore we glob up all CSS and SCSS files outside of node_modules and
        // dist. The files will be read by the individual stylesheet rules and checked.
        const extraStyleFiles = glob_1.sync('!(node_modules|dist)/**/*.+(css|scss)', { absolute: true });
        const tslintConfig = tslint_config_1.createTslintConfig(targetVersion, Object.assign({ 
            // Default options that can be overwritten if specified explicitly. e.g. if the
            // Material update schematic wants to specify a different upgrade data.
            extraStyleFiles: extraStyleFiles }, upgradeConfig));
        for (const tsconfig of projectTsConfigPaths) {
            // Run the update tslint rules.
            tslintFixTasks.push(context.addTask(new tasks_1.TslintFixTask(tslintConfig, {
                silent: false,
                ignoreErrors: true,
                tsConfigPath: tsconfig,
            })));
        }
        // Delete the temporary schematics directory.
        context.addTask(new tasks_1.RunSchematicTask('ng-post-update', {}), tslintFixTasks);
    };
}
exports.createUpgradeRule = createUpgradeRule;
//# sourceMappingURL=index.js.map