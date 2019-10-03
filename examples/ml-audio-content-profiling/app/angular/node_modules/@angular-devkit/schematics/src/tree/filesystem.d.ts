/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Path, PathFragment, virtualFs } from '@angular-devkit/core';
import { DirEntry, FileEntry, Tree } from './interface';
import { VirtualDirEntry, VirtualTree } from './virtual';
export declare class FileSystemDirEntry extends VirtualDirEntry {
    protected _host: virtualFs.SyncDelegateHost<{}>;
    constructor(_host: virtualFs.SyncDelegateHost<{}>, tree: FileSystemTree, path?: Path);
    protected _createDir(name: PathFragment): DirEntry;
    readonly parent: DirEntry | null;
    readonly subdirs: PathFragment[];
    readonly subfiles: PathFragment[];
    file(name: PathFragment): FileEntry | null;
}
export declare class FileSystemTree extends VirtualTree {
    protected _host: virtualFs.SyncDelegateHost<{}>;
    protected _initialized: boolean;
    constructor(host: virtualFs.Host);
    readonly tree: Map<Path, FileEntry>;
    get(path: string): FileEntry | null;
    branch(): Tree;
    protected _copyTo<T extends VirtualTree>(tree: T): void;
    protected _recursiveFileList(): Path[];
}
export declare class FileSystemCreateTree extends FileSystemTree {
    constructor(host: virtualFs.Host);
}
