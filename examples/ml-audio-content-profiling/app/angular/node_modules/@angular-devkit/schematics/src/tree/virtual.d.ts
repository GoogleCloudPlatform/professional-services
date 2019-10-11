/// <reference types="node" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Path, PathFragment } from '@angular-devkit/core';
import { Action, ActionList } from './action';
import { DirEntry, FileEntry, FileVisitor, MergeStrategy, Tree, UpdateRecorder } from './interface';
export declare class VirtualDirEntry implements DirEntry {
    protected _tree: VirtualTree;
    protected _path: Path;
    protected _subdirs: Map<PathFragment, DirEntry>;
    constructor(_tree: VirtualTree, _path?: Path);
    protected _createDir(name: PathFragment): DirEntry;
    readonly parent: DirEntry | null;
    readonly path: Path;
    readonly subdirs: PathFragment[];
    readonly subfiles: PathFragment[];
    dir(name: PathFragment): DirEntry;
    file(name: PathFragment): FileEntry | null;
    visit(visitor: FileVisitor): void;
    private getSubfilesRecursively;
}
/**
 * The root class of most trees.
 */
export declare class VirtualTree implements Tree {
    protected _actions: ActionList;
    protected _cacheMap: Map<Path, FileEntry>;
    protected _root: VirtualDirEntry;
    protected _tree: Map<Path, FileEntry>;
    static isVirtualTree(tree: Tree): tree is VirtualTree;
    /**
     * Normalize the path. Made available to subclasses to overload.
     * @param path The path to normalize.
     * @returns {string} A path that is resolved and normalized.
     */
    protected _normalizePath(path: string): Path;
    protected readonly tree: ReadonlyMap<Path, FileEntry>;
    readonly staging: ReadonlyMap<Path, FileEntry>;
    /**
     * A list of file names contained by this Tree.
     * @returns {[string]} File paths.
     */
    readonly files: Path[];
    readonly root: DirEntry;
    get(path: string): FileEntry | null;
    has(path: string): boolean;
    set(entry: FileEntry): Map<Path, FileEntry>;
    exists(path: string): boolean;
    read(path: string): Buffer | null;
    getDir(path: string): DirEntry;
    visit(visitor: FileVisitor): void;
    beginUpdate(path: string): UpdateRecorder;
    commitUpdate(record: UpdateRecorder): void;
    overwrite(path: string, content: Buffer | string): void;
    create(path: string, content: Buffer | string): void;
    rename(path: string, to: string): void;
    delete(path: string): void;
    protected _overwrite(path: Path, content: Buffer, action?: Action): void;
    protected _create(path: Path, content: Buffer, action?: Action): void;
    protected _rename(path: Path, to: Path, action?: Action, force?: boolean): void;
    protected _delete(path: Path, action?: Action): void;
    apply(action: Action, strategy: MergeStrategy): void;
    readonly actions: Action[];
    /**
     * Allow subclasses to copy to a tree their own properties.
     * @return {Tree}
     * @private
     */
    protected _copyTo<T extends VirtualTree>(tree: T): void;
    branch(): Tree;
    merge(other: Tree, strategy?: MergeStrategy): void;
    optimize(): void;
    static branch(tree: Tree): Tree;
    static merge(tree: Tree, other: Tree, strategy?: MergeStrategy): Tree;
    static optimize(tree: Tree): VirtualTree;
}
