"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// TODO: fix typings.
// tslint:disable-next-line:no-global-tslint-disable
// tslint:disable:no-any
const path = require("path");
const angular_compiler_plugin_1 = require("./angular_compiler_plugin");
const benchmark_1 = require("./benchmark");
const sourceMappingUrlRe = /^\/\/# sourceMappingURL=[^\r\n]*/gm;
function ngcLoader() {
    const cb = this.async();
    const sourceFileName = this.resourcePath;
    const timeLabel = `ngcLoader+${sourceFileName}+`;
    if (!cb) {
        throw new Error('This loader needs to support asynchronous webpack compilations.');
    }
    benchmark_1.time(timeLabel);
    const plugin = this._compilation._ngToolsWebpackPluginInstance;
    if (!plugin) {
        throw new Error('The AngularCompilerPlugin was not found. '
            + 'The @ngtools/webpack loader requires the plugin.');
    }
    // We must verify that the plugin is an instance of the right class.
    // Throw an error if it isn't, that often means multiple @ngtools/webpack installs.
    if (!(plugin instanceof angular_compiler_plugin_1.AngularCompilerPlugin) || !plugin.done) {
        throw new Error('Angular Compiler was detected but it was an instance of the wrong class.\n'
            + 'This likely means you have several @ngtools/webpack packages installed. '
            + 'You can check this with `npm ls @ngtools/webpack`, and then remove the extra copies.');
    }
    benchmark_1.time(timeLabel + '.ngcLoader.AngularCompilerPlugin');
    plugin.done
        .then(() => {
        benchmark_1.timeEnd(timeLabel + '.ngcLoader.AngularCompilerPlugin');
        const result = plugin.getCompiledFile(sourceFileName);
        if (result.sourceMap) {
            // Process sourcemaps for Webpack.
            // Remove the sourceMappingURL.
            result.outputText = result.outputText.replace(sourceMappingUrlRe, '');
            // Set the map source to use the full path of the file.
            const sourceMap = JSON.parse(result.sourceMap);
            sourceMap.sources = sourceMap.sources.map((fileName) => {
                return path.join(path.dirname(sourceFileName), fileName);
            });
            result.sourceMap = sourceMap;
        }
        // Manually add the dependencies for TS files.
        // Type only imports will be stripped out by compilation so we need to add them as
        // as dependencies.
        // Component resources files (html and css templates) also need to be added manually for
        // AOT, so that this file is reloaded when they change.
        if (sourceFileName.endsWith('.ts')) {
            result.errorDependencies.forEach(dep => this.addDependency(dep));
            const dependencies = plugin.getDependencies(sourceFileName);
            dependencies.forEach(dep => {
                plugin.updateChangedFileExtensions(path.extname(dep));
                this.addDependency(dep);
            });
        }
        // NgFactory files depend on the component template, but we can't know what that file
        // is (if any). So we add all the dependencies that the original component file has
        // to the factory as well, which includes html and css templates, and the component
        // itself (for inline html/templates templates).
        const ngFactoryRe = /\.ngfactory.js$/;
        if (ngFactoryRe.test(sourceFileName)) {
            const originalFile = sourceFileName.replace(ngFactoryRe, '.ts');
            this.addDependency(originalFile);
            const origDependencies = plugin.getDependencies(originalFile);
            origDependencies.forEach(dep => this.addDependency(dep));
        }
        // NgStyle files depend on the style file they represent.
        // E.g. `some-style.less.shim.ngstyle.js` depends on `some-style.less`.
        // Those files can in turn depend on others, so we have to add them all.
        const ngStyleRe = /(?:\.shim)?\.ngstyle\.js$/;
        if (ngStyleRe.test(sourceFileName)) {
            const styleFile = sourceFileName.replace(ngStyleRe, '');
            const styleDependencies = plugin.getResourceDependencies(styleFile);
            styleDependencies.forEach(dep => this.addDependency(dep));
        }
        benchmark_1.timeEnd(timeLabel);
        cb(null, result.outputText, result.sourceMap);
    })
        .catch(err => {
        benchmark_1.timeEnd(timeLabel);
        cb(err);
    });
}
exports.ngcLoader = ngcLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILHFCQUFxQjtBQUNyQixvREFBb0Q7QUFDcEQsd0JBQXdCO0FBQ3hCLDZCQUE2QjtBQUU3Qix1RUFBa0U7QUFDbEUsMkNBQTRDO0FBRzVDLE1BQU0sa0JBQWtCLEdBQUcsb0NBQW9DLENBQUM7QUFFaEUsU0FBZ0IsU0FBUztJQUN2QixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDeEIsTUFBTSxjQUFjLEdBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQztJQUNqRCxNQUFNLFNBQVMsR0FBRyxhQUFhLGNBQWMsR0FBRyxDQUFDO0lBRWpELElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLGlFQUFpRSxDQUFDLENBQUM7S0FDcEY7SUFFRCxnQkFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRWhCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsNkJBQTZCLENBQUM7SUFDL0QsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDO2NBQzNDLGtEQUFrRCxDQUFDLENBQUM7S0FDckU7SUFFRCxvRUFBb0U7SUFDcEUsbUZBQW1GO0lBQ25GLElBQUksQ0FBQyxDQUFDLE1BQU0sWUFBWSwrQ0FBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtRQUM5RCxNQUFNLElBQUksS0FBSyxDQUFDLDRFQUE0RTtjQUN4RiwwRUFBMEU7Y0FDMUUsc0ZBQXNGLENBQ3pGLENBQUM7S0FDSDtJQUVELGdCQUFJLENBQUMsU0FBUyxHQUFHLGtDQUFrQyxDQUFDLENBQUM7SUFDckQsTUFBTSxDQUFDLElBQUk7U0FDUixJQUFJLENBQUMsR0FB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LFNBQWdCLENBQUMsQ0FBQztJQUN2RCxDQUFDLENBQUM7U0FDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDWCxtQkFBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25CLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXZGRCw4QkF1RkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG4vLyBUT0RPOiBmaXggdHlwaW5ncy5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1nbG9iYWwtdHNsaW50LWRpc2FibGVcbi8vIHRzbGludDpkaXNhYmxlOm5vLWFueVxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGxvYWRlciB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgQW5ndWxhckNvbXBpbGVyUGx1Z2luIH0gZnJvbSAnLi9hbmd1bGFyX2NvbXBpbGVyX3BsdWdpbic7XG5pbXBvcnQgeyB0aW1lLCB0aW1lRW5kIH0gZnJvbSAnLi9iZW5jaG1hcmsnO1xuXG5cbmNvbnN0IHNvdXJjZU1hcHBpbmdVcmxSZSA9IC9eXFwvXFwvIyBzb3VyY2VNYXBwaW5nVVJMPVteXFxyXFxuXSovZ207XG5cbmV4cG9ydCBmdW5jdGlvbiBuZ2NMb2FkZXIodGhpczogbG9hZGVyLkxvYWRlckNvbnRleHQpIHtcbiAgY29uc3QgY2IgPSB0aGlzLmFzeW5jKCk7XG4gIGNvbnN0IHNvdXJjZUZpbGVOYW1lOiBzdHJpbmcgPSB0aGlzLnJlc291cmNlUGF0aDtcbiAgY29uc3QgdGltZUxhYmVsID0gYG5nY0xvYWRlciske3NvdXJjZUZpbGVOYW1lfStgO1xuXG4gIGlmICghY2IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgbG9hZGVyIG5lZWRzIHRvIHN1cHBvcnQgYXN5bmNocm9ub3VzIHdlYnBhY2sgY29tcGlsYXRpb25zLicpO1xuICB9XG5cbiAgdGltZSh0aW1lTGFiZWwpO1xuXG4gIGNvbnN0IHBsdWdpbiA9IHRoaXMuX2NvbXBpbGF0aW9uLl9uZ1Rvb2xzV2VicGFja1BsdWdpbkluc3RhbmNlO1xuICBpZiAoIXBsdWdpbikge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIEFuZ3VsYXJDb21waWxlclBsdWdpbiB3YXMgbm90IGZvdW5kLiAnXG4gICAgICAgICAgICAgICAgICArICdUaGUgQG5ndG9vbHMvd2VicGFjayBsb2FkZXIgcmVxdWlyZXMgdGhlIHBsdWdpbi4nKTtcbiAgfVxuXG4gIC8vIFdlIG11c3QgdmVyaWZ5IHRoYXQgdGhlIHBsdWdpbiBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgcmlnaHQgY2xhc3MuXG4gIC8vIFRocm93IGFuIGVycm9yIGlmIGl0IGlzbid0LCB0aGF0IG9mdGVuIG1lYW5zIG11bHRpcGxlIEBuZ3Rvb2xzL3dlYnBhY2sgaW5zdGFsbHMuXG4gIGlmICghKHBsdWdpbiBpbnN0YW5jZW9mIEFuZ3VsYXJDb21waWxlclBsdWdpbikgfHwgIXBsdWdpbi5kb25lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbmd1bGFyIENvbXBpbGVyIHdhcyBkZXRlY3RlZCBidXQgaXQgd2FzIGFuIGluc3RhbmNlIG9mIHRoZSB3cm9uZyBjbGFzcy5cXG4nXG4gICAgICArICdUaGlzIGxpa2VseSBtZWFucyB5b3UgaGF2ZSBzZXZlcmFsIEBuZ3Rvb2xzL3dlYnBhY2sgcGFja2FnZXMgaW5zdGFsbGVkLiAnXG4gICAgICArICdZb3UgY2FuIGNoZWNrIHRoaXMgd2l0aCBgbnBtIGxzIEBuZ3Rvb2xzL3dlYnBhY2tgLCBhbmQgdGhlbiByZW1vdmUgdGhlIGV4dHJhIGNvcGllcy4nLFxuICAgICk7XG4gIH1cblxuICB0aW1lKHRpbWVMYWJlbCArICcubmdjTG9hZGVyLkFuZ3VsYXJDb21waWxlclBsdWdpbicpO1xuICBwbHVnaW4uZG9uZVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHRpbWVFbmQodGltZUxhYmVsICsgJy5uZ2NMb2FkZXIuQW5ndWxhckNvbXBpbGVyUGx1Z2luJyk7XG4gICAgICBjb25zdCByZXN1bHQgPSBwbHVnaW4uZ2V0Q29tcGlsZWRGaWxlKHNvdXJjZUZpbGVOYW1lKTtcblxuICAgICAgaWYgKHJlc3VsdC5zb3VyY2VNYXApIHtcbiAgICAgICAgLy8gUHJvY2VzcyBzb3VyY2VtYXBzIGZvciBXZWJwYWNrLlxuICAgICAgICAvLyBSZW1vdmUgdGhlIHNvdXJjZU1hcHBpbmdVUkwuXG4gICAgICAgIHJlc3VsdC5vdXRwdXRUZXh0ID0gcmVzdWx0Lm91dHB1dFRleHQucmVwbGFjZShzb3VyY2VNYXBwaW5nVXJsUmUsICcnKTtcbiAgICAgICAgLy8gU2V0IHRoZSBtYXAgc291cmNlIHRvIHVzZSB0aGUgZnVsbCBwYXRoIG9mIHRoZSBmaWxlLlxuICAgICAgICBjb25zdCBzb3VyY2VNYXAgPSBKU09OLnBhcnNlKHJlc3VsdC5zb3VyY2VNYXApO1xuICAgICAgICBzb3VyY2VNYXAuc291cmNlcyA9IHNvdXJjZU1hcC5zb3VyY2VzLm1hcCgoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHJldHVybiBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHNvdXJjZUZpbGVOYW1lKSwgZmlsZU5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0LnNvdXJjZU1hcCA9IHNvdXJjZU1hcDtcbiAgICAgIH1cblxuICAgICAgLy8gTWFudWFsbHkgYWRkIHRoZSBkZXBlbmRlbmNpZXMgZm9yIFRTIGZpbGVzLlxuICAgICAgLy8gVHlwZSBvbmx5IGltcG9ydHMgd2lsbCBiZSBzdHJpcHBlZCBvdXQgYnkgY29tcGlsYXRpb24gc28gd2UgbmVlZCB0byBhZGQgdGhlbSBhc1xuICAgICAgLy8gYXMgZGVwZW5kZW5jaWVzLlxuICAgICAgLy8gQ29tcG9uZW50IHJlc291cmNlcyBmaWxlcyAoaHRtbCBhbmQgY3NzIHRlbXBsYXRlcykgYWxzbyBuZWVkIHRvIGJlIGFkZGVkIG1hbnVhbGx5IGZvclxuICAgICAgLy8gQU9ULCBzbyB0aGF0IHRoaXMgZmlsZSBpcyByZWxvYWRlZCB3aGVuIHRoZXkgY2hhbmdlLlxuICAgICAgaWYgKHNvdXJjZUZpbGVOYW1lLmVuZHNXaXRoKCcudHMnKSkge1xuICAgICAgICByZXN1bHQuZXJyb3JEZXBlbmRlbmNpZXMuZm9yRWFjaChkZXAgPT4gdGhpcy5hZGREZXBlbmRlbmN5KGRlcCkpO1xuICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBwbHVnaW4uZ2V0RGVwZW5kZW5jaWVzKHNvdXJjZUZpbGVOYW1lKTtcbiAgICAgICAgZGVwZW5kZW5jaWVzLmZvckVhY2goZGVwID0+IHtcbiAgICAgICAgICBwbHVnaW4udXBkYXRlQ2hhbmdlZEZpbGVFeHRlbnNpb25zKHBhdGguZXh0bmFtZShkZXApKTtcbiAgICAgICAgICB0aGlzLmFkZERlcGVuZGVuY3koZGVwKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5nRmFjdG9yeSBmaWxlcyBkZXBlbmQgb24gdGhlIGNvbXBvbmVudCB0ZW1wbGF0ZSwgYnV0IHdlIGNhbid0IGtub3cgd2hhdCB0aGF0IGZpbGVcbiAgICAgIC8vIGlzIChpZiBhbnkpLiBTbyB3ZSBhZGQgYWxsIHRoZSBkZXBlbmRlbmNpZXMgdGhhdCB0aGUgb3JpZ2luYWwgY29tcG9uZW50IGZpbGUgaGFzXG4gICAgICAvLyB0byB0aGUgZmFjdG9yeSBhcyB3ZWxsLCB3aGljaCBpbmNsdWRlcyBodG1sIGFuZCBjc3MgdGVtcGxhdGVzLCBhbmQgdGhlIGNvbXBvbmVudFxuICAgICAgLy8gaXRzZWxmIChmb3IgaW5saW5lIGh0bWwvdGVtcGxhdGVzIHRlbXBsYXRlcykuXG4gICAgICBjb25zdCBuZ0ZhY3RvcnlSZSA9IC9cXC5uZ2ZhY3RvcnkuanMkLztcbiAgICAgIGlmIChuZ0ZhY3RvcnlSZS50ZXN0KHNvdXJjZUZpbGVOYW1lKSkge1xuICAgICAgICBjb25zdCBvcmlnaW5hbEZpbGUgPSBzb3VyY2VGaWxlTmFtZS5yZXBsYWNlKG5nRmFjdG9yeVJlLCAnLnRzJyk7XG4gICAgICAgIHRoaXMuYWRkRGVwZW5kZW5jeShvcmlnaW5hbEZpbGUpO1xuICAgICAgICBjb25zdCBvcmlnRGVwZW5kZW5jaWVzID0gcGx1Z2luLmdldERlcGVuZGVuY2llcyhvcmlnaW5hbEZpbGUpO1xuICAgICAgICBvcmlnRGVwZW5kZW5jaWVzLmZvckVhY2goZGVwID0+IHRoaXMuYWRkRGVwZW5kZW5jeShkZXApKTtcbiAgICAgIH1cblxuICAgICAgLy8gTmdTdHlsZSBmaWxlcyBkZXBlbmQgb24gdGhlIHN0eWxlIGZpbGUgdGhleSByZXByZXNlbnQuXG4gICAgICAvLyBFLmcuIGBzb21lLXN0eWxlLmxlc3Muc2hpbS5uZ3N0eWxlLmpzYCBkZXBlbmRzIG9uIGBzb21lLXN0eWxlLmxlc3NgLlxuICAgICAgLy8gVGhvc2UgZmlsZXMgY2FuIGluIHR1cm4gZGVwZW5kIG9uIG90aGVycywgc28gd2UgaGF2ZSB0byBhZGQgdGhlbSBhbGwuXG4gICAgICBjb25zdCBuZ1N0eWxlUmUgPSAvKD86XFwuc2hpbSk/XFwubmdzdHlsZVxcLmpzJC87XG4gICAgICBpZiAobmdTdHlsZVJlLnRlc3Qoc291cmNlRmlsZU5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlRmlsZSA9IHNvdXJjZUZpbGVOYW1lLnJlcGxhY2UobmdTdHlsZVJlLCAnJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlRGVwZW5kZW5jaWVzID0gcGx1Z2luLmdldFJlc291cmNlRGVwZW5kZW5jaWVzKHN0eWxlRmlsZSk7XG4gICAgICAgIHN0eWxlRGVwZW5kZW5jaWVzLmZvckVhY2goZGVwID0+IHRoaXMuYWRkRGVwZW5kZW5jeShkZXApKTtcbiAgICAgIH1cblxuICAgICAgdGltZUVuZCh0aW1lTGFiZWwpO1xuICAgICAgY2IobnVsbCwgcmVzdWx0Lm91dHB1dFRleHQsIHJlc3VsdC5zb3VyY2VNYXAgYXMgYW55KTtcbiAgICB9KVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgdGltZUVuZCh0aW1lTGFiZWwpO1xuICAgICAgY2IoZXJyKTtcbiAgICB9KTtcbn1cbiJdfQ==