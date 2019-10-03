"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const fs_1 = require("fs");
const path_1 = require("path");
const export_ref_1 = require("./export-ref");
const file_system_engine_host_base_1 = require("./file-system-engine-host-base");
/**
 * A simple EngineHost that uses a root with one directory per collection inside of it. The
 * collection declaration follows the same rules as the regular FileSystemEngineHostBase.
 */
class FileSystemEngineHost extends file_system_engine_host_base_1.FileSystemEngineHostBase {
    constructor(_root) {
        super();
        this._root = _root;
    }
    _resolveCollectionPath(name) {
        try {
            // Allow `${_root}/${name}.json` as a collection.
            const maybePath = require.resolve(path_1.join(this._root, name + '.json'));
            if (fs_1.existsSync(maybePath)) {
                return maybePath;
            }
        }
        catch (error) { }
        try {
            // Allow `${_root}/${name}/collection.json.
            const maybePath = require.resolve(path_1.join(this._root, name, 'collection.json'));
            if (fs_1.existsSync(maybePath)) {
                return maybePath;
            }
        }
        catch (error) { }
        throw new file_system_engine_host_base_1.CollectionCannotBeResolvedException(name);
    }
    _resolveReferenceString(refString, parentPath) {
        // Use the same kind of export strings as NodeModule.
        const ref = new export_ref_1.ExportStringRef(refString, parentPath);
        if (!ref.ref) {
            return null;
        }
        return { ref: ref.ref, path: ref.module };
    }
    _transformCollectionDescription(name, desc) {
        if (!desc.schematics || typeof desc.schematics != 'object') {
            throw new file_system_engine_host_base_1.CollectionMissingSchematicsMapException(name);
        }
        return Object.assign({}, desc, { name });
    }
    _transformSchematicDescription(name, _collection, desc) {
        if (!desc.factoryFn || !desc.path || !desc.description) {
            throw new file_system_engine_host_base_1.SchematicMissingFieldsException(name);
        }
        return desc;
    }
}
exports.FileSystemEngineHost = FileSystemEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwyQkFBZ0M7QUFDaEMsK0JBQTRCO0FBRzVCLDZDQUErQztBQUMvQyxpRkFLd0M7QUFHeEM7OztHQUdHO0FBQ0gsTUFBYSxvQkFBcUIsU0FBUSx1REFBd0I7SUFDaEUsWUFBc0IsS0FBYTtRQUFJLEtBQUssRUFBRSxDQUFDO1FBQXpCLFVBQUssR0FBTCxLQUFLLENBQVE7SUFBYSxDQUFDO0lBRXZDLHNCQUFzQixDQUFDLElBQVk7UUFDM0MsSUFBSTtZQUNGLGlEQUFpRDtZQUNqRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLElBQUksZUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUN6QixPQUFPLFNBQVMsQ0FBQzthQUNsQjtTQUNGO1FBQUMsT0FBTyxLQUFLLEVBQUUsR0FBRztRQUVuQixJQUFJO1lBQ0YsMkNBQTJDO1lBQzNDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUM3RSxJQUFJLGVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDekIsT0FBTyxTQUFTLENBQUM7YUFDbEI7U0FDRjtRQUFDLE9BQU8sS0FBSyxFQUFFLEdBQUc7UUFHbkIsTUFBTSxJQUFJLGtFQUFtQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFUyx1QkFBdUIsQ0FBQyxTQUFpQixFQUFFLFVBQWtCO1FBQ3JFLHFEQUFxRDtRQUNyRCxNQUFNLEdBQUcsR0FBRyxJQUFJLDRCQUFlLENBQWtCLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN4RSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtZQUNaLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBRVMsK0JBQStCLENBQ3ZDLElBQVksRUFDWixJQUF1QztRQUV2QyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxPQUFPLElBQUksQ0FBQyxVQUFVLElBQUksUUFBUSxFQUFFO1lBQzFELE1BQU0sSUFBSSxzRUFBdUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN6RDtRQUVELE9BQU8sa0JBQ0YsSUFBSSxJQUNQLElBQUksR0FDdUIsQ0FBQztJQUNoQyxDQUFDO0lBRVMsOEJBQThCLENBQ3RDLElBQVksRUFDWixXQUFxQyxFQUNyQyxJQUFzQztRQUV0QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3RELE1BQU0sSUFBSSw4REFBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNqRDtRQUVELE9BQU8sSUFBK0IsQ0FBQztJQUN6QyxDQUFDO0NBQ0Y7QUEzREQsb0RBMkRDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IFJ1bGVGYWN0b3J5IH0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYywgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MgfSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IEV4cG9ydFN0cmluZ1JlZiB9IGZyb20gJy4vZXhwb3J0LXJlZic7XG5pbXBvcnQge1xuICBDb2xsZWN0aW9uQ2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbixcbiAgQ29sbGVjdGlvbk1pc3NpbmdTY2hlbWF0aWNzTWFwRXhjZXB0aW9uLFxuICBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2UsXG4gIFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24sXG59IGZyb20gJy4vZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZSc7XG5cblxuLyoqXG4gKiBBIHNpbXBsZSBFbmdpbmVIb3N0IHRoYXQgdXNlcyBhIHJvb3Qgd2l0aCBvbmUgZGlyZWN0b3J5IHBlciBjb2xsZWN0aW9uIGluc2lkZSBvZiBpdC4gVGhlXG4gKiBjb2xsZWN0aW9uIGRlY2xhcmF0aW9uIGZvbGxvd3MgdGhlIHNhbWUgcnVsZXMgYXMgdGhlIHJlZ3VsYXIgRmlsZVN5c3RlbUVuZ2luZUhvc3RCYXNlLlxuICovXG5leHBvcnQgY2xhc3MgRmlsZVN5c3RlbUVuZ2luZUhvc3QgZXh0ZW5kcyBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2Uge1xuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX3Jvb3Q6IHN0cmluZykgeyBzdXBlcigpOyB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgLy8gQWxsb3cgYCR7X3Jvb3R9LyR7bmFtZX0uanNvbmAgYXMgYSBjb2xsZWN0aW9uLlxuICAgICAgY29uc3QgbWF5YmVQYXRoID0gcmVxdWlyZS5yZXNvbHZlKGpvaW4odGhpcy5fcm9vdCwgbmFtZSArICcuanNvbicpKTtcbiAgICAgIGlmIChleGlzdHNTeW5jKG1heWJlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIG1heWJlUGF0aDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikgeyB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gQWxsb3cgYCR7X3Jvb3R9LyR7bmFtZX0vY29sbGVjdGlvbi5qc29uLlxuICAgICAgY29uc3QgbWF5YmVQYXRoID0gcmVxdWlyZS5yZXNvbHZlKGpvaW4odGhpcy5fcm9vdCwgbmFtZSwgJ2NvbGxlY3Rpb24uanNvbicpKTtcbiAgICAgIGlmIChleGlzdHNTeW5jKG1heWJlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIG1heWJlUGF0aDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikgeyB9XG5cblxuICAgIHRocm93IG5ldyBDb2xsZWN0aW9uQ2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbihuYW1lKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZVJlZmVyZW5jZVN0cmluZyhyZWZTdHJpbmc6IHN0cmluZywgcGFyZW50UGF0aDogc3RyaW5nKSB7XG4gICAgLy8gVXNlIHRoZSBzYW1lIGtpbmQgb2YgZXhwb3J0IHN0cmluZ3MgYXMgTm9kZU1vZHVsZS5cbiAgICBjb25zdCByZWYgPSBuZXcgRXhwb3J0U3RyaW5nUmVmPFJ1bGVGYWN0b3J5PHt9Pj4ocmVmU3RyaW5nLCBwYXJlbnRQYXRoKTtcbiAgICBpZiAoIXJlZi5yZWYpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7IHJlZjogcmVmLnJlZiwgcGF0aDogcmVmLm1vZHVsZSB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjPixcbiAgKTogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjIHtcbiAgICBpZiAoIWRlc2Muc2NoZW1hdGljcyB8fCB0eXBlb2YgZGVzYy5zY2hlbWF0aWNzICE9ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgQ29sbGVjdGlvbk1pc3NpbmdTY2hlbWF0aWNzTWFwRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAuLi5kZXNjLFxuICAgICAgbmFtZSxcbiAgICB9IGFzIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYztcbiAgfVxuXG4gIHByb3RlY3RlZCBfdHJhbnNmb3JtU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIF9jb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4sXG4gICk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjIHtcbiAgICBpZiAoIWRlc2MuZmFjdG9yeUZuIHx8ICFkZXNjLnBhdGggfHwgIWRlc2MuZGVzY3JpcHRpb24pIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNNaXNzaW5nRmllbGRzRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBkZXNjIGFzIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjO1xuICB9XG59XG4iXX0=