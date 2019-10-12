"use strict";
// tslint:disable
// TODO: cleanup this file, it's copied as is from Angular CLI.
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_sources_1 = require("webpack-sources");
const loader_utils_1 = require("loader-utils");
const path = require("path");
const Chunk = require('webpack/lib/Chunk');
const EntryPoint = require('webpack/lib/Entrypoint');
function addDependencies(compilation, scripts) {
    if (compilation.fileDependencies.add) {
        // Webpack 4+ uses a Set
        for (const script of scripts) {
            compilation.fileDependencies.add(script);
        }
    }
    else {
        // Webpack 3
        compilation.fileDependencies.push(...scripts);
    }
}
function hook(compiler, action) {
    if (compiler.hooks) {
        // Webpack 4
        compiler.hooks.thisCompilation.tap('scripts-webpack-plugin', (compilation) => {
            compilation.hooks.additionalAssets.tapAsync('scripts-webpack-plugin', (callback) => action(compilation, callback));
        });
    }
    else {
        // Webpack 3
        compiler.plugin('this-compilation', (compilation) => {
            compilation.plugin('additional-assets', (callback) => action(compilation, callback));
        });
    }
}
class ScriptsWebpackPlugin {
    constructor(options = {}) {
        this.options = options;
    }
    shouldSkip(compilation, scripts) {
        if (this._lastBuildTime == undefined) {
            this._lastBuildTime = Date.now();
            return false;
        }
        for (let i = 0; i < scripts.length; i++) {
            let scriptTime;
            if (compilation.fileTimestamps.get) {
                // Webpack 4+ uses a Map
                scriptTime = compilation.fileTimestamps.get(scripts[i]);
            }
            else {
                // Webpack 3
                scriptTime = compilation.fileTimestamps[scripts[i]];
            }
            if (!scriptTime || scriptTime > this._lastBuildTime) {
                this._lastBuildTime = Date.now();
                return false;
            }
        }
        return true;
    }
    _insertOutput(compilation, { filename, source }, cached = false) {
        const chunk = new Chunk(this.options.name);
        chunk.rendered = !cached;
        chunk.id = this.options.name;
        chunk.ids = [chunk.id];
        chunk.files.push(filename);
        const entrypoint = new EntryPoint(this.options.name);
        entrypoint.pushChunk(chunk);
        compilation.entrypoints.set(this.options.name, entrypoint);
        compilation.chunks.push(chunk);
        compilation.assets[filename] = source;
    }
    apply(compiler) {
        if (!this.options.scripts || this.options.scripts.length === 0) {
            return;
        }
        const scripts = this.options.scripts
            .filter(script => !!script)
            .map(script => path.resolve(this.options.basePath || '', script));
        hook(compiler, (compilation, callback) => {
            if (this.shouldSkip(compilation, scripts)) {
                if (this._cachedOutput) {
                    this._insertOutput(compilation, this._cachedOutput, true);
                }
                addDependencies(compilation, scripts);
                callback();
                return;
            }
            const sourceGetters = scripts.map(fullPath => {
                return new Promise((resolve, reject) => {
                    compilation.inputFileSystem.readFile(fullPath, (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        const content = data.toString();
                        let source;
                        if (this.options.sourceMap) {
                            // TODO: Look for source map file (for '.min' scripts, etc.)
                            let adjustedPath = fullPath;
                            if (this.options.basePath) {
                                adjustedPath = path.relative(this.options.basePath, fullPath);
                            }
                            source = new webpack_sources_1.OriginalSource(content, adjustedPath);
                        }
                        else {
                            source = new webpack_sources_1.RawSource(content);
                        }
                        resolve(source);
                    });
                });
            });
            Promise.all(sourceGetters)
                .then(sources => {
                const concatSource = new webpack_sources_1.ConcatSource();
                sources.forEach(source => {
                    concatSource.add(source);
                    concatSource.add('\n;');
                });
                const combinedSource = new webpack_sources_1.CachedSource(concatSource);
                const filename = loader_utils_1.interpolateName({ resourcePath: 'scripts.js' }, this.options.filename, { content: combinedSource.source() });
                const output = { filename, source: combinedSource };
                this._insertOutput(compilation, output);
                this._cachedOutput = output;
                addDependencies(compilation, scripts);
                callback();
            })
                .catch((err) => callback(err));
        });
    }
}
exports.ScriptsWebpackPlugin = ScriptsWebpackPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0cy13ZWJwYWNrLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYW5ndWxhci1jbGktZmlsZXMvcGx1Z2lucy9zY3JpcHRzLXdlYnBhY2stcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpQkFBaUI7QUFDakIsK0RBQStEOztBQWlCL0QscURBQWdHO0FBQ2hHLCtDQUErQztBQUMvQyw2QkFBNkI7QUFFN0IsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDM0MsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFlckQsU0FBUyxlQUFlLENBQUMsV0FBZ0IsRUFBRSxPQUFpQjtJQUMxRCxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUU7UUFDcEMsd0JBQXdCO1FBQ3hCLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO1lBQzVCLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDMUM7S0FDRjtTQUFNO1FBQ0wsWUFBWTtRQUNaLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztLQUMvQztBQUNILENBQUM7QUFFRCxTQUFTLElBQUksQ0FBQyxRQUFhLEVBQUUsTUFBbUU7SUFDOUYsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFO1FBQ2xCLFlBQVk7UUFDWixRQUFRLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxXQUFnQixFQUFFLEVBQUU7WUFDaEYsV0FBVyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQ3pDLHdCQUF3QixFQUN4QixDQUFDLFFBQStCLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxXQUFX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Q0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO2dCQUM1QixlQUFlLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUV0QyxRQUFRLEVBQUUsQ0FBQztZQUNiLENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsQ0FBQyxHQUFVLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdkhELG9EQXVIQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRzbGludDpkaXNhYmxlXG4vLyBUT0RPOiBjbGVhbnVwIHRoaXMgZmlsZSwgaXQncyBjb3BpZWQgYXMgaXMgZnJvbSBBbmd1bGFyIENMSS5cblxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgQ29tcGlsZXIsIGxvYWRlciB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgQ2FjaGVkU291cmNlLCBDb25jYXRTb3VyY2UsIE9yaWdpbmFsU291cmNlLCBSYXdTb3VyY2UsIFNvdXJjZSB9IGZyb20gJ3dlYnBhY2stc291cmNlcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0ZU5hbWUgfSBmcm9tICdsb2FkZXItdXRpbHMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuY29uc3QgQ2h1bmsgPSByZXF1aXJlKCd3ZWJwYWNrL2xpYi9DaHVuaycpO1xuY29uc3QgRW50cnlQb2ludCA9IHJlcXVpcmUoJ3dlYnBhY2svbGliL0VudHJ5cG9pbnQnKTtcblxuZXhwb3J0IGludGVyZmFjZSBTY3JpcHRzV2VicGFja1BsdWdpbk9wdGlvbnMge1xuICBuYW1lOiBzdHJpbmc7XG4gIHNvdXJjZU1hcDogYm9vbGVhbjtcbiAgc2NyaXB0czogc3RyaW5nW107XG4gIGZpbGVuYW1lOiBzdHJpbmc7XG4gIGJhc2VQYXRoOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBTY3JpcHRPdXRwdXQge1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBzb3VyY2U6IENhY2hlZFNvdXJjZTtcbn1cblxuZnVuY3Rpb24gYWRkRGVwZW5kZW5jaWVzKGNvbXBpbGF0aW9uOiBhbnksIHNjcmlwdHM6IHN0cmluZ1tdKTogdm9pZCB7XG4gIGlmIChjb21waWxhdGlvbi5maWxlRGVwZW5kZW5jaWVzLmFkZCkge1xuICAgIC8vIFdlYnBhY2sgNCsgdXNlcyBhIFNldFxuICAgIGZvciAoY29uc3Qgc2NyaXB0IG9mIHNjcmlwdHMpIHtcbiAgICAgIGNvbXBpbGF0aW9uLmZpbGVEZXBlbmRlbmNpZXMuYWRkKHNjcmlwdCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFdlYnBhY2sgM1xuICAgIGNvbXBpbGF0aW9uLmZpbGVEZXBlbmRlbmNpZXMucHVzaCguLi5zY3JpcHRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBob29rKGNvbXBpbGVyOiBhbnksIGFjdGlvbjogKGNvbXBpbGF0aW9uOiBhbnksIGNhbGxiYWNrOiAoZXJyPzogRXJyb3IpID0+IHZvaWQpID0+IHZvaWQpIHtcbiAgaWYgKGNvbXBpbGVyLmhvb2tzKSB7XG4gICAgLy8gV2VicGFjayA0XG4gICAgY29tcGlsZXIuaG9va3MudGhpc0NvbXBpbGF0aW9uLnRhcCgnc2NyaXB0cy13ZWJwYWNrLXBsdWdpbicsIChjb21waWxhdGlvbjogYW55KSA9PiB7XG4gICAgICBjb21waWxhdGlvbi5ob29rcy5hZGRpdGlvbmFsQXNzZXRzLnRhcEFzeW5jKFxuICAgICAgICAnc2NyaXB0cy13ZWJwYWNrLXBsdWdpbicsXG4gICAgICAgIChjYWxsYmFjazogKGVycj86IEVycm9yKSA9PiB2b2lkKSA9PiBhY3Rpb24oY29tcGlsYXRpb24sIGNhbGxiYWNrKSxcbiAgICAgICk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2VicGFjayAzXG4gICAgY29tcGlsZXIucGx1Z2luKCd0aGlzLWNvbXBpbGF0aW9uJywgKGNvbXBpbGF0aW9uOiBhbnkpID0+IHtcbiAgICAgIGNvbXBpbGF0aW9uLnBsdWdpbihcbiAgICAgICAgJ2FkZGl0aW9uYWwtYXNzZXRzJyxcbiAgICAgICAgKGNhbGxiYWNrOiAoZXJyPzogRXJyb3IpID0+IHZvaWQpID0+IGFjdGlvbihjb21waWxhdGlvbiwgY2FsbGJhY2spLFxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2NyaXB0c1dlYnBhY2tQbHVnaW4ge1xuICBwcml2YXRlIF9sYXN0QnVpbGRUaW1lPzogbnVtYmVyO1xuICBwcml2YXRlIF9jYWNoZWRPdXRwdXQ/OiBTY3JpcHRPdXRwdXQ7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBvcHRpb25zOiBQYXJ0aWFsPFNjcmlwdHNXZWJwYWNrUGx1Z2luT3B0aW9ucz4gPSB7fSkgeyB9XG5cbiAgc2hvdWxkU2tpcChjb21waWxhdGlvbjogYW55LCBzY3JpcHRzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9sYXN0QnVpbGRUaW1lID09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fbGFzdEJ1aWxkVGltZSA9IERhdGUubm93KCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgc2NyaXB0VGltZTtcbiAgICAgIGlmIChjb21waWxhdGlvbi5maWxlVGltZXN0YW1wcy5nZXQpIHtcbiAgICAgICAgLy8gV2VicGFjayA0KyB1c2VzIGEgTWFwXG4gICAgICAgIHNjcmlwdFRpbWUgPSBjb21waWxhdGlvbi5maWxlVGltZXN0YW1wcy5nZXQoc2NyaXB0c1tpXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZWJwYWNrIDNcbiAgICAgICAgc2NyaXB0VGltZSA9IGNvbXBpbGF0aW9uLmZpbGVUaW1lc3RhbXBzW3NjcmlwdHNbaV1dO1xuICAgICAgfVxuICAgICAgaWYgKCFzY3JpcHRUaW1lIHx8IHNjcmlwdFRpbWUgPiB0aGlzLl9sYXN0QnVpbGRUaW1lKSB7XG4gICAgICAgIHRoaXMuX2xhc3RCdWlsZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9pbnNlcnRPdXRwdXQoY29tcGlsYXRpb246IGFueSwgeyBmaWxlbmFtZSwgc291cmNlIH06IFNjcmlwdE91dHB1dCwgY2FjaGVkID0gZmFsc2UpIHtcbiAgICBjb25zdCBjaHVuayA9IG5ldyBDaHVuayh0aGlzLm9wdGlvbnMubmFtZSk7XG4gICAgY2h1bmsucmVuZGVyZWQgPSAhY2FjaGVkO1xuICAgIGNodW5rLmlkID0gdGhpcy5vcHRpb25zLm5hbWU7XG4gICAgY2h1bmsuaWRzID0gW2NodW5rLmlkXTtcbiAgICBjaHVuay5maWxlcy5wdXNoKGZpbGVuYW1lKTtcblxuICAgIGNvbnN0IGVudHJ5cG9pbnQgPSBuZXcgRW50cnlQb2ludCh0aGlzLm9wdGlvbnMubmFtZSk7XG4gICAgZW50cnlwb2ludC5wdXNoQ2h1bmsoY2h1bmspO1xuXG4gICAgY29tcGlsYXRpb24uZW50cnlwb2ludHMuc2V0KHRoaXMub3B0aW9ucy5uYW1lLCBlbnRyeXBvaW50KTtcbiAgICBjb21waWxhdGlvbi5jaHVua3MucHVzaChjaHVuayk7XG4gICAgY29tcGlsYXRpb24uYXNzZXRzW2ZpbGVuYW1lXSA9IHNvdXJjZTtcbiAgfVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcik6IHZvaWQge1xuICAgIGlmICghdGhpcy5vcHRpb25zLnNjcmlwdHMgfHwgdGhpcy5vcHRpb25zLnNjcmlwdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2NyaXB0cyA9IHRoaXMub3B0aW9ucy5zY3JpcHRzXG4gICAgICAuZmlsdGVyKHNjcmlwdCA9PiAhIXNjcmlwdClcbiAgICAgIC5tYXAoc2NyaXB0ID0+IHBhdGgucmVzb2x2ZSh0aGlzLm9wdGlvbnMuYmFzZVBhdGggfHwgJycsIHNjcmlwdCkpO1xuXG4gICAgaG9vayhjb21waWxlciwgKGNvbXBpbGF0aW9uLCBjYWxsYmFjaykgPT4ge1xuICAgICAgaWYgKHRoaXMuc2hvdWxkU2tpcChjb21waWxhdGlvbiwgc2NyaXB0cykpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NhY2hlZE91dHB1dCkge1xuICAgICAgICAgIHRoaXMuX2luc2VydE91dHB1dChjb21waWxhdGlvbiwgdGhpcy5fY2FjaGVkT3V0cHV0LCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZERlcGVuZGVuY2llcyhjb21waWxhdGlvbiwgc2NyaXB0cyk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzb3VyY2VHZXR0ZXJzID0gc2NyaXB0cy5tYXAoZnVsbFBhdGggPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8U291cmNlPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29tcGlsYXRpb24uaW5wdXRGaWxlU3lzdGVtLnJlYWRGaWxlKGZ1bGxQYXRoLCAoZXJyOiBFcnJvciwgZGF0YTogQnVmZmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBkYXRhLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGxldCBzb3VyY2U7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNvdXJjZU1hcCkge1xuICAgICAgICAgICAgICAvLyBUT0RPOiBMb29rIGZvciBzb3VyY2UgbWFwIGZpbGUgKGZvciAnLm1pbicgc2NyaXB0cywgZXRjLilcblxuICAgICAgICAgICAgICBsZXQgYWRqdXN0ZWRQYXRoID0gZnVsbFBhdGg7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFzZVBhdGgpIHtcbiAgICAgICAgICAgICAgICBhZGp1c3RlZFBhdGggPSBwYXRoLnJlbGF0aXZlKHRoaXMub3B0aW9ucy5iYXNlUGF0aCwgZnVsbFBhdGgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHNvdXJjZSA9IG5ldyBPcmlnaW5hbFNvdXJjZShjb250ZW50LCBhZGp1c3RlZFBhdGgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc291cmNlID0gbmV3IFJhd1NvdXJjZShjb250ZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzb2x2ZShzb3VyY2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBQcm9taXNlLmFsbChzb3VyY2VHZXR0ZXJzKVxuICAgICAgICAudGhlbihzb3VyY2VzID0+IHtcbiAgICAgICAgICBjb25zdCBjb25jYXRTb3VyY2UgPSBuZXcgQ29uY2F0U291cmNlKCk7XG4gICAgICAgICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiB7XG4gICAgICAgICAgICBjb25jYXRTb3VyY2UuYWRkKHNvdXJjZSk7XG4gICAgICAgICAgICBjb25jYXRTb3VyY2UuYWRkKCdcXG47Jyk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjb25zdCBjb21iaW5lZFNvdXJjZSA9IG5ldyBDYWNoZWRTb3VyY2UoY29uY2F0U291cmNlKTtcbiAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGludGVycG9sYXRlTmFtZShcbiAgICAgICAgICAgIHsgcmVzb3VyY2VQYXRoOiAnc2NyaXB0cy5qcycgfSBhcyBsb2FkZXIuTG9hZGVyQ29udGV4dCxcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5maWxlbmFtZSBhcyBzdHJpbmcsXG4gICAgICAgICAgICB7IGNvbnRlbnQ6IGNvbWJpbmVkU291cmNlLnNvdXJjZSgpIH0sXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IG91dHB1dCA9IHsgZmlsZW5hbWUsIHNvdXJjZTogY29tYmluZWRTb3VyY2UgfTtcbiAgICAgICAgICB0aGlzLl9pbnNlcnRPdXRwdXQoY29tcGlsYXRpb24sIG91dHB1dCk7XG4gICAgICAgICAgdGhpcy5fY2FjaGVkT3V0cHV0ID0gb3V0cHV0O1xuICAgICAgICAgIGFkZERlcGVuZGVuY2llcyhjb21waWxhdGlvbiwgc2NyaXB0cyk7XG5cbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycjogRXJyb3IpID0+IGNhbGxiYWNrKGVycikpO1xuICAgIH0pO1xuICB9XG59XG4iXX0=