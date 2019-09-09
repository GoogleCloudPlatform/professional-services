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
const fs = require("fs");
const os_1 = require("os");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const find_up_1 = require("../utilities/find-up");
// TODO: error out instead of returning null when workspace cannot be found.
class WorkspaceLoader {
    constructor(_host) {
        this._host = _host;
        this._workspaceCacheMap = new Map();
        // TODO: add remaining fallbacks.
        this._configFileNames = [
            core_1.normalize('.angular.json'),
            core_1.normalize('angular.json'),
        ];
    }
    loadGlobalWorkspace() {
        return this._getGlobalWorkspaceFilePath().pipe(operators_1.concatMap(globalWorkspacePath => this._loadWorkspaceFromPath(globalWorkspacePath)));
    }
    loadWorkspace(projectPath) {
        return this._getProjectWorkspaceFilePath(projectPath).pipe(operators_1.concatMap(globalWorkspacePath => this._loadWorkspaceFromPath(globalWorkspacePath)));
    }
    // TODO: do this with the host instead of fs.
    _getProjectWorkspaceFilePath(projectPath) {
        // Find the workspace file, either where specified, in the Angular CLI project
        // (if it's in node_modules) or from the current process.
        const workspaceFilePath = (projectPath && find_up_1.findUp(this._configFileNames, projectPath))
            || find_up_1.findUp(this._configFileNames, process.cwd())
            || find_up_1.findUp(this._configFileNames, __dirname);
        if (workspaceFilePath) {
            return rxjs_1.of(core_1.normalize(workspaceFilePath));
        }
        else {
            throw new Error(`Local workspace file ('angular.json') could not be found.`);
        }
    }
    // TODO: do this with the host instead of fs.
    _getGlobalWorkspaceFilePath() {
        for (const fileName of this._configFileNames) {
            const workspaceFilePath = core_1.join(core_1.normalize(os_1.homedir()), fileName);
            if (fs.existsSync(workspaceFilePath)) {
                return rxjs_1.of(core_1.normalize(workspaceFilePath));
            }
        }
        return rxjs_1.of(null);
    }
    _loadWorkspaceFromPath(workspacePath) {
        if (!workspacePath) {
            return rxjs_1.of(null);
        }
        if (this._workspaceCacheMap.has(workspacePath)) {
            return rxjs_1.of(this._workspaceCacheMap.get(workspacePath) || null);
        }
        const workspaceRoot = core_1.dirname(workspacePath);
        const workspaceFileName = core_1.basename(workspacePath);
        const workspace = new core_1.experimental.workspace.Workspace(workspaceRoot, this._host);
        return workspace.loadWorkspaceFromHost(workspaceFileName).pipe(operators_1.tap(workspace => this._workspaceCacheMap.set(workspacePath, workspace)));
    }
}
exports.WorkspaceLoader = WorkspaceLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlLWxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvbW9kZWxzL3dvcmtzcGFjZS1sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQ0FROEI7QUFDOUIseUJBQXlCO0FBQ3pCLDJCQUE2QjtBQUM3QiwrQkFBc0M7QUFDdEMsOENBQWdEO0FBQ2hELGtEQUE4QztBQUc5Qyw0RUFBNEU7QUFDNUUsTUFBYSxlQUFlO0lBTzFCLFlBQW9CLEtBQXFCO1FBQXJCLFVBQUssR0FBTCxLQUFLLENBQWdCO1FBTmpDLHVCQUFrQixHQUFHLElBQUksR0FBRyxFQUE0QyxDQUFDO1FBQ2pGLGlDQUFpQztRQUN6QixxQkFBZ0IsR0FBRztZQUN6QixnQkFBUyxDQUFDLGVBQWUsQ0FBQztZQUMxQixnQkFBUyxDQUFDLGNBQWMsQ0FBQztTQUMxQixDQUFDO0lBQzJDLENBQUM7SUFFOUMsbUJBQW1CO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUMsSUFBSSxDQUM1QyxxQkFBUyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUNuRixDQUFDO0lBQ0osQ0FBQztJQUVELGFBQWEsQ0FBQyxXQUFvQjtRQUNoQyxPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQ3hELHFCQUFTLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQ25GLENBQUM7SUFDSixDQUFDO0lBRUQsNkNBQTZDO0lBQ3JDLDRCQUE0QixDQUFDLFdBQW9CO1FBQ3ZELDhFQUE4RTtRQUM5RSx5REFBeUQ7UUFDekQsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFdBQVcsSUFBSSxnQkFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsQ0FBQztlQUNoRixnQkFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7ZUFDNUMsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFOUMsSUFBSSxpQkFBaUIsRUFBRTtZQUNyQixPQUFPLFNBQUUsQ0FBQyxnQkFBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztTQUN6QzthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQywyREFBMkQsQ0FBQyxDQUFDO1NBQzlFO0lBQ0gsQ0FBQztJQUVELDZDQUE2QztJQUNyQywyQkFBMkI7UUFDakMsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDNUMsTUFBTSxpQkFBaUIsR0FBRyxXQUFJLENBQUMsZ0JBQVMsQ0FBQyxZQUFPLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRS9ELElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO2dCQUNwQyxPQUFPLFNBQUUsQ0FBQyxnQkFBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQzthQUN6QztTQUNGO1FBRUQsT0FBTyxTQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEIsQ0FBQztJQUVPLHNCQUFzQixDQUFDLGFBQTBCO1FBQ3ZELElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsT0FBTyxTQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakI7UUFFRCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFDOUMsT0FBTyxTQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztTQUMvRDtRQUVELE1BQU0sYUFBYSxHQUFHLGNBQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM3QyxNQUFNLGlCQUFpQixHQUFHLGVBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNsRCxNQUFNLFNBQVMsR0FBRyxJQUFJLG1CQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWxGLE9BQU8sU0FBUyxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUM1RCxlQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUN4RSxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBbEVELDBDQWtFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgUGF0aCxcbiAgYmFzZW5hbWUsXG4gIGRpcm5hbWUsXG4gIGV4cGVyaW1lbnRhbCxcbiAgam9pbixcbiAgbm9ybWFsaXplLFxuICB2aXJ0dWFsRnMsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IGhvbWVkaXIgfSBmcm9tICdvcyc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY29uY2F0TWFwLCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBmaW5kVXAgfSBmcm9tICcuLi91dGlsaXRpZXMvZmluZC11cCc7XG5cblxuLy8gVE9ETzogZXJyb3Igb3V0IGluc3RlYWQgb2YgcmV0dXJuaW5nIG51bGwgd2hlbiB3b3Jrc3BhY2UgY2Fubm90IGJlIGZvdW5kLlxuZXhwb3J0IGNsYXNzIFdvcmtzcGFjZUxvYWRlciB7XG4gIHByaXZhdGUgX3dvcmtzcGFjZUNhY2hlTWFwID0gbmV3IE1hcDxzdHJpbmcsIGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlPigpO1xuICAvLyBUT0RPOiBhZGQgcmVtYWluaW5nIGZhbGxiYWNrcy5cbiAgcHJpdmF0ZSBfY29uZmlnRmlsZU5hbWVzID0gW1xuICAgIG5vcm1hbGl6ZSgnLmFuZ3VsYXIuanNvbicpLFxuICAgIG5vcm1hbGl6ZSgnYW5ndWxhci5qc29uJyksXG4gIF07XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2hvc3Q6IHZpcnR1YWxGcy5Ib3N0KSB7IH1cblxuICBsb2FkR2xvYmFsV29ya3NwYWNlKCk6IE9ic2VydmFibGU8ZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2UgfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEdsb2JhbFdvcmtzcGFjZUZpbGVQYXRoKCkucGlwZShcbiAgICAgIGNvbmNhdE1hcChnbG9iYWxXb3Jrc3BhY2VQYXRoID0+IHRoaXMuX2xvYWRXb3Jrc3BhY2VGcm9tUGF0aChnbG9iYWxXb3Jrc3BhY2VQYXRoKSksXG4gICAgKTtcbiAgfVxuXG4gIGxvYWRXb3Jrc3BhY2UocHJvamVjdFBhdGg/OiBzdHJpbmcpOiBPYnNlcnZhYmxlPGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlIHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLl9nZXRQcm9qZWN0V29ya3NwYWNlRmlsZVBhdGgocHJvamVjdFBhdGgpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoZ2xvYmFsV29ya3NwYWNlUGF0aCA9PiB0aGlzLl9sb2FkV29ya3NwYWNlRnJvbVBhdGgoZ2xvYmFsV29ya3NwYWNlUGF0aCkpLFxuICAgICk7XG4gIH1cblxuICAvLyBUT0RPOiBkbyB0aGlzIHdpdGggdGhlIGhvc3QgaW5zdGVhZCBvZiBmcy5cbiAgcHJpdmF0ZSBfZ2V0UHJvamVjdFdvcmtzcGFjZUZpbGVQYXRoKHByb2plY3RQYXRoPzogc3RyaW5nKTogT2JzZXJ2YWJsZTxQYXRoIHwgbnVsbD4ge1xuICAgIC8vIEZpbmQgdGhlIHdvcmtzcGFjZSBmaWxlLCBlaXRoZXIgd2hlcmUgc3BlY2lmaWVkLCBpbiB0aGUgQW5ndWxhciBDTEkgcHJvamVjdFxuICAgIC8vIChpZiBpdCdzIGluIG5vZGVfbW9kdWxlcykgb3IgZnJvbSB0aGUgY3VycmVudCBwcm9jZXNzLlxuICAgIGNvbnN0IHdvcmtzcGFjZUZpbGVQYXRoID0gKHByb2plY3RQYXRoICYmIGZpbmRVcCh0aGlzLl9jb25maWdGaWxlTmFtZXMsIHByb2plY3RQYXRoKSlcbiAgICAgIHx8IGZpbmRVcCh0aGlzLl9jb25maWdGaWxlTmFtZXMsIHByb2Nlc3MuY3dkKCkpXG4gICAgICB8fCBmaW5kVXAodGhpcy5fY29uZmlnRmlsZU5hbWVzLCBfX2Rpcm5hbWUpO1xuXG4gICAgaWYgKHdvcmtzcGFjZUZpbGVQYXRoKSB7XG4gICAgICByZXR1cm4gb2Yobm9ybWFsaXplKHdvcmtzcGFjZUZpbGVQYXRoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTG9jYWwgd29ya3NwYWNlIGZpbGUgKCdhbmd1bGFyLmpzb24nKSBjb3VsZCBub3QgYmUgZm91bmQuYCk7XG4gICAgfVxuICB9XG5cbiAgLy8gVE9ETzogZG8gdGhpcyB3aXRoIHRoZSBob3N0IGluc3RlYWQgb2YgZnMuXG4gIHByaXZhdGUgX2dldEdsb2JhbFdvcmtzcGFjZUZpbGVQYXRoKCk6IE9ic2VydmFibGU8UGF0aCB8IG51bGw+IHtcbiAgICBmb3IgKGNvbnN0IGZpbGVOYW1lIG9mIHRoaXMuX2NvbmZpZ0ZpbGVOYW1lcykge1xuICAgICAgY29uc3Qgd29ya3NwYWNlRmlsZVBhdGggPSBqb2luKG5vcm1hbGl6ZShob21lZGlyKCkpLCBmaWxlTmFtZSk7XG5cbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKHdvcmtzcGFjZUZpbGVQYXRoKSkge1xuICAgICAgICByZXR1cm4gb2Yobm9ybWFsaXplKHdvcmtzcGFjZUZpbGVQYXRoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9mKG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbG9hZFdvcmtzcGFjZUZyb21QYXRoKHdvcmtzcGFjZVBhdGg6IFBhdGggfCBudWxsKSB7XG4gICAgaWYgKCF3b3Jrc3BhY2VQYXRoKSB7XG4gICAgICByZXR1cm4gb2YobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3dvcmtzcGFjZUNhY2hlTWFwLmhhcyh3b3Jrc3BhY2VQYXRoKSkge1xuICAgICAgcmV0dXJuIG9mKHRoaXMuX3dvcmtzcGFjZUNhY2hlTWFwLmdldCh3b3Jrc3BhY2VQYXRoKSB8fCBudWxsKTtcbiAgICB9XG5cbiAgICBjb25zdCB3b3Jrc3BhY2VSb290ID0gZGlybmFtZSh3b3Jrc3BhY2VQYXRoKTtcbiAgICBjb25zdCB3b3Jrc3BhY2VGaWxlTmFtZSA9IGJhc2VuYW1lKHdvcmtzcGFjZVBhdGgpO1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IG5ldyBleHBlcmltZW50YWwud29ya3NwYWNlLldvcmtzcGFjZSh3b3Jrc3BhY2VSb290LCB0aGlzLl9ob3N0KTtcblxuICAgIHJldHVybiB3b3Jrc3BhY2UubG9hZFdvcmtzcGFjZUZyb21Ib3N0KHdvcmtzcGFjZUZpbGVOYW1lKS5waXBlKFxuICAgICAgdGFwKHdvcmtzcGFjZSA9PiB0aGlzLl93b3Jrc3BhY2VDYWNoZU1hcC5zZXQod29ya3NwYWNlUGF0aCwgd29ya3NwYWNlKSksXG4gICAgKTtcbiAgfVxufVxuIl19