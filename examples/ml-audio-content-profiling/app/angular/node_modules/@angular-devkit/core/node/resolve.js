"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const fs = require("fs");
const path = require("path");
const src_1 = require("../src");
const fs_1 = require("./fs");
/**
 * Exception thrown when a module could not be resolved.
 */
class ModuleNotFoundException extends src_1.BaseException {
    constructor(moduleName, basePath) {
        super(`Could not find module ${JSON.stringify(moduleName)} from ${JSON.stringify(basePath)}.`);
        this.moduleName = moduleName;
        this.basePath = basePath;
        this.code = 'MODULE_NOT_FOUND';
    }
}
exports.ModuleNotFoundException = ModuleNotFoundException;
/**
 * Returns a list of all the callers from the resolve() call.
 * @returns {string[]}
 * @private
 */
function _caller() {
    // see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    const error = Error;
    const origPrepareStackTrace = error.prepareStackTrace;
    error.prepareStackTrace = (_, stack) => stack;
    const stack = (new Error()).stack;
    error.prepareStackTrace = origPrepareStackTrace;
    return stack ? stack.map(x => x.getFileName()).filter(x => !!x) : [];
}
/**
 * Get the global directory for node_modules. This is based on NPM code itself, and may be subject
 * to change, but is relatively stable.
 * @returns {string} The path to node_modules itself.
 * @private
 */
function _getGlobalNodeModules() {
    let globalPrefix;
    if (process.env.PREFIX) {
        globalPrefix = process.env.PREFIX;
    }
    else if (process.platform === 'win32') {
        // c:\node\node.exe --> prefix=c:\node\
        globalPrefix = path.dirname(process.execPath);
    }
    else {
        // /usr/local/bin/node --> prefix=/usr/local
        globalPrefix = path.dirname(path.dirname(process.execPath));
        // destdir only is respected on Unix
        const destdir = process.env.DESTDIR;
        if (destdir) {
            globalPrefix = path.join(destdir, globalPrefix);
        }
    }
    return (process.platform !== 'win32')
        ? path.resolve(globalPrefix || '', 'lib', 'node_modules')
        : path.resolve(globalPrefix || '', 'node_modules');
}
let _resolveHook = null;
function setResolveHook(hook) {
    _resolveHook = hook;
}
exports.setResolveHook = setResolveHook;
/**
 * Resolve a package using a logic similar to npm require.resolve, but with more options.
 * @param x The package name to resolve.
 * @param options A list of options. See documentation of those options.
 * @returns {string} Path to the index to include, or if `resolvePackageJson` option was
 *                   passed, a path to that file.
 * @throws {ModuleNotFoundException} If no module with that name was found anywhere.
 */
