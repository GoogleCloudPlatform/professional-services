"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const webpack_1 = require("../../plugins/webpack");
const utils_1 = require("./utils");
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssImports = require('postcss-import');
/**
 * Enumerate loaders and their dependencies from this file to let the dependency validator
 * know they are used.
 *
 * require('style-loader')
 * require('postcss-loader')
 * require('stylus')
 * require('stylus-loader')
 * require('less')
 * require('less-loader')
 * require('node-sass')
 * require('sass-loader')
 */
function getStylesConfig(wco) {
    const { root, buildOptions } = wco;
    const entryPoints = {};
    const globalStylePaths = [];
    const extraPlugins = [];
    const cssSourceMap = buildOptions.sourceMap;
    // Determine hashing format.
    const hashFormat = utils_1.getOutputHashFormat(buildOptions.outputHashing);
    // Convert absolute resource URLs to account for base-href and deploy-url.
    const baseHref = wco.buildOptions.baseHref || '';
    const deployUrl = wco.buildOptions.deployUrl || '';
    const postcssPluginCreator = function (loader) {
        return [
            postcssImports({
                resolve: (url) => url.startsWith('~') ? url.substr(1) : url,
                load: (filename) => {
                    return new Promise((resolve, reject) => {
                        loader.fs.readFile(filename, (err, data) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            const content = data.toString();
                            resolve(content);
                        });
                    });
                },
            }),
            webpack_1.PostcssCliResources({
                baseHref,
                deployUrl,
                loader,
                filename: `[name]${hashFormat.file}.[ext]`,
            }),
            autoprefixer(),
        ];
    };
    // use includePaths from appConfig
    const includePaths = [];
    let lessPathOptions = {};
    if (buildOptions.stylePreprocessorOptions
        && buildOptions.stylePreprocessorOptions.includePaths
        && buildOptions.stylePreprocessorOptions.includePaths.length > 0) {
        buildOptions.stylePreprocessorOptions.includePaths.forEach((includePath) => includePaths.push(path.resolve(root, includePath)));
        lessPathOptions = {
            paths: includePaths,
        };
    }
    // Process global styles.
    if (buildOptions.styles.length > 0) {
        const chunkNames = [];
        utils_1.normalizeExtraEntryPoints(buildOptions.styles, 'styles').forEach(style => {
            const resolvedPath = path.resolve(root, style.input);
            // Add style entry points.
            if (entryPoints[style.bundleName]) {
                entryPoints[style.bundleName].push(resolvedPath);
            }
            else {
                entryPoints[style.bundleName] = [resolvedPath];
            }
            // Add lazy styles to the list.
            if (style.lazy) {
                chunkNames.push(style.bundleName);
            }
            // Add global css paths.
            globalStylePaths.push(resolvedPath);
        });
        if (chunkNames.length > 0) {
            // Add plugin to remove hashes from lazy styles.
            extraPlugins.push(new webpack_1.RemoveHashPlugin({ chunkNames, hashFormat }));
        }
    }
    let dartSass;
    try {
        // tslint:disable-next-line:no-implicit-dependencies
        dartSass = require('sass');
    }
    catch (_a) { }
    let fiber;
    if (dartSass) {
        try {
            // tslint:disable-next-line:no-implicit-dependencies
            fiber = require('fibers');
        }
        catch (_b) { }
    }
    // set base rules to derive final rules from
    const baseRules = [
        { test: /\.css$/, use: [] },
        {
            test: /\.scss$|\.sass$/,
            use: [{
                    loader: 'sass-loader',
                    options: {
                        implementation: dartSass,
                        fiber,
                        sourceMap: cssSourceMap,
                        // bootstrap-sass requires a minimum precision of 8
                        precision: 8,
                        includePaths,
                    },
                }],
        },
        {
            test: /\.less$/,
            use: [{
                    loader: 'less-loader',
                    options: Object.assign({ sourceMap: cssSourceMap, javascriptEnabled: true }, lessPathOptions),
                }],
        },
        {
            test: /\.styl$/,
            use: [{
                    loader: 'stylus-loader',
                    options: {
                        sourceMap: cssSourceMap,
                        paths: includePaths,
                    },
                }],
        },
    ];
    // load component css as raw strings
    const rules = baseRules.map(({ test, use }) => ({
        exclude: globalStylePaths,
        test,
        use: [
            { loader: 'raw-loader' },
            {
                loader: 'postcss-loader',
                options: {
                    ident: 'embedded',
                    plugins: postcssPluginCreator,
                    sourceMap: cssSourceMap ? 'inline' : false,
                },
            },
            ...use,
        ],
    }));
    // load global css as css files
    if (globalStylePaths.length > 0) {
        rules.push(...baseRules.map(({ test, use }) => {
            return {
                include: globalStylePaths,
                test,
                use: [
                    buildOptions.extractCss ? MiniCssExtractPlugin.loader : 'style-loader',
                    webpack_1.RawCssLoader,
                    {
                        loader: 'postcss-loader',
                        options: {
                            ident: buildOptions.extractCss ? 'extracted' : 'embedded',
                            plugins: postcssPluginCreator,
                            sourceMap: cssSourceMap && !buildOptions.extractCss ? 'inline' : cssSourceMap,
                        },
                    },
                    ...use,
                ],
            };
        }));
    }
    if (buildOptions.extractCss) {
        extraPlugins.push(
        // extract global css from js files into own css file
        new MiniCssExtractPlugin({ filename: `[name]${hashFormat.extract}.css` }), 
        // suppress empty .js files in css only entry points
        new webpack_1.SuppressExtractedTextChunksWebpackPlugin());
    }
    return {
        entry: entryPoints,
        module: { rules },
        plugins: extraPlugins,
    };
}
exports.getStylesConfig = getStylesConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVzLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9hbmd1bGFyLWNsaS1maWxlcy9tb2RlbHMvd2VicGFjay1jb25maWdzL3N0eWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILDZCQUE2QjtBQUU3QixtREFLK0I7QUFFL0IsbUNBQXlFO0FBRXpFLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUM3QyxNQUFNLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ2hFLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRWpEOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILFNBQWdCLGVBQWUsQ0FBQyxHQUF5QjtJQUN2RCxNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUNuQyxNQUFNLFdBQVcsR0FBZ0MsRUFBRSxDQUFDO0lBQ3BELE1BQU0sZ0JBQWdCLEdBQWEsRUFBRSxDQUFDO0lBQ3RDLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN4QixNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDO0lBRTVDLDRCQUE0QjtJQUM1QixNQUFNLFVBQVUsR0FBRywyQkFBbUIsQ0FBQyxZQUFZLENBQUMsYUFBdUIsQ0FBQyxDQUFDO0lBQzdFLDBFQUEwRTtJQUMxRSxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7SUFDakQsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO0lBRW5ELE1BQU0sb0JBQW9CLEdBQUcsVUFBVSxNQUFvQztRQUN6RSxPQUFPO1lBQ0wsY0FBYyxDQUFDO2dCQUNiLE9BQU8sRUFBRSxD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LEdBQXdCO2lCQUM3QjthQUNGLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ0w7SUFFRCxJQUFJLFlBQVksQ0FBQyxVQUFVLEVBQUU7UUFDM0IsWUFBWSxDQUFDLElBQUk7UUFDZixxREFBcUQ7UUFDckQsSUFBSSxvQkFBb0IsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFTLFVBQVUsQ0FBQyxPQUFPLE1BQU0sRUFBRSxDQUFDO1FBQ3pFLG9EQUFvRDtRQUNwRCxJQUFJLGtEQUF3QyxFQUFFLENBQy9DLENBQUM7S0FDSDtJQUVELE9BQU87UUFDTCxLQUFLLEVBQUUsV0FBVztRQUNsQixNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUU7UUFDakIsT0FBTyxFQUFFLFlBQVk7S0FDdEIsQ0FBQztBQUNKLENBQUM7QUFsTUQsMENBa01DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgd2VicGFjayBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7XG4gIFBvc3Rjc3NDbGlSZXNvdXJjZXMsXG4gIFJhd0Nzc0xvYWRlcixcbiAgUmVtb3ZlSGFzaFBsdWdpbixcbiAgU3VwcHJlc3NFeHRyYWN0ZWRUZXh0Q2h1bmtzV2VicGFja1BsdWdpbixcbn0gZnJvbSAnLi4vLi4vcGx1Z2lucy93ZWJwYWNrJztcbmltcG9ydCB7IFdlYnBhY2tDb25maWdPcHRpb25zIH0gZnJvbSAnLi4vYnVpbGQtb3B0aW9ucyc7XG5pbXBvcnQgeyBnZXRPdXRwdXRIYXNoRm9ybWF0LCBub3JtYWxpemVFeHRyYUVudHJ5UG9pbnRzIH0gZnJvbSAnLi91dGlscyc7XG5cbmNvbnN0IGF1dG9wcmVmaXhlciA9IHJlcXVpcmUoJ2F1dG9wcmVmaXhlcicpO1xuY29uc3QgTWluaUNzc0V4dHJhY3RQbHVnaW4gPSByZXF1aXJlKCdtaW5pLWNzcy1leHRyYWN0LXBsdWdpbicpO1xuY29uc3QgcG9zdGNzc0ltcG9ydHMgPSByZXF1aXJlKCdwb3N0Y3NzLWltcG9ydCcpO1xuXG4vKipcbiAqIEVudW1lcmF0ZSBsb2FkZXJzIGFuZCB0aGVpciBkZXBlbmRlbmNpZXMgZnJvbSB0aGlzIGZpbGUgdG8gbGV0IHRoZSBkZXBlbmRlbmN5IHZhbGlkYXRvclxuICoga25vdyB0aGV5IGFyZSB1c2VkLlxuICpcbiAqIHJlcXVpcmUoJ3N0eWxlLWxvYWRlcicpXG4gKiByZXF1aXJlKCdwb3N0Y3NzLWxvYWRlcicpXG4gKiByZXF1aXJlKCdzdHlsdXMnKVxuICogcmVxdWlyZSgnc3R5bHVzLWxvYWRlcicpXG4gKiByZXF1aXJlKCdsZXNzJylcbiAqIHJlcXVpcmUoJ2xlc3MtbG9hZGVyJylcbiAqIHJlcXVpcmUoJ25vZGUtc2FzcycpXG4gKiByZXF1aXJlKCdzYXNzLWxvYWRlcicpXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxlc0NvbmZpZyh3Y286IFdlYnBhY2tDb25maWdPcHRpb25zKSB7XG4gIGNvbnN0IHsgcm9vdCwgYnVpbGRPcHRpb25zIH0gPSB3Y287XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZ1tdIH0gPSB7fTtcbiAgY29uc3QgZ2xvYmFsU3R5bGVQYXRoczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZXh0cmFQbHVnaW5zID0gW107XG4gIGNvbnN0IGNzc1NvdXJjZU1hcCA9IGJ1aWxkT3B0aW9ucy5zb3VyY2VNYXA7XG5cbiAgLy8gRGV0ZXJtaW5lIGhhc2hpbmcgZm9ybWF0LlxuICBjb25zdCBoYXNoRm9ybWF0ID0gZ2V0T3V0cHV0SGFzaEZvcm1hdChidWlsZE9wdGlvbnMub3V0cHV0SGFzaGluZyBhcyBzdHJpbmcpO1xuICAvLyBDb252ZXJ0IGFic29sdXRlIHJlc291cmNlIFVSTHMgdG8gYWNjb3VudCBmb3IgYmFzZS1ocmVmIGFuZCBkZXBsb3ktdXJsLlxuICBjb25zdCBiYXNlSHJlZiA9IHdjby5idWlsZE9wdGlvbnMuYmFzZUhyZWYgfHwgJyc7XG4gIGNvbnN0IGRlcGxveVVybCA9IHdjby5idWlsZE9wdGlvbnMuZGVwbG95VXJsIHx8ICcnO1xuXG4gIGNvbnN0IHBvc3Rjc3NQbHVnaW5DcmVhdG9yID0gZnVuY3Rpb24gKGxvYWRlcjogd2VicGFjay5sb2FkZXIuTG9hZGVyQ29udGV4dCkge1xuICAgIHJldHVybiBbXG4gICAgICBwb3N0Y3NzSW1wb3J0cyh7XG4gICAgICAgIHJlc29sdmU6ICh1cmw6IHN0cmluZykgPT4gdXJsLnN0YXJ0c1dpdGgoJ34nKSA/IHVybC5zdWJzdHIoMSkgOiB1cmwsXG4gICAgICAgIGxvYWQ6IChmaWxlbmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgbG9hZGVyLmZzLnJlYWRGaWxlKGZpbGVuYW1lLCAoZXJyOiBFcnJvciwgZGF0YTogQnVmZmVyKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgIHJlc29sdmUoY29udGVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgUG9zdGNzc0NsaVJlc291cmNlcyh7XG4gICAgICAgIGJhc2VIcmVmLFxuICAgICAgICBkZXBsb3lVcmwsXG4gICAgICAgIGxvYWRlcixcbiAgICAgICAgZmlsZW5hbWU6IGBbbmFtZV0ke2hhc2hGb3JtYXQuZmlsZX0uW2V4dF1gLFxuICAgICAgfSksXG4gICAgICBhdXRvcHJlZml4ZXIoKSxcbiAgICBdO1xuICB9O1xuXG4gIC8vIHVzZSBpbmNsdWRlUGF0aHMgZnJvbSBhcHBDb25maWdcbiAgY29uc3QgaW5jbHVkZVBhdGhzOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgbGVzc1BhdGhPcHRpb25zOiB7IHBhdGhzPzogc3RyaW5nW10gfSA9IHt9O1xuXG4gIGlmIChidWlsZE9wdGlvbnMuc3R5bGVQcmVwcm9jZXNzb3JPcHRpb25zXG4gICAgJiYgYnVpbGRPcHRpb25zLnN0eWxlUHJlcHJvY2Vzc29yT3B0aW9ucy5pbmNsdWRlUGF0aHNcbiAgICAmJiBidWlsZE9wdGlvbnMuc3R5bGVQcmVwcm9jZXNzb3JPcHRpb25zLmluY2x1ZGVQYXRocy5sZW5ndGggPiAwXG4gICkge1xuICAgIGJ1aWxkT3B0aW9ucy5zdHlsZVByZXByb2Nlc3Nvck9wdGlvbnMuaW5jbHVkZVBhdGhzLmZvckVhY2goKGluY2x1ZGVQYXRoOiBzdHJpbmcpID0+XG4gICAgICBpbmNsdWRlUGF0aHMucHVzaChwYXRoLnJlc29sdmUocm9vdCwgaW5jbHVkZVBhdGgpKSk7XG4gICAgbGVzc1BhdGhPcHRpb25zID0ge1xuICAgICAgcGF0aHM6IGluY2x1ZGVQYXRocyxcbiAgICB9O1xuICB9XG5cbiAgLy8gUHJvY2VzcyBnbG9iYWwgc3R5bGVzLlxuICBpZiAoYnVpbGRPcHRpb25zLnN0eWxlcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY2h1bmtOYW1lczogc3RyaW5nW10gPSBbXTtcblxuICAgIG5vcm1hbGl6ZUV4dHJhRW50cnlQb2ludHMoYnVpbGRPcHRpb25zLnN0eWxlcywgJ3N0eWxlcycpLmZvckVhY2goc3R5bGUgPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcGF0aC5yZXNvbHZlKHJvb3QsIHN0eWxlLmlucHV0KTtcbiAgICAgIC8vIEFkZCBzdHlsZSBlbnRyeSBwb2ludHMuXG4gICAgICBpZiAoZW50cnlQb2ludHNbc3R5bGUuYnVuZGxlTmFtZV0pIHtcbiAgICAgICAgZW50cnlQb2ludHNbc3R5bGUuYnVuZGxlTmFtZV0ucHVzaChyZXNvbHZlZFBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW50cnlQb2ludHNbc3R5bGUuYnVuZGxlTmFtZV0gPSBbcmVzb2x2ZWRQYXRoXTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGxhenkgc3R5bGVzIHRvIHRoZSBsaXN0LlxuICAgICAgaWYgKHN0eWxlLmxhenkpIHtcbiAgICAgICAgY2h1bmtOYW1lcy5wdXNoKHN0eWxlLmJ1bmRsZU5hbWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgZ2xvYmFsIGNzcyBwYXRocy5cbiAgICAgIGdsb2JhbFN0eWxlUGF0aHMucHVzaChyZXNvbHZlZFBhdGgpO1xuICAgIH0pO1xuXG4gICAgaWYgKGNodW5rTmFtZXMubGVuZ3RoID4gMCkge1xuICAgICAgLy8gQWRkIHBsdWdpbiB0byByZW1vdmUgaGFzaGVzIGZyb20gbGF6eSBzdHlsZXMuXG4gICAgICBleHRyYVBsdWdpbnMucHVzaChuZXcgUmVtb3ZlSGFzaFBsdWdpbih7IGNodW5rTmFtZXMsIGhhc2hGb3JtYXQgfSkpO1xuICAgIH1cbiAgfVxuXG4gIGxldCBkYXJ0U2Fzczoge30gfCB1bmRlZmluZWQ7XG4gIHRyeSB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWltcGxpY2l0LWRlcGVuZGVuY2llc1xuICAgIGRhcnRTYXNzID0gcmVxdWlyZSgnc2FzcycpO1xuICB9IGNhdGNoIHsgfVxuXG4gIGxldCBmaWJlcjoge30gfCB1bmRlZmluZWQ7XG4gIGlmIChkYXJ0U2Fzcykge1xuICAgIHRyeSB7XG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8taW1wbGljaXQtZGVwZW5kZW5jaWVzXG4gICAgICBmaWJlciA9IHJlcXVpcmUoJ2ZpYmVycycpO1xuICAgIH0gY2F0Y2ggeyB9XG4gIH1cblxuICAvLyBzZXQgYmFzZSBydWxlcyB0byBkZXJpdmUgZmluYWwgcnVsZXMgZnJvbVxuICBjb25zdCBiYXNlUnVsZXM6IHdlYnBhY2suUnVsZVNldFJ1bGVbXSA9IFtcbiAgICB7IHRlc3Q6IC9cXC5jc3MkLywgdXNlOiBbXSB9LFxuICAgIHtcbiAgICAgIHRlc3Q6IC9cXC5zY3NzJHxcXC5zYXNzJC8sXG4gICAgICB1c2U6IFt7XG4gICAgICAgIGxvYWRlcjogJ3Nhc3MtbG9hZGVyJyxcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgIGltcGxlbWVudGF0aW9uOiBkYXJ0U2FzcyxcbiAgICAgICAgICBmaWJlcixcbiAgICAgICAgICBzb3VyY2VNYXA6IGNzc1NvdXJjZU1hcCxcbiAgICAgICAgICAvLyBib290c3RyYXAtc2FzcyByZXF1aXJlcyBhIG1pbmltdW0gcHJlY2lzaW9uIG9mIDhcbiAgICAgICAgICBwcmVjaXNpb246IDgsXG4gICAgICAgICAgaW5jbHVkZVBhdGhzLFxuICAgICAgICB9LFxuICAgICAgfV0sXG4gICAgfSxcbiAgICB7XG4gICAgICB0ZXN0OiAvXFwubGVzcyQvLFxuICAgICAgdXNlOiBbe1xuICAgICAgICBsb2FkZXI6ICdsZXNzLWxvYWRlcicsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICBzb3VyY2VNYXA6IGNzc1NvdXJjZU1hcCxcbiAgICAgICAgICBqYXZhc2NyaXB0RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAuLi5sZXNzUGF0aE9wdGlvbnMsXG4gICAgICAgIH0sXG4gICAgICB9XSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHRlc3Q6IC9cXC5zdHlsJC8sXG4gICAgICB1c2U6IFt7XG4gICAgICAgIGxvYWRlcjogJ3N0eWx1cy1sb2FkZXInLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgc291cmNlTWFwOiBjc3NTb3VyY2VNYXAsXG4gICAgICAgICAgcGF0aHM6IGluY2x1ZGVQYXRocyxcbiAgICAgICAgfSxcbiAgICAgIH1dLFxuICAgIH0sXG4gIF07XG5cbiAgLy8gbG9hZCBjb21wb25lbnQgY3NzIGFzIHJhdyBzdHJpbmdzXG4gIGNvbnN0IHJ1bGVzOiB3ZWJwYWNrLlJ1bGVTZXRSdWxlW10gPSBiYXNlUnVsZXMubWFwKCh7IHRlc3QsIHVzZSB9KSA9PiAoe1xuICAgIGV4Y2x1ZGU6IGdsb2JhbFN0eWxlUGF0aHMsXG4gICAgdGVzdCxcbiAgICB1c2U6IFtcbiAgICAgIHsgbG9hZGVyOiAncmF3LWxvYWRlcicgfSxcbiAgICAgIHtcbiAgICAgICAgbG9hZGVyOiAncG9zdGNzcy1sb2FkZXInLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgaWRlbnQ6ICdlbWJlZGRlZCcsXG4gICAgICAgICAgcGx1Z2luczogcG9zdGNzc1BsdWdpbkNyZWF0b3IsXG4gICAgICAgICAgc291cmNlTWFwOiBjc3NTb3VyY2VNYXAgPyAnaW5saW5lJyA6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIC4uLih1c2UgYXMgd2VicGFjay5Mb2FkZXJbXSksXG4gICAgXSxcbiAgfSkpO1xuXG4gIC8vIGxvYWQgZ2xvYmFsIGNzcyBhcyBjc3MgZmlsZXNcbiAgaWYgKGdsb2JhbFN0eWxlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIHJ1bGVzLnB1c2goLi4uYmFzZVJ1bGVzLm1hcCgoeyB0ZXN0LCB1c2UgfSkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaW5jbHVkZTogZ2xvYmFsU3R5bGVQYXRocyxcbiAgICAgICAgdGVzdCxcbiAgICAgICAgdXNlOiBbXG4gICAgICAgICAgYnVpbGRPcHRpb25zLmV4dHJhY3RDc3MgPyBNaW5pQ3NzRXh0cmFjdFBsdWdpbi5sb2FkZXIgOiAnc3R5bGUtbG9hZGVyJyxcbiAgICAgICAgICBSYXdDc3NMb2FkZXIsXG4gICAgICAgICAge1xuICAgICAgICAgICAgbG9hZGVyOiAncG9zdGNzcy1sb2FkZXInLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBpZGVudDogYnVpbGRPcHRpb25zLmV4dHJhY3RDc3MgPyAnZXh0cmFjdGVkJyA6ICdlbWJlZGRlZCcsXG4gICAgICAgICAgICAgIHBsdWdpbnM6IHBvc3Rjc3NQbHVnaW5DcmVhdG9yLFxuICAgICAgICAgICAgICBzb3VyY2VNYXA6IGNzc1NvdXJjZU1hcCAmJiAhYnVpbGRPcHRpb25zLmV4dHJhY3RDc3MgPyAnaW5saW5lJyA6IGNzc1NvdXJjZU1hcCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICAuLi4odXNlIGFzIHdlYnBhY2suTG9hZGVyW10pLFxuICAgICAgICBdLFxuICAgICAgfTtcbiAgICB9KSk7XG4gIH1cblxuICBpZiAoYnVpbGRPcHRpb25zLmV4dHJhY3RDc3MpIHtcbiAgICBleHRyYVBsdWdpbnMucHVzaChcbiAgICAgIC8vIGV4dHJhY3QgZ2xvYmFsIGNzcyBmcm9tIGpzIGZpbGVzIGludG8gb3duIGNzcyBmaWxlXG4gICAgICBuZXcgTWluaUNzc0V4dHJhY3RQbHVnaW4oeyBmaWxlbmFtZTogYFtuYW1lXSR7aGFzaEZvcm1hdC5leHRyYWN0fS5jc3NgIH0pLFxuICAgICAgLy8gc3VwcHJlc3MgZW1wdHkgLmpzIGZpbGVzIGluIGNzcyBvbmx5IGVudHJ5IHBvaW50c1xuICAgICAgbmV3IFN1cHByZXNzRXh0cmFjdGVkVGV4dENodW5rc1dlYnBhY2tQbHVnaW4oKSxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBlbnRyeTogZW50cnlQb2ludHMsXG4gICAgbW9kdWxlOiB7IHJ1bGVzIH0sXG4gICAgcGx1Z2luczogZXh0cmFQbHVnaW5zLFxuICB9O1xufVxuIl19