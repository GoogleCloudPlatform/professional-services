"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable
// TODO: cleanup this file, it's copied as is from Angular CLI.
Object.defineProperty(exports, "__esModule", { value: true });
// Remove .js files from entry points consisting entirely of .css|scss|sass|less|styl.
// To be used together with ExtractTextPlugin.
class SuppressExtractedTextChunksWebpackPlugin {
    constructor() { }
    apply(compiler) {
        compiler.hooks.compilation.tap('SuppressExtractedTextChunks', (compilation) => {
            // find which chunks have css only entry points
            const cssOnlyChunks = [];
            const entryPoints = compilation.options.entry;
            // determine which entry points are composed entirely of css files
            for (let entryPoint of Object.keys(entryPoints)) {
                let entryFiles = entryPoints[entryPoint];
                // when type of entryFiles is not array, make it as an array
                entryFiles = entryFiles instanceof Array ? entryFiles : [entryFiles];
                if (entryFiles.every((el) => el.match(/\.(css|scss|sass|less|styl)$/) !== null)) {
                    cssOnlyChunks.push(entryPoint);
                }
            }
            // Remove the js file for supressed chunks
            compilation.hooks.afterSeal.tap('SuppressExtractedTextChunks', () => {
                compilation.chunks
                    .filter((chunk) => cssOnlyChunks.indexOf(chunk.name) !== -1)
                    .forEach((chunk) => {
                    let newFiles = [];
                    chunk.files.forEach((file) => {
                        if (file.match(/\.js(\.map)?$/)) {
                            // remove js files
                            delete compilation.assets[file];
                        }
                        else {
                            newFiles.push(file);
                        }
                    });
                    chunk.files = newFiles;
                });
            });
            // Remove scripts tags with a css file as source, because HtmlWebpackPlugin will use
            // a css file as a script for chunks without js files.
            // TODO: Enable this once HtmlWebpackPlugin supports Webpack 4
            // compilation.plugin('html-webpack-plugin-alter-asset-tags',
            //   (htmlPluginData: any, callback: any) => {
            //     const filterFn = (tag: any) =>
            //       !(tag.tagName === 'script' && tag.attributes.src.match(/\.css$/));
            //     htmlPluginData.head = htmlPluginData.head.filter(filterFn);
            //     htmlPluginData.body = htmlPluginData.body.filter(filterFn);
            //     callback(null, htmlPluginData);
            //   });
        });
    }
}
exports.SuppressExtractedTextChunksWebpackPlugin = SuppressExtractedTextChunksWebpackPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwcHJlc3MtZW50cnktY2h1bmtzLXdlYnBhY2stcGx1Z2luLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9hbmd1bGFyLWNsaS1maWxlcy9wbHVnaW5zL3N1cHByZXNzLWVudHJ5LWNodW5rcy13ZWJwYWNrLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HO0FBQ0gsaUJBQWlCO0FBQ2pCLCtEQUErRDs7QUFFL0Qsc0ZBQXNGO0FBQ3RGLDhDQUE4QztBQUU5QyxNQUFhLHdDQUF3QztJQUNuRCxnQkFBZ0IsQ0FBQztJQUVqQixLQUFLLENBQUMsUUFBYTtRQUNqQixRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsNkJBQTZCLEVBQUUsQ0FBQyxXQUFnQixFQUFFLEVBQUU7WUFDakYsK0NBQStDO1lBQy9DLE1BQU0sYUFBYSxHQUFhLEVBQUUsQ0FBQztZQUNuQyxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUM5QyxrRUFBa0U7WUFDbEUsS0FBSyxJQUFJLFVBQVUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUMvQyxJQUFJLFVBQVUsR0FBc0IsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM1RCw0REFBNEQ7Z0JBQzVELFVBQVUsR0FBRyxVQUFVLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3JFLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQVUsRUFBRSxFQUFFLENBQ2xDLEVBQUUsQ0FBQyxLQUFLLENBQUMsOEJBQThCLENBQUMsS0FBSyxJQUFJLENBQUMsRUFBRTtvQkFDcEQsYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDaEM7YUFDRjtZQUNELDBDQUEwQztZQUMxQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO2dCQUNsRSxXQUFXLENBQUMsTUFBTTtxQkFDZixNQUFNLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3FCQUNoRSxPQUFPLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRTtvQkFDdEIsSUFBSSxRQUFRLEdBQWEsRUFBRSxDQUFDO29CQUM1QixLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFO3dCQUNuQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEVBQUU7NEJBQy9CLGtCQUFrQjs0QkFDbEIsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUNqQzs2QkFBTTs0QkFDTCxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUNyQjtvQkFDSCxDQUFDLENBQUMsQ0FBQztvQkFDSCxLQUFLLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztZQUNILG9GQUFvRjtZQUNwRixzREFBc0Q7WUFDdEQsOERBQThEO1lBQzlELDZEQUE2RDtZQUM3RCw4Q0FBOEM7WUFDOUMscUNBQXFDO1lBQ3JDLDJFQUEyRTtZQUMzRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLHNDQUFzQztZQUN0QyxRQUFRO1FBQ1YsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFoREQsNEZBZ0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuLy8gdHNsaW50OmRpc2FibGVcbi8vIFRPRE86IGNsZWFudXAgdGhpcyBmaWxlLCBpdCdzIGNvcGllZCBhcyBpcyBmcm9tIEFuZ3VsYXIgQ0xJLlxuXG4vLyBSZW1vdmUgLmpzIGZpbGVzIGZyb20gZW50cnkgcG9pbnRzIGNvbnNpc3RpbmcgZW50aXJlbHkgb2YgLmNzc3xzY3NzfHNhc3N8bGVzc3xzdHlsLlxuLy8gVG8gYmUgdXNlZCB0b2dldGhlciB3aXRoIEV4dHJhY3RUZXh0UGx1Z2luLlxuXG5leHBvcnQgY2xhc3MgU3VwcHJlc3NFeHRyYWN0ZWRUZXh0Q2h1bmtzV2VicGFja1BsdWdpbiB7XG4gIGNvbnN0cnVjdG9yKCkgeyB9XG5cbiAgYXBwbHkoY29tcGlsZXI6IGFueSk6IHZvaWQge1xuICAgIGNvbXBpbGVyLmhvb2tzLmNvbXBpbGF0aW9uLnRhcCgnU3VwcHJlc3NFeHRyYWN0ZWRUZXh0Q2h1bmtzJywgKGNvbXBpbGF0aW9uOiBhbnkpID0+IHtcbiAgICAgIC8vIGZpbmQgd2hpY2ggY2h1bmtzIGhhdmUgY3NzIG9ubHkgZW50cnkgcG9pbnRzXG4gICAgICBjb25zdCBjc3NPbmx5Q2h1bmtzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgZW50cnlQb2ludHMgPSBjb21waWxhdGlvbi5vcHRpb25zLmVudHJ5O1xuICAgICAgLy8gZGV0ZXJtaW5lIHdoaWNoIGVudHJ5IHBvaW50cyBhcmUgY29tcG9zZWQgZW50aXJlbHkgb2YgY3NzIGZpbGVzXG4gICAgICBmb3IgKGxldCBlbnRyeVBvaW50IG9mIE9iamVjdC5rZXlzKGVudHJ5UG9pbnRzKSkge1xuICAgICAgICBsZXQgZW50cnlGaWxlczogc3RyaW5nW10gfCBzdHJpbmcgPSBlbnRyeVBvaW50c1tlbnRyeVBvaW50XTtcbiAgICAgICAgLy8gd2hlbiB0eXBlIG9mIGVudHJ5RmlsZXMgaXMgbm90IGFycmF5LCBtYWtlIGl0IGFzIGFuIGFycmF5XG4gICAgICAgIGVudHJ5RmlsZXMgPSBlbnRyeUZpbGVzIGluc3RhbmNlb2YgQXJyYXkgPyBlbnRyeUZpbGVzIDogW2VudHJ5RmlsZXNdO1xuICAgICAgICBpZiAoZW50cnlGaWxlcy5ldmVyeSgoZWw6IHN0cmluZykgPT5cbiAgICAgICAgICBlbC5tYXRjaCgvXFwuKGNzc3xzY3NzfHNhc3N8bGVzc3xzdHlsKSQvKSAhPT0gbnVsbCkpIHtcbiAgICAgICAgICBjc3NPbmx5Q2h1bmtzLnB1c2goZW50cnlQb2ludCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFJlbW92ZSB0aGUganMgZmlsZSBmb3Igc3VwcmVzc2VkIGNodW5rc1xuICAgICAgY29tcGlsYXRpb24uaG9va3MuYWZ0ZXJTZWFsLnRhcCgnU3VwcHJlc3NFeHRyYWN0ZWRUZXh0Q2h1bmtzJywgKCkgPT4ge1xuICAgICAgICBjb21waWxhdGlvbi5jaHVua3NcbiAgICAgICAgICAuZmlsdGVyKChjaHVuazogYW55KSA9PiBjc3NPbmx5Q2h1bmtzLmluZGV4T2YoY2h1bmsubmFtZSkgIT09IC0xKVxuICAgICAgICAgIC5mb3JFYWNoKChjaHVuazogYW55KSA9PiB7XG4gICAgICAgICAgICBsZXQgbmV3RmlsZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBjaHVuay5maWxlcy5mb3JFYWNoKChmaWxlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGZpbGUubWF0Y2goL1xcLmpzKFxcLm1hcCk/JC8pKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGpzIGZpbGVzXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbXBpbGF0aW9uLmFzc2V0c1tmaWxlXTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXdGaWxlcy5wdXNoKGZpbGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNodW5rLmZpbGVzID0gbmV3RmlsZXM7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIC8vIFJlbW92ZSBzY3JpcHRzIHRhZ3Mgd2l0aCBhIGNzcyBmaWxlIGFzIHNvdXJjZSwgYmVjYXVzZSBIdG1sV2VicGFja1BsdWdpbiB3aWxsIHVzZVxuICAgICAgLy8gYSBjc3MgZmlsZSBhcyBhIHNjcmlwdCBmb3IgY2h1bmtzIHdpdGhvdXQganMgZmlsZXMuXG4gICAgICAvLyBUT0RPOiBFbmFibGUgdGhpcyBvbmNlIEh0bWxXZWJwYWNrUGx1Z2luIHN1cHBvcnRzIFdlYnBhY2sgNFxuICAgICAgLy8gY29tcGlsYXRpb24ucGx1Z2luKCdodG1sLXdlYnBhY2stcGx1Z2luLWFsdGVyLWFzc2V0LXRhZ3MnLFxuICAgICAgLy8gICAoaHRtbFBsdWdpbkRhdGE6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xuICAgICAgLy8gICAgIGNvbnN0IGZpbHRlckZuID0gKHRhZzogYW55KSA9PlxuICAgICAgLy8gICAgICAgISh0YWcudGFnTmFtZSA9PT0gJ3NjcmlwdCcgJiYgdGFnLmF0dHJpYnV0ZXMuc3JjLm1hdGNoKC9cXC5jc3MkLykpO1xuICAgICAgLy8gICAgIGh0bWxQbHVnaW5EYXRhLmhlYWQgPSBodG1sUGx1Z2luRGF0YS5oZWFkLmZpbHRlcihmaWx0ZXJGbik7XG4gICAgICAvLyAgICAgaHRtbFBsdWdpbkRhdGEuYm9keSA9IGh0bWxQbHVnaW5EYXRhLmJvZHkuZmlsdGVyKGZpbHRlckZuKTtcbiAgICAgIC8vICAgICBjYWxsYmFjayhudWxsLCBodG1sUGx1Z2luRGF0YSk7XG4gICAgICAvLyAgIH0pO1xuICAgIH0pO1xuICB9XG59XG4iXX0=