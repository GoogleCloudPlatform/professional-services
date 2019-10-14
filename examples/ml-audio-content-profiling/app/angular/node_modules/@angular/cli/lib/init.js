"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
require("symbol-observable");
// symbol polyfill must go first
// tslint:disable-next-line:ordered-imports import-groups
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const fs = require("fs");
const path = require("path");
const semver_1 = require("semver");
const stream_1 = require("stream");
const config_1 = require("../utilities/config");
const packageJson = require('../package.json');
function _fromPackageJson(cwd) {
    cwd = cwd || process.cwd();
    do {
        const packageJsonPath = path.join(cwd, 'node_modules/@angular/cli/package.json');
        if (fs.existsSync(packageJsonPath)) {
            const content = fs.readFileSync(packageJsonPath, 'utf-8');
            if (content) {
                const json = JSON.parse(content);
                if (json['version']) {
                    return new semver_1.SemVer(json['version']);
                }
            }
        }
        // Check the parent.
        cwd = path.dirname(cwd);
    } while (cwd != path.dirname(cwd));
    return null;
}
// Check if we need to profile this CLI run.
if (process.env['NG_CLI_PROFILING']) {
    let profiler;
    try {
        profiler = require('v8-profiler-node8'); // tslint:disable-line:no-implicit-dependencies
    }
    catch (err) {
        throw new Error(`Could not require 'v8-profiler-node8'. You must install it separetely with` +
            `'npm install v8-profiler-node8 --no-save.\n\nOriginal error:\n\n${err}`);
    }
    profiler.startProfiling();
    const exitHandler = (options) => {
        if (options.cleanup) {
            const cpuProfile = profiler.stopProfiling();
            fs.writeFileSync(path.resolve(process.cwd(), process.env.NG_CLI_PROFILING || '') + '.cpuprofile', JSON.stringify(cpuProfile));
        }
        if (options.exit) {
            process.exit();
        }
    };
    process.on('exit', () => exitHandler({ cleanup: true }));
    process.on('SIGINT', () => exitHandler({ exit: true }));
    process.on('uncaughtException', () => exitHandler({ exit: true }));
}
let cli;
try {
    const projectLocalCli = node_1.resolve('@angular/cli', {
        checkGlobal: false,
        basedir: process.cwd(),
        preserveSymlinks: true,
    });
    // This was run from a global, check local version.
    const globalVersion = new semver_1.SemVer(packageJson['version']);
    let localVersion;
    let shouldWarn = false;
    try {
        localVersion = _fromPackageJson();
        shouldWarn = localVersion != null && globalVersion.compare(localVersion) > 0;
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        shouldWarn = true;
    }
    if (shouldWarn && config_1.isWarningEnabled('versionMismatch')) {
        const warning = core_1.terminal.yellow(core_1.tags.stripIndents `
    Your global Angular CLI version (${globalVersion}) is greater than your local
    version (${localVersion}). The local Angular CLI version is used.

    To disable this warning use "ng config -g cli.warnings.versionMismatch false".
    `);
        // Don't show warning colorised on `ng completion`
        if (process.argv[2] !== 'completion') {
            // eslint-disable-next-line no-console
            console.error(warning);
        }
        else {
            // eslint-disable-next-line no-console
            console.error(warning);
            process.exit(1);
        }
    }
    // No error implies a projectLocalCli, which will load whatever
    // version of ng-cli you have installed in a local package.json
    cli = require(projectLocalCli);
}
catch (_a) {
    // If there is an error, resolve could not find the ng-cli
    // library from a package.json. Instead, include it from a relative
    // path to this script file (which is likely a globally installed
    // npm package). Most common cause for hitting this is `ng new`
    cli = require('./cli');
}
if ('default' in cli) {
    cli = cli['default'];
}
// This is required to support 1.x local versions with a 6+ global
let standardInput;
try {
    standardInput = process.stdin;
}
catch (e) {
    delete process.stdin;
    process.stdin = new stream_1.Duplex();
    standardInput = process.stdin;
}
cli({
    cliArgs: process.argv.slice(2),
    inputStream: standardInput,
    outputStream: process.stdout,
})
    .then((exitCode) => {
    process.exit(exitCode);
})
    .catch((err) => {
    console.error('Unknown error: ' + err.toString());
    process.exit(127);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvbGliL2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCw2QkFBMkI7QUFDM0IsZ0NBQWdDO0FBQ2hDLHlEQUF5RDtBQUN6RCwrQ0FBc0Q7QUFDdEQsb0RBQW9EO0FBQ3BELHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsbUNBQWdDO0FBQ2hDLG1DQUFnQztBQUNoQyxnREFBdUQ7QUFFdkQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFL0MsU0FBUyxnQkFBZ0IsQ0FBQyxHQUFZO0lBQ3BDLEdBQUcsR0FBRyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRTNCLEdBQUc7UUFDRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDO1FBQ2pGLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNsQyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxRCxJQUFJLE9BQU8sRUFBRTtnQkFDWCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDbkIsT0FBTyxJQUFJLGVBQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztpQkFDcEM7YUFDRjtTQUNGO1FBRUQsb0JBQW9CO1FBQ3BCLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3pCLFFBQVEsR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFFbkMsT0FBTyxJ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Q0FBQztJQUNsRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICdzeW1ib2wtb2JzZXJ2YWJsZSc7XG4vLyBzeW1ib2wgcG9seWZpbGwgbXVzdCBnbyBmaXJzdFxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm9yZGVyZWQtaW1wb3J0cyBpbXBvcnQtZ3JvdXBzXG5pbXBvcnQgeyB0YWdzLCB0ZXJtaW5hbCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBTZW1WZXIgfSBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgRHVwbGV4IH0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7IGlzV2FybmluZ0VuYWJsZWQgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnJztcblxuY29uc3QgcGFja2FnZUpzb24gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKTtcblxuZnVuY3Rpb24gX2Zyb21QYWNrYWdlSnNvbihjd2Q/OiBzdHJpbmcpIHtcbiAgY3dkID0gY3dkIHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgZG8ge1xuICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IHBhdGguam9pbihjd2QsICdub2RlX21vZHVsZXMvQGFuZ3VsYXIvY2xpL3BhY2thZ2UuanNvbicpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKHBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMocGFja2FnZUpzb25QYXRoLCAndXRmLTgnKTtcbiAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgIGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICBpZiAoanNvblsndmVyc2lvbiddKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTZW1WZXIoanNvblsndmVyc2lvbiddKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIHRoZSBwYXJlbnQuXG4gICAgY3dkID0gcGF0aC5kaXJuYW1lKGN3ZCk7XG4gIH0gd2hpbGUgKGN3ZCAhPSBwYXRoLmRpcm5hbWUoY3dkKSk7XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLy8gQ2hlY2sgaWYgd2UgbmVlZCB0byBwcm9maWxlIHRoaXMgQ0xJIHJ1bi5cbmlmIChwcm9jZXNzLmVudlsnTkdfQ0xJX1BST0ZJTElORyddKSB7XG4gIGxldCBwcm9maWxlcjoge1xuICAgIHN0YXJ0UHJvZmlsaW5nOiAobmFtZT86IHN0cmluZywgcmVjc2FtcGxlcz86IGJvb2xlYW4pID0+IHZvaWQ7XG4gICAgc3RvcFByb2ZpbGluZzogKG5hbWU/OiBzdHJpbmcpID0+IGFueTsgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1hbnlcbiAgfTtcbiAgdHJ5IHtcbiAgICBwcm9maWxlciA9IHJlcXVpcmUoJ3Y4LXByb2ZpbGVyLW5vZGU4Jyk7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8taW1wbGljaXQtZGVwZW5kZW5jaWVzXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlcXVpcmUgJ3Y4LXByb2ZpbGVyLW5vZGU4Jy4gWW91IG11c3QgaW5zdGFsbCBpdCBzZXBhcmV0ZWx5IHdpdGhgICtcbiAgICAgIGAnbnBtIGluc3RhbGwgdjgtcHJvZmlsZXItbm9kZTggLS1uby1zYXZlLlxcblxcbk9yaWdpbmFsIGVycm9yOlxcblxcbiR7ZXJyfWApO1xuICB9XG5cbiAgcHJvZmlsZXIuc3RhcnRQcm9maWxpbmcoKTtcblxuICBjb25zdCBleGl0SGFuZGxlciA9IChvcHRpb25zOiB7IGNsZWFudXA/OiBib29sZWFuLCBleGl0PzogYm9vbGVhbiB9KSA9PiB7XG4gICAgaWYgKG9wdGlvbnMuY2xlYW51cCkge1xuICAgICAgY29uc3QgY3B1UHJvZmlsZSA9IHByb2ZpbGVyLnN0b3BQcm9maWxpbmcoKTtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICAgIHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBwcm9jZXNzLmVudi5OR19DTElfUFJPRklMSU5HIHx8ICcnKSArICcuY3B1cHJvZmlsZScsXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KGNwdVByb2ZpbGUpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5leGl0KSB7XG4gICAgICBwcm9jZXNzLmV4aXQoKTtcbiAgICB9XG4gIH07XG5cbiAgcHJvY2Vzcy5vbignZXhpdCcsICgpID0+IGV4aXRIYW5kbGVyKHsgY2xlYW51cDogdHJ1ZSB9KSk7XG4gIHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IGV4aXRIYW5kbGVyKHsgZXhpdDogdHJ1ZSB9KSk7XG4gIHByb2Nlc3Mub24oJ3VuY2F1Z2h0RXhjZXB0aW9uJywgKCkgPT4gZXhpdEhhbmRsZXIoeyBleGl0OiB0cnVlIH0pKTtcbn1cblxubGV0IGNsaTtcbnRyeSB7XG4gIGNvbnN0IHByb2plY3RMb2NhbENsaSA9IHJlc29sdmUoXG4gICAgJ0Bhbmd1bGFyL2NsaScsXG4gICAge1xuICAgICAgY2hlY2tHbG9iYWw6IGZhbHNlLFxuICAgICAgYmFzZWRpcjogcHJvY2Vzcy5jd2QoKSxcbiAgICAgIHByZXNlcnZlU3ltbGlua3M6IHRydWUsXG4gICAgfSxcbiAgKTtcblxuICAvLyBUaGlzIHdhcyBydW4gZnJvbSBhIGdsb2JhbCwgY2hlY2sgbG9jYWwgdmVyc2lvbi5cbiAgY29uc3QgZ2xvYmFsVmVyc2lvbiA9IG5ldyBTZW1WZXIocGFja2FnZUpzb25bJ3ZlcnNpb24nXSk7XG4gIGxldCBsb2NhbFZlcnNpb247XG4gIGxldCBzaG91bGRXYXJuID0gZmFsc2U7XG5cbiAgdHJ5IHtcbiAgICBsb2NhbFZlcnNpb24gPSBfZnJvbVBhY2thZ2VKc29uKCk7XG4gICAgc2hvdWxkV2FybiA9IGxvY2FsVmVyc2lvbiAhPSBudWxsICYmIGdsb2JhbFZlcnNpb24uY29tcGFyZShsb2NhbFZlcnNpb24pID4gMDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcihlKTtcbiAgICBzaG91bGRXYXJuID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChzaG91bGRXYXJuICYmIGlzV2FybmluZ0VuYWJsZWQoJ3ZlcnNpb25NaXNtYXRjaCcpKSB7XG4gICAgY29uc3Qgd2FybmluZyA9IHRlcm1pbmFsLnllbGxvdyh0YWdzLnN0cmlwSW5kZW50c2BcbiAgICBZb3VyIGdsb2JhbCBBbmd1bGFyIENMSSB2ZXJzaW9uICgke2dsb2JhbFZlcnNpb259KSBpcyBncmVhdGVyIHRoYW4geW91ciBsb2NhbFxuICAgIHZlcnNpb24gKCR7bG9jYWxWZXJzaW9ufSkuIFRoZSBsb2NhbCBBbmd1bGFyIENMSSB2ZXJzaW9uIGlzIHVzZWQuXG5cbiAgICBUbyBkaXNhYmxlIHRoaXMgd2FybmluZyB1c2UgXCJuZyBjb25maWcgLWcgY2xpLndhcm5pbmdzLnZlcnNpb25NaXNtYXRjaCBmYWxzZVwiLlxuICAgIGApO1xuICAgIC8vIERvbid0IHNob3cgd2FybmluZyBjb2xvcmlzZWQgb24gYG5nIGNvbXBsZXRpb25gXG4gICAgaWYgKHByb2Nlc3MuYXJndlsyXSAhPT0gJ2NvbXBsZXRpb24nKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKHdhcm5pbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKHdhcm5pbmcpO1xuICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIE5vIGVycm9yIGltcGxpZXMgYSBwcm9qZWN0TG9jYWxDbGksIHdoaWNoIHdpbGwgbG9hZCB3aGF0ZXZlclxuICAvLyB2ZXJzaW9uIG9mIG5nLWNsaSB5b3UgaGF2ZSBpbnN0YWxsZWQgaW4gYSBsb2NhbCBwYWNrYWdlLmpzb25cbiAgY2xpID0gcmVxdWlyZShwcm9qZWN0TG9jYWxDbGkpO1xufSBjYXRjaCB7XG4gIC8vIElmIHRoZXJlIGlzIGFuIGVycm9yLCByZXNvbHZlIGNvdWxkIG5vdCBmaW5kIHRoZSBuZy1jbGlcbiAgLy8gbGlicmFyeSBmcm9tIGEgcGFja2FnZS5qc29uLiBJbnN0ZWFkLCBpbmNsdWRlIGl0IGZyb20gYSByZWxhdGl2ZVxuICAvLyBwYXRoIHRvIHRoaXMgc2NyaXB0IGZpbGUgKHdoaWNoIGlzIGxpa2VseSBhIGdsb2JhbGx5IGluc3RhbGxlZFxuICAvLyBucG0gcGFja2FnZSkuIE1vc3QgY29tbW9uIGNhdXNlIGZvciBoaXR0aW5nIHRoaXMgaXMgYG5nIG5ld2BcbiAgY2xpID0gcmVxdWlyZSgnLi9jbGknKTtcbn1cblxuaWYgKCdkZWZhdWx0JyBpbiBjbGkpIHtcbiAgY2xpID0gY2xpWydkZWZhdWx0J107XG59XG5cbi8vIFRoaXMgaXMgcmVxdWlyZWQgdG8gc3VwcG9ydCAxLnggbG9jYWwgdmVyc2lvbnMgd2l0aCBhIDYrIGdsb2JhbFxubGV0IHN0YW5kYXJkSW5wdXQ7XG50cnkge1xuICBzdGFuZGFyZElucHV0ID0gcHJvY2Vzcy5zdGRpbjtcbn0gY2F0Y2ggKGUpIHtcbiAgZGVsZXRlIHByb2Nlc3Muc3RkaW47XG4gIHByb2Nlc3Muc3RkaW4gPSBuZXcgRHVwbGV4KCk7XG4gIHN0YW5kYXJkSW5wdXQgPSBwcm9jZXNzLnN0ZGluO1xufVxuXG5jbGkoe1xuICBjbGlBcmdzOiBwcm9jZXNzLmFyZ3Yuc2xpY2UoMiksXG4gIGlucHV0U3RyZWFtOiBzdGFuZGFyZElucHV0LFxuICBvdXRwdXRTdHJlYW06IHByb2Nlc3Muc3Rkb3V0LFxufSlcbiAgLnRoZW4oKGV4aXRDb2RlOiBudW1iZXIpID0+IHtcbiAgICBwcm9jZXNzLmV4aXQoZXhpdENvZGUpO1xuICB9KVxuICAuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCdVbmtub3duIGVycm9yOiAnICsgZXJyLnRvU3RyaW5nKCkpO1xuICAgIHByb2Nlc3MuZXhpdCgxMjcpO1xuICB9KTtcbiJdfQ==