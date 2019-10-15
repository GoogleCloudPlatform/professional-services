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
const ast_utils_1 = require("@schematics/angular/utility/ast-utils");
const change_1 = require("@schematics/angular/utility/change");
const config_1 = require("@schematics/angular/utility/config");
const find_module_1 = require("@schematics/angular/utility/find-module");
const ng_ast_utils_1 = require("@schematics/angular/utility/ng-ast-utils");
const project_main_file_1 = require("./project-main-file");
const version_agnostic_typescript_1 = require("./version-agnostic-typescript");
/** Reads file given path and returns TypeScript source file. */
function getSourceFile(host, path) {
    const buffer = host.read(path);
    if (!buffer) {
        throw new schematics_1.SchematicsException(`Could not find file for path: ${path}`);
    }
    const content = buffer.toString();
    return version_agnostic_typescript_1.ts.createSourceFile(path, content, version_agnostic_typescript_1.ts.ScriptTarget.Latest, true);
}
exports.getSourceFile = getSourceFile;
/** Import and add module to root app module. */
function addModuleImportToRootModule(host, moduleName, src, project) {
    const modulePath = ng_ast_utils_1.getAppModulePath(host, project_main_file_1.getProjectMainFile(project));
    addModuleImportToModule(host, modulePath, moduleName, src);
}
exports.addModuleImportToRootModule = addModuleImportToRootModule;
/**
 * Import and add module to specific module path.
 * @param host the tree we are updating
 * @param modulePath src location of the module to import
 * @param moduleName name of module to import
 * @param src src location to import
 */
function addModuleImportToModule(host, modulePath, moduleName, src) {
    const moduleSource = getSourceFile(host, modulePath);
    if (!moduleSource) {
        throw new schematics_1.SchematicsException(`Module not found: ${modulePath}`);
    }
    const changes = ast_utils_1.addImportToModule(moduleSource, modulePath, moduleName, src);
    const recorder = host.beginUpdate(modulePath);
    changes.forEach((change) => {
        if (change instanceof change_1.InsertChange) {
            recorder.insertLeft(change.pos, change.toAdd);
        }
    });
    host.commitUpdate(recorder);
}
exports.addModuleImportToModule = addModuleImportToModule;
/** Wraps the internal find module from options with undefined path handling  */
function findModuleFromOptions(host, options) {
    const workspace = config_1.getWorkspace(host);
    if (!options.project) {
        options.project = Object.keys(workspace.projects)[0];
    }
    const project = workspace.projects[options.project];
    if (options.path === undefined) {
        options.path = `/${project.root}/src/app`;
    }
    return find_module_1.findModuleFromOptions(host, options);
}
exports.findModuleFromOptions = findModuleFromOptions;
//# sourceMappingURL=ast.js.map