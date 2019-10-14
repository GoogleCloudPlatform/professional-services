#!/usr/bin/env node
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/extract_i18n", ["require", "exports", "tslib", "reflect-metadata", "@angular/compiler-cli/src/transformers/api", "@angular/compiler-cli/src/main"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    require("reflect-metadata");
    var api = require("@angular/compiler-cli/src/transformers/api");
    var main_1 = require("@angular/compiler-cli/src/main");
    function mainXi18n(args, consoleError) {
        if (consoleError === void 0) { consoleError = console.error; }
        var config = readXi18nCommandLineAndConfiguration(args);
        return main_1.main(args, consoleError, config);
    }
    exports.mainXi18n = mainXi18n;
    function readXi18nCommandLineAndConfiguration(args) {
        var options = {};
        var parsedArgs = require('minimist')(args);
        if (parsedArgs.outFile)
            options.i18nOutFile = parsedArgs.outFile;
        if (parsedArgs.i18nFormat)
            options.i18nOutFormat = parsedArgs.i18nFormat;
        if (parsedArgs.locale)
            options.i18nOutLocale = parsedArgs.locale;
        var config = main_1.readCommandLineAndConfiguration(args, options, [
            'outFile',
            'i18nFormat',
            'locale',
        ]);
        // only emit the i18nBundle but nothing else.
        return tslib_1.__assign({}, config, { emitFlags: api.EmitFlags.I18nBundle });
    }
    // Entry point
    if (require.main === module) {
        var args = process.argv.slice(2);
        process.exitCode = mainXi18n(args);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFjdF9pMThuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9leHRyYWN0X2kxOG4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQWNBLDRCQUEwQjtJQUMxQixnRUFBMEM7SUFFMUMsdURBQTZEO0lBRTdELFNBQWdCLFNBQVMsQ0FDckIsSUFBYyxFQUFFLFlBQW1EO1FBQW5ELDZCQUFBLEVBQUEsZUFBc0MsT0FBTyxDQUFDLEtBQUs7UUFDckUsSUFBTSxNQUFNLEdBQUcsb0NBQW9DLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUQsT0FBTyxXQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBSkQsOEJBSUM7SUFFRCxTQUFTLG9DQUFvQyxDQUFDLElBQWM7UUFDMUQsSUFBTSxPQUFPLEdBQXdCLEVBQUUsQ0FBQztRQUN4QyxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxVQUFVLENBQUMsT0FBTztZQUFFLE9BQU8sQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQztRQUNqRSxJQUFJLFVBQVUsQ0FBQyxVQUFVO1lBQUUsT0FBTyxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO1FBQ3pFLElBQUksVUFBVSxDQUFDLE1BQU07WUFBRSxPQUFPLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7UUFFakUsSUFBTSxNQUFNLEdBQUcsc0NBQStCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUM1RCxTQUFTO1lBQ1QsWUFBWTtZQUNaLFFBQVE7U0FDVCxDQUFDLENBQUM7UUFDSCw2Q0FBNkM7UUFDN0MsNEJBQVcsTUFBTSxJQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsSUFBRTtJQUMxRCxDQUFDO0lBRUQsY0FBYztJQUNkLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7UUFDM0IsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsT0FBTyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDcEMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cblxuLyoqXG4gKiBFeHRyYWN0IGkxOG4gbWVzc2FnZXMgZnJvbSBzb3VyY2UgY29kZVxuICovXG4vLyBNdXN0IGJlIGltcG9ydGVkIGZpcnN0LCBiZWNhdXNlIEFuZ3VsYXIgZGVjb3JhdG9ycyB0aHJvdyBvbiBsb2FkLlxuaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcbmltcG9ydCAqIGFzIGFwaSBmcm9tICcuL3RyYW5zZm9ybWVycy9hcGknO1xuaW1wb3J0IHtQYXJzZWRDb25maWd1cmF0aW9ufSBmcm9tICcuL3BlcmZvcm1fY29tcGlsZSc7XG5pbXBvcnQge21haW4sIHJlYWRDb21tYW5kTGluZUFuZENvbmZpZ3VyYXRpb259IGZyb20gJy4vbWFpbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWluWGkxOG4oXG4gICAgYXJnczogc3RyaW5nW10sIGNvbnNvbGVFcnJvcjogKG1zZzogc3RyaW5nKSA9PiB2b2lkID0gY29uc29sZS5lcnJvcik6IG51bWJlciB7XG4gIGNvbnN0IGNvbmZpZyA9IHJlYWRYaTE4bkNvbW1hbmRMaW5lQW5kQ29uZmlndXJhdGlvbihhcmdzKTtcbiAgcmV0dXJuIG1haW4oYXJncywgY29uc29sZUVycm9yLCBjb25maWcpO1xufVxuXG5mdW5jdGlvbiByZWFkWGkxOG5Db21tYW5kTGluZUFuZENvbmZpZ3VyYXRpb24oYXJnczogc3RyaW5nW10pOiBQYXJzZWRDb25maWd1cmF0aW9uIHtcbiAgY29uc3Qgb3B0aW9uczogYXBpLkNvbXBpbGVyT3B0aW9ucyA9IHt9O1xuICBjb25zdCBwYXJzZWRBcmdzID0gcmVxdWlyZSgnbWluaW1pc3QnKShhcmdzKTtcbiAgaWYgKHBhcnNlZEFyZ3Mub3V0RmlsZSkgb3B0aW9ucy5pMThuT3V0RmlsZSA9IHBhcnNlZEFyZ3Mub3V0RmlsZTtcbiAgaWYgKHBhcnNlZEFyZ3MuaTE4bkZvcm1hdCkgb3B0aW9ucy5pMThuT3V0Rm9ybWF0ID0gcGFyc2VkQXJncy5pMThuRm9ybWF0O1xuICBpZiAocGFyc2VkQXJncy5sb2NhbGUpIG9wdGlvbnMuaTE4bk91dExvY2FsZSA9IHBhcnNlZEFyZ3MubG9jYWxlO1xuXG4gIGNvbnN0IGNvbmZpZyA9IHJlYWRDb21tYW5kTGluZUFuZENvbmZpZ3VyYXRpb24oYXJncywgb3B0aW9ucywgW1xuICAgICdvdXRGaWxlJyxcbiAgICAnaTE4bkZvcm1hdCcsXG4gICAgJ2xvY2FsZScsXG4gIF0pO1xuICAvLyBvbmx5IGVtaXQgdGhlIGkxOG5CdW5kbGUgYnV0IG5vdGhpbmcgZWxzZS5cbiAgcmV0dXJuIHsuLi5jb25maWcsIGVtaXRGbGFnczogYXBpLkVtaXRGbGFncy5JMThuQnVuZGxlfTtcbn1cblxuLy8gRW50cnkgcG9pbnRcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuICBwcm9jZXNzLmV4aXRDb2RlID0gbWFpblhpMThuKGFyZ3MpO1xufVxuIl19