"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const exception_1 = require("../exception");
const json_1 = require("../json");
const virtual_fs_1 = require("../virtual-fs");
class ProjectNotFoundException extends exception_1.BaseException {
    constructor(name) {
        super(`Project '${name}' could not be found in workspace.`);
    }
}
exports.ProjectNotFoundException = ProjectNotFoundException;
class WorkspaceToolNotFoundException extends exception_1.BaseException {
    constructor(name) {
        super(`Tool ${name} could not be found in workspace.`);
    }
}
exports.WorkspaceToolNotFoundException = WorkspaceToolNotFoundException;
class ProjectToolNotFoundException extends exception_1.BaseException {
    constructor(name) {
        super(`Tool ${name} could not be found in project.`);
    }
}
exports.ProjectToolNotFoundException = ProjectToolNotFoundException;
class WorkspaceNotYetLoadedException extends exception_1.BaseException {
    constructor() { super(`Workspace needs to be loaded before it is used.`); }
}
exports.WorkspaceNotYetLoadedException = WorkspaceNotYetLoadedException;
class AmbiguousProjectPathException extends exception_1.BaseException {
    constructor(path, projects) {
        super(`Current active project is ambiguous (${projects.join(',')}) using path: '${path}'`);
        this.path = path;
        this.projects = projects;
    }
}
exports.AmbiguousProjectPathException = AmbiguousProjectPathException;
class Workspace {
    constructor(_root, _host) {
        this._root = _root;
        this._host = _host;
        this._workspaceSchemaPath = virtual_fs_1.normalize(require.resolve('./workspace-schema.json'));
        this._registry = new json_1.schema.CoreSchemaRegistry();
        this._registry.addPostTransform(json_1.schema.transforms.addUndefinedDefaults);
    }
    loadWorkspaceFromJson(json) {
        return this._loadWorkspaceSchema().pipe(operators_1.concatMap((workspaceSchema) => this.validateAgainstSchema(json, workspaceSchema)), operators_1.tap((validatedWorkspace) => this._workspace = validatedWorkspace), operators_1.map(() => this));
    }
    loadWorkspaceFromHost(workspacePath) {
        return this._loadWorkspaceSchema().pipe(operators_1.concatMap(() => this._loadJsonFile(virtual_fs_1.join(this._root, workspacePath))), operators_1.concatMap(json => this.loadWorkspaceFromJson(json)));
    }
    _loadWorkspaceSchema() {
        if (this._workspaceSchema) {
            return rxjs_1.of(this._workspaceSchema);
        }
        else {
            return this._loadJsonFile(this._workspaceSchemaPath).pipe(operators_1.tap((workspaceSchema) => this._workspaceSchema = workspaceSchema));
        }
    }
    _assertLoaded() {
        if (!this._workspace) {
            throw new WorkspaceNotYetLoadedException();
        }
    }
    get root() {
        return this._root;
    }
    get host() {
        return this._host;
    }
    get version() {
        this._assertLoaded();
        return this._workspace.version;
    }
    get newProjectRoot() {
        this._assertLoaded();
        return this._workspace.newProjectRoot;
    }
    listProjectNames() {
        return Object.keys(this._workspace.projects);
    }
    getProject(projectName) {
        this._assertLoaded();
        const workspaceProject = this._workspace.projects[projectName];
        if (!workspaceProject) {
            throw new ProjectNotFoundException(projectName);
        }
        // Return only the project properties, and remove the tools.
        const workspaceProjectClone = Object.assign({}, workspaceProject);
        delete workspaceProjectClone['cli'];
        delete workspaceProjectClone['schematics'];
        delete workspaceProjectClone['architect'];
        delete workspaceProjectClone['targets'];
        return workspaceProjectClone;
    }
    getDefaultProjectName() {
        this._assertLoaded();
        if (this._workspace.defaultProject) {
            // If there is a default project name, return it.
            return this._workspace.defaultProject;
        }
        else if (this.listProjectNames().length === 1) {
            // If there is only one project, return that one.
            return this.listProjectNames()[0];
        }
        // Otherwise return null.
        return null;
    }
    getProjectByPath(path) {
        this._assertLoaded();
        const projectNames = this.listProjectNames();
        if (projectNames.length === 1) {
            return projectNames[0];
        }
        const isInside = (base, potential) => {
            const absoluteBase = virtual_fs_1.resolve(this.root, base);
            const absolutePotential = virtual_fs_1.resolve(this.root, potential);
            const relativePotential = virtual_fs_1.relative(absoluteBase, absolutePotential);
            if (!relativePotential.startsWith('..') && !virtual_fs_1.isAbsolute(relativePotential)) {
                return true;
            }
            return false;
        };
        const projects = this.listProjectNames()
            .map(name => [this.getProject(name).root, name])
            .filter(tuple => isInside(tuple[0], path))
            // Sort tuples by depth, with the deeper ones first. Since the first member is a path and
            // we filtered all invalid paths, the longest will be the deepest (and in case of equality
            // the sort is stable and the first declared project will win).
            .sort((a, b) => b[0].length - a[0].length);
        if (projects.length === 0) {
            return null;
        }
        else if (projects.length > 1) {
            const found = new Set();
            const sameRoots = projects.filter(v => {
                if (!found.has(v[0])) {
                    found.add(v[0]);
                    return false;
                }
                return true;
            });
            if (sameRoots.length > 0) {
                throw new AmbiguousProjectPathException(path, sameRoots.map(v => v[1]));
            }
        }
        return projects[0][1];
    }
    getCli() {
        return this._getTool('cli');
    }
    getSchematics() {
        return this._getTool('schematics');
    }
    getTargets() {
        return this._getTool('targets');
    }
    getProjectCli(projectName) {
        return this._getProjectTool(projectName, 'cli');
    }
    getProjectSchematics(projectName) {
        return this._getProjectTool(projectName, 'schematics');
    }
    getProjectTargets(projectName) {
        return this._getProjectTool(projectName, 'targets');
    }
    _getTool(toolName) {
        this._assertLoaded();
        let workspaceTool = this._workspace[toolName];
        // Try falling back to 'architect' if 'targets' is not there or is empty.
        if ((!workspaceTool || Object.keys(workspaceTool).length === 0)
            && toolName === 'targets'
            && this._workspace['architect']) {
            workspaceTool = this._workspace['architect'];
        }
        if (!workspaceTool) {
            throw new WorkspaceToolNotFoundException(toolName);
        }
        return workspaceTool;
    }
    _getProjectTool(projectName, toolName) {
        this._assertLoaded();
        const workspaceProject = this._workspace.projects[projectName];
        if (!workspaceProject) {
            throw new ProjectNotFoundException(projectName);
        }
        let projectTool = workspaceProject[toolName];
        // Try falling back to 'architect' if 'targets' is not there or is empty.
        if ((!projectTool || Object.keys(projectTool).length === 0)
            && workspaceProject['architect']
            && toolName === 'targets') {
            projectTool = workspaceProject['architect'];
        }
        if (!projectTool) {
            throw new ProjectToolNotFoundException(toolName);
        }
        return projectTool;
    }
    // TODO: add transforms to resolve paths.
    validateAgainstSchema(contentJson, schemaJson) {
        // JSON validation modifies the content, so we validate a copy of it instead.
        const contentJsonCopy = JSON.parse(JSON.stringify(contentJson));
        return this._registry.compile(schemaJson).pipe(operators_1.concatMap(validator => validator(contentJsonCopy)), operators_1.concatMap(validatorResult => {
            if (validatorResult.success) {
                return rxjs_1.of(contentJsonCopy);
            }
            else {
                return rxjs_1.throwError(new json_1.schema.SchemaValidationException(validatorResult.errors));
            }
        }));
    }
    _loadJsonFile(path) {
        return this._host.read(virtual_fs_1.normalize(path)).pipe(operators_1.map(buffer => virtual_fs_1.virtualFs.fileBufferToString(buffer)), operators_1.map(str => json_1.parseJson(str, json_1.JsonParseMode.Loose)));
    }
}
exports.Workspace = Workspace;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy93b3Jrc3BhY2Uvd29ya3NwYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQWtEO0FBQ2xELDhDQUFxRDtBQUNyRCw0Q0FBNkM7QUFDN0Msa0NBS2lCO0FBQ2pCLDhDQVF1QjtBQUl2QixNQUFhLHdCQUF5QixTQUFRLHlCQUFhO0lBQ3pELFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsWUFBWSxJQUFJLG9DQUFvQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztDQUNGO0FBSkQsNERBSUM7QUFFRCxNQUFhLDhCQUErQixTQUFRLHlCQUFhO0lBQy9ELFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsUUFBUSxJQUFJLG1DQUFtQyxDQUFDLENBQUM7SUFDekQsQ0FBQztDQUNGO0FBSkQsd0VBSUM7QUFFRCxNQUFhLDRCQUE2QixTQUFRLHlCQUFhO0lBQzdELFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsUUFBUSxJQUFJLGlDQUFpQyxDQUFDLENBQUM7SUFDdkQsQ0FBQztDQUNGO0FBSkQsb0VBSUM7QUFFRCxNQUFhLDhCQUErQixTQUFRLHlCQUFhO0lBQy9ELGdCQUFnQixLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDNUU7QUFGRCx3RUFFQztBQUVELE1BQWEsNkJBQThCLFNBQVEseUJBQWE7SUFDOUQsWUFBNEIsSUFBVSxFQUFrQixRQUErQjtRQUNyRixLQUFLLENBQUMsd0NBQXdDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBRGpFLFNBQUksR0FBSixJQUFJLENBQU07UUFBa0IsYUFBUSxHQUFSLFFBQVEsQ0FBdUI7SUFFdkYsQ0FBQztDQUNGO0FBSkQsc0VBSUM7QUFFRCxNQUFhLFNBQVM7SUFN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SUFDckIsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxxQkFBcUIsQ0FBUyxXQUFlLEVBQUUsVUFBc0I7UUFDbkUsNkVBQTZFO1FBQzdFLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRWhFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUM1QyxxQkFBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQ2xELHFCQUFTLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDMUIsSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFO2dCQUMzQixPQUFPLFNBQUUsQ0FBQyxlQUFvQixDQUFDLENBQUM7YUFDakM7aUJBQU07Z0JBQ0wsT0FBTyxpQkFBVSxDQUFDLElBQUksYUFBTSxDQUFDLHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2FBQ2pGO1FBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUFFTyxhQUFhLENBQUMsSUFBVTtRQUM5QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLHNCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQzFDLGVBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFDbkQsZUFBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsZ0JBQVMsQ0FBQyxHQUFHLEVBQUUsb0JBQWEsQ0FBQyxLQUFLLENBQXFCLENBQUMsQ0FDcEUsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWpQRCw4QkFpUEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IE9ic2VydmFibGUsIG9mLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIG1hcCwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJy4uL2V4Y2VwdGlvbic7XG5pbXBvcnQge1xuICBKc29uT2JqZWN0LFxuICBKc29uUGFyc2VNb2RlLFxuICBwYXJzZUpzb24sXG4gIHNjaGVtYSxcbn0gZnJvbSAnLi4vanNvbic7XG5pbXBvcnQge1xuICBQYXRoLFxuICBpc0Fic29sdXRlLFxuICBqb2luLFxuICBub3JtYWxpemUsXG4gIHJlbGF0aXZlLFxuICByZXNvbHZlLFxuICB2aXJ0dWFsRnMsXG59IGZyb20gJy4uL3ZpcnR1YWwtZnMnO1xuaW1wb3J0IHsgV29ya3NwYWNlUHJvamVjdCwgV29ya3NwYWNlU2NoZW1hLCBXb3Jrc3BhY2VUb29sIH0gZnJvbSAnLi93b3Jrc3BhY2Utc2NoZW1hJztcblxuXG5leHBvcnQgY2xhc3MgUHJvamVjdE5vdEZvdW5kRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBQcm9qZWN0ICcke25hbWV9JyBjb3VsZCBub3QgYmUgZm91bmQgaW4gd29ya3NwYWNlLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBXb3Jrc3BhY2VUb29sTm90Rm91bmRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFRvb2wgJHtuYW1lfSBjb3VsZCBub3QgYmUgZm91bmQgaW4gd29ya3NwYWNlLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQcm9qZWN0VG9vbE5vdEZvdW5kRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBUb29sICR7bmFtZX0gY291bGQgbm90IGJlIGZvdW5kIGluIHByb2plY3QuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFdvcmtzcGFjZU5vdFlldExvYWRlZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoYFdvcmtzcGFjZSBuZWVkcyB0byBiZSBsb2FkZWQgYmVmb3JlIGl0IGlzIHVzZWQuYCk7IH1cbn1cblxuZXhwb3J0IGNsYXNzIEFtYmlndW91c1Byb2plY3RQYXRoRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBwYXRoOiBQYXRoLCBwdWJsaWMgcmVhZG9ubHkgcHJvamVjdHM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPikge1xuICAgIHN1cGVyKGBDdXJyZW50IGFjdGl2ZSBwcm9qZWN0IGlzIGFtYmlndW91cyAoJHtwcm9qZWN0cy5qb2luKCcsJyl9KSB1c2luZyBwYXRoOiAnJHtwYXRofSdgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgV29ya3NwYWNlIHtcbiAgcHJpdmF0ZSByZWFkb25seSBfd29ya3NwYWNlU2NoZW1hUGF0aCA9IG5vcm1hbGl6ZShyZXF1aXJlLnJlc29sdmUoJy4vd29ya3NwYWNlLXNjaGVtYS5qc29uJykpO1xuICBwcml2YXRlIF93b3Jrc3BhY2VTY2hlbWE6IEpzb25PYmplY3Q7XG4gIHByaXZhdGUgX3dvcmtzcGFjZTogV29ya3NwYWNlU2NoZW1hO1xuICBwcml2YXRlIF9yZWdpc3RyeTogc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9yb290OiBQYXRoLCBwcml2YXRlIF9ob3N0OiB2aXJ0dWFsRnMuSG9zdDx7fT4pIHtcbiAgICB0aGlzLl9yZWdpc3RyeSA9IG5ldyBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5KCk7XG4gICAgdGhpcy5fcmVnaXN0cnkuYWRkUG9zdFRyYW5zZm9ybShzY2hlbWEudHJhbnNmb3Jtcy5hZGRVbmRlZmluZWREZWZhdWx0cyk7XG4gIH1cblxuICBsb2FkV29ya3NwYWNlRnJvbUpzb24oanNvbjoge30pIHtcbiAgICByZXR1cm4gdGhpcy5fbG9hZFdvcmtzcGFjZVNjaGVtYSgpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoKHdvcmtzcGFjZVNjaGVtYSkgPT4gdGhpcy52YWxpZGF0ZUFnYWluc3RTY2hlbWEoanNvbiwgd29ya3NwYWNlU2NoZW1hKSksXG4gICAgICB0YXAoKHZhbGlkYXRlZFdvcmtzcGFjZTogV29ya3NwYWNlU2NoZW1hKSA9PiB0aGlzLl93b3Jrc3BhY2UgPSB2YWxpZGF0ZWRXb3Jrc3BhY2UpLFxuICAgICAgbWFwKCgpID0+IHRoaXMpLFxuICAgICk7XG4gIH1cblxuICBsb2FkV29ya3NwYWNlRnJvbUhvc3Qod29ya3NwYWNlUGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9sb2FkV29ya3NwYWNlU2NoZW1hKCkucGlwZShcbiAgICAgIGNvbmNhdE1hcCgoKSA9PiB0aGlzLl9sb2FkSnNvbkZpbGUoam9pbih0aGlzLl9yb290LCB3b3Jrc3BhY2VQYXRoKSkpLFxuICAgICAgY29uY2F0TWFwKGpzb24gPT4gdGhpcy5sb2FkV29ya3NwYWNlRnJvbUpzb24oanNvbikpLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIF9sb2FkV29ya3NwYWNlU2NoZW1hKCkge1xuICAgIGlmICh0aGlzLl93b3Jrc3BhY2VTY2hlbWEpIHtcbiAgICAgIHJldHVybiBvZih0aGlzLl93b3Jrc3BhY2VTY2hlbWEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fbG9hZEpzb25GaWxlKHRoaXMuX3dvcmtzcGFjZVNjaGVtYVBhdGgpLnBpcGUoXG4gICAgICAgIHRhcCgod29ya3NwYWNlU2NoZW1hKSA9PiB0aGlzLl93b3Jrc3BhY2VTY2hlbWEgPSB3b3Jrc3BhY2VTY2hlbWEpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hc3NlcnRMb2FkZWQoKSB7XG4gICAgaWYgKCF0aGlzLl93b3Jrc3BhY2UpIHtcbiAgICAgIHRocm93IG5ldyBXb3Jrc3BhY2VOb3RZZXRMb2FkZWRFeGNlcHRpb24oKTtcbiAgICB9XG4gIH1cblxuICBnZXQgcm9vdCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcm9vdDtcbiAgfVxuXG4gIGdldCBob3N0KCkge1xuICAgIHJldHVybiB0aGlzLl9ob3N0O1xuICB9XG5cbiAgZ2V0IHZlcnNpb24oKSB7XG4gICAgdGhpcy5fYXNzZXJ0TG9hZGVkKCk7XG5cbiAgICByZXR1cm4gdGhpcy5fd29ya3NwYWNlLnZlcnNpb247XG4gIH1cblxuICBnZXQgbmV3UHJvamVjdFJvb3QoKSB7XG4gICAgdGhpcy5fYXNzZXJ0TG9hZGVkKCk7XG5cbiAgICByZXR1cm4gdGhpcy5fd29ya3NwYWNlLm5ld1Byb2plY3RSb290O1xuICB9XG5cbiAgbGlzdFByb2plY3ROYW1lcygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX3dvcmtzcGFjZS5wcm9qZWN0cyk7XG4gIH1cblxuICBnZXRQcm9qZWN0KHByb2plY3ROYW1lOiBzdHJpbmcpOiBXb3Jrc3BhY2VQcm9qZWN0IHtcbiAgICB0aGlzLl9hc3NlcnRMb2FkZWQoKTtcblxuICAgIGNvbnN0IHdvcmtzcGFjZVByb2plY3QgPSB0aGlzLl93b3Jrc3BhY2UucHJvamVjdHNbcHJvamVjdE5hbWVdO1xuXG4gICAgaWYgKCF3b3Jrc3BhY2VQcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgUHJvamVjdE5vdEZvdW5kRXhjZXB0aW9uKHByb2plY3ROYW1lKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gb25seSB0aGUgcHJvamVjdCBwcm9wZXJ0aWVzLCBhbmQgcmVtb3ZlIHRoZSB0b29scy5cbiAgICBjb25zdCB3b3Jrc3BhY2VQcm9qZWN0Q2xvbmUgPSB7Li4ud29ya3NwYWNlUHJvamVjdH07XG4gICAgZGVsZXRlIHdvcmtzcGFjZVByb2plY3RDbG9uZVsnY2xpJ107XG4gICAgZGVsZXRlIHdvcmtzcGFjZVByb2plY3RDbG9uZVsnc2NoZW1hdGljcyddO1xuICAgIGRlbGV0ZSB3b3Jrc3BhY2VQcm9qZWN0Q2xvbmVbJ2FyY2hpdGVjdCddO1xuICAgIGRlbGV0ZSB3b3Jrc3BhY2VQcm9qZWN0Q2xvbmVbJ3RhcmdldHMnXTtcblxuICAgIHJldHVybiB3b3Jrc3BhY2VQcm9qZWN0Q2xvbmU7XG4gIH1cblxuICBnZXREZWZhdWx0UHJvamVjdE5hbWUoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgdGhpcy5fYXNzZXJ0TG9hZGVkKCk7XG5cbiAgICBpZiAodGhpcy5fd29ya3NwYWNlLmRlZmF1bHRQcm9qZWN0KSB7XG4gICAgICAvLyBJZiB0aGVyZSBpcyBhIGRlZmF1bHQgcHJvamVjdCBuYW1lLCByZXR1cm4gaXQuXG4gICAgICByZXR1cm4gdGhpcy5fd29ya3NwYWNlLmRlZmF1bHRQcm9qZWN0O1xuICAgIH0gZWxzZSBpZiAodGhpcy5saXN0UHJvamVjdE5hbWVzKCkubGVuZ3RoID09PSAxKSB7XG4gICAgICAvLyBJZiB0aGVyZSBpcyBvbmx5IG9uZSBwcm9qZWN0LCByZXR1cm4gdGhhdCBvbmUuXG4gICAgICByZXR1cm4gdGhpcy5saXN0UHJvamVjdE5hbWVzKClbMF07XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlIHJldHVybiBudWxsLlxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZ2V0UHJvamVjdEJ5UGF0aChwYXRoOiBQYXRoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgdGhpcy5fYXNzZXJ0TG9hZGVkKCk7XG5cbiAgICBjb25zdCBwcm9qZWN0TmFtZXMgPSB0aGlzLmxpc3RQcm9qZWN0TmFtZXMoKTtcbiAgICBpZiAocHJvamVjdE5hbWVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIHByb2plY3ROYW1lc1swXTtcbiAgICB9XG5cbiAgICBjb25zdCBpc0luc2lkZSA9IChiYXNlOiBQYXRoLCBwb3RlbnRpYWw6IFBhdGgpOiBib29sZWFuID0+IHtcbiAgICAgIGNvbnN0IGFic29sdXRlQmFzZSA9IHJlc29sdmUodGhpcy5yb290LCBiYXNlKTtcbiAgICAgIGNvbnN0IGFic29sdXRlUG90ZW50aWFsID0gcmVzb2x2ZSh0aGlzLnJvb3QsIHBvdGVudGlhbCk7XG4gICAgICBjb25zdCByZWxhdGl2ZVBvdGVudGlhbCA9IHJlbGF0aXZlKGFic29sdXRlQmFzZSwgYWJzb2x1dGVQb3RlbnRpYWwpO1xuICAgICAgaWYgKCFyZWxhdGl2ZVBvdGVudGlhbC5zdGFydHNXaXRoKCcuLicpICYmICFpc0Fic29sdXRlKHJlbGF0aXZlUG90ZW50aWFsKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMubGlzdFByb2plY3ROYW1lcygpXG4gICAgICAubWFwKG5hbWUgPT4gW3RoaXMuZ2V0UHJvamVjdChuYW1lKS5yb290LCBuYW1lXSBhcyBbUGF0aCwgc3RyaW5nXSlcbiAgICAgIC5maWx0ZXIodHVwbGUgPT4gaXNJbnNpZGUodHVwbGVbMF0sIHBhdGgpKVxuICAgICAgLy8gU29ydCB0dXBsZXMgYnkgZGVwdGgsIHdpdGggdGhlIGRlZXBlciBvbmVzIGZpcnN0LiBTaW5jZSB0aGUgZmlyc3QgbWVtYmVyIGlzIGEgcGF0aCBhbmRcbiAgICAgIC8vIHdlIGZpbHRlcmVkIGFsbCBpbnZhbGlkIHBhdGhzLCB0aGUgbG9uZ2VzdCB3aWxsIGJlIHRoZSBkZWVwZXN0IChhbmQgaW4gY2FzZSBvZiBlcXVhbGl0eVxuICAgICAgLy8gdGhlIHNvcnQgaXMgc3RhYmxlIGFuZCB0aGUgZmlyc3QgZGVjbGFyZWQgcHJvamVjdCB3aWxsIHdpbikuXG4gICAgICAuc29ydCgoYSwgYikgPT4gYlswXS5sZW5ndGggLSBhWzBdLmxlbmd0aCk7XG5cbiAgICBpZiAocHJvamVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKHByb2plY3RzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IGZvdW5kID0gbmV3IFNldDxQYXRoPigpO1xuICAgICAgY29uc3Qgc2FtZVJvb3RzID0gcHJvamVjdHMuZmlsdGVyKHYgPT4ge1xuICAgICAgICBpZiAoIWZvdW5kLmhhcyh2WzBdKSkge1xuICAgICAgICAgIGZvdW5kLmFkZCh2WzBdKTtcblxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgICBpZiAoc2FtZVJvb3RzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEFtYmlndW91c1Byb2plY3RQYXRoRXhjZXB0aW9uKHBhdGgsIHNhbWVSb290cy5tYXAodiA9PiB2WzFdKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb2plY3RzWzBdWzFdO1xuICB9XG5cbiAgZ2V0Q2xpKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRUb29sKCdjbGknKTtcbiAgfVxuXG4gIGdldFNjaGVtYXRpY3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldFRvb2woJ3NjaGVtYXRpY3MnKTtcbiAgfVxuXG4gIGdldFRhcmdldHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldFRvb2woJ3RhcmdldHMnKTtcbiAgfVxuXG4gIGdldFByb2plY3RDbGkocHJvamVjdE5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLl9nZXRQcm9qZWN0VG9vbChwcm9qZWN0TmFtZSwgJ2NsaScpO1xuICB9XG5cbiAgZ2V0UHJvamVjdFNjaGVtYXRpY3MocHJvamVjdE5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLl9nZXRQcm9qZWN0VG9vbChwcm9qZWN0TmFtZSwgJ3NjaGVtYXRpY3MnKTtcbiAgfVxuXG4gIGdldFByb2plY3RUYXJnZXRzKHByb2plY3ROYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0UHJvamVjdFRvb2wocHJvamVjdE5hbWUsICd0YXJnZXRzJyk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRUb29sKHRvb2xOYW1lOiAnY2xpJyB8ICdzY2hlbWF0aWNzJyB8ICd0YXJnZXRzJyk6IFdvcmtzcGFjZVRvb2wge1xuICAgIHRoaXMuX2Fzc2VydExvYWRlZCgpO1xuXG4gICAgbGV0IHdvcmtzcGFjZVRvb2wgPSB0aGlzLl93b3Jrc3BhY2VbdG9vbE5hbWVdO1xuXG4gICAgLy8gVHJ5IGZhbGxpbmcgYmFjayB0byAnYXJjaGl0ZWN0JyBpZiAndGFyZ2V0cycgaXMgbm90IHRoZXJlIG9yIGlzIGVtcHR5LlxuICAgIGlmICgoIXdvcmtzcGFjZVRvb2wgfHwgT2JqZWN0LmtleXMod29ya3NwYWNlVG9vbCkubGVuZ3RoID09PSAwKVxuICAgICAgICAmJiB0b29sTmFtZSA9PT0gJ3RhcmdldHMnXG4gICAgICAgICYmIHRoaXMuX3dvcmtzcGFjZVsnYXJjaGl0ZWN0J10pIHtcbiAgICAgIHdvcmtzcGFjZVRvb2wgPSB0aGlzLl93b3Jrc3BhY2VbJ2FyY2hpdGVjdCddO1xuICAgIH1cblxuICAgIGlmICghd29ya3NwYWNlVG9vbCkge1xuICAgICAgdGhyb3cgbmV3IFdvcmtzcGFjZVRvb2xOb3RGb3VuZEV4Y2VwdGlvbih0b29sTmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHdvcmtzcGFjZVRvb2w7XG4gIH1cblxuICBwcml2YXRlIF9nZXRQcm9qZWN0VG9vbChcbiAgICBwcm9qZWN0TmFtZTogc3RyaW5nLCB0b29sTmFtZTogJ2NsaScgfCAnc2NoZW1hdGljcycgfCAndGFyZ2V0cycsXG4gICk6IFdvcmtzcGFjZVRvb2wge1xuICAgIHRoaXMuX2Fzc2VydExvYWRlZCgpO1xuXG4gICAgY29uc3Qgd29ya3NwYWNlUHJvamVjdCA9IHRoaXMuX3dvcmtzcGFjZS5wcm9qZWN0c1twcm9qZWN0TmFtZV07XG5cbiAgICBpZiAoIXdvcmtzcGFjZVByb2plY3QpIHtcbiAgICAgIHRocm93IG5ldyBQcm9qZWN0Tm90Rm91bmRFeGNlcHRpb24ocHJvamVjdE5hbWUpO1xuICAgIH1cblxuICAgIGxldCBwcm9qZWN0VG9vbCA9IHdvcmtzcGFjZVByb2plY3RbdG9vbE5hbWVdO1xuXG4gICAgLy8gVHJ5IGZhbGxpbmcgYmFjayB0byAnYXJjaGl0ZWN0JyBpZiAndGFyZ2V0cycgaXMgbm90IHRoZXJlIG9yIGlzIGVtcHR5LlxuICAgIGlmICgoIXByb2plY3RUb29sIHx8IE9iamVjdC5rZXlzKHByb2plY3RUb29sKS5sZW5ndGggPT09IDApXG4gICAgICAgICYmIHdvcmtzcGFjZVByb2plY3RbJ2FyY2hpdGVjdCddXG4gICAgICAgICYmIHRvb2xOYW1lID09PSAndGFyZ2V0cycpIHtcbiAgICAgIHByb2plY3RUb29sID0gd29ya3NwYWNlUHJvamVjdFsnYXJjaGl0ZWN0J107XG4gICAgfVxuXG4gICAgaWYgKCFwcm9qZWN0VG9vbCkge1xuICAgICAgdGhyb3cgbmV3IFByb2plY3RUb29sTm90Rm91bmRFeGNlcHRpb24odG9vbE5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9qZWN0VG9vbDtcbiAgfVxuXG4gIC8vIFRPRE86IGFkZCB0cmFuc2Zvcm1zIHRvIHJlc29sdmUgcGF0aHMuXG4gIHZhbGlkYXRlQWdhaW5zdFNjaGVtYTxUID0ge30+KGNvbnRlbnRKc29uOiB7fSwgc2NoZW1hSnNvbjogSnNvbk9iamVjdCk6IE9ic2VydmFibGU8VD4ge1xuICAgIC8vIEpTT04gdmFsaWRhdGlvbiBtb2RpZmllcyB0aGUgY29udGVudCwgc28gd2UgdmFsaWRhdGUgYSBjb3B5IG9mIGl0IGluc3RlYWQuXG4gICAgY29uc3QgY29udGVudEpzb25Db3B5ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb250ZW50SnNvbikpO1xuXG4gICAgcmV0dXJuIHRoaXMuX3JlZ2lzdHJ5LmNvbXBpbGUoc2NoZW1hSnNvbikucGlwZShcbiAgICAgIGNvbmNhdE1hcCh2YWxpZGF0b3IgPT4gdmFsaWRhdG9yKGNvbnRlbnRKc29uQ29weSkpLFxuICAgICAgY29uY2F0TWFwKHZhbGlkYXRvclJlc3VsdCA9PiB7XG4gICAgICAgIGlmICh2YWxpZGF0b3JSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgIHJldHVybiBvZihjb250ZW50SnNvbkNvcHkgYXMgVCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IHNjaGVtYS5TY2hlbWFWYWxpZGF0aW9uRXhjZXB0aW9uKHZhbGlkYXRvclJlc3VsdC5lcnJvcnMpKTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgX2xvYWRKc29uRmlsZShwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxKc29uT2JqZWN0PiB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3QucmVhZChub3JtYWxpemUocGF0aCkpLnBpcGUoXG4gICAgICBtYXAoYnVmZmVyID0+IHZpcnR1YWxGcy5maWxlQnVmZmVyVG9TdHJpbmcoYnVmZmVyKSksXG4gICAgICBtYXAoc3RyID0+IHBhcnNlSnNvbihzdHIsIEpzb25QYXJzZU1vZGUuTG9vc2UpIGFzIHt9IGFzIEpzb25PYmplY3QpLFxuICAgICk7XG4gIH1cbn1cbiJdfQ==