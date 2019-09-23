"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const exception_1 = require("../exception/exception");
const entry_1 = require("./entry");
const interface_1 = require("./interface");
const recorder_1 = require("./recorder");
let _uniqueId = 0;
class HostDirEntry {
    constructor(parent, path, _host, _tree) {
        this.parent = parent;
        this.path = path;
        this._host = _host;
        this._tree = _tree;
    }
    get subdirs() {
        return this._host.list(this.path)
            .filter(fragment => this._host.isDirectory(core_1.join(this.path, fragment)));
    }
    get subfiles() {
        return this._host.list(this.path)
            .filter(fragment => this._host.isFile(core_1.join(this.path, fragment)));
    }
    dir(name) {
        return this._tree.getDir(core_1.join(this.path, name));
    }
    file(name) {
        return this._tree.get(core_1.join(this.path, name));
    }
    visit(visitor) {
        try {
            this.getSubfilesRecursively().forEach(file => visitor(file.path, file));
        }
        catch (e) {
            if (e !== interface_1.FileVisitorCancelToken) {
                throw e;
            }
        }
    }
    getSubfilesRecursively() {
        function _recurse(entry) {
            return entry.subdirs.reduce((files, subdir) => [
                ...files,
                ..._recurse(entry.dir(subdir)),
            ], entry.subfiles.map(subfile => entry.file(subfile)));
        }
        return _recurse(this);
    }
}
exports.HostDirEntry = HostDirEntry;
class HostTree {
    constructor(_backend = new core_1.virtualFs.Empty()) {
        this._backend = _backend;
        this._id = --_uniqueId;
        this._ancestry = new Set();
        this._dirCache = new Map();
        this._record = new core_1.virtualFs.CordHost(new core_1.virtualFs.SafeReadonlyHost(_backend));
        this._recordSync = new core_1.virtualFs.SyncDelegateHost(this._record);
    }
    [interface_1.TreeSymbol]() {
        return this;
    }
    static isHostTree(tree) {
        if (tree instanceof HostTree) {
            return true;
        }
        if (typeof tree === 'object' && typeof tree._ancestry === 'object') {
            return true;
        }
        return false;
    }
    _normalizePath(path) {
        return core_1.normalize('/' + path);
    }
    _willCreate(path) {
        return this._record.willCreate(path);
    }
    _willOverwrite(path) {
        return this._record.willOverwrite(path);
    }
    _willDelete(path) {
        return this._record.willDelete(path);
    }
    _willRename(path) {
        return this._record.willRename(path);
    }
    // This can be used by old Schematics library with new Trees in some corner cases.
    // TODO: remove this for 7.0
    optimize() {
        return this;
    }
    branch() {
        const branchedTree = new HostTree(this._backend);
        branchedTree._record = this._record.clone();
        branchedTree._recordSync = new core_1.virtualFs.SyncDelegateHost(branchedTree._record);
        branchedTree._ancestry = new Set(this._ancestry).add(this._id);
        return branchedTree;
    }
    merge(other, strategy = interface_1.MergeStrategy.Default) {
        if (other === this) {
            // Merging with yourself? Tsk tsk. Nothing to do at least.
            return;
        }
        if (other instanceof HostTree && other._ancestry.has(this._id)) {
            // Workaround for merging a branch back into one of its ancestors
            // More complete branch point tracking is required to avoid
            strategy |= interface_1.MergeStrategy.Overwrite;
        }
        const creationConflictAllowed = (strategy & interface_1.MergeStrategy.AllowCreationConflict) == interface_1.MergeStrategy.AllowCreationConflict;
        const overwriteConflictAllowed = (strategy & interface_1.MergeStrategy.AllowOverwriteConflict) == interface_1.MergeStrategy.AllowOverwriteConflict;
        const deleteConflictAllowed = (strategy & interface_1.MergeStrategy.AllowOverwriteConflict) == interface_1.MergeStrategy.AllowDeleteConflict;
        other.actions.forEach(action => {
            switch (action.kind) {
                case 'c': {
                    const { path, content } = action;
                    if ((this._willCreate(path) || this._willOverwrite(path))) {
                        const existingContent = this.read(path);
                        if (existingContent && content.equals(existingContent)) {
                            // Identical outcome; no action required
                            return;
                        }
                        if (!creationConflictAllowed) {
                            throw new exception_1.MergeConflictException(path);
                        }
                        this._record.overwrite(path, content).subscribe();
                    }
                    else {
                        this._record.create(path, content).subscribe();
                    }
                    return;
                }
                case 'o': {
                    const { path, content } = action;
                    if (this._willDelete(path) && !overwriteConflictAllowed) {
                        throw new exception_1.MergeConflictException(path);
                    }
                    // Ignore if content is the same (considered the same change).
                    if (this._willOverwrite(path)) {
                        const existingContent = this.read(path);
                        if (existingContent && content.equals(existingContent)) {
                            // Identical outcome; no action required
                            return;
                        }
                        if (!overwriteConflictAllowed) {
                            throw new exception_1.MergeConflictException(path);
                        }
                    }
                    // We use write here as merge validation has already been done, and we want to let
                    // the CordHost do its job.
                    this._record.write(path, content).subscribe();
                    return;
                }
                case 'r': {
                    const { path, to } = action;
                    if (this._willDelete(path)) {
                        throw new exception_1.MergeConflictException(path);
                    }
                    if (this._willRename(path)) {
                        if (this._record.willRenameTo(path, to)) {
                            // Identical outcome; no action required
                            return;
                        }
                        // No override possible for renaming.
                        throw new exception_1.MergeConflictException(path);
                    }
                    this.rename(path, to);
                    return;
                }
                case 'd': {
                    const { path } = action;
                    if (this._willDelete(path)) {
                        // TODO: This should technically check the content (e.g., hash on delete)
                        // Identical outcome; no action required
                        return;
                    }
                    if (!this.exists(path) && !deleteConflictAllowed) {
                        throw new exception_1.MergeConflictException(path);
                    }
                    this._recordSync.delete(path);
                    return;
                }
            }
        });
    }
    get root() {
        return this.getDir('/');
    }
    // Readonly.
    read(path) {
        const entry = this.get(path);
        return entry ? entry.content : null;
    }
    exists(path) {
        return this._recordSync.isFile(this._normalizePath(path));
    }
    get(path) {
        const p = this._normalizePath(path);
        if (this._recordSync.isDirectory(p)) {
            throw new core_1.PathIsDirectoryException(p);
        }
        if (!this._recordSync.exists(p)) {
            return null;
        }
        return new entry_1.LazyFileEntry(p, () => Buffer.from(this._recordSync.read(p)));
    }
    getDir(path) {
        const p = this._normalizePath(path);
        if (this._recordSync.isFile(p)) {
            throw new core_1.PathIsFileException(p);
        }
        let maybeCache = this._dirCache.get(p);
        if (!maybeCache) {
            let parent = core_1.dirname(p);
            if (p === parent) {
                parent = null;
            }
            maybeCache = new HostDirEntry(parent && this.getDir(parent), p, this._recordSync, this);
            this._dirCache.set(p, maybeCache);
        }
        return maybeCache;
    }
    visit(visitor) {
        this.root.visit((path, entry) => {
            visitor(path, entry);
        });
    }
    // Change content of host files.
    overwrite(path, content) {
        const p = this._normalizePath(path);
        if (!this._recordSync.exists(p)) {
            throw new exception_1.FileDoesNotExistException(p);
        }
        const c = typeof content == 'string' ? Buffer.from(content) : content;
        this._record.overwrite(p, c).subscribe();
    }
    beginUpdate(path) {
        const entry = this.get(path);
        if (!entry) {
            throw new exception_1.FileDoesNotExistException(path);
        }
        return recorder_1.UpdateRecorderBase.createFromFileEntry(entry);
    }
    commitUpdate(record) {
        if (record instanceof recorder_1.UpdateRecorderBase) {
            const path = record.path;
            const entry = this.get(path);
            if (!entry) {
                throw new exception_1.ContentHasMutatedException(path);
            }
            else {
                const newContent = record.apply(entry.content);
                this.overwrite(path, newContent);
            }
        }
        else {
            throw new exception_1.InvalidUpdateRecordException();
        }
    }
    // Structural methods.
    create(path, content) {
        const p = this._normalizePath(path);
        if (this._recordSync.exists(p)) {
            throw new exception_1.FileAlreadyExistException(p);
        }
        const c = typeof content == 'string' ? Buffer.from(content) : content;
        this._record.create(p, c).subscribe();
    }
    delete(path) {
        this._recordSync.delete(this._normalizePath(path));
    }
    rename(from, to) {
        this._recordSync.rename(this._normalizePath(from), this._normalizePath(to));
    }
    apply(action, strategy) {
        throw new exception_1.SchematicsException('Apply not implemented on host trees.');
    }
    get actions() {
        // Create a list of all records until we hit our original backend. This is to support branches
        // that diverge from each others.
        const allRecords = [...this._record.records()];
        return core_1.clean(allRecords
            .map(record => {
            switch (record.kind) {
                case 'create':
                    return {
                        id: this._id,
                        parent: 0,
                        kind: 'c',
                        path: record.path,
                        content: Buffer.from(record.content),
                    };
                case 'overwrite':
                    return {
                        id: this._id,
                        parent: 0,
                        kind: 'o',
                        path: record.path,
                        content: Buffer.from(record.content),
                    };
                case 'rename':
                    return {
                        id: this._id,
                        parent: 0,
                        kind: 'r',
                        path: record.from,
                        to: record.to,
                    };
                case 'delete':
                    return {
                        id: this._id,
                        parent: 0,
                        kind: 'd',
                        path: record.path,
                    };
                default:
                    return;
            }
        }));
    }
}
exports.HostTree = HostTree;
class HostCreateTree extends HostTree {
    constructor(host) {
        super();
        const tempHost = new HostTree(host);
        tempHost.visit(path => {
            const content = tempHost.read(path);
            if (content) {
                this.create(path, content);
            }
        });
    }
}
exports.HostCreateTree = HostCreateTree;
class FilterHostTree extends HostTree {
    constructor(tree, filter = () => true) {
        const newBackend = new core_1.virtualFs.SimpleMemoryHost();
        // cast to allow access
        const originalBackend = tree._backend;
        const recurse = base => {
            return originalBackend.list(base)
                .pipe(operators_1.mergeMap(x => x), operators_1.map(path => core_1.join(base, path)), operators_1.concatMap(path => {
                let isDirectory = false;
                originalBackend.isDirectory(path).subscribe(val => isDirectory = val);
                if (isDirectory) {
                    return recurse(path);
                }
                let isFile = false;
                originalBackend.isFile(path).subscribe(val => isFile = val);
                if (!isFile || !filter(path)) {
                    return rxjs_1.of();
                }
                let content = null;
                originalBackend.read(path).subscribe(val => content = val);
                if (!content) {
                    return rxjs_1.of();
                }
                return newBackend.write(path, content);
            }));
        };
        recurse(core_1.normalize('/')).subscribe();
        super(newBackend);
        for (const action of tree.actions) {
            if (!filter(action.path)) {
                continue;
            }
            switch (action.kind) {
                case 'c':
                    this.create(action.path, action.content);
                    break;
                case 'd':
                    this.delete(action.path);
                    break;
                case 'o':
                    this.overwrite(action.path, action.content);
                    break;
                case 'r':
                    this.rename(action.path, action.to);
                    break;
            }
        }
    }
}
exports.FilterHostTree = FilterHostTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC10cmVlLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy90cmVlL2hvc3QtdHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQVU4QjtBQUM5QiwrQkFBc0M7QUFDdEMsOENBQTBEO0FBQzFELHNEQU9nQztBQVFoQyxtQ0FBd0M7QUFDeEMsMkNBVXFCO0FBQ3JCLHlDQUFnRDtBQUdoRCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFHbEIsTUFBYSxZQUFZO0lBQ3ZCLFlBQ1csTUFBdUIsRUFDdkIsSUFBVSxFQUNULEtBQWlDLEVBQ2pDLEtBQVc7UUFIWixXQUFNLEdBQU4sTUFBTSxDQUFpQjtRQUN2QixTQUFJLEdBQUosSUFBSSxDQUFNO1FBQ1QsVUFBSyxHQUFMLEtBQUssQ0FBNEI7UUFDakMsVUFBSyxHQUFMLEtBQUssQ0FBTTtJQUNwQixDQUFDO0lBRUosSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQzlCLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBQ0QsSUFBSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQzlCLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsR0FBRyxDQUFDLElBQWtC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TUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDeEIsU0FBUzthQUNWO1lBRUQsUUFBUSxNQUFNLENBQUMsSUFBSSxFQUFFO2dCQUNuQixLQUFLLEdBQUc7b0JBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDekMsTUFBTTtnQkFDUixLQUFLLEdBQUc7b0JBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pCLE1BQU07Z0JBQ1IsS0FBSyxHQUFHO29CQUNOLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVDLE1BQU07Z0JBQ1IsS0FBSyxHQUFHO29CQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3BDLE1BQU07YUFDVDtTQUNGO0lBQ0gsQ0FBQztDQUNGO0FBNURELHdDQTREQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIFBhdGgsXG4gIFBhdGhGcmFnbWVudCxcbiAgUGF0aElzRGlyZWN0b3J5RXhjZXB0aW9uLFxuICBQYXRoSXNGaWxlRXhjZXB0aW9uLFxuICBjbGVhbixcbiAgZGlybmFtZSxcbiAgam9pbixcbiAgbm9ybWFsaXplLFxuICB2aXJ0dWFsRnMsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIG9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIG1hcCwgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBDb250ZW50SGFzTXV0YXRlZEV4Y2VwdGlvbixcbiAgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbixcbiAgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbixcbiAgSW52YWxpZFVwZGF0ZVJlY29yZEV4Y2VwdGlvbixcbiAgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbixcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbn0gZnJvbSAnLi4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5pbXBvcnQge1xuICBBY3Rpb24sXG4gIENyZWF0ZUZpbGVBY3Rpb24sXG4gIERlbGV0ZUZpbGVBY3Rpb24sXG4gIE92ZXJ3cml0ZUZpbGVBY3Rpb24sXG4gIFJlbmFtZUZpbGVBY3Rpb24sXG59IGZyb20gJy4vYWN0aW9uJztcbmltcG9ydCB7IExhenlGaWxlRW50cnkgfSBmcm9tICcuL2VudHJ5JztcbmltcG9ydCB7XG4gIERpckVudHJ5LFxuICBGaWxlRW50cnksXG4gIEZpbGVQcmVkaWNhdGUsXG4gIEZpbGVWaXNpdG9yLFxuICBGaWxlVmlzaXRvckNhbmNlbFRva2VuLFxuICBNZXJnZVN0cmF0ZWd5LFxuICBUcmVlLFxuICBUcmVlU3ltYm9sLFxuICBVcGRhdGVSZWNvcmRlcixcbn0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgVXBkYXRlUmVjb3JkZXJCYXNlIH0gZnJvbSAnLi9yZWNvcmRlcic7XG5cblxubGV0IF91bmlxdWVJZCA9IDA7XG5cblxuZXhwb3J0IGNsYXNzIEhvc3REaXJFbnRyeSBpbXBsZW1lbnRzIERpckVudHJ5IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgcGFyZW50OiBEaXJFbnRyeSB8IG51bGwsXG4gICAgcmVhZG9ubHkgcGF0aDogUGF0aCxcbiAgICBwcm90ZWN0ZWQgX2hvc3Q6IHZpcnR1YWxGcy5TeW5jRGVsZWdhdGVIb3N0LFxuICAgIHByb3RlY3RlZCBfdHJlZTogVHJlZSxcbiAgKSB7fVxuXG4gIGdldCBzdWJkaXJzKCk6IFBhdGhGcmFnbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5faG9zdC5saXN0KHRoaXMucGF0aClcbiAgICAgIC5maWx0ZXIoZnJhZ21lbnQgPT4gdGhpcy5faG9zdC5pc0RpcmVjdG9yeShqb2luKHRoaXMucGF0aCwgZnJhZ21lbnQpKSk7XG4gIH1cbiAgZ2V0IHN1YmZpbGVzKCk6IFBhdGhGcmFnbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5faG9zdC5saXN0KHRoaXMucGF0aClcbiAgICAgIC5maWx0ZXIoZnJhZ21lbnQgPT4gdGhpcy5faG9zdC5pc0ZpbGUoam9pbih0aGlzLnBhdGgsIGZyYWdtZW50KSkpO1xuICB9XG5cbiAgZGlyKG5hbWU6IFBhdGhGcmFnbWVudCk6IERpckVudHJ5IHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5nZXREaXIoam9pbih0aGlzLnBhdGgsIG5hbWUpKTtcbiAgfVxuICBmaWxlKG5hbWU6IFBhdGhGcmFnbWVudCk6IEZpbGVFbnRyeSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmdldChqb2luKHRoaXMucGF0aCwgbmFtZSkpO1xuICB9XG5cbiAgdmlzaXQodmlzaXRvcjogRmlsZVZpc2l0b3IpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5nZXRTdWJmaWxlc1JlY3Vyc2l2ZWx5KCkuZm9yRWFjaChmaWxlID0+IHZpc2l0b3IoZmlsZS5wYXRoLCBmaWxlKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgIT09IEZpbGVWaXNpdG9yQ2FuY2VsVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFN1YmZpbGVzUmVjdXJzaXZlbHkoKSB7XG4gICAgZnVuY3Rpb24gX3JlY3Vyc2UoZW50cnk6IERpckVudHJ5KTogRmlsZUVudHJ5W10ge1xuICAgICAgcmV0dXJuIGVudHJ5LnN1YmRpcnMucmVkdWNlKChmaWxlcywgc3ViZGlyKSA9PiBbXG4gICAgICAgIC4uLmZpbGVzLFxuICAgICAgICAuLi5fcmVjdXJzZShlbnRyeS5kaXIoc3ViZGlyKSksXG4gICAgICBdLCBlbnRyeS5zdWJmaWxlcy5tYXAoc3ViZmlsZSA9PiBlbnRyeS5maWxlKHN1YmZpbGUpIGFzIEZpbGVFbnRyeSkpO1xuICAgIH1cblxuICAgIHJldHVybiBfcmVjdXJzZSh0aGlzKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBIb3N0VHJlZSBpbXBsZW1lbnRzIFRyZWUge1xuICBwcml2YXRlIHJlYWRvbmx5IF9pZCA9IC0tX3VuaXF1ZUlkO1xuICBwcml2YXRlIF9yZWNvcmQ6IHZpcnR1YWxGcy5Db3JkSG9zdDtcbiAgcHJpdmF0ZSBfcmVjb3JkU3luYzogdmlydHVhbEZzLlN5bmNEZWxlZ2F0ZUhvc3Q7XG4gIHByaXZhdGUgX2FuY2VzdHJ5ID0gbmV3IFNldDxudW1iZXI+KCk7XG5cbiAgcHJpdmF0ZSBfZGlyQ2FjaGUgPSBuZXcgTWFwPFBhdGgsIEhvc3REaXJFbnRyeT4oKTtcblxuXG4gIFtUcmVlU3ltYm9sXSgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHN0YXRpYyBpc0hvc3RUcmVlKHRyZWU6IFRyZWUpOiB0cmVlIGlzIEhvc3RUcmVlIHtcbiAgICBpZiAodHJlZSBpbnN0YW5jZW9mIEhvc3RUcmVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRyZWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiAodHJlZSBhcyBIb3N0VHJlZSkuX2FuY2VzdHJ5ID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9iYWNrZW5kOiB2aXJ0dWFsRnMuUmVhZG9ubHlIb3N0PHt9PiA9IG5ldyB2aXJ0dWFsRnMuRW1wdHkoKSkge1xuICAgIHRoaXMuX3JlY29yZCA9IG5ldyB2aXJ0dWFsRnMuQ29yZEhvc3QobmV3IHZpcnR1YWxGcy5TYWZlUmVhZG9ubHlIb3N0KF9iYWNrZW5kKSk7XG4gICAgdGhpcy5fcmVjb3JkU3luYyA9IG5ldyB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdCh0aGlzLl9yZWNvcmQpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9ub3JtYWxpemVQYXRoKHBhdGg6IHN0cmluZyk6IFBhdGgge1xuICAgIHJldHVybiBub3JtYWxpemUoJy8nICsgcGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3dpbGxDcmVhdGUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmQud2lsbENyZWF0ZShwYXRoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfd2lsbE92ZXJ3cml0ZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZC53aWxsT3ZlcndyaXRlKHBhdGgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF93aWxsRGVsZXRlKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVjb3JkLndpbGxEZWxldGUocGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3dpbGxSZW5hbWUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmQud2lsbFJlbmFtZShwYXRoKTtcbiAgfVxuXG4gIC8vIFRoaXMgY2FuIGJlIHVzZWQgYnkgb2xkIFNjaGVtYXRpY3MgbGlicmFyeSB3aXRoIG5ldyBUcmVlcyBpbiBzb21lIGNvcm5lciBjYXNlcy5cbiAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgZm9yIDcuMFxuICBvcHRpbWl6ZSgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGJyYW5jaCgpOiBUcmVlIHtcbiAgICBjb25zdCBicmFuY2hlZFRyZWUgPSBuZXcgSG9zdFRyZWUodGhpcy5fYmFja2VuZCk7XG4gICAgYnJhbmNoZWRUcmVlLl9yZWNvcmQgPSB0aGlzLl9yZWNvcmQuY2xvbmUoKTtcbiAgICBicmFuY2hlZFRyZWUuX3JlY29yZFN5bmMgPSBuZXcgdmlydHVhbEZzLlN5bmNEZWxlZ2F0ZUhvc3QoYnJhbmNoZWRUcmVlLl9yZWNvcmQpO1xuICAgIGJyYW5jaGVkVHJlZS5fYW5jZXN0cnkgPSBuZXcgU2V0KHRoaXMuX2FuY2VzdHJ5KS5hZGQodGhpcy5faWQpO1xuXG4gICAgcmV0dXJuIGJyYW5jaGVkVHJlZTtcbiAgfVxuXG4gIG1lcmdlKG90aGVyOiBUcmVlLCBzdHJhdGVneTogTWVyZ2VTdHJhdGVneSA9IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdCk6IHZvaWQge1xuICAgIGlmIChvdGhlciA9PT0gdGhpcykge1xuICAgICAgLy8gTWVyZ2luZyB3aXRoIHlvdXJzZWxmPyBUc2sgdHNrLiBOb3RoaW5nIHRvIGRvIGF0IGxlYXN0LlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChvdGhlciBpbnN0YW5jZW9mIEhvc3RUcmVlICYmIG90aGVyLl9hbmNlc3RyeS5oYXModGhpcy5faWQpKSB7XG4gICAgICAvLyBXb3JrYXJvdW5kIGZvciBtZXJnaW5nIGEgYnJhbmNoIGJhY2sgaW50byBvbmUgb2YgaXRzIGFuY2VzdG9yc1xuICAgICAgLy8gTW9yZSBjb21wbGV0ZSBicmFuY2ggcG9pbnQgdHJhY2tpbmcgaXMgcmVxdWlyZWQgdG8gYXZvaWRcbiAgICAgIHN0cmF0ZWd5IHw9IE1lcmdlU3RyYXRlZ3kuT3ZlcndyaXRlO1xuICAgIH1cblxuICAgIGNvbnN0IGNyZWF0aW9uQ29uZmxpY3RBbGxvd2VkID1cbiAgICAgIChzdHJhdGVneSAmIE1lcmdlU3RyYXRlZ3kuQWxsb3dDcmVhdGlvbkNvbmZsaWN0KSA9PSBNZXJnZVN0cmF0ZWd5LkFsbG93Q3JlYXRpb25Db25mbGljdDtcbiAgICBjb25zdCBvdmVyd3JpdGVDb25mbGljdEFsbG93ZWQgPVxuICAgICAgKHN0cmF0ZWd5ICYgTWVyZ2VTdHJhdGVneS5BbGxvd092ZXJ3cml0ZUNvbmZsaWN0KSA9PSBNZXJnZVN0cmF0ZWd5LkFsbG93T3ZlcndyaXRlQ29uZmxpY3Q7XG4gICAgY29uc3QgZGVsZXRlQ29uZmxpY3RBbGxvd2VkID1cbiAgICAgIChzdHJhdGVneSAmIE1lcmdlU3RyYXRlZ3kuQWxsb3dPdmVyd3JpdGVDb25mbGljdCkgPT0gTWVyZ2VTdHJhdGVneS5BbGxvd0RlbGV0ZUNvbmZsaWN0O1xuXG4gICAgb3RoZXIuYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICBzd2l0Y2ggKGFjdGlvbi5raW5kKSB7XG4gICAgICAgIGNhc2UgJ2MnOiB7XG4gICAgICAgICAgY29uc3QgeyBwYXRoLCBjb250ZW50IH0gPSBhY3Rpb247XG5cbiAgICAgICAgICBpZiAoKHRoaXMuX3dpbGxDcmVhdGUocGF0aCkgfHwgdGhpcy5fd2lsbE92ZXJ3cml0ZShwYXRoKSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nQ29udGVudCA9IHRoaXMucmVhZChwYXRoKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0NvbnRlbnQgJiYgY29udGVudC5lcXVhbHMoZXhpc3RpbmdDb250ZW50KSkge1xuICAgICAgICAgICAgICAvLyBJZGVudGljYWwgb3V0Y29tZTsgbm8gYWN0aW9uIHJlcXVpcmVkXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjcmVhdGlvbkNvbmZsaWN0QWxsb3dlZCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fcmVjb3JkLm92ZXJ3cml0ZShwYXRoLCBjb250ZW50IGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVjb3JkLmNyZWF0ZShwYXRoLCBjb250ZW50IGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdvJzoge1xuICAgICAgICAgIGNvbnN0IHsgcGF0aCwgY29udGVudCB9ID0gYWN0aW9uO1xuICAgICAgICAgIGlmICh0aGlzLl93aWxsRGVsZXRlKHBhdGgpICYmICFvdmVyd3JpdGVDb25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIElnbm9yZSBpZiBjb250ZW50IGlzIHRoZSBzYW1lIChjb25zaWRlcmVkIHRoZSBzYW1lIGNoYW5nZSkuXG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxPdmVyd3JpdGUocGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nQ29udGVudCA9IHRoaXMucmVhZChwYXRoKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0NvbnRlbnQgJiYgY29udGVudC5lcXVhbHMoZXhpc3RpbmdDb250ZW50KSkge1xuICAgICAgICAgICAgICAvLyBJZGVudGljYWwgb3V0Y29tZTsgbm8gYWN0aW9uIHJlcXVpcmVkXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFvdmVyd3JpdGVDb25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFdlIHVzZSB3cml0ZSBoZXJlIGFzIG1lcmdlIHZhbGlkYXRpb24gaGFzIGFscmVhZHkgYmVlbiBkb25lLCBhbmQgd2Ugd2FudCB0byBsZXRcbiAgICAgICAgICAvLyB0aGUgQ29yZEhvc3QgZG8gaXRzIGpvYi5cbiAgICAgICAgICB0aGlzLl9yZWNvcmQud3JpdGUocGF0aCwgY29udGVudCBhcyB7fSBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlcikuc3Vic2NyaWJlKCk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdyJzoge1xuICAgICAgICAgIGNvbnN0IHsgcGF0aCwgdG8gfSA9IGFjdGlvbjtcbiAgICAgICAgICBpZiAodGhpcy5fd2lsbERlbGV0ZShwYXRoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxSZW5hbWUocGF0aCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9yZWNvcmQud2lsbFJlbmFtZVRvKHBhdGgsIHRvKSkge1xuICAgICAgICAgICAgICAvLyBJZGVudGljYWwgb3V0Y29tZTsgbm8gYWN0aW9uIHJlcXVpcmVkXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTm8gb3ZlcnJpZGUgcG9zc2libGUgZm9yIHJlbmFtaW5nLlxuICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVuYW1lKHBhdGgsIHRvKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgJ2QnOiB7XG4gICAgICAgICAgY29uc3QgeyBwYXRoIH0gPSBhY3Rpb247XG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxEZWxldGUocGF0aCkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFRoaXMgc2hvdWxkIHRlY2huaWNhbGx5IGNoZWNrIHRoZSBjb250ZW50IChlLmcuLCBoYXNoIG9uIGRlbGV0ZSlcbiAgICAgICAgICAgIC8vIElkZW50aWNhbCBvdXRjb21lOyBubyBhY3Rpb24gcmVxdWlyZWRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIXRoaXMuZXhpc3RzKHBhdGgpICYmICFkZWxldGVDb25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX3JlY29yZFN5bmMuZGVsZXRlKHBhdGgpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBnZXQgcm9vdCgpOiBEaXJFbnRyeSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGlyKCcvJyk7XG4gIH1cblxuICAvLyBSZWFkb25seS5cbiAgcmVhZChwYXRoOiBzdHJpbmcpOiBCdWZmZXIgfCBudWxsIHtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZ2V0KHBhdGgpO1xuXG4gICAgcmV0dXJuIGVudHJ5ID8gZW50cnkuY29udGVudCA6IG51bGw7XG4gIH1cbiAgZXhpc3RzKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmRTeW5jLmlzRmlsZSh0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpKTtcbiAgfVxuXG4gIGdldChwYXRoOiBzdHJpbmcpOiBGaWxlRW50cnkgfCBudWxsIHtcbiAgICBjb25zdCBwID0gdGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKTtcbiAgICBpZiAodGhpcy5fcmVjb3JkU3luYy5pc0RpcmVjdG9yeShwKSkge1xuICAgICAgdGhyb3cgbmV3IFBhdGhJc0RpcmVjdG9yeUV4Y2VwdGlvbihwKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9yZWNvcmRTeW5jLmV4aXN0cyhwKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBMYXp5RmlsZUVudHJ5KHAsICgpID0+IEJ1ZmZlci5mcm9tKHRoaXMuX3JlY29yZFN5bmMucmVhZChwKSkpO1xuICB9XG5cbiAgZ2V0RGlyKHBhdGg6IHN0cmluZyk6IERpckVudHJ5IHtcbiAgICBjb25zdCBwID0gdGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKTtcbiAgICBpZiAodGhpcy5fcmVjb3JkU3luYy5pc0ZpbGUocCkpIHtcbiAgICAgIHRocm93IG5ldyBQYXRoSXNGaWxlRXhjZXB0aW9uKHApO1xuICAgIH1cblxuICAgIGxldCBtYXliZUNhY2hlID0gdGhpcy5fZGlyQ2FjaGUuZ2V0KHApO1xuICAgIGlmICghbWF5YmVDYWNoZSkge1xuICAgICAgbGV0IHBhcmVudDogUGF0aCB8IG51bGwgPSBkaXJuYW1lKHApO1xuICAgICAgaWYgKHAgPT09IHBhcmVudCkge1xuICAgICAgICBwYXJlbnQgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBtYXliZUNhY2hlID0gbmV3IEhvc3REaXJFbnRyeShwYXJlbnQgJiYgdGhpcy5nZXREaXIocGFyZW50KSwgcCwgdGhpcy5fcmVjb3JkU3luYywgdGhpcyk7XG4gICAgICB0aGlzLl9kaXJDYWNoZS5zZXQocCwgbWF5YmVDYWNoZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1heWJlQ2FjaGU7XG4gIH1cbiAgdmlzaXQodmlzaXRvcjogRmlsZVZpc2l0b3IpOiB2b2lkIHtcbiAgICB0aGlzLnJvb3QudmlzaXQoKHBhdGgsIGVudHJ5KSA9PiB7XG4gICAgICB2aXNpdG9yKHBhdGgsIGVudHJ5KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIENoYW5nZSBjb250ZW50IG9mIGhvc3QgZmlsZXMuXG4gIG92ZXJ3cml0ZShwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICghdGhpcy5fcmVjb3JkU3luYy5leGlzdHMocCkpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHApO1xuICAgIH1cbiAgICBjb25zdCBjID0gdHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycgPyBCdWZmZXIuZnJvbShjb250ZW50KSA6IGNvbnRlbnQ7XG4gICAgdGhpcy5fcmVjb3JkLm92ZXJ3cml0ZShwLCBjIGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgfVxuICBiZWdpblVwZGF0ZShwYXRoOiBzdHJpbmcpOiBVcGRhdGVSZWNvcmRlciB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gVXBkYXRlUmVjb3JkZXJCYXNlLmNyZWF0ZUZyb21GaWxlRW50cnkoZW50cnkpO1xuICB9XG4gIGNvbW1pdFVwZGF0ZShyZWNvcmQ6IFVwZGF0ZVJlY29yZGVyKTogdm9pZCB7XG4gICAgaWYgKHJlY29yZCBpbnN0YW5jZW9mIFVwZGF0ZVJlY29yZGVyQmFzZSkge1xuICAgICAgY29uc3QgcGF0aCA9IHJlY29yZC5wYXRoO1xuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcbiAgICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRIYXNNdXRhdGVkRXhjZXB0aW9uKHBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbmV3Q29udGVudCA9IHJlY29yZC5hcHBseShlbnRyeS5jb250ZW50KTtcbiAgICAgICAgdGhpcy5vdmVyd3JpdGUocGF0aCwgbmV3Q29udGVudCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkVXBkYXRlUmVjb3JkRXhjZXB0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gU3RydWN0dXJhbCBtZXRob2RzLlxuICBjcmVhdGUocGF0aDogc3RyaW5nLCBjb250ZW50OiBCdWZmZXIgfCBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKTtcbiAgICBpZiAodGhpcy5fcmVjb3JkU3luYy5leGlzdHMocCkpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uKHApO1xuICAgIH1cbiAgICBjb25zdCBjID0gdHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycgPyBCdWZmZXIuZnJvbShjb250ZW50KSA6IGNvbnRlbnQ7XG4gICAgdGhpcy5fcmVjb3JkLmNyZWF0ZShwLCBjIGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgfVxuICBkZWxldGUocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fcmVjb3JkU3luYy5kZWxldGUodGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKSk7XG4gIH1cbiAgcmVuYW1lKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX3JlY29yZFN5bmMucmVuYW1lKHRoaXMuX25vcm1hbGl6ZVBhdGgoZnJvbSksIHRoaXMuX25vcm1hbGl6ZVBhdGgodG8pKTtcbiAgfVxuXG4gIGFwcGx5KGFjdGlvbjogQWN0aW9uLCBzdHJhdGVneT86IE1lcmdlU3RyYXRlZ3kpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQXBwbHkgbm90IGltcGxlbWVudGVkIG9uIGhvc3QgdHJlZXMuJyk7XG4gIH1cbiAgZ2V0IGFjdGlvbnMoKTogQWN0aW9uW10ge1xuICAgIC8vIENyZWF0ZSBhIGxpc3Qgb2YgYWxsIHJlY29yZHMgdW50aWwgd2UgaGl0IG91ciBvcmlnaW5hbCBiYWNrZW5kLiBUaGlzIGlzIHRvIHN1cHBvcnQgYnJhbmNoZXNcbiAgICAvLyB0aGF0IGRpdmVyZ2UgZnJvbSBlYWNoIG90aGVycy5cbiAgICBjb25zdCBhbGxSZWNvcmRzID0gWy4uLnRoaXMuX3JlY29yZC5yZWNvcmRzKCldO1xuXG4gICAgcmV0dXJuIGNsZWFuKFxuICAgICAgYWxsUmVjb3Jkc1xuICAgICAgICAubWFwKHJlY29yZCA9PiB7XG4gICAgICAgICAgc3dpdGNoIChyZWNvcmQua2luZCkge1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICAgICAgcGFyZW50OiAwLFxuICAgICAgICAgICAgICAgIGtpbmQ6ICdjJyxcbiAgICAgICAgICAgICAgICBwYXRoOiByZWNvcmQucGF0aCxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBCdWZmZXIuZnJvbShyZWNvcmQuY29udGVudCksXG4gICAgICAgICAgICAgIH0gYXMgQ3JlYXRlRmlsZUFjdGlvbjtcbiAgICAgICAgICAgIGNhc2UgJ292ZXJ3cml0ZSc6XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaWQ6IHRoaXMuX2lkLFxuICAgICAgICAgICAgICAgIHBhcmVudDogMCxcbiAgICAgICAgICAgICAgICBraW5kOiAnbycsXG4gICAgICAgICAgICAgICAgcGF0aDogcmVjb3JkLnBhdGgsXG4gICAgICAgICAgICAgICAgY29udGVudDogQnVmZmVyLmZyb20ocmVjb3JkLmNvbnRlbnQpLFxuICAgICAgICAgICAgICB9IGFzIE92ZXJ3cml0ZUZpbGVBY3Rpb247XG4gICAgICAgICAgICBjYXNlICdyZW5hbWUnOlxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlkOiB0aGlzLl9pZCxcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IDAsXG4gICAgICAgICAgICAgICAga2luZDogJ3InLFxuICAgICAgICAgICAgICAgIHBhdGg6IHJlY29yZC5mcm9tLFxuICAgICAgICAgICAgICAgIHRvOiByZWNvcmQudG8sXG4gICAgICAgICAgICAgIH0gYXMgUmVuYW1lRmlsZUFjdGlvbjtcbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZSc6XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaWQ6IHRoaXMuX2lkLFxuICAgICAgICAgICAgICAgIHBhcmVudDogMCxcbiAgICAgICAgICAgICAgICBraW5kOiAnZCcsXG4gICAgICAgICAgICAgICAgcGF0aDogcmVjb3JkLnBhdGgsXG4gICAgICAgICAgICAgIH0gYXMgRGVsZXRlRmlsZUFjdGlvbjtcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSG9zdENyZWF0ZVRyZWUgZXh0ZW5kcyBIb3N0VHJlZSB7XG4gIGNvbnN0cnVjdG9yKGhvc3Q6IHZpcnR1YWxGcy5SZWFkb25seUhvc3QpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgY29uc3QgdGVtcEhvc3QgPSBuZXcgSG9zdFRyZWUoaG9zdCk7XG4gICAgdGVtcEhvc3QudmlzaXQocGF0aCA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gdGVtcEhvc3QucmVhZChwYXRoKTtcbiAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgIHRoaXMuY3JlYXRlKHBhdGgsIGNvbnRlbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGaWx0ZXJIb3N0VHJlZSBleHRlbmRzIEhvc3RUcmVlIHtcbiAgY29uc3RydWN0b3IodHJlZTogSG9zdFRyZWUsIGZpbHRlcjogRmlsZVByZWRpY2F0ZTxib29sZWFuPiA9ICgpID0+IHRydWUpIHtcbiAgICBjb25zdCBuZXdCYWNrZW5kID0gbmV3IHZpcnR1YWxGcy5TaW1wbGVNZW1vcnlIb3N0KCk7XG4gICAgLy8gY2FzdCB0byBhbGxvdyBhY2Nlc3NcbiAgICBjb25zdCBvcmlnaW5hbEJhY2tlbmQgPSAodHJlZSBhcyBGaWx0ZXJIb3N0VHJlZSkuX2JhY2tlbmQ7XG5cbiAgICBjb25zdCByZWN1cnNlOiAoYmFzZTogUGF0aCkgPT4gT2JzZXJ2YWJsZTx2b2lkPiA9IGJhc2UgPT4ge1xuICAgICAgcmV0dXJuIG9yaWdpbmFsQmFja2VuZC5saXN0KGJhc2UpXG4gICAgICAgIC5waXBlKFxuICAgICAgICAgIG1lcmdlTWFwKHggPT4geCksXG4gICAgICAgICAgbWFwKHBhdGggPT4gam9pbihiYXNlLCBwYXRoKSksXG4gICAgICAgICAgY29uY2F0TWFwKHBhdGggPT4ge1xuICAgICAgICAgICAgbGV0IGlzRGlyZWN0b3J5ID0gZmFsc2U7XG4gICAgICAgICAgICBvcmlnaW5hbEJhY2tlbmQuaXNEaXJlY3RvcnkocGF0aCkuc3Vic2NyaWJlKHZhbCA9PiBpc0RpcmVjdG9yeSA9IHZhbCk7XG4gICAgICAgICAgICBpZiAoaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlY3Vyc2UocGF0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBpc0ZpbGUgPSBmYWxzZTtcbiAgICAgICAgICAgIG9yaWdpbmFsQmFja2VuZC5pc0ZpbGUocGF0aCkuc3Vic2NyaWJlKHZhbCA9PiBpc0ZpbGUgPSB2YWwpO1xuICAgICAgICAgICAgaWYgKCFpc0ZpbGUgfHwgIWZpbHRlcihwYXRoKSkge1xuICAgICAgICAgICAgICByZXR1cm4gb2YoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGNvbnRlbnQ6IEFycmF5QnVmZmVyIHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICBvcmlnaW5hbEJhY2tlbmQucmVhZChwYXRoKS5zdWJzY3JpYmUodmFsID0+IGNvbnRlbnQgPSB2YWwpO1xuICAgICAgICAgICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgICAgICAgIHJldHVybiBvZigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3QmFja2VuZC53cml0ZShwYXRoLCBjb250ZW50IGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICB9O1xuXG4gICAgcmVjdXJzZShub3JtYWxpemUoJy8nKSkuc3Vic2NyaWJlKCk7XG5cbiAgICBzdXBlcihuZXdCYWNrZW5kKTtcblxuICAgIGZvciAoY29uc3QgYWN0aW9uIG9mIHRyZWUuYWN0aW9ucykge1xuICAgICAgaWYgKCFmaWx0ZXIoYWN0aW9uLnBhdGgpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKGFjdGlvbi5raW5kKSB7XG4gICAgICAgIGNhc2UgJ2MnOlxuICAgICAgICAgIHRoaXMuY3JlYXRlKGFjdGlvbi5wYXRoLCBhY3Rpb24uY29udGVudCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgIHRoaXMuZGVsZXRlKGFjdGlvbi5wYXRoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbyc6XG4gICAgICAgICAgdGhpcy5vdmVyd3JpdGUoYWN0aW9uLnBhdGgsIGFjdGlvbi5jb250ZW50KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgdGhpcy5yZW5hbWUoYWN0aW9uLnBhdGgsIGFjdGlvbi50byk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=