"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const fs_1 = require("fs");
const os = require("os");
const path = require("path");
const find_up_1 = require("./find-up");
function getSchemaLocation() {
    return path.join(__dirname, '../lib/config/schema.json');
}
exports.workspaceSchemaPath = getSchemaLocation();
const configNames = ['angular.json', '.angular.json'];
const globalFileName = '.angular-config.json';
function projectFilePath(projectPath) {
    // Find the configuration, either where specified, in the Angular CLI project
    // (if it's in node_modules) or from the current process.
    return (projectPath && find_up_1.findUp(configNames, projectPath))
        || find_up_1.findUp(configNames, process.cwd())
        || find_up_1.findUp(configNames, __dirname);
}
function globalFilePath() {
    const home = os.homedir();
    if (!home) {
        return null;
    }
    const p = path.join(home, globalFileName);
    if (fs_1.existsSync(p)) {
        return p;
    }
    return null;
}
const cachedWorkspaces = new Map();
function getWorkspace(level = 'local') {
    const cached = cachedWorkspaces.get(level);
    if (cached != undefined) {
        return cached;
    }
    const configPath = level === 'local' ? projectFilePath() : globalFilePath();
    if (!configPath) {
        cachedWorkspaces.set(level, null);
        return null;
    }
    const root = core_1.normalize(path.dirname(configPath));
    const file = core_1.normalize(path.basename(configPath));
    const workspace = new core_1.experimental.workspace.Workspace(root, new node_1.NodeJsSyncHost());
    workspace.loadWorkspaceFromHost(file).subscribe();
    cachedWorkspaces.set(level, workspace);
    return workspace;
}
exports.getWorkspace = getWorkspace;
function createGlobalSettings() {
    const home = os.homedir();
    if (!home) {
        throw new Error('No home directory found.');
    }
    const globalPath = path.join(home, globalFileName);
    fs_1.writeFileSync(globalPath, JSON.stringify({ version: 1 }));
    return globalPath;
}
exports.createGlobalSettings = createGlobalSettings;
function getWorkspaceRaw(level = 'local') {
    let configPath = level === 'local' ? projectFilePath() : globalFilePath();
    if (!configPath) {
        if (level === 'global') {
            configPath = createGlobalSettings();
        }
        else {
            return [null, null];
        }
    }
    let content = '';
    new node_1.NodeJsSyncHost().read(core_1.normalize(configPath))
        .subscribe(data => content = core_1.virtualFs.fileBufferToString(data));
    const ast = core_1.parseJsonAst(content, core_1.JsonParseMode.Loose);
    if (ast.kind != 'object') {
        throw new Error('Invalid JSON');
    }
    return [ast, configPath];
}
exports.getWorkspaceRaw = getWorkspaceRaw;
function validateWorkspace(json) {
    const workspace = new core_1.experimental.workspace.Workspace(core_1.normalize('.'), new node_1.NodeJsSyncHost());
    let error;
    workspace.loadWorkspaceFromJson(json).subscribe({
        error: e => error = e,
    });
    if (error) {
        throw error;
    }
    return true;
}
exports.validateWorkspace = validateWorkspace;
function getProjectByCwd(workspace) {
    try {
        return workspace.getProjectByPath(core_1.normalize(process.cwd()));
    }
    catch (e) {
        if (e instanceof core_1.experimental.workspace.AmbiguousProjectPathException) {
            return workspace.getDefaultProjectName();
        }
        throw e;
    }
}
exports.getProjectByCwd = getProjectByCwd;
function getPackageManager() {
    let workspace = getWorkspace('local');
    if (workspace) {
        const project = getProjectByCwd(workspace);
        if (project && workspace.getProjectCli(project)) {
            const value = workspace.getProjectCli(project)['packageManager'];
            if (typeof value == 'string') {
                return value;
            }
        }
        if (workspace.getCli()) {
            const value = workspace.getCli()['packageManager'];
            if (typeof value == 'string') {
                return value;
            }
        }
    }
    workspace = getWorkspace('global');
    if (workspace && workspace.getCli()) {
        const value = workspace.getCli()['packageManager'];
        if (typeof value == 'string') {
            return value;
        }
    }
    // Only check legacy if updated workspace is not found.
    if (!workspace) {
        const legacyPackageManager = getLegacyPackageManager();
        if (legacyPackageManager !== null) {
            return legacyPackageManager;
        }
    }
    return 'npm';
}
exports.getPackageManager = getPackageManager;
function migrateLegacyGlobalConfig() {
    const homeDir = os.homedir();
    if (homeDir) {
        const legacyGlobalConfigPath = path.join(homeDir, '.angular-cli.json');
        if (fs_1.existsSync(legacyGlobalConfigPath)) {
            const content = fs_1.readFileSync(legacyGlobalConfigPath, 'utf-8');
            const legacy = core_1.parseJson(content, core_1.JsonParseMode.Loose);
            if (!legacy || typeof legacy != 'object' || Array.isArray(legacy)) {
                return false;
            }
            const cli = {};
            if (legacy.packageManager && typeof legacy.packageManager == 'string'
                && legacy.packageManager !== 'default') {
                cli['packageManager'] = legacy.packageManager;
            }
            if (legacy.defaults && typeof legacy.defaults == 'object' && !Array.isArray(legacy.defaults)
                && legacy.defaults.schematics && typeof legacy.defaults.schematics == 'object'
                && !Array.isArray(legacy.defaults.schematics)
                && typeof legacy.defaults.schematics.collection == 'string') {
                cli['defaultCollection'] = legacy.defaults.schematics.collection;
            }
            if (legacy.warnings && typeof legacy.warnings == 'object'
                && !Array.isArray(legacy.warnings)) {
                const warnings = {};
                if (typeof legacy.warnings.versionMismatch == 'boolean') {
                    warnings['versionMismatch'] = legacy.warnings.versionMismatch;
                }
                if (typeof legacy.warnings.typescriptMismatch == 'boolean') {
                    warnings['typescriptMismatch'] = legacy.warnings.typescriptMismatch;
                }
                if (Object.getOwnPropertyNames(warnings).length > 0) {
                    cli['warnings'] = warnings;
                }
            }
            if (Object.getOwnPropertyNames(cli).length > 0) {
                const globalPath = path.join(homeDir, globalFileName);
                fs_1.writeFileSync(globalPath, JSON.stringify({ version: 1, cli }, null, 2));
                return true;
            }
        }
    }
    return false;
}
exports.migrateLegacyGlobalConfig = migrateLegacyGlobalConfig;
// Fallback, check for packageManager in config file in v1.* global config.
function getLegacyPackageManager() {
    const homeDir = os.homedir();
    if (homeDir) {
        const legacyGlobalConfigPath = path.join(homeDir, '.angular-cli.json');
        if (fs_1.existsSync(legacyGlobalConfigPath)) {
            const content = fs_1.readFileSync(legacyGlobalConfigPath, 'utf-8');
            const legacy = core_1.parseJson(content, core_1.JsonParseMode.Loose);
            if (!legacy || typeof legacy != 'object' || Array.isArray(legacy)) {
                return null;
            }
            if (legacy.packageManager && typeof legacy.packageManager === 'string'
                && legacy.packageManager !== 'default') {
                return legacy.packageManager;
            }
        }
    }
    return null;
}
function getSchematicDefaults(collection, schematic, project) {
    let result = {};
    const fullName = `${collection}:${schematic}`;
    let workspace = getWorkspace('global');
    if (workspace && workspace.getSchematics()) {
        const schematicObject = workspace.getSchematics()[fullName];
        if (schematicObject) {
            result = Object.assign({}, result, schematicObject);
        }
        const collectionObject = workspace.getSchematics()[collection];
        if (typeof collectionObject == 'object' && !Array.isArray(collectionObject)) {
            result = Object.assign({}, result, collectionObject[schematic]);
        }
    }
    workspace = getWorkspace('local');
    if (workspace) {
        if (workspace.getSchematics()) {
            const schematicObject = workspace.getSchematics()[fullName];
            if (schematicObject) {
                result = Object.assign({}, result, schematicObject);
            }
            const collectionObject = workspace.getSchematics()[collection];
            if (typeof collectionObject == 'object' && !Array.isArray(collectionObject)) {
                result = Object.assign({}, result, collectionObject[schematic]);
            }
        }
        project = project || getProjectByCwd(workspace);
        if (project && workspace.getProjectSchematics(project)) {
            const schematicObject = workspace.getProjectSchematics(project)[fullName];
            if (schematicObject) {
                result = Object.assign({}, result, schematicObject);
            }
            const collectionObject = workspace.getProjectSchematics(project)[collection];
            if (typeof collectionObject == 'object' && !Array.isArray(collectionObject)) {
                result = Object.assign({}, result, collectionObject[schematic]);
            }
        }
    }
    return result;
}
exports.getSchematicDefaults = getSchematicDefaults;
function isWarningEnabled(warning) {
    let workspace = getWorkspace('local');
    if (workspace) {
        const project = getProjectByCwd(workspace);
        if (project && workspace.getProjectCli(project)) {
            const warnings = workspace.getProjectCli(project)['warnings'];
            if (typeof warnings == 'object' && !Array.isArray(warnings)) {
                const value = warnings[warning];
                if (typeof value == 'boolean') {
                    return value;
                }
            }
        }
        if (workspace.getCli()) {
            const warnings = workspace.getCli()['warnings'];
            if (typeof warnings == 'object' && !Array.isArray(warnings)) {
                const value = warnings[warning];
                if (typeof value == 'boolean') {
                    return value;
                }
            }
        }
    }
    workspace = getWorkspace('global');
    if (workspace && workspace.getCli()) {
        const warnings = workspace.getCli()['warnings'];
        if (typeof warnings == 'object' && !Array.isArray(warnings)) {
            const value = warnings[warning];
            if (typeof value == 'boolean') {
                return value;
            }
        }
    }
    return true;
}
exports.isWarningEnabled = isWarningEnabled;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyL2NsaS91dGlsaXRpZXMvY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0NBUzhCO0FBQzlCLG9EQUEyRDtBQUMzRCwyQkFBNkQ7QUFDN0QseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3Qix1Q0FBbUM7QUFFbkMsU0FBUyxpQkFBaUI7SUFDeEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFWSxRQUFBLG1CQUFtQixHQUFHLGlCQUFpQixFQUFFLENBQUM7QUFFdkQsTUFBTSxXQUFXLEdBQUcsQ0FBRSxjQUFjLEVBQUUsZUFBZSxDQUFFLENBQUM7QUFDeEQsTUFBTSxjQUFjLEdBQUcsc0JBQXNCLENBQUM7QUFFOUMsU0FBUyxlQUFlLENBQUMsV0FBb0I7SUFDM0MsNkVBQTZFO0lBQzdFLHlEQUF5RDtJQUN6RCxPQUFPLENBQUMsV0FBVyxJQUFJLGdCQUFNLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1dBQ2pELGdCQUFNLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztXQUNsQyxnQkFBTSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRUQsU0FBUyxjQUFjO0lBQ3JCLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMxQixJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1QsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzFDLElBQUksZUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ2pCLE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUFtRCxDQUFDO0FBRXBGLFNBQWdCLFlBQVksQ0FDMUIsUUFBNEIsT0FBTztJQUVuQyxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0MsSUFBSSxNQUFNLElBQUksU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sTUFBTSxDQUFDO0tBQ2Y7SUFFRCxNQUFNLFVBQVUsR0FBRyxLQUFLLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7SUFFNUUsSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNmLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFbEMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE1BQU0sSUFBSSxHQUFHLGdCQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ2pELE1BQU0sSUFBSSxHQUFHLGdCQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ2xELE1BQU0sU0FBUyxHQUFHLElBQUksbUJBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUNwRCxJQUFJLEVBQ0osSUFBSSxxQkFBYyxFQUFFLENBQ3JCLENBQUM7SUFFRixTQUFTLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDbEQsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUV2QyxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBM0JELG9DQTJCQztBQUVELFNBQWdCLG9CQUFvQjtJQUNsQyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDMUIsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztLQUM3QztJQUVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ25ELGtCQUFhLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTFELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7QUFWRCxvREFVQztBQUVELFNBQWdCLGVBQWUsQ0FDN0IsUUFBNEIsT0FBTztJQUVuQyxJQUFJLFVBQVUsR0FBRyxLQUFLLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7SUFFMUUsSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNmLElBQUksS0FBSyxLQUFLLFFBQVEsRUFBRTtZQUN0QixVQUFVLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztTQUNyQzthQUFNO1lBQ0wsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNyQjtLQUNGO0lBRUQsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLElBQUkscUJBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzdDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxnQkFBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFbkUsTUFBTSxHQUFHLEdBQUcsbUJBQVksQ0FBQyxPQUFPLEVBQUUsb0JBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUV2RCxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksUUFBUSxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDakM7SUFFRCxPQUFPLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQzNCLENBQUM7QUF4QkQsMENBd0JDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsSUFBZ0I7SUFDaEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxtQkFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQ3BELGdCQUFTLENBQUMsR0FBRyxDQUFDLEVBQ2QsSUFBSSxxQkFBYyxFQUFFLENBQ3JCLENBQUM7SUFFRixJQUFJLEtBQUssQ0FBQztJQUNWLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDOUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLENBQUM7S0FDdEIsQ0FBQyxDQUFDO0lBRUgsSUFBSSxLQUFLLEVBQUU7UUFDVCxNQUFNLEtBQUssQ0FBQztLQUNiO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBaEJELDhDQWdCQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxTQUEyQztJQUN6RSxJQUFJO1FBQ0YsT0FBTyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsZ0JBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzdEO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixJQUFJLENBQUMsWUFBWSxtQkFBWSxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsRUFBRTtZQUNyRSxPQUFPLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1NBQzFDO1FBQ0QsTUFBTSxDQUFDLENBQUM7S0FDVDtBQUNILENBQUM7QUFURCwwQ0FTQztBQUVELFNBQWdCLGlCQUFpQjtJQUMvQixJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdEMsSUFBSSxTQUFTLEVBQUU7UUFDYixNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0MsSUFBSSxPQUFPLElBQUksU0FBUyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUMvQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDakUsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLEVBQUU7Z0JBQzVCLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7U0FDRjtRQUNELElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ3RCLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ25ELElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxFQUFFO2dCQUM1QixPQUFPLEtBQUssQ0FBQzthQUNkO1NBQ0Y7S0FDRjtJQUVELFNBQVMsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ25DLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ25ELElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxFQUFFO1lBQzVCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7S0FDRjtJQUVELHVEQUF1RDtJQUN2RCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsTUFBTSxvQkFBb0IsR0FBRyx1QkFBdUIsRUFBRSxDQUFDO1FBQ3ZELElBQUksb0JBQW9CLEtBQUssSUFBSSxFQUFFO1lBQ2pDLE9BQU8sb0JBQW9CLENBQUM7U0FDN0I7S0FDRjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQXBDRCw4Q0FvQ0M7QUFFRCxTQUFnQix5QkFBeUI7SUFDdkMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzdCLElBQUksT0FBTyxFQUFFO1FBQ1gsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3ZFLElBQUksZUFBVSxDQUFDLHNCQUFzQixDQUFDLEVBQUU7WUFDdEMsTUFBTSxPQUFPLEdBQUcsaUJBQVksQ0FBQyxzQkFBc0IsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM5RCxNQUFNLE1BQU0sR0FBRyxnQkFBUyxDQUFDLE9BQU8sRUFBRSxvQkFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxNQUFNLElBQUksUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2pFLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFFRCxNQUFNLEdBQUcsR0FBZSxFQUFFLENBQUM7WUFFM0IsSUFBSSxNQUFNLENBQUMsY0FBYyxJQUFJLE9BQU8sTUFBTSxDQUFDLGNBQWMsSUFBSSxRQUFRO21CQUM5RCxNQUFNLENBQUMsY0FBYyxLQUFLLFNBQVMsRUFBRTtnQkFDMUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQzthQUMvQztZQUVELElBQUksTUFBTSxDQUFDLFFBQVEsSUFBSSxPQUFPLE1BQU0sQ0FBQyxRQUFRLElBQUksUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO21CQUNyRixNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsSUFBSSxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxJQUFJLFFBQVE7bUJBQzNFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQzttQkFDMUMsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxVQUFVLElBQUksUUFBUSxFQUFFO2dCQUMvRCxHQUFHLENBQUMsbUJBQW1CLENBQUMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUM7YUFDbEU7WUFFRCxJQUFJLE1BQU0sQ0FBQyxRQUFRLElBQUksT0FBTyxNQUFNLENBQUMsUUFBUSxJQUFJLFFBQVE7bUJBQ2xELENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBRXRDLE1BQU0sUUFBUSxHQUFlLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxJQUFJLFNBQVMsRUFBRTtvQkFDdkQsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUM7aUJBQy9EO2dCQUNELElBQUksT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFrQixJQUFJLFNBQVMsRUFBRTtvQkFDMUQsUUFBUSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQztpQkFDckU7Z0JBRUQsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDbkQsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztpQkFDNUI7YUFDRjtZQUVELElBQUksTUFBTSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzlDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUN0RCxrQkFBYSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFeEUsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO0tBQ0Y7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFuREQsOERBbURDO0FBRUQsMkVBQTJFO0FBQzNFLFNBQVMsdUJBQXVCO0lBQzlCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixJQUFJLE9BQU8sRUFBRTtRQUNYLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUN2RSxJQUFJLGVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFO1lBQ3RDLE1BQU0sT0FBTyxHQUFHLGlCQUFZLENBQUMsc0JBQXNCLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFOUQsTUFBTSxNQUFNLEdBQUcsZ0JBQVMsQ0FBQyxPQUFPLEVBQUUsb0JBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsTUFBTSxJQUFJLE9BQU8sTUFBTSxJQUFJLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNqRSxPQUFPLElBQUksQ0FBQzthQUNiO1lBRUQsSUFBSSxNQUFNLENBQUMsY0FBYyxJQUFJLE9BQU8sTUFBTSxDQUFDLGNBQWMsS0FBSyxRQUFRO21CQUMvRCxNQUFNLENBQUMsY0FBYyxLQUFLLFNBQVMsRUFBRTtnQkFDMUMsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDO2FBQzlCO1NBQ0Y7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELFNBQWdCLG9CQUFvQixDQUNsQyxVQUFrQixFQUNsQixTQUFpQixFQUNqQixPQUF1QjtJQUV2QixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDaEIsTUFBTSxRQUFRLEdBQUcsR0FBRyxVQUFVLElBQUksU0FBUyxFQUFFLENBQUM7SUFFOUMsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZDLElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxhQUFhLEVBQUUsRUFBRTtRQUMxQyxNQUFNLGVBQWUsR0FBRyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUQsSUFBSSxlQUFlLEVBQUU7WUFDbkIsTUFBTSxxQkFBUSxNQUFNLEVBQU0sZUFBc0IsQ0FBRSxDQUFDO1NBQ3BEO1FBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0QsSUFBSSxPQUFPLGdCQUFnQixJQUFJLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtZQUMzRSxNQUFNLHFCQUFRLE1BQU0sRUFBTSxnQkFBZ0IsQ0FBQyxTQUFTLENBQVEsQ0FBRSxDQUFDO1NBQ2hFO0tBRUY7SUFFRCxTQUFTLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWxDLElBQUksU0FBUyxFQUFFO1FBQ2IsSUFBSSxTQUFTLENBQUMsYUFBYSxFQUFFLEVBQUU7WUFDN0IsTUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVELElBQUksZUFBZSxFQUFFO2dCQUNuQixNQUFNLHFCQUFRLE1BQU0sRUFBTSxlQUFzQixDQUFFLENBQUM7YUFDcEQ7WUFDRCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvRCxJQUFJLE9BQU8sZ0JBQWdCLElBQUksUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUMzRSxNQUFNLHFCQUFRLE1BQU0sRUFBTSxnQkFBZ0IsQ0FBQyxTQUFTLENBQVEsQ0FBRSxDQUFDO2FBQ2hFO1NBQ0Y7UUFFRCxPQUFPLEdBQUcsT0FBTyxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoRCxJQUFJLE9BQU8sSUFBSSxTQUFTLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDdEQsTUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFFLElBQUksZUFBZSxFQUFFO2dCQUNuQixNQUFNLHFCQUFRLE1BQU0sRUFBTSxlQUFzQixDQUFFLENBQUM7YUFDcEQ7WUFDRCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3RSxJQUFJLE9BQU8sZ0JBQWdCLElBQUksUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUMzRSxNQUFNLHFCQUFRLE1BQU0sRUFBTSxnQkFBZ0IsQ0FBQyxTQUFTLENBQVEsQ0FBRSxDQUFDO2FBQ2hFO1NBQ0Y7S0FDRjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFqREQsb0RBaURDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBZTtJQUM5QyxJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdEMsSUFBSSxTQUFTLEVBQUU7UUFDYixNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0MsSUFBSSxPQUFPLElBQUksU0FBUyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUMvQyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzlELElBQUksT0FBTyxRQUFRLElBQUksUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDM0QsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLE9BQU8sS0FBSyxJQUFJLFNBQVMsRUFBRTtvQkFDN0IsT0FBTyxLQUFLLENBQUM7aUJBQ2Q7YUFDRjtTQUNGO1FBQ0QsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDdEIsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2hELElBQUksT0FBTyxRQUFRLElBQUksUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDM0QsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLE9BQU8sS0FBSyxJQUFJLFNBQVMsRUFBRTtvQkFDN0IsT0FBTyxLQUFLLENBQUM7aUJBQ2Q7YUFDRjtTQUNGO0tBQ0Y7SUFFRCxTQUFTLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUNuQyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDaEQsSUFBSSxPQUFPLFFBQVEsSUFBSSxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzNELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNoQyxJQUFJLE9BQU8sS0FBSyxJQUFJLFNBQVMsRUFBRTtnQkFDN0IsT0FBTyxLQUFLLENBQUM7YUFDZDtTQUNGO0tBQ0Y7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFyQ0QsNENBcUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBKc29uQXN0T2JqZWN0LFxuICBKc29uT2JqZWN0LFxuICBKc29uUGFyc2VNb2RlLFxuICBleHBlcmltZW50YWwsXG4gIG5vcm1hbGl6ZSxcbiAgcGFyc2VKc29uLFxuICBwYXJzZUpzb25Bc3QsXG4gIHZpcnR1YWxGcyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTm9kZUpzU3luY0hvc3QgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYywgd3JpdGVGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIG9zIGZyb20gJ29zJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaW5kVXAgfSBmcm9tICcuL2ZpbmQtdXAnO1xuXG5mdW5jdGlvbiBnZXRTY2hlbWFMb2NhdGlvbigpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2xpYi9jb25maWcvc2NoZW1hLmpzb24nKTtcbn1cblxuZXhwb3J0IGNvbnN0IHdvcmtzcGFjZVNjaGVtYVBhdGggPSBnZXRTY2hlbWFMb2NhdGlvbigpO1xuXG5jb25zdCBjb25maWdOYW1lcyA9IFsgJ2FuZ3VsYXIuanNvbicsICcuYW5ndWxhci5qc29uJyBdO1xuY29uc3QgZ2xvYmFsRmlsZU5hbWUgPSAnLmFuZ3VsYXItY29uZmlnLmpzb24nO1xuXG5mdW5jdGlvbiBwcm9qZWN0RmlsZVBhdGgocHJvamVjdFBhdGg/OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gRmluZCB0aGUgY29uZmlndXJhdGlvbiwgZWl0aGVyIHdoZXJlIHNwZWNpZmllZCwgaW4gdGhlIEFuZ3VsYXIgQ0xJIHByb2plY3RcbiAgLy8gKGlmIGl0J3MgaW4gbm9kZV9tb2R1bGVzKSBvciBmcm9tIHRoZSBjdXJyZW50IHByb2Nlc3MuXG4gIHJldHVybiAocHJvamVjdFBhdGggJiYgZmluZFVwKGNvbmZpZ05hbWVzLCBwcm9qZWN0UGF0aCkpXG4gICAgICB8fCBmaW5kVXAoY29uZmlnTmFtZXMsIHByb2Nlc3MuY3dkKCkpXG4gICAgICB8fCBmaW5kVXAoY29uZmlnTmFtZXMsIF9fZGlybmFtZSk7XG59XG5cbmZ1bmN0aW9uIGdsb2JhbEZpbGVQYXRoKCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBob21lID0gb3MuaG9tZWRpcigpO1xuICBpZiAoIWhvbWUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHAgPSBwYXRoLmpvaW4oaG9tZSwgZ2xvYmFsRmlsZU5hbWUpO1xuICBpZiAoZXhpc3RzU3luYyhwKSkge1xuICAgIHJldHVybiBwO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNvbnN0IGNhY2hlZFdvcmtzcGFjZXMgPSBuZXcgTWFwPHN0cmluZywgZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2UgfCBudWxsPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V29ya3NwYWNlKFxuICBsZXZlbDogJ2xvY2FsJyB8ICdnbG9iYWwnID0gJ2xvY2FsJyxcbik6IGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlIHwgbnVsbCB7XG4gIGNvbnN0IGNhY2hlZCA9IGNhY2hlZFdvcmtzcGFjZXMuZ2V0KGxldmVsKTtcbiAgaWYgKGNhY2hlZCAhPSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gY2FjaGVkO1xuICB9XG5cbiAgY29uc3QgY29uZmlnUGF0aCA9IGxldmVsID09PSAnbG9jYWwnID8gcHJvamVjdEZpbGVQYXRoKCkgOiBnbG9iYWxGaWxlUGF0aCgpO1xuXG4gIGlmICghY29uZmlnUGF0aCkge1xuICAgIGNhY2hlZFdvcmtzcGFjZXMuc2V0KGxldmVsLCBudWxsKTtcblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZShwYXRoLmRpcm5hbWUoY29uZmlnUGF0aCkpO1xuICBjb25zdCBmaWxlID0gbm9ybWFsaXplKHBhdGguYmFzZW5hbWUoY29uZmlnUGF0aCkpO1xuICBjb25zdCB3b3Jrc3BhY2UgPSBuZXcgZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2UoXG4gICAgcm9vdCxcbiAgICBuZXcgTm9kZUpzU3luY0hvc3QoKSxcbiAgKTtcblxuICB3b3Jrc3BhY2UubG9hZFdvcmtzcGFjZUZyb21Ib3N0KGZpbGUpLnN1YnNjcmliZSgpO1xuICBjYWNoZWRXb3Jrc3BhY2VzLnNldChsZXZlbCwgd29ya3NwYWNlKTtcblxuICByZXR1cm4gd29ya3NwYWNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlR2xvYmFsU2V0dGluZ3MoKTogc3RyaW5nIHtcbiAgY29uc3QgaG9tZSA9IG9zLmhvbWVkaXIoKTtcbiAgaWYgKCFob21lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBob21lIGRpcmVjdG9yeSBmb3VuZC4nKTtcbiAgfVxuXG4gIGNvbnN0IGdsb2JhbFBhdGggPSBwYXRoLmpvaW4oaG9tZSwgZ2xvYmFsRmlsZU5hbWUpO1xuICB3cml0ZUZpbGVTeW5jKGdsb2JhbFBhdGgsIEpTT04uc3RyaW5naWZ5KHsgdmVyc2lvbjogMSB9KSk7XG5cbiAgcmV0dXJuIGdsb2JhbFBhdGg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3Jrc3BhY2VSYXcoXG4gIGxldmVsOiAnbG9jYWwnIHwgJ2dsb2JhbCcgPSAnbG9jYWwnLFxuKTogW0pzb25Bc3RPYmplY3QgfCBudWxsLCBzdHJpbmcgfCBudWxsXSB7XG4gIGxldCBjb25maWdQYXRoID0gbGV2ZWwgPT09ICdsb2NhbCcgPyBwcm9qZWN0RmlsZVBhdGgoKSA6IGdsb2JhbEZpbGVQYXRoKCk7XG5cbiAgaWYgKCFjb25maWdQYXRoKSB7XG4gICAgaWYgKGxldmVsID09PSAnZ2xvYmFsJykge1xuICAgICAgY29uZmlnUGF0aCA9IGNyZWF0ZUdsb2JhbFNldHRpbmdzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbbnVsbCwgbnVsbF07XG4gICAgfVxuICB9XG5cbiAgbGV0IGNvbnRlbnQgPSAnJztcbiAgbmV3IE5vZGVKc1N5bmNIb3N0KCkucmVhZChub3JtYWxpemUoY29uZmlnUGF0aCkpXG4gICAgLnN1YnNjcmliZShkYXRhID0+IGNvbnRlbnQgPSB2aXJ0dWFsRnMuZmlsZUJ1ZmZlclRvU3RyaW5nKGRhdGEpKTtcblxuICBjb25zdCBhc3QgPSBwYXJzZUpzb25Bc3QoY29udGVudCwgSnNvblBhcnNlTW9kZS5Mb29zZSk7XG5cbiAgaWYgKGFzdC5raW5kICE9ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEpTT04nKTtcbiAgfVxuXG4gIHJldHVybiBbYXN0LCBjb25maWdQYXRoXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlV29ya3NwYWNlKGpzb246IEpzb25PYmplY3QpIHtcbiAgY29uc3Qgd29ya3NwYWNlID0gbmV3IGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlKFxuICAgIG5vcm1hbGl6ZSgnLicpLFxuICAgIG5ldyBOb2RlSnNTeW5jSG9zdCgpLFxuICApO1xuXG4gIGxldCBlcnJvcjtcbiAgd29ya3NwYWNlLmxvYWRXb3Jrc3BhY2VGcm9tSnNvbihqc29uKS5zdWJzY3JpYmUoe1xuICAgIGVycm9yOiBlID0+IGVycm9yID0gZSxcbiAgfSk7XG5cbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RCeUN3ZCh3b3Jrc3BhY2U6IGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlKTogc3RyaW5nIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHdvcmtzcGFjZS5nZXRQcm9qZWN0QnlQYXRoKG5vcm1hbGl6ZShwcm9jZXNzLmN3ZCgpKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuQW1iaWd1b3VzUHJvamVjdFBhdGhFeGNlcHRpb24pIHtcbiAgICAgIHJldHVybiB3b3Jrc3BhY2UuZ2V0RGVmYXVsdFByb2plY3ROYW1lKCk7XG4gICAgfVxuICAgIHRocm93IGU7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhY2thZ2VNYW5hZ2VyKCk6IHN0cmluZyB7XG4gIGxldCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoJ2xvY2FsJyk7XG5cbiAgaWYgKHdvcmtzcGFjZSkge1xuICAgIGNvbnN0IHByb2plY3QgPSBnZXRQcm9qZWN0QnlDd2Qod29ya3NwYWNlKTtcbiAgICBpZiAocHJvamVjdCAmJiB3b3Jrc3BhY2UuZ2V0UHJvamVjdENsaShwcm9qZWN0KSkge1xuICAgICAgY29uc3QgdmFsdWUgPSB3b3Jrc3BhY2UuZ2V0UHJvamVjdENsaShwcm9qZWN0KVsncGFja2FnZU1hbmFnZXInXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAod29ya3NwYWNlLmdldENsaSgpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHdvcmtzcGFjZS5nZXRDbGkoKVsncGFja2FnZU1hbmFnZXInXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnZ2xvYmFsJyk7XG4gIGlmICh3b3Jrc3BhY2UgJiYgd29ya3NwYWNlLmdldENsaSgpKSB7XG4gICAgY29uc3QgdmFsdWUgPSB3b3Jrc3BhY2UuZ2V0Q2xpKClbJ3BhY2thZ2VNYW5hZ2VyJ107XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIE9ubHkgY2hlY2sgbGVnYWN5IGlmIHVwZGF0ZWQgd29ya3NwYWNlIGlzIG5vdCBmb3VuZC5cbiAgaWYgKCF3b3Jrc3BhY2UpIHtcbiAgICBjb25zdCBsZWdhY3lQYWNrYWdlTWFuYWdlciA9IGdldExlZ2FjeVBhY2thZ2VNYW5hZ2VyKCk7XG4gICAgaWYgKGxlZ2FjeVBhY2thZ2VNYW5hZ2VyICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbGVnYWN5UGFja2FnZU1hbmFnZXI7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuICducG0nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWlncmF0ZUxlZ2FjeUdsb2JhbENvbmZpZygpOiBib29sZWFuIHtcbiAgY29uc3QgaG9tZURpciA9IG9zLmhvbWVkaXIoKTtcbiAgaWYgKGhvbWVEaXIpIHtcbiAgICBjb25zdCBsZWdhY3lHbG9iYWxDb25maWdQYXRoID0gcGF0aC5qb2luKGhvbWVEaXIsICcuYW5ndWxhci1jbGkuanNvbicpO1xuICAgIGlmIChleGlzdHNTeW5jKGxlZ2FjeUdsb2JhbENvbmZpZ1BhdGgpKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGxlZ2FjeUdsb2JhbENvbmZpZ1BhdGgsICd1dGYtOCcpO1xuICAgICAgY29uc3QgbGVnYWN5ID0gcGFyc2VKc29uKGNvbnRlbnQsIEpzb25QYXJzZU1vZGUuTG9vc2UpO1xuICAgICAgaWYgKCFsZWdhY3kgfHwgdHlwZW9mIGxlZ2FjeSAhPSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGxlZ2FjeSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjbGk6IEpzb25PYmplY3QgPSB7fTtcblxuICAgICAgaWYgKGxlZ2FjeS5wYWNrYWdlTWFuYWdlciAmJiB0eXBlb2YgbGVnYWN5LnBhY2thZ2VNYW5hZ2VyID09ICdzdHJpbmcnXG4gICAgICAgICAgJiYgbGVnYWN5LnBhY2thZ2VNYW5hZ2VyICE9PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgY2xpWydwYWNrYWdlTWFuYWdlciddID0gbGVnYWN5LnBhY2thZ2VNYW5hZ2VyO1xuICAgICAgfVxuXG4gICAgICBpZiAobGVnYWN5LmRlZmF1bHRzICYmIHR5cGVvZiBsZWdhY3kuZGVmYXVsdHMgPT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkobGVnYWN5LmRlZmF1bHRzKVxuICAgICAgICAgICYmIGxlZ2FjeS5kZWZhdWx0cy5zY2hlbWF0aWNzICYmIHR5cGVvZiBsZWdhY3kuZGVmYXVsdHMuc2NoZW1hdGljcyA9PSAnb2JqZWN0J1xuICAgICAgICAgICYmICFBcnJheS5pc0FycmF5KGxlZ2FjeS5kZWZhdWx0cy5zY2hlbWF0aWNzKVxuICAgICAgICAgICYmIHR5cGVvZiBsZWdhY3kuZGVmYXVsdHMuc2NoZW1hdGljcy5jb2xsZWN0aW9uID09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNsaVsnZGVmYXVsdENvbGxlY3Rpb24nXSA9IGxlZ2FjeS5kZWZhdWx0cy5zY2hlbWF0aWNzLmNvbGxlY3Rpb247XG4gICAgICB9XG5cbiAgICAgIGlmIChsZWdhY3kud2FybmluZ3MgJiYgdHlwZW9mIGxlZ2FjeS53YXJuaW5ncyA9PSAnb2JqZWN0J1xuICAgICAgICAgICYmICFBcnJheS5pc0FycmF5KGxlZ2FjeS53YXJuaW5ncykpIHtcblxuICAgICAgICBjb25zdCB3YXJuaW5nczogSnNvbk9iamVjdCA9IHt9O1xuICAgICAgICBpZiAodHlwZW9mIGxlZ2FjeS53YXJuaW5ncy52ZXJzaW9uTWlzbWF0Y2ggPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgd2FybmluZ3NbJ3ZlcnNpb25NaXNtYXRjaCddID0gbGVnYWN5Lndhcm5pbmdzLnZlcnNpb25NaXNtYXRjaDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGxlZ2FjeS53YXJuaW5ncy50eXBlc2NyaXB0TWlzbWF0Y2ggPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgd2FybmluZ3NbJ3R5cGVzY3JpcHRNaXNtYXRjaCddID0gbGVnYWN5Lndhcm5pbmdzLnR5cGVzY3JpcHRNaXNtYXRjaDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh3YXJuaW5ncykubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNsaVsnd2FybmluZ3MnXSA9IHdhcm5pbmdzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjbGkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgZ2xvYmFsUGF0aCA9IHBhdGguam9pbihob21lRGlyLCBnbG9iYWxGaWxlTmFtZSk7XG4gICAgICAgIHdyaXRlRmlsZVN5bmMoZ2xvYmFsUGF0aCwgSlNPTi5zdHJpbmdpZnkoeyB2ZXJzaW9uOiAxLCBjbGkgfSwgbnVsbCwgMikpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gRmFsbGJhY2ssIGNoZWNrIGZvciBwYWNrYWdlTWFuYWdlciBpbiBjb25maWcgZmlsZSBpbiB2MS4qIGdsb2JhbCBjb25maWcuXG5mdW5jdGlvbiBnZXRMZWdhY3lQYWNrYWdlTWFuYWdlcigpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgaG9tZURpciA9IG9zLmhvbWVkaXIoKTtcbiAgaWYgKGhvbWVEaXIpIHtcbiAgICBjb25zdCBsZWdhY3lHbG9iYWxDb25maWdQYXRoID0gcGF0aC5qb2luKGhvbWVEaXIsICcuYW5ndWxhci1jbGkuanNvbicpO1xuICAgIGlmIChleGlzdHNTeW5jKGxlZ2FjeUdsb2JhbENvbmZpZ1BhdGgpKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGxlZ2FjeUdsb2JhbENvbmZpZ1BhdGgsICd1dGYtOCcpO1xuXG4gICAgICBjb25zdCBsZWdhY3kgPSBwYXJzZUpzb24oY29udGVudCwgSnNvblBhcnNlTW9kZS5Mb29zZSk7XG4gICAgICBpZiAoIWxlZ2FjeSB8fCB0eXBlb2YgbGVnYWN5ICE9ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkobGVnYWN5KSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGxlZ2FjeS5wYWNrYWdlTWFuYWdlciAmJiB0eXBlb2YgbGVnYWN5LnBhY2thZ2VNYW5hZ2VyID09PSAnc3RyaW5nJ1xuICAgICAgICAgICYmIGxlZ2FjeS5wYWNrYWdlTWFuYWdlciAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgIHJldHVybiBsZWdhY3kucGFja2FnZU1hbmFnZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTY2hlbWF0aWNEZWZhdWx0cyhcbiAgY29sbGVjdGlvbjogc3RyaW5nLFxuICBzY2hlbWF0aWM6IHN0cmluZyxcbiAgcHJvamVjdD86IHN0cmluZyB8IG51bGwsXG4pOiB7fSB7XG4gIGxldCByZXN1bHQgPSB7fTtcbiAgY29uc3QgZnVsbE5hbWUgPSBgJHtjb2xsZWN0aW9ufToke3NjaGVtYXRpY31gO1xuXG4gIGxldCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoJ2dsb2JhbCcpO1xuICBpZiAod29ya3NwYWNlICYmIHdvcmtzcGFjZS5nZXRTY2hlbWF0aWNzKCkpIHtcbiAgICBjb25zdCBzY2hlbWF0aWNPYmplY3QgPSB3b3Jrc3BhY2UuZ2V0U2NoZW1hdGljcygpW2Z1bGxOYW1lXTtcbiAgICBpZiAoc2NoZW1hdGljT2JqZWN0KSB7XG4gICAgICByZXN1bHQgPSB7IC4uLnJlc3VsdCwgLi4uKHNjaGVtYXRpY09iamVjdCBhcyB7fSkgfTtcbiAgICB9XG4gICAgY29uc3QgY29sbGVjdGlvbk9iamVjdCA9IHdvcmtzcGFjZS5nZXRTY2hlbWF0aWNzKClbY29sbGVjdGlvbl07XG4gICAgaWYgKHR5cGVvZiBjb2xsZWN0aW9uT2JqZWN0ID09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGNvbGxlY3Rpb25PYmplY3QpKSB7XG4gICAgICByZXN1bHQgPSB7IC4uLnJlc3VsdCwgLi4uKGNvbGxlY3Rpb25PYmplY3Rbc2NoZW1hdGljXSBhcyB7fSkgfTtcbiAgICB9XG5cbiAgfVxuXG4gIHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnbG9jYWwnKTtcblxuICBpZiAod29ya3NwYWNlKSB7XG4gICAgaWYgKHdvcmtzcGFjZS5nZXRTY2hlbWF0aWNzKCkpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY09iamVjdCA9IHdvcmtzcGFjZS5nZXRTY2hlbWF0aWNzKClbZnVsbE5hbWVdO1xuICAgICAgaWYgKHNjaGVtYXRpY09iamVjdCkge1xuICAgICAgICByZXN1bHQgPSB7IC4uLnJlc3VsdCwgLi4uKHNjaGVtYXRpY09iamVjdCBhcyB7fSkgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNvbGxlY3Rpb25PYmplY3QgPSB3b3Jrc3BhY2UuZ2V0U2NoZW1hdGljcygpW2NvbGxlY3Rpb25dO1xuICAgICAgaWYgKHR5cGVvZiBjb2xsZWN0aW9uT2JqZWN0ID09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGNvbGxlY3Rpb25PYmplY3QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oY29sbGVjdGlvbk9iamVjdFtzY2hlbWF0aWNdIGFzIHt9KSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHByb2plY3QgPSBwcm9qZWN0IHx8IGdldFByb2plY3RCeUN3ZCh3b3Jrc3BhY2UpO1xuICAgIGlmIChwcm9qZWN0ICYmIHdvcmtzcGFjZS5nZXRQcm9qZWN0U2NoZW1hdGljcyhwcm9qZWN0KSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljT2JqZWN0ID0gd29ya3NwYWNlLmdldFByb2plY3RTY2hlbWF0aWNzKHByb2plY3QpW2Z1bGxOYW1lXTtcbiAgICAgIGlmIChzY2hlbWF0aWNPYmplY3QpIHtcbiAgICAgICAgcmVzdWx0ID0geyAuLi5yZXN1bHQsIC4uLihzY2hlbWF0aWNPYmplY3QgYXMge30pIH07XG4gICAgICB9XG4gICAgICBjb25zdCBjb2xsZWN0aW9uT2JqZWN0ID0gd29ya3NwYWNlLmdldFByb2plY3RTY2hlbWF0aWNzKHByb2plY3QpW2NvbGxlY3Rpb25dO1xuICAgICAgaWYgKHR5cGVvZiBjb2xsZWN0aW9uT2JqZWN0ID09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGNvbGxlY3Rpb25PYmplY3QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oY29sbGVjdGlvbk9iamVjdFtzY2hlbWF0aWNdIGFzIHt9KSB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1dhcm5pbmdFbmFibGVkKHdhcm5pbmc6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBsZXQgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKCdsb2NhbCcpO1xuXG4gIGlmICh3b3Jrc3BhY2UpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gZ2V0UHJvamVjdEJ5Q3dkKHdvcmtzcGFjZSk7XG4gICAgaWYgKHByb2plY3QgJiYgd29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdCkpIHtcbiAgICAgIGNvbnN0IHdhcm5pbmdzID0gd29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdClbJ3dhcm5pbmdzJ107XG4gICAgICBpZiAodHlwZW9mIHdhcm5pbmdzID09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHdhcm5pbmdzKSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHdhcm5pbmdzW3dhcm5pbmddO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAod29ya3NwYWNlLmdldENsaSgpKSB7XG4gICAgICBjb25zdCB3YXJuaW5ncyA9IHdvcmtzcGFjZS5nZXRDbGkoKVsnd2FybmluZ3MnXTtcbiAgICAgIGlmICh0eXBlb2Ygd2FybmluZ3MgPT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkod2FybmluZ3MpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gd2FybmluZ3Nbd2FybmluZ107XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKCdnbG9iYWwnKTtcbiAgaWYgKHdvcmtzcGFjZSAmJiB3b3Jrc3BhY2UuZ2V0Q2xpKCkpIHtcbiAgICBjb25zdCB3YXJuaW5ncyA9IHdvcmtzcGFjZS5nZXRDbGkoKVsnd2FybmluZ3MnXTtcbiAgICBpZiAodHlwZW9mIHdhcm5pbmdzID09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHdhcm5pbmdzKSkge1xuICAgICAgY29uc3QgdmFsdWUgPSB3YXJuaW5nc1t3YXJuaW5nXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cbiJdfQ==