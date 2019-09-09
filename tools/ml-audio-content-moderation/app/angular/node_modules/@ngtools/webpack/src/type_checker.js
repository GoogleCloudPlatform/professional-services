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
const node_1 = require("@angular-devkit/core/node");
const compiler_cli_1 = require("@angular/compiler-cli");
const ts = require("typescript");
const benchmark_1 = require("./benchmark");
const compiler_host_1 = require("./compiler_host");
const gather_diagnostics_1 = require("./gather_diagnostics");
const type_checker_messages_1 = require("./type_checker_messages");
// This file should run in a child process with the AUTO_START_ARG argument
exports.AUTO_START_ARG = '9d93e901-158a-4cf9-ba1b-2f0582ffcfeb';
class TypeChecker {
    constructor(_compilerOptions, _basePath, _JitMode, _rootNames, hostReplacementPaths) {
        this._compilerOptions = _compilerOptions;
        this._JitMode = _JitMode;
        this._rootNames = _rootNames;
        benchmark_1.time('TypeChecker.constructor');
        const host = new core_1.virtualFs.AliasHost(new node_1.NodeJsSyncHost());
        // Add file replacements.
        for (const from in hostReplacementPaths) {
            const normalizedFrom = core_1.resolve(core_1.normalize(_basePath), core_1.normalize(from));
            const normalizedWith = core_1.resolve(core_1.normalize(_basePath), core_1.normalize(hostReplacementPaths[from]));
            host.aliases.set(normalizedFrom, normalizedWith);
        }
        const compilerHost = new compiler_host_1.WebpackCompilerHost(_compilerOptions, _basePath, host);
        // We don't set a async resource loader on the compiler host because we only support
        // html templates, which are the only ones that can throw errors, and those can be loaded
        // synchronously.
        // If we need to also report errors on styles then we'll need to ask the main thread
        // for these resources.
        this._compilerHost = compiler_cli_1.createCompilerHost({
            options: this._compilerOptions,
            tsHost: compilerHost,
        });
        benchmark_1.timeEnd('TypeChecker.constructor');
    }
    _update(rootNames, changedCompilationFiles) {
        benchmark_1.time('TypeChecker._update');
        this._rootNames = rootNames;
        changedCompilationFiles.forEach((fileName) => {
            this._compilerHost.invalidate(fileName);
        });
        benchmark_1.timeEnd('TypeChecker._update');
    }
    _createOrUpdateProgram() {
        if (this._JitMode) {
            // Create the TypeScript program.
            benchmark_1.time('TypeChecker._createOrUpdateProgram.ts.createProgram');
            this._program = ts.createProgram(this._rootNames, this._compilerOptions, this._compilerHost, this._program);
            benchmark_1.timeEnd('TypeChecker._createOrUpdateProgram.ts.createProgram');
        }
        else {
            benchmark_1.time('TypeChecker._createOrUpdateProgram.ng.createProgram');
            // Create the Angular program.
            this._program = compiler_cli_1.createProgram({
                rootNames: this._rootNames,
                options: this._compilerOptions,
                host: this._compilerHost,
                oldProgram: this._program,
            });
            benchmark_1.timeEnd('TypeChecker._createOrUpdateProgram.ng.createProgram');
        }
    }
    _diagnose(cancellationToken) {
        const allDiagnostics = gather_diagnostics_1.gatherDiagnostics(this._program, this._JitMode, 'TypeChecker', cancellationToken);
        // Report diagnostics.
        if (!cancellationToken.isCancellationRequested()) {
            const errors = allDiagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
            const warnings = allDiagnostics.filter((d) => d.category === ts.DiagnosticCategory.Warning);
            if (errors.length > 0) {
                const message = compiler_cli_1.formatDiagnostics(errors);
                this.sendMessage(new type_checker_messages_1.LogMessage('error', 'ERROR in ' + message));
            }
            else {
                // Reset the changed file tracker only if there are no errors.
                this._compilerHost.resetChangedFileTracker();
            }
            if (warnings.length > 0) {
                const message = compiler_cli_1.formatDiagnostics(warnings);
                this.sendMessage(new type_checker_messages_1.LogMessage('warn', 'WARNING in ' + message));
            }
        }
    }
    sendMessage(msg) {
        if (process.send) {
            process.send(msg);
        }
    }
    update(rootNames, changedCompilationFiles, cancellationToken) {
        this._update(rootNames, changedCompilationFiles);
        this._createOrUpdateProgram();
        this._diagnose(cancellationToken);
    }
}
exports.TypeChecker = TypeChecker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZV9jaGVja2VyLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL3R5cGVfY2hlY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUFxRTtBQUNyRSxvREFBMkQ7QUFDM0Qsd0RBTytCO0FBQy9CLGlDQUFpQztBQUNqQywyQ0FBNEM7QUFDNUMsbURBQXNEO0FBQ3RELDZEQUE0RTtBQUM1RSxtRUFBeUU7QUFHekUsMkVBQTJFO0FBQzlELFFBQUEsY0FBYyxHQUFHLHNDQUFzQyxDQUFDO0FBRXJFLE1BQWEsV0FBVztJQUl0QixZQUNVLGdCQUFpQyxFQUN6QyxTQUFpQixFQUNULFFBQWlCLEVBQ2pCLFVBQW9CLEVBQzVCLG9CQUFnRDtRQUp4QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWlCO1FBRWpDLGFBQVEsR0FBUixRQUFRLENBQVM7UUFDakIsZUFBVSxHQUFWLFVBQVUsQ0FBVTtRQUc1QixnQkFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxnQkFBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLHFCQUFjLEVBQUUsQ0FBQyxDQUFDO1FBRTNELHlCQUF5QjtRQUN6QixLQUFLLE1BQU0sSUFBSSxJQUFJLG9CQUFvQixFQUFFO1lBQ3ZDLE1BQU0sY0FBYyxHQUFHLGNBQU8sQ0FBQyxnQkFBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLGdCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0RSxNQUFNLGNBQWMsR0FBRyxjQUFPLENBQzVCLGdCQUFTLENBQUMsU0FBUyxDQUFDLEVBQ3BCLGdCQUFTLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDdEMsQ0FBQztZQUNGLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztTQUNsRDtRQUVELE1BQU0s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TSxHQUFHLENBQUMsRUFBRTtnQkFDdkIsTUFBTSxPQUFPLEdBQUcsZ0NBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxrQ0FBVSxDQUFDLE1BQU0sRUFBRSxhQUFhLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUNuRTtTQUNGO0lBQ0gsQ0FBQztJQUVPLFdBQVcsQ0FBQyxHQUF1QjtRQUN6QyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUU7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNuQjtJQUNILENBQUM7SUFFTSxNQUFNLENBQUMsU0FBbUIsRUFBRSx1QkFBaUMsRUFDdEQsaUJBQW9DO1FBQ2hELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLHVCQUF1QixDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7Q0FDRjtBQTlHRCxrQ0E4R0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBub3JtYWxpemUsIHJlc29sdmUsIHZpcnR1YWxGcyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE5vZGVKc1N5bmNIb3N0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvbm9kZSc7XG5pbXBvcnQge1xuICBDb21waWxlckhvc3QsXG4gIENvbXBpbGVyT3B0aW9ucyxcbiAgUHJvZ3JhbSxcbiAgY3JlYXRlQ29tcGlsZXJIb3N0LFxuICBjcmVhdGVQcm9ncmFtLFxuICBmb3JtYXREaWFnbm9zdGljcyxcbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgdGltZSwgdGltZUVuZCB9IGZyb20gJy4vYmVuY2htYXJrJztcbmltcG9ydCB7IFdlYnBhY2tDb21waWxlckhvc3QgfSBmcm9tICcuL2NvbXBpbGVyX2hvc3QnO1xuaW1wb3J0IHsgQ2FuY2VsbGF0aW9uVG9rZW4sIGdhdGhlckRpYWdub3N0aWNzIH0gZnJvbSAnLi9nYXRoZXJfZGlhZ25vc3RpY3MnO1xuaW1wb3J0IHsgTG9nTWVzc2FnZSwgVHlwZUNoZWNrZXJNZXNzYWdlIH0gZnJvbSAnLi90eXBlX2NoZWNrZXJfbWVzc2FnZXMnO1xuXG5cbi8vIFRoaXMgZmlsZSBzaG91bGQgcnVuIGluIGEgY2hpbGQgcHJvY2VzcyB3aXRoIHRoZSBBVVRPX1NUQVJUX0FSRyBhcmd1bWVudFxuZXhwb3J0IGNvbnN0IEFVVE9fU1RBUlRfQVJHID0gJzlkOTNlOTAxLTE1OGEtNGNmOS1iYTFiLTJmMDU4MmZmY2ZlYic7XG5cbmV4cG9ydCBjbGFzcyBUeXBlQ2hlY2tlciB7XG4gIHByaXZhdGUgX3Byb2dyYW06IHRzLlByb2dyYW0gfCBQcm9ncmFtO1xuICBwcml2YXRlIF9jb21waWxlckhvc3Q6IFdlYnBhY2tDb21waWxlckhvc3QgJiBDb21waWxlckhvc3Q7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnMsXG4gICAgX2Jhc2VQYXRoOiBzdHJpbmcsXG4gICAgcHJpdmF0ZSBfSml0TW9kZTogYm9vbGVhbixcbiAgICBwcml2YXRlIF9yb290TmFtZXM6IHN0cmluZ1tdLFxuICAgIGhvc3RSZXBsYWNlbWVudFBhdGhzOiB7IFtwYXRoOiBzdHJpbmddOiBzdHJpbmcgfSxcbiAgKSB7XG4gICAgdGltZSgnVHlwZUNoZWNrZXIuY29uc3RydWN0b3InKTtcbiAgICBjb25zdCBob3N0ID0gbmV3IHZpcnR1YWxGcy5BbGlhc0hvc3QobmV3IE5vZGVKc1N5bmNIb3N0KCkpO1xuXG4gICAgLy8gQWRkIGZpbGUgcmVwbGFjZW1lbnRzLlxuICAgIGZvciAoY29uc3QgZnJvbSBpbiBob3N0UmVwbGFjZW1lbnRQYXRocykge1xuICAgICAgY29uc3Qgbm9ybWFsaXplZEZyb20gPSByZXNvbHZlKG5vcm1hbGl6ZShfYmFzZVBhdGgpLCBub3JtYWxpemUoZnJvbSkpO1xuICAgICAgY29uc3Qgbm9ybWFsaXplZFdpdGggPSByZXNvbHZlKFxuICAgICAgICBub3JtYWxpemUoX2Jhc2VQYXRoKSxcbiAgICAgICAgbm9ybWFsaXplKGhvc3RSZXBsYWNlbWVudFBhdGhzW2Zyb21dKSxcbiAgICAgICk7XG4gICAgICBob3N0LmFsaWFzZXMuc2V0KG5vcm1hbGl6ZWRGcm9tLCBub3JtYWxpemVkV2l0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcGlsZXJIb3N0ID0gbmV3IFdlYnBhY2tDb21waWxlckhvc3QoXG4gICAgICBfY29tcGlsZXJPcHRpb25zLFxuICAgICAgX2Jhc2VQYXRoLFxuICAgICAgaG9zdCxcbiAgICApO1xuICAgIC8vIFdlIGRvbid0IHNldCBhIGFzeW5jIHJlc291cmNlIGxvYWRlciBvbiB0aGUgY29tcGlsZXIgaG9zdCBiZWNhdXNlIHdlIG9ubHkgc3VwcG9ydFxuICAgIC8vIGh0bWwgdGVtcGxhdGVzLCB3aGljaCBhcmUgdGhlIG9ubHkgb25lcyB0aGF0IGNhbiB0aHJvdyBlcnJvcnMsIGFuZCB0aG9zZSBjYW4gYmUgbG9hZGVkXG4gICAgLy8gc3luY2hyb25vdXNseS5cbiAgICAvLyBJZiB3ZSBuZWVkIHRvIGFsc28gcmVwb3J0IGVycm9ycyBvbiBzdHlsZXMgdGhlbiB3ZSdsbCBuZWVkIHRvIGFzayB0aGUgbWFpbiB0aHJlYWRcbiAgICAvLyBmb3IgdGhlc2UgcmVzb3VyY2VzLlxuICAgIHRoaXMuX2NvbXBpbGVySG9zdCA9IGNyZWF0ZUNvbXBpbGVySG9zdCh7XG4gICAgICBvcHRpb25zOiB0aGlzLl9jb21waWxlck9wdGlvbnMsXG4gICAgICB0c0hvc3Q6IGNvbXBpbGVySG9zdCxcbiAgICB9KSBhcyBDb21waWxlckhvc3QgJiBXZWJwYWNrQ29tcGlsZXJIb3N0O1xuICAgIHRpbWVFbmQoJ1R5cGVDaGVja2VyLmNvbnN0cnVjdG9yJyk7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGUocm9vdE5hbWVzOiBzdHJpbmdbXSwgY2hhbmdlZENvbXBpbGF0aW9uRmlsZXM6IHN0cmluZ1tdKSB7XG4gICAgdGltZSgnVHlwZUNoZWNrZXIuX3VwZGF0ZScpO1xuICAgIHRoaXMuX3Jvb3ROYW1lcyA9IHJvb3ROYW1lcztcbiAgICBjaGFuZ2VkQ29tcGlsYXRpb25GaWxlcy5mb3JFYWNoKChmaWxlTmFtZSkgPT4ge1xuICAgICAgdGhpcy5fY29tcGlsZXJIb3N0LmludmFsaWRhdGUoZmlsZU5hbWUpO1xuICAgIH0pO1xuICAgIHRpbWVFbmQoJ1R5cGVDaGVja2VyLl91cGRhdGUnKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZU9yVXBkYXRlUHJvZ3JhbSgpIHtcbiAgICBpZiAodGhpcy5fSml0TW9kZSkge1xuICAgICAgLy8gQ3JlYXRlIHRoZSBUeXBlU2NyaXB0IHByb2dyYW0uXG4gICAgICB0aW1lKCdUeXBlQ2hlY2tlci5fY3JlYXRlT3JVcGRhdGVQcm9ncmFtLnRzLmNyZWF0ZVByb2dyYW0nKTtcbiAgICAgIHRoaXMuX3Byb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKFxuICAgICAgICB0aGlzLl9yb290TmFtZXMsXG4gICAgICAgIHRoaXMuX2NvbXBpbGVyT3B0aW9ucyxcbiAgICAgICAgdGhpcy5fY29tcGlsZXJIb3N0LFxuICAgICAgICB0aGlzLl9wcm9ncmFtIGFzIHRzLlByb2dyYW0sXG4gICAgICApIGFzIHRzLlByb2dyYW07XG4gICAgICB0aW1lRW5kKCdUeXBlQ2hlY2tlci5fY3JlYXRlT3JVcGRhdGVQcm9ncmFtLnRzLmNyZWF0ZVByb2dyYW0nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZSgnVHlwZUNoZWNrZXIuX2NyZWF0ZU9yVXBkYXRlUHJvZ3JhbS5uZy5jcmVhdGVQcm9ncmFtJyk7XG4gICAgICAvLyBDcmVhdGUgdGhlIEFuZ3VsYXIgcHJvZ3JhbS5cbiAgICAgIHRoaXMuX3Byb2dyYW0gPSBjcmVhdGVQcm9ncmFtKHtcbiAgICAgICAgcm9vdE5hbWVzOiB0aGlzLl9yb290TmFtZXMsXG4gICAgICAgIG9wdGlvbnM6IHRoaXMuX2NvbXBpbGVyT3B0aW9ucyxcbiAgICAgICAgaG9zdDogdGhpcy5fY29tcGlsZXJIb3N0LFxuICAgICAgICBvbGRQcm9ncmFtOiB0aGlzLl9wcm9ncmFtIGFzIFByb2dyYW0sXG4gICAgICB9KSBhcyBQcm9ncmFtO1xuICAgICAgdGltZUVuZCgnVHlwZUNoZWNrZXIuX2NyZWF0ZU9yVXBkYXRlUHJvZ3JhbS5uZy5jcmVhdGVQcm9ncmFtJyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZGlhZ25vc2UoY2FuY2VsbGF0aW9uVG9rZW46IENhbmNlbGxhdGlvblRva2VuKSB7XG4gICAgY29uc3QgYWxsRGlhZ25vc3RpY3MgPSBnYXRoZXJEaWFnbm9zdGljcyhcbiAgICAgIHRoaXMuX3Byb2dyYW0sIHRoaXMuX0ppdE1vZGUsICdUeXBlQ2hlY2tlcicsIGNhbmNlbGxhdGlvblRva2VuKTtcblxuICAgIC8vIFJlcG9ydCBkaWFnbm9zdGljcy5cbiAgICBpZiAoIWNhbmNlbGxhdGlvblRva2VuLmlzQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKCkpIHtcbiAgICAgIGNvbnN0IGVycm9ycyA9IGFsbERpYWdub3N0aWNzLmZpbHRlcigoZCkgPT4gZC5jYXRlZ29yeSA9PT0gdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yKTtcbiAgICAgIGNvbnN0IHdhcm5pbmdzID0gYWxsRGlhZ25vc3RpY3MuZmlsdGVyKChkKSA9PiBkLmNhdGVnb3J5ID09PSB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuV2FybmluZyk7XG5cbiAgICAgIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gZm9ybWF0RGlhZ25vc3RpY3MoZXJyb3JzKTtcbiAgICAgICAgdGhpcy5zZW5kTWVzc2FnZShuZXcgTG9nTWVzc2FnZSgnZXJyb3InLCAnRVJST1IgaW4gJyArIG1lc3NhZ2UpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJlc2V0IHRoZSBjaGFuZ2VkIGZpbGUgdHJhY2tlciBvbmx5IGlmIHRoZXJlIGFyZSBubyBlcnJvcnMuXG4gICAgICAgIHRoaXMuX2NvbXBpbGVySG9zdC5yZXNldENoYW5nZWRGaWxlVHJhY2tlcigpO1xuICAgICAgfVxuXG4gICAgICBpZiAod2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gZm9ybWF0RGlhZ25vc3RpY3Mod2FybmluZ3MpO1xuICAgICAgICB0aGlzLnNlbmRNZXNzYWdlKG5ldyBMb2dNZXNzYWdlKCd3YXJuJywgJ1dBUk5JTkcgaW4gJyArIG1lc3NhZ2UpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNlbmRNZXNzYWdlKG1zZzogVHlwZUNoZWNrZXJNZXNzYWdlKSB7XG4gICAgaWYgKHByb2Nlc3Muc2VuZCkge1xuICAgICAgcHJvY2Vzcy5zZW5kKG1zZyk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHVwZGF0ZShyb290TmFtZXM6IHN0cmluZ1tdLCBjaGFuZ2VkQ29tcGlsYXRpb25GaWxlczogc3RyaW5nW10sXG4gICAgICAgICAgICAgICAgY2FuY2VsbGF0aW9uVG9rZW46IENhbmNlbGxhdGlvblRva2VuKSB7XG4gICAgdGhpcy5fdXBkYXRlKHJvb3ROYW1lcywgY2hhbmdlZENvbXBpbGF0aW9uRmlsZXMpO1xuICAgIHRoaXMuX2NyZWF0ZU9yVXBkYXRlUHJvZ3JhbSgpO1xuICAgIHRoaXMuX2RpYWdub3NlKGNhbmNlbGxhdGlvblRva2VuKTtcbiAgfVxufVxuIl19