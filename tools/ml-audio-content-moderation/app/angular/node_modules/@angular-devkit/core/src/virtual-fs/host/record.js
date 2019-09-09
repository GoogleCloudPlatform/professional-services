"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const exception_1 = require("../../exception");
const memory_1 = require("./memory");
/**
 * A Host that records changes to the underlying Host, while keeping a record of Create, Overwrite,
 * Rename and Delete of files.
 *
 * This is fully compatible with Host, but will keep a staging of every changes asked. That staging
 * follows the principle of the Tree (e.g. can create a file that already exists).
 *
 * Using `create()` and `overwrite()` will force those operations, but using `write` will add
 * the create/overwrite records IIF the files does/doesn't already exist.
 */
class CordHost extends memory_1.SimpleMemoryHost {
    constructor(_back) {
        super();
        this._back = _back;
        this._filesToCreate = new Set();
        this._filesToRename = new Map();
        this._filesToRenameRevert = new Map();
        this._filesToDelete = new Set();
        this._filesToOverwrite = new Set();
    }
    get backend() { return this._back; }
    get capabilities() {
        // Our own host is always Synchronous, but the backend might not be.
        return {
            synchronous: this._back.capabilities.synchronous,
        };
    }
    /**
     * Create a copy of this host, including all actions made.
     * @returns {CordHost} The carbon copy.
     */
    clone() {
        const dolly = new CordHost(this._back);
        dolly._cache = new Map(this._cache);
        dolly._filesToCreate = new Set(this._filesToCreate);
        dolly._filesToRename = new Map(this._filesToRename);
        dolly._filesToRenameRevert = new Map(this._filesToRenameRevert);
        dolly._filesToDelete = new Set(this._filesToDelete);
        dolly._filesToOverwrite = new Set(this._filesToOverwrite);
        return dolly;
    }
    /**
     * Commit the changes recorded to a Host. It is assumed that the host does have the same structure
     * as the host that was used for backend (could be the same host).
     * @param host The host to create/delete/rename/overwrite files to.
     * @param force Whether to skip existence checks when creating/overwriting. This is
     *   faster but might lead to incorrect states. Because Hosts natively don't support creation
     *   versus overwriting (it's only writing), we check for existence before completing a request.
     * @returns An observable that completes when done, or error if an error occured.
     */
    commit(host, force = false) {
        // Really commit everything to the actual host.
        return rxjs_1.from(this.records()).pipe(operators_1.concatMap(record => {
            switch (record.kind) {
                case 'delete': return host.delete(record.path);
                case 'rename': return host.rename(record.from, record.to);
                case 'create':
                    return host.exists(record.path).pipe(operators_1.switchMap(exists => {
                        if (exists && !force) {
                            return rxjs_1.throwError(new exception_1.FileAlreadyExistException(record.path));
                        }
                        else {
                            return host.write(record.path, record.content);
                        }
                    }));
                case 'overwrite':
                    return host.exists(record.path).pipe(operators_1.switchMap(exists => {
                        if (!exists && !force) {
                            return rxjs_1.throwError(new exception_1.FileDoesNotExistException(record.path));
                        }
                        else {
                            return host.write(record.path, record.content);
                        }
                    }));
            }
        }), operators_1.reduce(() => { }));
    }
    records() {
        return [
            ...[...this._filesToDelete.values()].map(path => ({
                kind: 'delete', path,
            })),
            ...[...this._filesToRename.entries()].map(([from, to]) => ({
                kind: 'rename', from, to,
            })),
            ...[...this._filesToCreate.values()].map(path => ({
                kind: 'create', path, content: this._read(path),
            })),
            ...[...this._filesToOverwrite.values()].map(path => ({
                kind: 'overwrite', path, content: this._read(path),
            })),
        ];
    }
    /**
     * Specialized version of {@link CordHost#write} which forces the creation of a file whether it
     * exists or not.
     * @param {} path
     * @param {FileBuffer} content
     * @returns {Observable<void>}
     */
    create(path, content) {
        if (super._exists(path)) {
            throw new exception_1.FileAlreadyExistException(path);
        }
        if (this._filesToDelete.has(path)) {
            this._filesToDelete.delete(path);
            this._filesToOverwrite.add(path);
        }
        else {
            this._filesToCreate.add(path);
        }
        return super.write(path, content);
    }
    overwrite(path, content) {
        return this.isDirectory(path).pipe(operators_1.switchMap(isDir => {
            if (isDir) {
                return rxjs_1.throwError(new exception_1.PathIsDirectoryException(path));
            }
            return this.exists(path);
        }), operators_1.switchMap(exists => {
            if (!exists) {
                return rxjs_1.throwError(new exception_1.FileDoesNotExistException(path));
            }
            if (!this._filesToCreate.has(path)) {
                this._filesToOverwrite.add(path);
            }
            return super.write(path, content);
        }));
    }
    write(path, content) {
        return this.exists(path).pipe(operators_1.switchMap(exists => {
            if (exists) {
                // It exists, but might be being renamed or deleted. In that case we want to create it.
                if (this.willRename(path) || this.willDelete(path)) {
                    return this.create(path, content);
                }
                else {
                    return this.overwrite(path, content);
                }
            }
            else {
                return this.create(path, content);
            }
        }));
    }
    read(path) {
        if (this._exists(path)) {
            return super.read(path);
        }
        return this._back.read(path);
    }
    delete(path) {
        if (this._exists(path)) {
            if (this._filesToCreate.has(path)) {
                this._filesToCreate.delete(path);
            }
            else if (this._filesToOverwrite.has(path)) {
                this._filesToOverwrite.delete(path);
                this._filesToDelete.add(path);
            }
            else {
                const maybeOrigin = this._filesToRenameRevert.get(path);
                if (maybeOrigin) {
                    this._filesToRenameRevert.delete(path);
                    this._filesToRename.delete(maybeOrigin);
                    this._filesToDelete.add(maybeOrigin);
                }
                else {
                    return rxjs_1.throwError(new exception_1.UnknownException(`This should never happen. Path: ${JSON.stringify(path)}.`));
                }
            }
            return super.delete(path);
        }
        else {
            return this._back.exists(path).pipe(operators_1.switchMap(exists => {
                if (exists) {
                    this._filesToDelete.add(path);
                    return rxjs_1.of();
                }
                else {
                    return rxjs_1.throwError(new exception_1.FileDoesNotExistException(path));
                }
            }));
        }
    }
    rename(from, to) {
        return rxjs_1.concat(this.exists(to), this.exists(from)).pipe(operators_1.toArray(), operators_1.switchMap(([existTo, existFrom]) => {
            if (!existFrom) {
                return rxjs_1.throwError(new exception_1.FileDoesNotExistException(from));
            }
            if (from === to) {
                return rxjs_1.of();
            }
            if (existTo) {
                return rxjs_1.throwError(new exception_1.FileAlreadyExistException(to));
            }
            // If we're renaming a file that's been created, shortcircuit to creating the `to` path.
            if (this._filesToCreate.has(from)) {
                this._filesToCreate.delete(from);
                this._filesToCreate.add(to);
                return super.rename(from, to);
            }
            if (this._filesToOverwrite.has(from)) {
                this._filesToOverwrite.delete(from);
                // Recursively call this function. This is so we don't repeat the bottom logic. This
                // if will be by-passed because we just deleted the `from` path from files to overwrite.
                return rxjs_1.concat(this.rename(from, to), new rxjs_1.Observable(x => {
                    this._filesToOverwrite.add(to);
                    x.complete();
                }));
            }
            if (this._filesToDelete.has(to)) {
                this._filesToDelete.delete(to);
                this._filesToDelete.add(from);
                this._filesToOverwrite.add(to);
                // We need to delete the original and write the new one.
                return this.read(from).pipe(operators_1.map(content => this._write(to, content)));
            }
            const maybeTo1 = this._filesToRenameRevert.get(from);
            if (maybeTo1) {
                // We already renamed to this file (A => from), let's rename the former to the new
                // path (A => to).
                this._filesToRename.delete(maybeTo1);
                this._filesToRenameRevert.delete(from);
                from = maybeTo1;
            }
            this._filesToRename.set(from, to);
            this._filesToRenameRevert.set(to, from);
            // If the file is part of our data, just rename it internally.
            if (this._exists(from)) {
                return super.rename(from, to);
            }
            else {
                // Create a file with the same content.
                return this._back.read(from).pipe(operators_1.switchMap(content => super.write(to, content)));
            }
        }));
    }
    list(path) {
        return rxjs_1.concat(super.list(path), this._back.list(path)).pipe(operators_1.reduce((list, curr) => {
            curr.forEach(elem => list.add(elem));
            return list;
        }, new Set()), operators_1.map(set => [...set]));
    }
    exists(path) {
        return this._exists(path)
            ? rxjs_1.of(true)
            : ((this.willDelete(path) || this.willRename(path)) ? rxjs_1.of(false) : this._back.exists(path));
    }
    isDirectory(path) {
        return this._exists(path) ? super.isDirectory(path) : this._back.isDirectory(path);
    }
    isFile(path) {
        return this._exists(path)
            ? super.isFile(path)
            : ((this.willDelete(path) || this.willRename(path)) ? rxjs_1.of(false) : this._back.isFile(path));
    }
    stat(path) {
        return this._exists(path)
            ? super.stat(path)
            : ((this.willDelete(path) || this.willRename(path)) ? rxjs_1.of(null) : this._back.stat(path));
    }
    watch(path, options) {
        // Watching not supported.
        return null;
    }
    willCreate(path) {
        return this._filesToCreate.has(path);
    }
    willOverwrite(path) {
        return this._filesToOverwrite.has(path);
    }
    willDelete(path) {
        return this._filesToDelete.has(path);
    }
    willRename(path) {
        return this._filesToRename.has(path);
    }
    willRenameTo(path, to) {
        return this._filesToRename.get(path) === to;
    }
}
exports.CordHost = CordHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy92aXJ0dWFsLWZzL2hvc3QvcmVjb3JkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0JBTWM7QUFDZCw4Q0FBNEU7QUFDNUUsK0NBS3lCO0FBVXpCLHFDQUE0QztBQTRCNUM7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBYSxRQUFTLFNBQVEseUJBQWdCO0lBTzVDLFlBQXNCLEtBQW1CO1FBQUksS0FBSyxFQUFFLENBQUM7UUFBL0IsVUFBSyxHQUFMLEtBQUssQ0FBYztRQU4vQixtQkFBYyxHQUFHLElBQUksR0FBRyxFQUFRLENBQUM7UUFDakMsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBYyxDQUFDO1FBQ3ZDLHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUFjLENBQUM7UUFDN0MsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBUSxDQUFDO1FBQ2pDLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUFRLENBQUM7SUFFUSxDQUFDO0lBRXZELElBQUksT0FBTyxLQUFtQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2xELElBQUksWUFBWTtRQUNkLG9FQUFvRTtRQUNwRSxPQUFPO1lBQ0wsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFdBQVc7U0FDakQsQ0FBQztJQUNKLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLO1FBQ0gsTUFBTSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXZDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLEtBQUssQ0FBQyxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFD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QUFDO0lBQ0QsWUFBWSxDQUFDLElBQVUsRUFBRSxFQUFRO1FBQy9CLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzlDLENBQUM7Q0FDRjtBQXZVRCw0QkF1VUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBPYnNlcnZhYmxlLFxuICBjb25jYXQsXG4gIGZyb20gYXMgb2JzZXJ2YWJsZUZyb20sXG4gIG9mLFxuICB0aHJvd0Vycm9yLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNvbmNhdE1hcCwgbWFwLCByZWR1Y2UsIHN3aXRjaE1hcCwgdG9BcnJheSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7XG4gIEZpbGVBbHJlYWR5RXhpc3RFeGNlcHRpb24sXG4gIEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24sXG4gIFBhdGhJc0RpcmVjdG9yeUV4Y2VwdGlvbixcbiAgVW5rbm93bkV4Y2VwdGlvbixcbn0gZnJvbSAnLi4vLi4vZXhjZXB0aW9uJztcbmltcG9ydCB7IFBhdGgsIFBhdGhGcmFnbWVudCB9IGZyb20gJy4uL3BhdGgnO1xuaW1wb3J0IHtcbiAgRmlsZUJ1ZmZlcixcbiAgSG9zdCxcbiAgSG9zdENhcGFiaWxpdGllcyxcbiAgSG9zdFdhdGNoT3B0aW9ucyxcbiAgUmVhZG9ubHlIb3N0LFxuICBTdGF0cyxcbn0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2ltcGxlTWVtb3J5SG9zdCB9IGZyb20gJy4vbWVtb3J5JztcblxuXG5leHBvcnQgaW50ZXJmYWNlIENvcmRIb3N0Q3JlYXRlIHtcbiAga2luZDogJ2NyZWF0ZSc7XG4gIHBhdGg6IFBhdGg7XG4gIGNvbnRlbnQ6IEZpbGVCdWZmZXI7XG59XG5leHBvcnQgaW50ZXJmYWNlIENvcmRIb3N0T3ZlcndyaXRlIHtcbiAga2luZDogJ292ZXJ3cml0ZSc7XG4gIHBhdGg6IFBhdGg7XG4gIGNvbnRlbnQ6IEZpbGVCdWZmZXI7XG59XG5leHBvcnQgaW50ZXJmYWNlIENvcmRIb3N0UmVuYW1lIHtcbiAga2luZDogJ3JlbmFtZSc7XG4gIGZyb206IFBhdGg7XG4gIHRvOiBQYXRoO1xufVxuZXhwb3J0IGludGVyZmFjZSBDb3JkSG9zdERlbGV0ZSB7XG4gIGtpbmQ6ICdkZWxldGUnO1xuICBwYXRoOiBQYXRoO1xufVxuZXhwb3J0IHR5cGUgQ29yZEhvc3RSZWNvcmQgPSBDb3JkSG9zdENyZWF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBDb3JkSG9zdE92ZXJ3cml0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBDb3JkSG9zdFJlbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBDb3JkSG9zdERlbGV0ZTtcblxuXG4vKipcbiAqIEEgSG9zdCB0aGF0IHJlY29yZHMgY2hhbmdlcyB0byB0aGUgdW5kZXJseWluZyBIb3N0LCB3aGlsZSBrZWVwaW5nIGEgcmVjb3JkIG9mIENyZWF0ZSwgT3ZlcndyaXRlLFxuICogUmVuYW1lIGFuZCBEZWxldGUgb2YgZmlsZXMuXG4gKlxuICogVGhpcyBpcyBmdWxseSBjb21wYXRpYmxlIHdpdGggSG9zdCwgYnV0IHdpbGwga2VlcCBhIHN0YWdpbmcgb2YgZXZlcnkgY2hhbmdlcyBhc2tlZC4gVGhhdCBzdGFnaW5nXG4gKiBmb2xsb3dzIHRoZSBwcmluY2lwbGUgb2YgdGhlIFRyZWUgKGUuZy4gY2FuIGNyZWF0ZSBhIGZpbGUgdGhhdCBhbHJlYWR5IGV4aXN0cykuXG4gKlxuICogVXNpbmcgYGNyZWF0ZSgpYCBhbmQgYG92ZXJ3cml0ZSgpYCB3aWxsIGZvcmNlIHRob3NlIG9wZXJhdGlvbnMsIGJ1dCB1c2luZyBgd3JpdGVgIHdpbGwgYWRkXG4gKiB0aGUgY3JlYXRlL292ZXJ3cml0ZSByZWNvcmRzIElJRiB0aGUgZmlsZXMgZG9lcy9kb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb3JkSG9zdCBleHRlbmRzIFNpbXBsZU1lbW9yeUhvc3Qge1xuICBwcm90ZWN0ZWQgX2ZpbGVzVG9DcmVhdGUgPSBuZXcgU2V0PFBhdGg+KCk7XG4gIHByb3RlY3RlZCBfZmlsZXNUb1JlbmFtZSA9IG5ldyBNYXA8UGF0aCwgUGF0aD4oKTtcbiAgcHJvdGVjdGVkIF9maWxlc1RvUmVuYW1lUmV2ZXJ0ID0gbmV3IE1hcDxQYXRoLCBQYXRoPigpO1xuICBwcm90ZWN0ZWQgX2ZpbGVzVG9EZWxldGUgPSBuZXcgU2V0PFBhdGg+KCk7XG4gIHByb3RlY3RlZCBfZmlsZXNUb092ZXJ3cml0ZSA9IG5ldyBTZXQ8UGF0aD4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX2JhY2s6IFJlYWRvbmx5SG9zdCkgeyBzdXBlcigpOyB9XG5cbiAgZ2V0IGJhY2tlbmQoKTogUmVhZG9ubHlIb3N0IHsgcmV0dXJuIHRoaXMuX2JhY2s7IH1cbiAgZ2V0IGNhcGFiaWxpdGllcygpOiBIb3N0Q2FwYWJpbGl0aWVzIHtcbiAgICAvLyBPdXIgb3duIGhvc3QgaXMgYWx3YXlzIFN5bmNocm9ub3VzLCBidXQgdGhlIGJhY2tlbmQgbWlnaHQgbm90IGJlLlxuICAgIHJldHVybiB7XG4gICAgICBzeW5jaHJvbm91czogdGhpcy5fYmFjay5jYXBhYmlsaXRpZXMuc3luY2hyb25vdXMsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBjb3B5IG9mIHRoaXMgaG9zdCwgaW5jbHVkaW5nIGFsbCBhY3Rpb25zIG1hZGUuXG4gICAqIEByZXR1cm5zIHtDb3JkSG9zdH0gVGhlIGNhcmJvbiBjb3B5LlxuICAgKi9cbiAgY2xvbmUoKTogQ29yZEhvc3Qge1xuICAgIGNvbnN0IGRvbGx5ID0gbmV3IENvcmRIb3N0KHRoaXMuX2JhY2spO1xuXG4gICAgZG9sbHkuX2NhY2hlID0gbmV3IE1hcCh0aGlzLl9jYWNoZSk7XG4gICAgZG9sbHkuX2ZpbGVzVG9DcmVhdGUgPSBuZXcgU2V0KHRoaXMuX2ZpbGVzVG9DcmVhdGUpO1xuICAgIGRvbGx5Ll9maWxlc1RvUmVuYW1lID0gbmV3IE1hcCh0aGlzLl9maWxlc1RvUmVuYW1lKTtcbiAgICBkb2xseS5fZmlsZXNUb1JlbmFtZVJldmVydCA9IG5ldyBNYXAodGhpcy5fZmlsZXNUb1JlbmFtZVJldmVydCk7XG4gICAgZG9sbHkuX2ZpbGVzVG9EZWxldGUgPSBuZXcgU2V0KHRoaXMuX2ZpbGVzVG9EZWxldGUpO1xuICAgIGRvbGx5Ll9maWxlc1RvT3ZlcndyaXRlID0gbmV3IFNldCh0aGlzLl9maWxlc1RvT3ZlcndyaXRlKTtcblxuICAgIHJldHVybiBkb2xseTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21taXQgdGhlIGNoYW5nZXMgcmVjb3JkZWQgdG8gYSBIb3N0LiBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIGhvc3QgZG9lcyBoYXZlIHRoZSBzYW1lIHN0cnVjdHVyZVxuICAgKiBhcyB0aGUgaG9zdCB0aGF0IHdhcyB1c2VkIGZvciBiYWNrZW5kIChjb3VsZCBiZSB0aGUgc2FtZSBob3N0KS5cbiAgICogQHBhcmFtIGhvc3QgVGhlIGhvc3QgdG8gY3JlYXRlL2RlbGV0ZS9yZW5hbWUvb3ZlcndyaXRlIGZpbGVzIHRvLlxuICAgKiBAcGFyYW0gZm9yY2UgV2hldGhlciB0byBza2lwIGV4aXN0ZW5jZSBjaGVja3Mgd2hlbiBjcmVhdGluZy9vdmVyd3JpdGluZy4gVGhpcyBpc1xuICAgKiAgIGZhc3RlciBidXQgbWlnaHQgbGVhZCB0byBpbmNvcnJlY3Qgc3RhdGVzLiBCZWNhdXNlIEhvc3RzIG5hdGl2ZWx5IGRvbid0IHN1cHBvcnQgY3JlYXRpb25cbiAgICogICB2ZXJzdXMgb3ZlcndyaXRpbmcgKGl0J3Mgb25seSB3cml0aW5nKSwgd2UgY2hlY2sgZm9yIGV4aXN0ZW5jZSBiZWZvcmUgY29tcGxldGluZyBhIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBjb21wbGV0ZXMgd2hlbiBkb25lLCBvciBlcnJvciBpZiBhbiBlcnJvciBvY2N1cmVkLlxuICAgKi9cbiAgY29tbWl0KGhvc3Q6IEhvc3QsIGZvcmNlID0gZmFsc2UpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICAvLyBSZWFsbHkgY29tbWl0IGV2ZXJ5dGhpbmcgdG8gdGhlIGFjdHVhbCBob3N0LlxuICAgIHJldHVybiBvYnNlcnZhYmxlRnJvbSh0aGlzLnJlY29yZHMoKSkucGlwZShcbiAgICAgIGNvbmNhdE1hcChyZWNvcmQgPT4ge1xuICAgICAgICBzd2l0Y2ggKHJlY29yZC5raW5kKSB7XG4gICAgICAgICAgY2FzZSAnZGVsZXRlJzogcmV0dXJuIGhvc3QuZGVsZXRlKHJlY29yZC5wYXRoKTtcbiAgICAgICAgICBjYXNlICdyZW5hbWUnOiByZXR1cm4gaG9zdC5yZW5hbWUocmVjb3JkLmZyb20sIHJlY29yZC50byk7XG4gICAgICAgICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgICAgICAgIHJldHVybiBob3N0LmV4aXN0cyhyZWNvcmQucGF0aCkucGlwZShcbiAgICAgICAgICAgICAgc3dpdGNoTWFwKGV4aXN0cyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0cyAmJiAhZm9yY2UpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uKHJlY29yZC5wYXRoKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBob3N0LndyaXRlKHJlY29yZC5wYXRoLCByZWNvcmQuY29udGVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgY2FzZSAnb3ZlcndyaXRlJzpcbiAgICAgICAgICAgIHJldHVybiBob3N0LmV4aXN0cyhyZWNvcmQucGF0aCkucGlwZShcbiAgICAgICAgICAgICAgc3dpdGNoTWFwKGV4aXN0cyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFleGlzdHMgJiYgIWZvcmNlKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihyZWNvcmQucGF0aCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gaG9zdC53cml0ZShyZWNvcmQucGF0aCwgcmVjb3JkLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIHJlZHVjZSgoKSA9PiB7fSksXG4gICAgKTtcbiAgfVxuXG4gIHJlY29yZHMoKTogQ29yZEhvc3RSZWNvcmRbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIC4uLlsuLi50aGlzLl9maWxlc1RvRGVsZXRlLnZhbHVlcygpXS5tYXAocGF0aCA9PiAoe1xuICAgICAgICBraW5kOiAnZGVsZXRlJywgcGF0aCxcbiAgICAgIH0pIGFzIENvcmRIb3N0UmVjb3JkKSxcbiAgICAgIC4uLlsuLi50aGlzLl9maWxlc1RvUmVuYW1lLmVudHJpZXMoKV0ubWFwKChbZnJvbSwgdG9dKSA9PiAoe1xuICAgICAgICBraW5kOiAncmVuYW1lJywgZnJvbSwgdG8sXG4gICAgICB9KSBhcyBDb3JkSG9zdFJlY29yZCksXG4gICAgICAuLi5bLi4udGhpcy5fZmlsZXNUb0NyZWF0ZS52YWx1ZXMoKV0ubWFwKHBhdGggPT4gKHtcbiAgICAgICAga2luZDogJ2NyZWF0ZScsIHBhdGgsIGNvbnRlbnQ6IHRoaXMuX3JlYWQocGF0aCksXG4gICAgICB9KSBhcyBDb3JkSG9zdFJlY29yZCksXG4gICAgICAuLi5bLi4udGhpcy5fZmlsZXNUb092ZXJ3cml0ZS52YWx1ZXMoKV0ubWFwKHBhdGggPT4gKHtcbiAgICAgICAga2luZDogJ292ZXJ3cml0ZScsIHBhdGgsIGNvbnRlbnQ6IHRoaXMuX3JlYWQocGF0aCksXG4gICAgICB9KSBhcyBDb3JkSG9zdFJlY29yZCksXG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTcGVjaWFsaXplZCB2ZXJzaW9uIG9mIHtAbGluayBDb3JkSG9zdCN3cml0ZX0gd2hpY2ggZm9yY2VzIHRoZSBjcmVhdGlvbiBvZiBhIGZpbGUgd2hldGhlciBpdFxuICAgKiBleGlzdHMgb3Igbm90LlxuICAgKiBAcGFyYW0ge30gcGF0aFxuICAgKiBAcGFyYW0ge0ZpbGVCdWZmZXJ9IGNvbnRlbnRcbiAgICogQHJldHVybnMge09ic2VydmFibGU8dm9pZD59XG4gICAqL1xuICBjcmVhdGUocGF0aDogUGF0aCwgY29udGVudDogRmlsZUJ1ZmZlcik6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIGlmIChzdXBlci5fZXhpc3RzKHBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZmlsZXNUb0RlbGV0ZS5oYXMocGF0aCkpIHtcbiAgICAgIHRoaXMuX2ZpbGVzVG9EZWxldGUuZGVsZXRlKHBhdGgpO1xuICAgICAgdGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5hZGQocGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2ZpbGVzVG9DcmVhdGUuYWRkKHBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiBzdXBlci53cml0ZShwYXRoLCBjb250ZW50KTtcbiAgfVxuXG4gIG92ZXJ3cml0ZShwYXRoOiBQYXRoLCBjb250ZW50OiBGaWxlQnVmZmVyKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuaXNEaXJlY3RvcnkocGF0aCkucGlwZShcbiAgICAgIHN3aXRjaE1hcChpc0RpciA9PiB7XG4gICAgICAgIGlmIChpc0Rpcikge1xuICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBQYXRoSXNEaXJlY3RvcnlFeGNlcHRpb24ocGF0aCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhpc3RzKHBhdGgpO1xuICAgICAgfSksXG4gICAgICBzd2l0Y2hNYXAoZXhpc3RzID0+IHtcbiAgICAgICAgaWYgKCFleGlzdHMpIHtcbiAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuX2ZpbGVzVG9DcmVhdGUuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgdGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5hZGQocGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VwZXIud3JpdGUocGF0aCwgY29udGVudCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgd3JpdGUocGF0aDogUGF0aCwgY29udGVudDogRmlsZUJ1ZmZlcik6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmV4aXN0cyhwYXRoKS5waXBlKFxuICAgICAgc3dpdGNoTWFwKGV4aXN0cyA9PiB7XG4gICAgICAgIGlmIChleGlzdHMpIHtcbiAgICAgICAgICAvLyBJdCBleGlzdHMsIGJ1dCBtaWdodCBiZSBiZWluZyByZW5hbWVkIG9yIGRlbGV0ZWQuIEluIHRoYXQgY2FzZSB3ZSB3YW50IHRvIGNyZWF0ZSBpdC5cbiAgICAgICAgICBpZiAodGhpcy53aWxsUmVuYW1lKHBhdGgpIHx8IHRoaXMud2lsbERlbGV0ZShwYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKHBhdGgsIGNvbnRlbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vdmVyd3JpdGUocGF0aCwgY29udGVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShwYXRoLCBjb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHJlYWQocGF0aDogUGF0aCk6IE9ic2VydmFibGU8RmlsZUJ1ZmZlcj4ge1xuICAgIGlmICh0aGlzLl9leGlzdHMocGF0aCkpIHtcbiAgICAgIHJldHVybiBzdXBlci5yZWFkKHBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9iYWNrLnJlYWQocGF0aCk7XG4gIH1cblxuICBkZWxldGUocGF0aDogUGF0aCk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9leGlzdHMocGF0aCkpIHtcbiAgICAgIGlmICh0aGlzLl9maWxlc1RvQ3JlYXRlLmhhcyhwYXRoKSkge1xuICAgICAgICB0aGlzLl9maWxlc1RvQ3JlYXRlLmRlbGV0ZShwYXRoKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5oYXMocGF0aCkpIHtcbiAgICAgICAgdGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5kZWxldGUocGF0aCk7XG4gICAgICAgIHRoaXMuX2ZpbGVzVG9EZWxldGUuYWRkKHBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbWF5YmVPcmlnaW4gPSB0aGlzLl9maWxlc1RvUmVuYW1lUmV2ZXJ0LmdldChwYXRoKTtcbiAgICAgICAgaWYgKG1heWJlT3JpZ2luKSB7XG4gICAgICAgICAgdGhpcy5fZmlsZXNUb1JlbmFtZVJldmVydC5kZWxldGUocGF0aCk7XG4gICAgICAgICAgdGhpcy5fZmlsZXNUb1JlbmFtZS5kZWxldGUobWF5YmVPcmlnaW4pO1xuICAgICAgICAgIHRoaXMuX2ZpbGVzVG9EZWxldGUuYWRkKG1heWJlT3JpZ2luKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihcbiAgICAgICAgICAgIG5ldyBVbmtub3duRXhjZXB0aW9uKGBUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4uIFBhdGg6ICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9LmApLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN1cGVyLmRlbGV0ZShwYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2JhY2suZXhpc3RzKHBhdGgpLnBpcGUoXG4gICAgICAgIHN3aXRjaE1hcChleGlzdHMgPT4ge1xuICAgICAgICAgIGlmIChleGlzdHMpIHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbGVzVG9EZWxldGUuYWRkKHBhdGgpO1xuXG4gICAgICAgICAgICByZXR1cm4gb2Y8dm9pZD4oKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHJlbmFtZShmcm9tOiBQYXRoLCB0bzogUGF0aCk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiBjb25jYXQoXG4gICAgICB0aGlzLmV4aXN0cyh0byksXG4gICAgICB0aGlzLmV4aXN0cyhmcm9tKSxcbiAgICApLnBpcGUoXG4gICAgICB0b0FycmF5KCksXG4gICAgICBzd2l0Y2hNYXAoKFtleGlzdFRvLCBleGlzdEZyb21dKSA9PiB7XG4gICAgICAgIGlmICghZXhpc3RGcm9tKSB7XG4gICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24oZnJvbSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmcm9tID09PSB0bykge1xuICAgICAgICAgIHJldHVybiBvZigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV4aXN0VG8pIHtcbiAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbih0bykpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UncmUgcmVuYW1pbmcgYSBmaWxlIHRoYXQncyBiZWVuIGNyZWF0ZWQsIHNob3J0Y2lyY3VpdCB0byBjcmVhdGluZyB0aGUgYHRvYCBwYXRoLlxuICAgICAgICBpZiAodGhpcy5fZmlsZXNUb0NyZWF0ZS5oYXMoZnJvbSkpIHtcbiAgICAgICAgICB0aGlzLl9maWxlc1RvQ3JlYXRlLmRlbGV0ZShmcm9tKTtcbiAgICAgICAgICB0aGlzLl9maWxlc1RvQ3JlYXRlLmFkZCh0byk7XG5cbiAgICAgICAgICByZXR1cm4gc3VwZXIucmVuYW1lKGZyb20sIHRvKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5oYXMoZnJvbSkpIHtcbiAgICAgICAgICB0aGlzLl9maWxlc1RvT3ZlcndyaXRlLmRlbGV0ZShmcm9tKTtcblxuICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IGNhbGwgdGhpcyBmdW5jdGlvbi4gVGhpcyBpcyBzbyB3ZSBkb24ndCByZXBlYXQgdGhlIGJvdHRvbSBsb2dpYy4gVGhpc1xuICAgICAgICAgIC8vIGlmIHdpbGwgYmUgYnktcGFzc2VkIGJlY2F1c2Ugd2UganVzdCBkZWxldGVkIHRoZSBgZnJvbWAgcGF0aCBmcm9tIGZpbGVzIHRvIG92ZXJ3cml0ZS5cbiAgICAgICAgICByZXR1cm4gY29uY2F0KFxuICAgICAgICAgICAgdGhpcy5yZW5hbWUoZnJvbSwgdG8pLFxuICAgICAgICAgICAgbmV3IE9ic2VydmFibGU8bmV2ZXI+KHggPT4ge1xuICAgICAgICAgICAgICB0aGlzLl9maWxlc1RvT3ZlcndyaXRlLmFkZCh0byk7XG4gICAgICAgICAgICAgIHguY29tcGxldGUoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2ZpbGVzVG9EZWxldGUuaGFzKHRvKSkge1xuICAgICAgICAgIHRoaXMuX2ZpbGVzVG9EZWxldGUuZGVsZXRlKHRvKTtcbiAgICAgICAgICB0aGlzLl9maWxlc1RvRGVsZXRlLmFkZChmcm9tKTtcbiAgICAgICAgICB0aGlzLl9maWxlc1RvT3ZlcndyaXRlLmFkZCh0byk7XG5cbiAgICAgICAgICAvLyBXZSBuZWVkIHRvIGRlbGV0ZSB0aGUgb3JpZ2luYWwgYW5kIHdyaXRlIHRoZSBuZXcgb25lLlxuICAgICAgICAgIHJldHVybiB0aGlzLnJlYWQoZnJvbSkucGlwZShcbiAgICAgICAgICAgIG1hcChjb250ZW50ID0+IHRoaXMuX3dyaXRlKHRvLCBjb250ZW50KSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1heWJlVG8xID0gdGhpcy5fZmlsZXNUb1JlbmFtZVJldmVydC5nZXQoZnJvbSk7XG4gICAgICAgIGlmIChtYXliZVRvMSkge1xuICAgICAgICAgIC8vIFdlIGFscmVhZHkgcmVuYW1lZCB0byB0aGlzIGZpbGUgKEEgPT4gZnJvbSksIGxldCdzIHJlbmFtZSB0aGUgZm9ybWVyIHRvIHRoZSBuZXdcbiAgICAgICAgICAvLyBwYXRoIChBID0+IHRvKS5cbiAgICAgICAgICB0aGlzLl9maWxlc1RvUmVuYW1lLmRlbGV0ZShtYXliZVRvMSk7XG4gICAgICAgICAgdGhpcy5fZmlsZXNUb1JlbmFtZVJldmVydC5kZWxldGUoZnJvbSk7XG4gICAgICAgICAgZnJvbSA9IG1heWJlVG8xO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZmlsZXNUb1JlbmFtZS5zZXQoZnJvbSwgdG8pO1xuICAgICAgICB0aGlzLl9maWxlc1RvUmVuYW1lUmV2ZXJ0LnNldCh0bywgZnJvbSk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGZpbGUgaXMgcGFydCBvZiBvdXIgZGF0YSwganVzdCByZW5hbWUgaXQgaW50ZXJuYWxseS5cbiAgICAgICAgaWYgKHRoaXMuX2V4aXN0cyhmcm9tKSkge1xuICAgICAgICAgIHJldHVybiBzdXBlci5yZW5hbWUoZnJvbSwgdG8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENyZWF0ZSBhIGZpbGUgd2l0aCB0aGUgc2FtZSBjb250ZW50LlxuICAgICAgICAgIHJldHVybiB0aGlzLl9iYWNrLnJlYWQoZnJvbSkucGlwZShcbiAgICAgICAgICAgIHN3aXRjaE1hcChjb250ZW50ID0+IHN1cGVyLndyaXRlKHRvLCBjb250ZW50KSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIGxpc3QocGF0aDogUGF0aCk6IE9ic2VydmFibGU8UGF0aEZyYWdtZW50W10+IHtcbiAgICByZXR1cm4gY29uY2F0KFxuICAgICAgc3VwZXIubGlzdChwYXRoKSxcbiAgICAgIHRoaXMuX2JhY2subGlzdChwYXRoKSxcbiAgICApLnBpcGUoXG4gICAgICByZWR1Y2UoKGxpc3Q6IFNldDxQYXRoRnJhZ21lbnQ+LCBjdXJyOiBQYXRoRnJhZ21lbnRbXSkgPT4ge1xuICAgICAgICBjdXJyLmZvckVhY2goZWxlbSA9PiBsaXN0LmFkZChlbGVtKSk7XG5cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgICB9LCBuZXcgU2V0PFBhdGhGcmFnbWVudD4oKSksXG4gICAgICBtYXAoc2V0ID0+IFsuLi5zZXRdKSxcbiAgICApO1xuICB9XG5cbiAgZXhpc3RzKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5fZXhpc3RzKHBhdGgpXG4gICAgICA/IG9mKHRydWUpXG4gICAgICA6ICgodGhpcy53aWxsRGVsZXRlKHBhdGgpIHx8IHRoaXMud2lsbFJlbmFtZShwYXRoKSkgPyBvZihmYWxzZSkgOiB0aGlzLl9iYWNrLmV4aXN0cyhwYXRoKSk7XG4gIH1cbiAgaXNEaXJlY3RvcnkocGF0aDogUGF0aCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLl9leGlzdHMocGF0aCkgPyBzdXBlci5pc0RpcmVjdG9yeShwYXRoKSA6IHRoaXMuX2JhY2suaXNEaXJlY3RvcnkocGF0aCk7XG4gIH1cbiAgaXNGaWxlKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5fZXhpc3RzKHBhdGgpXG4gICAgICA/IHN1cGVyLmlzRmlsZShwYXRoKVxuICAgICAgOiAoKHRoaXMud2lsbERlbGV0ZShwYXRoKSB8fCB0aGlzLndpbGxSZW5hbWUocGF0aCkpID8gb2YoZmFsc2UpIDogdGhpcy5fYmFjay5pc0ZpbGUocGF0aCkpO1xuICB9XG5cbiAgc3RhdChwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxTdGF0cyB8IG51bGw+IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2V4aXN0cyhwYXRoKVxuICAgICAgPyBzdXBlci5zdGF0KHBhdGgpXG4gICAgICA6ICgodGhpcy53aWxsRGVsZXRlKHBhdGgpIHx8IHRoaXMud2lsbFJlbmFtZShwYXRoKSkgPyBvZihudWxsKSA6IHRoaXMuX2JhY2suc3RhdChwYXRoKSk7XG4gIH1cblxuICB3YXRjaChwYXRoOiBQYXRoLCBvcHRpb25zPzogSG9zdFdhdGNoT3B0aW9ucykge1xuICAgIC8vIFdhdGNoaW5nIG5vdCBzdXBwb3J0ZWQuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB3aWxsQ3JlYXRlKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fZmlsZXNUb0NyZWF0ZS5oYXMocGF0aCk7XG4gIH1cbiAgd2lsbE92ZXJ3cml0ZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpbGVzVG9PdmVyd3JpdGUuaGFzKHBhdGgpO1xuICB9XG4gIHdpbGxEZWxldGUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9maWxlc1RvRGVsZXRlLmhhcyhwYXRoKTtcbiAgfVxuICB3aWxsUmVuYW1lKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fZmlsZXNUb1JlbmFtZS5oYXMocGF0aCk7XG4gIH1cbiAgd2lsbFJlbmFtZVRvKHBhdGg6IFBhdGgsIHRvOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpbGVzVG9SZW5hbWUuZ2V0KHBhdGgpID09PSB0bztcbiAgfVxufVxuIl19