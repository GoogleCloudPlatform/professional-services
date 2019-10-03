"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular/cdk/schematics");
const config_1 = require("@schematics/angular/utility/config");
const hammerjsImportStatement = `import 'hammerjs';`;
/** Adds HammerJS to the main file of the specified Angular CLI project. */
function addHammerJsToMain(options) {
    return (host) => {
        const workspace = config_1.getWorkspace(host);
        const project = schematics_1.getProjectFromWorkspace(workspace, options.project);
        const mainFile = schematics_1.getProjectMainFile(project);
        const recorder = host.beginUpdate(mainFile);
        const buffer = host.read(mainFile);
        if (!buffer) {
            return console.error(`Could not read the project main file (${mainFile}). Please manually ` +
                `import HammerJS in your main TypeScript file.`);
        }
        const fileContent = buffer.toString('utf8');
        if (fileContent.includes(hammerjsImportStatement)) {
            return console.log(`HammerJS is already imported in the project main file (${mainFile}).`);
        }
        recorder.insertRight(0, `${hammerjsImportStatement}\n`);
        host.commitUpdate(recorder);
    };
}
exports.addHammerJsToMain = addHammerJsToMain;
//# sourceMappingURL=hammerjs-import.js.map