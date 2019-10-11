"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const webpack_1 = require("webpack");
const bundle_budget_1 = require("../../plugins/bundle-budget");
const cleancss_webpack_plugin_1 = require("../../plugins/cleancss-webpack-plugin");
const scripts_webpack_plugin_1 = require("../../plugins/scripts-webpack-plugin");
const find_up_1 = require("../../utilities/find-up");
const is_directory_1 = require("../../utilities/is-directory");
const require_project_module_1 = require("../../utilities/require-project-module");
const utils_1 = require("./utils");
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const StatsPlugin = require('stats-webpack-plugin');
// tslint:disable-next-line:no-any
const g = typeof global !== 'undefined' ? global : {};
exports.buildOptimizerLoader = g['_DevKitIsLocal']
    ? require.resolve('@angular-devkit/build-optimizer/src/build-optimizer/webpack-loader')
    : '@angular-devkit/build-optimizer/webpack-loader';
// tslint:disable-next-line:no-big-function
function getCommonConfig(wco) {
    const { root, projectRoot, buildOptions } = wco;
    const nodeModules = find_up_1.findUp('node_modules', projectRoot);
    if (!nodeModules) {
        throw new Error('Cannot locate node_modules directory.');
    }
    // tslint:disable-next-line:no-any
    const extraPlugins = [];
    const entryPoints = {};
    if (buildOptions.main) {
        entryPoints['main'] = [path.resolve(root, buildOptions.main)];
    }
    if (buildOptions.polyfills) {
        entryPoints['polyfills'] = [path.resolve(root, buildOptions.polyfills)];
    }
    if (!buildOptions.aot) {
        entryPoints['polyfills'] = [
            ...(entryPoints['polyfills'] || []),
            path.join(__dirname, '..', 'jit-polyfills.js'),
        ];
    }
    if (buildOptions.profile) {
        extraPlugins.push(new webpack_1.debug.ProfilingPlugin({
            outputPath: path.resolve(root, 'chrome-profiler-events.json'),
        }));
    }
    // determine hashing format
    const hashFormat = utils_1.getOutputHashFormat(buildOptions.outputHashing || 'none');
    // process global scripts
    if (buildOptions.scripts.length > 0) {
        const globalScriptsByBundleName = utils_1.normalizeExtraEntryPoints(buildOptions.scripts, 'scripts')
            .reduce((prev, curr) => {
            const bundleName = curr.bundleName;
            const resolvedPath = path.resolve(root, curr.input);
            const existingEntry = prev.find((el) => el.bundleName === bundleName);
            if (existingEntry) {
                if (existingEntry.lazy && !curr.lazy) {
                    // All entries have to be lazy for the bundle to be lazy.
                    throw new Error(`The ${curr.bundleName} bundle is mixing lazy and non-lazy scripts.`);
                }
                existingEntry.paths.push(resolvedPath);
            }
            else {
                prev.push({
                    bundleName,
                    paths: [resolvedPath],
                    lazy: curr.lazy,
                });
            }
            return prev;
        }, []);
        // Add a new asset for each entry.
        globalScriptsByBundleName.forEach((script) => {
            // Lazy scripts don't get a hash, otherwise they can't be loaded by name.
            const hash = script.lazy ? '' : hashFormat.script;
            const bundleName = script.bundleName;
            extraPlugins.push(new scripts_webpack_plugin_1.ScriptsWebpackPlugin({
                name: bundleName,
                sourceMap: buildOptions.sourceMap,
                filename: `${path.basename(bundleName)}${hash}.js`,
                scripts: script.paths,
                basePath: projectRoot,
            }));
        });
    }
    // process asset entries
    if (buildOptions.assets) {
        const copyWebpackPluginPatterns = buildOptions.assets.map((asset) => {
            // Resolve input paths relative to workspace root and add slash at the end.
            asset.input = path.resolve(root, asset.input).replace(/\\/g, '/');
            asset.input = asset.input.endsWith('/') ? asset.input : asset.input + '/';
            asset.output = asset.output.endsWith('/') ? asset.output : asset.output + '/';
            if (asset.output.startsWith('..')) {
                const message = 'An asset cannot be written to a location outside of the output path.';
                throw new Error(message);
            }
            return {
                context: asset.input,
                // Now we remove starting slash to make Webpack place it from the output root.
                to: asset.output.replace(/^\//, ''),
                ignore: asset.ignore,
                from: {
                    glob: asset.glob,
                    dot: true,
                },
            };
        });
        const copyWebpackPluginOptions = { ignore: ['.gitkeep', '**/.DS_Store', '**/Thumbs.db'] };
        const copyWebpackPluginInstance = new CopyWebpackPlugin(copyWebpackPluginPatterns, copyWebpackPluginOptions);
        extraPlugins.push(copyWebpackPluginInstance);
    }
    if (buildOptions.progress) {
        extraPlugins.push(new ProgressPlugin({ profile: buildOptions.verbose, colors: true }));
    }
    if (buildOptions.showCircularDependencies) {
        extraPlugins.push(new CircularDependencyPlugin({
            exclude: /[\\\/]node_modules[\\\/]/,
        }));
    }
    if (buildOptions.statsJson) {
        extraPlugins.push(new StatsPlugin('stats.json', 'verbose'));
    }
    let sourceMapUseRule;
    if (buildOptions.sourceMap && buildOptions.vendorSourceMap) {
        sourceMapUseRule = {
            use: [
                {
                    loader: 'source-map-loader',
                },
            ],
        };
    }
    let buildOptimizerUseRule;
    if (buildOptions.buildOptimizer) {
        buildOptimizerUseRule = {
            use: [
                {
                    loader: exports.buildOptimizerLoader,
                    options: { sourceMap: buildOptions.sourceMap },
                },
            ],
        };
    }
    // Allow loaders to be in a node_modules nested inside the devkit/build-angular package.
    // This is important in case loaders do not get hoisted.
    // If this file moves to another location, alter potentialNodeModules as well.
    const loaderNodeModules = ['node_modules'];
    const buildAngularNodeModules = find_up_1.findUp('node_modules', __dirname);
    if (buildAngularNodeModules
        && is_directory_1.isDirectory(buildAngularNodeModules)
        && buildAngularNodeModules !== nodeModules
        && buildAngularNodeModules.startsWith(nodeModules)) {
        loaderNodeModules.push(buildAngularNodeModules);
    }
    // Load rxjs path aliases.
    // https://github.com/ReactiveX/rxjs/blob/master/doc/lettable-operators.md#build-and-treeshaking
    let alias = {};
    try {
        const rxjsPathMappingImport = wco.supportES2015
            ? 'rxjs/_esm2015/path-mapping'
            : 'rxjs/_esm5/path-mapping';
        const rxPaths = require_project_module_1.requireProjectModule(projectRoot, rxjsPathMappingImport);
        alias = rxPaths(nodeModules);
    }
    catch (_a) { }
    const terserOptions = Object.assign({ ecma: wco.supportES2015 ? 6 : 5, warnings: !!buildOptions.verbose, safari10: true, output: {
            ascii_only: true,
            comments: false,
            webkit: true,
        }, 
        // On server, we don't want to compress anything. We still set the ngDevMode = false for it
        // to remove dev code.
        compress: (buildOptions.platform == 'server' ? {
            global_defs: {
                ngDevMode: false,
            },
        } : {
            pure_getters: buildOptions.buildOptimizer,
            // PURE comments work best with 3 passes.
            // See https://github.com/webpack/webpack/issues/2899#issuecomment-317425926.
            passes: buildOptions.buildOptimizer ? 3 : 1,
            global_defs: {
                ngDevMode: false,
            },
        }) }, (buildOptions.platform == 'server' ? { mangle: false } : {}));
    return {
        mode: buildOptions.optimization ? 'production' : 'development',
        devtool: false,
        resolve: {
            extensions: ['.ts', '.tsx', '.mjs', '.js'],
            symlinks: !buildOptions.preserveSymlinks,
            modules: [
                wco.tsConfig.options.baseUrl || projectRoot,
                'node_modules',
            ],
            alias,
        },
        resolveLoader: {
            modules: loaderNodeModules,
        },
        context: projectRoot,
        entry: entryPoints,
        output: {
            path: path.resolve(root, buildOptions.outputPath),
            publicPath: buildOptions.deployUrl,
            filename: `[name]${hashFormat.chunk}.js`,
        },
        watch: buildOptions.watch,
        watchOptions: {
            poll: buildOptions.poll,
        },
        performance: {
            hints: false,
        },
        module: {
            rules: [
                { test: /\.html$/, loader: 'raw-loader' },
                {
                    test: /\.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/,
                    loader: 'file-loader',
                    options: {
                        name: `[name]${hashFormat.file}.[ext]`,
                    },
                },
                {
                    // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
                    // Removing this will cause deprecation warnings to appear.
                    test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
                    parser: { system: true },
                },
                Object.assign({ test: /\.js$/ }, buildOptimizerUseRule),
                Object.assign({ test: /\.js$/, exclude: /(ngfactory|ngstyle).js$/, enforce: 'pre' }, sourceMapUseRule),
            ],
        },
        optimization: {
            noEmitOnErrors: true,
            minimizer: [
                new webpack_1.HashedModuleIdsPlugin(),
                // TODO: check with Mike what this feature needs.
                new bundle_budget_1.BundleBudgetPlugin({ budgets: buildOptions.budgets }),
                new cleancss_webpack_plugin_1.CleanCssWebpackPlugin({
                    sourceMap: buildOptions.sourceMap,
                    // component styles retain their original file name
                    test: (file) => /\.(?:css|scss|sass|less|styl)$/.test(file),
                }),
                new TerserPlugin({
                    sourceMap: buildOptions.sourceMap,
                    parallel: true,
                    cache: true,
                    terserOptions,
                }),
            ],
        },
        plugins: extraPlugins,
    };
}
exports.getCommonConfig = getCommonConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9hbmd1bGFyLWNsaS1maWxlcy9tb2RlbHMvd2VicGFjay1jb25maWdzL2NvbW1vbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILHlEQUF5RDtBQUN6RCw2QkFBNkI7QUFDN0IscUNBQXVEO0FBRXZELCtEQUFpRTtBQUNqRSxtRkFBOEU7QUFDOUUsaUZBQTRFO0FBQzVFLHFEQUFpRDtBQUNqRCwrREFBMkQ7QUFDM0QsbUZBQThFO0FBRTlFLG1DQUF5RTtBQUV6RSxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUM3RCxNQUFNLHdCQUF3QixHQUFHLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQ3RELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBR3BELGtDQUFrQztBQUNsQyxNQUFNLENBQUMsR0FBUSxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQzlDLFFBQUEsb0JBQW9CLEdBQVcsQ0FBQyxDQUFDLGdCQUFnQixDQUFDO0lBQzdELENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLG9FQUFvRSxDQUFDO0lBQ3ZGLENBQUMsQ0FBQyxnREFBZ0QsQ0FBQztBQUVyRCwyQ0FBMkM7QUFDM0MsU0FBZ0IsZUFBZSxDQUFDLEdBQXlCO0lBQ3ZELE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUVoRCxNQUFNLFdBQVcsR0FBRyxnQkFBTSxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztJ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LEVBQUUsS0FBSyxJQUNYLGdCQUFnQjthQUV0QjtTQUNGO1FBQ0QsWUFBWSxFQUFFO1lBQ1osY0FBYyxFQUFFLElBQUk7WUFDcEIsU0FBUyxFQUFFO2dCQUNULElBQUksK0JBQXFCLEVBQUU7Z0JBQzNCLGlEQUFpRDtnQkFDakQsSUFBSSxrQ0FBa0IsQ0FBQyxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3pELElBQUksK0NBQXFCLENBQUM7b0JBQ3hCLFNBQVMsRUFBRSxZQUFZLENBQUMsU0FBUztvQkFDakMsbURBQW1EO29CQUNuRCxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7aUJBQzVELENBQUM7Z0JBQ0YsSUFBSSxZQUFZLENBQUM7b0JBQ2YsU0FBUyxFQUFFLFlBQVksQ0FBQyxTQUFTO29CQUNqQyxRQUFRLEVBQUUsSUFBSTtvQkFDZCxLQUFLLEVBQUUsSUFBSTtvQkFDWCxhQUFhO2lCQUNkLENBQUM7YUFDSDtTQUNGO1FBQ0QsT0FBTyxFQUFFLFlBQVk7S0FDdEIsQ0FBQztBQUNKLENBQUM7QUF4UkQsMENBd1JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgQ29weVdlYnBhY2tQbHVnaW4gZnJvbSAnY29weS13ZWJwYWNrLXBsdWdpbic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgSGFzaGVkTW9kdWxlSWRzUGx1Z2luLCBkZWJ1ZyB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgQXNzZXRQYXR0ZXJuT2JqZWN0IH0gZnJvbSAnLi4vLi4vLi4vYnJvd3Nlci9zY2hlbWEnO1xuaW1wb3J0IHsgQnVuZGxlQnVkZ2V0UGx1Z2luIH0gZnJvbSAnLi4vLi4vcGx1Z2lucy9idW5kbGUtYnVkZ2V0JztcbmltcG9ydCB7IENsZWFuQ3NzV2VicGFja1BsdWdpbiB9IGZyb20gJy4uLy4uL3BsdWdpbnMvY2xlYW5jc3Mtd2VicGFjay1wbHVnaW4nO1xuaW1wb3J0IHsgU2NyaXB0c1dlYnBhY2tQbHVnaW4gfSBmcm9tICcuLi8uLi9wbHVnaW5zL3NjcmlwdHMtd2VicGFjay1wbHVnaW4nO1xuaW1wb3J0IHsgZmluZFVwIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2ZpbmQtdXAnO1xuaW1wb3J0IHsgaXNEaXJlY3RvcnkgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvaXMtZGlyZWN0b3J5JztcbmltcG9ydCB7IHJlcXVpcmVQcm9qZWN0TW9kdWxlIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL3JlcXVpcmUtcHJvamVjdC1tb2R1bGUnO1xuaW1wb3J0IHsgV2VicGFja0NvbmZpZ09wdGlvbnMgfSBmcm9tICcuLi9idWlsZC1vcHRpb25zJztcbmltcG9ydCB7IGdldE91dHB1dEhhc2hGb3JtYXQsIG5vcm1hbGl6ZUV4dHJhRW50cnlQb2ludHMgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgUHJvZ3Jlc3NQbHVnaW4gPSByZXF1aXJlKCd3ZWJwYWNrL2xpYi9Qcm9ncmVzc1BsdWdpbicpO1xuY29uc3QgQ2lyY3VsYXJEZXBlbmRlbmN5UGx1Z2luID0gcmVxdWlyZSgnY2lyY3VsYXItZGVwZW5kZW5jeS1wbHVnaW4nKTtcbmNvbnN0IFRlcnNlclBsdWdpbiA9IHJlcXVpcmUoJ3RlcnNlci13ZWJwYWNrLXBsdWdpbicpO1xuY29uc3QgU3RhdHNQbHVnaW4gPSByZXF1aXJlKCdzdGF0cy13ZWJwYWNrLXBsdWdpbicpO1xuXG5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbmNvbnN0IGc6IGFueSA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDoge307XG5leHBvcnQgY29uc3QgYnVpbGRPcHRpbWl6ZXJMb2FkZXI6IHN0cmluZyA9IGdbJ19EZXZLaXRJc0xvY2FsJ11cbiAgPyByZXF1aXJlLnJlc29sdmUoJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1vcHRpbWl6ZXIvc3JjL2J1aWxkLW9wdGltaXplci93ZWJwYWNrLWxvYWRlcicpXG4gIDogJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1vcHRpbWl6ZXIvd2VicGFjay1sb2FkZXInO1xuXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYmlnLWZ1bmN0aW9uXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbW9uQ29uZmlnKHdjbzogV2VicGFja0NvbmZpZ09wdGlvbnMpIHtcbiAgY29uc3QgeyByb290LCBwcm9qZWN0Um9vdCwgYnVpbGRPcHRpb25zIH0gPSB3Y287XG5cbiAgY29uc3Qgbm9kZU1vZHVsZXMgPSBmaW5kVXAoJ25vZGVfbW9kdWxlcycsIHByb2plY3RSb290KTtcbiAgaWYgKCFub2RlTW9kdWxlcykge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGxvY2F0ZSBub2RlX21vZHVsZXMgZGlyZWN0b3J5LicpO1xuICB9XG5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICBjb25zdCBleHRyYVBsdWdpbnM6IGFueVtdID0gW107XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZ1tdIH0gPSB7fTtcblxuICBpZiAoYnVpbGRPcHRpb25zLm1haW4pIHtcbiAgICBlbnRyeVBvaW50c1snbWFpbiddID0gW3BhdGgucmVzb2x2ZShyb290LCBidWlsZE9wdGlvbnMubWFpbildO1xuICB9XG5cbiAgaWYgKGJ1aWxkT3B0aW9ucy5wb2x5ZmlsbHMpIHtcbiAgICBlbnRyeVBvaW50c1sncG9seWZpbGxzJ10gPSBbcGF0aC5yZXNvbHZlKHJvb3QsIGJ1aWxkT3B0aW9ucy5wb2x5ZmlsbHMpXTtcbiAgfVxuXG4gIGlmICghYnVpbGRPcHRpb25zLmFvdCkge1xuICAgIGVudHJ5UG9pbnRzWydwb2x5ZmlsbHMnXSA9IFtcbiAgICAgIC4uLihlbnRyeVBvaW50c1sncG9seWZpbGxzJ10gfHwgW10pLFxuICAgICAgcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2ppdC1wb2x5ZmlsbHMuanMnKSxcbiAgICBdO1xuICB9XG5cbiAgaWYgKGJ1aWxkT3B0aW9ucy5wcm9maWxlKSB7XG4gICAgZXh0cmFQbHVnaW5zLnB1c2gobmV3IGRlYnVnLlByb2ZpbGluZ1BsdWdpbih7XG4gICAgICBvdXRwdXRQYXRoOiBwYXRoLnJlc29sdmUocm9vdCwgJ2Nocm9tZS1wcm9maWxlci1ldmVudHMuanNvbicpLFxuICAgIH0pKTtcbiAgfVxuXG4gIC8vIGRldGVybWluZSBoYXNoaW5nIGZvcm1hdFxuICBjb25zdCBoYXNoRm9ybWF0ID0gZ2V0T3V0cHV0SGFzaEZvcm1hdChidWlsZE9wdGlvbnMub3V0cHV0SGFzaGluZyB8fCAnbm9uZScpO1xuXG4gIC8vIHByb2Nlc3MgZ2xvYmFsIHNjcmlwdHNcbiAgaWYgKGJ1aWxkT3B0aW9ucy5zY3JpcHRzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBnbG9iYWxTY3JpcHRzQnlCdW5kbGVOYW1lID0gbm9ybWFsaXplRXh0cmFFbnRyeVBvaW50cyhidWlsZE9wdGlvbnMuc2NyaXB0cywgJ3NjcmlwdHMnKVxuICAgICAgLnJlZHVjZSgocHJldjogeyBidW5kbGVOYW1lOiBzdHJpbmcsIHBhdGhzOiBzdHJpbmdbXSwgbGF6eTogYm9vbGVhbiB9W10sIGN1cnIpID0+IHtcbiAgICAgICAgY29uc3QgYnVuZGxlTmFtZSA9IGN1cnIuYnVuZGxlTmFtZTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcGF0aC5yZXNvbHZlKHJvb3QsIGN1cnIuaW5wdXQpO1xuICAgICAgICBjb25zdCBleGlzdGluZ0VudHJ5ID0gcHJldi5maW5kKChlbCkgPT4gZWwuYnVuZGxlTmFtZSA9PT0gYnVuZGxlTmFtZSk7XG4gICAgICAgIGlmIChleGlzdGluZ0VudHJ5KSB7XG4gICAgICAgICAgaWYgKGV4aXN0aW5nRW50cnkubGF6eSAmJiAhY3Vyci5sYXp5KSB7XG4gICAgICAgICAgICAvLyBBbGwgZW50cmllcyBoYXZlIHRvIGJlIGxhenkgZm9yIHRoZSBidW5kbGUgdG8gYmUgbGF6eS5cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlICR7Y3Vyci5idW5kbGVOYW1lfSBidW5kbGUgaXMgbWl4aW5nIGxhenkgYW5kIG5vbi1sYXp5IHNjcmlwdHMuYCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZXhpc3RpbmdFbnRyeS5wYXRocy5wdXNoKHJlc29sdmVkUGF0aCk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcmV2LnB1c2goe1xuICAgICAgICAgICAgYnVuZGxlTmFtZSxcbiAgICAgICAgICAgIHBhdGhzOiBbcmVzb2x2ZWRQYXRoXSxcbiAgICAgICAgICAgIGxhenk6IGN1cnIubGF6eSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgfSwgW10pO1xuXG5cbiAgICAvLyBBZGQgYSBuZXcgYXNzZXQgZm9yIGVhY2ggZW50cnkuXG4gICAgZ2xvYmFsU2NyaXB0c0J5QnVuZGxlTmFtZS5mb3JFYWNoKChzY3JpcHQpID0+IHtcbiAgICAgIC8vIExhenkgc2NyaXB0cyBkb24ndCBnZXQgYSBoYXNoLCBvdGhlcndpc2UgdGhleSBjYW4ndCBiZSBsb2FkZWQgYnkgbmFtZS5cbiAgICAgIGNvbnN0IGhhc2ggPSBzY3JpcHQubGF6eSA/ICcnIDogaGFzaEZvcm1hdC5zY3JpcHQ7XG4gICAgICBjb25zdCBidW5kbGVOYW1lID0gc2NyaXB0LmJ1bmRsZU5hbWU7XG5cbiAgICAgIGV4dHJhUGx1Z2lucy5wdXNoKG5ldyBTY3JpcHRzV2VicGFja1BsdWdpbih7XG4gICAgICAgIG5hbWU6IGJ1bmRsZU5hbWUsXG4gICAgICAgIHNvdXJjZU1hcDogYnVpbGRPcHRpb25zLnNvdXJjZU1hcCxcbiAgICAgICAgZmlsZW5hbWU6IGAke3BhdGguYmFzZW5hbWUoYnVuZGxlTmFtZSl9JHtoYXNofS5qc2AsXG4gICAgICAgIHNjcmlwdHM6IHNjcmlwdC5wYXRocyxcbiAgICAgICAgYmFzZVBhdGg6IHByb2plY3RSb290LFxuICAgICAgfSkpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gcHJvY2VzcyBhc3NldCBlbnRyaWVzXG4gIGlmIChidWlsZE9wdGlvbnMuYXNzZXRzKSB7XG4gICAgY29uc3QgY29weVdlYnBhY2tQbHVnaW5QYXR0ZXJucyA9IGJ1aWxkT3B0aW9ucy5hc3NldHMubWFwKChhc3NldDogQXNzZXRQYXR0ZXJuT2JqZWN0KSA9PiB7XG5cbiAgICAgIC8vIFJlc29sdmUgaW5wdXQgcGF0aHMgcmVsYXRpdmUgdG8gd29ya3NwYWNlIHJvb3QgYW5kIGFkZCBzbGFzaCBhdCB0aGUgZW5kLlxuICAgICAgYXNzZXQuaW5wdXQgPSBwYXRoLnJlc29sdmUocm9vdCwgYXNzZXQuaW5wdXQpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgIGFzc2V0LmlucHV0ID0gYXNzZXQuaW5wdXQuZW5kc1dpdGgoJy8nKSA/IGFzc2V0LmlucHV0IDogYXNzZXQuaW5wdXQgKyAnLyc7XG4gICAgICBhc3NldC5vdXRwdXQgPSBhc3NldC5vdXRwdXQuZW5kc1dpdGgoJy8nKSA/IGFzc2V0Lm91dHB1dCA6IGFzc2V0Lm91dHB1dCArICcvJztcblxuICAgICAgaWYgKGFzc2V0Lm91dHB1dC5zdGFydHNXaXRoKCcuLicpKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSAnQW4gYXNzZXQgY2Fubm90IGJlIHdyaXR0ZW4gdG8gYSBsb2NhdGlvbiBvdXRzaWRlIG9mIHRoZSBvdXRwdXQgcGF0aC4nO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRleHQ6IGFzc2V0LmlucHV0LFxuICAgICAgICAvLyBOb3cgd2UgcmVtb3ZlIHN0YXJ0aW5nIHNsYXNoIHRvIG1ha2UgV2VicGFjayBwbGFjZSBpdCBmcm9tIHRoZSBvdXRwdXQgcm9vdC5cbiAgICAgICAgdG86IGFzc2V0Lm91dHB1dC5yZXBsYWNlKC9eXFwvLywgJycpLFxuICAgICAgICBpZ25vcmU6IGFzc2V0Lmlnbm9yZSxcbiAgICAgICAgZnJvbToge1xuICAgICAgICAgIGdsb2I6IGFzc2V0Lmdsb2IsXG4gICAgICAgICAgZG90OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGNvcHlXZWJwYWNrUGx1Z2luT3B0aW9ucyA9IHsgaWdub3JlOiBbJy5naXRrZWVwJywgJyoqLy5EU19TdG9yZScsICcqKi9UaHVtYnMuZGInXSB9O1xuXG4gICAgY29uc3QgY29weVdlYnBhY2tQbHVnaW5JbnN0YW5jZSA9IG5ldyBDb3B5V2VicGFja1BsdWdpbihjb3B5V2VicGFja1BsdWdpblBhdHRlcm5zLFxuICAgICAgY29weVdlYnBhY2tQbHVnaW5PcHRpb25zKTtcbiAgICBleHRyYVBsdWdpbnMucHVzaChjb3B5V2VicGFja1BsdWdpbkluc3RhbmNlKTtcbiAgfVxuXG4gIGlmIChidWlsZE9wdGlvbnMucHJvZ3Jlc3MpIHtcbiAgICBleHRyYVBsdWdpbnMucHVzaChuZXcgUHJvZ3Jlc3NQbHVnaW4oeyBwcm9maWxlOiBidWlsZE9wdGlvbnMudmVyYm9zZSwgY29sb3JzOiB0cnVlIH0pKTtcbiAgfVxuXG4gIGlmIChidWlsZE9wdGlvbnMuc2hvd0NpcmN1bGFyRGVwZW5kZW5jaWVzKSB7XG4gICAgZXh0cmFQbHVnaW5zLnB1c2gobmV3IENpcmN1bGFyRGVwZW5kZW5jeVBsdWdpbih7XG4gICAgICBleGNsdWRlOiAvW1xcXFxcXC9dbm9kZV9tb2R1bGVzW1xcXFxcXC9dLyxcbiAgICB9KSk7XG4gIH1cblxuICBpZiAoYnVpbGRPcHRpb25zLnN0YXRzSnNvbikge1xuICAgIGV4dHJhUGx1Z2lucy5wdXNoKG5ldyBTdGF0c1BsdWdpbignc3RhdHMuanNvbicsICd2ZXJib3NlJykpO1xuICB9XG5cbiAgbGV0IHNvdXJjZU1hcFVzZVJ1bGU7XG4gIGlmIChidWlsZE9wdGlvbnMuc291cmNlTWFwICYmIGJ1aWxkT3B0aW9ucy52ZW5kb3JTb3VyY2VNYXApIHtcbiAgICBzb3VyY2VNYXBVc2VSdWxlID0ge1xuICAgICAgdXNlOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBsb2FkZXI6ICdzb3VyY2UtbWFwLWxvYWRlcicsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG4gIH1cblxuICBsZXQgYnVpbGRPcHRpbWl6ZXJVc2VSdWxlO1xuICBpZiAoYnVpbGRPcHRpb25zLmJ1aWxkT3B0aW1pemVyKSB7XG4gICAgYnVpbGRPcHRpbWl6ZXJVc2VSdWxlID0ge1xuICAgICAgdXNlOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBsb2FkZXI6IGJ1aWxkT3B0aW1pemVyTG9hZGVyLFxuICAgICAgICAgIG9wdGlvbnM6IHsgc291cmNlTWFwOiBidWlsZE9wdGlvbnMuc291cmNlTWFwIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG4gIH1cblxuICAvLyBBbGxvdyBsb2FkZXJzIHRvIGJlIGluIGEgbm9kZV9tb2R1bGVzIG5lc3RlZCBpbnNpZGUgdGhlIGRldmtpdC9idWlsZC1hbmd1bGFyIHBhY2thZ2UuXG4gIC8vIFRoaXMgaXMgaW1wb3J0YW50IGluIGNhc2UgbG9hZGVycyBkbyBub3QgZ2V0IGhvaXN0ZWQuXG4gIC8vIElmIHRoaXMgZmlsZSBtb3ZlcyB0byBhbm90aGVyIGxvY2F0aW9uLCBhbHRlciBwb3RlbnRpYWxOb2RlTW9kdWxlcyBhcyB3ZWxsLlxuICBjb25zdCBsb2FkZXJOb2RlTW9kdWxlcyA9IFsnbm9kZV9tb2R1bGVzJ107XG4gIGNvbnN0IGJ1aWxkQW5ndWxhck5vZGVNb2R1bGVzID0gZmluZFVwKCdub2RlX21vZHVsZXMnLCBfX2Rpcm5hbWUpO1xuICBpZiAoYnVpbGRBbmd1bGFyTm9kZU1vZHVsZXNcbiAgICAmJiBpc0RpcmVjdG9yeShidWlsZEFuZ3VsYXJOb2RlTW9kdWxlcylcbiAgICAmJiBidWlsZEFuZ3VsYXJOb2RlTW9kdWxlcyAhPT0gbm9kZU1vZHVsZXNcbiAgICAmJiBidWlsZEFuZ3VsYXJOb2RlTW9kdWxlcy5zdGFydHNXaXRoKG5vZGVNb2R1bGVzKVxuICApIHtcbiAgICBsb2FkZXJOb2RlTW9kdWxlcy5wdXNoKGJ1aWxkQW5ndWxhck5vZGVNb2R1bGVzKTtcbiAgfVxuXG4gIC8vIExvYWQgcnhqcyBwYXRoIGFsaWFzZXMuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9SZWFjdGl2ZVgvcnhqcy9ibG9iL21hc3Rlci9kb2MvbGV0dGFibGUtb3BlcmF0b3JzLm1kI2J1aWxkLWFuZC10cmVlc2hha2luZ1xuICBsZXQgYWxpYXMgPSB7fTtcbiAgdHJ5IHtcbiAgICBjb25zdCByeGpzUGF0aE1hcHBpbmdJbXBvcnQgPSB3Y28uc3VwcG9ydEVTMjAxNVxuICAgICAgPyAncnhqcy9fZXNtMjAxNS9wYXRoLW1hcHBpbmcnXG4gICAgICA6ICdyeGpzL19lc201L3BhdGgtbWFwcGluZyc7XG4gICAgY29uc3QgcnhQYXRocyA9IHJlcXVpcmVQcm9qZWN0TW9kdWxlKHByb2plY3RSb290LCByeGpzUGF0aE1hcHBpbmdJbXBvcnQpO1xuICAgIGFsaWFzID0gcnhQYXRocyhub2RlTW9kdWxlcyk7XG4gIH0gY2F0Y2ggeyB9XG5cbiAgY29uc3QgdGVyc2VyT3B0aW9ucyA9IHtcbiAgICBlY21hOiB3Y28uc3VwcG9ydEVTMjAxNSA/IDYgOiA1LFxuICAgIHdhcm5pbmdzOiAhIWJ1aWxkT3B0aW9ucy52ZXJib3NlLFxuICAgIHNhZmFyaTEwOiB0cnVlLFxuICAgIG91dHB1dDoge1xuICAgICAgYXNjaWlfb25seTogdHJ1ZSxcbiAgICAgIGNvbW1lbnRzOiBmYWxzZSxcbiAgICAgIHdlYmtpdDogdHJ1ZSxcbiAgICB9LFxuXG4gICAgLy8gT24gc2VydmVyLCB3ZSBkb24ndCB3YW50IHRvIGNvbXByZXNzIGFueXRoaW5nLiBXZSBzdGlsbCBzZXQgdGhlIG5nRGV2TW9kZSA9IGZhbHNlIGZvciBpdFxuICAgIC8vIHRvIHJlbW92ZSBkZXYgY29kZS5cbiAgICBjb21wcmVzczogKGJ1aWxkT3B0aW9ucy5wbGF0Zm9ybSA9PSAnc2VydmVyJyA/IHtcbiAgICAgIGdsb2JhbF9kZWZzOiB7XG4gICAgICAgIG5nRGV2TW9kZTogZmFsc2UsXG4gICAgICB9LFxuICAgIH0gOiB7XG4gICAgICBwdXJlX2dldHRlcnM6IGJ1aWxkT3B0aW9ucy5idWlsZE9wdGltaXplcixcbiAgICAgIC8vIFBVUkUgY29tbWVudHMgd29yayBiZXN0IHdpdGggMyBwYXNzZXMuXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3dlYnBhY2svd2VicGFjay9pc3N1ZXMvMjg5OSNpc3N1ZWNvbW1lbnQtMzE3NDI1OTI2LlxuICAgICAgcGFzc2VzOiBidWlsZE9wdGlvbnMuYnVpbGRPcHRpbWl6ZXIgPyAzIDogMSxcbiAgICAgIGdsb2JhbF9kZWZzOiB7XG4gICAgICAgIG5nRGV2TW9kZTogZmFsc2UsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIC8vIFdlIGFsc28gd2FudCB0byBhdm9pZCBtYW5nbGluZyBvbiBzZXJ2ZXIuXG4gICAgLi4uKGJ1aWxkT3B0aW9ucy5wbGF0Zm9ybSA9PSAnc2VydmVyJyA/IHsgbWFuZ2xlOiBmYWxzZSB9IDoge30pLFxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbW9kZTogYnVpbGRPcHRpb25zLm9wdGltaXphdGlvbiA/ICdwcm9kdWN0aW9uJyA6ICdkZXZlbG9wbWVudCcsXG4gICAgZGV2dG9vbDogZmFsc2UsXG4gICAgcmVzb2x2ZToge1xuICAgICAgZXh0ZW5zaW9uczogWycudHMnLCAnLnRzeCcsICcubWpzJywgJy5qcyddLFxuICAgICAgc3ltbGlua3M6ICFidWlsZE9wdGlvbnMucHJlc2VydmVTeW1saW5rcyxcbiAgICAgIG1vZHVsZXM6IFtcbiAgICAgICAgd2NvLnRzQ29uZmlnLm9wdGlvbnMuYmFzZVVybCB8fCBwcm9qZWN0Um9vdCxcbiAgICAgICAgJ25vZGVfbW9kdWxlcycsXG4gICAgICBdLFxuICAgICAgYWxpYXMsXG4gICAgfSxcbiAgICByZXNvbHZlTG9hZGVyOiB7XG4gICAgICBtb2R1bGVzOiBsb2FkZXJOb2RlTW9kdWxlcyxcbiAgICB9LFxuICAgIGNvbnRleHQ6IHByb2plY3RSb290LFxuICAgIGVudHJ5OiBlbnRyeVBvaW50cyxcbiAgICBvdXRwdXQ6IHtcbiAgICAgIHBhdGg6IHBhdGgucmVzb2x2ZShyb290LCBidWlsZE9wdGlvbnMub3V0cHV0UGF0aCBhcyBzdHJpbmcpLFxuICAgICAgcHVibGljUGF0aDogYnVpbGRPcHRpb25zLmRlcGxveVVybCxcbiAgICAgIGZpbGVuYW1lOiBgW25hbWVdJHtoYXNoRm9ybWF0LmNodW5rfS5qc2AsXG4gICAgfSxcbiAgICB3YXRjaDogYnVpbGRPcHRpb25zLndhdGNoLFxuICAgIHdhdGNoT3B0aW9uczoge1xuICAgICAgcG9sbDogYnVpbGRPcHRpb25zLnBvbGwsXG4gICAgfSxcbiAgICBwZXJmb3JtYW5jZToge1xuICAgICAgaGludHM6IGZhbHNlLFxuICAgIH0sXG4gICAgbW9kdWxlOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICB7IHRlc3Q6IC9cXC5odG1sJC8sIGxvYWRlcjogJ3Jhdy1sb2FkZXInIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0ZXN0OiAvXFwuKGVvdHxzdmd8Y3VyfGpwZ3xwbmd8d2VicHxnaWZ8b3RmfHR0Znx3b2ZmfHdvZmYyfGFuaSkkLyxcbiAgICAgICAgICBsb2FkZXI6ICdmaWxlLWxvYWRlcicsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgbmFtZTogYFtuYW1lXSR7aGFzaEZvcm1hdC5maWxlfS5bZXh0XWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIC8vIE1hcmsgZmlsZXMgaW5zaWRlIGBAYW5ndWxhci9jb3JlYCBhcyB1c2luZyBTeXN0ZW1KUyBzdHlsZSBkeW5hbWljIGltcG9ydHMuXG4gICAgICAgICAgLy8gUmVtb3ZpbmcgdGhpcyB3aWxsIGNhdXNlIGRlcHJlY2F0aW9uIHdhcm5pbmdzIHRvIGFwcGVhci5cbiAgICAgICAgICB0ZXN0OiAvW1xcL1xcXFxdQGFuZ3VsYXJbXFwvXFxcXF1jb3JlW1xcL1xcXFxdLitcXC5qcyQvLFxuICAgICAgICAgIHBhcnNlcjogeyBzeXN0ZW06IHRydWUgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHRlc3Q6IC9cXC5qcyQvLFxuICAgICAgICAgIC4uLmJ1aWxkT3B0aW1pemVyVXNlUnVsZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHRlc3Q6IC9cXC5qcyQvLFxuICAgICAgICAgIGV4Y2x1ZGU6IC8obmdmYWN0b3J5fG5nc3R5bGUpLmpzJC8sXG4gICAgICAgICAgZW5mb3JjZTogJ3ByZScsXG4gICAgICAgICAgLi4uc291cmNlTWFwVXNlUnVsZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBvcHRpbWl6YXRpb246IHtcbiAgICAgIG5vRW1pdE9uRXJyb3JzOiB0cnVlLFxuICAgICAgbWluaW1pemVyOiBbXG4gICAgICAgIG5ldyBIYXNoZWRNb2R1bGVJZHNQbHVnaW4oKSxcbiAgICAgICAgLy8gVE9ETzogY2hlY2sgd2l0aCBNaWtlIHdoYXQgdGhpcyBmZWF0dXJlIG5lZWRzLlxuICAgICAgICBuZXcgQnVuZGxlQnVkZ2V0UGx1Z2luKHsgYnVkZ2V0czogYnVpbGRPcHRpb25zLmJ1ZGdldHMgfSksXG4gICAgICAgIG5ldyBDbGVhbkNzc1dlYnBhY2tQbHVnaW4oe1xuICAgICAgICAgIHNvdXJjZU1hcDogYnVpbGRPcHRpb25zLnNvdXJjZU1hcCxcbiAgICAgICAgICAvLyBjb21wb25lbnQgc3R5bGVzIHJldGFpbiB0aGVpciBvcmlnaW5hbCBmaWxlIG5hbWVcbiAgICAgICAgICB0ZXN0OiAoZmlsZSkgPT4gL1xcLig/OmNzc3xzY3NzfHNhc3N8bGVzc3xzdHlsKSQvLnRlc3QoZmlsZSksXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgVGVyc2VyUGx1Z2luKHtcbiAgICAgICAgICBzb3VyY2VNYXA6IGJ1aWxkT3B0aW9ucy5zb3VyY2VNYXAsXG4gICAgICAgICAgcGFyYWxsZWw6IHRydWUsXG4gICAgICAgICAgY2FjaGU6IHRydWUsXG4gICAgICAgICAgdGVyc2VyT3B0aW9ucyxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgIH0sXG4gICAgcGx1Z2luczogZXh0cmFQbHVnaW5zLFxuICB9O1xufVxuIl19