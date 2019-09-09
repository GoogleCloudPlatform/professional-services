/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { experimental, virtualFs } from '@angular-devkit/core';
import { Observable } from 'rxjs';
export declare class WorkspaceLoader {
    private _host;
    private _workspaceCacheMap;
    private _configFileNames;
    constructor(_host: virtualFs.Host);
    loadGlobalWorkspace(): Observable<experimental.workspace.Workspace | null>;
    loadWorkspace(projectPath?: string): Observable<experimental.workspace.Workspace | null>;
    private _getProjectWorkspaceFilePath;
    private _getGlobalWorkspaceFilePath;
    private _loadWorkspaceFromPath;
}
