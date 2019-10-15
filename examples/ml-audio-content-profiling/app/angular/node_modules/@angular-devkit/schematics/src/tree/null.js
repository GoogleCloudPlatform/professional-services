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
const exception_1 = require("../exception/exception");
const interface_1 = require("./interface");
const recorder_1 = require("./recorder");
class CannotCreateFileException extends core_1.BaseException {
    constructor(path) { super(`Cannot create file "${path}".`); }
}
exports.CannotCreateFileException = CannotCreateFileException;
class NullTreeDirEntry {
    constructor(path) {
        this.path = path;
        this.subdirs = [];
        this.subfiles = [];
    }
    get parent() {
        return this.path == '/' ? null : new NullTreeDirEntry(core_1.dirname(this.path));
    }
    dir(name) {
        return new NullTreeDirEntry(core_1.join(this.path, name));
    }
    file(_name) { return null; }
    visit() { }
}
exports.NullTreeDirEntry = NullTreeDirEntry;
class NullTree {
    constructor() {
        this.root = new NullTreeDirEntry(core_1.normalize('/'));
    }
    [interface_1.TreeSymbol]() {
        return this;
    }
    branch() {
        return new NullTree();
    }
    merge(_other, _strategy) { }
    // Simple readonly file system operations.
    exists(_path) { return false; }
    read(_path) { return null; }
    get(_path) { return null; }
    getDir(path) { return new NullTreeDirEntry(core_1.normalize('/' + path)); }
    visit() { }
    // Change content of host files.
    beginUpdate(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    commitUpdate(record) {
        throw new exception_1.FileDoesNotExistException(record instanceof recorder_1.UpdateRecorderBase
            ? record.path
            : '<unknown>');
    }
    // Change structure of the host.
    copy(path, _to) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    delete(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    create(path, _content) {
        throw new CannotCreateFileException(path);
    }
    rename(path, _to) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    overwrite(path, _content) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    apply(_action, _strategy) { }
    get actions() {
        return [];
    }
}
exports.NullTree = NullTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvdHJlZS9udWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBTzhCO0FBQzlCLHNEQUFtRTtBQUVuRSwyQ0FBd0Y7QUFDeEYseUNBQWdEO0FBR2hELE1BQWEseUJBQTBCLFNBQVEsb0JBQWE7SUFDMUQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLHVCQUF1QixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN0RTtBQUZELDhEQUVDO0FBR0QsTUFBYSxnQkFBZ0I7SUFLM0IsWUFBNEIsSUFBVTtRQUFWLFNBQUksR0FBSixJQUFJLENBQU07UUFFN0IsWUFBTyxHQUFtQixFQUFFLENBQUM7UUFDN0IsYUFBUSxHQUFtQixFQUFFLENBQUM7SUFIRSxDQUFDO0lBSjFDLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxjQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQU9ELEdBQUcsQ0FBQyxJQUFrQjtRQUNwQixPQUFPLElBQUksZ0JBQWdCLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBQ0QsSUFBSSxDQUFDLEtBQW1CLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRTFDLEtBQUssS0FBSSxDQUFDO0NBQ1g7QUFoQkQsNENBZ0JDO0FBR0QsTUFBYSxRQUFRO0lBQXJCO1FBVVcsU0FBSSxHQUFhLElBQUksZ0JBQWdCLENBQUMsZ0JBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBd0NqRSxDQUFDO0lBakRDLENBQUMsc0JBQVUsQ0FBQztRQUNWLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU07UUFDSixPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUNELEtBQUssQ0FBQyxNQUFZLEVBQUUsU0FBeUIsSUFBUyxDQUFDO0lBSXZELDBDQUEwQztJQUMxQyxNQUFNLENBQUMsS0FBYSxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztJQUN2QyxJQUFJLENBQUMsS0FBYSxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNwQyxHQUFHLENBQUMsS0FBYSxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuQyxNQUFNLENBQUMsSUFBWSxJQUFJLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxnQkFBUyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RSxLQUFLLEtBQUksQ0FBQztJQUVWLGdDQUFnQztJQUNoQyxXQUFXLENBQUMsSUFBWTtRQUN0QixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELFlBQVksQ0FBQyxNQUFzQjtRQUNqQyxNQUFNLElBQUkscUNBQXlCLENBQUMsTUFBTSxZQUFZLDZCQUFrQjtZQUN0RSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUk7WUFDYixDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbkIsQ0FBQztJQUVELGdDQUFnQztJQUNoQyxJQUFJLENBQUMsSUFBWSxFQUFFLEdBQVc7UUFDNUIsTUFBTSxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBWTtRQUNqQixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFZLEVBQUUsUUFBeUI7UUFDNUMsTUFBTSxJQUFJLHlCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBWSxFQUFFLEdBQVc7UUFDOUIsTUFBTSxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRCxTQUFTLENBQUMsSUFBWSxFQUFFLFFBQXlCO1FBQy9DLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQWUsRUFBRSxTQUF5QixJQUFTLENBQUM7SUFDMUQsSUFBSSxPQUFPO1FBQ1QsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0NBQ0Y7QUFsREQsNEJBa0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgQmFzZUV4Y2VwdGlvbixcbiAgUGF0aCxcbiAgUGF0aEZyYWdtZW50LFxuICBkaXJuYW1lLFxuICBqb2luLFxuICBub3JtYWxpemUsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24gfSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7IEFjdGlvbiB9IGZyb20gJy4vYWN0aW9uJztcbmltcG9ydCB7IERpckVudHJ5LCBNZXJnZVN0cmF0ZWd5LCBUcmVlLCBUcmVlU3ltYm9sLCBVcGRhdGVSZWNvcmRlciB9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IFVwZGF0ZVJlY29yZGVyQmFzZSB9IGZyb20gJy4vcmVjb3JkZXInO1xuXG5cbmV4cG9ydCBjbGFzcyBDYW5ub3RDcmVhdGVGaWxlRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykgeyBzdXBlcihgQ2Fubm90IGNyZWF0ZSBmaWxlIFwiJHtwYXRofVwiLmApOyB9XG59XG5cblxuZXhwb3J0IGNsYXNzIE51bGxUcmVlRGlyRW50cnkgaW1wbGVtZW50cyBEaXJFbnRyeSB7XG4gIGdldCBwYXJlbnQoKTogRGlyRW50cnkgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5wYXRoID09ICcvJyA/IG51bGwgOiBuZXcgTnVsbFRyZWVEaXJFbnRyeShkaXJuYW1lKHRoaXMucGF0aCkpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHBhdGg6IFBhdGgpIHt9XG5cbiAgcmVhZG9ubHkgc3ViZGlyczogUGF0aEZyYWdtZW50W10gPSBbXTtcbiAgcmVhZG9ubHkgc3ViZmlsZXM6IFBhdGhGcmFnbWVudFtdID0gW107XG5cbiAgZGlyKG5hbWU6IFBhdGhGcmFnbWVudCk6IERpckVudHJ5IHtcbiAgICByZXR1cm4gbmV3IE51bGxUcmVlRGlyRW50cnkoam9pbih0aGlzLnBhdGgsIG5hbWUpKTtcbiAgfVxuICBmaWxlKF9uYW1lOiBQYXRoRnJhZ21lbnQpIHsgcmV0dXJuIG51bGw7IH1cblxuICB2aXNpdCgpIHt9XG59XG5cblxuZXhwb3J0IGNsYXNzIE51bGxUcmVlIGltcGxlbWVudHMgVHJlZSB7XG4gIFtUcmVlU3ltYm9sXSgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGJyYW5jaCgpOiBUcmVlIHtcbiAgICByZXR1cm4gbmV3IE51bGxUcmVlKCk7XG4gIH1cbiAgbWVyZ2UoX290aGVyOiBUcmVlLCBfc3RyYXRlZ3k/OiBNZXJnZVN0cmF0ZWd5KTogdm9pZCB7fVxuXG4gIHJlYWRvbmx5IHJvb3Q6IERpckVudHJ5ID0gbmV3IE51bGxUcmVlRGlyRW50cnkobm9ybWFsaXplKCcvJykpO1xuXG4gIC8vIFNpbXBsZSByZWFkb25seSBmaWxlIHN5c3RlbSBvcGVyYXRpb25zLlxuICBleGlzdHMoX3BhdGg6IHN0cmluZykgeyByZXR1cm4gZmFsc2U7IH1cbiAgcmVhZChfcGF0aDogc3RyaW5nKSB7IHJldHVybiBudWxsOyB9XG4gIGdldChfcGF0aDogc3RyaW5nKSB7IHJldHVybiBudWxsOyB9XG4gIGdldERpcihwYXRoOiBzdHJpbmcpIHsgcmV0dXJuIG5ldyBOdWxsVHJlZURpckVudHJ5KG5vcm1hbGl6ZSgnLycgKyBwYXRoKSk7IH1cbiAgdmlzaXQoKSB7fVxuXG4gIC8vIENoYW5nZSBjb250ZW50IG9mIGhvc3QgZmlsZXMuXG4gIGJlZ2luVXBkYXRlKHBhdGg6IHN0cmluZyk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuICBjb21taXRVcGRhdGUocmVjb3JkOiBVcGRhdGVSZWNvcmRlcik6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihyZWNvcmQgaW5zdGFuY2VvZiBVcGRhdGVSZWNvcmRlckJhc2VcbiAgICAgID8gcmVjb3JkLnBhdGhcbiAgICAgIDogJzx1bmtub3duPicpO1xuICB9XG5cbiAgLy8gQ2hhbmdlIHN0cnVjdHVyZSBvZiB0aGUgaG9zdC5cbiAgY29weShwYXRoOiBzdHJpbmcsIF90bzogc3RyaW5nKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICB9XG4gIGRlbGV0ZShwYXRoOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cbiAgY3JlYXRlKHBhdGg6IHN0cmluZywgX2NvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgQ2Fubm90Q3JlYXRlRmlsZUV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuICByZW5hbWUocGF0aDogc3RyaW5nLCBfdG86IHN0cmluZyk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuICBvdmVyd3JpdGUocGF0aDogc3RyaW5nLCBfY29udGVudDogQnVmZmVyIHwgc3RyaW5nKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICB9XG5cbiAgYXBwbHkoX2FjdGlvbjogQWN0aW9uLCBfc3RyYXRlZ3k/OiBNZXJnZVN0cmF0ZWd5KTogdm9pZCB7fVxuICBnZXQgYWN0aW9ucygpOiBBY3Rpb25bXSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG4iXX0=