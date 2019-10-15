"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path = require("path");
function findUp(names, from) {
    if (!Array.isArray(names)) {
        names = [names];
    }
    const root = path.parse(from).root;
    let currentDir = from;
    while (currentDir && currentDir !== root) {
        for (const name of names) {
            const p = path.join(currentDir, name);
            if (fs_1.existsSync(p)) {
                return p;
            }
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}
exports.findUp = findUp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC11cC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvdXRpbGl0aWVzL2ZpbmQtdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwyQkFBZ0M7QUFDaEMsNkJBQTZCO0FBRTdCLFNBQWdCLE1BQU0sQ0FBQyxLQUF3QixFQUFFLElBQVk7SUFDM0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDekIsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDakI7SUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQztJQUVuQyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFDdEIsT0FBTyxVQUFVLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtRQUN4QyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN4QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0QyxJQUFJLGVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakIsT0FBTyxDQUFDLENBQUM7YUFDVjtTQUNGO1FBRUQsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDdkM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFuQkQsd0JBbUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRVcChuYW1lczogc3RyaW5nIHwgc3RyaW5nW10sIGZyb206IHN0cmluZykge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobmFtZXMpKSB7XG4gICAgbmFtZXMgPSBbbmFtZXNdO1xuICB9XG4gIGNvbnN0IHJvb3QgPSBwYXRoLnBhcnNlKGZyb20pLnJvb3Q7XG5cbiAgbGV0IGN1cnJlbnREaXIgPSBmcm9tO1xuICB3aGlsZSAoY3VycmVudERpciAmJiBjdXJyZW50RGlyICE9PSByb290KSB7XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgICBjb25zdCBwID0gcGF0aC5qb2luKGN1cnJlbnREaXIsIG5hbWUpO1xuICAgICAgaWYgKGV4aXN0c1N5bmMocCkpIHtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3VycmVudERpciA9IHBhdGguZGlybmFtZShjdXJyZW50RGlyKTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuIl19