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
exports.NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');
// NOTE: @types/webpack InputFileSystem is missing some methods
class VirtualFileSystemDecorator {
    constructor(_inputFileSystem, _webpackCompilerHost) {
        this._inputFileSystem = _inputFileSystem;
        this._webpackCompilerHost = _webpackCompilerHost;
    }
    getVirtualFilesPaths() {
        return this._webpackCompilerHost.getNgFactoryPaths();
    }
    stat(path, callback) {
        try {
            // tslint:disable-next-line:no-any
            callback(null, this._webpackCompilerHost.stat(path));
        }
        catch (e) {
            // tslint:disable-next-line:no-any
            callback(e, undefined);
        }
    }
    readdir(path, callback) {
        // tslint:disable-next-line:no-any
        this._inputFileSystem.readdir(path, callback);
    }
    readFile(path, callback) {
        try {
            // tslint:disable-next-line:no-any
            callback(null, this._webpackCompilerHost.readFileBuffer(path));
        }
        catch (e) {
            // tslint:disable-next-line:no-any
            callback(e, undefined);
        }
    }
    readJson(path, callback) {
        // tslint:disable-next-line:no-any
        this._inputFileSystem.readJson(path, callback);
    }
    readlink(path, callback) {
        this._inputFileSystem.readlink(path, callback);
    }
    statSync(path) {
        const stats = this._webpackCompilerHost.stat(path);
        if (stats === null) {
            throw new core_1.FileDoesNotExistException(path);
        }
        return stats;
    }
    readdirSync(path) {
        // tslint:disable-next-line:no-any
        return this._inputFileSystem.readdirSync(path);
    }
    readFileSync(path) {
        return this._webpackCompilerHost.readFileBuffer(path);
    }
    readJsonSync(path) {
        // tslint:disable-next-line:no-any
        return this._inputFileSystem.readJsonSync(path);
    }
    readlinkSync(path) {
        return this._inputFileSystem.readlinkSync(path);
    }
    purge(changes) {
        if (typeof changes === 'string') {
            this._webpackCompilerHost.invalidate(changes);
        }
        else if (Array.isArray(changes)) {
            changes.forEach((fileName) => this._webpackCompilerHost.invalidate(fileName));
        }
        if (this._inputFileSystem.purge) {
            // tslint:disable-next-line:no-any
            this._inputFileSystem.purge(changes);
        }
    }
}
exports.VirtualFileSystemDecorator = VirtualFileSystemDecorator;
class VirtualWatchFileSystemDecorator extends exports.NodeWatchFileSystem {
    constructor(_virtualInputFileSystem, _replacements) {
        super(_virtualInputFileSystem);
        this._virtualInputFileSystem = _virtualInputFileSystem;
        this._replacements = _replacements;
    }
    watch(files, dirs, missing, startTime, options, callback, // tslint:disable-line:no-any
    callbackUndelayed) {
        const reverseReplacements = new Map();
        const reverseTimestamps = (map) => {
            for (const entry of Array.from(map.entries())) {
                const original = reverseReplacements.get(entry[0]);
                if (original) {
                    map.set(original, entry[1]);
                    map.delete(entry[0]);
                }
            }
            return map;
        };
        const newCallbackUndelayed = (filename, timestamp) => {
            const original = reverseReplacements.get(filename);
            if (original) {
                this._virtualInputFileSystem.purge(original);
                callbackUndelayed(original, timestamp);
            }
            else {
                callbackUndelayed(filename, timestamp);
            }
        };
        const newCallback = (err, filesModified, contextModified, missingModified, fileTimestamps, contextTimestamps) => {
            // Update fileTimestamps with timestamps from virtual files.
            const virtualFilesStats = this._virtualInputFileSystem.getVirtualFilesPaths()
                .map((fileName) => ({
                path: fileName,
                mtime: +this._virtualInputFileSystem.statSync(fileName).mtime,
            }));
            virtualFilesStats.forEach(stats => fileTimestamps.set(stats.path, +stats.mtime));
            callback(err, filesModified.map(value => reverseReplacements.get(value) || value), contextModified.map(value => reverseReplacements.get(value) || value), missingModified.map(value => reverseReplacements.get(value) || value), reverseTimestamps(fileTimestamps), reverseTimestamps(contextTimestamps));
        };
        const mapReplacements = (original) => {
            if (!this._replacements) {
                return original;
            }
            const replacements = this._replacements;
            return original.map(file => {
                if (typeof replacements === 'function') {
                    const replacement = core_1.getSystemPath(replacements(core_1.normalize(file)));
                    if (replacement !== file) {
                        reverseReplacements.set(replacement, file);
                    }
                    return replacement;
                }
                else {
                    const replacement = replacements.get(core_1.normalize(file));
                    if (replacement) {
                        const fullReplacement = core_1.getSystemPath(replacement);
                        reverseReplacements.set(fullReplacement, file);
                        return fullReplacement;
                    }
                    else {
                        return file;
                    }
                }
            });
        };
        const watcher = super.watch(mapReplacements(files), mapReplacements(dirs), mapReplacements(missing), startTime, options, newCallback, newCallbackUndelayed);
        return {
            close: () => watcher.close(),
            pause: () => watcher.pause(),
            getFileTimestamps: () => reverseTimestamps(watcher.getFileTimestamps()),
            getContextTimestamps: () => reverseTimestamps(watcher.getContextTimestamps()),
        };
    }
}
exports.VirtualWatchFileSystemDecorator = VirtualWatchFileSystemDecorator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbF9maWxlX3N5c3RlbV9kZWNvcmF0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvdmlydHVhbF9maWxlX3N5c3RlbV9kZWNvcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBaUc7QUFNcEYsUUFBQSxtQkFBbUIsR0FBaUMsT0FBTyxDQUN0RSxzQ0FBc0MsQ0FBQyxDQUFDO0FBRTFDLCtEQUErRDtBQUMvRCxNQUFhLDBCQUEwQjtJQUNyQyxZQUNVLGdCQUFpQyxFQUNqQyxvQkFBeUM7UUFEekMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtRQUNqQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXFCO0lBQy9DLENBQUM7SUFFTCxvQkFBb0I7UUFDbEIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUN2RCxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVksRUFBRSxRQUE0QztRQUM3RCxJQUFJO1lBQ0Ysa0NBQWtDO1lBQ2xDLFFBQVEsQ0FBQyxJQUFXLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQVEsQ0FBQyxDQUFDO1NBQ3BFO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixrQ0FBa0M7WUFDbEMsUUFBUSxDQUFDLENBQUMsRUFBRSxTQUFnQixDQUFDLENBQUM7U0FDL0I7SUFDSCxDQUFDO0lBRUQsT0FBTyxDQUFDLElBQVksRUFBRSxRQUE0QjtRQUNoRCxrQ0FBa0M7UUFDakMsSUFBSSxDQUFDLGdCQUF3QixDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFZLEVBQUUsUUFBZ0Q7UUFDckUsSUFBSTtZQUNGLGtDQUFrQztZQUNsQyxRQUFRLENBQUMsSUFBVyxFQUFFLElBQUksQ0FBQyxv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QU8sV0FBVyxDQUFDO2lCQUNwQjtxQkFBTTtvQkFDTCxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLGdCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDdEQsSUFBSSxXQUFXLEVBQUU7d0JBQ2YsTUFBTSxlQUFlLEdBQUcsb0JBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQzt3QkFDbkQsbUJBQW1CLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFFL0MsT0FBTyxlQUFlLENBQUM7cUJBQ3hCO3lCQUFNO3dCQUNMLE9BQU8sSUFBSSxDQUFDO3FCQUNiO2lCQUNGO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUN6QixlQUFlLENBQUMsS0FBSyxDQUFDLEVBQ3RCLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFDckIsZUFBZSxDQUFDLE9BQU8sQ0FBQyxFQUN4QixTQUFTLEVBQ1QsT0FBTyxFQUNQLFdBQVcsRUFDWCxvQkFBb0IsQ0FDckIsQ0FBQztRQUVGLE9BQU87WUFDTCxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtZQUM1QixLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtZQUM1QixpQkFBaUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN2RSxvQkFBb0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUM5RSxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBOUdELDBFQThHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24sIFBhdGgsIGdldFN5c3RlbVBhdGgsIG5vcm1hbGl6ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFN0YXRzIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgSW5wdXRGaWxlU3lzdGVtIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBXZWJwYWNrQ29tcGlsZXJIb3N0IH0gZnJvbSAnLi9jb21waWxlcl9ob3N0JztcbmltcG9ydCB7IENhbGxiYWNrLCBOb2RlV2F0Y2hGaWxlU3lzdGVtSW50ZXJmYWNlIH0gZnJvbSAnLi93ZWJwYWNrJztcblxuZXhwb3J0IGNvbnN0IE5vZGVXYXRjaEZpbGVTeXN0ZW06IE5vZGVXYXRjaEZpbGVTeXN0ZW1JbnRlcmZhY2UgPSByZXF1aXJlKFxuICAnd2VicGFjay9saWIvbm9kZS9Ob2RlV2F0Y2hGaWxlU3lzdGVtJyk7XG5cbi8vIE5PVEU6IEB0eXBlcy93ZWJwYWNrIElucHV0RmlsZVN5c3RlbSBpcyBtaXNzaW5nIHNvbWUgbWV0aG9kc1xuZXhwb3J0IGNsYXNzIFZpcnR1YWxGaWxlU3lzdGVtRGVjb3JhdG9yIGltcGxlbWVudHMgSW5wdXRGaWxlU3lzdGVtIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfaW5wdXRGaWxlU3lzdGVtOiBJbnB1dEZpbGVTeXN0ZW0sXG4gICAgcHJpdmF0ZSBfd2VicGFja0NvbXBpbGVySG9zdDogV2VicGFja0NvbXBpbGVySG9zdCxcbiAgKSB7IH1cblxuICBnZXRWaXJ0dWFsRmlsZXNQYXRocygpIHtcbiAgICByZXR1cm4gdGhpcy5fd2VicGFja0NvbXBpbGVySG9zdC5nZXROZ0ZhY3RvcnlQYXRocygpO1xuICB9XG5cbiAgc3RhdChwYXRoOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyOiBFcnJvciwgc3RhdHM6IFN0YXRzKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAgIGNhbGxiYWNrKG51bGwgYXMgYW55LCB0aGlzLl93ZWJwYWNrQ29tcGlsZXJIb3N0LnN0YXQocGF0aCkgYXMgYW55KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICBjYWxsYmFjayhlLCB1bmRlZmluZWQgYXMgYW55KTtcbiAgICB9XG4gIH1cblxuICByZWFkZGlyKHBhdGg6IHN0cmluZywgY2FsbGJhY2s6IENhbGxiYWNrPHN0cmluZ1tdPik6IHZvaWQge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAodGhpcy5faW5wdXRGaWxlU3lzdGVtIGFzIGFueSkucmVhZGRpcihwYXRoLCBjYWxsYmFjayk7XG4gIH1cblxuICByZWFkRmlsZShwYXRoOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyOiBFcnJvciwgY29udGVudHM6IEJ1ZmZlcikgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICBjYWxsYmFjayhudWxsIGFzIGFueSwgdGhpcy5fd2VicGFja0NvbXBpbGVySG9zdC5yZWFkRmlsZUJ1ZmZlcihwYXRoKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgICAgY2FsbGJhY2soZSwgdW5kZWZpbmVkIGFzIGFueSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZEpzb24ocGF0aDogc3RyaW5nLCBjYWxsYmFjazogQ2FsbGJhY2s8e30+KTogdm9pZCB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgICh0aGlzLl9pbnB1dEZpbGVTeXN0ZW0gYXMgYW55KS5yZWFkSnNvbihwYXRoLCBjYWxsYmFjayk7XG4gIH1cblxuICByZWFkbGluayhwYXRoOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyOiBFcnJvciwgbGlua1N0cmluZzogc3RyaW5nKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5faW5wdXRGaWxlU3lzdGVtLnJlYWRsaW5rKHBhdGgsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHN0YXRTeW5jKHBhdGg6IHN0cmluZyk6IFN0YXRzIHtcbiAgICBjb25zdCBzdGF0cyA9IHRoaXMuX3dlYnBhY2tDb21waWxlckhvc3Quc3RhdChwYXRoKTtcbiAgICBpZiAoc3RhdHMgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiBzdGF0cztcbiAgfVxuXG4gIHJlYWRkaXJTeW5jKHBhdGg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgcmV0dXJuICh0aGlzLl9pbnB1dEZpbGVTeXN0ZW0gYXMgYW55KS5yZWFkZGlyU3luYyhwYXRoKTtcbiAgfVxuXG4gIHJlYWRGaWxlU3luYyhwYXRoOiBzdHJpbmcpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLl93ZWJwYWNrQ29tcGlsZXJIb3N0LnJlYWRGaWxlQnVmZmVyKHBhdGgpO1xuICB9XG5cbiAgcmVhZEpzb25TeW5jKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIHJldHVybiAodGhpcy5faW5wdXRGaWxlU3lzdGVtIGFzIGFueSkucmVhZEpzb25TeW5jKHBhdGgpO1xuICB9XG5cbiAgcmVhZGxpbmtTeW5jKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2lucHV0RmlsZVN5c3RlbS5yZWFkbGlua1N5bmMocGF0aCk7XG4gIH1cblxuICBwdXJnZShjaGFuZ2VzPzogc3RyaW5nW10gfCBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIGNoYW5nZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLl93ZWJwYWNrQ29tcGlsZXJIb3N0LmludmFsaWRhdGUoY2hhbmdlcyk7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGNoYW5nZXMpKSB7XG4gICAgICBjaGFuZ2VzLmZvckVhY2goKGZpbGVOYW1lOiBzdHJpbmcpID0+IHRoaXMuX3dlYnBhY2tDb21waWxlckhvc3QuaW52YWxpZGF0ZShmaWxlTmFtZSkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5faW5wdXRGaWxlU3lzdGVtLnB1cmdlKSB7XG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICAodGhpcy5faW5wdXRGaWxlU3lzdGVtIGFzIGFueSkucHVyZ2UoY2hhbmdlcyk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWaXJ0dWFsV2F0Y2hGaWxlU3lzdGVtRGVjb3JhdG9yIGV4dGVuZHMgTm9kZVdhdGNoRmlsZVN5c3RlbSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX3ZpcnR1YWxJbnB1dEZpbGVTeXN0ZW06IFZpcnR1YWxGaWxlU3lzdGVtRGVjb3JhdG9yLFxuICAgIHByaXZhdGUgX3JlcGxhY2VtZW50cz86IE1hcDxQYXRoLCBQYXRoPiB8ICgocGF0aDogUGF0aCkgPT4gUGF0aCksXG4gICkge1xuICAgIHN1cGVyKF92aXJ0dWFsSW5wdXRGaWxlU3lzdGVtKTtcbiAgfVxuXG4gIHdhdGNoKFxuICAgIGZpbGVzOiBzdHJpbmdbXSxcbiAgICBkaXJzOiBzdHJpbmdbXSxcbiAgICBtaXNzaW5nOiBzdHJpbmdbXSxcbiAgICBzdGFydFRpbWU6IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgICBvcHRpb25zOiB7fSxcbiAgICBjYWxsYmFjazogYW55LCAgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1hbnlcbiAgICBjYWxsYmFja1VuZGVsYXllZDogKGZpbGVuYW1lOiBzdHJpbmcsIHRpbWVzdGFtcDogbnVtYmVyKSA9PiB2b2lkLFxuICApIHtcbiAgICBjb25zdCByZXZlcnNlUmVwbGFjZW1lbnRzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgICBjb25zdCByZXZlcnNlVGltZXN0YW1wcyA9IChtYXA6IE1hcDxzdHJpbmcsIG51bWJlcj4pID0+IHtcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgQXJyYXkuZnJvbShtYXAuZW50cmllcygpKSkge1xuICAgICAgICBjb25zdCBvcmlnaW5hbCA9IHJldmVyc2VSZXBsYWNlbWVudHMuZ2V0KGVudHJ5WzBdKTtcbiAgICAgICAgaWYgKG9yaWdpbmFsKSB7XG4gICAgICAgICAgbWFwLnNldChvcmlnaW5hbCwgZW50cnlbMV0pO1xuICAgICAgICAgIG1hcC5kZWxldGUoZW50cnlbMF0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYXA7XG4gICAgfTtcblxuICAgIGNvbnN0IG5ld0NhbGxiYWNrVW5kZWxheWVkID0gKGZpbGVuYW1lOiBzdHJpbmcsIHRpbWVzdGFtcDogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zdCBvcmlnaW5hbCA9IHJldmVyc2VSZXBsYWNlbWVudHMuZ2V0KGZpbGVuYW1lKTtcbiAgICAgIGlmIChvcmlnaW5hbCkge1xuICAgICAgICB0aGlzLl92aXJ0dWFsSW5wdXRGaWxlU3lzdGVtLnB1cmdlKG9yaWdpbmFsKTtcbiAgICAgICAgY2FsbGJhY2tVbmRlbGF5ZWQob3JpZ2luYWwsIHRpbWVzdGFtcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja1VuZGVsYXllZChmaWxlbmFtZSwgdGltZXN0YW1wKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgbmV3Q2FsbGJhY2sgPSAoXG4gICAgICBlcnI6IEVycm9yIHwgbnVsbCxcbiAgICAgIGZpbGVzTW9kaWZpZWQ6IHN0cmluZ1tdLFxuICAgICAgY29udGV4dE1vZGlmaWVkOiBzdHJpbmdbXSxcbiAgICAgIG1pc3NpbmdNb2RpZmllZDogc3RyaW5nW10sXG4gICAgICBmaWxlVGltZXN0YW1wczogTWFwPHN0cmluZywgbnVtYmVyPixcbiAgICAgIGNvbnRleHRUaW1lc3RhbXBzOiBNYXA8c3RyaW5nLCBudW1iZXI+LFxuICAgICkgPT4ge1xuICAgICAgLy8gVXBkYXRlIGZpbGVUaW1lc3RhbXBzIHdpdGggdGltZXN0YW1wcyBmcm9tIHZpcnR1YWwgZmlsZXMuXG4gICAgICBjb25zdCB2aXJ0dWFsRmlsZXNTdGF0cyA9IHRoaXMuX3ZpcnR1YWxJbnB1dEZpbGVTeXN0ZW0uZ2V0VmlydHVhbEZpbGVzUGF0aHMoKVxuICAgICAgICAubWFwKChmaWxlTmFtZSkgPT4gKHtcbiAgICAgICAgICBwYXRoOiBmaWxlTmFtZSxcbiAgICAgICAgICBtdGltZTogK3RoaXMuX3ZpcnR1YWxJbnB1dEZpbGVTeXN0ZW0uc3RhdFN5bmMoZmlsZU5hbWUpLm10aW1lLFxuICAgICAgICB9KSk7XG4gICAgICB2aXJ0dWFsRmlsZXNTdGF0cy5mb3JFYWNoKHN0YXRzID0+IGZpbGVUaW1lc3RhbXBzLnNldChzdGF0cy5wYXRoLCArc3RhdHMubXRpbWUpKTtcbiAgICAgIGNhbGxiYWNrKFxuICAgICAgICBlcnIsXG4gICAgICAgIGZpbGVzTW9kaWZpZWQubWFwKHZhbHVlID0+IHJldmVyc2VSZXBsYWNlbWVudHMuZ2V0KHZhbHVlKSB8fCB2YWx1ZSksXG4gICAgICAgIGNvbnRleHRNb2RpZmllZC5tYXAodmFsdWUgPT4gcmV2ZXJzZVJlcGxhY2VtZW50cy5nZXQodmFsdWUpIHx8IHZhbHVlKSxcbiAgICAgICAgbWlzc2luZ01vZGlmaWVkLm1hcCh2YWx1ZSA9PiByZXZlcnNlUmVwbGFjZW1lbnRzLmdldCh2YWx1ZSkgfHwgdmFsdWUpLFxuICAgICAgICByZXZlcnNlVGltZXN0YW1wcyhmaWxlVGltZXN0YW1wcyksXG4gICAgICAgIHJldmVyc2VUaW1lc3RhbXBzKGNvbnRleHRUaW1lc3RhbXBzKSxcbiAgICAgICk7XG4gICAgfTtcblxuICAgIGNvbnN0IG1hcFJlcGxhY2VtZW50cyA9IChvcmlnaW5hbDogc3RyaW5nW10pOiBzdHJpbmdbXSA9PiB7XG4gICAgICBpZiAoIXRoaXMuX3JlcGxhY2VtZW50cykge1xuICAgICAgICByZXR1cm4gb3JpZ2luYWw7XG4gICAgICB9XG4gICAgICBjb25zdCByZXBsYWNlbWVudHMgPSB0aGlzLl9yZXBsYWNlbWVudHM7XG5cbiAgICAgIHJldHVybiBvcmlnaW5hbC5tYXAoZmlsZSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZW1lbnRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBnZXRTeXN0ZW1QYXRoKHJlcGxhY2VtZW50cyhub3JtYWxpemUoZmlsZSkpKTtcbiAgICAgICAgICBpZiAocmVwbGFjZW1lbnQgIT09IGZpbGUpIHtcbiAgICAgICAgICAgIHJldmVyc2VSZXBsYWNlbWVudHMuc2V0KHJlcGxhY2VtZW50LCBmaWxlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVwbGFjZW1lbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSByZXBsYWNlbWVudHMuZ2V0KG5vcm1hbGl6ZShmaWxlKSk7XG4gICAgICAgICAgaWYgKHJlcGxhY2VtZW50KSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsUmVwbGFjZW1lbnQgPSBnZXRTeXN0ZW1QYXRoKHJlcGxhY2VtZW50KTtcbiAgICAgICAgICAgIHJldmVyc2VSZXBsYWNlbWVudHMuc2V0KGZ1bGxSZXBsYWNlbWVudCwgZmlsZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmdWxsUmVwbGFjZW1lbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHdhdGNoZXIgPSBzdXBlci53YXRjaChcbiAgICAgIG1hcFJlcGxhY2VtZW50cyhmaWxlcyksXG4gICAgICBtYXBSZXBsYWNlbWVudHMoZGlycyksXG4gICAgICBtYXBSZXBsYWNlbWVudHMobWlzc2luZyksXG4gICAgICBzdGFydFRpbWUsXG4gICAgICBvcHRpb25zLFxuICAgICAgbmV3Q2FsbGJhY2ssXG4gICAgICBuZXdDYWxsYmFja1VuZGVsYXllZCxcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNsb3NlOiAoKSA9PiB3YXRjaGVyLmNsb3NlKCksXG4gICAgICBwYXVzZTogKCkgPT4gd2F0Y2hlci5wYXVzZSgpLFxuICAgICAgZ2V0RmlsZVRpbWVzdGFtcHM6ICgpID0+IHJldmVyc2VUaW1lc3RhbXBzKHdhdGNoZXIuZ2V0RmlsZVRpbWVzdGFtcHMoKSksXG4gICAgICBnZXRDb250ZXh0VGltZXN0YW1wczogKCkgPT4gcmV2ZXJzZVRpbWVzdGFtcHMod2F0Y2hlci5nZXRDb250ZXh0VGltZXN0YW1wcygpKSxcbiAgICB9O1xuICB9XG59XG4iXX0=