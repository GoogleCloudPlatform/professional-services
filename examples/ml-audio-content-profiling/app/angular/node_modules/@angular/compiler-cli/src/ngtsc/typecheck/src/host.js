/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/typecheck/src/host", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A `ts.CompilerHost` which augments source files with type checking code from a
     * `TypeCheckContext`.
     */
    var TypeCheckProgramHost = /** @class */ (function () {
        function TypeCheckProgramHost(program, delegate, context) {
            var _this = this;
            this.delegate = delegate;
            this.context = context;
            /**
             * Map of source file names to `ts.SourceFile` instances.
             *
             * This is prepopulated with all the old source files, and updated as files are augmented.
             */
            this.sfCache = new Map();
            /**
             * Tracks those files in `sfCache` which have been augmented with type checking information
             * already.
             */
            this.augmentedSourceFiles = new Set();
            // The `TypeCheckContext` uses object identity for `ts.SourceFile`s to track which files need
            // type checking code inserted. Additionally, the operation of getting a source file should be
            // as efficient as possible. To support both of these requirements, all of the program's
            // source files are loaded into the cache up front.
            program.getSourceFiles().forEach(function (file) { _this.sfCache.set(file.fileName, file); });
        }
        TypeCheckProgramHost.prototype.getSourceFile = function (fileName, languageVersion, onError, shouldCreateNewSourceFile) {
            // Look in the cache for the source file.
            var sf = this.sfCache.get(fileName);
            if (sf === undefined) {
                // There should be no cache misses, but just in case, delegate getSourceFile in the event of
                // a cache miss.
                sf = this.delegate.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
                sf && this.sfCache.set(fileName, sf);
            }
            if (sf !== undefined) {
                // Maybe augment the file with type checking code via the `TypeCheckContext`.
                if (!this.augmentedSourceFiles.has(sf)) {
                    sf = this.context.transform(sf);
                    this.sfCache.set(fileName, sf);
                    this.augmentedSourceFiles.add(sf);
                }
                return sf;
            }
            else {
                return undefined;
            }
        };
        // The rest of the methods simply delegate to the underlying `ts.CompilerHost`.
        TypeCheckProgramHost.prototype.getDefaultLibFileName = function (options) {
            return this.delegate.getDefaultLibFileName(options);
        };
        TypeCheckProgramHost.prototype.writeFile = function (fileName, data, writeByteOrderMark, onError, sourceFiles) {
            return this.delegate.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);
        };
        TypeCheckProgramHost.prototype.getCurrentDirectory = function () { return this.delegate.getCurrentDirectory(); };
        TypeCheckProgramHost.prototype.getDirectories = function (path) { return this.delegate.getDirectories(path); };
        TypeCheckProgramHost.prototype.getCanonicalFileName = function (fileName) {
            return this.delegate.getCanonicalFileName(fileName);
        };
        TypeCheckProgramHost.prototype.useCaseSensitiveFileNames = function () { return this.delegate.useCaseSensitiveFileNames(); };
        TypeCheckProgramHost.prototype.getNewLine = function () { return this.delegate.getNewLine(); };
        TypeCheckProgramHost.prototype.fileExists = function (fileName) { return this.delegate.fileExists(fileName); };
        TypeCheckProgramHost.prototype.readFile = function (fileName) { return this.delegate.readFile(fileName); };
        return TypeCheckProgramHost;
    }());
    exports.TypeCheckProgramHost = TypeCheckProgramHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvdHlwZWNoZWNrL3NyYy9ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBS0g7OztPQUdHO0lBQ0g7UUFjRSw4QkFDSSxPQUFtQixFQUFVLFFBQXlCLEVBQVUsT0FBeUI7WUFEN0YsaUJBT0M7WUFOZ0MsYUFBUSxHQUFSLFFBQVEsQ0FBaUI7WUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFrQjtZQWQ3Rjs7OztlQUlHO1lBQ0ssWUFBTyxHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO1lBRW5EOzs7ZUFHRztZQUNLLHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO1lBSXRELDZGQUE2RjtZQUM3Riw4RkFBOEY7WUFDOUYsd0ZBQXdGO1lBQ3hGLG1EQUFtRDtZQUNuRCxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSSxJQUFNLEtBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBRUQsNENBQWEsR0FBYixVQUNJLFFBQWdCLEVBQUUsZUFBZ0MsRUFDbEQsT0FBK0MsRUFDL0MseUJBQTZDO1lBQy9DLHlDQUF5QztZQUN6QyxJQUFJLEVBQUUsR0FBNEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDN0QsSUFBSSxFQUFFLEtBQUssU0FBUyxFQUFFO2dCQUNwQiw0RkFBNEY7Z0JBQzVGLGdCQUFnQjtnQkFDaEIsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUM1QixRQUFRLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO2dCQUNuRSxFQUFFLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ3RDO1lBQ0QsSUFBSSxFQUFFLEtBQUssU0FBUyxFQUFFO2dCQUNwQiw2RUFBNkU7Z0JBQzdFLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO29CQUN0QyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDL0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDbkM7Z0JBQ0QsT0FBTyxFQUFFLENBQUM7YUFDWDtpQkFBTTtnQkFDTCxPQUFPLFNBQVMsQ0FBQzthQUNsQjtRQUNILENBQUM7UUFFRCwrRUFBK0U7UUFFL0Usb0RBQXFCLEdBQXJCLFVBQXNCLE9BQTJCO1lBQy9DLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsd0NBQVMsR0FBVCxVQUNJLFFBQWdCLEVBQUUsSUFBWSxFQUFFLGtCQUEyQixFQUMzRCxPQUE4QyxFQUM5QyxXQUF5QztZQUMzQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzNGLENBQUM7UUFFRCxrREFBbUIsR0FBbkIsY0FBZ0MsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTdFLDZDQUFjLEdBQWQsVUFBZSxJQUFZLElBQWMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckYsbURBQW9CLEdBQXBCLFVBQXFCLFFBQWdCO1lBQ25DLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsd0RBQXlCLEdBQXpCLGNBQXVDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUUxRix5Q0FBVSxHQUFWLGNBQXVCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFM0QseUNBQVUsR0FBVixVQUFXLFFBQWdCLElBQWEsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFcEYsdUNBQVEsR0FBUixVQUFTLFFBQWdCLElBQXNCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNGLDJCQUFDO0lBQUQsQ0FBQyxBQTdFRCxJQTZFQztJQTdFWSxvREFBb0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtUeXBlQ2hlY2tDb250ZXh0fSBmcm9tICcuL2NvbnRleHQnO1xuXG4vKipcbiAqIEEgYHRzLkNvbXBpbGVySG9zdGAgd2hpY2ggYXVnbWVudHMgc291cmNlIGZpbGVzIHdpdGggdHlwZSBjaGVja2luZyBjb2RlIGZyb20gYVxuICogYFR5cGVDaGVja0NvbnRleHRgLlxuICovXG5leHBvcnQgY2xhc3MgVHlwZUNoZWNrUHJvZ3JhbUhvc3QgaW1wbGVtZW50cyB0cy5Db21waWxlckhvc3Qge1xuICAvKipcbiAgICogTWFwIG9mIHNvdXJjZSBmaWxlIG5hbWVzIHRvIGB0cy5Tb3VyY2VGaWxlYCBpbnN0YW5jZXMuXG4gICAqXG4gICAqIFRoaXMgaXMgcHJlcG9wdWxhdGVkIHdpdGggYWxsIHRoZSBvbGQgc291cmNlIGZpbGVzLCBhbmQgdXBkYXRlZCBhcyBmaWxlcyBhcmUgYXVnbWVudGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBzZkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHRzLlNvdXJjZUZpbGU+KCk7XG5cbiAgLyoqXG4gICAqIFRyYWNrcyB0aG9zZSBmaWxlcyBpbiBgc2ZDYWNoZWAgd2hpY2ggaGF2ZSBiZWVuIGF1Z21lbnRlZCB3aXRoIHR5cGUgY2hlY2tpbmcgaW5mb3JtYXRpb25cbiAgICogYWxyZWFkeS5cbiAgICovXG4gIHByaXZhdGUgYXVnbWVudGVkU291cmNlRmlsZXMgPSBuZXcgU2V0PHRzLlNvdXJjZUZpbGU+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcm9ncmFtOiB0cy5Qcm9ncmFtLCBwcml2YXRlIGRlbGVnYXRlOiB0cy5Db21waWxlckhvc3QsIHByaXZhdGUgY29udGV4dDogVHlwZUNoZWNrQ29udGV4dCkge1xuICAgIC8vIFRoZSBgVHlwZUNoZWNrQ29udGV4dGAgdXNlcyBvYmplY3QgaWRlbnRpdHkgZm9yIGB0cy5Tb3VyY2VGaWxlYHMgdG8gdHJhY2sgd2hpY2ggZmlsZXMgbmVlZFxuICAgIC8vIHR5cGUgY2hlY2tpbmcgY29kZSBpbnNlcnRlZC4gQWRkaXRpb25hbGx5LCB0aGUgb3BlcmF0aW9uIG9mIGdldHRpbmcgYSBzb3VyY2UgZmlsZSBzaG91bGQgYmVcbiAgICAvLyBhcyBlZmZpY2llbnQgYXMgcG9zc2libGUuIFRvIHN1cHBvcnQgYm90aCBvZiB0aGVzZSByZXF1aXJlbWVudHMsIGFsbCBvZiB0aGUgcHJvZ3JhbSdzXG4gICAgLy8gc291cmNlIGZpbGVzIGFyZSBsb2FkZWQgaW50byB0aGUgY2FjaGUgdXAgZnJvbnQuXG4gICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZvckVhY2goZmlsZSA9PiB7IHRoaXMuc2ZDYWNoZS5zZXQoZmlsZS5maWxlTmFtZSwgZmlsZSk7IH0pO1xuICB9XG5cbiAgZ2V0U291cmNlRmlsZShcbiAgICAgIGZpbGVOYW1lOiBzdHJpbmcsIGxhbmd1YWdlVmVyc2lvbjogdHMuU2NyaXB0VGFyZ2V0LFxuICAgICAgb25FcnJvcj86ICgobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkKXx1bmRlZmluZWQsXG4gICAgICBzaG91bGRDcmVhdGVOZXdTb3VyY2VGaWxlPzogYm9vbGVhbnx1bmRlZmluZWQpOiB0cy5Tb3VyY2VGaWxlfHVuZGVmaW5lZCB7XG4gICAgLy8gTG9vayBpbiB0aGUgY2FjaGUgZm9yIHRoZSBzb3VyY2UgZmlsZS5cbiAgICBsZXQgc2Y6IHRzLlNvdXJjZUZpbGV8dW5kZWZpbmVkID0gdGhpcy5zZkNhY2hlLmdldChmaWxlTmFtZSk7XG4gICAgaWYgKHNmID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFRoZXJlIHNob3VsZCBiZSBubyBjYWNoZSBtaXNzZXMsIGJ1dCBqdXN0IGluIGNhc2UsIGRlbGVnYXRlIGdldFNvdXJjZUZpbGUgaW4gdGhlIGV2ZW50IG9mXG4gICAgICAvLyBhIGNhY2hlIG1pc3MuXG4gICAgICBzZiA9IHRoaXMuZGVsZWdhdGUuZ2V0U291cmNlRmlsZShcbiAgICAgICAgICBmaWxlTmFtZSwgbGFuZ3VhZ2VWZXJzaW9uLCBvbkVycm9yLCBzaG91bGRDcmVhdGVOZXdTb3VyY2VGaWxlKTtcbiAgICAgIHNmICYmIHRoaXMuc2ZDYWNoZS5zZXQoZmlsZU5hbWUsIHNmKTtcbiAgICB9XG4gICAgaWYgKHNmICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE1heWJlIGF1Z21lbnQgdGhlIGZpbGUgd2l0aCB0eXBlIGNoZWNraW5nIGNvZGUgdmlhIHRoZSBgVHlwZUNoZWNrQ29udGV4dGAuXG4gICAgICBpZiAoIXRoaXMuYXVnbWVudGVkU291cmNlRmlsZXMuaGFzKHNmKSkge1xuICAgICAgICBzZiA9IHRoaXMuY29udGV4dC50cmFuc2Zvcm0oc2YpO1xuICAgICAgICB0aGlzLnNmQ2FjaGUuc2V0KGZpbGVOYW1lLCBzZik7XG4gICAgICAgIHRoaXMuYXVnbWVudGVkU291cmNlRmlsZXMuYWRkKHNmKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvLyBUaGUgcmVzdCBvZiB0aGUgbWV0aG9kcyBzaW1wbHkgZGVsZWdhdGUgdG8gdGhlIHVuZGVybHlpbmcgYHRzLkNvbXBpbGVySG9zdGAuXG5cbiAgZ2V0RGVmYXVsdExpYkZpbGVOYW1lKG9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuZ2V0RGVmYXVsdExpYkZpbGVOYW1lKG9wdGlvbnMpO1xuICB9XG5cbiAgd3JpdGVGaWxlKFxuICAgICAgZmlsZU5hbWU6IHN0cmluZywgZGF0YTogc3RyaW5nLCB3cml0ZUJ5dGVPcmRlck1hcms6IGJvb2xlYW4sXG4gICAgICBvbkVycm9yOiAoKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZCl8dW5kZWZpbmVkLFxuICAgICAgc291cmNlRmlsZXM6IFJlYWRvbmx5QXJyYXk8dHMuU291cmNlRmlsZT4pOiB2b2lkIHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS53cml0ZUZpbGUoZmlsZU5hbWUsIGRhdGEsIHdyaXRlQnl0ZU9yZGVyTWFyaywgb25FcnJvciwgc291cmNlRmlsZXMpO1xuICB9XG5cbiAgZ2V0Q3VycmVudERpcmVjdG9yeSgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5nZXRDdXJyZW50RGlyZWN0b3J5KCk7IH1cblxuICBnZXREaXJlY3RvcmllcyhwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7IHJldHVybiB0aGlzLmRlbGVnYXRlLmdldERpcmVjdG9yaWVzKHBhdGgpOyB9XG5cbiAgZ2V0Q2Fub25pY2FsRmlsZU5hbWUoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuZ2V0Q2Fub25pY2FsRmlsZU5hbWUoZmlsZU5hbWUpO1xuICB9XG5cbiAgdXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcygpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUudXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcygpOyB9XG5cbiAgZ2V0TmV3TGluZSgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5nZXROZXdMaW5lKCk7IH1cblxuICBmaWxlRXhpc3RzKGZpbGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUuZmlsZUV4aXN0cyhmaWxlTmFtZSk7IH1cblxuICByZWFkRmlsZShmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nfHVuZGVmaW5lZCB7IHJldHVybiB0aGlzLmRlbGVnYXRlLnJlYWRGaWxlKGZpbGVOYW1lKTsgfVxufSJdfQ==