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
const vm = require("vm");
const webpack_sources_1 = require("webpack-sources");
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
const LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
class WebpackResourceLoader {
    constructor() {
        this._fileDependencies = new Map();
        this._cachedSources = new Map();
        this._cachedEvaluatedSources = new Map();
    }
    update(parentCompilation) {
        this._parentCompilation = parentCompilation;
        this._context = parentCompilation.context;
    }
    getResourceDependencies(filePath) {
        return this._fileDependencies.get(filePath) || [];
    }
    _compile(filePath) {
        if (!this._parentCompilation) {
            throw new Error('WebpackResourceLoader cannot be used without parentCompilation');
        }
        // Simple sanity check.
        if (filePath.match(/\.[jt]s$/)) {
            return Promise.reject('Cannot use a JavaScript or TypeScript file for styleUrl or templateUrl.');
        }
        const outputOptions = { filename: filePath };
        const relativePath = path.relative(this._context || '', filePath);
        const childCompiler = this._parentCompilation.createChildCompiler(relativePath, outputOptions);
        childCompiler.context = this._context;
        new NodeTemplatePlugin(outputOptions).apply(childCompiler);
        new NodeTargetPlugin().apply(childCompiler);
        new SingleEntryPlugin(this._context, filePath).apply(childCompiler);
        new LoaderTargetPlugin('node').apply(childCompiler);
        childCompiler.hooks.thisCompilation.tap('ngtools-webpack', (compilation) => {
            compilation.hooks.additionalAssets.tapAsync('ngtools-webpack', (callback) => {
                if (this._cachedEvaluatedSources.has(compilation.fullHash)) {
                    const cachedEvaluatedSource = this._cachedEvaluatedSources.get(compilation.fullHash);
                    compilation.assets[filePath] = cachedEvaluatedSource;
                    callback();
                    return;
                }
                const asset = compilation.assets[filePath];
                if (asset) {
                    this._evaluate({ outputName: filePath, source: asset.source() })
                        .then(output => {
                        const evaluatedSource = new webpack_sources_1.RawSource(output);
                        this._cachedEvaluatedSources.set(compilation.fullHash, evaluatedSource);
                        compilation.assets[filePath] = evaluatedSource;
                        callback();
                    })
                        .catch(err => callback(err));
                }
                else {
                    callback();
                }
            });
        });
        // Compile and return a promise
        return new Promise((resolve, reject) => {
            childCompiler.compile((err, childCompilation) => {
                // Resolve / reject the promise
                if (childCompilation && childCompilation.errors && childCompilation.errors.length) {
                    const errorDetails = childCompilation.errors.map(function (error) {
                        return error.message + (error.error ? ':\n' + error.error : '');
                    }).join('\n');
                    reject(new Error('Child compilation failed:\n' + errorDetails));
                }
                else if (err) {
                    reject(err);
                }
                else {
                    Object.keys(childCompilation.assets).forEach(assetName => {
                        // Add all new assets to the parent compilation, with the exception of
                        // the file we're loading and its sourcemap.
                        if (assetName !== filePath
                            && assetName !== `${filePath}.map`
                            && this._parentCompilation.assets[assetName] == undefined) {
                            this._parentCompilation.assets[assetName] = childCompilation.assets[assetName];
                        }
                    });
                    // Save the dependencies for this resource.
                    this._fileDependencies.set(filePath, childCompilation.fileDependencies);
                    const compilationHash = childCompilation.fullHash;
                    const maybeSource = this._cachedSources.get(compilationHash);
                    if (maybeSource) {
                        resolve({ outputName: filePath, source: maybeSource });
                    }
                    else {
                        const source = childCompilation.assets[filePath].source();
                        this._cachedSources.set(compilationHash, source);
                        resolve({ outputName: filePath, source });
                    }
                }
            });
        });
    }
    _evaluate({ outputName, source }) {
        try {
            // Evaluate code
            const evaluatedSource = vm.runInNewContext(source, undefined, { filename: outputName });
            if (typeof evaluatedSource == 'string') {
                return Promise.resolve(evaluatedSource);
            }
            return Promise.reject('The loader "' + outputName + '" didn\'t return a string.');
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    get(filePath) {
        return this._compile(filePath)
            .then((result) => result.source);
    }
}
exports.WebpackResourceLoader = WebpackResourceLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL3Jlc291cmNlX2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILHFCQUFxQjtBQUNyQixvREFBb0Q7QUFDcEQsd0JBQXdCO0FBQ3hCLDZCQUE2QjtBQUM3Qix5QkFBeUI7QUFDekIscURBQTRDO0FBRTVDLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7QUFDMUUsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsbUNBQW1DLENBQUMsQ0FBQztBQUN0RSxNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ3JFLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7QUFRbkUsTUFBYSxxQkFBcUI7SUFPaEM7UUFKUSxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQztRQUNoRCxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1FBQzNDLDRCQUF1QixHQUFHLElBQUksR0FBRyxFQUFxQixDQUFDO0lBRWhELENBQUM7SUFFaEIsTUFBTSxDQUFDLGlCQUFzQjtRQUMzQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsaUJBQWlCLENBQUM7UUFDNUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7SUFDNUMsQ0FBQztJQUVELHVCQUF1QixDQUFDLFFBQWdCO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDcEQsQ0FBQztJQUVPLFFBQVEsQ0FBQyxRQUFnQjtRQUUvQixJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0VB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LENBQUMsQ0FBQyxNQUF5QixFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEQsQ0FBQztDQUNGO0FBaklELHNEQWlJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbi8vIFRPRE86IGZpeCB0eXBpbmdzLlxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWdsb2JhbC10c2xpbnQtZGlzYWJsZVxuLy8gdHNsaW50OmRpc2FibGU6bm8tYW55XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdm0gZnJvbSAndm0nO1xuaW1wb3J0IHsgUmF3U291cmNlIH0gZnJvbSAnd2VicGFjay1zb3VyY2VzJztcblxuY29uc3QgTm9kZVRlbXBsYXRlUGx1Z2luID0gcmVxdWlyZSgnd2VicGFjay9saWIvbm9kZS9Ob2RlVGVtcGxhdGVQbHVnaW4nKTtcbmNvbnN0IE5vZGVUYXJnZXRQbHVnaW4gPSByZXF1aXJlKCd3ZWJwYWNrL2xpYi9ub2RlL05vZGVUYXJnZXRQbHVnaW4nKTtcbmNvbnN0IExvYWRlclRhcmdldFBsdWdpbiA9IHJlcXVpcmUoJ3dlYnBhY2svbGliL0xvYWRlclRhcmdldFBsdWdpbicpO1xuY29uc3QgU2luZ2xlRW50cnlQbHVnaW4gPSByZXF1aXJlKCd3ZWJwYWNrL2xpYi9TaW5nbGVFbnRyeVBsdWdpbicpO1xuXG5cbmludGVyZmFjZSBDb21waWxhdGlvbk91dHB1dCB7XG4gIG91dHB1dE5hbWU6IHN0cmluZztcbiAgc291cmNlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBXZWJwYWNrUmVzb3VyY2VMb2FkZXIge1xuICBwcml2YXRlIF9wYXJlbnRDb21waWxhdGlvbjogYW55O1xuICBwcml2YXRlIF9jb250ZXh0OiBzdHJpbmc7XG4gIHByaXZhdGUgX2ZpbGVEZXBlbmRlbmNpZXMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nW10+KCk7XG4gIHByaXZhdGUgX2NhY2hlZFNvdXJjZXMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBwcml2YXRlIF9jYWNoZWRFdmFsdWF0ZWRTb3VyY2VzID0gbmV3IE1hcDxzdHJpbmcsIFJhd1NvdXJjZT4oKTtcblxuICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgdXBkYXRlKHBhcmVudENvbXBpbGF0aW9uOiBhbnkpIHtcbiAgICB0aGlzLl9wYXJlbnRDb21waWxhdGlvbiA9IHBhcmVudENvbXBpbGF0aW9uO1xuICAgIHRoaXMuX2NvbnRleHQgPSBwYXJlbnRDb21waWxhdGlvbi5jb250ZXh0O1xuICB9XG5cbiAgZ2V0UmVzb3VyY2VEZXBlbmRlbmNpZXMoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLl9maWxlRGVwZW5kZW5jaWVzLmdldChmaWxlUGF0aCkgfHwgW107XG4gIH1cblxuICBwcml2YXRlIF9jb21waWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPENvbXBpbGF0aW9uT3V0cHV0PiB7XG5cbiAgICBpZiAoIXRoaXMuX3BhcmVudENvbXBpbGF0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYnBhY2tSZXNvdXJjZUxvYWRlciBjYW5ub3QgYmUgdXNlZCB3aXRob3V0IHBhcmVudENvbXBpbGF0aW9uJyk7XG4gICAgfVxuXG4gICAgLy8gU2ltcGxlIHNhbml0eSBjaGVjay5cbiAgICBpZiAoZmlsZVBhdGgubWF0Y2goL1xcLltqdF1zJC8pKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgICdDYW5ub3QgdXNlIGEgSmF2YVNjcmlwdCBvciBUeXBlU2NyaXB0IGZpbGUgZm9yIHN0eWxlVXJsIG9yIHRlbXBsYXRlVXJsLicsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IG91dHB1dE9wdGlvbnMgPSB7IGZpbGVuYW1lOiBmaWxlUGF0aCB9O1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUodGhpcy5fY29udGV4dCB8fCAnJywgZmlsZVBhdGgpO1xuICAgIGNvbnN0IGNoaWxkQ29tcGlsZXIgPSB0aGlzLl9wYXJlbnRDb21waWxhdGlvbi5jcmVhdGVDaGlsZENvbXBpbGVyKHJlbGF0aXZlUGF0aCwgb3V0cHV0T3B0aW9ucyk7XG4gICAgY2hpbGRDb21waWxlci5jb250ZXh0ID0gdGhpcy5fY29udGV4dDtcblxuICAgIG5ldyBOb2RlVGVtcGxhdGVQbHVnaW4ob3V0cHV0T3B0aW9ucykuYXBwbHkoY2hpbGRDb21waWxlcik7XG4gICAgbmV3IE5vZGVUYXJnZXRQbHVnaW4oKS5hcHBseShjaGlsZENvbXBpbGVyKTtcbiAgICBuZXcgU2luZ2xlRW50cnlQbHVnaW4odGhpcy5fY29udGV4dCwgZmlsZVBhdGgpLmFwcGx5KGNoaWxkQ29tcGlsZXIpO1xuICAgIG5ldyBMb2FkZXJUYXJnZXRQbHVnaW4oJ25vZGUnKS5hcHBseShjaGlsZENvbXBpbGVyKTtcblxuICAgIGNoaWxkQ29tcGlsZXIuaG9va3MudGhpc0NvbXBpbGF0aW9uLnRhcCgnbmd0b29scy13ZWJwYWNrJywgKGNvbXBpbGF0aW9uOiBhbnkpID0+IHtcbiAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLmFkZGl0aW9uYWxBc3NldHMudGFwQXN5bmMoJ25ndG9vbHMtd2VicGFjaycsXG4gICAgICAoY2FsbGJhY2s6IChlcnI/OiBFcnJvcikgPT4gdm9pZCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fY2FjaGVkRXZhbHVhdGVkU291cmNlcy5oYXMoY29tcGlsYXRpb24uZnVsbEhhc2gpKSB7XG4gICAgICAgICAgY29uc3QgY2FjaGVkRXZhbHVhdGVkU291cmNlID0gdGhpcy5fY2FjaGVkRXZhbHVhdGVkU291cmNlcy5nZXQoY29tcGlsYXRpb24uZnVsbEhhc2gpO1xuICAgICAgICAgIGNvbXBpbGF0aW9uLmFzc2V0c1tmaWxlUGF0aF0gPSBjYWNoZWRFdmFsdWF0ZWRTb3VyY2U7XG4gICAgICAgICAgY2FsbGJhY2soKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gY29tcGlsYXRpb24uYXNzZXRzW2ZpbGVQYXRoXTtcbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgdGhpcy5fZXZhbHVhdGUoeyBvdXRwdXROYW1lOiBmaWxlUGF0aCwgc291cmNlOiBhc3NldC5zb3VyY2UoKSB9KVxuICAgICAgICAgICAgLnRoZW4ob3V0cHV0ID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgZXZhbHVhdGVkU291cmNlID0gbmV3IFJhd1NvdXJjZShvdXRwdXQpO1xuICAgICAgICAgICAgICB0aGlzLl9jYWNoZWRFdmFsdWF0ZWRTb3VyY2VzLnNldChjb21waWxhdGlvbi5mdWxsSGFzaCwgZXZhbHVhdGVkU291cmNlKTtcbiAgICAgICAgICAgICAgY29tcGlsYXRpb24uYXNzZXRzW2ZpbGVQYXRoXSA9IGV2YWx1YXRlZFNvdXJjZTtcbiAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IGNhbGxiYWNrKGVycikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQ29tcGlsZSBhbmQgcmV0dXJuIGEgcHJvbWlzZVxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjaGlsZENvbXBpbGVyLmNvbXBpbGUoKGVycjogRXJyb3IsIGNoaWxkQ29tcGlsYXRpb246IGFueSkgPT4ge1xuICAgICAgICAvLyBSZXNvbHZlIC8gcmVqZWN0IHRoZSBwcm9taXNlXG4gICAgICAgIGlmIChjaGlsZENvbXBpbGF0aW9uICYmIGNoaWxkQ29tcGlsYXRpb24uZXJyb3JzICYmIGNoaWxkQ29tcGlsYXRpb24uZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IGVycm9yRGV0YWlscyA9IGNoaWxkQ29tcGlsYXRpb24uZXJyb3JzLm1hcChmdW5jdGlvbiAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLm1lc3NhZ2UgKyAoZXJyb3IuZXJyb3IgPyAnOlxcbicgKyBlcnJvci5lcnJvciA6ICcnKTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdDaGlsZCBjb21waWxhdGlvbiBmYWlsZWQ6XFxuJyArIGVycm9yRGV0YWlscykpO1xuICAgICAgICB9IGVsc2UgaWYgKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIE9iamVjdC5rZXlzKGNoaWxkQ29tcGlsYXRpb24uYXNzZXRzKS5mb3JFYWNoKGFzc2V0TmFtZSA9PiB7XG4gICAgICAgICAgICAvLyBBZGQgYWxsIG5ldyBhc3NldHMgdG8gdGhlIHBhcmVudCBjb21waWxhdGlvbiwgd2l0aCB0aGUgZXhjZXB0aW9uIG9mXG4gICAgICAgICAgICAvLyB0aGUgZmlsZSB3ZSdyZSBsb2FkaW5nIGFuZCBpdHMgc291cmNlbWFwLlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBhc3NldE5hbWUgIT09IGZpbGVQYXRoXG4gICAgICAgICAgICAgICYmIGFzc2V0TmFtZSAhPT0gYCR7ZmlsZVBhdGh9Lm1hcGBcbiAgICAgICAgICAgICAgJiYgdGhpcy5fcGFyZW50Q29tcGlsYXRpb24uYXNzZXRzW2Fzc2V0TmFtZV0gPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5fcGFyZW50Q29tcGlsYXRpb24uYXNzZXRzW2Fzc2V0TmFtZV0gPSBjaGlsZENvbXBpbGF0aW9uLmFzc2V0c1thc3NldE5hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gU2F2ZSB0aGUgZGVwZW5kZW5jaWVzIGZvciB0aGlzIHJlc291cmNlLlxuICAgICAgICAgIHRoaXMuX2ZpbGVEZXBlbmRlbmNpZXMuc2V0KGZpbGVQYXRoLCBjaGlsZENvbXBpbGF0aW9uLmZpbGVEZXBlbmRlbmNpZXMpO1xuXG4gICAgICAgICAgY29uc3QgY29tcGlsYXRpb25IYXNoID0gY2hpbGRDb21waWxhdGlvbi5mdWxsSGFzaDtcbiAgICAgICAgICBjb25zdCBtYXliZVNvdXJjZSA9IHRoaXMuX2NhY2hlZFNvdXJjZXMuZ2V0KGNvbXBpbGF0aW9uSGFzaCk7XG4gICAgICAgICAgaWYgKG1heWJlU291cmNlKSB7XG4gICAgICAgICAgICByZXNvbHZlKHsgb3V0cHV0TmFtZTogZmlsZVBhdGgsIHNvdXJjZTogbWF5YmVTb3VyY2UgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IGNoaWxkQ29tcGlsYXRpb24uYXNzZXRzW2ZpbGVQYXRoXS5zb3VyY2UoKTtcbiAgICAgICAgICAgIHRoaXMuX2NhY2hlZFNvdXJjZXMuc2V0KGNvbXBpbGF0aW9uSGFzaCwgc291cmNlKTtcblxuICAgICAgICAgICAgcmVzb2x2ZSh7IG91dHB1dE5hbWU6IGZpbGVQYXRoLCBzb3VyY2UgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2V2YWx1YXRlKHsgb3V0cHV0TmFtZSwgc291cmNlIH06IENvbXBpbGF0aW9uT3V0cHV0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgLy8gRXZhbHVhdGUgY29kZVxuICAgICAgY29uc3QgZXZhbHVhdGVkU291cmNlID0gdm0ucnVuSW5OZXdDb250ZXh0KHNvdXJjZSwgdW5kZWZpbmVkLCB7IGZpbGVuYW1lOiBvdXRwdXROYW1lIH0pO1xuXG4gICAgICBpZiAodHlwZW9mIGV2YWx1YXRlZFNvdXJjZSA9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGV2YWx1YXRlZFNvdXJjZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnVGhlIGxvYWRlciBcIicgKyBvdXRwdXROYW1lICsgJ1wiIGRpZG5cXCd0IHJldHVybiBhIHN0cmluZy4nKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLl9jb21waWxlKGZpbGVQYXRoKVxuICAgICAgLnRoZW4oKHJlc3VsdDogQ29tcGlsYXRpb25PdXRwdXQpID0+IHJlc3VsdC5zb3VyY2UpO1xuICB9XG59XG4iXX0=