"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const license_webpack_plugin_1 = require("license-webpack-plugin");
const path = require("path");
const index_html_webpack_plugin_1 = require("../../plugins/index-html-webpack-plugin");
const package_chunk_sort_1 = require("../../utilities/package-chunk-sort");
const utils_1 = require("./utils");
const SubresourceIntegrityPlugin = require('webpack-subresource-integrity');
function getBrowserConfig(wco) {
    const { root, buildOptions } = wco;
    const extraPlugins = [];
    let sourcemaps = false;
    if (buildOptions.sourceMap) {
        // See https://webpack.js.org/configuration/devtool/ for sourcemap types.
        if (buildOptions.evalSourceMap && !buildOptions.optimization) {
            // Produce eval sourcemaps for development with serve, which are faster.
            sourcemaps = 'eval';
        }
        else {
            // Produce full separate sourcemaps for production.
            sourcemaps = 'source-map';
        }
    }
    if (buildOptions.index) {
        extraPlugins.push(new index_html_webpack_plugin_1.IndexHtmlWebpackPlugin({
            input: path.resolve(root, buildOptions.index),
            output: path.basename(buildOptions.index),
            baseHref: buildOptions.baseHref,
            entrypoints: package_chunk_sort_1.generateEntryPoints(buildOptions),
            deployUrl: buildOptions.deployUrl,
            sri: buildOptions.subresourceIntegrity,
        }));
    }
    if (buildOptions.subresourceIntegrity) {
        extraPlugins.push(new SubresourceIntegrityPlugin({
            hashFuncNames: ['sha384'],
        }));
    }
    if (buildOptions.extractLicenses) {
        extraPlugins.push(new license_webpack_plugin_1.LicenseWebpackPlugin({
            stats: {
                warnings: false,
                errors: false,
            },
            perChunkOutput: false,
            outputFilename: `3rdpartylicenses.txt`,
        }));
    }
    const globalStylesBundleNames = utils_1.normalizeExtraEntryPoints(buildOptions.styles, 'styles')
        .map(style => style.bundleName);
    return {
        devtool: sourcemaps,
        resolve: {
            mainFields: [
                ...(wco.supportES2015 ? ['es2015'] : []),
                'browser', 'module', 'main',
            ],
        },
        output: {
            crossOriginLoading: buildOptions.subresourceIntegrity ? 'anonymous' : false,
        },
        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                maxAsyncRequests: Infinity,
                cacheGroups: {
                    default: buildOptions.commonChunk && {
                        chunks: 'async',
                        minChunks: 2,
                        priority: 10,
                    },
                    common: buildOptions.commonChunk && {
                        name: 'common',
                        chunks: 'async',
                        minChunks: 2,
                        enforce: true,
                        priority: 5,
                    },
                    vendors: false,
                    vendor: buildOptions.vendorChunk && {
                        name: 'vendor',
                        chunks: 'initial',
                        enforce: true,
                        test: (module, chunks) => {
                            const moduleName = module.nameForCondition ? module.nameForCondition() : '';
                            return /[\\/]node_modules[\\/]/.test(moduleName)
                                && !chunks.some(({ name }) => name === 'polyfills'
                                    || globalStylesBundleNames.includes(name));
                        },
                    },
                },
            },
        },
        plugins: extraPlugins,
        node: false,
    };
}
exports.getBrowserConfig = getBrowserConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYW5ndWxhci1jbGktZmlsZXMvbW9kZWxzL3dlYnBhY2stY29uZmlncy9icm93c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsbUVBQThEO0FBQzlELDZCQUE2QjtBQUM3Qix1RkFBaUY7QUFDakYsMkVBQXlFO0FBRXpFLG1DQUFvRDtBQUVwRCxNQUFNLDBCQUEwQixHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBRzVFLFNBQWdCLGdCQUFnQixDQUFDLEdBQXlCO0lBQ3hELE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsR0FBRyxDQUFDO0lBQ25DLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUV4QixJQUFJLFVBQVUsR0FBbUIsS0FBSyxDQUFDO0lBQ3ZDLElBQUksWUFBWSxDQUFDLFNBQVMsRUFBRTtRQUMxQix5RUFBeUU7UUFDekUsSUFBSSxZQUFZLENBQUMsYUFBYSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRTtZQUM1RCx3RUFBd0U7WUFDeEUsVUFBVSxHQUFHLE1BQU0sQ0FBQztTQUNyQjthQUFNO1lBQ0wsbURBQW1EO1lBQ25ELFVBQVUsR0FBRyxZQUFZLENBQUM7U0FDM0I7S0FDRjtJQUVELElBQUksWUFBWSxDQUFDLEtBQUssRUFBRTtRQUN0QixZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksa0RBQXNCLENBQUM7WUFDM0MsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFDN0MsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUN6QyxRQUFRLEVBQUUsWUFBWSxDQUFDLFFBQVE7WUFDL0IsV0FBVyxFQUFFLHdD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cHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IExpY2Vuc2VXZWJwYWNrUGx1Z2luIH0gZnJvbSAnbGljZW5zZS13ZWJwYWNrLXBsdWdpbic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgSW5kZXhIdG1sV2VicGFja1BsdWdpbiB9IGZyb20gJy4uLy4uL3BsdWdpbnMvaW5kZXgtaHRtbC13ZWJwYWNrLXBsdWdpbic7XG5pbXBvcnQgeyBnZW5lcmF0ZUVudHJ5UG9pbnRzIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL3BhY2thZ2UtY2h1bmstc29ydCc7XG5pbXBvcnQgeyBXZWJwYWNrQ29uZmlnT3B0aW9ucyB9IGZyb20gJy4uL2J1aWxkLW9wdGlvbnMnO1xuaW1wb3J0IHsgbm9ybWFsaXplRXh0cmFFbnRyeVBvaW50cyB9IGZyb20gJy4vdXRpbHMnO1xuXG5jb25zdCBTdWJyZXNvdXJjZUludGVncml0eVBsdWdpbiA9IHJlcXVpcmUoJ3dlYnBhY2stc3VicmVzb3VyY2UtaW50ZWdyaXR5Jyk7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJyb3dzZXJDb25maWcod2NvOiBXZWJwYWNrQ29uZmlnT3B0aW9ucykge1xuICBjb25zdCB7IHJvb3QsIGJ1aWxkT3B0aW9ucyB9ID0gd2NvO1xuICBjb25zdCBleHRyYVBsdWdpbnMgPSBbXTtcblxuICBsZXQgc291cmNlbWFwczogc3RyaW5nIHwgZmFsc2UgPSBmYWxzZTtcbiAgaWYgKGJ1aWxkT3B0aW9ucy5zb3VyY2VNYXApIHtcbiAgICAvLyBTZWUgaHR0cHM6Ly93ZWJwYWNrLmpzLm9yZy9jb25maWd1cmF0aW9uL2RldnRvb2wvIGZvciBzb3VyY2VtYXAgdHlwZXMuXG4gICAgaWYgKGJ1aWxkT3B0aW9ucy5ldmFsU291cmNlTWFwICYmICFidWlsZE9wdGlvbnMub3B0aW1pemF0aW9uKSB7XG4gICAgICAvLyBQcm9kdWNlIGV2YWwgc291cmNlbWFwcyBmb3IgZGV2ZWxvcG1lbnQgd2l0aCBzZXJ2ZSwgd2hpY2ggYXJlIGZhc3Rlci5cbiAgICAgIHNvdXJjZW1hcHMgPSAnZXZhbCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFByb2R1Y2UgZnVsbCBzZXBhcmF0ZSBzb3VyY2VtYXBzIGZvciBwcm9kdWN0aW9uLlxuICAgICAgc291cmNlbWFwcyA9ICdzb3VyY2UtbWFwJztcbiAgICB9XG4gIH1cblxuICBpZiAoYnVpbGRPcHRpb25zLmluZGV4KSB7XG4gICAgZXh0cmFQbHVnaW5zLnB1c2gobmV3IEluZGV4SHRtbFdlYnBhY2tQbHVnaW4oe1xuICAgICAgaW5wdXQ6IHBhdGgucmVzb2x2ZShyb290LCBidWlsZE9wdGlvbnMuaW5kZXgpLFxuICAgICAgb3V0cHV0OiBwYXRoLmJhc2VuYW1lKGJ1aWxkT3B0aW9ucy5pbmRleCksXG4gICAgICBiYXNlSHJlZjogYnVpbGRPcHRpb25zLmJhc2VIcmVmLFxuICAgICAgZW50cnlwb2ludHM6IGdlbmVyYXRlRW50cnlQb2ludHMoYnVpbGRPcHRpb25zKSxcbiAgICAgIGRlcGxveVVybDogYnVpbGRPcHRpb25zLmRlcGxveVVybCxcbiAgICAgIHNyaTogYnVpbGRPcHRpb25zLnN1YnJlc291cmNlSW50ZWdyaXR5LFxuICAgIH0pKTtcbiAgfVxuXG4gIGlmIChidWlsZE9wdGlvbnMuc3VicmVzb3VyY2VJbnRlZ3JpdHkpIHtcbiAgICBleHRyYVBsdWdpbnMucHVzaChuZXcgU3VicmVzb3VyY2VJbnRlZ3JpdHlQbHVnaW4oe1xuICAgICAgaGFzaEZ1bmNOYW1lczogWydzaGEzODQnXSxcbiAgICB9KSk7XG4gIH1cblxuICBpZiAoYnVpbGRPcHRpb25zLmV4dHJhY3RMaWNlbnNlcykge1xuICAgIGV4dHJhUGx1Z2lucy5wdXNoKG5ldyBMaWNlbnNlV2VicGFja1BsdWdpbih7XG4gICAgICBzdGF0czoge1xuICAgICAgICB3YXJuaW5nczogZmFsc2UsXG4gICAgICAgIGVycm9yczogZmFsc2UsXG4gICAgICB9LFxuICAgICAgcGVyQ2h1bmtPdXRwdXQ6IGZhbHNlLFxuICAgICAgb3V0cHV0RmlsZW5hbWU6IGAzcmRwYXJ0eWxpY2Vuc2VzLnR4dGAsXG4gICAgfSkpO1xuICB9XG5cbiAgY29uc3QgZ2xvYmFsU3R5bGVzQnVuZGxlTmFtZXMgPSBub3JtYWxpemVFeHRyYUVudHJ5UG9pbnRzKGJ1aWxkT3B0aW9ucy5zdHlsZXMsICdzdHlsZXMnKVxuICAgIC5tYXAoc3R5bGUgPT4gc3R5bGUuYnVuZGxlTmFtZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBkZXZ0b29sOiBzb3VyY2VtYXBzLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIG1haW5GaWVsZHM6IFtcbiAgICAgICAgLi4uKHdjby5zdXBwb3J0RVMyMDE1ID8gWydlczIwMTUnXSA6IFtdKSxcbiAgICAgICAgJ2Jyb3dzZXInLCAnbW9kdWxlJywgJ21haW4nLFxuICAgICAgXSxcbiAgICB9LFxuICAgIG91dHB1dDoge1xuICAgICAgY3Jvc3NPcmlnaW5Mb2FkaW5nOiBidWlsZE9wdGlvbnMuc3VicmVzb3VyY2VJbnRlZ3JpdHkgPyAnYW5vbnltb3VzJyA6IGZhbHNlLFxuICAgIH0sXG4gICAgb3B0aW1pemF0aW9uOiB7XG4gICAgICBydW50aW1lQ2h1bms6ICdzaW5nbGUnLFxuICAgICAgc3BsaXRDaHVua3M6IHtcbiAgICAgICAgbWF4QXN5bmNSZXF1ZXN0czogSW5maW5pdHksXG4gICAgICAgIGNhY2hlR3JvdXBzOiB7XG4gICAgICAgICAgZGVmYXVsdDogYnVpbGRPcHRpb25zLmNvbW1vbkNodW5rICYmIHtcbiAgICAgICAgICAgIGNodW5rczogJ2FzeW5jJyxcbiAgICAgICAgICAgIG1pbkNodW5rczogMixcbiAgICAgICAgICAgIHByaW9yaXR5OiAxMCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbW1vbjogYnVpbGRPcHRpb25zLmNvbW1vbkNodW5rICYmIHtcbiAgICAgICAgICAgIG5hbWU6ICdjb21tb24nLFxuICAgICAgICAgICAgY2h1bmtzOiAnYXN5bmMnLFxuICAgICAgICAgICAgbWluQ2h1bmtzOiAyLFxuICAgICAgICAgICAgZW5mb3JjZTogdHJ1ZSxcbiAgICAgICAgICAgIHByaW9yaXR5OiA1LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdmVuZG9yczogZmFsc2UsXG4gICAgICAgICAgdmVuZG9yOiBidWlsZE9wdGlvbnMudmVuZG9yQ2h1bmsgJiYge1xuICAgICAgICAgICAgbmFtZTogJ3ZlbmRvcicsXG4gICAgICAgICAgICBjaHVua3M6ICdpbml0aWFsJyxcbiAgICAgICAgICAgIGVuZm9yY2U6IHRydWUsXG4gICAgICAgICAgICB0ZXN0OiAobW9kdWxlOiB7IG5hbWVGb3JDb25kaXRpb24/OiBGdW5jdGlvbiB9LCBjaHVua3M6IEFycmF5PHsgbmFtZTogc3RyaW5nIH0+KSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSBtb2R1bGUubmFtZUZvckNvbmRpdGlvbiA/IG1vZHVsZS5uYW1lRm9yQ29uZGl0aW9uKCkgOiAnJztcblxuICAgICAgICAgICAgICByZXR1cm4gL1tcXFxcL11ub2RlX21vZHVsZXNbXFxcXC9dLy50ZXN0KG1vZHVsZU5hbWUpXG4gICAgICAgICAgICAgICAgJiYgIWNodW5rcy5zb21lKCh7IG5hbWUgfSkgPT4gbmFtZSA9PT0gJ3BvbHlmaWxscydcbiAgICAgICAgICAgICAgICAgIHx8IGdsb2JhbFN0eWxlc0J1bmRsZU5hbWVzLmluY2x1ZGVzKG5hbWUpKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBleHRyYVBsdWdpbnMsXG4gICAgbm9kZTogZmFsc2UsXG4gIH07XG59XG4iXX0=