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
        define("@angular/language-service/src/reflector_host", ["require", "exports", "@angular/compiler-cli/src/language_services", "path", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var language_services_1 = require("@angular/compiler-cli/src/language_services");
    var path = require("path");
    var ts = require("typescript");
    var ReflectorModuleModuleResolutionHost = /** @class */ (function () {
        function ReflectorModuleModuleResolutionHost(host, getProgram) {
            var _this = this;
            this.host = host;
            this.getProgram = getProgram;
            // Note: verboseInvalidExpressions is important so that
            // the collector will collect errors instead of throwing
            this.metadataCollector = new language_services_1.MetadataCollector({ verboseInvalidExpression: true });
            if (host.directoryExists)
                this.directoryExists = function (directoryName) { return _this.host.directoryExists(directoryName); };
        }
        ReflectorModuleModuleResolutionHost.prototype.fileExists = function (fileName) { return !!this.host.getScriptSnapshot(fileName); };
        ReflectorModuleModuleResolutionHost.prototype.readFile = function (fileName) {
            var snapshot = this.host.getScriptSnapshot(fileName);
            if (snapshot) {
                return snapshot.getText(0, snapshot.getLength());
            }
            // Typescript readFile() declaration should be `readFile(fileName: string): string | undefined
            return undefined;
        };
        ReflectorModuleModuleResolutionHost.prototype.getSourceFileMetadata = function (fileName) {
            var sf = this.getProgram().getSourceFile(fileName);
            return sf ? this.metadataCollector.getMetadata(sf) : undefined;
        };
        ReflectorModuleModuleResolutionHost.prototype.cacheMetadata = function (fileName) {
            // Don't cache the metadata for .ts files as they might change in the editor!
            return fileName.endsWith('.d.ts');
        };
        return ReflectorModuleModuleResolutionHost;
    }());
    var ReflectorHost = /** @class */ (function () {
        function ReflectorHost(getProgram, serviceHost, options) {
            this.options = options;
            this.metadataReaderCache = language_services_1.createMetadataReaderCache();
            this.hostAdapter = new ReflectorModuleModuleResolutionHost(serviceHost, getProgram);
            this.moduleResolutionCache =
                ts.createModuleResolutionCache(serviceHost.getCurrentDirectory(), function (s) { return s; });
        }
        ReflectorHost.prototype.getMetadataFor = function (modulePath) {
            return language_services_1.readMetadata(modulePath, this.hostAdapter, this.metadataReaderCache);
        };
        ReflectorHost.prototype.moduleNameToFileName = function (moduleName, containingFile) {
            if (!containingFile) {
                if (moduleName.indexOf('.') === 0) {
                    throw new Error('Resolution of relative paths requires a containing file.');
                }
                // Any containing file gives the same result for absolute imports
                containingFile = path.join(this.options.basePath, 'index.ts').replace(/\\/g, '/');
            }
            var resolved = ts.resolveModuleName(moduleName, containingFile, this.options, this.hostAdapter)
                .resolvedModule;
            return resolved ? resolved.resolvedFileName : null;
        };
        ReflectorHost.prototype.getOutputName = function (filePath) { return filePath; };
        return ReflectorHost;
    }());
    exports.ReflectorHost = ReflectorHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdG9yX2hvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL3NyYy9yZWZsZWN0b3JfaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUdILGlGQUFpTDtJQUNqTCwyQkFBNkI7SUFDN0IsK0JBQWlDO0lBRWpDO1FBS0UsNkNBQW9CLElBQTRCLEVBQVUsVUFBNEI7WUFBdEYsaUJBR0M7WUFIbUIsU0FBSSxHQUFKLElBQUksQ0FBd0I7WUFBVSxlQUFVLEdBQVYsVUFBVSxDQUFrQjtZQUp0Rix1REFBdUQ7WUFDdkQsd0RBQXdEO1lBQ2hELHNCQUFpQixHQUFHLElBQUkscUNBQWlCLENBQUMsRUFBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1lBR2xGLElBQUksSUFBSSxDQUFDLGVBQWU7Z0JBQ3RCLElBQUksQ0FBQyxlQUFlLEdBQUcsVUFBQSxhQUFhLElBQUksT0FBQSxLQUFJLENBQUMsSUFBSSxDQUFDLGVBQWlCLENBQUMsYUFBYSxDQUFDLEVBQTFDLENBQTBDLENBQUM7UUFDdkYsQ0FBQztRQUVELHdEQUFVLEdBQVYsVUFBVyxRQUFnQixJQUFhLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXpGLHNEQUFRLEdBQVIsVUFBUyxRQUFnQjtZQUN2QixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JELElBQUksUUFBUSxFQUFFO2dCQUNaLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7YUFDbEQ7WUFFRCw4RkFBOEY7WUFDOUYsT0FBTyxTQUFXLENBQUM7UUFDckIsQ0FBQztRQUtELG1FQUFxQixHQUFyQixVQUFzQixRQUFnQjtZQUNwQyxJQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JELE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDakUsQ0FBQztRQUVELDJEQUFhLEdBQWIsVUFBYyxRQUFnQjtZQUM1Qiw2RUFBNkU7WUFDN0UsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDSCwwQ0FBQztJQUFELENBQUMsQUFsQ0QsSUFrQ0M7SUFFRDtRQUtFLHVCQUNJLFVBQTRCLEVBQUUsV0FBbUMsRUFDekQsT0FBd0I7WUFBeEIsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7WUFKNUIsd0JBQW1CLEdBQUcsNkNBQXlCLEVBQUUsQ0FBQztZQUt4RCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksbUNBQW1DLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3BGLElBQUksQ0FBQyxxQkFBcUI7Z0JBQ3RCLEVBQUUsQ0FBQywyQkFBMkIsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsRUFBRCxDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRUQsc0NBQWMsR0FBZCxVQUFlLFVBQWtCO1lBQy9CLE9BQU8sZ0NBQVksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRUQsNENBQW9CLEdBQXBCLFVBQXFCLFVBQWtCLEVBQUUsY0FBdUI7WUFDOUQsSUFBSSxDQUFDLGNBQWMsRUFBRTtnQkFDbkIsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQywwREFBMEQsQ0FBQyxDQUFDO2lCQUM3RTtnQkFDRCxpRUFBaUU7Z0JBQ2pFLGNBQWMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDckY7WUFDRCxJQUFNLFFBQVEsR0FDVixFQUFFLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLGNBQWdCLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDO2lCQUM3RSxjQUFjLENBQUM7WUFDeEIsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3JELENBQUM7UUFFRCxxQ0FBYSxHQUFiLFVBQWMsUUFBZ0IsSUFBSSxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDdEQsb0JBQUM7SUFBRCxDQUFDLEFBaENELElBZ0NDO0lBaENZLHNDQUFhIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N0YXRpY1N5bWJvbFJlc29sdmVySG9zdH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtDb21waWxlck9wdGlvbnMsIE1ldGFkYXRhQ29sbGVjdG9yLCBNZXRhZGF0YVJlYWRlckNhY2hlLCBNZXRhZGF0YVJlYWRlckhvc3QsIGNyZWF0ZU1ldGFkYXRhUmVhZGVyQ2FjaGUsIHJlYWRNZXRhZGF0YX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9sYW5ndWFnZV9zZXJ2aWNlcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmNsYXNzIFJlZmxlY3Rvck1vZHVsZU1vZHVsZVJlc29sdXRpb25Ib3N0IGltcGxlbWVudHMgdHMuTW9kdWxlUmVzb2x1dGlvbkhvc3QsIE1ldGFkYXRhUmVhZGVySG9zdCB7XG4gIC8vIE5vdGU6IHZlcmJvc2VJbnZhbGlkRXhwcmVzc2lvbnMgaXMgaW1wb3J0YW50IHNvIHRoYXRcbiAgLy8gdGhlIGNvbGxlY3RvciB3aWxsIGNvbGxlY3QgZXJyb3JzIGluc3RlYWQgb2YgdGhyb3dpbmdcbiAgcHJpdmF0ZSBtZXRhZGF0YUNvbGxlY3RvciA9IG5ldyBNZXRhZGF0YUNvbGxlY3Rvcih7dmVyYm9zZUludmFsaWRFeHByZXNzaW9uOiB0cnVlfSk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBob3N0OiB0cy5MYW5ndWFnZVNlcnZpY2VIb3N0LCBwcml2YXRlIGdldFByb2dyYW06ICgpID0+IHRzLlByb2dyYW0pIHtcbiAgICBpZiAoaG9zdC5kaXJlY3RvcnlFeGlzdHMpXG4gICAgICB0aGlzLmRpcmVjdG9yeUV4aXN0cyA9IGRpcmVjdG9yeU5hbWUgPT4gdGhpcy5ob3N0LmRpcmVjdG9yeUV4aXN0cyAhKGRpcmVjdG9yeU5hbWUpO1xuICB9XG5cbiAgZmlsZUV4aXN0cyhmaWxlTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7IHJldHVybiAhIXRoaXMuaG9zdC5nZXRTY3JpcHRTbmFwc2hvdChmaWxlTmFtZSk7IH1cblxuICByZWFkRmlsZShmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgc25hcHNob3QgPSB0aGlzLmhvc3QuZ2V0U2NyaXB0U25hcHNob3QoZmlsZU5hbWUpO1xuICAgIGlmIChzbmFwc2hvdCkge1xuICAgICAgcmV0dXJuIHNuYXBzaG90LmdldFRleHQoMCwgc25hcHNob3QuZ2V0TGVuZ3RoKCkpO1xuICAgIH1cblxuICAgIC8vIFR5cGVzY3JpcHQgcmVhZEZpbGUoKSBkZWNsYXJhdGlvbiBzaG91bGQgYmUgYHJlYWRGaWxlKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICByZXR1cm4gdW5kZWZpbmVkICE7XG4gIH1cblxuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZGlyZWN0b3J5RXhpc3RzICE6IChkaXJlY3RvcnlOYW1lOiBzdHJpbmcpID0+IGJvb2xlYW47XG5cbiAgZ2V0U291cmNlRmlsZU1ldGFkYXRhKGZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzZiA9IHRoaXMuZ2V0UHJvZ3JhbSgpLmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpO1xuICAgIHJldHVybiBzZiA/IHRoaXMubWV0YWRhdGFDb2xsZWN0b3IuZ2V0TWV0YWRhdGEoc2YpIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgY2FjaGVNZXRhZGF0YShmaWxlTmFtZTogc3RyaW5nKSB7XG4gICAgLy8gRG9uJ3QgY2FjaGUgdGhlIG1ldGFkYXRhIGZvciAudHMgZmlsZXMgYXMgdGhleSBtaWdodCBjaGFuZ2UgaW4gdGhlIGVkaXRvciFcbiAgICByZXR1cm4gZmlsZU5hbWUuZW5kc1dpdGgoJy5kLnRzJyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZmxlY3Rvckhvc3QgaW1wbGVtZW50cyBTdGF0aWNTeW1ib2xSZXNvbHZlckhvc3Qge1xuICBwcml2YXRlIG1vZHVsZVJlc29sdXRpb25DYWNoZTogdHMuTW9kdWxlUmVzb2x1dGlvbkNhY2hlO1xuICBwcml2YXRlIGhvc3RBZGFwdGVyOiBSZWZsZWN0b3JNb2R1bGVNb2R1bGVSZXNvbHV0aW9uSG9zdDtcbiAgcHJpdmF0ZSBtZXRhZGF0YVJlYWRlckNhY2hlID0gY3JlYXRlTWV0YWRhdGFSZWFkZXJDYWNoZSgpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgZ2V0UHJvZ3JhbTogKCkgPT4gdHMuUHJvZ3JhbSwgc2VydmljZUhvc3Q6IHRzLkxhbmd1YWdlU2VydmljZUhvc3QsXG4gICAgICBwcml2YXRlIG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucykge1xuICAgIHRoaXMuaG9zdEFkYXB0ZXIgPSBuZXcgUmVmbGVjdG9yTW9kdWxlTW9kdWxlUmVzb2x1dGlvbkhvc3Qoc2VydmljZUhvc3QsIGdldFByb2dyYW0pO1xuICAgIHRoaXMubW9kdWxlUmVzb2x1dGlvbkNhY2hlID1cbiAgICAgICAgdHMuY3JlYXRlTW9kdWxlUmVzb2x1dGlvbkNhY2hlKHNlcnZpY2VIb3N0LmdldEN1cnJlbnREaXJlY3RvcnkoKSwgKHMpID0+IHMpO1xuICB9XG5cbiAgZ2V0TWV0YWRhdGFGb3IobW9kdWxlUGF0aDogc3RyaW5nKToge1trZXk6IHN0cmluZ106IGFueX1bXXx1bmRlZmluZWQge1xuICAgIHJldHVybiByZWFkTWV0YWRhdGEobW9kdWxlUGF0aCwgdGhpcy5ob3N0QWRhcHRlciwgdGhpcy5tZXRhZGF0YVJlYWRlckNhY2hlKTtcbiAgfVxuXG4gIG1vZHVsZU5hbWVUb0ZpbGVOYW1lKG1vZHVsZU5hbWU6IHN0cmluZywgY29udGFpbmluZ0ZpbGU/OiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gICAgaWYgKCFjb250YWluaW5nRmlsZSkge1xuICAgICAgaWYgKG1vZHVsZU5hbWUuaW5kZXhPZignLicpID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVzb2x1dGlvbiBvZiByZWxhdGl2ZSBwYXRocyByZXF1aXJlcyBhIGNvbnRhaW5pbmcgZmlsZS4nKTtcbiAgICAgIH1cbiAgICAgIC8vIEFueSBjb250YWluaW5nIGZpbGUgZ2l2ZXMgdGhlIHNhbWUgcmVzdWx0IGZvciBhYnNvbHV0ZSBpbXBvcnRzXG4gICAgICBjb250YWluaW5nRmlsZSA9IHBhdGguam9pbih0aGlzLm9wdGlvbnMuYmFzZVBhdGggISwgJ2luZGV4LnRzJykucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZCA9XG4gICAgICAgIHRzLnJlc29sdmVNb2R1bGVOYW1lKG1vZHVsZU5hbWUsIGNvbnRhaW5pbmdGaWxlICEsIHRoaXMub3B0aW9ucywgdGhpcy5ob3N0QWRhcHRlcilcbiAgICAgICAgICAgIC5yZXNvbHZlZE1vZHVsZTtcbiAgICByZXR1cm4gcmVzb2x2ZWQgPyByZXNvbHZlZC5yZXNvbHZlZEZpbGVOYW1lIDogbnVsbDtcbiAgfVxuXG4gIGdldE91dHB1dE5hbWUoZmlsZVBhdGg6IHN0cmluZykgeyByZXR1cm4gZmlsZVBhdGg7IH1cbn1cbiJdfQ==