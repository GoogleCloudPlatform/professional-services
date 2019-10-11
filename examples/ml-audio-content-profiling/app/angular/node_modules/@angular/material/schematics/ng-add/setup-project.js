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
const chalk_1 = require("chalk");
const config_1 = require("@schematics/angular/utility/config");
const ng_ast_utils_1 = require("@schematics/angular/utility/ng-ast-utils");
const material_fonts_1 = require("./fonts/material-fonts");
const hammerjs_import_1 = require("./gestures/hammerjs-import");
const theming_1 = require("./theming/theming");
/** Name of the Angular module that enables Angular browser animations. */
const browserAnimationsModuleName = 'BrowserAnimationsModule';
/** Name of the module that switches Angular animations to a noop implementation. */
const noopAnimationsModuleName = 'NoopAnimationsModule';
/**
 * Scaffolds the basics of a Angular Material application, this includes:
 *  - Add Packages to package.json
 *  - Adds pre-built themes to styles.ext
 *  - Adds Browser Animation to app.module
 */
function default_1(options) {
    return schematics_1.chain([
        options && options.gestures ? hammerjs_import_1.addHammerJsToMain(options) : schematics_1.noop(),
        addAnimationsModule(options),
        theming_1.addThemeToAppStyles(options),
        material_fonts_1.addFontsToIndex(options),
        addMaterialAppStyles(options),
    ]);
}
exports.default = default_1;
/**
 * Adds an animation module to the root module of the specified project. In case the "animations"
 * option is set to false, we still add the `NoopAnimationsModule` because otherwise various
 * components of Angular Material will throw an exception.
 */
function addAnimationsModule(options) {
    return (host) => {
        const workspace = config_1.getWorkspace(host);
        const project = schematics_2.getProjectFromWorkspace(workspace, options.project);
        const appModulePath = ng_ast_utils_1.getAppModulePath(host, schematics_2.getProjectMainFile(project));
        if (options.animations) {
            // In case the project explicitly uses the NoopAnimationsModule, we should print a warning
            // message that makes the user aware of the fact that we won't automatically set up
            // animations. If we would add the BrowserAnimationsModule while the NoopAnimationsModule
            // is already configured, we would cause unexpected behavior and runtime exceptions.
            if (schematics_2.hasNgModuleImport(host, appModulePath, noopAnimationsModuleName)) {
                return console.warn(chalk_1.red(`Could not set up "${chalk_1.bold(browserAnimationsModuleName)}" ` +
                    `because "${chalk_1.bold(noopAnimationsModuleName)}" is already imported. Please manually ` +
                    `set up browser animations.`));
            }
            schematics_2.addModuleImportToRootModule(host, browserAnimationsModuleName, '@angular/platform-browser/animations', project);
        }
        else if (!schematics_2.hasNgModuleImport(host, appModulePath, browserAnimationsModuleName)) {
            // Do not add the NoopAnimationsModule module if the project already explicitly uses
            // the BrowserAnimationsModule.
            schematics_2.addModuleImportToRootModule(host, noopAnimationsModuleName, '@angular/platform-browser/animations', project);
        }
        return host;
    };
}
/**
 * Adds custom Material styles to the project style file. The custom CSS sets up the Roboto font
 * and reset the default browser body margin.
 */
function addMaterialAppStyles(options) {
    return (host) => {
        const workspace = config_1.getWorkspace(host);
        const project = schematics_2.getProjectFromWorkspace(workspace, options.project);
        const styleFilePath = schematics_2.getProjectStyleFile(project);
        if (!styleFilePath) {
            console.warn(chalk_1.red(`Could not find the default style file for this project.`));
            console.warn(chalk_1.red(`Please consider manually setting up the Roboto font in your CSS.`));
            return;
        }
        const buffer = host.read(styleFilePath);
        if (!buffer) {
            console.warn(chalk_1.red(`Could not read the default style file within the project ` +
                `(${chalk_1.italic(styleFilePath)})`));
            console.warn(chalk_1.red(`Please consider manually setting up the Robot font.`));
            return;
        }
        const htmlContent = buffer.toString();
        const insertion = '\n' +
            `html, body { height: 100%; }\n` +
            `body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }\n`;
        if (htmlContent.includes(insertion)) {
            return;
        }
        const recorder = host.beginUpdate(styleFilePath);
        recorder.insertLeft(htmlContent.length, insertion);
        host.commitUpdate(recorder);
    };
}
//# sourceMappingURL=setup-project.js.map