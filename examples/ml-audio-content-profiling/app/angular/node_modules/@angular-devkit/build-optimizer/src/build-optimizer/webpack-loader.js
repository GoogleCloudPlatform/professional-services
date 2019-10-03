"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const source_map_1 = require("source-map");
const loaderUtils = require('loader-utils');
const build_optimizer_1 = require("./build-optimizer");
function buildOptimizerLoader(content, previousSourceMap) {
    this.cacheable();
    const options = loaderUtils.getOptions(this) || {};
    // Make up names of the intermediate files so we can chain the sourcemaps.
    const inputFilePath = this.resourcePath + '.pre-build-optimizer.js';
    const outputFilePath = this.resourcePath + '.post-build-optimizer.js';
    const boOutput = build_optimizer_1.buildOptimizer({
        content,
        originalFilePath: this.resourcePath,
        inputFilePath,
        outputFilePath,
        emitSourceMap: options.sourceMap,
        isSideEffectFree: this._module
            && this._module.factoryMeta
            && this._module.factoryMeta.sideEffectFree,
    });
    if (boOutput.emitSkipped || boOutput.content === null) {
        // Webpack typings for previousSourceMap are wrong, they are JSON objects and not strings.
        // tslint:disable-next-line:no-any
        this.callback(null, content, previousSourceMap);
        return;
    }
    const intermediateSourceMap = boOutput.sourceMap;
    let newContent = boOutput.content;
    let newSourceMap;
    if (options.sourceMap && intermediateSourceMap) {
        // Webpack doesn't need sourceMappingURL since we pass them on explicitely.
        newContent = newContent.replace(/^\/\/# sourceMappingURL=[^\r\n]*/gm, '');
        if (previousSourceMap) {
            // If there's a previous sourcemap, we have to chain them.
            // See https://github.com/mozilla/source-map/issues/216#issuecomment-150839869 for a simple
            // source map chaining example.
            // Use http://sokra.github.io/source-map-visualization/ to validate sourcemaps make sense.
            // Force the previous sourcemap to use the filename we made up for it.
            // In order for source maps to be chained, the consumed source map `file` needs to be in the
            // consumers source map `sources` array.
            previousSourceMap.file = inputFilePath;
            // Chain the sourcemaps.
            const consumer = new source_map_1.SourceMapConsumer(intermediateSourceMap);
            const generator = source_map_1.SourceMapGenerator.fromSourceMap(consumer);
            generator.applySourceMap(new source_map_1.SourceMapConsumer(previousSourceMap));
            newSourceMap = generator.toJSON();
        }
        else {
            // Otherwise just return our generated sourcemap.
            newSourceMap = intermediateSourceMap;
        }
    }
    // Webpack typings for previousSourceMap are wrong, they are JSON objects and not strings.
    // tslint:disable-next-line:no-any
    this.callback(null, newContent, newSourceMap);
}
exports.default = buildOptimizerLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VicGFjay1sb2FkZXIuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX29wdGltaXplci9zcmMvYnVpbGQtb3B0aW1pemVyL3dlYnBhY2stbG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsMkNBQWlGO0FBR2pGLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUU1Qyx1REFBbUQ7QUFPbkQsU0FBd0Isb0JBQW9CLENBQ0wsT0FBZSxFQUFFLGlCQUErQjtJQUNyRixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDakIsTUFBTSxPQUFPLEdBQWdDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRWhGLDBFQUEwRTtJQUMxRSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsWUFBWSxHQUFHLHlCQUF5QixDQUFDO0lBQ3BFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsMEJBQTBCLENBQUM7SUFFdEUsTUFBTSxRQUFRLEdBQUcsZ0NBQWMsQ0FBQztRQUM5QixPQUFPO1FBQ1AsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVk7UUFDbkMsYUFBYTtRQUNiLGNBQWM7UUFDZCxhQUFhLEVBQUUsT0FBTyxDQUFDLFNBQVM7UUFDaEMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE9BQU87ZUFDVCxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVc7ZUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsY0FBYztLQUM3RCxDQUFDLENBQUM7SUFFSCxJQUFJLFFBQVEsQ0FBQyxXQUFXLElBQUksUUFBUSxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDckQsMEZBQTBGO1FBQzFGLGtDQUFrQztRQUNsQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsaUJBQXdCLENBQUMsQ0FBQztRQUV2RCxPQUFPO0tBQ1I7SUFFRCxNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUM7SUFDakQsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztJQUVsQyxJQUFJLFlBQVksQ0FBQztJQUVqQixJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUkscUJBQXFCLEVBQUU7UUFDOUMsMkVBQTJFO1FBQzNFLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLG9DQUFvQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRTFFLElBQUksaUJBQWlCLEVBQUU7WUFDckIsMERBQTBEO1lBQzFELDJGQUEyRjtZQUMzRiwrQkFBK0I7WUFDL0IsMEZBQTBGO1lBRTFGLHNFQUFzRTtZQUN0RSw0RkFBNEY7WUFDNUYsd0NBQXdDO1lBQ3hDLGlCQUFpQixDQUFDLElBQUksR0FBRyxhQUFhLENBQUM7WUFFdkMsd0JBQXdCO1lBQ3hCLE1BQU0sUUFBUSxHQUFHLElBQUksOEJBQWlCLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUM5RCxNQUFNLFNBQVMsR0FBRywrQkFBa0IsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDN0QsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLDhCQUFpQixDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUNuRSxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ25DO2FBQU07WUFDTCxpREFBaUQ7WUFDakQsWUFBWSxHQUFHLHFCQUFxQixDQUFDO1NBQ3RDO0tBQ0Y7SUFFRCwwRkFBMEY7SUFDMUYsa0NBQWtDO0lBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxZQUFtQixDQUFDLENBQUM7QUFDdkQsQ0FBQztBQTlERCx1Q0E4REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBSYXdTb3VyY2VNYXAsIFNvdXJjZU1hcENvbnN1bWVyLCBTb3VyY2VNYXBHZW5lcmF0b3IgfSBmcm9tICdzb3VyY2UtbWFwJztcbmltcG9ydCAqIGFzIHdlYnBhY2sgZnJvbSAnd2VicGFjayc7ICAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLWltcGxpY2l0LWRlcGVuZGVuY2llc1xuXG5jb25zdCBsb2FkZXJVdGlscyA9IHJlcXVpcmUoJ2xvYWRlci11dGlscycpO1xuXG5pbXBvcnQgeyBidWlsZE9wdGltaXplciB9IGZyb20gJy4vYnVpbGQtb3B0aW1pemVyJztcblxuXG5pbnRlcmZhY2UgQnVpbGRPcHRpbWl6ZXJMb2FkZXJPcHRpb25zIHtcbiAgc291cmNlTWFwOiBib29sZWFuO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBidWlsZE9wdGltaXplckxvYWRlclxuICAodGhpczogd2VicGFjay5sb2FkZXIuTG9hZGVyQ29udGV4dCwgY29udGVudDogc3RyaW5nLCBwcmV2aW91c1NvdXJjZU1hcDogUmF3U291cmNlTWFwKSB7XG4gIHRoaXMuY2FjaGVhYmxlKCk7XG4gIGNvbnN0IG9wdGlvbnM6IEJ1aWxkT3B0aW1pemVyTG9hZGVyT3B0aW9ucyA9IGxvYWRlclV0aWxzLmdldE9wdGlvbnModGhpcykgfHwge307XG5cbiAgLy8gTWFrZSB1cCBuYW1lcyBvZiB0aGUgaW50ZXJtZWRpYXRlIGZpbGVzIHNvIHdlIGNhbiBjaGFpbiB0aGUgc291cmNlbWFwcy5cbiAgY29uc3QgaW5wdXRGaWxlUGF0aCA9IHRoaXMucmVzb3VyY2VQYXRoICsgJy5wcmUtYnVpbGQtb3B0aW1pemVyLmpzJztcbiAgY29uc3Qgb3V0cHV0RmlsZVBhdGggPSB0aGlzLnJlc291cmNlUGF0aCArICcucG9zdC1idWlsZC1vcHRpbWl6ZXIuanMnO1xuXG4gIGNvbnN0IGJvT3V0cHV0ID0gYnVpbGRPcHRpbWl6ZXIoe1xuICAgIGNvbnRlbnQsXG4gICAgb3JpZ2luYWxGaWxlUGF0aDogdGhpcy5yZXNvdXJjZVBhdGgsXG4gICAgaW5wdXRGaWxlUGF0aCxcbiAgICBvdXRwdXRGaWxlUGF0aCxcbiAgICBlbWl0U291cmNlTWFwOiBvcHRpb25zLnNvdXJjZU1hcCxcbiAgICBpc1NpZGVFZmZlY3RGcmVlOiB0aGlzLl9tb2R1bGVcbiAgICAgICAgICAgICAgICAgICAgICAmJiB0aGlzLl9tb2R1bGUuZmFjdG9yeU1ldGFcbiAgICAgICAgICAgICAgICAgICAgICAmJiB0aGlzLl9tb2R1bGUuZmFjdG9yeU1ldGEuc2lkZUVmZmVjdEZyZWUsXG4gIH0pO1xuXG4gIGlmIChib091dHB1dC5lbWl0U2tpcHBlZCB8fCBib091dHB1dC5jb250ZW50ID09PSBudWxsKSB7XG4gICAgLy8gV2VicGFjayB0eXBpbmdzIGZvciBwcmV2aW91c1NvdXJjZU1hcCBhcmUgd3JvbmcsIHRoZXkgYXJlIEpTT04gb2JqZWN0cyBhbmQgbm90IHN0cmluZ3MuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIHRoaXMuY2FsbGJhY2sobnVsbCwgY29udGVudCwgcHJldmlvdXNTb3VyY2VNYXAgYXMgYW55KTtcblxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGludGVybWVkaWF0ZVNvdXJjZU1hcCA9IGJvT3V0cHV0LnNvdXJjZU1hcDtcbiAgbGV0IG5ld0NvbnRlbnQgPSBib091dHB1dC5jb250ZW50O1xuXG4gIGxldCBuZXdTb3VyY2VNYXA7XG5cbiAgaWYgKG9wdGlvbnMuc291cmNlTWFwICYmIGludGVybWVkaWF0ZVNvdXJjZU1hcCkge1xuICAgIC8vIFdlYnBhY2sgZG9lc24ndCBuZWVkIHNvdXJjZU1hcHBpbmdVUkwgc2luY2Ugd2UgcGFzcyB0aGVtIG9uIGV4cGxpY2l0ZWx5LlxuICAgIG5ld0NvbnRlbnQgPSBuZXdDb250ZW50LnJlcGxhY2UoL15cXC9cXC8jIHNvdXJjZU1hcHBpbmdVUkw9W15cXHJcXG5dKi9nbSwgJycpO1xuXG4gICAgaWYgKHByZXZpb3VzU291cmNlTWFwKSB7XG4gICAgICAvLyBJZiB0aGVyZSdzIGEgcHJldmlvdXMgc291cmNlbWFwLCB3ZSBoYXZlIHRvIGNoYWluIHRoZW0uXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvc291cmNlLW1hcC9pc3N1ZXMvMjE2I2lzc3VlY29tbWVudC0xNTA4Mzk4NjkgZm9yIGEgc2ltcGxlXG4gICAgICAvLyBzb3VyY2UgbWFwIGNoYWluaW5nIGV4YW1wbGUuXG4gICAgICAvLyBVc2UgaHR0cDovL3Nva3JhLmdpdGh1Yi5pby9zb3VyY2UtbWFwLXZpc3VhbGl6YXRpb24vIHRvIHZhbGlkYXRlIHNvdXJjZW1hcHMgbWFrZSBzZW5zZS5cblxuICAgICAgLy8gRm9yY2UgdGhlIHByZXZpb3VzIHNvdXJjZW1hcCB0byB1c2UgdGhlIGZpbGVuYW1lIHdlIG1hZGUgdXAgZm9yIGl0LlxuICAgICAgLy8gSW4gb3JkZXIgZm9yIHNvdXJjZSBtYXBzIHRvIGJlIGNoYWluZWQsIHRoZSBjb25zdW1lZCBzb3VyY2UgbWFwIGBmaWxlYCBuZWVkcyB0byBiZSBpbiB0aGVcbiAgICAgIC8vIGNvbnN1bWVycyBzb3VyY2UgbWFwIGBzb3VyY2VzYCBhcnJheS5cbiAgICAgIHByZXZpb3VzU291cmNlTWFwLmZpbGUgPSBpbnB1dEZpbGVQYXRoO1xuXG4gICAgICAvLyBDaGFpbiB0aGUgc291cmNlbWFwcy5cbiAgICAgIGNvbnN0IGNvbnN1bWVyID0gbmV3IFNvdXJjZU1hcENvbnN1bWVyKGludGVybWVkaWF0ZVNvdXJjZU1hcCk7XG4gICAgICBjb25zdCBnZW5lcmF0b3IgPSBTb3VyY2VNYXBHZW5lcmF0b3IuZnJvbVNvdXJjZU1hcChjb25zdW1lcik7XG4gICAgICBnZW5lcmF0b3IuYXBwbHlTb3VyY2VNYXAobmV3IFNvdXJjZU1hcENvbnN1bWVyKHByZXZpb3VzU291cmNlTWFwKSk7XG4gICAgICBuZXdTb3VyY2VNYXAgPSBnZW5lcmF0b3IudG9KU09OKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSBqdXN0IHJldHVybiBvdXIgZ2VuZXJhdGVkIHNvdXJjZW1hcC5cbiAgICAgIG5ld1NvdXJjZU1hcCA9IGludGVybWVkaWF0ZVNvdXJjZU1hcDtcbiAgICB9XG4gIH1cblxuICAvLyBXZWJwYWNrIHR5cGluZ3MgZm9yIHByZXZpb3VzU291cmNlTWFwIGFyZSB3cm9uZywgdGhleSBhcmUgSlNPTiBvYmplY3RzIGFuZCBub3Qgc3RyaW5ncy5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICB0aGlzLmNhbGxiYWNrKG51bGwsIG5ld0NvbnRlbnQsIG5ld1NvdXJjZU1hcCBhcyBhbnkpO1xufVxuIl19