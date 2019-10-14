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
const MODULE_EXT = '.module.ts';
const ROUTING_MODULE_EXT = '-routing.module.ts';
/**
 * Find the module referred by a set of options passed to the schematics.
 */
function findModuleFromOptions(host, options) {
    if (options.hasOwnProperty('skipImport') && options.skipImport) {
        return undefined;
    }
    const moduleExt = options.moduleExt || MODULE_EXT;
    const routingModuleExt = options.routingModuleExt || ROUTING_MODULE_EXT;
    if (!options.module) {
        options.nameFormatter = options.nameFormatter || core_1.strings.dasherize;
        const pathToCheck = (options.path || '') + '/' + options.nameFormatter(options.name);
        return core_1.normalize(findModule(host, pathToCheck, moduleExt, routingModuleExt));
    }
    else {
        const modulePath = core_1.normalize(`/${options.path}/${options.module}`);
        const componentPath = core_1.normalize(`/${options.path}/${options.name}`);
        const moduleBaseName = core_1.normalize(modulePath).split('/').pop();
        const candidateSet = new Set([
            core_1.normalize(options.path || '/'),
        ]);
        for (let dir = modulePath; dir != core_1.NormalizedRoot; dir = core_1.dirname(dir)) {
            candidateSet.add(dir);
        }
        for (let dir = componentPath; dir != core_1.NormalizedRoot; dir = core_1.dirname(dir)) {
            candidateSet.add(dir);
        }
        const candidatesDirs = [...candidateSet].sort((a, b) => b.length - a.length);
        for (const c of candidatesDirs) {
            const candidateFiles = [
                '',
                `${moduleBaseName}.ts`,
                `${moduleBaseName}${moduleExt}`,
            ].map(x => core_1.join(c, x));
            for (const sc of candidateFiles) {
                if (host.exists(sc)) {
                    return core_1.normalize(sc);
                }
            }
        }
        throw new Error(`Specified module '${options.module}' does not exist.\n`
            + `Looked in the following directories:\n    ${candidatesDirs.join('\n    ')}`);
    }
}
exports.findModuleFromOptions = findModuleFromOptions;
/**
 * Function to find the "closest" module to a generated file's path.
 */
function findModule(host, generateDir, moduleExt = MODULE_EXT, routingModuleExt = ROUTING_MODULE_EXT) {
    let dir = host.getDir('/' + generateDir);
    let foundRoutingModule = false;
    while (dir) {
        const allMatches = dir.subfiles.filter(p => p.endsWith(moduleExt));
        const filteredMatches = allMatches.filter(p => !p.endsWith(routingModuleExt));
        foundRoutingModule = foundRoutingModule || allMatches.length !== filteredMatches.length;
        if (filteredMatches.length == 1) {
            return core_1.join(dir.path, filteredMatches[0]);
        }
        else if (filteredMatches.length > 1) {
            throw new Error('More than one module matches. Use skip-import option to skip importing '
                + 'the component into the closest module.');
        }
        dir = dir.parent;
    }
    const errorMsg = foundRoutingModule ? 'Could not find a non Routing NgModule.'
        + `\nModules with suffix '${routingModuleExt}' are strictly reserved for routing.`
        + '\nUse the skip-import option to skip importing in NgModule.'
        : 'Could not find an NgModule. Use the skip-import option to skip importing in NgModule.';
    throw new Error(errorMsg);
}
exports.findModule = findModule;
/**
 * Build a relative path from one file path to another file path.
 */
function buildRelativePath(from, to) {
    from = core_1.normalize(from);
    to = core_1.normalize(to);
    // Convert to arrays.
    const fromParts = from.split('/');
    const toParts = to.split('/');
    // Remove file names (preserving destination)
    fromParts.pop();
    const toFileName = toParts.pop();
    const relativePath = core_1.relative(core_1.normalize(fromParts.join('/')), core_1.normalize(toParts.join('/')));
    let pathPrefix = '';
    // Set the path prefix for same dir or child dir, parent dir starts with `..`
    if (!relativePath) {
        pathPrefix = '.';
    }
    else if (!relativePath.startsWith('.')) {
        pathPrefix = `./`;
    }
    if (pathPrefix && !pathPrefix.endsWith('/')) {
        pathPrefix += '/';
    }
    return pathPrefix + (relativePath ? relativePath + '/' : '') + toFileName;
}
exports.buildRelativePath = buildRelativePath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2ZpbmQtbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBUThCO0FBZTlCLE1BQU0sVUFBVSxHQUFHLFlBQVksQ0FBQztBQUNoQyxNQUFNLGtCQUFrQixHQUFHLG9CQUFvQixDQUFDO0FBRWhEOztHQUVHO0FBQ0gsU0FBZ0IscUJBQXFCLENBQUMsSUFBVSxFQUFFLE9BQXNCO0lBQ3RFLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFO1FBQzlELE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxVQUFVLENBQUM7SUFDbEQsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLElBQUksa0JBQWtCLENBQUM7SUFFeEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7UUFDbkIsT0FBTyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsYUFBYSxJQUFJLGNBQU8sQ0FBQyxTQUFTLENBQUM7UUFDbkUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyRixPQUFPLGdCQUFTLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztLQUM5RTtTQUFNO1FBQ0wsTUFBTSxVQUFVLEdBQUcsZ0JBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDbkUsTUFBTSxh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QUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUN4QyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ25CO0lBQ0QsSUFBSSxVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQzNDLFVBQVUsSUFBSSxHQUFHLENBQUM7S0FDbkI7SUFFRCxPQUFPLFVBQVUsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDO0FBQzVFLENBQUM7QUExQkQsOENBMEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgTm9ybWFsaXplZFJvb3QsXG4gIFBhdGgsXG4gIGRpcm5hbWUsXG4gIGpvaW4sXG4gIG5vcm1hbGl6ZSxcbiAgcmVsYXRpdmUsXG4gIHN0cmluZ3MsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IERpckVudHJ5LCBUcmVlIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9kdWxlT3B0aW9ucyB7XG4gIG1vZHVsZT86IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBmbGF0PzogYm9vbGVhbjtcbiAgcGF0aD86IHN0cmluZztcbiAgc2tpcEltcG9ydD86IGJvb2xlYW47XG4gIG1vZHVsZUV4dD86IHN0cmluZztcbiAgcm91dGluZ01vZHVsZUV4dD86IHN0cmluZztcbiAgbmFtZUZvcm1hdHRlcj86IChzdHI6IHN0cmluZykgPT4gc3RyaW5nO1xufVxuXG5jb25zdCBNT0RVTEVfRVhUID0gJy5tb2R1bGUudHMnO1xuY29uc3QgUk9VVElOR19NT0RVTEVfRVhUID0gJy1yb3V0aW5nLm1vZHVsZS50cyc7XG5cbi8qKlxuICogRmluZCB0aGUgbW9kdWxlIHJlZmVycmVkIGJ5IGEgc2V0IG9mIG9wdGlvbnMgcGFzc2VkIHRvIHRoZSBzY2hlbWF0aWNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZE1vZHVsZUZyb21PcHRpb25zKGhvc3Q6IFRyZWUsIG9wdGlvbnM6IE1vZHVsZU9wdGlvbnMpOiBQYXRoIHwgdW5kZWZpbmVkIHtcbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ3NraXBJbXBvcnQnKSAmJiBvcHRpb25zLnNraXBJbXBvcnQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgbW9kdWxlRXh0ID0gb3B0aW9ucy5tb2R1bGVFeHQgfHwgTU9EVUxFX0VYVDtcbiAgY29uc3Qgcm91dGluZ01vZHVsZUV4dCA9IG9wdGlvbnMucm91dGluZ01vZHVsZUV4dCB8fCBST1VUSU5HX01PRFVMRV9FWFQ7XG5cbiAgaWYgKCFvcHRpb25zLm1vZHVsZSkge1xuICAgIG9wdGlvbnMubmFtZUZvcm1hdHRlciA9IG9wdGlvbnMubmFtZUZvcm1hdHRlciB8fCBzdHJpbmdzLmRhc2hlcml6ZTtcbiAgICBjb25zdCBwYXRoVG9DaGVjayA9IChvcHRpb25zLnBhdGggfHwgJycpICsgJy8nICsgb3B0aW9ucy5uYW1lRm9ybWF0dGVyKG9wdGlvbnMubmFtZSk7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplKGZpbmRNb2R1bGUoaG9zdCwgcGF0aFRvQ2hlY2ssIG1vZHVsZUV4dCwgcm91dGluZ01vZHVsZUV4dCkpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1vZHVsZVBhdGggPSBub3JtYWxpemUoYC8ke29wdGlvbnMucGF0aH0vJHtvcHRpb25zLm1vZHVsZX1gKTtcbiAgICBjb25zdCBjb21wb25lbnRQYXRoID0gbm9ybWFsaXplKGAvJHtvcHRpb25zLnBhdGh9LyR7b3B0aW9ucy5uYW1lfWApO1xuICAgIGNvbnN0IG1vZHVsZUJhc2VOYW1lID0gbm9ybWFsaXplKG1vZHVsZVBhdGgpLnNwbGl0KCcvJykucG9wKCk7XG5cbiAgICBjb25zdCBjYW5kaWRhdGVTZXQgPSBuZXcgU2V0PFBhdGg+KFtcbiAgICAgIG5vcm1hbGl6ZShvcHRpb25zLnBhdGggfHwgJy8nKSxcbiAgICBdKTtcblxuICAgIGZvciAobGV0IGRpciA9IG1vZHVsZVBhdGg7IGRpciAhPSBOb3JtYWxpemVkUm9vdDsgZGlyID0gZGlybmFtZShkaXIpKSB7XG4gICAgICBjYW5kaWRhdGVTZXQuYWRkKGRpcik7XG4gICAgfVxuICAgIGZvciAobGV0IGRpciA9IGNvbXBvbmVudFBhdGg7IGRpciAhPSBOb3JtYWxpemVkUm9vdDsgZGlyID0gZGlybmFtZShkaXIpKSB7XG4gICAgICBjYW5kaWRhdGVTZXQuYWRkKGRpcik7XG4gICAgfVxuXG4gICAgY29uc3QgY2FuZGlkYXRlc0RpcnMgPSBbLi4uY2FuZGlkYXRlU2V0XS5zb3J0KChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoKTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgY2FuZGlkYXRlc0RpcnMpIHtcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZUZpbGVzID0gW1xuICAgICAgICAnJyxcbiAgICAgICAgYCR7bW9kdWxlQmFzZU5hbWV9LnRzYCxcbiAgICAgICAgYCR7bW9kdWxlQmFzZU5hbWV9JHttb2R1bGVFeHR9YCxcbiAgICAgIF0ubWFwKHggPT4gam9pbihjLCB4KSk7XG5cbiAgICAgIGZvciAoY29uc3Qgc2Mgb2YgY2FuZGlkYXRlRmlsZXMpIHtcbiAgICAgICAgaWYgKGhvc3QuZXhpc3RzKHNjKSkge1xuICAgICAgICAgIHJldHVybiBub3JtYWxpemUoc2MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFNwZWNpZmllZCBtb2R1bGUgJyR7b3B0aW9ucy5tb2R1bGV9JyBkb2VzIG5vdCBleGlzdC5cXG5gXG4gICAgICAgICsgYExvb2tlZCBpbiB0aGUgZm9sbG93aW5nIGRpcmVjdG9yaWVzOlxcbiAgICAke2NhbmRpZGF0ZXNEaXJzLmpvaW4oJ1xcbiAgICAnKX1gLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBmaW5kIHRoZSBcImNsb3Nlc3RcIiBtb2R1bGUgdG8gYSBnZW5lcmF0ZWQgZmlsZSdzIHBhdGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTW9kdWxlKGhvc3Q6IFRyZWUsIGdlbmVyYXRlRGlyOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVFeHQgPSBNT0RVTEVfRVhULCByb3V0aW5nTW9kdWxlRXh0ID0gUk9VVElOR19NT0RVTEVfRVhUKTogUGF0aCB7XG5cbiAgbGV0IGRpcjogRGlyRW50cnkgfCBudWxsID0gaG9zdC5nZXREaXIoJy8nICsgZ2VuZXJhdGVEaXIpO1xuICBsZXQgZm91bmRSb3V0aW5nTW9kdWxlID0gZmFsc2U7XG5cbiAgd2hpbGUgKGRpcikge1xuICAgIGNvbnN0IGFsbE1hdGNoZXMgPSBkaXIuc3ViZmlsZXMuZmlsdGVyKHAgPT4gcC5lbmRzV2l0aChtb2R1bGVFeHQpKTtcbiAgICBjb25zdCBmaWx0ZXJlZE1hdGNoZXMgPSBhbGxNYXRjaGVzLmZpbHRlcihwID0+ICFwLmVuZHNXaXRoKHJvdXRpbmdNb2R1bGVFeHQpKTtcblxuICAgIGZvdW5kUm91dGluZ01vZHVsZSA9IGZvdW5kUm91dGluZ01vZHVsZSB8fCBhbGxNYXRjaGVzLmxlbmd0aCAhPT0gZmlsdGVyZWRNYXRjaGVzLmxlbmd0aDtcblxuICAgIGlmIChmaWx0ZXJlZE1hdGNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgIHJldHVybiBqb2luKGRpci5wYXRoLCBmaWx0ZXJlZE1hdGNoZXNbMF0pO1xuICAgIH0gZWxzZSBpZiAoZmlsdGVyZWRNYXRjaGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTW9yZSB0aGFuIG9uZSBtb2R1bGUgbWF0Y2hlcy4gVXNlIHNraXAtaW1wb3J0IG9wdGlvbiB0byBza2lwIGltcG9ydGluZyAnXG4gICAgICAgICsgJ3RoZSBjb21wb25lbnQgaW50byB0aGUgY2xvc2VzdCBtb2R1bGUuJyk7XG4gICAgfVxuXG4gICAgZGlyID0gZGlyLnBhcmVudDtcbiAgfVxuXG4gIGNvbnN0IGVycm9yTXNnID0gZm91bmRSb3V0aW5nTW9kdWxlID8gJ0NvdWxkIG5vdCBmaW5kIGEgbm9uIFJvdXRpbmcgTmdNb2R1bGUuJ1xuICAgICsgYFxcbk1vZHVsZXMgd2l0aCBzdWZmaXggJyR7cm91dGluZ01vZHVsZUV4dH0nIGFyZSBzdHJpY3RseSByZXNlcnZlZCBmb3Igcm91dGluZy5gXG4gICAgKyAnXFxuVXNlIHRoZSBza2lwLWltcG9ydCBvcHRpb24gdG8gc2tpcCBpbXBvcnRpbmcgaW4gTmdNb2R1bGUuJ1xuICAgIDogJ0NvdWxkIG5vdCBmaW5kIGFuIE5nTW9kdWxlLiBVc2UgdGhlIHNraXAtaW1wb3J0IG9wdGlvbiB0byBza2lwIGltcG9ydGluZyBpbiBOZ01vZHVsZS4nO1xuXG4gIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyk7XG59XG5cbi8qKlxuICogQnVpbGQgYSByZWxhdGl2ZSBwYXRoIGZyb20gb25lIGZpbGUgcGF0aCB0byBhbm90aGVyIGZpbGUgcGF0aC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUmVsYXRpdmVQYXRoKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHN0cmluZyB7XG4gIGZyb20gPSBub3JtYWxpemUoZnJvbSk7XG4gIHRvID0gbm9ybWFsaXplKHRvKTtcblxuICAvLyBDb252ZXJ0IHRvIGFycmF5cy5cbiAgY29uc3QgZnJvbVBhcnRzID0gZnJvbS5zcGxpdCgnLycpO1xuICBjb25zdCB0b1BhcnRzID0gdG8uc3BsaXQoJy8nKTtcblxuICAvLyBSZW1vdmUgZmlsZSBuYW1lcyAocHJlc2VydmluZyBkZXN0aW5hdGlvbilcbiAgZnJvbVBhcnRzLnBvcCgpO1xuICBjb25zdCB0b0ZpbGVOYW1lID0gdG9QYXJ0cy5wb3AoKTtcblxuICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShub3JtYWxpemUoZnJvbVBhcnRzLmpvaW4oJy8nKSksIG5vcm1hbGl6ZSh0b1BhcnRzLmpvaW4oJy8nKSkpO1xuICBsZXQgcGF0aFByZWZpeCA9ICcnO1xuXG4gIC8vIFNldCB0aGUgcGF0aCBwcmVmaXggZm9yIHNhbWUgZGlyIG9yIGNoaWxkIGRpciwgcGFyZW50IGRpciBzdGFydHMgd2l0aCBgLi5gXG4gIGlmICghcmVsYXRpdmVQYXRoKSB7XG4gICAgcGF0aFByZWZpeCA9ICcuJztcbiAgfSBlbHNlIGlmICghcmVsYXRpdmVQYXRoLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgIHBhdGhQcmVmaXggPSBgLi9gO1xuICB9XG4gIGlmIChwYXRoUHJlZml4ICYmICFwYXRoUHJlZml4LmVuZHNXaXRoKCcvJykpIHtcbiAgICBwYXRoUHJlZml4ICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiBwYXRoUHJlZml4ICsgKHJlbGF0aXZlUGF0aCA/IHJlbGF0aXZlUGF0aCArICcvJyA6ICcnKSArIHRvRmlsZU5hbWU7XG59XG4iXX0=