function resolve(x, options) {
    if (_resolveHook) {
        const maybe = _resolveHook(x, options);
        if (maybe) {
            return maybe;
        }
    }
    const readFileSync = fs.readFileSync;
    const extensions = options.extensions || Object.keys(require.extensions);
    const basePath = options.basedir;
    options.paths = options.paths || [];
    if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(x)) {
        let res = path.resolve(basePath, x);
        if (x === '..' || x.slice(-1) === '/') {
            res += '/';
        }
        const m = loadAsFileSync(res) || loadAsDirectorySync(res);
        if (m) {
            return m;
        }
    }
    else {
        const n = loadNodeModulesSync(x, basePath);
        if (n) {
            return n;
        }
    }
    // Fallback to checking the local (callee) node modules.
    if (options.checkLocal) {
        const callers = _caller();
        for (const caller of callers) {
            const localDir = path.dirname(caller);
            if (localDir !== options.basedir) {
                try {
                    return resolve(x, Object.assign({}, options, { checkLocal: false, checkGlobal: false, basedir: localDir }));
                }
                catch (e) {
                    // Just swap the basePath with the original call one.
                    if (!(e instanceof ModuleNotFoundException)) {
                        throw e;
                    }
                }
            }
        }
    }
    // Fallback to checking the global node modules.
    if (options.checkGlobal) {
        const globalDir = path.dirname(_getGlobalNodeModules());
        if (globalDir !== options.basedir) {
            try {
                return resolve(x, Object.assign({}, options, { checkLocal: false, checkGlobal: false, basedir: globalDir }));
            }
            catch (e) {
                // Just swap the basePath with the original call one.
                if (!(e instanceof ModuleNotFoundException)) {
                    throw e;
                }
            }
        }
    }
    throw new ModuleNotFoundException(x, basePath);
    function loadAsFileSync(x) {
        if (fs_1.isFile(x)) {
            return x;
        }
        return extensions.map(ex => x + ex).find(f => fs_1.isFile(f)) || null;
    }
    function loadAsDirectorySync(x) {
        const pkgfile = path.join(x, 'package.json');
        if (fs_1.isFile(pkgfile)) {
            if (options.resolvePackageJson) {
                return pkgfile;
            }
            try {
                const body = readFileSync(pkgfile, 'UTF8');
                const pkg = JSON.parse(body);
                if (pkg['main']) {
                    if (pkg['main'] === '.' || pkg['main'] === './') {
                        pkg['main'] = 'index';
                    }
                    const m = loadAsFileSync(path.resolve(x, pkg['main']));
                    if (m) {
                        return m;
                    }
                    const n = loadAsDirectorySync(path.resolve(x, pkg['main']));
                    if (n) {
                        return n;
                    }
                }
            }
            catch (_a) { }
        }
        return loadAsFileSync(path.join(x, '/index'));
    }
    function loadNodeModulesSync(x, start) {
        const dirs = nodeModulesPaths(start, options);
        for (const dir of dirs) {
            const m = loadAsFileSync(path.join(dir, '/', x));
            if (m) {
                return m;
            }
            const n = loadAsDirectorySync(path.join(dir, '/', x));
            if (n) {
                return n;
            }
        }
        return null;
    }
    function nodeModulesPaths(start, opts) {
        const modules = ['node_modules'];
        if (process.env.BAZEL_TARGET) {
            // When running test under Bazel, node_modules have to be resolved
            // differently. node_modules are installed in the `npm` workspace.
            // For more info, see `yarn_install` rule in WORKSPACE file.
            modules.push(path.join('npm', 'node_modules'));
        }
        // ensure that `start` is an absolute path at this point,
        // resolving against the process' current working directory
        let absoluteStart = path.resolve(start);
        if (opts && opts.preserveSymlinks === false) {
            try {
                absoluteStart = fs.realpathSync(absoluteStart);
            }
            catch (err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
            }
        }
        let prefix = '/';
        if (/^([A-Za-z]:)/.test(absoluteStart)) {
            prefix = '';
        }
        else if (/^\\\\/.test(absoluteStart)) {
            prefix = '\\\\';
        }
        const paths = [absoluteStart];
        let parsed = path.parse(absoluteStart);
        while (parsed.dir !== paths[paths.length - 1]) {
            paths.push(parsed.dir);
            parsed = path.parse(parsed.dir);
        }
        const dirs = paths.reduce((dirs, aPath) => {
            return dirs.concat(modules.map(function (moduleDir) {
                return path.join(prefix, aPath, moduleDir);
            }));
        }, []);
        return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
    }
}
exports.resolve = resolve;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9ub2RlL3Jlc29sdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUF1QztBQUN2Qyw2QkFBOEI7QUFFOUI7O0dBRUc7QUFDSCxNQUFhLHVCQUF3QixTQUFRLG1CQUFhO0lBR3hELFlBQTRCLFVBQWtCLEVBQWtCLFFBQWdCO1FBQzlFLEtBQUssQ0FBQyx5QkFBeUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsU0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQURyRSxlQUFVLEdBQVYsVUFBVSxDQUFRO1FBQWtCLGFBQVEsR0FBUixRQUFRLENBQVE7UUFFOUUsSUFBSSxDQUFDLElBQUksR0FBRyxrQkFBa0IsQ0FBQztJQUNqQyxDQUFDO0NBQ0Y7QUFQRCwwREFPQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLE9BQU87SUFDZCxnRUFBZ0U7SUFDaEUsTUFBTSxLQUFLLEdBQUcsS0FBOEQsQ0FBQztJQUM3RSxNQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztJQUN0RCxLQUFLLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUM7SUFDOUMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBa0UsQ0FBQztJQUMvRixLQUFLLENBQUMsaUJBQWlCLEdBQUcscUJBQXFCLENBQUM7SUFFaEQsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxD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LFVBQVUsU0FBUztnQkFDaEQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNOLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVQLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDN0QsQ0FBQztBQUNILENBQUM7QUFqTEQsMEJBaUxDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICcuLi9zcmMnO1xuaW1wb3J0IHsgaXNGaWxlIH0gZnJvbSAnLi9mcyc7XG5cbi8qKlxuICogRXhjZXB0aW9uIHRocm93biB3aGVuIGEgbW9kdWxlIGNvdWxkIG5vdCBiZSByZXNvbHZlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE1vZHVsZU5vdEZvdW5kRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIHB1YmxpYyByZWFkb25seSBjb2RlOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IG1vZHVsZU5hbWU6IHN0cmluZywgcHVibGljIHJlYWRvbmx5IGJhc2VQYXRoOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ291bGQgbm90IGZpbmQgbW9kdWxlICR7SlNPTi5zdHJpbmdpZnkobW9kdWxlTmFtZSl9IGZyb20gJHtKU09OLnN0cmluZ2lmeShiYXNlUGF0aCl9LmApO1xuICAgIHRoaXMuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgY2FsbGVycyBmcm9tIHRoZSByZXNvbHZlKCkgY2FsbC5cbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9jYWxsZXIoKTogc3RyaW5nW10ge1xuICAvLyBzZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC93aWtpL0phdmFTY3JpcHRTdGFja1RyYWNlQXBpXG4gIGNvbnN0IGVycm9yID0gRXJyb3IgYXMge30gYXMgeyBwcmVwYXJlU3RhY2tUcmFjZTogKHg6IHt9LCBzdGFjazoge30pID0+IHt9IH07XG4gIGNvbnN0IG9yaWdQcmVwYXJlU3RhY2tUcmFjZSA9IGVycm9yLnByZXBhcmVTdGFja1RyYWNlO1xuICBlcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IChfLCBzdGFjaykgPT4gc3RhY2s7XG4gIGNvbnN0IHN0YWNrID0gKG5ldyBFcnJvcigpKS5zdGFjayBhcyB7fSB8IHVuZGVmaW5lZCBhcyB7IGdldEZpbGVOYW1lKCk6IHN0cmluZyB9W10gfCB1bmRlZmluZWQ7XG4gIGVycm9yLnByZXBhcmVTdGFja1RyYWNlID0gb3JpZ1ByZXBhcmVTdGFja1RyYWNlO1xuXG4gIHJldHVybiBzdGFjayA/IHN0YWNrLm1hcCh4ID0+IHguZ2V0RmlsZU5hbWUoKSkuZmlsdGVyKHggPT4gISF4KSA6IFtdO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBnbG9iYWwgZGlyZWN0b3J5IGZvciBub2RlX21vZHVsZXMuIFRoaXMgaXMgYmFzZWQgb24gTlBNIGNvZGUgaXRzZWxmLCBhbmQgbWF5IGJlIHN1YmplY3RcbiAqIHRvIGNoYW5nZSwgYnV0IGlzIHJlbGF0aXZlbHkgc3RhYmxlLlxuICogQHJldHVybnMge3N0cmluZ30gVGhlIHBhdGggdG8gbm9kZV9tb2R1bGVzIGl0c2VsZi5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9nZXRHbG9iYWxOb2RlTW9kdWxlcygpIHtcbiAgbGV0IGdsb2JhbFByZWZpeDtcblxuICBpZiAocHJvY2Vzcy5lbnYuUFJFRklYKSB7XG4gICAgZ2xvYmFsUHJlZml4ID0gcHJvY2Vzcy5lbnYuUFJFRklYO1xuICB9IGVsc2UgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAvLyBjOlxcbm9kZVxcbm9kZS5leGUgLS0+IHByZWZpeD1jOlxcbm9kZVxcXG4gICAgZ2xvYmFsUHJlZml4ID0gcGF0aC5kaXJuYW1lKHByb2Nlc3MuZXhlY1BhdGgpO1xuICB9IGVsc2Uge1xuICAgIC8vIC91c3IvbG9jYWwvYmluL25vZGUgLS0+IHByZWZpeD0vdXNyL2xvY2FsXG4gICAgZ2xvYmFsUHJlZml4ID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShwcm9jZXNzLmV4ZWNQYXRoKSk7XG5cbiAgICAvLyBkZXN0ZGlyIG9ubHkgaXMgcmVzcGVjdGVkIG9uIFVuaXhcbiAgICBjb25zdCBkZXN0ZGlyID0gcHJvY2Vzcy5lbnYuREVTVERJUjtcbiAgICBpZiAoZGVzdGRpcikge1xuICAgICAgZ2xvYmFsUHJlZml4ID0gcGF0aC5qb2luKGRlc3RkaXIsIGdsb2JhbFByZWZpeCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKVxuICAgID8gcGF0aC5yZXNvbHZlKGdsb2JhbFByZWZpeCB8fCAnJywgJ2xpYicsICdub2RlX21vZHVsZXMnKVxuICAgIDogcGF0aC5yZXNvbHZlKGdsb2JhbFByZWZpeCB8fCAnJywgJ25vZGVfbW9kdWxlcycpO1xufVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZU9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGJhc2VkaXIgdG8gdXNlIGZyb20gd2hpY2ggdG8gcmVzb2x2ZS5cbiAgICovXG4gIGJhc2VkaXI6IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2YgZXh0ZW5zaW9ucyB0byByZXNvbHZlLiBCeSBkZWZhdWx0IHVzZXMgT2JqZWN0LmtleXMocmVxdWlyZS5leHRlbnNpb25zKS5cbiAgICovXG4gIGV4dGVuc2lvbnM/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogQW4gYWRkaXRpb25hbCBsaXN0IG9mIHBhdGhzIHRvIGxvb2sgaW50by5cbiAgICovXG4gIHBhdGhzPzogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRvIHByZXNlcnZlIHN5bWJvbGljIGxpbmtzLiBJZiBmYWxzZSwgdGhlIGFjdHVhbCBwYXRocyBwb2ludGVkIGJ5XG4gICAqIHRoZSBzeW1ib2xpYyBsaW5rcyB3aWxsIGJlIHVzZWQuIFRoaXMgZGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICovXG4gIHByZXNlcnZlU3ltbGlua3M/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGZhbGxiYWNrIHRvIGEgZ2xvYmFsIGxvb2t1cCBpZiB0aGUgYmFzZWRpciBvbmUgZmFpbGVkLlxuICAgKi9cbiAgY2hlY2tHbG9iYWw/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGZhbGxiYWNrIHRvIHVzaW5nIHRoZSBsb2NhbCBjYWxsZXIncyBkaXJlY3RvcnkgaWYgdGhlIGJhc2VkaXIgZmFpbGVkLlxuICAgKi9cbiAgY2hlY2tMb2NhbD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gb25seSByZXNvbHZlIGFuZCByZXR1cm4gdGhlIGZpcnN0IHBhY2thZ2UuanNvbiBmaWxlIGZvdW5kLiBCeSBkZWZhdWx0LFxuICAgKiByZXNvbHZlcyB0aGUgbWFpbiBmaWVsZCBvciB0aGUgaW5kZXggb2YgdGhlIHBhY2thZ2UuXG4gICAqL1xuICByZXNvbHZlUGFja2FnZUpzb24/OiBib29sZWFuO1xufVxuXG5cbmxldCBfcmVzb2x2ZUhvb2s6ICgoeDogc3RyaW5nLCBvcHRpb25zOiBSZXNvbHZlT3B0aW9ucykgPT4gc3RyaW5nIHwgbnVsbCkgfCBudWxsID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBzZXRSZXNvbHZlSG9vayhcbiAgaG9vazogKCh4OiBzdHJpbmcsIG9wdGlvbnM6IFJlc29sdmVPcHRpb25zKSA9PiBzdHJpbmcgfCBudWxsKSB8IG51bGwsXG4pIHtcbiAgX3Jlc29sdmVIb29rID0gaG9vaztcbn1cblxuXG4vKipcbiAqIFJlc29sdmUgYSBwYWNrYWdlIHVzaW5nIGEgbG9naWMgc2ltaWxhciB0byBucG0gcmVxdWlyZS5yZXNvbHZlLCBidXQgd2l0aCBtb3JlIG9wdGlvbnMuXG4gKiBAcGFyYW0geCBUaGUgcGFja2FnZSBuYW1lIHRvIHJlc29sdmUuXG4gKiBAcGFyYW0gb3B0aW9ucyBBIGxpc3Qgb2Ygb3B0aW9ucy4gU2VlIGRvY3VtZW50YXRpb24gb2YgdGhvc2Ugb3B0aW9ucy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFBhdGggdG8gdGhlIGluZGV4IHRvIGluY2x1ZGUsIG9yIGlmIGByZXNvbHZlUGFja2FnZUpzb25gIG9wdGlvbiB3YXNcbiAqICAgICAgICAgICAgICAgICAgIHBhc3NlZCwgYSBwYXRoIHRvIHRoYXQgZmlsZS5cbiAqIEB0aHJvd3Mge01vZHVsZU5vdEZvdW5kRXhjZXB0aW9ufSBJZiBubyBtb2R1bGUgd2l0aCB0aGF0IG5hbWUgd2FzIGZvdW5kIGFueXdoZXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZSh4OiBzdHJpbmcsIG9wdGlvbnM6IFJlc29sdmVPcHRpb25zKTogc3RyaW5nIHtcbiAgaWYgKF9yZXNvbHZlSG9vaykge1xuICAgIGNvbnN0IG1heWJlID0gX3Jlc29sdmVIb29rKHgsIG9wdGlvbnMpO1xuICAgIGlmIChtYXliZSkge1xuICAgICAgcmV0dXJuIG1heWJlO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJlYWRGaWxlU3luYyA9IGZzLnJlYWRGaWxlU3luYztcblxuICBjb25zdCBleHRlbnNpb25zOiBzdHJpbmdbXSA9IG9wdGlvbnMuZXh0ZW5zaW9ucyB8fCBPYmplY3Qua2V5cyhyZXF1aXJlLmV4dGVuc2lvbnMpO1xuICBjb25zdCBiYXNlUGF0aCA9IG9wdGlvbnMuYmFzZWRpcjtcblxuICBvcHRpb25zLnBhdGhzID0gb3B0aW9ucy5wYXRocyB8fCBbXTtcblxuICBpZiAoL14oPzpcXC5cXC4/KD86XFwvfCQpfFxcL3woW0EtWmEtel06KT9bL1xcXFxdKS8udGVzdCh4KSkge1xuICAgIGxldCByZXMgPSBwYXRoLnJlc29sdmUoYmFzZVBhdGgsIHgpO1xuICAgIGlmICh4ID09PSAnLi4nIHx8IHguc2xpY2UoLTEpID09PSAnLycpIHtcbiAgICAgIHJlcyArPSAnLyc7XG4gICAgfVxuXG4gICAgY29uc3QgbSA9IGxvYWRBc0ZpbGVTeW5jKHJlcykgfHwgbG9hZEFzRGlyZWN0b3J5U3luYyhyZXMpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXR1cm4gbTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbiA9IGxvYWROb2RlTW9kdWxlc1N5bmMoeCwgYmFzZVBhdGgpO1xuICAgIGlmIChuKSB7XG4gICAgICByZXR1cm4gbjtcbiAgICB9XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBjaGVja2luZyB0aGUgbG9jYWwgKGNhbGxlZSkgbm9kZSBtb2R1bGVzLlxuICBpZiAob3B0aW9ucy5jaGVja0xvY2FsKSB7XG4gICAgY29uc3QgY2FsbGVycyA9IF9jYWxsZXIoKTtcbiAgICBmb3IgKGNvbnN0IGNhbGxlciBvZiBjYWxsZXJzKSB7XG4gICAgICBjb25zdCBsb2NhbERpciA9IHBhdGguZGlybmFtZShjYWxsZXIpO1xuICAgICAgaWYgKGxvY2FsRGlyICE9PSBvcHRpb25zLmJhc2VkaXIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh4LCB7XG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgY2hlY2tMb2NhbDogZmFsc2UsXG4gICAgICAgICAgICBjaGVja0dsb2JhbDogZmFsc2UsXG4gICAgICAgICAgICBiYXNlZGlyOiBsb2NhbERpcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIEp1c3Qgc3dhcCB0aGUgYmFzZVBhdGggd2l0aCB0aGUgb3JpZ2luYWwgY2FsbCBvbmUuXG4gICAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIE1vZHVsZU5vdEZvdW5kRXhjZXB0aW9uKSkge1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBjaGVja2luZyB0aGUgZ2xvYmFsIG5vZGUgbW9kdWxlcy5cbiAgaWYgKG9wdGlvbnMuY2hlY2tHbG9iYWwpIHtcbiAgICBjb25zdCBnbG9iYWxEaXIgPSBwYXRoLmRpcm5hbWUoX2dldEdsb2JhbE5vZGVNb2R1bGVzKCkpO1xuICAgIGlmIChnbG9iYWxEaXIgIT09IG9wdGlvbnMuYmFzZWRpcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeCwge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgY2hlY2tMb2NhbDogZmFsc2UsXG4gICAgICAgICAgY2hlY2tHbG9iYWw6IGZhbHNlLFxuICAgICAgICAgIGJhc2VkaXI6IGdsb2JhbERpcixcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIEp1c3Qgc3dhcCB0aGUgYmFzZVBhdGggd2l0aCB0aGUgb3JpZ2luYWwgY2FsbCBvbmUuXG4gICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBNb2R1bGVOb3RGb3VuZEV4Y2VwdGlvbikpIHtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IE1vZHVsZU5vdEZvdW5kRXhjZXB0aW9uKHgsIGJhc2VQYXRoKTtcblxuICBmdW5jdGlvbiBsb2FkQXNGaWxlU3luYyh4OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoaXNGaWxlKHgpKSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9XG5cbiAgICByZXR1cm4gZXh0ZW5zaW9ucy5tYXAoZXggPT4geCArIGV4KS5maW5kKGYgPT4gaXNGaWxlKGYpKSB8fCBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZEFzRGlyZWN0b3J5U3luYyh4OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBwa2dmaWxlID0gcGF0aC5qb2luKHgsICdwYWNrYWdlLmpzb24nKTtcbiAgICBpZiAoaXNGaWxlKHBrZ2ZpbGUpKSB7XG4gICAgICBpZiAob3B0aW9ucy5yZXNvbHZlUGFja2FnZUpzb24pIHtcbiAgICAgICAgcmV0dXJuIHBrZ2ZpbGU7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSByZWFkRmlsZVN5bmMocGtnZmlsZSwgJ1VURjgnKTtcbiAgICAgICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZShib2R5KTtcblxuICAgICAgICBpZiAocGtnWydtYWluJ10pIHtcbiAgICAgICAgICBpZiAocGtnWydtYWluJ10gPT09ICcuJyB8fCBwa2dbJ21haW4nXSA9PT0gJy4vJykge1xuICAgICAgICAgICAgcGtnWydtYWluJ10gPSAnaW5kZXgnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG0gPSBsb2FkQXNGaWxlU3luYyhwYXRoLnJlc29sdmUoeCwgcGtnWydtYWluJ10pKTtcbiAgICAgICAgICBpZiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIG07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IG4gPSBsb2FkQXNEaXJlY3RvcnlTeW5jKHBhdGgucmVzb2x2ZSh4LCBwa2dbJ21haW4nXSkpO1xuICAgICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG5cbiAgICByZXR1cm4gbG9hZEFzRmlsZVN5bmMocGF0aC5qb2luKHgsICcvaW5kZXgnKSk7XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkTm9kZU1vZHVsZXNTeW5jKHg6IHN0cmluZywgc3RhcnQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IGRpcnMgPSBub2RlTW9kdWxlc1BhdGhzKHN0YXJ0LCBvcHRpb25zKTtcbiAgICBmb3IgKGNvbnN0IGRpciBvZiBkaXJzKSB7XG4gICAgICBjb25zdCBtID0gbG9hZEFzRmlsZVN5bmMocGF0aC5qb2luKGRpciwgJy8nLCB4KSk7XG4gICAgICBpZiAobSkge1xuICAgICAgICByZXR1cm4gbTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG4gPSBsb2FkQXNEaXJlY3RvcnlTeW5jKHBhdGguam9pbihkaXIsICcvJywgeCkpO1xuICAgICAgaWYgKG4pIHtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBub2RlTW9kdWxlc1BhdGhzKHN0YXJ0OiBzdHJpbmcsIG9wdHM6IFJlc29sdmVPcHRpb25zKSB7XG4gICAgY29uc3QgbW9kdWxlcyA9IFsnbm9kZV9tb2R1bGVzJ107XG4gICAgaWYgKHByb2Nlc3MuZW52LkJBWkVMX1RBUkdFVCkge1xuICAgICAgLy8gV2hlbiBydW5uaW5nIHRlc3QgdW5kZXIgQmF6ZWwsIG5vZGVfbW9kdWxlcyBoYXZlIHRvIGJlIHJlc29sdmVkXG4gICAgICAvLyBkaWZmZXJlbnRseS4gbm9kZV9tb2R1bGVzIGFyZSBpbnN0YWxsZWQgaW4gdGhlIGBucG1gIHdvcmtzcGFjZS5cbiAgICAgIC8vIEZvciBtb3JlIGluZm8sIHNlZSBgeWFybl9pbnN0YWxsYCBydWxlIGluIFdPUktTUEFDRSBmaWxlLlxuICAgICAgbW9kdWxlcy5wdXNoKHBhdGguam9pbignbnBtJywgJ25vZGVfbW9kdWxlcycpKTtcbiAgICB9XG5cbiAgICAvLyBlbnN1cmUgdGhhdCBgc3RhcnRgIGlzIGFuIGFic29sdXRlIHBhdGggYXQgdGhpcyBwb2ludCxcbiAgICAvLyByZXNvbHZpbmcgYWdhaW5zdCB0aGUgcHJvY2VzcycgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeVxuICAgIGxldCBhYnNvbHV0ZVN0YXJ0ID0gcGF0aC5yZXNvbHZlKHN0YXJ0KTtcblxuICAgIGlmIChvcHRzICYmIG9wdHMucHJlc2VydmVTeW1saW5rcyA9PT0gZmFsc2UpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGFic29sdXRlU3RhcnQgPSBmcy5yZWFscGF0aFN5bmMoYWJzb2x1dGVTdGFydCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBwcmVmaXggPSAnLyc7XG4gICAgaWYgKC9eKFtBLVphLXpdOikvLnRlc3QoYWJzb2x1dGVTdGFydCkpIHtcbiAgICAgIHByZWZpeCA9ICcnO1xuICAgIH0gZWxzZSBpZiAoL15cXFxcXFxcXC8udGVzdChhYnNvbHV0ZVN0YXJ0KSkge1xuICAgICAgcHJlZml4ID0gJ1xcXFxcXFxcJztcbiAgICB9XG5cbiAgICBjb25zdCBwYXRocyA9IFthYnNvbHV0ZVN0YXJ0XTtcbiAgICBsZXQgcGFyc2VkID0gcGF0aC5wYXJzZShhYnNvbHV0ZVN0YXJ0KTtcbiAgICB3aGlsZSAocGFyc2VkLmRpciAhPT0gcGF0aHNbcGF0aHMubGVuZ3RoIC0gMV0pIHtcbiAgICAgIHBhdGhzLnB1c2gocGFyc2VkLmRpcik7XG4gICAgICBwYXJzZWQgPSBwYXRoLnBhcnNlKHBhcnNlZC5kaXIpO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcnMgPSBwYXRocy5yZWR1Y2UoKGRpcnM6IHN0cmluZ1tdLCBhUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICByZXR1cm4gZGlycy5jb25jYXQobW9kdWxlcy5tYXAoZnVuY3Rpb24gKG1vZHVsZURpcikge1xuICAgICAgICByZXR1cm4gcGF0aC5qb2luKHByZWZpeCwgYVBhdGgsIG1vZHVsZURpcik7XG4gICAgICB9KSk7XG4gICAgfSwgW10pO1xuXG4gICAgcmV0dXJuIG9wdHMgJiYgb3B0cy5wYXRocyA/IGRpcnMuY29uY2F0KG9wdHMucGF0aHMpIDogZGlycztcbiAgfVxufVxuIl19